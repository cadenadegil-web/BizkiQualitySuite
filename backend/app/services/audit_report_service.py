"""
Servicio de generación de informes PDF para auditorías.
Usa pylatex para producir documentos de calidad profesional.
Falla a reportlab si pdflatex no está instalado.
"""
import shutil
import tempfile
import os
from datetime import date
from io import BytesIO

try:
    from pylatex import (
        Document, Section, Subsection, Command, NoEscape,
        LongTable, MultiColumn, Tabular, LineBreak, NewPage,
        HFill, HugeText, LargeText, MediumText, SmallText,
        Package, Head, Foot, PageStyle, simple_page_number
    )
    from pylatex.utils import bold, italic
    from pylatex.base_classes import Environment
    HAS_PYLATEX = True
except ImportError:
    HAS_PYLATEX = False

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.audit import Audit

RESULT_LABELS = {
    "CONFORME": "Conforme",
    "NO_CONFORME": "No Conforme",
    "OBSERVACION": "Observación",
    None: "Pendiente",
}

RESULT_SYMBOLS = {
    "CONFORME": r"\checkmark",
    "NO_CONFORME": r"\times",
    "OBSERVACION": r"\circ",
    None: "---",
}

def _pdflatex_available() -> bool:
    return HAS_PYLATEX and (shutil.which("pdflatex") is not None)

def _fmt_date(d) -> str:
    if d is None:
        return "---"
    if hasattr(d, "strftime"):
        return d.strftime("%d/%m/%Y")
    return str(d)

def _generate_audit_pdf_reportlab(audit: Audit) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2.5*cm, bottomMargin=2.5*cm)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.HexColor("#1976D2"), alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Heading2'], textColor=colors.HexColor("#1976D2"))
    normal_style = styles['Normal']
    
    elements = []
    
    # Portada
    elements.append(Spacer(1, 3*cm))
    elements.append(Paragraph("<b>INFORME DE AUDITORÍA BPM</b>", title_style))
    elements.append(Spacer(1, 1.5*cm))
    elements.append(Paragraph(f"<b>Código:</b> {audit.code}", ParagraphStyle('C', parent=normal_style, alignment=TA_CENTER, fontSize=14)))
    elements.append(Paragraph(f"<b>Fecha:</b> {_fmt_date(audit.audit_date)}", ParagraphStyle('D', parent=normal_style, alignment=TA_CENTER, fontSize=12)))
    elements.append(Spacer(1, 2*cm))
    elements.append(Paragraph("<b>Bizki Quality Suite</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER)))
    elements.append(Spacer(1, 4*cm))
    elements.append(Paragraph(f"<b>Auditor:</b> {audit.auditor}", ParagraphStyle('A', parent=normal_style, alignment=TA_CENTER)))
    elements.append(PageBreak())
    
    # Introduccion
    elements.append(Paragraph("<b>1. Introducción</b>", subtitle_style))
    elements.append(Paragraph("El presente informe documenta los resultados de la auditoría de Buenas Prácticas de Manufactura (BPM) realizada en las instalaciones. El propósito es garantizar el cumplimiento de los estándares de calidad e inocuidad y mantener un registro formal.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Objetivos y alcance
    elements.append(Paragraph("<b>2. Objetivos y Alcance</b>", subtitle_style))
    elements.append(Paragraph("<b>Objetivos:</b> Evaluar la conformidad de los procesos frente a la normativa vigente e identificar oportunidades de mejora continua.", normal_style))
    area_name = audit.area.name if audit.area else "N/A"
    elements.append(Paragraph(f"<b>Alcance:</b> Área auditada: {area_name}. Turno: {audit.shift}.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Datos generales
    elements.append(Paragraph("<b>3. Información General</b>", subtitle_style))
    score_str = f"{audit.score:.1f}%" if audit.score is not None else "---"
    status_str = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
    
    data = [
        ["Código:", audit.code, "Fecha:", _fmt_date(audit.audit_date)],
        ["Turno:", audit.shift, "Área:", area_name],
        ["Auditor:", audit.auditor, "Estado:", status_str],
        ["Puntaje:", score_str, "", ""]
    ]
    t = Table(data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#E3F2FD")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 1*cm))
    
    # Graficos
    elements.append(Paragraph("<b>4. Detalles Gráficos</b>", subtitle_style))
    total = len(audit.items)
    conformes = sum(1 for it in audit.items if it.result == "CONFORME")
    no_conformes = sum(1 for it in audit.items if it.result == "NO_CONFORME")
    observaciones = sum(1 for it in audit.items if it.result == "OBSERVACION")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        chart_path = None
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            labels = ['Conformes', 'No Conformes', 'Observaciones']
            sizes = [conformes, no_conformes, observaciones]
            colors_hex = ['#2E7D32', '#C62828', '#E65100']
            labels_f, sizes_f, colors_f = [], [], []
            for l, s, c in zip(labels, sizes, colors_hex):
                if s > 0:
                    labels_f.append(l)
                    sizes_f.append(s)
                    colors_f.append(c)
            plt.figure(figsize=(5, 3))
            if sizes_f:
                plt.pie(sizes_f, labels=labels_f, colors=colors_f, autopct='%1.1f%%', startangle=140)
                plt.axis('equal')
            else:
                plt.text(0.5, 0.5, "Sin datos", ha="center", va="center")
                plt.axis("off")
            chart_path = os.path.join(tmpdir, "chart.png")
            plt.savefig(chart_path, bbox_inches='tight')
            plt.close()
        except ImportError:
            pass
            
        if chart_path and os.path.exists(chart_path):
            elements.append(Image(chart_path, width=10*cm, height=6*cm))
        else:
            elements.append(Paragraph("Gráfico no disponible.", normal_style))
            
        elements.append(PageBreak())
        
        # Detalles
        elements.append(Paragraph("<b>5. Detalle de Puntos de Control</b>", subtitle_style))
        items_data = [["#", "Norma", "Punto de Control", "Resultado", "Comentario"]]
        for item in audit.items:
            items_data.append([
                str(item.order), item.norm, Paragraph(item.control_point, normal_style),
                RESULT_LABELS.get(item.result, "Pendiente"), Paragraph(item.comment or "", normal_style)
            ])
            
        t_items = Table(items_data, colWidths=[1*cm, 2.5*cm, 7*cm, 2.5*cm, 3.5*cm], repeatRows=1)
        t_items.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1976D2")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        
        for i, item in enumerate(audit.items, 1):
            if item.result == "CONFORME":
                t_items.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#2E7D32"))]))
            elif item.result == "NO_CONFORME":
                t_items.setStyle(TableStyle([
                    ('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#C62828")),
                    ('BACKGROUND', (0, i), (-1, i), colors.HexColor("#FFCDD2"))
                ]))
            elif item.result == "OBSERVACION":
                t_items.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#E65100"))]))
                
        elements.append(t_items)
        elements.append(PageBreak())
        
        # Evidencias
        elements.append(Paragraph("<b>6. Evidencias Fotográficas</b>", subtitle_style))
        elements.append(Paragraph("En este espacio se documentan las pruebas visuales de los hallazgos.", normal_style))
        elements.append(Spacer(1, 0.5*cm))
        ev_data = [["Espacio para Fotografía 1", "Espacio para Fotografía 2"], ["Espacio para Fotografía 3", "Espacio para Fotografía 4"]]
        t_ev = Table(ev_data, colWidths=[8*cm, 8*cm], rowHeights=[6*cm, 6*cm])
        t_ev.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.gray),
        ]))
        elements.append(t_ev)
        elements.append(Spacer(1, 1*cm))
        
        # Recomendaciones
        elements.append(Paragraph("<b>7. Recomendaciones</b>", subtitle_style))
        if audit.observations:
            elements.append(Paragraph(audit.observations, normal_style))
        else:
            elements.append(Paragraph("No hay observaciones generales adicionales registradas. Se recomienda atender oportunamente las no conformidades detalladas.", normal_style))
            
        elements.append(Spacer(1, 3*cm))
        sign_data = [["_______________________", "_______________________"], ["Firma del Auditor", "Firma Responsable Área"]]
        t_sign = Table(sign_data, colWidths=[8*cm, 8*cm])
        t_sign.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, 1), 9),
        ]))
        elements.append(t_sign)

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        
    buffer.close()
    return pdf_bytes

def _generate_daily_report_pdf_reportlab(audits: list[Audit], report_date: date) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2.5*cm, bottomMargin=2.5*cm)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.HexColor("#1976D2"), alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Heading2'], textColor=colors.HexColor("#1976D2"))
    normal_style = styles['Normal']
    
    elements = []
    
    date_str = report_date.strftime("%d/%m/%Y")
    
    # Portada
    elements.append(Spacer(1, 3*cm))
    elements.append(Paragraph("<b>INFORME DIARIO DE AUDITORÍAS</b>", title_style))
    elements.append(Spacer(1, 1.5*cm))
    elements.append(Paragraph(f"<b>Fecha:</b> {date_str}", ParagraphStyle('C', parent=normal_style, alignment=TA_CENTER, fontSize=14)))
    elements.append(Spacer(1, 2*cm))
    elements.append(Paragraph("<b>Bizki Quality Suite</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER)))
    elements.append(Spacer(1, 4*cm))
    elements.append(Paragraph(f"<b>Auditorías registradas:</b> {len(audits)}", ParagraphStyle('A', parent=normal_style, alignment=TA_CENTER)))
    elements.append(PageBreak())
    
    # Introduccion
    elements.append(Paragraph("<b>1. Introducción</b>", subtitle_style))
    elements.append(Paragraph(f"El presente informe consolida los resultados de todas las auditorías llevadas a cabo durante la jornada del {date_str}. Su objetivo es presentar un panorama global del nivel de cumplimiento normativo.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    elements.append(Paragraph("<b>2. Objetivos y Alcance</b>", subtitle_style))
    elements.append(Paragraph("<b>Objetivos:</b> Proporcionar una visión integral de los hallazgos del día, consolidar indicadores gráficos y promover la toma de decisiones.", normal_style))
    elements.append(Paragraph("<b>Alcance:</b> El informe abarca todas las áreas productivas y operativas auditadas en todos los turnos registrados durante esta fecha.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Resumen
    elements.append(Paragraph("<b>3. Información General Consolidada</b>", subtitle_style))
    summary_data = [["Código", "Área", "Auditor", "Turno", "Puntaje", "NC", "Estado"]]
    for audit in audits:
        area_name = (audit.area.name if audit.area else "---")[:20]
        score = f"{audit.score:.1f}%" if audit.score is not None else "---"
        nc = str(sum(1 for it in audit.items if it.result == "NO_CONFORME"))
        status = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
        summary_data.append([audit.code, area_name, audit.auditor[:20], audit.shift, score, nc, status])
        
    t = Table(summary_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1976D2")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 1*cm))
    
    # Graficos
    elements.append(Paragraph("<b>4. Detalles Gráficos Globales</b>", subtitle_style))
    conformes_tot = 0
    nc_tot = 0
    obs_tot = 0
    for au in audits:
        conformes_tot += sum(1 for it in au.items if it.result == "CONFORME")
        nc_tot += sum(1 for it in au.items if it.result == "NO_CONFORME")
        obs_tot += sum(1 for it in au.items if it.result == "OBSERVACION")
        
    with tempfile.TemporaryDirectory() as tmpdir:
        chart_path = None
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            labels = ['Conformes', 'No Conformes', 'Observaciones']
            sizes = [conformes_tot, nc_tot, obs_tot]
            colors_hex = ['#2E7D32', '#C62828', '#E65100']
            labels_f, sizes_f, colors_f = [], [], []
            for l, s, c in zip(labels, sizes, colors_hex):
                if s > 0:
                    labels_f.append(l)
                    sizes_f.append(s)
                    colors_f.append(c)
            plt.figure(figsize=(5, 3))
            if sizes_f:
                plt.pie(sizes_f, labels=labels_f, colors=colors_f, autopct='%1.1f%%', startangle=140)
                plt.axis('equal')
            else:
                plt.text(0.5, 0.5, "Sin datos", ha="center", va="center")
                plt.axis("off")
            chart_path = os.path.join(tmpdir, "daily_chart.png")
            plt.savefig(chart_path, bbox_inches='tight')
            plt.close()
        except ImportError:
            pass
            
        if chart_path and os.path.exists(chart_path):
            elements.append(Image(chart_path, width=10*cm, height=6*cm))
        else:
            elements.append(Paragraph("Gráfico no disponible.", normal_style))
            
        elements.append(PageBreak())
        
        # Detalles
        elements.append(Paragraph("<b>5. Detalle de Auditorías</b>", subtitle_style))
        for audit in audits:
            elements.append(Paragraph(f"<b>{audit.code} — Detalle</b>", ParagraphStyle('SubSub', parent=normal_style, textColor=colors.HexColor("#1976D2"), fontSize=12)))
            elements.append(Spacer(1, 0.3*cm))
            items_data = [["#", "Norma", "Punto de Control", "Resultado", "Comentario"]]
            for item in audit.items:
                items_data.append([
                    str(item.order), item.norm, Paragraph(item.control_point, normal_style),
                    RESULT_LABELS.get(item.result, "Pendiente"), Paragraph(item.comment or "", normal_style)
                ])
                
            t_items = Table(items_data, colWidths=[1*cm, 2.5*cm, 7*cm, 2.5*cm, 3.5*cm], repeatRows=1)
            t_items.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1976D2")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ]))
            for i, item in enumerate(audit.items, 1):
                if item.result == "CONFORME":
                    t_items.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#2E7D32"))]))
                elif item.result == "NO_CONFORME":
                    t_items.setStyle(TableStyle([
                        ('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#C62828")),
                        ('BACKGROUND', (0, i), (-1, i), colors.HexColor("#FFCDD2"))
                    ]))
                elif item.result == "OBSERVACION":
                    t_items.setStyle(TableStyle([('TEXTCOLOR', (3, i), (3, i), colors.HexColor("#E65100"))]))
            elements.append(t_items)
            elements.append(Spacer(1, 0.5*cm))
            
        elements.append(PageBreak())
        
        # Evidencias
        elements.append(Paragraph("<b>6. Evidencias Fotográficas</b>", subtitle_style))
        elements.append(Paragraph("En este espacio se documentan las pruebas visuales relevantes de las desviaciones encontradas durante la jornada.", normal_style))
        elements.append(Spacer(1, 0.5*cm))
        ev_data = [["Espacio para Fotografía 1", "Espacio para Fotografía 2"], ["Espacio para Fotografía 3", "Espacio para Fotografía 4"]]
        t_ev = Table(ev_data, colWidths=[8*cm, 8*cm], rowHeights=[6*cm, 6*cm])
        t_ev.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 1, colors.grey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.gray),
        ]))
        elements.append(t_ev)
        elements.append(Spacer(1, 1*cm))
        
        # Recomendaciones
        elements.append(Paragraph("<b>7. Recomendaciones</b>", subtitle_style))
        elements.append(Paragraph("Se exhorta a los responsables de las áreas auditadas a revisar las No Conformidades listadas en la sección 5 y a documentar e implementar las Acciones Correctivas correspondientes.", normal_style))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        
    buffer.close()
    return pdf_bytes


def generate_audit_pdf(audit: Audit) -> bytes:
    if not _pdflatex_available():
        return _generate_audit_pdf_reportlab(audit)

    with tempfile.TemporaryDirectory() as tmpdir:
        # Generar gráfico con matplotlib
        total = len(audit.items)
        conformes = sum(1 for it in audit.items if it.result == "CONFORME")
        no_conformes = sum(1 for it in audit.items if it.result == "NO_CONFORME")
        observaciones = sum(1 for it in audit.items if it.result == "OBSERVACION")
        
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            
            labels = ['Conformes', 'No Conformes', 'Observaciones']
            sizes = [conformes, no_conformes, observaciones]
            colors_hex = ['#2E7D32', '#C62828', '#E65100']
            
            labels_f, sizes_f, colors_f = [], [], []
            for l, s, c in zip(labels, sizes, colors_hex):
                if s > 0:
                    labels_f.append(l)
                    sizes_f.append(s)
                    colors_f.append(c)
                    
            plt.figure(figsize=(6, 4))
            if sizes_f:
                plt.pie(sizes_f, labels=labels_f, colors=colors_f, autopct='%1.1f%%', startangle=140)
                plt.axis('equal')
            else:
                plt.text(0.5, 0.5, "Sin datos", ha="center", va="center")
                plt.axis("off")
            chart_path = os.path.join(tmpdir, "chart.png").replace("\\", "/")
            plt.savefig(chart_path, bbox_inches='tight')
            plt.close()
        except ImportError:
            chart_path = None

        geometry_options = {"margin": "2cm", "top": "2.5cm", "bottom": "2.5cm"}
        doc = Document(geometry_options=geometry_options, document_options=["a4paper", "11pt"])

        for pkg, opts in [
            ("babel", "spanish"), ("inputenc", "utf8"), ("booktabs", None),
            ("colortbl", None), ("xcolor", None), ("array", None),
            ("longtable", None), ("fancyhdr", None), ("amssymb", None),
            ("graphicx", None)
        ]:
            doc.packages.append(Package(pkg, options=opts) if opts else Package(pkg))

        doc.preamble.append(NoEscape(r"\definecolor{bizki_blue}{RGB}{25,118,210}"))
        doc.preamble.append(NoEscape(r"\definecolor{conf_green}{RGB}{46,125,50}"))
        doc.preamble.append(NoEscape(r"\definecolor{nc_red}{RGB}{198,40,40}"))
        doc.preamble.append(NoEscape(r"\definecolor{obs_orange}{RGB}{230,81,0}"))
        doc.preamble.append(NoEscape(r"\definecolor{header_blue}{RGB}{227,242,253}"))

        doc.preamble.append(NoEscape(r"\pagestyle{fancy}"))
        doc.preamble.append(NoEscape(r"\fancyhf{}"))
        doc.preamble.append(NoEscape(r"\fancyhead[L]{\textcolor{bizki_blue}{\textbf{Bizki Quality Suite}}}"))
        doc.preamble.append(NoEscape(r"\fancyhead[R]{\textcolor{gray}{\small Informe de Auditoría}}"))
        doc.preamble.append(NoEscape(r"\fancyfoot[C]{\textcolor{gray}{\small Página \thepage}}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\headrulewidth}{0.5pt}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\footrulewidth}{0.3pt}"))

        # Portada
        doc.append(NoEscape(r"\begin{titlepage}"))
        doc.append(NoEscape(r"\begin{center}"))
        doc.append(NoEscape(r"\vspace*{3cm}"))
        doc.append(NoEscape(r"{\color{bizki_blue}\rule{\linewidth}{1.5pt}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\LARGE\textbf{\textcolor{bizki_blue}{INFORME DE AUDITOR\'IA BPM}}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\color{bizki_blue}\rule{\linewidth}{1.5pt}}\\[1.5cm]"))
        doc.append(NoEscape(rf"{{\Large Código: {audit.code}}}\\[0.5cm]"))
        doc.append(NoEscape(rf"{{\large Fecha: {_fmt_date(audit.audit_date)}}}\\[2cm]"))
        doc.append(NoEscape(r"\textbf{Bizki Quality Suite}\\[0.5cm]"))
        doc.append(NoEscape(r"\vfill"))
        doc.append(NoEscape(rf"Auditor: {audit.auditor}"))
        doc.append(NoEscape(r"\end{center}"))
        doc.append(NoEscape(r"\end{titlepage}"))

        # Indice
        doc.append(NoEscape(r"\tableofcontents"))
        doc.append(NoEscape(r"\newpage"))

        # 1. Introduccion
        doc.append(NoEscape(r"\section{Introducción}"))
        doc.append(NoEscape("El presente informe documenta los resultados de la auditoría de Buenas Prácticas de Manufactura (BPM) realizada en las instalaciones. El propósito es garantizar el cumplimiento de los estándares de calidad e inocuidad y mantener un registro formal para las entidades de control y seguimiento interno."))
        
        # 2. Objetivos y Alcance
        doc.append(NoEscape(r"\section{Objetivos y Alcance}"))
        doc.append(NoEscape(r"\textbf{Objetivos:}\\ Evaluar la conformidad de los procesos frente a la normativa vigente e identificar oportunidades de mejora continua.\\\vspace{0.5cm}"))
        area_name = audit.area.name if audit.area else "N/A"
        doc.append(NoEscape(r"\textbf{Alcance:}\\ Área auditada: " + area_name + r". Turno: " + audit.shift + "."))
        
        # 3. Info General
        doc.append(NoEscape(r"\section{Información General}"))
        score_str = f"{audit.score:.1f}\\%" if audit.score is not None else "---"
        status_str = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
        
        doc.append(NoEscape(
            rf"""\begin{{tabular}}{{@{{}}p{{0.48\linewidth}}p{{0.48\linewidth}}@{{}}}}
            \rowcolor{{header_blue}}
            \multicolumn{{2}}{{l}}{{\textbf{{\textcolor{{bizki_blue}}{{Datos Generales}}}}}}\\
            \textbf{{Código:}} & {audit.code} \\
            \textbf{{Fecha:}} & {_fmt_date(audit.audit_date)} \\
            \textbf{{Turno:}} & {audit.shift} \\
            \textbf{{Área:}} & {area_name} \\
            \textbf{{Auditor:}} & {audit.auditor} \\
            \textbf{{Estado:}} & {status_str} \\
            \textbf{{Puntaje:}} & \textbf{{{score_str}}} \\
            \end{{tabular}}"""
        ))
        doc.append(NoEscape(r"\vspace{16pt}"))
        
        doc.append(NoEscape(
            rf"""\begin{{center}}
            \begin{{tabular}}{{cccc}}
            \rowcolor{{header_blue}}
            \textbf{{Total Ítems}} & \textbf{{\textcolor{{conf_green}}{{Conformes}}}} & \textbf{{\textcolor{{nc_red}}{{No Conformes}}}} & \textbf{{\textcolor{{obs_orange}}{{Observaciones}}}} \\\\
            {total} & {conformes} & {no_conformes} & {observaciones} \\\\
            \end{{tabular}}
            \end{{center}}"""
        ))

        # 4. Detalles graficos
        doc.append(NoEscape(r"\section{Detalles Gráficos}"))
        if chart_path:
            doc.append(NoEscape(r"\begin{center}"))
            doc.append(NoEscape(rf"\includegraphics[width=0.6\textwidth]{{{chart_path}}}"))
            doc.append(NoEscape(r"\end{center}"))
        else:
            doc.append(NoEscape("Gráfico no disponible."))
            
        doc.append(NoEscape(r"\newpage"))

        # 5. Detalles de Tablas (Checklist)
        doc.append(NoEscape(r"\section{Detalle de Puntos de Control}"))
        doc.append(NoEscape(
            r"""\begin{longtable}{@{}c p{2.2cm} p{7cm} p{2.5cm} p{3cm}@{}}
            \toprule
            \rowcolor{bizki_blue}
            \textcolor{white}{\textbf{\#}} &
            \textcolor{white}{\textbf{Norma}} &
            \textcolor{white}{\textbf{Punto de Control}} &
            \textcolor{white}{\textbf{Resultado}} &
            \textcolor{white}{\textbf{Comentario}} \\\\
            \midrule
            \endhead"""
        ))

        for item in audit.items:
            result_label = RESULT_LABELS.get(item.result, "Pendiente")
            comment = (item.comment or "").replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
            norm = item.norm.replace("&", "\\&").replace("_", "\\_")
            control = item.control_point.replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")

            if item.result == "CONFORME":
                color_cmd = r"\textcolor{conf_green}"
            elif item.result == "NO_CONFORME":
                color_cmd = r"\textcolor{nc_red}"
            elif item.result == "OBSERVACION":
                color_cmd = r"\textcolor{obs_orange}"
            else:
                color_cmd = r"\textcolor{gray}"

            bg = ""
            if item.result == "NO_CONFORME":
                bg = r"\rowcolor{red!8}"

            doc.append(NoEscape(
                rf"""{bg}
                {item.order} & {norm} & {control} &
                {color_cmd}{{\textbf{{{result_label}}}}} & \small {comment} \\\\
                \midrule"""
            ))

        doc.append(NoEscape(r"\bottomrule"))
        doc.append(NoEscape(r"\end{longtable}"))

        nc_items = [it for it in audit.items if it.result == "NO_CONFORME"]
        if nc_items:
            doc.append(NoEscape(r"\vspace{16pt}"))
            doc.append(NoEscape(
                r"\textbf{\textcolor{nc_red}{Hallazgos Generados Automáticamente}}\\"
            ))
            doc.append(NoEscape(r"\begin{itemize}"))
            for item in nc_items:
                control = item.control_point.replace("&", "\\&").replace("_", "\\_")
                doc.append(NoEscape(rf"\item \textbf{{{item.norm}}} — {control}"))
            doc.append(NoEscape(r"\end{itemize}"))
            
        doc.append(NoEscape(r"\newpage"))

        # 6. Evidencias
        doc.append(NoEscape(r"\section{Evidencias Fotográficas o Audiovisuales}"))
        doc.append(NoEscape(r"En este espacio se documentan las pruebas visuales de los hallazgos y áreas de oportunidad encontradas durante el recorrido.\\\vspace{0.5cm}"))
        doc.append(NoEscape(
            r"""\begin{center}
            \begin{tabular}{|p{7cm}|p{7cm}|}
            \hline
            \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 1}} & \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 2}} \tabularnewline
            \hline
            \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 3}} & \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 4}} \tabularnewline
            \hline
            \end{tabular}
            \end{center}"""
        ))
        
        # 7. Recomendaciones
        doc.append(NoEscape(r"\section{Recomendaciones}"))
        if audit.observations:
            obs = audit.observations.replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
            doc.append(NoEscape(obs))
        else:
            doc.append(NoEscape("No hay observaciones generales adicionales registradas por el auditor. Se recomienda atender oportunamente las no conformidades detalladas en la sección correspondiente para evitar recurrencias y garantizar la inocuidad del proceso."))

        # Signature block
        doc.append(NoEscape(r"\vspace{24pt}"))
        doc.append(NoEscape(
            r"""\begin{tabular}{@{}p{0.45\linewidth}p{0.1\linewidth}p{0.45\linewidth}@{}}
            \vspace{1.5cm} \hline
            \centering \small Firma del Auditor & & \centering \small Firma del Responsable de Área \\
            \end{tabular}"""
        ))

        filepath = os.path.join(tmpdir, "audit_report")
        doc.generate_pdf(filepath, clean_tex=True, compiler="pdflatex",
                         compiler_args=["-interaction=nonstopmode"])
        pdf_path = filepath + ".pdf"
        with open(pdf_path, "rb") as f:
            return f.read()

def generate_daily_report_pdf(audits: list[Audit], report_date: date) -> bytes:
    if not _pdflatex_available():
        return _generate_daily_report_pdf_reportlab(audits, report_date)

    with tempfile.TemporaryDirectory() as tmpdir:
        # Generar grafico global de conformidades
        conformes_tot = 0
        nc_tot = 0
        obs_tot = 0
        for au in audits:
            conformes_tot += sum(1 for it in au.items if it.result == "CONFORME")
            nc_tot += sum(1 for it in au.items if it.result == "NO_CONFORME")
            obs_tot += sum(1 for it in au.items if it.result == "OBSERVACION")
            
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            
            labels = ['Conformes', 'No Conformes', 'Observaciones']
            sizes = [conformes_tot, nc_tot, obs_tot]
            colors_hex = ['#2E7D32', '#C62828', '#E65100']
            
            labels_f, sizes_f, colors_f = [], [], []
            for l, s, c in zip(labels, sizes, colors_hex):
                if s > 0:
                    labels_f.append(l)
                    sizes_f.append(s)
                    colors_f.append(c)
                    
            plt.figure(figsize=(6, 4))
            if sizes_f:
                plt.pie(sizes_f, labels=labels_f, colors=colors_f, autopct='%1.1f%%', startangle=140)
                plt.axis('equal')
            else:
                plt.text(0.5, 0.5, "Sin datos", ha="center", va="center")
                plt.axis("off")
            chart_path = os.path.join(tmpdir, "daily_chart.png").replace("\\", "/")
            plt.savefig(chart_path, bbox_inches='tight')
            plt.close()
        except ImportError:
            chart_path = None

        geometry_options = {"margin": "2cm", "top": "2.5cm", "bottom": "2.5cm"}
        doc = Document(geometry_options=geometry_options, document_options=["a4paper", "11pt"])

        for pkg, opts in [
            ("babel", "spanish"), ("inputenc", "utf8"), ("booktabs", None),
            ("colortbl", None), ("xcolor", None), ("array", None),
            ("longtable", None), ("fancyhdr", None), ("amssymb", None),
            ("graphicx", None)
        ]:
            doc.packages.append(Package(pkg, options=opts) if opts else Package(pkg))

        doc.preamble.append(NoEscape(r"\definecolor{bizki_blue}{RGB}{25,118,210}"))
        doc.preamble.append(NoEscape(r"\definecolor{conf_green}{RGB}{46,125,50}"))
        doc.preamble.append(NoEscape(r"\definecolor{nc_red}{RGB}{198,40,40}"))
        doc.preamble.append(NoEscape(r"\definecolor{obs_orange}{RGB}{230,81,0}"))
        doc.preamble.append(NoEscape(r"\definecolor{header_blue}{RGB}{227,242,253}"))
        
        doc.preamble.append(NoEscape(r"\pagestyle{fancy}"))
        doc.preamble.append(NoEscape(r"\fancyhf{}"))
        doc.preamble.append(NoEscape(r"\fancyhead[L]{\textcolor{bizki_blue}{\textbf{Bizki Quality Suite}}}"))
        doc.preamble.append(NoEscape(r"\fancyhead[R]{\textcolor{gray}{\small Informe Diario de Auditorías}}"))
        doc.preamble.append(NoEscape(r"\fancyfoot[C]{\textcolor{gray}{\small Página \thepage}}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\headrulewidth}{0.5pt}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\footrulewidth}{0.3pt}"))

        # Portada
        date_str = report_date.strftime("%d/%m/%Y")
        doc.append(NoEscape(r"\begin{titlepage}"))
        doc.append(NoEscape(r"\begin{center}"))
        doc.append(NoEscape(r"\vspace*{3cm}"))
        doc.append(NoEscape(r"{\color{bizki_blue}\rule{\linewidth}{1.5pt}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\LARGE\textbf{\textcolor{bizki_blue}{INFORME DIARIO DE AUDITOR\'IAS}}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\color{bizki_blue}\rule{\linewidth}{1.5pt}}\\[1.5cm]"))
        doc.append(NoEscape(rf"{{\Large Fecha de Reporte: {date_str}}}\\[2cm]"))
        doc.append(NoEscape(r"\textbf{Bizki Quality Suite}\\[0.5cm]"))
        doc.append(NoEscape(r"\vfill"))
        doc.append(NoEscape(rf"Cantidad de Auditorías Registradas: {len(audits)}"))
        doc.append(NoEscape(r"\end{center}"))
        doc.append(NoEscape(r"\end{titlepage}"))

        # Indice
        doc.append(NoEscape(r"\tableofcontents"))
        doc.append(NoEscape(r"\newpage"))

        # 1. Introduccion
        doc.append(NoEscape(r"\section{Introducción}"))
        doc.append(NoEscape("El presente informe consolida los resultados de todas las auditorías de procesos y calidad llevadas a cabo durante la jornada del " + date_str + ". Su objetivo es presentar a la gerencia un panorama global del nivel de cumplimiento normativo y resaltar las desviaciones (No Conformidades) que requieren acciones correctivas urgentes."))
        
        # 2. Objetivos y Alcance
        doc.append(NoEscape(r"\section{Objetivos y Alcance}"))
        doc.append(NoEscape(r"\textbf{Objetivos:}\\ Proporcionar una visión integral de los hallazgos del día, consolidar indicadores gráficos y promover la toma de decisiones basada en los resultados agregados.\\\vspace{0.5cm}"))
        doc.append(NoEscape(r"\textbf{Alcance:}\\ El informe abarca todas las áreas productivas y operativas auditadas en todos los turnos registrados durante esta fecha."))
        
        # 3. Info General (Resumen)
        doc.append(NoEscape(r"\section{Información General Consolidada}"))
        doc.append(NoEscape(
            r"""\begin{tabular}{@{}p{2cm} p{3cm} p{2.5cm} p{1.5cm} p{1.5cm} p{1.5cm} p{1.5cm}@{}}
            \toprule
            \rowcolor{bizki_blue}
            \textcolor{white}{\textbf{Código}} &
            \textcolor{white}{\textbf{Área}} &
            \textcolor{white}{\textbf{Auditor}} &
            \textcolor{white}{\textbf{Turno}} &
            \textcolor{white}{\textbf{Puntaje}} &
            \textcolor{white}{\textbf{NC}} &
            \textcolor{white}{\textbf{Estado}} \\\\
            \midrule"""
        ))
        for audit in audits:
            area_name = (audit.area.name if audit.area else "---")[:20]
            score = f"{audit.score:.1f}\\%" if audit.score is not None else "---"
            nc = sum(1 for it in audit.items if it.result == "NO_CONFORME")
            status = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
            doc.append(NoEscape(
                rf"""{audit.code} & {area_name} & {audit.auditor[:20]} & {audit.shift} & {score} & {nc} & {status} \\\\
                \midrule"""
            ))
        doc.append(NoEscape(r"\bottomrule"))
        doc.append(NoEscape(r"\end{tabular}"))

        # 4. Graficos
        doc.append(NoEscape(r"\section{Detalles Gráficos Globales}"))
        if chart_path:
            doc.append(NoEscape(r"\begin{center}"))
            doc.append(NoEscape(rf"\includegraphics[width=0.6\textwidth]{{{chart_path}}}"))
            doc.append(NoEscape(r"\end{center}"))
        else:
            doc.append(NoEscape("Gráfico no disponible."))
            
        doc.append(NoEscape(r"\newpage"))

        # 5. Tablas detalladas
        doc.append(NoEscape(r"\section{Detalle de Auditorías}"))
        for audit in audits:
            area_name = audit.area.name if audit.area else "---"
            score_str = f"{audit.score:.1f}\\%" if audit.score is not None else "---"
            doc.append(NoEscape(
                rf"""\begin{{center}}
                {{\large\textbf{{\textcolor{{bizki_blue}}{{{audit.code} — Detalle}}}}}}
                \end{{center}}
                \begin{{tabular}}{{@{{}}p{{0.48\linewidth}}p{{0.48\linewidth}}@{{}}}}
                \textbf{{Área:}} & {area_name} \\\\
                \textbf{{Turno:}} & {audit.shift} \\\\
                \textbf{{Auditor:}} & {audit.auditor} \\\\
                \textbf{{Puntaje:}} & \textbf{{{score_str}}} \\\\
                \end{{tabular}}
                \vspace{{10pt}}"""
            ))
            doc.append(NoEscape(
                r"""\begin{longtable}{@{}c p{2cm} p{6cm} p{2.5cm} p{3cm}@{}}
                \toprule
                \rowcolor{bizki_blue}
                \textcolor{white}{\textbf{\#}} &
                \textcolor{white}{\textbf{Norma}} &
                \textcolor{white}{\textbf{Punto de Control}} &
                \textcolor{white}{\textbf{Resultado}} &
                \textcolor{white}{\textbf{Comentario}} \\\\
                \midrule
                \endhead"""
            ))
            for item in audit.items:
                result_label = RESULT_LABELS.get(item.result, "Pendiente")
                comment = (item.comment or "").replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
                norm = item.norm.replace("&", "\\&").replace("_", "\\_")
                control = item.control_point.replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
                if item.result == "CONFORME":
                    color_cmd = r"\textcolor{conf_green}"
                elif item.result == "NO_CONFORME":
                    color_cmd = r"\textcolor{nc_red}"
                elif item.result == "OBSERVACION":
                    color_cmd = r"\textcolor{obs_orange}"
                else:
                    color_cmd = r"\textcolor{gray}"
                doc.append(NoEscape(
                    rf"""{item.order} & {norm} & {control} &
                    {color_cmd}{{\textbf{{{result_label}}}}} & \small {comment} \\\\
                    \midrule"""
                ))
            doc.append(NoEscape(r"\bottomrule"))
            doc.append(NoEscape(r"\end{longtable}"))
            doc.append(NoEscape(r"\vspace{16pt}"))
            
        doc.append(NoEscape(r"\newpage"))

        # 6. Evidencias
        doc.append(NoEscape(r"\section{Evidencias Fotográficas o Audiovisuales}"))
        doc.append(NoEscape(r"En este espacio se documentan las pruebas visuales relevantes de las desviaciones encontradas durante la jornada.\\\vspace{0.5cm}"))
        doc.append(NoEscape(
            r"""\begin{center}
            \begin{tabular}{|p{7cm}|p{7cm}|}
            \hline
            \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 1}} & \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 2}} \tabularnewline
            \hline
            \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 3}} & \vspace{4.5cm} \centering \textcolor{gray}{\textit{Espacio para Fotografía 4}} \tabularnewline
            \hline
            \end{tabular}
            \end{center}"""
        ))
        
        # 7. Recomendaciones
        doc.append(NoEscape(r"\section{Recomendaciones}"))
        doc.append(NoEscape("Se exhorta a los responsables de las áreas auditadas a revisar las No Conformidades listadas en la sección 5 y a documentar e implementar las Acciones Correctivas (CAPA) correspondientes en un plazo no mayor a 48 horas."))

        filepath = os.path.join(tmpdir, "daily_report")
        doc.generate_pdf(filepath, clean_tex=True, compiler="pdflatex",
                         compiler_args=["-interaction=nonstopmode"])
        pdf_path = filepath + ".pdf"
        with open(pdf_path, "rb") as f:
            return f.read()
