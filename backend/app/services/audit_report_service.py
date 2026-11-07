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
from pathlib import Path

from PIL import Image as PILImage

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

from app.models.audit import Audit, AuditItem
from app.utils.file_storage import BASE_STORAGE

LOGO_HIGUAMO_PATH = Path(__file__).resolve().parent.parent / "static" / "logo_molinos_del_higuamo.png"

def _is_higuamo_plant(plant: str | None) -> bool:
    if not plant:
        return True  # Por defecto o histórico en el sistema MDH
    p = str(plant).strip().lower()
    return "higuam" in p or "mdh" in p or "molino" in p

def _resolve_evidence_image_path(evidence_url: str | None) -> Path | None:
    if not evidence_url or not isinstance(evidence_url, str):
        return None
    url_clean = evidence_url.strip().split("?")[0].split("#")[0]
    if not url_clean:
        return None
    
    filename = url_clean.replace("\\", "/").split("/")[-1]
    if not filename:
        return None

    backend_app_dir = Path(__file__).resolve().parent.parent
    backend_dir = backend_app_dir.parent
    project_root = backend_dir.parent

    candidates = [
        BASE_STORAGE / "audits" / filename,
        BASE_STORAGE / filename,
        backend_dir / "storage" / "audits" / filename,
        backend_dir / "storage" / filename,
        project_root / "storage" / "audits" / filename,
        Path("storage") / "audits" / filename,
        Path("storage") / filename,
        Path.cwd() / "storage" / "audits" / filename,
        Path.cwd() / "backend" / "storage" / "audits" / filename,
    ]
    for c in candidates:
        if c and c.is_file():
            if c.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]:
                return c
    return None

def _create_reportlab_image_fitted(img_path: Path, max_width_cm: float, max_height_cm: float) -> Image:
    """Crea un objeto Image de ReportLab escalado proporcionalmente sin deformar."""
    try:
        with PILImage.open(img_path) as im:
            w_px, h_px = im.size
            if w_px <= 0 or h_px <= 0:
                return Image(str(img_path), width=max_width_cm*cm, height=max_height_cm*cm)
            scale = min((max_width_cm * cm) / w_px, (max_height_cm * cm) / h_px)
            return Image(str(img_path), width=w_px * scale, height=h_px * scale)
    except Exception:
        return Image(str(img_path), width=max_width_cm*cm, height=max_height_cm*cm)

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
    
    plant_str = audit.plant or (audit.area.plant if audit.area and audit.area.plant else "MDH")
    is_higuamo = _is_higuamo_plant(plant_str)

    # Portada
    elements.append(Spacer(1, 1.2*cm))
    if is_higuamo and LOGO_HIGUAMO_PATH.exists():
        elements.append(_create_reportlab_image_fitted(LOGO_HIGUAMO_PATH, 5.0, 4.5))
        elements.append(Spacer(1, 0.6*cm))
    elements.append(Paragraph("<b>INFORME DE AUDITORÍA BPM</b>", title_style))
    elements.append(Spacer(1, 1.0*cm))
    elements.append(Paragraph(f"<b>Código:</b> {audit.code}", ParagraphStyle('C', parent=normal_style, alignment=TA_CENTER, fontSize=14)))
    elements.append(Paragraph(f"<b>Fecha:</b> {_fmt_date(audit.audit_date)}", ParagraphStyle('D', parent=normal_style, alignment=TA_CENTER, fontSize=12)))
    elements.append(Spacer(1, 1.5*cm))
    if is_higuamo:
        elements.append(Paragraph("<b>Molinos del Higuamo</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER, fontSize=13, textColor=colors.HexColor("#0D47A1"))))
    else:
        elements.append(Paragraph(f"<b>Planta: {plant_str}</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER, fontSize=13)))
    elements.append(Spacer(1, 3.0*cm))
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
    elements.append(Paragraph(f"<b>Alcance:</b> Área auditada: {area_name}. Gerencia: {audit.management or audit.shift or 'General'}.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Datos generales
    elements.append(Paragraph("<b>3. Información General</b>", subtitle_style))
    score_str = f"{audit.score:.1f}%" if audit.score is not None else "---"
    status_str = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
    
    obj_str = (audit.measurement_objective or "General BPM")[:35]
    plant_str = audit.plant or (audit.area.plant if audit.area and audit.area.plant else "MDH")
    resp_area_str = audit.area_responsible or "---"
    data = [
        ["Código:", audit.code, "Fecha:", _fmt_date(audit.audit_date)],
        ["Planta:", plant_str, "Área:", area_name],
        ["Gerencia:", audit.management or audit.shift or "---", "Resp. de Área:", resp_area_str],
        ["Auditor:", audit.auditor, "Estado:", status_str],
        ["Puntaje:", score_str, "Objetivo:", obj_str]
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
            cmt = item.comment or ""
            if item.non_compliant_collaborators:
                cmt += f"<br/><b>Colaboradores:</b> {item.non_compliant_collaborators}"
            items_data.append([
                str(item.order), item.norm, Paragraph(item.control_point, normal_style),
                RESULT_LABELS.get(item.result, "Pendiente"), Paragraph(cmt, normal_style)
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
        elements.append(Paragraph("Registro fotográfico y documental de los puntos de control evaluados durante la auditoría.", normal_style))
        elements.append(Spacer(1, 0.5*cm))

        items_with_ev = [it for it in audit.items if it.evidence_url and str(it.evidence_url).strip()]

        if not items_with_ev:
            empty_table = Table([[
                Paragraph("<i>No se registraron evidencias fotográficas digitales en los puntos evaluados de esta auditoría.</i>", ParagraphStyle('EvEmpty', parent=normal_style, alignment=TA_CENTER, textColor=colors.HexColor("#757575")))
            ]], colWidths=[17*cm], rowHeights=[2.5*cm])
            empty_table.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BDBDBD")),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            elements.append(empty_table)
            elements.append(Spacer(1, 0.8*cm))
        else:
            ev_label_style = ParagraphStyle('EvLbl', parent=normal_style, fontSize=8.5, leading=11, fontName='Helvetica-Bold', textColor=colors.HexColor("#37474F"))
            ev_val_style = ParagraphStyle('EvVal', parent=normal_style, fontSize=8.5, leading=11, textColor=colors.black)
            
            for item in items_with_ev:
                img_path = _resolve_evidence_image_path(item.evidence_url)
                
                # Columna Izquierda: Imagen
                if img_path:
                    img_elem = _create_reportlab_image_fitted(img_path, 6.8, 5.0)
                else:
                    img_elem = Paragraph(f"<b>Evidencia documental/enlace:</b><br/>{item.evidence_url}", ParagraphStyle('NoImg', parent=normal_style, fontSize=8, textColor=colors.HexColor("#757575"), alignment=TA_CENTER))

                # Columna Derecha: Detalles del ítem
                res_color = "#2E7D32" if item.result == "CONFORME" else ("#C62828" if item.result == "NO_CONFORME" else "#E65100")
                res_badge = f'<font color="{res_color}"><b>{RESULT_LABELS.get(item.result, item.result or "---")}</b></font>'
                
                colab_str = item.non_compliant_collaborators or "<i>Ninguno</i>"
                comm_str = item.comment or "<i>Sin comentarios</i>"

                details = [
                    [Paragraph("<b>Ítem / Norma:</b>", ev_label_style), Paragraph(f"<b>{item.norm}</b> (Ítem #{item.order})", ev_val_style)],
                    [Paragraph("<b>Punto de Control:</b>", ev_label_style), Paragraph(item.control_point, ev_val_style)],
                    [Paragraph("<b>Resultado:</b>", ev_label_style), Paragraph(res_badge, ev_val_style)],
                    [Paragraph("<b>Colaboradores:</b>", ev_label_style), Paragraph(colab_str, ev_val_style)],
                    [Paragraph("<b>Comentarios:</b>", ev_label_style), Paragraph(comm_str, ev_val_style)],
                ]
                t_details = Table(details, colWidths=[2.8*cm, 6.8*cm])
                t_details.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))

                card_data = [[img_elem, t_details]]
                t_card = Table(card_data, colWidths=[7.2*cm, 9.8*cm])
                t_card.setStyle(TableStyle([
                    ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#CFD8DC")),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8F9FA")),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ]))
                elements.append(t_card)
                elements.append(Spacer(1, 0.4*cm))
            elements.append(Spacer(1, 0.4*cm))
        
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

def _generate_daily_report_pdf_reportlab(
    audits: list[Audit],
    report_date: date,
    end_date: date | None = None,
    area_name: str | None = None,
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=2.5*cm, bottomMargin=2.5*cm)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.HexColor("#1976D2"), alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitleStyle', parent=styles['Heading2'], textColor=colors.HexColor("#1976D2"))
    sub3_style = ParagraphStyle('Sub3Style', parent=styles['Heading3'], textColor=colors.HexColor("#1565C0"), fontSize=11)
    normal_style = styles['Normal']
    cell_style = ParagraphStyle('CellStyle', parent=normal_style, fontSize=8.5, leading=11)
    
    elements = []
    
    is_range = bool(end_date and end_date != report_date)
    date_str = (
        f"{report_date.strftime('%d/%m/%Y')} al {end_date.strftime('%d/%m/%Y')}"
        if is_range and end_date
        else report_date.strftime("%d/%m/%Y")
    )
    if area_name:
        report_title = f"INFORME DE AUDITORÍAS POR ÁREA — {area_name.upper()}"
    elif is_range:
        report_title = "INFORME CONSOLIDADO DE AUDITORÍAS POR ÁREA"
    else:
        report_title = "INFORME DIARIO DE AUDITORÍAS"
    
    is_higuamo = any(_is_higuamo_plant(au.plant or (au.area.plant if au.area else None)) for au in audits) if audits else True

    # Portada
    elements.append(Spacer(1, 1.2*cm))
    if is_higuamo and LOGO_HIGUAMO_PATH.exists():
        elements.append(_create_reportlab_image_fitted(LOGO_HIGUAMO_PATH, 5.0, 4.5))
        elements.append(Spacer(1, 0.6*cm))
    elements.append(Paragraph(f"<b>{report_title}</b>", title_style))
    elements.append(Spacer(1, 1.0*cm))
    elements.append(Paragraph(f"<b>Período / Fecha:</b> {date_str}", ParagraphStyle('C', parent=normal_style, alignment=TA_CENTER, fontSize=13)))
    elements.append(Spacer(1, 0.4*cm))
    elements.append(Paragraph(f"<b>Área evaluada:</b> {area_name or 'Todas las áreas'}", ParagraphStyle('CArea', parent=normal_style, alignment=TA_CENTER, fontSize=12)))
    elements.append(Spacer(1, 1.5*cm))
    if is_higuamo:
        elements.append(Paragraph("<b>Molinos del Higuamo</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER, fontSize=13, textColor=colors.HexColor("#0D47A1"))))
    else:
        elements.append(Paragraph("<b>MDH Quality Suite</b>", ParagraphStyle('B', parent=normal_style, alignment=TA_CENTER, fontSize=13)))
    elements.append(Spacer(1, 2.5*cm))
    elements.append(Paragraph(f"<b>Auditorías registradas:</b> {len(audits)}", ParagraphStyle('A', parent=normal_style, alignment=TA_CENTER)))
    elements.append(PageBreak())
    
    # Introduccion
    elements.append(Paragraph("<b>1. Introducción</b>", subtitle_style))
    elements.append(Paragraph(f"El presente informe consolida los resultados de las auditorías llevadas a cabo durante el período {date_str}{' en el área de ' + area_name if area_name else ''}. Su objetivo es presentar un panorama integral del nivel de cumplimiento normativo por área y fecha.", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    elements.append(Paragraph("<b>2. Objetivos y Alcance</b>", subtitle_style))
    elements.append(Paragraph("<b>Objetivos:</b> Proporcionar una visión consolidada por área y fechas evaluadas dentro del período, consolidar indicadores gráficos y promover la toma de decisiones.", normal_style))
    elements.append(Paragraph(f"<b>Alcance:</b> {'Área ' + area_name if area_name else 'Todas las áreas productivas y operativas auditadas'} en las fechas registradas durante el período ({date_str}).", normal_style))
    elements.append(Spacer(1, 0.5*cm))
    
    # Resumen
    elements.append(Paragraph("<b>3. Información General Consolidada</b>", subtitle_style))

    # 3.1 Consolidado por Área con múltiples fechas
    area_groups: dict[str, list[Audit]] = {}
    for au in audits:
        a_label = au.area.name if au.area else "Sin Área"
        area_groups.setdefault(a_label, []).append(au)

    elements.append(Paragraph("<b>3.1 Consolidado por Área, Planta y Fechas Evaluadas</b>", sub3_style))
    area_summary_data = [["Área", "Planta", "Cant.", "Fechas Evaluadas en el Período", "Promedio", "Total NC"]]
    for a_label, au_list in area_groups.items():
        plant_label = next((au.plant or (au.area.plant if au.area else None) for au in au_list if au.plant or (au.area and au.area.plant)), "MDH")
        unique_dates = sorted({au.audit_date for au in au_list if au.audit_date})
        dates_formatted = ", ".join(d.strftime("%d/%m/%Y") for d in unique_dates)
        scored = [au.score for au in au_list if au.score is not None]
        avg_score = f"{(sum(scored) / len(scored)):.1f}%" if scored else "---"
        total_nc = sum(sum(1 for it in au.items if it.result == "NO_CONFORME") for au in au_list)
        area_summary_data.append([
            Paragraph(f"<b>{a_label}</b>", cell_style),
            Paragraph(str(plant_label), cell_style),
            str(len(au_list)),
            Paragraph(dates_formatted, cell_style),
            avg_score,
            str(total_nc),
        ])

    t_areas = Table(area_summary_data, colWidths=[3*cm, 3*cm, 1.3*cm, 6*cm, 2.2*cm, 1.8*cm], repeatRows=1)
    t_areas.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1565C0")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t_areas)
    elements.append(Spacer(1, 0.6*cm))

    # 3.2 Listado detallado por Área y Fecha
    elements.append(Paragraph("<b>3.2 Detalle de Auditorías por Planta, Área y Fecha</b>", sub3_style))
    summary_data = [["Código", "Planta", "Área", "Resp. Área", "Fecha", "Auditor", "Gerencia", "Puntaje", "NC", "Estado"]]
    for audit in audits:
        p_name = (audit.plant or (audit.area.plant if audit.area and audit.area.plant else "MDH"))[:16]
        a_name = (audit.area.name if audit.area else "---")[:13]
        resp_area = (audit.area_responsible or "---")[:13]
        au_date_str = audit.audit_date.strftime("%d/%m/%Y") if audit.audit_date else "---"
        score = f"{audit.score:.1f}%" if audit.score is not None else "---"
        nc = str(sum(1 for it in audit.items if it.result == "NO_CONFORME"))
        status = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
        mgmt_str = (audit.management or audit.shift or "---")[:13]
        summary_data.append([audit.code, p_name, a_name, resp_area, au_date_str, audit.auditor[:13], mgmt_str, score, nc, status])
        
    t = Table(summary_data, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1976D2")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
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
            au_area_lbl = audit.area.name if audit.area else "---"
            au_date_lbl = audit.audit_date.strftime("%d/%m/%Y") if audit.audit_date else "---"
            elements.append(Paragraph(f"<b>{audit.code} — {au_area_lbl} ({au_date_lbl}) — Detalle</b>", ParagraphStyle('SubSub', parent=normal_style, textColor=colors.HexColor("#1976D2"), fontSize=12)))
            elements.append(Spacer(1, 0.3*cm))
            items_data = [["#", "Norma", "Punto de Control", "Resultado", "Comentario"]]
            for item in audit.items:
                cmt = item.comment or ""
                if item.non_compliant_collaborators:
                    cmt += f"<br/><b>Colaboradores:</b> {item.non_compliant_collaborators}"
                items_data.append([
                    str(item.order), item.norm, Paragraph(item.control_point, normal_style),
                    RESULT_LABELS.get(item.result, "Pendiente"), Paragraph(cmt, normal_style)
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
        elements.append(Paragraph("Registro fotográfico y documental recopilado en las auditorías del período evaluado.", normal_style))
        elements.append(Spacer(1, 0.5*cm))

        all_evidence_items: list[tuple[Audit, AuditItem]] = []
        for au in audits:
            for it in au.items:
                if it.evidence_url and str(it.evidence_url).strip():
                    all_evidence_items.append((au, it))

        if not all_evidence_items:
            empty_table = Table([[
                Paragraph("<i>No se registraron evidencias fotográficas digitales en las auditorías de este período.</i>", ParagraphStyle('EvEmptyDaily', parent=normal_style, alignment=TA_CENTER, textColor=colors.HexColor("#757575")))
            ]], colWidths=[17.5*cm], rowHeights=[2.5*cm])
            empty_table.setStyle(TableStyle([
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BDBDBD")),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            elements.append(empty_table)
            elements.append(Spacer(1, 0.8*cm))
        else:
            ev_label_style = ParagraphStyle('EvLblD', parent=normal_style, fontSize=8.5, leading=11, fontName='Helvetica-Bold', textColor=colors.HexColor("#37474F"))
            ev_val_style = ParagraphStyle('EvValD', parent=normal_style, fontSize=8.5, leading=11, textColor=colors.black)

            for au, item in all_evidence_items:
                img_path = _resolve_evidence_image_path(item.evidence_url)
                if img_path:
                    img_elem = _create_reportlab_image_fitted(img_path, 6.8, 5.0)
                else:
                    img_elem = Paragraph(f"<b>Evidencia documental/enlace:</b><br/>{item.evidence_url}", ParagraphStyle('NoImgD', parent=normal_style, fontSize=8, textColor=colors.HexColor("#757575"), alignment=TA_CENTER))

                res_color = "#2E7D32" if item.result == "CONFORME" else ("#C62828" if item.result == "NO_CONFORME" else "#E65100")
                res_badge = f'<font color="{res_color}"><b>{RESULT_LABELS.get(item.result, item.result or "---")}</b></font>'
                
                colab_str = item.non_compliant_collaborators or "<i>Ninguno</i>"
                comm_str = item.comment or "<i>Sin comentarios</i>"
                a_name = au.area.name if au.area else "Sin Área"
                plant_name = au.plant or (au.area.plant if au.area else "MDH")

                details = [
                    [Paragraph("<b>Auditoría:</b>", ev_label_style), Paragraph(f"<b>{au.code}</b> ({_fmt_date(au.audit_date)}) — {a_name} ({plant_name})", ev_val_style)],
                    [Paragraph("<b>Punto / Norma:</b>", ev_label_style), Paragraph(f"<b>{item.norm}</b> — {item.control_point}", ev_val_style)],
                    [Paragraph("<b>Resultado:</b>", ev_label_style), Paragraph(res_badge, ev_val_style)],
                    [Paragraph("<b>Colaboradores:</b>", ev_label_style), Paragraph(colab_str, ev_val_style)],
                    [Paragraph("<b>Comentarios:</b>", ev_label_style), Paragraph(comm_str, ev_val_style)],
                ]
                t_details = Table(details, colWidths=[2.8*cm, 7.3*cm])
                t_details.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                ]))

                card_data = [[img_elem, t_details]]
                t_card = Table(card_data, colWidths=[7.2*cm, 10.3*cm])
                t_card.setStyle(TableStyle([
                    ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#CFD8DC")),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8F9FA")),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ]))
                elements.append(t_card)
                elements.append(Spacer(1, 0.4*cm))
            elements.append(Spacer(1, 0.4*cm))
        
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

        doc.preamble.append(NoEscape(r"\definecolor{mdh_blue}{RGB}{25,118,210}"))
        doc.preamble.append(NoEscape(r"\definecolor{conf_green}{RGB}{46,125,50}"))
        doc.preamble.append(NoEscape(r"\definecolor{nc_red}{RGB}{198,40,40}"))
        doc.preamble.append(NoEscape(r"\definecolor{obs_orange}{RGB}{230,81,0}"))
        doc.preamble.append(NoEscape(r"\definecolor{header_blue}{RGB}{227,242,253}"))

        doc.preamble.append(NoEscape(r"\pagestyle{fancy}"))
        doc.preamble.append(NoEscape(r"\fancyhf{}"))
        doc.preamble.append(NoEscape(r"\fancyhead[L]{\textcolor{mdh_blue}{\textbf{MDH Quality Suite}}}"))
        doc.preamble.append(NoEscape(r"\fancyhead[R]{\textcolor{gray}{\small Informe de Auditoría}}"))
        doc.preamble.append(NoEscape(r"\fancyfoot[C]{\textcolor{gray}{\small Página \thepage}}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\headrulewidth}{0.5pt}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\footrulewidth}{0.3pt}"))

        # Portada
        plant_str = audit.plant or (audit.area.plant if audit.area and audit.area.plant else "MDH")
        is_higuamo = _is_higuamo_plant(plant_str)

        doc.append(NoEscape(r"\begin{titlepage}"))
        doc.append(NoEscape(r"\begin{center}"))
        doc.append(NoEscape(r"\vspace*{1cm}"))
        if is_higuamo and LOGO_HIGUAMO_PATH.exists():
            logo_tex = LOGO_HIGUAMO_PATH.as_posix()
            doc.append(NoEscape(rf"\includegraphics[width=4.5cm]{{{logo_tex}}}\\[0.8cm]"))
        doc.append(NoEscape(r"{\color{mdh_blue}\rule{\linewidth}{1.5pt}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\LARGE\textbf{\textcolor{mdh_blue}{INFORME DE AUDITOR\'IA BPM}}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\color{mdh_blue}\rule{\linewidth}{1.5pt}}\\[1.5cm]"))
        doc.append(NoEscape(rf"{{\Large Código: {audit.code}}}\\[0.5cm]"))
        doc.append(NoEscape(rf"{{\large Fecha: {_fmt_date(audit.audit_date)}}}\\[1.5cm]"))
        if is_higuamo:
            doc.append(NoEscape(r"{\Large\textbf{\textcolor{mdh_blue}{Molinos del Higuamo}}}\\[0.5cm]"))
        else:
            doc.append(NoEscape(rf"{{\Large\textbf{{Planta: {plant_str}}}}}\\[0.5cm]"))
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
            \multicolumn{{2}}{{l}}{{\textbf{{\textcolor{{mdh_blue}}{{Datos Generales}}}}}}\\
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
            \rowcolor{mdh_blue}
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
            if item.non_compliant_collaborators:
                clean_collabs = item.non_compliant_collaborators.replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
                comment += f" [Colab: {clean_collabs}]"
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

def generate_daily_report_pdf(
    audits: list[Audit],
    report_date: date,
    end_date: date | None = None,
    area_name: str | None = None,
) -> bytes:
    if not _pdflatex_available():
        return _generate_daily_report_pdf_reportlab(audits, report_date, end_date=end_date, area_name=area_name)

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

        doc.preamble.append(NoEscape(r"\definecolor{mdh_blue}{RGB}{25,118,210}"))
        doc.preamble.append(NoEscape(r"\definecolor{conf_green}{RGB}{46,125,50}"))
        doc.preamble.append(NoEscape(r"\definecolor{nc_red}{RGB}{198,40,40}"))
        doc.preamble.append(NoEscape(r"\definecolor{obs_orange}{RGB}{230,81,0}"))
        doc.preamble.append(NoEscape(r"\definecolor{header_blue}{RGB}{227,242,253}"))
        
        doc.preamble.append(NoEscape(r"\pagestyle{fancy}"))
        doc.preamble.append(NoEscape(r"\fancyhf{}"))
        doc.preamble.append(NoEscape(r"\fancyhead[L]{\textcolor{mdh_blue}{\textbf{MDH Quality Suite}}}"))
        doc.preamble.append(NoEscape(r"\fancyhead[R]{\textcolor{gray}{\small Informe Diario de Auditorías}}"))
        doc.preamble.append(NoEscape(r"\fancyfoot[C]{\textcolor{gray}{\small Página \thepage}}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\headrulewidth}{0.5pt}"))
        doc.preamble.append(NoEscape(r"\renewcommand{\footrulewidth}{0.3pt}"))

        # Portada
        is_range = bool(end_date and end_date != report_date)
        date_str = (
            f"{report_date.strftime('%d/%m/%Y')} al {end_date.strftime('%d/%m/%Y')}"
            if is_range and end_date
            else report_date.strftime("%d/%m/%Y")
        )
        area_title = area_name or "Todas las áreas"
        is_higuamo = any(_is_higuamo_plant(au.plant or (au.area.plant if au.area else None)) for au in audits) if audits else True

        doc.append(NoEscape(r"\begin{titlepage}"))
        doc.append(NoEscape(r"\begin{center}"))
        doc.append(NoEscape(r"\vspace*{1cm}"))
        if is_higuamo and LOGO_HIGUAMO_PATH.exists():
            logo_tex = LOGO_HIGUAMO_PATH.as_posix()
            doc.append(NoEscape(rf"\includegraphics[width=4.5cm]{{{logo_tex}}}\\[0.8cm]"))
        doc.append(NoEscape(r"{\color{mdh_blue}\rule{\linewidth}{1.5pt}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\LARGE\textbf{\textcolor{mdh_blue}{INFORME CONSOLIDADO DE AUDITOR\'IAS}}}\\[0.5cm]"))
        doc.append(NoEscape(r"{\color{mdh_blue}\rule{\linewidth}{1.5pt}}\\[1.5cm]"))
        doc.append(NoEscape(rf"{{\Large Período de Reporte: {date_str}}}\\[0.6cm]"))
        doc.append(NoEscape(rf"{{\large Área Evaluada: {area_title}}}\\[1.5cm]"))
        if is_higuamo:
            doc.append(NoEscape(r"{\Large\textbf{\textcolor{mdh_blue}{Molinos del Higuamo}}}\\[0.5cm]"))
        else:
            doc.append(NoEscape(r"\textbf{MDH Quality Suite}\\[0.5cm]"))
        doc.append(NoEscape(r"\vfill"))
        doc.append(NoEscape(rf"Cantidad de Auditorías Registradas: {len(audits)}"))
        doc.append(NoEscape(r"\end{center}"))
        doc.append(NoEscape(r"\end{titlepage}"))

        # Indice
        doc.append(NoEscape(r"\tableofcontents"))
        doc.append(NoEscape(r"\newpage"))

        # 1. Introduccion
        doc.append(NoEscape(r"\section{Introducción}"))
        doc.append(NoEscape("El presente informe consolida los resultados de las auditorías de procesos y calidad llevadas a cabo durante el período " + date_str + ". Su objetivo es presentar a la gerencia un panorama integral del nivel de cumplimiento normativo por área y fechas evaluadas."))
        
        # 2. Objetivos y Alcance
        doc.append(NoEscape(r"\section{Objetivos y Alcance}"))
        doc.append(NoEscape(r"\textbf{Objetivos:}\\ Proporcionar una visión integral de los hallazgos por área y fecha, consolidar indicadores gráficos y promover la toma de decisiones basada en los resultados agregados.\\\vspace{0.5cm}"))
        doc.append(NoEscape(rf"\textbf{{Alcance:}}\\ El informe abarca el área ({area_title}) y todos los turnos registrados durante el período ({date_str})."))
        
        # 3. Info General (Resumen)
        doc.append(NoEscape(r"\section{Información General Consolidada}"))
        doc.append(NoEscape(
            r"""\begin{tabular}{@{}p{2.2cm} p{2cm} p{2.8cm} p{2.5cm} p{1.4cm} p{1.4cm} p{1cm} p{1.5cm}@{}}
            \toprule
            \rowcolor{mdh_blue}
            \textcolor{white}{\textbf{Código}} &
            \textcolor{white}{\textbf{Fecha}} &
            \textcolor{white}{\textbf{Área}} &
            \textcolor{white}{\textbf{Auditor}} &
            \textcolor{white}{\textbf{Turno}} &
            \textcolor{white}{\textbf{Puntaje}} &
            \textcolor{white}{\textbf{NC}} &
            \textcolor{white}{\textbf{Estado}} \\\\
            \midrule"""
        ))
        for audit in audits:
            a_name = (audit.area.name if audit.area else "---")[:20]
            au_date = audit.audit_date.strftime("%d/%m/%Y") if audit.audit_date else "---"
            score = f"{audit.score:.1f}\\%" if audit.score is not None else "---"
            nc = sum(1 for it in audit.items if it.result == "NO_CONFORME")
            status = "Completada" if audit.status == "COMPLETADA" else "Pendiente"
            doc.append(NoEscape(
                rf"""{audit.code} & {au_date} & {a_name} & {audit.auditor[:18]} & {audit.shift} & {score} & {nc} & {status} \\\\
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
                {{\large\textbf{{\textcolor{{mdh_blue}}{{{audit.code} — Detalle}}}}}}
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
                \rowcolor{mdh_blue}
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
            if item.non_compliant_collaborators:
                clean_collabs = item.non_compliant_collaborators.replace("&", "\\&").replace("_", "\\_").replace("%", "\\%")
                comment += f" [Colab: {clean_collabs}]"
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
