"""
Main handler for the report generation Netlify Function.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, Optional
from io import BytesIO

from .models import AuditData, ReportRequest, ErrorResponse
from .templates.word_template import generate_word_report
from .templates.html_template import generate_html_report
from .templates.markdown_template import generate_markdown_report
from .templates.text_template import generate_text_report
from .ai_summary import generate_executive_summary


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Netlify Function handler for report generation.
    
    Args:
        event: Netlify event object with httpMethod, body, headers, etc.
        context: Netlify context object
        
    Returns:
        Response object with statusCode, headers, and body
    """
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Report-Service-Key",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
    }
    
    # Handle preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": headers,
            "body": "",
        }
    
    # Only accept POST
    if event.get("httpMethod") != "POST":
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": "METHOD_NOT_ALLOWED", "message": "Only POST requests are accepted"}),
        }
    
    # Verify authentication
    api_key = event.get("headers", {}).get("x-report-service-key") or event.get("headers", {}).get("X-Report-Service-Key")
    expected_key = os.environ.get("REPORT_SERVICE_KEY")
    
    if not expected_key:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": "SERVER_CONFIG_ERROR", "message": "Report service not configured"}),
        }
    
    if not api_key or api_key != expected_key:
        return {
            "statusCode": 401,
            "headers": headers,
            "body": json.dumps({"error": "UNAUTHORIZED", "message": "Invalid or missing API key"}),
        }
    
    try:
        # Parse request body
        body = event.get("body", "{}")
        if isinstance(body, str):
            request_data = json.loads(body)
        else:
            request_data = body
        
        # Validate request
        try:
            report_request = ReportRequest(**request_data)
        except Exception as e:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "error": "INVALID_REQUEST",
                    "message": f"Request validation failed: {str(e)}"
                }),
            }
        
        # Generate executive summary if requested
        executive_summary = None
        if report_request.include_ai_summary:
            try:
                executive_summary = generate_executive_summary(
                    report_request.audit_data,
                    report_request.locale
                )
            except Exception as e:
                # Don't fail the entire request if AI summary fails
                print(f"Warning: Failed to generate AI summary: {e}")
                executive_summary = _generate_fallback_summary(report_request.audit_data, report_request.locale)
        
        # Determine output format from template or query parameter
        format_type = _get_format_from_template(report_request.template)
        query_format = event.get("queryStringParameters", {}).get("format")
        if query_format:
            format_type = query_format
        
        # Generate report in requested format
        start_time = datetime.now()
        
        if format_type == "html":
            report_content = generate_html_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
            content_type = "text/html; charset=utf-8"
            filename = f"accessibility-report-{report_request.audit_id}.html"
            is_binary = False
            
        elif format_type == "markdown":
            report_content = generate_markdown_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
            content_type = "text/markdown; charset=utf-8"
            filename = f"accessibility-report-{report_request.audit_id}.md"
            is_binary = False
            
        elif format_type == "text":
            report_content = generate_text_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale
            )
            content_type = "text/plain; charset=utf-8"
            filename = f"accessibility-report-{report_request.audit_id}.txt"
            is_binary = False
            
        else:  # Default to Word document
            report_buffer = generate_word_report(
                report_request.audit_data,
                executive_summary,
                report_request.locale,
                report_request.template
            )
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            filename = f"accessibility-report-{report_request.audit_id}.docx"
            is_binary = True
            # For binary content, Netlify expects base64
            import base64
            report_content = base64.b64encode(report_buffer.getvalue()).decode('utf-8')
        
        generation_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Build response headers
        response_headers = {
            **headers,
            "Content-Type": content_type,
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Report-ID": report_request.audit_id,
            "X-Generation-Time-Ms": str(generation_time),
        }
        
        return {
            "statusCode": 200,
            "headers": response_headers,
            "body": report_content,
            "isBase64Encoded": is_binary,
        }
        
    except json.JSONDecodeError as e:
        return {
            "statusCode": 400,
            "headers": headers,
            "body": json.dumps({
                "error": "INVALID_JSON",
                "message": f"Failed to parse request body: {str(e)}"
            }),
        }
    except Exception as e:
        print(f"Error generating report: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "error": "GENERATION_ERROR",
                "message": f"Failed to generate report: {str(e)}"
            }),
        }


def _get_format_from_template(template: str) -> str:
    """Map template name to output format."""
    template_format_map = {
        "etu-standard": "word",
        "etu-detailed": "word",
        "etu-summary": "word",
        "html": "html",
        "markdown": "markdown",
        "text": "text",
    }
    return template_format_map.get(template, "word")


def _generate_fallback_summary(audit_data: AuditData, locale: str) -> str:
    """Generate a simple template-based summary if AI fails."""
    if locale == "sv-SE":
        return f"""
Denna rapport innehåller {audit_data.total_issues} tillgänglighetsproblem funna i granskningen.
Problemen är kategoriserade enligt WCAG 2.2 AA:s fyra principer:
- Möjlig att uppfatta: {audit_data.perceivable_count} problem
- Hanterbar: {audit_data.operable_count} problem  
- Begriplig: {audit_data.understandable_count} problem
- Robust: {audit_data.robust_count} problem

En detaljerad genomgång av varje problem med åtgärdsrekommendationer finns nedan.
""".strip()
    else:
        return f"""
This report contains {audit_data.total_issues} accessibility issues found during the audit.
Issues are categorized by the four WCAG 2.2 AA principles:
- Perceivable: {audit_data.perceivable_count} issues
- Operable: {audit_data.operable_count} issues
- Understandable: {audit_data.understandable_count} issues
- Robust: {audit_data.robust_count} issues

A detailed breakdown of each issue with remediation recommendations follows below.
""".strip()
