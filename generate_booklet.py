import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from generate_pdfs import PAPERS_DATA, NumberedCanvas, PRIMARY, ACCENT, SECONDARY, SUCCESS, BG_LIGHT, BORDER_COLOR, TEXT_MUTED

def generate_complete_booklet():
    out_dir = r"c:\Users\PREETI\German_Language\test_papers_pdf"
    web_dir = r"c:\Users\PREETI\German_Language\jaiman-web\public\downloads\test-papers"
    
    filename = "A1_German_Complete_10_Test_Papers_Booklet.pdf"
    out_path = os.path.join(out_dir, filename)
    web_path = os.path.join(web_dir, filename)

    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    cover_title = ParagraphStyle('CoverTitle', fontName='Helvetica-Bold', fontSize=24, leading=30, textColor=PRIMARY, alignment=1)
    cover_subtitle = ParagraphStyle('CoverSubtitle', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=ACCENT, alignment=1)
    cover_desc = ParagraphStyle('CoverDesc', fontName='Helvetica', fontSize=10, leading=14, textColor=TEXT_MUTED, alignment=1)
    
    title_style = ParagraphStyle('DocTitle', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=PRIMARY)
    subtitle_style = ParagraphStyle('DocSubTitle', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=ACCENT)
    desc_style = ParagraphStyle('DocDesc', fontName='Helvetica', fontSize=8.5, leading=11, textColor=TEXT_MUTED)
    instr_style = ParagraphStyle('InstrStyle', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=PRIMARY)
    q_num_style = ParagraphStyle('QNum', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=ACCENT)
    q_text_style = ParagraphStyle('QText', fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=PRIMARY)
    opt_style = ParagraphStyle('OptStyle', fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#2C3E50'))
    toc_title = ParagraphStyle('TOCTitle', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=PRIMARY)

    story = []

    # ── COVER PAGE ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>GERMAN WITH JAI</b>", ParagraphStyle('Brand', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=SECONDARY, alignment=1)))
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>A1 German Multiple-Choice<br/>Practice Test Papers</b>", cover_title))
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>For English Speakers Learning German from Scratch</b>", cover_subtitle))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="60%", thickness=2, color=ACCENT, spaceAfter=20, spaceBefore=10, hAlign='CENTER'))
    story.append(Paragraph("<b>10 Comprehensive Test Papers &nbsp;•&nbsp; 150 Questions &nbsp;•&nbsp; Complete Answer Key & Evaluation</b>", cover_desc))
    story.append(Spacer(1, 30))

    # Features Box on Cover
    features = [
        ["📖 <b>10 Structured Topic Papers</b>", "Greetings, Numbers, Verbs, Articles, Family, Colors, Time, Food, Question Words, Final Review"],
        ["🎯 <b>150 Multiple-Choice Questions</b>", "Designed for beginners with clear English explanations and options"],
        ["⏱️ <b>Timed 20-Min Practice Format</b>", "Simulates authentic Goethe-Zertifikat A1 vocabulary & grammar standards"],
        ["🏆 <b>Complete Answer Key & Scale</b>", "Instant scoring criteria to evaluate CEFR A1 proficiency readiness"]
    ]
    f_data = [[Paragraph(f[0], instr_style), Paragraph(f[1], desc_style)] for f in features]
    f_table = Table(f_data, colWidths=[200, 323])
    f_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(f_table)

    # ── Table of Contents ────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("<b>Table of Contents — Test Series Overview</b>", toc_title))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=12, spaceBefore=4))

    toc_rows = [["<b>Paper</b>", "<b>Topic & German Focus</b>", "<b>Questions</b>", "<b>Target CEFR</b>"]]
    for p in PAPERS_DATA:
        toc_rows.append([
            f"<b>Paper {p['id']}</b>",
            f"{p['title']} <i>({p['subtitle']})</i>",
            "15 MCQs",
            "A1"
        ])
    toc_table = Table(toc_rows, colWidths=[65, 330, 75, 53])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FAFAFA'), colors.white]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 15))

    # ── EACH TEST PAPER ──────────────────────────────────────────────────────
    LETTERS = ['A', 'B', 'C', 'D']
    for paper in PAPERS_DATA:
        story.append(PageBreak())

        # Header
        brand_table_data = [
            [
                Paragraph("<b>GERMAN WITH JAI</b><br/><font size='7.5' color='#666666'>A1 German Test Series • Practice Booklet</font>", title_style),
                Paragraph(f"<font size='9' color='#E53935'><b>TEST PAPER {paper['id']} OF 10</b></font><br/><font size='7.5' color='#4361EE'><b>Level: CEFR A1</b></font>", ParagraphStyle('RightH', parent=title_style, alignment=2))
            ]
        ]
        brand_table = Table(brand_table_data, colWidths=[320, 203])
        brand_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(brand_table)
        story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8, spaceBefore=4))

        story.append(Paragraph(f"Test Paper {paper['id']}: {paper['title']}", title_style))
        story.append(Paragraph(f"<b>German Topic:</b> {paper['subtitle']}", subtitle_style))
        story.append(Paragraph(paper['description'], desc_style))
        story.append(Spacer(1, 6))

        # Student info box
        info_data = [
            [
                Paragraph("<b>Student Name:</b> ___________________________", desc_style),
                Paragraph("<b>Date:</b> _____________", desc_style),
                Paragraph("<b>Score:</b> ____ / 15", desc_style),
                Paragraph("<b>Time:</b> 20 Min", desc_style)
            ]
        ]
        info_table = Table(info_data, colWidths=[190, 110, 110, 113])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 6))

        # 15 questions
        for idx, (q_text, opts, _) in enumerate(paper['questions'], 1):
            opt_a = f"<b>A)</b> {opts[0]}"
            opt_b = f"<b>B)</b> {opts[1]}"
            opt_c = f"<b>C)</b> {opts[2]}"
            opt_d = f"<b>D)</b> {opts[3]}"

            q_row_data = [
                [
                    Paragraph(f"<b>{idx}.</b>", q_num_style),
                    Paragraph(f"<b>{q_text}</b>", q_text_style)
                ]
            ]
            q_header_table = Table(q_row_data, colWidths=[20, 503])
            q_header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))

            opts_data = [
                [Paragraph(opt_a, opt_style), Paragraph(opt_b, opt_style)],
                [Paragraph(opt_c, opt_style), Paragraph(opt_d, opt_style)]
            ]
            opts_table = Table(opts_data, colWidths=[250, 253])
            opts_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 1),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ]))

            q_block = Table(
                [[q_header_table], [opts_table]],
                colWidths=[523]
            )
            bg = colors.HexColor('#FAFAFA') if idx % 2 == 0 else colors.white
            q_block.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), bg),
                ('BOX', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))

            story.append(KeepTogether(q_block))
            story.append(Spacer(1, 3))

    # ── MASTER ANSWER KEY SECTION (END OF BOOKLET) ───────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("<b>Comprehensive Answer Key (Papers 1–10)</b>", toc_title))
    story.append(Paragraph("Check your answers for all 150 questions across the 10 practice test papers.", desc_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SUCCESS, spaceAfter=12, spaceBefore=4))

    master_key_rows = [["<b>Paper</b>", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15"]]
    for paper in PAPERS_DATA:
        row = [f"<b>Paper {paper['id']}</b>"] + [f"<b>{paper['questions'][i][2]}</b>" for i in range(15)]
        master_key_rows.append(row)

    master_key_table = Table(master_key_rows, colWidths=[73] + [30]*15)
    master_key_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#A5D6A7')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#E8FBF0'), colors.white]),
        ('TEXTCOLOR', (1, 1), (-1, -1), colors.HexColor('#1E7E34')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    story.append(master_key_table)
    story.append(Spacer(1, 15))

    doc.build(story, canvasmaker=NumberedCanvas)
    
    # Copy to web public directory
    import shutil
    shutil.copy(out_path, web_path)
    print("Successfully created Complete 10-in-1 Test Papers Booklet PDF!")

if __name__ == '__main__':
    generate_complete_booklet()
