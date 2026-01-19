import asyncio
import json
import os
from docx_auditor import audit_docx_accessibility
from pdf_auditor import audit_pdf_accessibility

async def main():
    print("--- Running DOCX Audit ---")
    docx_path = os.path.abspath("test_bad.docx")
    if os.path.exists(docx_path):
        result_docx = await audit_docx_accessibility(docx_path)
        print(json.dumps(result_docx, indent=2))
    else:
        print("test_bad.docx not found!")

    print("\n--- Running PDF Audit ---")
    pdf_path = os.path.abspath("test_bad.pdf")
    if os.path.exists(pdf_path):
        try:
            result_pdf = await audit_pdf_accessibility(pdf_path)
            print(json.dumps(result_pdf, indent=2))
        except Exception as e:
            print(f"PDF Audit failed: {e}")
    else:
        print("test_bad.pdf not found!")

if __name__ == "__main__":
    asyncio.run(main())
