"""
Tests for report generation function.
"""

import pytest
from datetime import datetime
from io import BytesIO

from ..models import AuditData, ReportIssue, ReportRequest
from ..templates.word_template import generate_word_report
from ..templates.html_template import generate_html_report
from ..templates.markdown_template import generate_markdown_report
from ..templates.text_template import generate_text_report


@pytest.fixture
def sample_audit_data():
    """Sample audit data for testing."""
    return AuditData(
        url="https://example.com",
        input_type="url",
        created_at=datetime.now(),
        total_issues=5,
        perceivable_count=2,
        operable_count=1,
        understandable_count=1,
        robust_count=1,
        issues=[
            ReportIssue(
                wcag_principle="Perceivable",
                success_criterion="1.1.1",
                success_criterion_name="Non-text Content",
                severity="critical",
                description="Image missing alt text",
                element_snippet='<img src="cat.jpg">',
                detection_source="axe-core",
                remediation="Add descriptive alt text to the image element",
                wcag_reference_url="https://www.w3.org/WAI/WCAG22/Understanding/non-text-content"
            ),
            ReportIssue(
                wcag_principle="Perceivable",
                success_criterion="1.4.3",
                success_criterion_name="Contrast (Minimum)",
                severity="serious",
                description="Text has insufficient color contrast",
                detection_source="axe-core",
                remediation="Increase color contrast to at least 4.5:1"
            ),
            ReportIssue(
                wcag_principle="Operable",
                success_criterion="2.1.1",
                success_criterion_name="Keyboard",
                severity="serious",
                description="Interactive element not keyboard accessible",
                detection_source="ai-heuristic",
                remediation="Ensure all interactive elements are keyboard accessible"
            ),
            ReportIssue(
                wcag_principle="Understandable",
                success_criterion="3.1.1",
                success_criterion_name="Language of Page",
                severity="moderate",
                description="Page language not declared",
                detection_source="axe-core",
                remediation="Add lang attribute to html element"
            ),
            ReportIssue(
                wcag_principle="Robust",
                success_criterion="4.1.2",
                success_criterion_name="Name, Role, Value",
                severity="minor",
                description="Custom button missing ARIA label",
                detection_source="ai-heuristic",
                remediation="Add aria-label or aria-labelledby to custom button"
            ),
        ]
    )


def test_word_report_generation(sample_audit_data):
    """Test Word document generation."""
    buffer = generate_word_report(
        audit_data=sample_audit_data,
        executive_summary="This is a test summary.",
        locale="en-US",
        template="etu-standard"
    )
    
    assert isinstance(buffer, BytesIO)
    assert buffer.tell() == 0  # Buffer should be at start
    
    # Read some bytes to verify it's a valid Word document
    magic = buffer.read(4)
    assert magic == b'PK\x03\x04'  # ZIP file magic number (docx is a ZIP)
    

def test_html_report_generation(sample_audit_data):
    """Test HTML report generation."""
    html = generate_html_report(
        audit_data=sample_audit_data,
        executive_summary="This is a test summary.",
        locale="en-US"
    )
    
    assert isinstance(html, str)
    assert "<!DOCTYPE html>" in html
    assert "Accessibility Audit Report" in html
    assert "Non-text Content" in html
    assert "1.1.1" in html
    assert "critical" in html.lower()


def test_markdown_report_generation(sample_audit_data):
    """Test Markdown report generation."""
    markdown = generate_markdown_report(
        audit_data=sample_audit_data,
        executive_summary="This is a test summary.",
        locale="en-US"
    )
    
    assert isinstance(markdown, str)
    assert "# Accessibility Audit Report" in markdown
    assert "## Executive Summary" in markdown
    assert "**Success Criterion:** 1.1.1" in markdown
    assert "🔴" in markdown  # Critical emoji


def test_text_report_generation(sample_audit_data):
    """Test plain text report generation."""
    text = generate_text_report(
        audit_data=sample_audit_data,
        executive_summary="This is a test summary.",
        locale="en-US"
    )
    
    assert isinstance(text, str)
    assert "ACCESSIBILITY AUDIT REPORT" in text
    assert "EXECUTIVE SUMMARY" in text
    assert "Success Criterion: 1.1.1" in text
    assert "CRITICAL" in text


def test_swedish_locale(sample_audit_data):
    """Test Swedish localization."""
    html = generate_html_report(
        audit_data=sample_audit_data,
        executive_summary="Detta är en testsammanfattning.",
        locale="sv-SE"
    )
    
    assert "Tillgänglighetsrapport" in html
    assert "Sammanfattning" in html
    assert "Möjlig att uppfatta" in html
    

def test_report_without_summary(sample_audit_data):
    """Test report generation without executive summary."""
    markdown = generate_markdown_report(
        audit_data=sample_audit_data,
        executive_summary=None,
        locale="en-US"
    )
    
    assert "## Executive Summary" not in markdown
    assert "## Overview" in markdown


def test_empty_audit(sample_audit_data):
    """Test report with no issues."""
    sample_audit_data.issues = []
    sample_audit_data.total_issues = 0
    sample_audit_data.perceivable_count = 0
    sample_audit_data.operable_count = 0
    sample_audit_data.understandable_count = 0
    sample_audit_data.robust_count = 0
    
    html = generate_html_report(
        audit_data=sample_audit_data,
        executive_summary="No issues found.",
        locale="en-US"
    )
    
    assert "0" in html  # Should show 0 issues
    assert "Fully Compliant" in html or "fully" in html.lower()


def test_severity_counts(sample_audit_data):
    """Test severity counting in reports."""
    markdown = generate_markdown_report(
        audit_data=sample_audit_data,
        executive_summary=None,
        locale="en-US"
    )
    
    # Should have proper counts
    assert "| 🔴 Critical | 1 |" in markdown
    assert "| 🟠 Serious | 2 |" in markdown
    assert "| 🟡 Moderate | 1 |" in markdown
    assert "| 🟢 Minor | 1 |" in markdown


def test_principle_grouping(sample_audit_data):
    """Test issues are properly grouped by WCAG principle."""
    text = generate_text_report(
        audit_data=sample_audit_data,
        executive_summary=None,
        locale="en-US"
    )
    
    assert "PERCEIVABLE (2 ISSUES)" in text
    assert "OPERABLE (1 ISSUES)" in text
    assert "UNDERSTANDABLE (1 ISSUES)" in text
    assert "ROBUST (1 ISSUES)" in text
