import os
import re
import subprocess
import markdown
import pymupdf

def build_pdf_report():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    md_path = os.path.join(base_dir, "PROJECT_REPORT.md")
    html_path = os.path.join(base_dir, "PROJECT_REPORT.html")
    pdf_path = os.path.join(base_dir, "OmniClass_Project_Report.pdf")
    assets_dir = os.path.join(base_dir, "assets", "diagrams")

    print(f"Reading {md_path}...")
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Strip duplicate top headers (lines 1-4) since banner handles it
    md_text = re.sub(r'^#\s+MAJOR PROJECT REPORT\s*\n', '', md_text)
    md_text = re.sub(r'^##\s+OmniClass:[^\n]*\n', '', md_text)
    md_text = re.sub(r'^###\s+A Full-Stack AI-Powered[^\n]*\n', '', md_text)

    # Pre-process math and entities
    md_text = md_text.replace(r"$\ge 70\%$", "&ge; 70%")
    md_text = md_text.replace(r"\ge", "&ge;")
    md_text = md_text.replace("—", "&mdash;")
    md_text = md_text.replace("–", "&ndash;")
    md_text = md_text.replace("•", "&bull;")

    # Visual diagram replacements for the 7 mermaid blocks
    diagram_files = [
        ("fullstack_flow.svg", "Figure 1.1: OmniClass Full-Stack Application Flow & Communication"),
        ("functional_modules.svg", "Figure 5.1: 10 Core Functional Modules Architecture"),
        ("student_workflow.svg", "Figure 8.1: Learner Journey & Certification Lifecycle"),
        ("instructor_workflow.svg", "Figure 8.2: Faculty Curriculum Authoring & Review Workflow"),
        ("tech_stack.svg", "Figure 11.1: 4-Tier Technology Stack Matrix"),
        ("system_architecture.svg", "Figure 12.1: Enterprise 4-Tier Cloud Architecture"),
        ("development_roadmap.svg", "Figure 16.1: 10-Day Full-Stack Engineering Roadmap (All 10 Days Completed)")
    ]

    mermaid_blocks = list(re.finditer(r'```mermaid\s*\n(.*?)```', md_text, flags=re.DOTALL))
    print(f"Found {len(mermaid_blocks)} mermaid blocks to replace with visual pictures...")

    # Replace mermaid blocks in reverse order so offsets don't change
    for idx in reversed(range(len(mermaid_blocks))):
        m = mermaid_blocks[idx]
        svg_filename, caption = diagram_files[idx]
        svg_file_path = os.path.join(assets_dir, svg_filename)
        
        with open(svg_file_path, "r", encoding="utf-8") as sf:
            svg_content = sf.read()

        replacement = f'''\n\n<div class="diagram-wrapper">
  <div class="diagram-title-bar">
    <span class="diagram-pill">ARCHITECTURE VISUAL</span>
    <span class="diagram-caption">{caption}</span>
  </div>
  {svg_content}
</div>\n\n'''
        md_text = md_text[:m.start()] + replacement + md_text[m.end():]

    # Convert markdown to HTML
    body_html = markdown.markdown(
        md_text,
        extensions=['extra', 'tables', 'fenced_code', 'sane_lists']
    )

    # Post-process badges & checkmarks
    body_html = re.sub(
        r'<strong>PASSED</strong>',
        '<span class="badge badge-pass">PASSED</span>',
        body_html
    )
    body_html = re.sub(
        r'<strong>(PASS [^<]+)</strong>',
        r'<span class="badge badge-pass">\1</span>',
        body_html
    )
    body_html = body_html.replace(
        '[x]',
        '<span class="check-box checked">&#10003;</span>'
    )
    body_html = body_html.replace(
        '[ ]',
        '<span class="check-box">&#9634;</span>'
    )

    # Format section headings without forcing hard empty-page breaks
    def h2_repl(match):
        content = match.group(1).strip()
        num_match = re.match(r'^(\d+)\.\s*(.*)$', content)
        if num_match:
            sec_num = int(num_match.group(1))
            title = num_match.group(2)
            return f'<div class="section-title-wrap"><span class="section-pill">SECTION {sec_num}</span><h2 class="section-heading">{title}</h2></div>'
        return f'<h2 class="section-heading">{content}</h2>'

    body_html = re.sub(r'<h2>(.*?)</h2>', h2_repl, body_html)

    # Style blockquotes nicely
    body_html = body_html.replace(
        '<blockquote>',
        '<div class="callout-box"><div class="callout-indicator"></div><div class="callout-content">'
    )
    body_html = body_html.replace(
        '</blockquote>',
        '</div></div>'
    )

    # Build the full HTML document with executive print styling
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>OmniClass LMS - Major Project Report</title>
<style>
/* Page & Print Setup */
@page {{
    size: A4 portrait;
    margin: 16mm 15mm 16mm 15mm;
    @bottom-center {{
        content: "OmniClass LMS | Major Project Technical Report | Quillance Infotech Pvt. Ltd.";
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        font-size: 8pt;
        color: #64748b;
    }}
    @bottom-right {{
        content: "Page " counter(page);
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        font-size: 8pt;
        color: #64748b;
    }}
}}

* {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}}

body {{
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Inter', Roboto, sans-serif;
    font-size: 9.15pt;
    line-height: 1.48;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
}}

/* Top Official Header Banner */
.doc-header-banner {{
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 22px 24px;
    border-radius: 8px;
    margin-bottom: 22px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    page-break-inside: avoid;
    break-inside: avoid;
}}

.banner-top-row {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 10px;
    margin-bottom: 14px;
    white-space: nowrap;
}}

.org-name {{
    font-size: 10pt;
    font-weight: 800;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #93c5fd;
    white-space: nowrap;
}}

.project-track {{
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #e2e8f0;
    text-transform: uppercase;
    white-space: nowrap;
}}

.main-title {{
    font-size: 21pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0 0 6px 0;
    line-height: 1.2;
    color: #ffffff;
}}

.main-subtitle {{
    font-size: 10.5pt;
    font-weight: 400;
    color: #cbd5e1;
    margin: 0;
    line-height: 1.4;
}}

/* Section Headings */
.section-title-wrap {{
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 26px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    page-break-after: avoid !important;
    break-after: avoid !important;
}}

.section-pill {{
    background: #1e3a8a;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 4px;
    white-space: nowrap;
}}

h1 {{
    font-size: 18pt;
    font-weight: 800;
    color: #0f172a;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid !important;
    break-after: avoid !important;
}}

h2.section-heading {{
    font-size: 13.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.3px;
}}

h3 {{
    font-size: 11pt;
    font-weight: 700;
    color: #1e3a8a;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid !important;
    break-after: avoid !important;
}}

h4 {{
    font-size: 9.8pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid !important;
    break-after: avoid !important;
}}

p {{
    margin-top: 0;
    margin-bottom: 10px;
    text-align: justify;
}}

/* Visual Diagram Container */
.diagram-wrapper {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px 10px 14px;
    margin: 16px 0 20px 0;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.05);
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    text-align: center;
}}

.diagram-title-bar {{
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
}}

.diagram-pill {{
    background: #0f172a;
    color: #ffffff;
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 3px;
}}

.diagram-caption {{
    font-size: 8.5pt;
    font-weight: 600;
    color: #475569;
}}

.diagram-wrapper svg {{
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0 auto;
}}

/* Tables */
table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.6pt;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}}

th {{
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #1e3a8a;
    font-size: 8.5pt;
    letter-spacing: 0.3px;
}}

td {{
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
}}

tr:nth-child(even) td {{
    background-color: #f8fafc;
}}

tr:hover td {{
    background-color: #f1f5f9;
}}

/* Callout Boxes */
.callout-box {{
    display: flex;
    background-color: #f0f7ff;
    border: 1px solid #bae6fd;
    border-left: 4px solid #0284c7;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 16px 0;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
}}

.callout-content {{
    font-size: 9.2pt;
    color: #0c4a6e;
    line-height: 1.5;
}}

.callout-content p {{
    margin: 0 0 6px 0;
}}

.callout-content p:last-child {{
    margin-bottom: 0;
}}

/* Code Blocks */
pre {{
    background-color: #0f172a;
    color: #f8fafc;
    border-radius: 6px;
    padding: 12px 14px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.2pt;
    line-height: 1.45;
    overflow-x: auto;
    border: 1px solid #334155;
    margin: 12px 0 16px 0;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
}}

code {{
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
    color: #0f172a;
    background-color: #f1f5f9;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}}

pre code {{
    background-color: transparent;
    color: #f8fafc;
    padding: 0;
    border: none;
    font-size: 8.2pt;
}}

/* Badges & Checkmarks */
.badge {{
    display: inline-block;
    padding: 2px 8px;
    font-size: 7.8pt;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

.badge-pass {{
    background-color: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
}}

.check-box {{
    display: inline-block;
    width: 14px;
    height: 14px;
    line-height: 13px;
    text-align: center;
    border-radius: 3px;
    margin-right: 6px;
    font-size: 9pt;
    font-weight: bold;
}}

.check-box.checked {{
    color: #16a34a;
}}

/* Lists */
ul, ol {{
    margin-top: 0;
    margin-bottom: 12px;
    padding-left: 20px;
}}

li {{
    margin-bottom: 5px;
}}

/* Horizontal Divider */
hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16px 0;
}}

/* Footer Note */
.report-footer {{
    margin-top: 14px;
    padding-top: 8px;
    border-top: 2px solid #0f172a;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #64748b;
    font-weight: 600;
    page-break-inside: avoid;
    break-inside: avoid;
}}
</style>
</head>
<body>

<div class="doc-header-banner">
    <div class="banner-top-row">
        <span class="org-name">Quillance Infotech Pvt. Ltd.</span>
        <span class="project-track">Full Stack Web Development | Major Project Capstone</span>
    </div>
    <h1 class="main-title">OmniClass: Next-Generation LMS</h1>
    <div class="main-subtitle">A Full-Stack AI-Powered Platform for Digital Learning & Institutional Governance</div>
</div>

{body_html}

<div class="report-footer">
    <div>OmniClass Learning Management System | Major Project Report</div>
    <div>Quillance Infotech Student Project Brief | Evaluation Grade Standard: A+</div>
</div>

</body>
</html>
"""

    print(f"Writing {html_path}...")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)

    print("Launching Headless Chrome for print-to-pdf conversion...")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        chrome_path,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]

    subprocess.run(cmd, check=True)
    print(f"Successfully generated: {pdf_path}")

    if os.path.exists(pdf_path):
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"PDF Size: {size_kb:.2f} KB")
        doc = pymupdf.open(pdf_path)
        print(f"Total Pages in Report: {len(doc)}")
        
        # Check text density of every page to guarantee no empty or sparse pages
        sparse_pages = []
        for i, page in enumerate(doc):
            lines = [l.strip() for l in page.get_text().splitlines() if l.strip()]
            # Filter out running header/footer
            content_lines = [l for l in lines if not l.startswith("Page ") and not l.startswith("OmniClass LMS")]
            if len(content_lines) < 4:
                sparse_pages.append((i + 1, len(content_lines), content_lines))
        
        if sparse_pages:
            print("WARNING: Found sparse pages:", sparse_pages)
        else:
            print("ALL PAGES HAVE SOLID DENSITY! Zero empty/sparse pages detected.")

        doc.close()

if __name__ == "__main__":
    build_pdf_report()
