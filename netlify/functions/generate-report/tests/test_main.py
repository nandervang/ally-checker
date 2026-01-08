"""
Integration tests for the main report generation handler.
"""

import pytest
import json
import os
from datetime import datetime

from ..main import handler
from ..models import AuditData, ReportIssue


@pytest.fixture
def sample_event():
    """Sample Netlify event for testing."""
    audit_data = {
        "url": "https://example.com",
        "input_type": "url",
        "created_at": datetime.now().isoformat(),
        "total_issues": 2,
        "perceivable_count": 1,
        "operable_count": 1,
        "understandable_count": 0,
        "robust_count": 0,
        "issues": [
            {
                "wcag_principle": "Perceivable",
                "success_criterion": "1.1.1",
                "success_criterion_name": "Non-text Content",
                "severity": "critical",
                "description": "Image missing alt text",
                "element_snippet": '<img src="cat.jpg">',
                "detection_source": "axe-core",
                "remediation": "Add alt text to image"
            },
            {
                "wcag_principle": "Operable",
                "success_criterion": "2.1.1",
                "severity": "serious",
                "description": "Not keyboard accessible",
                "detection_source": "ai-heuristic",
                "remediation": "Add keyboard support"
            }
        ]
    }
    
    request_body = {
        "audit_id": "test-123",
        "template": "etu-standard",
        "audit_data": audit_data,
        "locale": "en-US",
        "include_ai_summary": False  # Skip AI to avoid API calls in tests
    }
    
    return {
        "httpMethod": "POST",
        "headers": {
            "X-Report-Service-Key": "test-key-123"
        },
        "body": json.dumps(request_body)
    }


@pytest.fixture(autouse=True)
def setup_env():
    """Setup environment variables for tests."""
    os.environ["REPORT_SERVICE_KEY"] = "test-key-123"
    yield
    # Cleanup
    if "REPORT_SERVICE_KEY" in os.environ:
        del os.environ["REPORT_SERVICE_KEY"]


def test_handler_word_generation(sample_event):
    """Test handler generates Word document."""
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in response["headers"]["Content-Type"]
    assert response["isBase64Encoded"] is True
    assert "X-Report-ID" in response["headers"]
    assert response["headers"]["X-Report-ID"] == "test-123"


def test_handler_html_generation(sample_event):
    """Test handler generates HTML."""
    sample_event["queryStringParameters"] = {"format": "html"}
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 200
    assert "text/html" in response["headers"]["Content-Type"]
    assert response["isBase64Encoded"] is False
    assert "<!DOCTYPE html>" in response["body"]


def test_handler_markdown_generation(sample_event):
    """Test handler generates Markdown."""
    sample_event["queryStringParameters"] = {"format": "markdown"}
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 200
    assert "text/markdown" in response["headers"]["Content-Type"]
    assert "# Accessibility Audit Report" in response["body"]


def test_handler_text_generation(sample_event):
    """Test handler generates plain text."""
    sample_event["queryStringParameters"] = {"format": "text"}
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 200
    assert "text/plain" in response["headers"]["Content-Type"]
    assert "ACCESSIBILITY AUDIT REPORT" in response["body"]


def test_handler_cors_preflight():
    """Test CORS preflight handling."""
    event = {"httpMethod": "OPTIONS"}
    response = handler(event, {})
    
    assert response["statusCode"] == 204
    assert "Access-Control-Allow-Origin" in response["headers"]
    assert response["body"] == ""


def test_handler_method_not_allowed():
    """Test handler rejects non-POST requests."""
    event = {"httpMethod": "GET"}
    response = handler(event, {})
    
    assert response["statusCode"] == 405
    body = json.loads(response["body"])
    assert body["error"] == "METHOD_NOT_ALLOWED"


def test_handler_missing_auth():
    """Test handler rejects requests without API key."""
    event = {
        "httpMethod": "POST",
        "headers": {},
        "body": "{}"
    }
    response = handler(event, {})
    
    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["error"] == "UNAUTHORIZED"


def test_handler_invalid_auth():
    """Test handler rejects invalid API key."""
    event = {
        "httpMethod": "POST",
        "headers": {"X-Report-Service-Key": "wrong-key"},
        "body": "{}"
    }
    response = handler(event, {})
    
    assert response["statusCode"] == 401
    body = json.loads(response["body"])
    assert body["error"] == "UNAUTHORIZED"


def test_handler_invalid_json():
    """Test handler handles invalid JSON gracefully."""
    event = {
        "httpMethod": "POST",
        "headers": {"X-Report-Service-Key": "test-key-123"},
        "body": "not valid json"
    }
    response = handler(event, {})
    
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"] == "INVALID_JSON"


def test_handler_missing_required_fields(sample_event):
    """Test handler validates required fields."""
    # Remove required field
    body_data = json.loads(sample_event["body"])
    del body_data["audit_id"]
    sample_event["body"] = json.dumps(body_data)
    
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"] == "INVALID_REQUEST"


def test_handler_generation_time_header(sample_event):
    """Test handler includes generation time in response."""
    response = handler(sample_event, {})
    
    assert "X-Generation-Time-Ms" in response["headers"]
    # Should be a reasonable time (less than 10 seconds = 10000ms)
    gen_time = int(response["headers"]["X-Generation-Time-Ms"])
    assert 0 <= gen_time <= 10000


def test_handler_swedish_locale(sample_event):
    """Test handler with Swedish locale."""
    body_data = json.loads(sample_event["body"])
    body_data["locale"] = "sv-SE"
    sample_event["body"] = json.dumps(body_data)
    sample_event["queryStringParameters"] = {"format": "html"}
    
    response = handler(sample_event, {})
    
    assert response["statusCode"] == 200
    assert "Tillgänglighetsrapport" in response["body"]
