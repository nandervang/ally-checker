"""
Netlify Python Function for Accessibility Report Generation

This function generates professional accessibility audit reports in multiple formats:
- ETU Word (.docx) - Professional branded reports
- HTML - Web-friendly semantic reports
- Markdown - Plain text formatted reports
- Plain Text - Screen reader optimized reports

Uses:
- python-docx for Word document generation
- PydanticAI for AI-generated executive summaries
- Jinja2 for HTML templates
"""

from .main import handler

__all__ = ["handler"]
