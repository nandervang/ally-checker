#!/usr/bin/env python3
"""
CLI entry point for document accessibility auditing.
Used by the Node.js agent to invoke the Python auditor.
"""

import argparse
import asyncio
import json
import os
import sys
from docx_auditor import audit_docx_accessibility
from pdf_auditor import audit_pdf_accessibility

# Configure output to be pure JSON
def print_json(data):
    print(json.dumps(data, indent=2))

async def main():
    parser = argparse.ArgumentParser(description="Document Accessibility Auditor CLI")
    parser.add_argument("command", choices=["audit_docx", "audit_pdf"], help="Command to run")
    parser.add_argument("file_path", help="Path to the file to audit")
    parser.add_argument("--detailed", action="store_true", help="Run detailed audit")
    
    args = parser.parse_args()
    
    file_path = os.path.abspath(args.file_path)
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)
        
    try:
        if args.command == "audit_docx":
            result = await audit_docx_accessibility(file_path, detailed=args.detailed)
            print_json(result)
        elif args.command == "audit_pdf":
            result = await audit_pdf_accessibility(file_path, detailed=args.detailed)
            print_json(result)
            
    except Exception as e:
        print(json.dumps({"error": str(e), "file": file_path}))
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
