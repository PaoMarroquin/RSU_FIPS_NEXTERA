import io
import openpyxl
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def export_matriz_excel(matriz):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"Matriz {matriz.periodo.nombre}"

    # Header de la matriz
    ws.append(["Matriz Operativa Anual"])
    ws.append(["Facultad:", matriz.facultad.nombre if matriz.facultad else ""])
    ws.append(["Periodo:", matriz.periodo.nombre if matriz.periodo else ""])
    ws.append(["Coordinador:", matriz.coordinador.nombre_completo if matriz.coordinador else ""])
    ws.append(["Estado:", matriz.get_estado_display()])
    ws.append(["Presupuesto Global:", float(matriz.presupuesto_global) if matriz.presupuesto_global else 0])
    ws.append([])

    # Objetivos e Indicadores
    ws.append(["Objetivos Institucionales e Indicadores"])
    ws.append(["Objetivo", "Línea Estratégica", "Eje RSU", "Indicador", "Unidad Medida", "Meta", "Alcanzado"])
    
    for obj in matriz.objetivos.all():
        linea = obj.linea_estrategica.nombre if obj.linea_estrategica else "N/A"
        eje = obj.eje_rsu.nombre if obj.eje_rsu else "N/A"
        if obj.indicadores.exists():
            for ind in obj.indicadores.all():
                ws.append([
                    obj.nombre, linea, eje, ind.nombre, 
                    ind.unidad_medida, float(ind.valor_meta) if ind.valor_meta else "", 
                    float(ind.valor_alcanzado) if ind.valor_alcanzado else ""
                ])
        else:
            ws.append([obj.nombre, linea, eje, "Sin indicadores", "", "", ""])
            
    ws.append([])
    
    # Actividades Sugeridas
    ws.append(["Actividades Sugeridas"])
    ws.append(["Actividad", "Descripción", "Eje RSU", "Objetivo", "Año Académico", "Presupuesto Ref."])
    
    for act in matriz.actividades_sugeridas.all():
        eje = act.eje_rsu.nombre if act.eje_rsu else "N/A"
        obj_name = act.objetivo.nombre if act.objetivo else "N/A"
        ws.append([
            act.nombre, act.descripcion, eje, obj_name, 
            act.get_anio_academico_display(), float(act.presupuesto_ref) if act.presupuesto_ref else ""
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def export_matriz_pdf(matriz):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Título
    elements.append(Paragraph(f"Matriz Operativa Anual - {matriz.periodo.nombre}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Información general
    info_data = [
        ["Facultad:", matriz.facultad.nombre if matriz.facultad else ""],
        ["Periodo:", matriz.periodo.nombre if matriz.periodo else ""],
        ["Coordinador:", matriz.coordinador.nombre_completo if matriz.coordinador else ""],
        ["Estado:", matriz.get_estado_display()],
        ["Presupuesto Global:", str(matriz.presupuesto_global) if matriz.presupuesto_global else "0.00"]
    ]
    t_info = Table(info_data, colWidths=[120, 300])
    t_info.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 24))

    # Objetivos
    elements.append(Paragraph("Objetivos Institucionales e Indicadores", styles['Heading2']))
    obj_data = [["Objetivo", "Eje RSU", "Indicadores (Meta/Alcanzado)"]]
    for obj in matriz.objetivos.all():
        eje = obj.eje_rsu.nombre if obj.eje_rsu else "N/A"
        inds = []
        for ind in obj.indicadores.all():
            meta = ind.valor_meta if ind.valor_meta else "-"
            alc = ind.valor_alcanzado if ind.valor_alcanzado else "-"
            inds.append(f"- {ind.nombre} ({meta} / {alc})")
        inds_text = "\n".join(inds) if inds else "Sin indicadores"
        obj_data.append([Paragraph(obj.nombre, styles['Normal']), eje, Paragraph(inds_text, styles['Normal'])])
    
    if len(obj_data) > 1:
        t_obj = Table(obj_data, colWidths=[200, 100, 200])
        t_obj.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(t_obj)
    else:
        elements.append(Paragraph("No hay objetivos registrados.", styles['Normal']))
    
    elements.append(Spacer(1, 24))

    # Actividades
    elements.append(Paragraph("Actividades Sugeridas", styles['Heading2']))
    act_data = [["Actividad", "Eje RSU", "Año", "Pto. Ref."]]
    for act in matriz.actividades_sugeridas.all():
        eje = act.eje_rsu.nombre if act.eje_rsu else "N/A"
        act_data.append([
            Paragraph(act.nombre, styles['Normal']), 
            eje, 
            act.get_anio_academico_display(), 
            str(act.presupuesto_ref) if act.presupuesto_ref else "-"
        ])
    
    if len(act_data) > 1:
        t_act = Table(act_data, colWidths=[200, 120, 80, 80])
        t_act.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        elements.append(t_act)
    else:
        elements.append(Paragraph("No hay actividades sugeridas.", styles['Normal']))

    doc.build(elements)
    output.seek(0)
    return output
