import io
import csv
from datetime import datetime
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)

from backend.models.schemas import RequirementStatement, RequirementStatus, ProjectWorkspace


class ExportService:
    """
    Export Service for Requirement Quality Copilot (Phase 2.5).
    Generates RFC 4180 CSV exports and publication-grade structured engineering PDF baselines.
    """

    @staticmethod
    def to_csv(requirements: List[RequirementStatement]) -> str:
        """
        Serialize requirements to RFC 4180 CSV format with UTF-8 encoding.
        """
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

        # Header row
        writer.writerow([
            "Requirement ID",
            "Project ID",
            "Category",
            "Section",
            "Requirement Text",
            "Status",
            "Rubric Score",
            "Clarity",
            "Verifiability",
            "Completeness",
            "Atomicity",
            "Consistency",
            "PM Target Value",
            "PM Author",
            "Technical Approver",
            "Hardware Rationale",
            "Signed Off At",
            "Version",
            "Updated At"
        ])

        for req in requirements:
            score_total = req.quality_score.overall if req.quality_score else ""
            clarity = req.quality_score.clarity if req.quality_score else ""
            verifiability = req.quality_score.verifiability if req.quality_score else ""
            completeness = req.quality_score.completeness if req.quality_score else ""
            atomicity = req.quality_score.atomicity if req.quality_score else ""
            consistency = req.quality_score.consistency if req.quality_score else ""

            pm_target = req.sign_off.pm_target_val if req.sign_off and req.sign_off.pm_target_val else ""
            pm_author = req.sign_off.pm_author if req.sign_off and req.sign_off.pm_author else ""
            tech_approver = req.sign_off.tech_lead_approver if req.sign_off and req.sign_off.tech_lead_approver else ""
            hw_rationale = req.sign_off.hardware_rationale if req.sign_off and req.sign_off.hardware_rationale else ""
            signed_at = req.sign_off.signed_off_at.isoformat() if req.sign_off and req.sign_off.signed_off_at else ""

            writer.writerow([
                req.id,
                req.project_id,
                req.category or "",
                req.section or "",
                req.text,
                req.status.value,
                score_total,
                clarity,
                verifiability,
                completeness,
                atomicity,
                consistency,
                pm_target,
                pm_author,
                tech_approver,
                hw_rationale,
                signed_at,
                req.version,
                req.updated_at.isoformat()
            ])

        return output.getvalue()

    @staticmethod
    def to_pdf(
        requirements: List[RequirementStatement],
        project: Optional[ProjectWorkspace] = None
    ) -> bytes:
        """
        Generate a structured engineering specification PDF baseline using ReportLab.
        Includes executive header, rubric metrics summary, categorized requirements,
        and dual-key governance audit trail.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        primary_color = colors.HexColor("#0F172A")    # Deep slate
        accent_blue = colors.HexColor("#0284C7")      # Sky blue
        text_dark = colors.HexColor("#1E293B")        # Slate 800
        text_muted = colors.HexColor("#64748B")       # Slate 500
        card_bg = colors.HexColor("#F8FAFC")          # Slate 50

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=primary_color
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=text_muted
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=accent_blue,
            spaceBefore=10,
            spaceAfter=6
        )
        meta_label = ParagraphStyle(
            "MetaLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=primary_color
        )
        meta_value = ParagraphStyle(
            "MetaVal",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=text_dark
        )
        req_id_style = ParagraphStyle(
            "ReqId",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=13,
            textColor=primary_color
        )
        req_text_style = ParagraphStyle(
            "ReqText",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=text_dark
        )
        signoff_style = ParagraphStyle(
            "SignoffText",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#334155")
        )

        story = []

        # 1. Document Header & Seal
        proj_name = project.project_name if project else "Enterprise Workspace"
        proj_domain = project.domain if project else "Embedded Systems"
        proj_id = project.project_id if project else "default_project"

        story.append(Paragraph("REQUIREMENT QUALITY AUDIT & ENGINEERING BASELINE", title_style))
        story.append(Paragraph(
            f"Dual-Key Certified Specification • Qualcomm Cloud AI 100 Accelerated • Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            subtitle_style
        ))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceAfter=12))

        # 2. Project Metadata Table
        locked_count = sum(1 for r in requirements if r.status == RequirementStatus.LOCKED_BASELINE)
        prov_count = sum(1 for r in requirements if r.status == RequirementStatus.PROVISIONAL_PM)
        tbd_count = sum(1 for r in requirements if r.status == RequirementStatus.FLAGGED_TBD)
        total_reqs = len(requirements)
        lock_pct = f"{(locked_count / total_reqs * 100):.1f}%" if total_reqs > 0 else "0.0%"

        scores = [r.quality_score.overall for r in requirements if r.quality_score is not None]
        avg_score = f"{(sum(scores) / len(scores)):.1f}/100" if scores else "N/A"

        meta_data = [
            [
                Paragraph("Project Name:", meta_label), Paragraph(proj_name, meta_value),
                Paragraph("Total Statements:", meta_label), Paragraph(str(total_reqs), meta_value)
            ],
            [
                Paragraph("Project ID / Domain:", meta_label), Paragraph(f"{proj_id} ({proj_domain})", meta_value),
                Paragraph("Locked Baselines:", meta_label), Paragraph(f"{locked_count} ({lock_pct})", meta_value)
            ],
            [
                Paragraph("Governance Status:", meta_label), Paragraph(f"🟡 {prov_count} Prov | 🔴 {tbd_count} TBD", meta_value),
                Paragraph("Mean Rubric Score:", meta_label), Paragraph(avg_score, meta_value)
            ]
        ]

        meta_table = Table(meta_data, colWidths=[1.4 * inch, 2.5 * inch, 1.4 * inch, 1.7 * inch])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 14))

        # 3. Itemized Requirements Catalog
        story.append(Paragraph("SPECIFICATION STATEMENTS & DUAL-KEY AUDIT TRAIL", h2_style))

        if not requirements:
            story.append(Paragraph("No requirements currently match the specified filter in this project workspace.", subtitle_style))
        else:
            for req in requirements:
                # Color code status
                if req.status == RequirementStatus.LOCKED_BASELINE:
                    status_color = colors.HexColor("#10B981") # Green
                    status_text = "LOCKED BASELINE (GREEN)"
                elif req.status == RequirementStatus.PROVISIONAL_PM:
                    status_color = colors.HexColor("#F59E0B") # Amber
                    status_text = "PROVISIONAL PM (AMBER)"
                else:
                    status_color = colors.HexColor("#EF4444") # Red
                    status_text = "FLAGGED TBD (RED)"

                score_badge = f"Rubric: {req.quality_score.overall}/100" if req.quality_score else "Rubric: Pending"
                sec_cat = f"{req.category or 'General'} • {req.section or 'General'}"

                # Card Header
                hdr_p = Paragraph(f"<b>{req.id}</b>  |  <font color='{status_color.hexval()}'><b>[{status_text}]</b></font>  |  {sec_cat}  |  <b>{score_badge}</b>", req_id_style)
                text_p = Paragraph(f"\"{req.text}\"", req_text_style)

                card_elements = [
                    [hdr_p],
                    [Spacer(1, 3)],
                    [text_p]
                ]

                # Dual-Key Sign-Off Info if present
                if req.sign_off and (req.sign_off.pm_target_val or req.sign_off.tech_lead_approver or req.sign_off.hardware_rationale):
                    sign_info = []
                    if req.sign_off.pm_target_val:
                        sign_info.append(f"<b>PM Target Value:</b> {req.sign_off.pm_target_val} (by {req.sign_off.pm_author or 'PM'})")
                    if req.sign_off.tech_lead_approver:
                        sign_info.append(f"<b>Technical Sign-Off:</b> {req.sign_off.tech_lead_approver}")
                    if req.sign_off.hardware_rationale:
                        sign_info.append(f"<b>Hardware Rationale:</b> {req.sign_off.hardware_rationale}")
                    if req.sign_off.signed_off_at:
                        sign_info.append(f"<b>Timestamp:</b> {req.sign_off.signed_off_at.strftime('%Y-%m-%d %H:%M UTC')}")
                    
                    card_elements.append([Spacer(1, 3)])
                    card_elements.append([Paragraph(" • ".join(sign_info), signoff_style)])

                req_table = Table(card_elements, colWidths=[7.0 * inch])
                req_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), card_bg),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("LINELEFT", (0, 0), (0, -1), 3.0, status_color),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]))

                story.append(KeepTogether([req_table, Spacer(1, 8)]))

        doc.build(story)
        return buffer.getvalue()


export_service = ExportService()
