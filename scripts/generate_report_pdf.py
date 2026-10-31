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

    # Replace mermaid blocks with div.mermaid-box so mermaid.js renders them
    def mermaid_repl(match):
        content = match.group(1).strip()
        # Ensure any ampersands in mermaid are preserved
        return f'\n\n<div class="mermaid-box"><pre class="mermaid">\n{content}\n</pre></div>\n\n'

    md_text = re.sub(r'```mermaid\s*\n(.*?)```', mermaid_repl, md_text, flags=re.DOTALL)

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

    # Format section headings with page breaks on key sections
    # Major sections that start on a fresh page:
    break_sections = {1, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 22}

    def h2_repl(match):
        content = match.group(1).strip()
        num_match = re.match(r'^(\d+)\.\s*(.*)$', content)
        if num_match:
            sec_num = int(num_match.group(1))
            title = num_match.group(2)
            break_class = " page-break-before" if sec_num in break_sections else ""
            return f'<div class="section-title-wrap{break_class}"><span class="section-pill">SECTION {sec_num}</span><h2 class="section-heading">{title}</h2></div>'
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
<!-- Mermaid for vector diagrams -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
document.addEventListener("DOMContentLoaded", () => {{
    mermaid.initialize({{
        startOnLoad: true,
        theme: 'neutral',
        securityLevel: 'loose',
        flowchart: {{ useMaxWidth: false, htmlLabels: true, curve: 'basis' }},
        gantt: {{ axisFormat: '%b %d', barHeight: 22, fontSize: 11 }}
    }});
}});
</script>
<style>
/* Page & Print Setup */
@page {{
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
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
    font-size: 9.3pt;
    line-height: 1.55;
    color: #1e293b;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
}}

.page-break-before {{
    page-break-before: always !important;
    break-before: page !important;
}}

/* Top Official Header Banner */
.doc-header-banner {{
    background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
    color: #ffffff;
    padding: 22px 24px;
    border-radius: 8px;
    margin-bottom: 22px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
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
    margin-top: 24px;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
    page-break-after: avoid;
    break-after: avoid;
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
    page-break-after: avoid;
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
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
}}

h4 {{
    font-size: 9.8pt;
    font-weight: 700;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 6px;
    page-break-after: avoid;
}}

p {{
    margin-top: 0;
    margin-bottom: 10px;
    text-align: justify;
}}

/* Tables */
table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 18px 0;
    font-size: 8.6pt;
    page-break-inside: avoid;
    break-inside: avoid;
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
    page-break-inside: avoid;
    break-inside: avoid;
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
    page-break-inside: avoid;
    break-inside: avoid;
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

/* Mermaid Box */
.mermaid-box {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0 20px 0;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}}

.mermaid {{
    display: flex;
    justify-content: center;
    margin: 0 auto;
}}

.mermaid svg {{
    max-width: 100% !important;
    height: auto !important;
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
    margin: 22px 0;
}}

/* Footer Note */
.report-footer {{
    margin-top: 36px;
    padding-top: 14px;
    border-top: 2px solid #0f172a;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #64748b;
    font-weight: 600;
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
        "--virtual-time-budget=9000",
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
        doc.close()

if __name__ == "__main__":
    build_pdf_report()
