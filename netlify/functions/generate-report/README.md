# Python Report Generation Service

This Netlify Function generates professional accessibility audit reports in multiple formats.

## Features

- **Multiple Output Formats**:
  - ETU Word (.docx) - Professional branded reports
  - HTML - Web-friendly semantic reports  
  - Markdown - GitHub/GitLab compatible
  - Plain Text - Screen reader optimized

- **AI-Powered Summaries**: Uses PydanticAI with Gemini (default), OpenAI (GitHub Copilot models), Anthropic, Groq, or Ollama for executive summaries
- **Bilingual Support**: Swedish (sv-SE) and English (en-US)
- **WCAG Organized**: Issues grouped by the four WCAG principles
- **Accessible Documents**: Proper heading structure, color contrast, semantic markup

## API Usage

### Endpoint

```
POST /.netlify/functions/generate-report
```

### Authentication

Include API key in header:
```
X-Report-Service-Key: <your-api-key>
```

### Request Body

```json
{
  "audit_id": "uuid-string",
  "template": "etu-standard",
  "audit_data": {
    "url": "https://example.com",
    "input_type": "url",
    "created_at": "2025-01-05T12:00:00Z",
    "total_issues": 5,
    "perceivable_count": 2,
    "operable_count": 1,
    "understandable_count": 1,
    "robust_count": 1,
    "issues": [
      {
        "wcag_principle": "Perceivable",
        "success_criterion": "1.1.1",
        "success_criterion_name": "Non-text Content",
        "severity": "critical",
        "description": "Image missing alt text",
        "element_snippet": "<img src='cat.jpg'>",
        "detection_source": "axe-core",
        "remediation": "Add descriptive alt text"
      }
    ]
  },
  "locale": "en-US",
  "include_ai_summary": true
}
```

### Query Parameters

- `format`: Override template format (`word`, `html`, `markdown`, `text`)

### Response

Returns the generated report file with appropriate content type.

Headers:
- `Content-Type`: Format-specific MIME type
- `Content-Disposition`: Attachment with filename
- `X-Report-ID`: Audit ID for tracking
- `X-Generation-Time-Ms`: Generation time in milliseconds

## Development

### Setup

```bash
cd netlify/functions/generate-report
pip install -r requirements.txt
```

### Environment Variables

Required:
- `REPORT_SERVICE_KEY`: API authentication key

Optional (at least one recommended for AI summaries):
- `GEMINI_API_KEY`: Google Gemini API key (recommended, fastest/cheapest)
- `OPENAI_API_KEY`: OpenAI API key (same models as GitHub Copilot: GPT-4o, GPT-4o-mini)
- `ANTHROPIC_API_KEY`: Anthropic Claude API key (excellent reasoning)
- `GROQ_API_KEY`: Groq API key (ultra-fast open models)
- Ollama: No API key needed, uses local models if running

The system will automatically try providers in order: Gemini → OpenAI → Anthropic → Groq → Ollama

**Note**: OpenAI provider uses the same GPT-4 models that power GitHub Copilot.

### Testing

```bash
pytest tests/
```

### Local Testing

Use Netlify CLI:
```bash
netlify dev
```

Then POST to: `http://localhost:8888/.netlify/functions/generate-report`

## Templates

### ETU Word Template

Professional branded report with:
- Title page with metadata
- Executive summary (AI-generated)
- Overview with WCAG breakdown
- Issues by principle with color-coded severity
- Compliance scorecard

### HTML Template

Responsive web report with:
- Semantic HTML5 markup
- CSS styling for readability
- Accessibility features (ARIA, headings)
- Mobile-responsive design

### Markdown Template

GitHub/GitLab compatible with:
- Proper heading hierarchy
- Tables for statistics
- Code blocks for snippets
- Emoji severity indicators

### Plain Text Template

Screen reader optimized with:
- Clear hierarchical structure
- 80-column wrapping
- No special formatting
- Ugoogle-generativeai`: Google Gemini support
- `ppercase section headers

## Dependencies

- `python-docx`: Word document generation
- `pydantic-ai`: AI-powered summaries
- `pydantic`: Data validation
- `jinja2`: HTML templating
- `httpx`: HTTP client for AI APIs

## Architecture

```
generate-report/
├── __init__.py           # Package entry
├── main.py               # Main handler
├── models.py             # Pydantic models
├── ai_summary.py         # PydanticAI integration
├── requirements.txt      # Python dependencies
├── templates/
│   ├── word_template.py  # ETU Word generation
│   ├── html_template.py  # HTML generation
│   ├── markdown_template.py # Markdown generation
│   └── text_template.py  # Plain text generation
└── tests/
    ├── test_main.py      # Integration tests
    └── test_templates.py # Template tests
```

## Error Handling

All errors return JSON with:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Status codes:
- `200`: Success
- `400`: Invalid request data
- `401`: Missing/invalid API key
- `405`: Method not allowed
- `500`: Internal error
