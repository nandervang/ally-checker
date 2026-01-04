# Document Accessibility Auditing: Comprehensive Research

**Research Date**: December 30, 2025  
**Purpose**: Document accessibility auditing standards, tools, and implementation approach

---

## Executive Summary

This research document provides comprehensive information on document accessibility auditing standards (PDF/UA, WCAG 2.2 AA, Section 508), technical requirements, available tools, and recommended implementation approaches. Key findings:

- **No existing MCP servers** specifically for document accessibility auditing
- **Limited open-source tools** for comprehensive PDF/DOCX accessibility testing
- **Manual remediation** still required for most document accessibility issues
- **Opportunity exists** to build first-of-its-kind document accessibility MCP server

---

## 1. Document Accessibility Standards

### 1.1 PDF/UA (PDF Universal Accessibility) - ISO 14289

**Standard**: ISO 14289-1:2014 (Latest: ISO 14289-1:2014)  
**Publication**: December 11, 2014  
**Current Status**: Confirmed standard (90.93)

#### Overview
PDF/UA specifies the use of ISO 32000‑1:2008 (PDF specification) to produce accessible electronic documents. It defines technical requirements for PDF files to be universally accessible.

#### Scope
- **Applicable to**: Accessible PDF document creation and validation
- **Not applicable to**:
  - Specific conversion processes (paper to PDF)
  - Rendering implementation details
  - Storage methods
  - Hardware/OS requirements

#### Key Technical Requirements
1. **Document Structure Tags**
   - Proper semantic tagging of all content
   - Logical reading order
   - Document outline/bookmarks
   
2. **Content Accessibility**
   - Alternative text for images and non-text content
   - Meaningful link text
   - Form field labels and descriptions
   
3. **Metadata**
   - Document title
   - Language specification
   - Author information
   
4. **Visual Presentation**
   - Color not as sole means of conveying information
   - Sufficient color contrast
   - Text can be resized without loss of function

5. **Navigation**
   - Tab order for interactive elements
   - Keyboard accessibility
   - Table headers properly marked

#### ISO Certification
- WCAG 2.2 is approved as **ISO/IEC 40500:2025**
- October 2023 version of WCAG 2.2 = ISO/IEC 40500:2025
- December 2024 WCAG 2.2 expected as ISO/IEC 40500:2026 by late 2026

### 1.2 WCAG 2.2 AA Compliance for Documents

WCAG (Web Content Accessibility Guidelines) 2.2 applies to documents as well as web content.

#### Four Principles (POUR)

**1. Perceivable**
- **1.1.1 Non-text Content (Level A)**: Alt text for images, charts, graphs
- **1.3.1 Info and Relationships (Level A)**: Proper heading structure, lists, tables
- **1.3.2 Meaningful Sequence (Level A)**: Logical reading order
- **1.4.3 Contrast (Minimum) (Level AA)**: 4.5:1 for normal text, 3:1 for large text
- **1.4.11 Non-text Contrast (Level AA)**: 3:1 for UI components and graphics

**2. Operable**
- **2.1.1 Keyboard (Level A)**: All functionality available via keyboard
- **2.4.2 Page Titled (Level A)**: Descriptive document title
- **2.4.6 Headings and Labels (Level AA)**: Descriptive headings and form labels
- **2.4.7 Focus Visible (Level AA)**: Visible focus indicators

**3. Understandable**
- **3.1.1 Language of Page (Level A)**: Document language specified
- **3.1.2 Language of Parts (Level AA)**: Language changes marked
- **3.2.4 Consistent Identification (Level AA)**: Consistent component labeling
- **3.3.2 Labels or Instructions (Level A)**: Clear form field labels

**4. Robust**
- **4.1.2 Name, Role, Value (Level A)**: Proper semantic markup
- **4.1.3 Status Messages (Level AA)**: Programmatically determinable status

#### Document-Specific Considerations
- **Alternative Text**: Images must have meaningful alt text
- **Headings**: Proper hierarchical structure (H1 → H2 → H3)
- **Lists**: Properly formatted as ordered/unordered lists
- **Tables**: Header rows/columns marked, data cells associated
- **Forms**: All fields labeled, instructions provided
- **Color**: Not sole means of conveying information
- **Reading Order**: Logical flow for screen readers
- **Language**: Primary and secondary languages marked

### 1.3 Section 508 Document Requirements

Section 508 (U.S. federal accessibility law) requires:

#### Electronic Documents Must:
1. Be tagged for accessibility
2. Include alternative text descriptions
3. Use proper heading structure
4. Have sufficient color contrast
5. Be keyboard accessible
6. Include document language metadata
7. Have meaningful link text
8. Include proper table structure
9. Have accessible form fields

#### Supported Document Formats:
- **PDF**: Must conform to PDF/UA or WCAG 2.0 AA minimum
- **Microsoft Word** (.docx): Native accessibility features
- **Microsoft PowerPoint** (.pptx): Accessibility checker compliance
- **Microsoft Excel** (.xlsx): Accessible tables and charts

#### Official Resources:
- Section 508 authoring guides for Word, PowerPoint, Excel
- [Training videos](https://www.section508.gov/create/documents/training-videos)
- Accessibility testing checklists

### 1.4 Web vs Document Accessibility Differences

| Aspect | Web (HTML) | Documents (PDF/DOCX) |
|--------|-----------|---------------------|
| **Dynamic Content** | Interactive, real-time updates | Static snapshots |
| **Navigation** | Links, menus, breadcrumbs | Bookmarks, ToC, internal links |
| **Responsive Design** | Adapts to viewport | Fixed layout (PDF) or reflowable (DOCX) |
| **Forms** | HTML5 validation, AJAX | Static form fields |
| **Multimedia** | Embedded players, captions | Embedded or linked media |
| **Updates** | Real-time changes | Version control required |
| **Testing Tools** | Automated scanners (axe, WAVE) | Specialized validators (PAC, Acrobat) |
| **Remediation** | Edit source code | Edit tagged structure |
| **Standards** | WCAG 2.2 | PDF/UA + WCAG 2.2 |

**Key Difference**: Web content is dynamic and interactive; documents are typically static deliverables requiring proper structure from creation.

---

## 2. Technical Requirements for Accessible Documents

### 2.1 PDF Accessibility Features

#### Tags and Structure
- **Root Structure Element**: `/StructTreeRoot` in PDF catalog
- **Content Tags**: 
  - `<Document>`, `<Part>`, `<Div>`, `<Sect>`
  - `<H1>` through `<H6>` for headings
  - `<P>` for paragraphs
  - `<L>`, `<LI>`, `<Lbl>` for lists
  - `<Table>`, `<TR>`, `<TH>`, `<TD>` for tables
  - `<Figure>`, `<Formula>`, `<Form>` for special content
  - `<Link>`, `<Annot>` for interactive elements

#### Metadata Requirements
```
/Title (Document Title)
/Author (Author Name)
/Subject (Document Subject)
/Keywords (keyword1, keyword2)
/Lang (en-US)
/MarkInfo << /Marked true >>
/ViewerPreferences << /DisplayDocTitle true >>
```

#### Alternative Text
- **Images**: `/Alt` property in Figure tag
- **Charts/Graphs**: Detailed descriptions via `/ActualText`
- **Decorative Images**: Tag as Artifact
- **Complex Images**: Extended descriptions in document

#### Reading Order
- Content order matches visual order
- Tagged in logical sequence
- No out-of-sequence elements
- Screen reader follows tag order

#### Color Contrast
- **Text**: 4.5:1 ratio for normal text
- **Large Text**: 3:1 ratio (18pt+ or 14pt+ bold)
- **Graphics**: 3:1 for UI components
- **Testing Tools**: Color contrast analyzers

#### Form Fields
- All fields have `/T` (name) and `/TU` (tooltip/label)
- Grouped logically
- Tab order specified
- Required fields marked
- Validation messages accessible

### 2.2 DOCX Accessibility Features

#### Headings
- Use built-in Heading styles (Heading 1-9)
- Logical hierarchy (no skipping levels)
- Descriptive text
- Navigation pane enabled

#### Alternative Text
- Images: Right-click → "Edit Alt Text"
- Charts: Similar alt text option
- SmartArt: Each element can have alt text
- Decorative images: Mark as "decorative"

#### Reading Order
- Document structure based on Styles
- Table of Contents reflects structure
- No floating text boxes (use inline)
- No side-by-side columns unless necessary

#### Table Structure
- Use "Insert Table" feature
- Header row marked via Table Properties
- Simple tables (no merged/split cells)
- Summary/caption provided
- Avoid blank rows for spacing

#### Color Contrast
- Use Accessibility Checker built-in tool
- High contrast themes available
- Color not sole indicator of meaning

#### Hyperlinks
- Descriptive link text (not "click here")
- ScreenTip for additional context
- Avoid long URLs in text

#### Language
- Set document language: Review → Language
- Mark language changes inline
- Proofing tools use correct dictionaries

### 2.3 Common Accessibility Issues in Documents

#### PDF Issues
1. **Untagged PDFs**: Most common issue (scanned documents)
2. **Incorrect Reading Order**: Visual order ≠ logical order
3. **Missing Alt Text**: Images without descriptions
4. **Poor Heading Structure**: No semantic headings, skipped levels
5. **Inaccessible Tables**: Missing headers, complex layouts
6. **Low Color Contrast**: Light text on light backgrounds
7. **Inaccessible Forms**: Missing labels, poor tab order
8. **No Document Language**: Screen readers can't determine language
9. **Meaningless Links**: "Click here" without context
10. **Flattened Content**: Security restrictions prevent accessibility

#### DOCX Issues
1. **Manual Formatting**: Using font size instead of Heading styles
2. **Floating Text Boxes**: Not in reading order
3. **Complex Tables**: Merged cells, nested tables
4. **Images Without Alt Text**: Accessibility Checker flags
5. **Poor Color Contrast**: Light gray text
6. **Multiple Spaces/Tabs**: Using spaces for layout
7. **Hardcoded Lists**: Not using List feature
8. **Blank Characters**: Empty paragraphs for spacing
9. **Embedded Objects**: Inaccessible charts, equations
10. **Insufficient Link Context**: URL as display text

### 2.4 Remediation Techniques

#### PDF Remediation Workflow
1. **Assessment**
   - Run automated checker (PAC, Adobe Acrobat)
   - Manual inspection of structure
   - Identify scope of issues

2. **Tagging**
   - Add tags to untagged PDFs
   - Correct tag tree structure
   - Assign proper tag types

3. **Reading Order**
   - Reorder content in Tags panel
   - Fix artifacts and decorative content
   - Verify logical flow

4. **Alternative Text**
   - Add alt text to all images
   - Remove alt text from decorative elements
   - Provide extended descriptions

5. **Tables**
   - Mark header rows/columns
   - Add table summary
   - Simplify complex layouts

6. **Forms**
   - Add tooltips to all fields
   - Set tab order
   - Add field descriptions

7. **Metadata**
   - Set document title
   - Specify language
   - Add author/subject

8. **Validation**
   - Re-run automated checker
   - Manual screen reader testing
   - Address remaining issues

#### DOCX Remediation Workflow
1. **Run Accessibility Checker**
   - Review → Check Accessibility
   - Address errors and warnings
   - Keep Accessibility Checker open

2. **Apply Proper Styles**
   - Replace manual formatting with Heading styles
   - Use List formatting
   - Apply Table styles

3. **Add Alternative Text**
   - Right-click images → Edit Alt Text
   - Mark decorative images
   - Add descriptions to charts

4. **Fix Tables**
   - Repeat header rows
   - Simplify merged cells
   - Add table title

5. **Improve Links**
   - Rewrite link text to be descriptive
   - Add ScreenTips
   - Avoid bare URLs

6. **Check Color Contrast**
   - Use contrast analyzer tools
   - Adjust text colors if needed
   - Don't rely on color alone

7. **Set Language**
   - Review → Language → Set Proofing Language
   - Mark language changes

8. **Final Validation**
   - Accessibility Checker shows no errors
   - Save as PDF and validate
   - Test with screen reader

---

## 3. Document Accessibility Audit Tools

### 3.1 Adobe Acrobat Pro DC Accessibility Checker

**Platform**: Windows, macOS  
**Cost**: Paid subscription (~$20/month)  
**Capabilities**:
- Full accessibility check (WCAG 2.0 and PDF/UA)
- Tag tree editor for remediation
- Reading order verification
- Automated alt text suggestions
- Form field accessibility tools
- Batch processing for multiple PDFs

**Limitations**:
- Expensive for individual use
- Windows version more feature-rich than Mac
- Requires manual remediation for most issues
- No API for automation

**Verdict**: Industry standard for professional PDF remediation, but cost-prohibitive for many users.

### 3.2 PAC (PDF Accessibility Checker)

**Platform**: Windows only  
**Cost**: Free  
**Developer**: Access for All Foundation (Switzerland)  
**Capabilities**:
- Comprehensive PDF/UA validation
- WCAG 2.0/2.1 checking
- Detailed error reporting
- Screen reader preview
- Tag tree visualization
- No remediation features (checking only)

**Limitations**:
- Windows-only (no Mac, Linux)
- Read-only tool (no editing)
- Manual export to PDF required
- No batch processing
- No API

**Verdict**: Best free validation tool, but Windows-only and no remediation capabilities.

### 3.3 CommonLook PDF Validator

**Platform**: Windows  
**Cost**: Paid (~$1,500+)  
**Note**: Company acquired by Allyant (now Netcentric Allyant)  
**Capabilities**:
- PDF/UA and WCAG validation
- Remediation tools
- Batch processing
- Compliance reporting
- Integration with InDesign

**Limitations**:
- Very expensive
- Windows-only
- Steep learning curve
- Enterprise-focused

**Verdict**: Professional tool for organizations with high-volume needs.

### 3.4 axe DevTools for Documents

**Status**: Does not exist  
**Note**: axe DevTools by Deque is for web content only, not documents.

**Alternative**: Deque offers accessibility consulting services but no automated document testing tool.

### 3.5 Microsoft Word Accessibility Checker

**Platform**: Windows, macOS, Web  
**Cost**: Free (included with Microsoft 365)  
**Capabilities**:
- Real-time accessibility checking
- Errors, warnings, tips categorization
- One-click fixes for some issues
- Integrated into Word interface
- Best practices recommendations

**Issues Detected**:
- Missing alt text
- Hardcoded lists
- Blank characters
- Insufficient color contrast
- Missing heading levels
- Unclear link text
- Complex tables
- Missing table headers
- No document language

**Limitations**:
- DOCX only (doesn't check PDFs)
- Some false positives
- Limited context-aware checking
- Manual fixes still required

**Verdict**: Essential for DOCX creation, prevents issues at authoring stage.

### 3.6 Open Source Tools for PDF/DOCX Accessibility

#### Python Libraries

**pypdf** (formerly PyPDF2)
- **Purpose**: PDF reading, writing, merging, metadata extraction
- **Accessibility Features**:
  - Metadata extraction
  - Text extraction (limited by PDF structure)
  - Page manipulation
- **Limitations**:
  - No tag tree analysis
  - No accessibility validation
  - No alt text extraction
- **Use Case**: Pre-processing, metadata analysis
- **GitHub**: https://github.com/py-pdf/pypdf

**pdfplumber**
- **Purpose**: PDF text extraction, table detection
- **Accessibility Features**:
  - Extract text with positioning
  - Detect table structures
  - Character-level detail
- **Limitations**:
  - No tag tree awareness
  - No accessibility checking
  - Visual layout focus
- **Use Case**: Content extraction for analysis
- **GitHub**: https://github.com/jsvine/pdfplumber

**python-docx**
- **Purpose**: Create and modify DOCX files
- **Accessibility Features**:
  - Read/write paragraphs, runs, styles
  - Table manipulation
  - Add images (but no alt text API)
  - Header/footer access
- **Limitations**:
  - No accessibility validation
  - Limited alt text support
  - No reading order analysis
- **Use Case**: Programmatic DOCX creation
- **GitHub**: https://github.com/python-openxml/python-docx

**pdf-parse** (Node.js)
- **Purpose**: Extract text from PDFs
- **Accessibility Features**:
  - Text extraction
  - Metadata reading
  - Image extraction
  - Table detection
- **Limitations**:
  - No tag tree support
  - No accessibility validation
  - Node.js only
- **Use Case**: PDF content analysis
- **npm**: https://www.npmjs.com/package/pdf-parse

#### Specialized Accessibility Libraries

**pdf-accessibility-checker** (hypothetical)
- **Status**: No mature open-source library exists
- **Need**: Library to validate PDF/UA and WCAG compliance
- **Gap**: All existing tools are either proprietary or GUI-based

#### Potential Tool Stack for Custom Solution
1. **PDF Tag Extraction**: Use `pypdf` to access tag tree
2. **Content Analysis**: Use `pdfplumber` for visual structure
3. **DOCX Analysis**: Use `python-docx` for structure
4. **Validation Rules**: Implement custom WCAG 2.2 AA checks
5. **Color Contrast**: Use `pillow` to extract colors and calculate ratios
6. **OCR (if needed)**: Use `pytesseract` for scanned documents

### 3.7 Node.js Libraries for Document Accessibility

#### pdf-lib
- **Purpose**: Create and modify PDFs in JavaScript
- **Capabilities**:
  - Form creation and filling
  - Metadata reading/writing
  - Page manipulation
  - Image embedding
  - Text drawing
- **Accessibility Limitations**:
  - No tag tree creation
  - No accessibility validation
  - Limited structure support
- **Use Case**: PDF generation, form filling
- **npm**: https://www.npmjs.com/package/pdf-lib

#### pdf-parse (Node.js)
- See Python section above
- Can extract text, images, metadata
- No accessibility checking

#### Verdict on JavaScript/Node.js Tools
- **Limited Options**: Fewer mature libraries than Python
- **No Validation Libraries**: No WCAG/PDF-UA checkers
- **Opportunity**: Build Node.js accessibility validation library

---

## 4. MCP Servers for Document Accessibility

### 4.1 Search Results from MCP Servers Repository

**Searched**: Model Context Protocol servers repository (https://github.com/modelcontextprotocol/servers)

**Findings**:
- **No existing MCP servers** specifically for document accessibility
- **Related MCP servers found**:
  - **Nutrient** (formerly PSPDFKit): Create, Edit, Sign, Extract Documents using Natural Language
  - **PaddleOCR**: Enterprise-grade OCR and document parsing
  - **PDFActionInspector** (Foxit): Extract and analyze JavaScript Actions from PDF files (security focus)

**Closest Matches**:
1. **Nutrient MCP Server**
   - Focus: Document workflow automation
   - Not accessibility-focused
   - Commercial product integration

2. **PaddleOCR MCP**
   - Focus: OCR and text extraction
   - Could assist with accessibility for scanned docs
   - Not comprehensive accessibility auditing

3. **Filesystem MCP Server**
   - Generic file operations
   - Could be extended to read PDFs/DOCX
   - No accessibility features

### 4.2 Gap Analysis

**What's Missing**:
1. **PDF/UA Validation MCP Server**: No server validates PDF/UA compliance
2. **WCAG Document Checker MCP**: No WCAG 2.2 AA checker for documents
3. **Alt Text Analyzer MCP**: No server evaluates alt text quality
4. **Reading Order Validator MCP**: No logical reading order checker
5. **Document Remediation MCP**: No guided remediation workflow

**Why This Gap Exists**:
- Document accessibility is niche compared to web accessibility
- Proprietary tools dominate (Adobe, CommonLook)
- Complex standards (PDF/UA, WCAG)
- Limited open-source libraries for validation
- Tag tree parsing is technically challenging

### 4.3 Required Tools/Libraries for Building an MCP Server

To build a comprehensive document accessibility MCP server, you would need:

#### Core Dependencies
1. **PDF Tag Tree Parser**
   - Read and validate PDF tag structure
   - Options: `pypdf`, custom PDF parser
   - Gap: No existing library fully supports PDF/UA validation

2. **DOCX Structure Analyzer**
   - Parse OOXML structure
   - Read styles, headings, alt text
   - Library: `python-docx`, `mammoth` (Node.js)

3. **WCAG Validation Engine**
   - Implement WCAG 2.2 AA success criteria
   - Color contrast calculator
   - Reading order validator
   - Custom implementation required

4. **Content Extraction**
   - Text extraction with positioning
   - Image detection and alt text extraction
   - Libraries: `pdfplumber`, `pypdf`, `pdf-parse`

5. **Metadata Parser**
   - Read document metadata
   - Validate language tags
   - Supported by `pypdf`, `python-docx`

6. **Reporting Engine**
   - Generate accessibility reports
   - Categorize issues by WCAG principle
   - Severity levels (A, AA, AAA)
   - JSON/HTML output

#### Implementation Approach

**Option 1: Python-Based MCP Server**
```python
# Dependencies
pypdf          # PDF tag tree access
pdfplumber     # PDF content extraction
python-docx    # DOCX structure analysis
pillow         # Color contrast calculation
wcag-contrast  # WCAG contrast checking
fastmcp        # MCP server framework
```

**Option 2: Node.js-Based MCP Server**
```javascript
// Dependencies
pdf-lib        // PDF manipulation
pdf-parse      // PDF text extraction  
mammoth        // DOCX to HTML conversion
color          // Color manipulation
@modelcontextprotocol/sdk  // MCP framework
```

**Recommended**: Python-based due to better PDF libraries and accessibility tooling ecosystem.

#### MCP Server Architecture

```
document-accessibility-mcp-server/
├── src/
│   ├── parsers/
│   │   ├── pdf_parser.py      # PDF tag tree extraction
│   │   ├── docx_parser.py     # DOCX structure analysis
│   │   └── metadata_parser.py # Document metadata
│   ├── validators/
│   │   ├── wcag_validator.py  # WCAG 2.2 AA rules
│   │   ├── pdfua_validator.py # PDF/UA compliance
│   │   └── contrast_validator.py # Color contrast
│   ├── analyzers/
│   │   ├── alt_text_analyzer.py   # Alt text quality
│   │   ├── reading_order.py       # Logical flow
│   │   └── heading_structure.py   # Heading hierarchy
│   ├── reporters/
│   │   ├── json_reporter.py   # JSON output
│   │   ├── html_reporter.py   # HTML report
│   │   └── summary_reporter.py # Executive summary
│   └── server.py              # MCP server implementation
├── tests/
│   ├── fixtures/              # Sample PDFs, DOCX
│   └── test_validators.py    # Unit tests
├── requirements.txt
└── README.md
```

#### MCP Tools to Expose

1. **audit_pdf**
   - Input: PDF file path or URL
   - Output: Comprehensive accessibility report
   - Checks: PDF/UA, WCAG 2.2 AA, alt text, reading order

2. **audit_docx**
   - Input: DOCX file path
   - Output: Accessibility report
   - Checks: Heading structure, alt text, table structure, color contrast

3. **validate_contrast**
   - Input: Color values (hex, RGB)
   - Output: Pass/fail with ratio
   - Uses: WCAG color contrast algorithm

4. **analyze_alt_text**
   - Input: Alt text string, image context
   - Output: Quality score and recommendations
   - Uses: AI-powered heuristics

5. **extract_structure**
   - Input: PDF or DOCX file
   - Output: Document structure tree
   - Uses: Tag tree or styles hierarchy

6. **generate_remediation_guide**
   - Input: Audit report
   - Output: Step-by-step remediation instructions
   - Prioritizes by severity

---

## 5. Audit Report Structure

### 5.1 Document Accessibility Report Components

A comprehensive document accessibility report should include:

#### Executive Summary
- **Overall Pass/Fail Status**
- **Compliance Level**: None, A, AA, AAA
- **Total Issues**: Count by severity
- **Remediation Estimate**: Hours/complexity
- **Critical Blockers**: Must-fix items

#### Document Metadata
- **File Name**: original_document.pdf
- **File Size**: 2.5 MB
- **Page Count**: 45 pages
- **Tested Against**: WCAG 2.2 AA, PDF/UA-1
- **Test Date**: 2025-12-30
- **Tester**: Automated + Manual Review

#### Detailed Findings

**Organized by WCAG Principle**:

**1. Perceivable**
- **1.1.1 Non-text Content**
  - Issue: 12 images missing alternative text
  - Pages: 3, 7, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39
  - Severity: Critical (Level A)
  - Remediation: Add descriptive alt text to each image

- **1.3.1 Info and Relationships**
  - Issue: Document not tagged
  - Pages: All
  - Severity: Critical (Level A)
  - Remediation: Add PDF tags using Adobe Acrobat

- **1.4.3 Contrast (Minimum)**
  - Issue: Text on page 8 has 3.2:1 contrast (needs 4.5:1)
  - Pages: 8
  - Severity: Serious (Level AA)
  - Remediation: Darken text color or lighten background

**2. Operable**
- **2.4.2 Page Titled**
  - Issue: Document title not set
  - Severity: Moderate (Level A)
  - Remediation: Set title in document properties

**3. Understandable**
- **3.1.1 Language of Page**
  - Issue: Document language not specified
  - Severity: Moderate (Level A)
  - Remediation: Set /Lang to "en-US" in metadata

**4. Robust**
- **4.1.2 Name, Role, Value**
  - Issue: Form fields missing labels
  - Pages: 42, 43
  - Severity: Critical (Level A)
  - Remediation: Add /TU tooltips to form fields

#### Issue Categorization

By **WCAG Success Criteria**:
- Group by SC number (1.1.1, 1.3.1, etc.)
- List all instances of each violation
- Provide context (page numbers, elements)

By **Severity**:
- **Critical**: Blocks all users, Level A failures
- **Serious**: Blocks many users, Level AA failures
- **Moderate**: Difficult for some users, Level AAA failures
- **Minor**: Best practice violations

By **Page**:
- Page-by-page breakdown
- All issues on each page listed
- Allows targeted remediation

#### Remediation Guidance

For each issue:
1. **Description**: What's wrong
2. **User Impact**: How it affects people with disabilities
3. **How to Fix**: Step-by-step instructions
4. **Tools Needed**: Software/skills required
5. **Estimated Time**: Minutes/hours per fix
6. **WCAG Reference**: Link to Understanding document

#### Validation Results

**Automated Checks**:
- PAC validation results
- Adobe Acrobat Accessibility Checker results
- Custom validation rules

**Manual Checks**:
- Screen reader testing notes
- Keyboard navigation testing
- Zoom/magnification testing
- Color blindness simulation

### 5.2 Issue Severity Levels

#### Critical (Must Fix)
- **Level A failures**: Fundamental accessibility barriers
- **Examples**:
  - Untagged PDF
  - Missing alt text on informative images
  - Inaccessible forms (no labels)
  - No document language
  - Keyboard traps

#### Serious (Should Fix)
- **Level AA failures**: Significant barriers for many users
- **Examples**:
  - Insufficient color contrast
  - Missing heading levels
  - Unclear link text
  - Complex tables without headers
  - No document title

#### Moderate (Recommended Fix)
- **Level AAA failures**: Best practices, improved experience
- **Examples**:
  - Enhanced contrast (7:1 instead of 4.5:1)
  - Pronunciation guides
  - Sign language videos
  - Extended audio descriptions

#### Minor (Nice to Have)
- **Best practice violations**: Not required but recommended
- **Examples**:
  - Overly long alt text
  - Inconsistent formatting
  - Non-semantic markup
  - Redundant links

### 5.3 Document vs Web Accessibility Reporting Differences

| Aspect | Web Accessibility Report | Document Accessibility Report |
|--------|--------------------------|-------------------------------|
| **Scope** | Single page or entire site | Single document (PDF, DOCX) |
| **Testing Method** | Automated scanners + manual | Validator + manual + screen reader |
| **Issues Detected** | Interactive elements, dynamic content | Static structure, reading order |
| **Remediation** | Edit HTML/CSS/JS | Edit tags, metadata, structure |
| **Standards** | WCAG 2.2 (web context) | WCAG 2.2 + PDF/UA (document context) |
| **Tools** | axe, WAVE, Lighthouse | PAC, Adobe Acrobat, Word Checker |
| **Report Format** | HTML with links | PDF with annotations or HTML |
| **Validation** | Browser-based, responsive | Fixed format, print-ready |

**Key Difference**: Web reports focus on interactivity and responsiveness; document reports focus on structure, reading order, and print accessibility.

### 5.4 Sample Report Structure (JSON Format)

```json
{
  "document": {
    "filename": "annual-report-2024.pdf",
    "filesize": "2.5 MB",
    "pageCount": 45,
    "testDate": "2025-12-30T10:30:00Z",
    "standards": ["WCAG 2.2 AA", "PDF/UA-1"]
  },
  "summary": {
    "overallStatus": "FAIL",
    "complianceLevel": "None",
    "totalIssues": 47,
    "critical": 12,
    "serious": 18,
    "moderate": 10,
    "minor": 7
  },
  "issuesByPrinciple": {
    "perceivable": {
      "1.1.1": {
        "title": "Non-text Content",
        "level": "A",
        "issueCount": 12,
        "severity": "Critical",
        "instances": [
          {
            "page": 3,
            "element": "Image",
            "issue": "Missing alternative text",
            "remediation": "Add alt text: 'Bar chart showing revenue growth from 2020-2024'"
          }
        ]
      }
    }
  },
  "remediationGuide": {
    "estimatedTime": "8-12 hours",
    "skillLevel": "Intermediate",
    "toolsRequired": ["Adobe Acrobat Pro DC"],
    "steps": [
      "1. Add tags to PDF using Adobe Acrobat",
      "2. Set document title and language",
      "3. Add alt text to all images",
      "4. Fix heading structure",
      "5. Validate with PAC"
    ]
  }
}
```

---

## 6. Recommended Implementation Approach

### 6.1 Short-Term: Manual Auditing Workflow

**Tools**:
- Adobe Acrobat Pro DC (PDF remediation)
- PAC (free PDF validation)
- Microsoft Word Accessibility Checker (DOCX)
- Color Contrast Analyzer (free)
- NVDA or JAWS screen reader (testing)

**Process**:
1. Run automated checker (PAC or Acrobat)
2. Export issues to spreadsheet
3. Manual screen reader testing
4. Categorize by WCAG principle
5. Generate HTML report
6. Provide remediation guide

**Pros**: Uses existing tools, no development needed  
**Cons**: Manual, time-consuming, not scalable

### 6.2 Medium-Term: Semi-Automated Solution

**Approach**: Build custom validation scripts

**Tools**:
- Python with `pypdf`, `pdfplumber`, `python-docx`
- Custom WCAG validation rules
- JSON/HTML report generator

**Components**:
1. **PDF Tag Tree Analyzer**
   - Extract tag structure
   - Validate hierarchy
   - Check for required tags

2. **Content Extractor**
   - Extract text, images, metadata
   - Detect tables, forms, links
   - Analyze reading order

3. **WCAG Validator**
   - Implement SC checks
   - Color contrast calculation
   - Alt text presence/quality

4. **Report Generator**
   - JSON and HTML output
   - WCAG-organized structure
   - Remediation guidance

**Pros**: Automated, scalable, customizable  
**Cons**: Development effort, maintenance

### 6.3 Long-Term: Full MCP Server Solution

**Vision**: First comprehensive document accessibility MCP server

**Features**:
- **Multi-format Support**: PDF, DOCX, PPTX, HTML
- **Comprehensive Validation**: WCAG 2.2 AA, PDF/UA-1, Section 508
- **AI-Powered Analysis**: Alt text quality, readability, context
- **Guided Remediation**: Step-by-step fixes with code examples
- **Batch Processing**: Audit multiple documents
- **Integration**: Claude Desktop, VS Code, custom clients

**MCP Tools**:
1. `audit_document` - Full accessibility audit
2. `validate_contrast` - Color contrast checker
3. `analyze_structure` - Document structure tree
4. `check_alt_text` - Alt text quality analysis
5. `generate_report` - Comprehensive HTML/PDF report
6. `suggest_fixes` - AI-powered remediation suggestions

**Technology Stack**:
- **Language**: Python (best libraries)
- **Framework**: FastMCP or @modelcontextprotocol/sdk
- **Libraries**: pypdf, pdfplumber, python-docx, pillow
- **AI**: Claude API for heuristic analysis
- **Storage**: File system or cloud (S3, Azure Blob)

**Development Phases**:

**Phase 1: MVP (2-3 weeks)**
- PDF tag tree extraction
- Basic WCAG validation (alt text, headings, language)
- JSON report output
- Single-document auditing

**Phase 2: Enhanced Features (4-6 weeks)**
- DOCX support
- Color contrast validation
- Reading order analysis
- HTML report generation
- Batch processing

**Phase 3: AI Integration (4-6 weeks)**
- Alt text quality scoring
- Readability analysis
- Context-aware suggestions
- Automated remediation proposals

**Phase 4: MCP Integration (2-3 weeks)**
- MCP server implementation
- Claude Desktop integration
- VS Code extension
- Documentation and examples

**Total Timeline**: 12-18 weeks for full solution

### 6.4 Competitive Advantage

**Why This Would Be Valuable**:
1. **First of Its Kind**: No existing MCP server for document accessibility
2. **Open Source**: No free comprehensive tools available
3. **AI-Powered**: Contextual analysis beyond automated tools
4. **Developer-Friendly**: API/CLI for automation
5. **Education**: Built-in remediation guidance
6. **Multi-Format**: PDF + DOCX + future formats

**Market Gaps**:
- Adobe Acrobat: Expensive, proprietary, no API
- PAC: Windows-only, no remediation
- Web tools: Focus on HTML, not documents
- Open source: Limited to parsing, no validation

**Target Users**:
- Government agencies (Section 508 compliance)
- Educational institutions (accessibility requirements)
- Publishers (accessible textbooks, journals)
- Corporate communications (accessible reports)
- Developers (CI/CD pipeline integration)

---

## 7. Conclusions and Next Steps

### 7.1 Key Findings

1. **Standards are Well-Defined**: PDF/UA and WCAG 2.2 AA provide clear technical requirements
2. **Tools are Limited**: Expensive proprietary tools dominate; open-source options are minimal
3. **MCP Opportunity**: No existing document accessibility MCP servers
4. **Technical Feasibility**: Python libraries exist for building custom solution
5. **Manual Work Required**: Even with tools, human expertise needed for remediation

### 7.2 Recommended Approach for ally-checker

Based on your current focus on web/HTML accessibility (axe-core):

**Option A: Stay Web-Focused (Recommended for MVP)**
- Focus on HTML accessibility (current scope)
- Use axe-core for automated checks
- AI heuristics for subjective issues
- Defer document accessibility to later phase

**Option B: Add Document Auditing (Future Feature)**
- After web accessibility checker is stable
- Start with PDF-only support
- Use `pypdf` + custom validators
- Limited scope (alt text, headings, language)
- Expand to WCAG 2.2 AA full compliance

**Option C: Separate Document MCP Server (Long-Term)**
- Build standalone MCP server for documents
- Comprehensive PDF/UA + WCAG validation
- Integrate with ally-checker later
- Position as industry-first solution

### 7.3 Next Steps if Pursuing Document Accessibility

1. **Research Phase** (1 week)
   - Test PAC and Adobe Acrobat on sample PDFs
   - Experiment with `pypdf` and `pdfplumber`
   - Study PDF/UA specification in detail

2. **Prototype** (2 weeks)
   - Build basic PDF tag tree parser
   - Implement 5-10 WCAG checks
   - Generate simple JSON report

3. **Validation** (1 week)
   - Test on real-world PDFs
   - Compare results with PAC/Acrobat
   - Identify gaps and edge cases

4. **Decision Point**
   - Go/No-Go on full development
   - Assess effort vs. value
   - Consider partnership with accessibility experts

### 7.4 Resources for Further Research

**Standards**:
- [ISO 14289-1:2014 (PDF/UA)](https://www.iso.org/standard/64599.html) - Official standard ($98)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) - Free, W3C Recommendation
- [Section 508](https://www.section508.gov/) - U.S. federal requirements

**Tools**:
- [PAC Download](https://www.access-for-all.ch/en/pdf-lab/pdf-accessibility-checker-pac.html) - Free PDF checker
- [Adobe Acrobat](https://www.adobe.com/acrobat.html) - Professional PDF tool
- [NVDA Screen Reader](https://www.nvaccess.org/) - Free Windows screen reader

**Libraries**:
- [pypdf Documentation](https://pypdf.readthedocs.io/)
- [pdfplumber GitHub](https://github.com/jsvine/pdfplumber)
- [python-docx Documentation](https://python-docx.readthedocs.io/)
- [pdf-parse npm](https://www.npmjs.com/package/pdf-parse)

**Learning Resources**:
- [WebAIM: PDF Accessibility](https://webaim.org/techniques/acrobat/)
- [W3C: WCAG 2 Documents](https://www.w3.org/WAI/standards-guidelines/wcag/docs/)
- [Section 508: Create Accessible Documents](https://www.section508.gov/create/documents/)

---

## Appendix A: WCAG 2.2 AA Success Criteria for Documents

(Full list with Level A and AA criteria applicable to PDF/DOCX documents)

### Level A
- 1.1.1 Non-text Content
- 1.2.1 Audio-only and Video-only (Prerecorded)
- 1.2.2 Captions (Prerecorded)
- 1.2.3 Audio Description or Media Alternative (Prerecorded)
- 1.3.1 Info and Relationships
- 1.3.2 Meaningful Sequence
- 1.3.3 Sensory Characteristics
- 1.4.1 Use of Color
- 1.4.2 Audio Control
- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 2.1.4 Character Key Shortcuts
- 2.2.1 Timing Adjustable
- 2.2.2 Pause, Stop, Hide
- 2.3.1 Three Flashes or Below Threshold
- 2.4.1 Bypass Blocks
- 2.4.2 Page Titled
- 2.4.3 Focus Order
- 2.4.4 Link Purpose (In Context)
- 2.5.1 Pointer Gestures
- 2.5.2 Pointer Cancellation
- 2.5.3 Label in Name
- 2.5.4 Motion Actuation
- 3.1.1 Language of Page
- 3.2.1 On Focus
- 3.2.2 On Input
- 3.2.6 Consistent Help
- 3.3.1 Error Identification
- 3.3.2 Labels or Instructions
- 3.3.7 Redundant Entry
- 4.1.2 Name, Role, Value

### Level AA
- 1.2.4 Captions (Live)
- 1.2.5 Audio Description (Prerecorded)
- 1.3.4 Orientation
- 1.3.5 Identify Input Purpose
- 1.4.3 Contrast (Minimum)
- 1.4.4 Resize Text
- 1.4.5 Images of Text
- 1.4.10 Reflow
- 1.4.11 Non-text Contrast
- 1.4.12 Text Spacing
- 1.4.13 Content on Hover or Focus
- 2.4.5 Multiple Ways
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible
- 2.4.11 Focus Not Obscured (Minimum)
- 2.5.7 Dragging Movements
- 2.5.8 Target Size (Minimum)
- 3.1.2 Language of Parts
- 3.2.3 Consistent Navigation
- 3.2.4 Consistent Identification
- 3.3.3 Error Suggestion
- 3.3.4 Error Prevention (Legal, Financial, Data)
- 3.3.8 Accessible Authentication (Minimum)
- 4.1.3 Status Messages

---

## Appendix B: Sample PDF/UA Validation Report (PAC)

```
PDF Accessibility Checker (PAC) 2024
Report for: annual-report-2024.pdf

Summary:
- PDF/UA Compliance: FAIL
- WCAG 2.0 Level AA: FAIL
- Errors: 47
- Warnings: 12

Errors:
1. Document is not tagged
   Type: Structure
   Severity: Critical
   Impact: Screen readers cannot parse document

2. Missing alternative text (12 instances)
   Pages: 3, 7, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39
   Severity: Critical
   SC: 1.1.1 Non-text Content (Level A)

3. No document title
   Severity: Moderate
   SC: 2.4.2 Page Titled (Level A)

4. Language not specified
   Severity: Moderate
   SC: 3.1.1 Language of Page (Level A)

5. Color contrast insufficient (3 instances)
   Pages: 8, 15, 22
   Severity: Serious
   SC: 1.4.3 Contrast (Minimum) (Level AA)

Warnings:
1. Suspect heading structure (skipped levels)
   Pages: 5, 10, 18
   Recommendation: Use sequential heading levels

2. Complex tables without headers
   Pages: 12, 28
   Recommendation: Mark header rows and columns

Recommendations:
1. Tag the PDF using Adobe Acrobat
2. Set document title and language in metadata
3. Add alternative text to all images
4. Fix color contrast issues
5. Correct heading hierarchy
6. Add table headers

Estimated Remediation Time: 8-12 hours
```

---

**End of Research Document**
