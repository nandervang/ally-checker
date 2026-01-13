# Document Accessibility MCP Server

MCP server providing comprehensive PDF and DOCX accessibility auditing following PDF/UA (ISO 14289) and WCAG 2.2 AA standards.

## Features

### PDF Accessibility Auditing
- ✅ Document structure validation (tags, bookmarks, outline)
- ✅ Alternative text verification for images
- ✅ Language specification checking
- ✅ Document title validation
- ✅ Tagged PDF verification (PDF/UA requirement)
- ✅ Reading order analysis
- ✅ Form field accessibility
- ✅ Table structure validation
- ✅ Color contrast reminders

### DOCX Accessibility Auditing
- ✅ Heading structure and hierarchy validation
- ✅ Alternative text for images and objects
- ✅ Table accessibility (header rows)
- ✅ Hyperlink descriptiveness
- ✅ Document language settings
- ✅ Document title validation
- ✅ Text formatting checks

## Installation

```bash
cd mcp-servers/document-accessibility-server
pip install -r requirements.txt
```

## Configuration

Add to your MCP settings file (e.g., `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "document-accessibility": {
      "command": "python",
      "args": ["/path/to/ally-checker/mcp-servers/document-accessibility-server/server.py"]
    }
  }
}
```

## Testing / Verification

To verify the auditors against generated bad files:

```bash
# 1. Generate test artifacts
python3 create_test_docs.py
python3 create_test_pdf.py

# 2. Run the auditor verification
python3 verify_auditors.py
```

## Tools

### audit_pdf
Comprehensive PDF accessibility audit.

**Input:**
```json
{
  "file_path": "/path/to/document.pdf",
  "detailed": true
}
```

**Output:**
```json
{
  "file": "/path/to/document.pdf",
  "metadata": {"pages": 10, "encrypted": false},
  "total_issues": 5,
  "perceivable_count": 2,
  "operable_count": 1,
  "understandable_count": 1,
  "robust_count": 1,
  "issues": [...]
}
```

### audit_docx
Comprehensive DOCX accessibility audit.

**Input:**
```json
{
  "file_path": "/path/to/document.docx",
  "detailed": true
}
```

## Standards Compliance

### PDF/UA (ISO 14289)
Universal Accessibility standard for PDF documents:
- Tagged PDF structure required
- Alternative text for images
- Logical reading order
- Document metadata (title, language)
- Form field labels
- Table structure

### WCAG 2.2 Level AA
78 success criteria adapted for documents:
- 1.1.1 Non-text Content - Alt text
- 1.3.1 Info and Relationships - Structure
- 1.4.3 Contrast (Minimum) - Color contrast
- 2.4.2 Page Titled - Document title
- 2.4.4 Link Purpose - Descriptive links
- 2.4.5 Multiple Ways - Navigation
- 2.4.6 Headings and Labels - Structure
- 3.1.1 Language of Page - Language specification
- 4.1.2 Name, Role, Value - Semantic structure

## Testing

```bash
python -m pytest tests/
```

## Example Usage

```python
# In your Netlify Function or AI agent
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Connect to MCP server
server_params = StdioServerParameters(
    command="python",
    args=["mcp-servers/document-accessibility-server/server.py"]
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        
        # Audit PDF
        result = await session.call_tool(
            "audit_pdf",
            {"file_path": "/path/to/document.pdf", "detailed": True}
        )
        
        print(result.content[0].text)
```

## Limitations

- **Color Contrast**: Automated PDF contrast analysis is complex. Manual verification recommended using PAC or Adobe Acrobat.
- **Alt Text Content**: Tools can detect missing alt text but cannot validate quality/descriptiveness.
- **Reading Order**: Basic detection only. Manual verification with screen readers recommended.
- **PDF/UA Full Compliance**: Complete PDF/UA validation requires specialized tools like PAC or Adobe Acrobat Pro.

## Recommended Tools for Full Validation

- **PDF Accessibility Checker (PAC)**: Free, comprehensive PDF/UA validator
- **Adobe Acrobat Pro**: Full PDF accessibility checking and remediation
- **Microsoft Word**: Built-in accessibility checker for DOCX
- **Colour Contrast Analyser**: Free tool for contrast checking

## Architecture

```
document-accessibility-server/
├── server.py              # Main MCP server
├── pdf_auditor.py         # PDF audit implementation
├── docx_auditor.py        # DOCX audit implementation
├── pdf_tools.py           # PDF-specific tools
├── docx_tools.py          # DOCX-specific tools
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Dependencies

- `mcp`: Model Context Protocol SDK
- `pypdf`: PDF reading and structure analysis
- `pdfplumber`: PDF content extraction
- `PyMuPDF`: Advanced PDF processing
- `python-docx`: DOCX document analysis
- `Pillow`: Image processing (for contrast analysis)
