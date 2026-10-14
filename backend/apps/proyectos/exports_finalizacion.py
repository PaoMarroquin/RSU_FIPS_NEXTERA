"""
PDF del Informe de Finalización y de la Constancia de Finalización (HU-09).

Reciben lo que arma services_finalizacion y devuelven un BytesIO listo para
un FileResponse, igual que exports_consolidado.

El formato de la constancia es provisional: el cliente todavía no entregó el
oficial. Cuando lo haga, solo cambia exportar_constancia_pdf().

Conecta con:
- apps/proyectos/services_finalizacion.py: origen de los datos.
- apps/proyectos/views_finalizacion.py: vistas de descarga.
"""
import io
import os

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

AZUL = colors.HexColor('#1F4E79')
GRIS = colors.HexColor('#F2F2F2')


def _estilos():
    base = getSampleStyleSheet()
    return {
        'titulo': ParagraphStyle('t', parent=base['Title'], fontSize=15, textColor=AZUL),
        'seccion': ParagraphStyle('s', parent=base['Heading2'], fontSize=11,
                                  textColor=AZUL, spaceBefore=10, spaceAfter=4),
        'normal': ParagraphStyle('n', parent=base['Normal'], fontSize=9, leading=12),
        'celda': ParagraphStyle('c', parent=base['Normal'], fontSize=8, leading=10),
        'centro': ParagraphStyle('ce', parent=base['Normal'], fontSize=12, leading=18,
                                 alignment=1),
    }


def _tabla(filas, anchos):
    tabla = Table(filas, colWidths=anchos, repeatRows=1)
    tabla.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#BFBFBF')),
        ('BACKGROUND', (0, 0), (-1, 0), AZUL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, GRIS]),
    ]))
    return tabla


def _texto(valor):
    return (valor or '').strip() or '—'


TIPOS_ACTIVIDAD = [
    ('programas_formativos', 'Programas formativos (no charlas o capacitaciones aisladas)'),
    ('acompanamiento', 'Acompañamiento a sectores identificados'),
    ('asesoria', 'Asesoría'),
    ('acercamiento_comunidad', 'Iniciativas de acercamiento a la comunidad (responde a un programa)'),
    ('otro', 'Otros'),
]
EXTENSIONES_IMAGEN = ('.jpg', '.jpeg', '.png')


def _cantidad(valor):
    if valor is None:
        return '—'
    return f'{valor:.0f}' if float(valor).is_integer() else f'{valor:.2f}'


def _marca(elegido):
    return '(X)' if elegido else '(&nbsp;&nbsp;&nbsp;)'


def _imagen_evidencia(ev, ancho_max):
    from reportlab.lib.utils import ImageReader
    from reportlab.platypus import Image
    if not ev.archivo or not ev.archivo.name.lower().endswith(EXTENSIONES_IMAGEN):
        return None
    try:
        ev.archivo.open('rb')
        contenido = io.BytesIO(ev.archivo.read())
        ev.archivo.close()
        ancho, alto = ImageReader(contenido).getSize()
    except Exception:
        return None
    contenido.seek(0)
    escala = min(ancho_max / ancho, (60 * mm) / alto, 1)
    return Image(contenido, width=ancho * escala, height=alto * escala)


FUENTES_DIR = os.path.join(os.path.dirname(__file__), 'recursos', 'fuentes')
CARLITO, CARLITO_B = 'Carlito', 'Carlito-Bold'


def _registrar_carlito():
    """Carlito: libre (SIL OFL) y con las mismas medidas que Calibri, la letra del formato."""
    from reportlab.lib.fonts import addMapping
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    if CARLITO in pdfmetrics.getRegisteredFontNames():
        return
    pdfmetrics.registerFont(TTFont(CARLITO, os.path.join(FUENTES_DIR, 'Carlito-Regular.ttf')))
    pdfmetrics.registerFont(TTFont(CARLITO_B, os.path.join(FUENTES_DIR, 'Carlito-Bold.ttf')))
    addMapping(CARLITO, 0, 0, CARLITO)
    addMapping(CARLITO, 1, 0, CARLITO_B)
    addMapping(CARLITO, 0, 1, CARLITO)
    addMapping(CARLITO, 1, 1, CARLITO_B)


LOGO_UNSA = os.path.join(os.path.dirname(__file__), 'recursos', 'logo_unsa.jpeg')
TWIP = 1 / 20  # puntos


def _dibujar_encabezado_ours(c, pagina, total):
    """Encabezado del formato DS-PM03.02-01 (medidas tomadas del Word oficial)."""
    anchos = [2472 * TWIP, 4191 * TWIP, 998 * TWIP, 1834 * TWIP]
    alto_fila = 341 * TWIP
    ancho_total = sum(anchos)
    ancho_pag, alto_pag = A4
    x0 = (ancho_pag - ancho_total) / 2
    y_top = alto_pag - 708 * TWIP
    y_bot = y_top - 3 * alto_fila
    xs = [x0]
    for a in anchos:
        xs.append(xs[-1] + a)

    c.saveState()
    c.setLineWidth(0.5)
    c.setStrokeColor(colors.black)
    c.rect(x0, y_bot, ancho_total, 3 * alto_fila)
    for x in xs[1:-1]:
        c.line(x, y_bot, x, y_top)
    # filas: la columna del logo no se divide; la del título solo bajo "FORMATO"
    c.line(xs[1], y_top - alto_fila, xs[4], y_top - alto_fila)
    c.line(xs[2], y_top - 2 * alto_fila, xs[4], y_top - 2 * alto_fila)

    try:
        logo_w, logo_h = 985301 / 12700, 361666 / 12700  # EMU a puntos
        c.drawImage(LOGO_UNSA, xs[0] + (anchos[0] - logo_w) / 2, y_bot + (3 * alto_fila - logo_h) / 2,
                    width=logo_w, height=logo_h, preserveAspectRatio=True, mask='auto')
    except Exception:
        pass

    def texto(x, y_fila_sup, alto, contenido, negrita=False, tam=12, ancho=None):
        c.setFont(CARLITO_B if negrita else CARLITO, tam)
        if ancho:
            from reportlab.platypus import Paragraph
            estilo = ParagraphStyle('enc', fontName=CARLITO_B if negrita else CARLITO,
                                    fontSize=tam, leading=tam * 1.15)
            par = Paragraph(contenido, estilo)
            _, h = par.wrap(ancho - 6, alto)
            par.drawOn(c, x + 3, y_fila_sup - (alto + h) / 2)
        else:
            c.drawString(x + 3, y_fila_sup - (alto + tam * 0.7) / 2, contenido)

    texto(xs[1], y_top, alto_fila, 'FORMATO', negrita=True)
    texto(xs[1], y_top - alto_fila, 2 * alto_fila,
          'INFORME DE EJECUCION DE ACTIVIDADES VINCULADAS A RSU', negrita=True, ancho=anchos[1])
    texto(xs[2], y_top, alto_fila, 'Código', negrita=True)
    texto(xs[2], y_top - alto_fila, alto_fila, 'Versión', negrita=True)
    texto(xs[2], y_top - 2 * alto_fila, alto_fila, 'Página', negrita=True)
    texto(xs[3], y_top, alto_fila, 'DS-PM03.02-01', tam=11)
    texto(xs[3], y_top - alto_fila, alto_fila, '1.0')
    texto(xs[3], y_top - 2 * alto_fila, alto_fila, f'Página {pagina} de {total}', negrita=True, tam=10)
    c.restoreState()


def _canvas_con_encabezado_ours():
    from reportlab.pdfgen import canvas

    class CanvasNumerado(canvas.Canvas):
        """Dibuja el encabezado en cada página con el total de páginas."""

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._paginas = []

        def showPage(self):
            self._paginas.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            total = len(self._paginas)
            for i, estado in enumerate(self._paginas, 1):
                self.__dict__.update(estado)
                _dibujar_encabezado_ours(self, i, total)
                super().showPage()
            super().save()

    return CanvasNumerado


def exportar_informe_finalizacion_pdf(datos, proyecto):
    """Informe de Ejecución con la estructura del formato oficial OURS."""
    from xml.sax.saxutils import escape

    from apps.planificacion.models import EjeRSU
    from .models import EvidenciaAvance, TipoBeneficiario

    _registrar_carlito()
    salida = io.BytesIO()
    # Márgenes del Word oficial: 3 cm a los lados, 3 cm arriba (con encabezado) y 2.5 cm abajo.
    doc = SimpleDocTemplate(salida, pagesize=A4, leftMargin=1701 * TWIP, rightMargin=1701 * TWIP,
                            topMargin=1702 * TWIP + 18, bottomMargin=1417 * TWIP,
                            title='Informe de Ejecución de Proyecto RSU')
    base = getSampleStyleSheet()
    titulo = ParagraphStyle('ti', parent=base['Normal'], fontName=CARLITO_B, fontSize=12,
                            alignment=1, leading=15)
    subtitulo = ParagraphStyle('st', parent=base['Normal'], fontName=CARLITO_B, fontSize=10,
                               alignment=1, spaceAfter=10)
    seccion = ParagraphStyle('se', parent=base['Normal'], fontName=CARLITO_B, fontSize=10.5,
                             spaceBefore=10, spaceAfter=4)
    pregunta = ParagraphStyle('pr', parent=base['Normal'], fontName=CARLITO_B, fontSize=9,
                              leading=12, leftIndent=12, spaceBefore=3, textColor=AZUL)
    normal = ParagraphStyle('no', parent=base['Normal'], fontName=CARLITO, fontSize=9, leading=12, leftIndent=12)
    cuerpo = ParagraphStyle('cu', parent=base['Normal'], fontName=CARLITO, fontSize=9.5, leading=13, alignment=4)
    celda = ParagraphStyle('ce', parent=base['Normal'], fontName=CARLITO, fontSize=8.5, leading=11)
    cabeza = ParagraphStyle('ca', parent=celda, fontName=CARLITO_B, alignment=1)
    centro = ParagraphStyle('cn', parent=base['Normal'], fontName=CARLITO, fontSize=9.5, leading=13, alignment=1)

    inf = datos['informe_final']
    ancho = doc.width

    def t(valor):
        return escape(_texto(valor))

    def tabla(filas, anchos, cabeceras=(0,)):
        tb = Table(filas, colWidths=anchos)
        estilo = [('GRID', (0, 0), (-1, -1), 0.6, colors.black), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                  ('FONTNAME', (0, 0), (-1, -1), CARLITO), ('FONTSIZE', (0, 0), (-1, -1), 9)]
        for f in cabeceras:
            estilo.append(('BACKGROUND', (0, f), (-1, f), GRIS))
        tb.setStyle(TableStyle(estilo))
        return tb

    def fecha(valor):
        return valor.strftime('%d/%m/%Y') if valor else '—'

    docente = proyecto.docente_responsable
    nombre_docente = f'{docente.nombres} {docente.apellidos}'.strip()
    depto = proyecto.departamento.nombre if proyecto.departamento else '—'
    informe = getattr(proyecto, 'informe_finalizacion', None)
    fecha_informe = timezone.localtime(informe.fecha_envio).date() if informe and informe.fecha_envio \
        else timezone.localdate()

    # ── Encabezado ──
    el = [
        Paragraph('INFORME DE EJECUCIÓN PROYECTO DE RESPONSABILIDAD SOCIAL UNIVERSITARIA', titulo),
        Paragraph('(FORMATO OURS)', subtitulo),
        tabla([
            [Paragraph('<b>A:</b>', celda), Paragraph(escape(f'Director del {depto}'), celda)],
            [Paragraph('<b>DE:</b>', celda), Paragraph(escape(f'{nombre_docente}, docente adscrito al {depto}'), celda)],
            [Paragraph('<b>ASUNTO:</b>', celda),
             Paragraph(escape(f'INFORME DE RESPONSABILIDAD SOCIAL NRO. {proyecto.codigo or "—"}'), celda)],
            [Paragraph('<b>FECHA:</b>', celda), Paragraph(fecha(fecha_informe), celda)],
        ], [25 * mm, ancho - 25 * mm], cabeceras=()),
        Spacer(1, 6),
        Paragraph('Me dirijo a usted para saludarlo y en cumplimiento al criterio de estandarización conforme '
                  'al SGC, se presenta el formato de Informe de Proyecto de Responsabilidad Social.', cuerpo),
        Paragraph('I. DATOS GENERALES', seccion),
    ]

    # ── 1.1 a 1.8 ──
    asignaturas = ', '.join(a.nombre_asignatura for a in proyecto.asignaturas.all()) or '—'
    filas = [
        ['1.1', 'Facultad', proyecto.facultad.nombre if proyecto.facultad else '—'],
        ['1.2', 'Escuela Profesional', proyecto.escuela.nombre if proyecto.escuela else '—'],
        ['1.3', 'Departamento Académico', depto],
        ['1.4', 'Semestre', proyecto.semestre_academico or (proyecto.periodo.nombre if proyecto.periodo else '—')],
        ['1.5', 'Asignatura (s)', asignaturas],
        ['1.6', 'Título del proyecto', proyecto.titulo],
        ['1.7', 'Nro. de docentes que participaron', str(proyecto.nro_docentes or 0)],
        ['1.8', 'Nro. de estudiantes universitarios que participaron', str(proyecto.nro_estudiantes or 0)],
    ]
    el.append(tabla([[Paragraph(n, celda), Paragraph(f'<b>{escape(k)}</b>', celda), Paragraph(escape(v), celda)]
                     for n, k, v in filas], [12 * mm, 60 * mm, ancho - 72 * mm], cabeceras=()))

    # ── 1.9 Beneficiarios ──
    elegidos = set(proyecto.beneficiarios.values_list('id', flat=True))
    lineas = []
    for tb in TipoBeneficiario.objects.order_by('orden', 'id'):
        texto = f'{_marca(tb.id in elegidos)} {escape(tb.label)}'
        if tb.codigo == 'otro' and tb.id in elegidos and proyecto.benef_otro_detalle:
            texto += f': {escape(proyecto.benef_otro_detalle)}'
        lineas.append(texto)
    otro_marcado = proyecto.beneficiarios.filter(codigo='otro').exists()
    if proyecto.benef_otro_detalle and not otro_marcado:
        lineas.append(f'<b>Detalle:</b> {escape(proyecto.benef_otro_detalle)}')
    el.append(tabla([[Paragraph('1.9', celda), Paragraph(
        '<b>Beneficiarios o destinatarios</b><br/>' + '<br/>'.join(lineas), celda)]],
        [12 * mm, ancho - 12 * mm], cabeceras=()))

    # ── 1.10 Tipo de eje ──
    ejes_elegidos = set(proyecto.ejes_rsu.values_list('id', flat=True))
    subitems = {ps.sub_eje_id: ps.detalle for ps in proyecto.ejes_subitems.all()}
    bloques = []
    for eje in EjeRSU.objects.order_by('id').prefetch_related('subitems'):
        texto = f'{_marca(eje.id in ejes_elegidos)} <b>{escape(eje.nombre.upper())}</b>'
        if eje.nombre == 'Otros' and proyecto.eje_detalle:
            texto += f': {escape(proyecto.eje_detalle)}'
        for si in sorted(eje.subitems.all(), key=lambda x: x.orden):
            marca = _marca(si.id in subitems)
            detalle = f' — {escape(subitems[si.id])}' if subitems.get(si.id) else ''
            texto += f'<br/>&nbsp;&nbsp;&nbsp;&nbsp;{marca} {escape(si.nombre)}{detalle}'
        bloques.append(texto)
    el.append(tabla([[Paragraph('1.10', celda), Paragraph(
        '<b>Tipo de eje</b><br/>' + '<br/>'.join(bloques), celda)]], [12 * mm, ancho - 12 * mm], cabeceras=()))

    # ── 1.11 Tipo de actividad ──
    tipos = set(proyecto.tipo_actividad or [])
    lineas = []
    for clave, etiqueta in TIPOS_ACTIVIDAD:
        texto = f'{_marca(clave in tipos)} {escape(etiqueta)}'
        if clave == 'otro' and proyecto.tipo_actividad_otro:
            texto += f': {escape(proyecto.tipo_actividad_otro)}'
        lineas.append(texto)
    el.append(tabla([[Paragraph('1.11', celda), Paragraph(
        '<b>Tipo de actividad</b><br/>' + '<br/>'.join(lineas), celda)]], [12 * mm, ancho - 12 * mm], cabeceras=()))

    # ── 1.12 a 1.18 ──
    metas = list(proyecto.metas_indicadores.order_by('orden', 'id'))
    meta_txt = '<br/>'.join(
        escape(f'{m.meta_descripcion}: {_cantidad(m.valor_meta)} {m.unidad_medida or ""}'.strip()) for m in metas) or '—'
    indicador_txt = '<br/>'.join(escape(m.indicador_nombre or '—') for m in metas) or '—'
    encuestas = (f'Docentes: {fecha(proyecto.fecha_encuesta_docentes)}<br/>'
                 f'Alumnos: {fecha(proyecto.fecha_encuesta_alumnos)}<br/>'
                 f'Grupo destinatario: {fecha(proyecto.fecha_encuesta_grupo_destinatario)}')
    filas = [
        ['1.12', 'Meta', meta_txt],
        ['1.13', 'Indicador', indicador_txt],
        ['1.14', 'Fecha de inicio', fecha(proyecto.fecha_inicio)],
        ['1.15', 'Fecha de evaluación de avance', fecha(proyecto.fecha_evaluacion_avance)],
        ['1.16', 'Fecha de término', fecha(proyecto.fecha_termino)],
        ['1.17', 'Fecha de aplicación de encuesta de evaluación de intervención', encuestas],
        ['1.18', 'Lugar de ejecución', escape(proyecto.lugar_ejecucion or '—')],
    ]
    el.append(tabla([[Paragraph(n, celda), Paragraph(f'<b>{escape(k)}</b>', celda), Paragraph(v, celda)]
                     for n, k, v in filas], [12 * mm, 60 * mm, ancho - 72 * mm], cabeceras=()))

    # ── II a VI ──
    el += [
        Paragraph('II. FORTALEZAS Y LIMITACIONES', seccion),
        tabla([
            [Paragraph('Fortalezas', cabeza), Paragraph('Oportunidades', cabeza), Paragraph('Principales aliados', cabeza)],
            [Paragraph(t(inf.get('fortalezas')), celda), Paragraph(t(inf.get('oportunidades')), celda),
             Paragraph(t(inf.get('aliados')), celda)],
            [Paragraph('Debilidades', cabeza), Paragraph('Amenazas', cabeza),
             Paragraph('Estrategias empleadas para superar limitaciones', cabeza)],
            [Paragraph(t(inf.get('debilidades')), celda), Paragraph(t(inf.get('amenazas')), celda),
             Paragraph(t(inf.get('estrategias')), celda)],
        ], [ancho / 3] * 3, cabeceras=(0, 2)),
        Paragraph('III. RESULTADOS', seccion),
        Paragraph('Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas '
                  'dentro del proceso enseñanza-aprendizaje, ¿qué logros o cambios se lograron obtener en el '
                  'grupo destinatario?', pregunta),
        Paragraph(t(inf.get('resultado_grupo_destinatario')), normal),
        Paragraph('Tras la aplicación de los cambios efectuados con las sugerencias y/o propuestas realizadas '
                  'dentro del proceso enseñanza-aprendizaje, ¿qué logros o cambios se lograron obtener en el '
                  'desarrollo curricular?', pregunta),
        Paragraph(t(inf.get('resultado_desarrollo_curricular')), normal),
        Paragraph('IV. LECCIONES APRENDIDAS', seccion),
        Paragraph('Análisis de las acciones realizadas, en relación a los obstáculos y fortalezas', pregunta),
        Paragraph(t(inf.get('lecciones_analisis')), normal),
        Paragraph('Breves reflexiones sobre la experiencia vivida, docentes, alumnos, administrativos, '
                  'grupo beneficiario', pregunta),
        Paragraph(t(inf.get('lecciones_reflexiones')), normal),
        Paragraph('V. CONCLUSIONES', seccion),
        Paragraph(t(inf.get('conclusiones')), normal),
        Paragraph('VI. RECOMENDACIONES', seccion),
        Paragraph(t(inf.get('recomendaciones')), normal),
        Paragraph('VII. CRONOLOGÍA DE LAS ACTIVIDADES', seccion),
    ]

    # ── VII ──
    filas = [[Paragraph('ACCIONES', cabeza), Paragraph('CRONOGRAMA DE ACCIONES', cabeza)]]
    for act in datos['ejecucion']['actividades']:
        for ac in act['acciones']:
            filas.append([
                Paragraph(escape(f"{act['nombre']}: {ac['descripcion'] or ''}"), celda),
                Paragraph(escape(f"{ac['fecha_inicio'] or '—'} al {ac['fecha_fin'] or '—'}"), celda),
            ])
    if len(filas) == 1:
        filas.append([Paragraph('—', celda), Paragraph('—', celda)])
    el.append(tabla(filas, [ancho * 0.6, ancho * 0.4]))

    # ── VIII y IX ──
    rec = datos.get('recursos') or {'humanos': {}, 'materiales': {}}
    hum, mat = rec['humanos'], rec['materiales']
    el += [
        Paragraph('VIII. RECURSOS', seccion),
        Paragraph('<b>Humanos</b>', normal),
        Paragraph(escape(
            f"Docentes: {hum.get('docentes', 0)} · Administrativos: {hum.get('administrativos', 0)} · "
            f"Estudiantes: {hum.get('estudiantes', 0)} · Egresados: {hum.get('egresados', 0)} · "
            f"Voluntarios: {hum.get('voluntarios', 0)} · Otros: {hum.get('otros', 0)}"), normal),
        Paragraph('<b>Materiales</b>', normal),
        Paragraph(escape(
            f"Material didáctico: {_texto(mat.get('material_didactico'))} · Afiches: {_texto(mat.get('afiches'))} · "
            f"Equipos: {_texto(mat.get('equipos'))} · Útiles: {_texto(mat.get('utiles'))} · "
            f"Otros: {_texto(mat.get('otros'))}"), normal),
        Paragraph('IX. FINANCIAMIENTO: Monto propuesto / monto ejecutado', seccion),
    ]
    filas = [[Paragraph('Partida', cabeza), Paragraph('Monto propuesto S/', cabeza),
              Paragraph('Monto ejecutado S/', cabeza)]]
    total_p = total_e = 0
    for pa in datos['presupuesto_detalle']:
        total_p += pa['monto_presupuestado']
        total_e += pa['monto_ejecutado']
        filas.append([Paragraph(escape(pa['descripcion'] or pa['categoria'] or '—'), celda),
                      f"{pa['monto_presupuestado']:.2f}", f"{pa['monto_ejecutado']:.2f}"])
    filas.append([Paragraph('<b>Total</b>', celda), f'{total_p:.2f}', f'{total_e:.2f}'])
    el.append(tabla(filas, [ancho * 0.5, ancho * 0.25, ancho * 0.25]))

    # ── X Medio de difusión ──
    el += [Paragraph('X. MEDIO DE DIFUSIÓN', seccion),
           tabla([[Paragraph(t(inf.get('medio_difusion')), celda)]], [ancho], cabeceras=())]

    # ── XI Evidencias (lo que el docente subió en cada actividad) ──
    el.append(Paragraph('XI. EVIDENCIAS', seccion))
    filas = [[Paragraph('Actividad', cabeza), Paragraph('Evidencia', cabeza), Paragraph('Enlace o archivo', cabeza)]]
    imagenes = []
    for act in datos['ejecucion']['actividades']:
        for ev in act['evidencias']:
            url = ev.get('url') or '—'
            filas.append([Paragraph(escape(act['nombre']), celda),
                          Paragraph(escape(ev.get('nombre') or ev.get('tipo') or '—'), celda),
                          Paragraph(f'<link href="{escape(url)}" color="blue">{escape(url)}</link>'
                                    if url != '—' else '—', celda)])
            obj = EvidenciaAvance.objects.filter(pk=ev['id']).first()
            img = _imagen_evidencia(obj, ancho / 2 - 6 * mm) if obj else None
            if img:
                imagenes.append((f"{act['nombre']}: {ev.get('nombre') or ''}", img))
    if len(filas) == 1:
        filas.append([Paragraph('—', celda), Paragraph('—', celda), Paragraph('—', celda)])
    el.append(tabla(filas, [ancho * 0.3, ancho * 0.25, ancho * 0.45]))
    if imagenes:
        el.append(Spacer(1, 6))
        celdas = [[img, Paragraph(escape(nombre), centro)] for nombre, img in imagenes]
        filas = []
        for i in range(0, len(celdas), 2):
            par = celdas[i:i + 2]
            filas.append([c[0] for c in par] + [''] * (2 - len(par)))
            filas.append([c[1] for c in par] + [''] * (2 - len(par)))
        galeria = Table(filas, colWidths=[ancho / 2] * 2)
        galeria.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                     ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
        el.append(galeria)

    # ── Firma ──
    el += [
        Spacer(1, 18),
        Paragraph(f'Arequipa, {fecha_informe.day} de {MESES[fecha_informe.month - 1]} de {fecha_informe.year}', centro),
    ]
    firma = _imagen_firma(docente.firma_digital, 45) if docente.firma_digital else None
    if firma:
        firma.hAlign = 'CENTER'
        el += [Spacer(1, 8), firma]
    else:
        el.append(Spacer(1, 30))
    el += [
        Paragraph('__________________________________', centro),
        Paragraph(escape(nombre_docente), centro),
        Paragraph('Docente adscrito', centro),
        Paragraph(escape(depto), centro),
    ]

    doc.build(el, canvasmaker=_canvas_con_encabezado_ours())
    salida.seek(0)
    return salida


def _num(valor):
    return '—' if valor is None else f'{valor:g}'


MESES = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre')


def _fecha_larga(fecha):
    return f'{fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}' if fecha else '—'


def _enumerar(nombres):
    nombres = [n for n in nombres if n]
    if len(nombres) <= 1:
        return ''.join(nombres)
    return f'{", ".join(nombres[:-1])} y {nombres[-1]}'


def _nombre_departamento(departamento):
    """Nombre completo, sin repetir 'Departamento' si ya viene en el dato."""
    if not departamento:
        return '—'
    nombre = departamento.nombre.strip()
    if nombre.lower().startswith('departamento'):
        return nombre
    return f'Departamento Académico de {nombre}'


def _fecha_fin_real(proyecto):
    """Fecha de término planificada, o la de la última actividad completada si fue después."""
    ultima = (proyecto.avances.filter(estado_actividad='completada')
              .order_by('-created_at').values_list('created_at', flat=True).first())
    fin = proyecto.fecha_termino
    if ultima:
        ultima = timezone.localtime(ultima).date()
        if fin is None or ultima > fin:
            return ultima
    return fin


def datos_constancia(proyecto, informe, firmante):
    """Valores que reemplazan los corchetes de la plantilla oficial de la constancia."""
    docente = proyecto.docente_responsable
    ods = sorted(proyecto.ods.values_list('numero', flat=True))
    beneficiarios = (proyecto.benef_otro_detalle or '').strip() or _enumerar(
        [str(b) for b in proyecto.beneficiarios.all()])
    aprobada_en = informe.constancia_aprobada_en if informe else None
    detalle_otros = (proyecto.eje_detalle or '').strip()
    ejes = [detalle_otros if e == 'Otros' and detalle_otros else e
            for e in proyecto.ejes_rsu.order_by('id').values_list('nombre', flat=True)]
    participantes = [n for n in (proyecto.docentes_participantes or []) if n]
    return {
        'departamento': _nombre_departamento(proyecto.departamento),
        'numero': proyecto.codigo or '—',
        'facultad': proyecto.facultad.nombre if proyecto.facultad else '—',
        'titulo': proyecto.titulo,
        'docente': f'{docente.nombres} {docente.apellidos}'.strip(),
        'participantes': _enumerar(participantes),
        'n_participantes': len(participantes),
        'fecha_inicio': _fecha_larga(proyecto.fecha_inicio),
        'fecha_fin': _fecha_larga(_fecha_fin_real(proyecto)),
        'ejes': _enumerar(ejes) or '—',
        'n_ejes': len(ejes),
        'ods': _enumerar([f'ODS {n}' for n in ods]),
        'beneficiarios': beneficiarios or '—',
        'fecha_documento': timezone.localtime(aprobada_en or timezone.now()).date(),
        'firmante': f'{firmante.nombres} {firmante.apellidos}'.strip() if firmante else '',
        'firma': firmante.firma_digital if firmante and firmante.firma_digital else None,
    }


def _imagen_firma(firma, alto_max):
    from reportlab.lib.utils import ImageReader
    from reportlab.platypus import Image
    try:
        firma.open('rb')
        contenido = io.BytesIO(firma.read())
        firma.close()
        ancho, alto = ImageReader(contenido).getSize()
    except Exception:
        return None
    contenido.seek(0)
    escala = min(alto_max / alto, 180 / ancho)
    return Image(contenido, width=ancho * escala, height=alto * escala)


def exportar_constancia_pdf(proyecto, informe, firmante=None):
    """Constancia con el formato oficial (Times New Roman, carta, márgenes de 2.54 cm)."""
    from xml.sax.saxutils import escape
    from reportlab.lib.pagesizes import letter

    d = {k: escape(v) if isinstance(v, str) else v
         for k, v in datos_constancia(proyecto, informe, firmante).items()}
    # Si un nombre largo agrega líneas, se acorta el espacio en blanco para
    # que la constancia quede siempre en una sola hoja, como la plantilla.
    for separacion in (30, 24, 18, 12, 6, 0):
        salida = io.BytesIO()
        doc = SimpleDocTemplate(salida, pagesize=letter, leftMargin=72, rightMargin=72,
                                topMargin=72, bottomMargin=72,
                                title='Constancia de Finalización de Proyecto RSU')
        doc.build(_elementos_constancia(d, separacion))
        if doc.page == 1:
            break
    salida.seek(0)
    return salida


def _elementos_constancia(d, separacion):
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

    def estilo(tam, alineacion=TA_LEFT, fuente='Times-Roman', despues=0, color=colors.black):
        return ParagraphStyle(f'c{tam}{alineacion}{fuente}{despues}', fontName=fuente, fontSize=tam,
                              leading=tam * 1.15, alignment=alineacion, spaceAfter=despues,
                              textColor=color)

    cuerpo = estilo(11, TA_JUSTIFY)
    if d['n_participantes'] > 1:
        participantes = f' con la participación de los docentes: <b>{d["participantes"]}.</b>'
    elif d['n_participantes'] == 1:
        participantes = f' con la participación del docente: <b>{d["participantes"]}.</b>'
    else:
        participantes = '.'
    eje = 'de los ejes RSU' if d['n_ejes'] > 1 else 'del eje RSU'
    ods = f' y alineado a los <b>{d["ods"]}</b>' if d['ods'] else ''
    fecha = d['fecha_documento']

    elementos = [
        Paragraph('UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA', estilo(14, TA_CENTER, 'Times-Bold')),
        Paragraph(f'{d["departamento"].upper()}<br/>COMITÉ DE RESPONSABILIDAD SOCIAL FIPS',
                  estilo(12, TA_CENTER, 'Times-Bold')),
        Paragraph('&nbsp;', estilo(10, despues=15)),
        Paragraph('CONSTANCIA DE FINALIZACIÓN DE PROYECTO RSU', estilo(16, TA_CENTER, 'Times-Bold')),
        Paragraph(f'N° {d["numero"]} ', estilo(16, TA_CENTER, 'Times-Italic')),
        Paragraph('&nbsp;', estilo(10, despues=15)),
        Paragraph(
            f'El director de <b>{d["departamento"]},</b> de la facultad de <b>{d["facultad"]}</b>,  '
            'de la Universidad Nacional de San Agustín de Arequipa certifica que el proyecto de '
            f'responsabilidad social denominado <b>"{d["titulo"]}"</b>, ejecutado bajo la '
            f'responsabilidad del/de la docente <b>{d["docente"]}</b>{participantes}', cuerpo),
        Paragraph('&nbsp;', estilo(11)),
        Paragraph(
            f'El proyecto se desarrolló durante el periodo comprendido entre el <b>{d["fecha_inicio"]}</b> '
            f'y el <b>{d["fecha_fin"]}</b>, en el marco {eje} <b>{d["ejes"]}</b>{ods}, logrando '
            f'beneficiar a <b>{d["beneficiarios"]}</b>.', cuerpo),
        Paragraph('&nbsp;', estilo(11)),
        Paragraph(
            'Asimismo, se deja constancia de que la iniciativa alcanzó el <b>100% de ejecución de sus '
            'actividades y presupuesto asignado</b>, habiendo cumplido con la entrega de todas las '
            'evidencias documentales y fotográficas requeridas. Tras la evaluación técnica de cierre '
            'realizada por la Dirección del Departamento Académico, el proyecto ha sido clasificado como '
            '<b>FINALIZADO</b> y registrado en el Repositorio Institucional de RSU.', cuerpo),
        Paragraph('&nbsp;', estilo(10)),
        Paragraph('Se expide la presente constancia a solicitud del docente responsable para los fines '
                  'que considere pertinentes.', estilo(11)),
        Paragraph('&nbsp;', estilo(11)),
        Paragraph('&nbsp;', estilo(11, TA_CENTER, despues=separacion)),
        Paragraph('&nbsp;', estilo(11, TA_CENTER, despues=separacion)),
        Paragraph('&nbsp;', estilo(11, TA_CENTER, despues=separacion)),
        Paragraph(f'Arequipa, {fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}',
                  estilo(11, TA_CENTER, despues=separacion)),
    ]

    # La firma ocupa el espacio del párrafo vacío (11 pt + 30 pt) previo a la línea.
    espacio_firma = 11 * 1.15 + separacion
    imagen = _imagen_firma(d['firma'], 50) if d['firma'] else None
    filas = []
    if imagen:
        filas.append([imagen])
        elementos.append(Spacer(1, max(espacio_firma - imagen.drawHeight, 0)))
    else:
        elementos.append(Paragraph('&nbsp;', estilo(11, TA_CENTER, despues=separacion)))
    filas += [
        [Paragraph('_______________________________', estilo(11, TA_CENTER))],
        [Paragraph(d['firmante'] or '&nbsp;', estilo(10, TA_CENTER))],
        [Paragraph('Departamento Académico', estilo(10, TA_CENTER, 'Times-Bold'))],
    ]
    tabla = Table(filas, colWidths=[234], hAlign='LEFT')
    tabla.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0.5),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elementos.append(tabla)
    return elementos
