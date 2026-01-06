"""
Pydantic models for report generation request/response.
"""

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ReportIssue(BaseModel):
    """Individual accessibility issue."""
    wcag_principle: Literal["Perceivable", "Operable", "Understandable", "Robust"]
    success_criterion: str = Field(pattern=r"^\d\.\d\.\d$")
    success_criterion_name: Optional[str] = None
    severity: Literal["critical", "serious", "moderate", "minor"]
    description: str
    code_location: Optional[str] = None
    element_snippet: Optional[str] = None
    detection_source: Literal["axe-core", "ai-heuristic"]
    remediation: str
    wcag_reference_url: Optional[str] = None
    impact: Optional[Literal["user", "developer", "legal"]] = None


class AuditData(BaseModel):
    """Audit data for report generation."""
    url: Optional[str] = None
    input_type: Literal["url", "html_full", "html_snippet", "issue_only"]
    created_at: datetime
    completed_at: Optional[datetime] = None
    total_issues: int
    perceivable_count: int = 0
    operable_count: int = 0
    understandable_count: int = 0
    robust_count: int = 0
    suspected_issue: Optional[str] = None
    ai_investigation: Optional[dict] = None
    issues: List[ReportIssue]


class CustomReportMetadata(BaseModel):
    """Metadata for custom reports generated from issue selections."""
    report_type: Literal["full", "custom"] = "full"
    total_audit_issues: Optional[int] = None
    selected_issues: Optional[int] = None
    selection_criteria: Optional[str] = None
    generated_at: Optional[datetime] = None


class ReportRequest(BaseModel):
    """Request to generate a report."""
    audit_id: str
    template: Literal["etu-standard", "etu-detailed", "etu-summary", "html", "markdown", "text"] = "etu-standard"
    format: Optional[Literal["word", "html", "markdown", "text"]] = None
    audit_data: AuditData
    locale: Literal["sv-SE", "en-US"] = "sv-SE"
    include_ai_summary: bool = True
    include_screenshots: bool = False
    metadata: Optional[CustomReportMetadata] = None


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    message: str
    details: Optional[dict] = None
    trace_id: Optional[str] = None
