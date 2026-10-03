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


def exportar_constancia_pdf(proyecto, informe):
    salida = io.BytesIO()
    doc = SimpleDocTemplate(salida, pagesize=A4, leftMargin=25 * mm, rightMargin=25 * mm,
                            topMargin=35 * mm, bottomMargin=25 * mm,
                            title='Constancia de Finalización')
    e = _estilos()
    docente = proyecto.docente_responsable
    fecha = (informe.fecha_aprobacion or timezone.now()).strftime('%d/%m/%Y')
    departamento = proyecto.departamento.nombre if proyecto.departamento else '—'

    elementos = [
        Paragraph('Universidad Nacional de San Agustín de Arequipa', e['centro']),
        Paragraph('Oficina de Responsabilidad Social Universitaria', e['centro']),
        Spacer(1, 18 * mm),
        Paragraph('CONSTANCIA DE FINALIZACIÓN DE PROYECTO RSU', e['titulo']),
        Spacer(1, 10 * mm),
        Paragraph(
            f'Se deja constancia de que el proyecto <b>{proyecto.titulo}</b>, con código '
            f'<b>{proyecto.codigo or "—"}</b>, a cargo del docente '
            f'<b>{docente.nombres} {docente.apellidos}</b>, del {departamento}, '
            f'fue ejecutado y su Informe de Finalización aprobado el {fecha}.',
            e['centro']),
        Spacer(1, 25 * mm),
        Paragraph('_______________________________', e['centro']),
        Paragraph('Departamento Académico', e['centro']),
        Spacer(1, 10 * mm),
        Paragraph('Formato provisional', e['normal']),
    ]
    doc.build(elementos)
    salida.seek(0)
    return salida
