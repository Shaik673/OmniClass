import sys
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')
doc = pymupdf.open("OmniClass_Project_Report.pdf")
print("=== SUMMARY OF ALL PAGES ===")
print("Total pages:", len(doc))
for i, page in enumerate(doc):
    t = page.get_text()
    lines = [l.strip() for l in t.splitlines() if l.strip()]
    content = [l for l in lines if not l.startswith("Page ") and not l.startswith("OmniClass LMS")]
    first = content[0] if content else "EMPTY"
    print(f"Page {i+1:02d}: {len(content):3d} lines | {first[:60]}")

print("\n=== CHECK SECTION 12 ===")
for i, page in enumerate(doc):
    t = page.get_text()
    if "SECTION 12" in t:
        print(f"Section 12 on Page {i+1}:")
        print(t[:500])

print("\n=== CHECK SECTION 16 ===")
for i, page in enumerate(doc):
    t = page.get_text()
    if "SECTION 16" in t:
        print(f"Section 16 on Page {i+1}:")
        print(t[:500])
