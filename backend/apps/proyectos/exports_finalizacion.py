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


def exportar_informe_finalizacion_pdf(datos):
    salida = io.BytesIO()
    doc = SimpleDocTemplate(salida, pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm,
                            title='Informe de Finalización')
    e = _estilos()
    c = e['celda']
    informe = datos['informe_final']
    alcanzados = datos['resultados_alcanzados']

    elementos = [
        Paragraph('Informe de Finalización de Proyecto RSU', e['titulo']),
        Paragraph(f"<b>{datos.get('titulo', '')}</b>", e['normal']),
        Paragraph(f"Código: {datos.get('codigo') or '—'} · "
                  f"Estado del informe: {datos['finalizacion']['estado_display'] or 'Sin iniciar'}",
                  e['normal']),
        Spacer(1, 6),

        Paragraph('Resultados esperados', e['seccion']),
        Paragraph(f"<b>En los beneficiarios:</b> {_texto(datos['resultados_esperados'].get('en_beneficiarios'))}",
                  e['normal']),
        Paragraph(f"<b>En el proceso curricular:</b> {_texto(datos['resultados_esperados'].get('en_curriculo'))}",
                  e['normal']),

        Paragraph('Actividades ejecutadas', e['seccion']),
    ]

    filas = [['Actividad', 'Estado', 'Evidencias']]
    for act in datos['ejecucion']['actividades']:
        filas.append([Paragraph(act['nombre'], c), act['estado_display'], str(len(act['evidencias']))])
    elementos.append(_tabla(filas, [110 * mm, 35 * mm, 35 * mm]))

    elementos.append(Paragraph('Metas e indicadores', e['seccion']))
    filas = [['Meta', 'Indicador', 'Línea base', 'Meta', 'Alcanzado']]
    for m in alcanzados['detalle_metas']:
        filas.append([
            Paragraph(m['meta'] or '', c), Paragraph(m['indicador'] or '', c),
            _num(m['linea_base']), _num(m['valor_meta']), _num(m['valor_alcanzado']),
        ])
    elementos.append(_tabla(filas, [55 * mm, 55 * mm, 22 * mm, 22 * mm, 26 * mm]))

    elementos.append(Paragraph('Presupuesto', e['seccion']))
    filas = [['Partida', 'Presupuestado S/', 'Ejecutado S/']]
    for p in datos['presupuesto_detalle']:
        filas.append([Paragraph(p['descripcion'] or p['categoria'], c),
                      f"{p['monto_presupuestado']:.2f}", f"{p['monto_ejecutado']:.2f}"])
    elementos.append(_tabla(filas, [110 * mm, 35 * mm, 35 * mm]))

    for titulo, campo in [('Conclusiones', 'conclusiones'),
                          ('Recomendaciones', 'recomendaciones'),
                          ('Lecciones aprendidas', 'lecciones_aprendidas'),
                          ('Medio de difusión', 'medio_difusion')]:
        elementos.append(Paragraph(titulo, e['seccion']))
        elementos.append(Paragraph(_texto(informe.get(campo)), e['normal']))

    doc.build(elementos)
    salida.seek(0)
    return salida


def _num(valor):
    return '—' if valor is None else f'{valor:g}'


MESES = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre')
ROJO_PLANTILLA = colors.HexColor('#EE0000')


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
    return {
        'departamento': _nombre_departamento(proyecto.departamento),
        'numero': proyecto.codigo or '—',
        'facultad': proyecto.facultad.nombre if proyecto.facultad else '—',
        'titulo': proyecto.titulo,
        'docente': f'{docente.nombres} {docente.apellidos}'.strip(),
        'participantes': _enumerar(proyecto.docentes_participantes or []),
        'fecha_inicio': _fecha_larga(proyecto.fecha_inicio),
        'fecha_fin': _fecha_larga(_fecha_fin_real(proyecto)),
        'ejes': _enumerar(list(proyecto.ejes_rsu.values_list('nombre', flat=True))) or '—',
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
    participantes = (f' con la participación de los docentes: <b>{d["participantes"]}.</b>'
                     if d['participantes'] else '.')
    ods = f' y alineado a los <b>{d["ods"]}</b>' if d['ods'] else ''
    fecha = d['fecha_documento']

    elementos = [
        Paragraph('UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA', estilo(14, TA_CENTER, 'Times-Bold')),
        Paragraph(f'{d["departamento"].upper()}<br/>COMITÉ DE RESPONSABILIDAD SOCIAL FIPS',
                  estilo(12, TA_CENTER, 'Times-Bold')),
        Paragraph('&nbsp;', estilo(10, despues=15)),
        Paragraph('CONSTANCIA DE FINALIZACIÓN DE PROYECTO RSU', estilo(16, TA_CENTER, 'Times-Bold')),
        Paragraph(f'N° {d["numero"]} ', estilo(16, TA_CENTER, 'Times-Italic', color=ROJO_PLANTILLA)),
        Paragraph('&nbsp;', estilo(10, despues=15)),
        Paragraph(
            f'El director de <b>{d["departamento"]},</b> de la facultad de <b>{d["facultad"]}</b>,  '
            'de la Universidad Nacional de San Agustín de Arequipa certifica que el proyecto de '
            f'responsabilidad social denominado <b>"{d["titulo"]}"</b>, ejecutado bajo la '
            f'responsabilidad del/de la docente <b>{d["docente"]}</b>{participantes}', cuerpo),
        Paragraph('&nbsp;', estilo(11)),
        Paragraph(
            f'El proyecto se desarrolló durante el periodo comprendido entre el <b>{d["fecha_inicio"]}</b> '
            f'y el <b>{d["fecha_fin"]}</b>, en el marco del eje RSU <b>{d["ejes"]}</b>{ods}, logrando '
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
