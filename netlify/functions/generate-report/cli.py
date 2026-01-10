#!/usr/bin/env python3
"""
Standalone Python script for report generation.
Called by Node.js Netlify function.
Reads JSON from REQUEST_BODY env var, writes binary to stdout.
"""

import json
import os
import sys
from io import BytesIO

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from models import AuditData, ReportRequest
from templates.word_template import generate_word_report
from templates.html_template import generate_html_report
from templates.markdown_template import generate_markdown_report
from templates.text_template import generate_text_report

# Try to import AI summary, but make it optional
try:
    from ai_summary import generate_executive_summary
    AI_SUMMARY_AVAILABLE = True
except ImportError:
    AI_SUMMARY_AVAILABLE = False
    def generate_executive_summary(*args, **kwargs):
        return None


def main():
    try:
        # Read request from environment
        request_json = os.environ.get("REQUEST_BODY", "{}")
        request_data = json.loads(request_json)
        
        # Parse and validate request
        report_request = ReportRequest(**request_data)
        
        # Generate executive summary if requested
        executive_summary = None
        if report_request.include_ai_summary and AI_SUMMARY_AVAILABLE:
            try:
                executive_summary = generate_executive_summary(report_request.audit_data)
            except Exception as e:
                print(f"AI summary generation failed: {e}", file=sys.stderr)
        
        # Select template based on format
        format_type = report_request.format
        
        if format_type == "word":
            blob = generate_word_report(
                report_request.audit_data,
                report_request.template,
                executive_summary,
                report_request.locale
            )
        elif format_type == "html":
            blob = generate_html_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
        elif format_type == "markdown":
            blob = generate_markdown_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
        elif format_type == "text":
            blob = generate_text_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
        else:
            error = {"error": "INVALID_FORMAT", "message": f"Unsupported format: {format_type}", "statusCode": 400}
            print(json.dumps(error))
            sys.exit(1)
        
        # Write binary data to stdout
        sys.stdout.buffer.write(blob.getvalue())
        sys.exit(0)
        
    except Exception as e:
        error = {
            "error": "REPORT_GENERATION_ERROR",
            "message": str(e),
            "statusCode": 500
        }
        print(json.dumps(error))
        sys.exit(1)


if __name__ == "__main__":
    main()
