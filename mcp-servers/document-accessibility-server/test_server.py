#!/usr/bin/env python3
"""
Quick test script to verify MCP server basic functionality.
"""

import os
import sys

# Test importing all modules
try:
    print("Testing imports...")
    import server
    import pdf_auditor
    import docx_auditor
    import pdf_tools
    import docx_tools
    print("✅ All modules import successfully")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test that we can instantiate the server
try:
    print("\nTesting server instantiation...")
    from mcp.server import Server
    app = Server("document-accessibility")
    print("✅ Server instantiates successfully")
except Exception as e:
    print(f"❌ Server instantiation failed: {e}")
    sys.exit(1)

# Test tool functions exist
try:
    print("\nTesting tool function availability...")
    assert hasattr(pdf_tools, 'extract_pdf_structure')
    assert hasattr(pdf_tools, 'check_pdf_tags')
    assert hasattr(pdf_tools, 'check_pdf_alt_text')
    assert hasattr(docx_tools, 'extract_docx_structure')
    assert hasattr(docx_tools, 'check_docx_headings')
    print("✅ All tool functions available")
except AssertionError as e:
    print(f"❌ Tool function check failed: {e}")
    sys.exit(1)

print("\n✨ All basic checks passed! MCP server is ready.")
print("\nTo use this server, add to your MCP settings:")
print("""{
  "mcpServers": {
    "document-accessibility": {
      "command": "python",
      "args": ["%s/server.py"]
    }
  }
}""" % os.path.dirname(os.path.abspath(__file__)))
