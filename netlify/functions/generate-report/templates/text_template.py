"""
Plain text report template generation (screen reader optimized).
"""

from typing import Optional

from ..models import AuditData


def generate_text_report(
    audit_data: AuditData,
    executive_summary: Optional[str],
    locale: str = "sv-SE"
) -> str:
    """
    Generate plain text accessibility report optimized for screen readers.
    
    Args:
        audit_data: Audit results data
        executive_summary: AI-generated summary (optional)
        locale: Language locale
        
    Returns:
        Plain text string
    """
    lines = []
    separator = "=" * 80
    subseparator = "-" * 80
    
    # Title
    title = "TILLGÄNGLIGHETSRAPPORT" if locale == "sv-SE" else "ACCESSIBILITY AUDIT REPORT"
    lines.append(separator)
    lines.append(title.center(80))
    lines.append("WCAG 2.2 AA COMPLIANCE ASSESSMENT".center(80) if locale == "en-US" else "WCAG 2.2 AA KOMPATIBILITETSBEDÖMNING".center(80))
    lines.append(separator)
    lines.append("")
    
    # Metadata
    lines.append("METADATA" if locale == "en-US" else "METADATA")
    lines.append(subseparator)
    lines.append("")
    lines.append(f"{'Granskad källa' if locale == 'sv-SE' else 'Audited Source'}: {audit_data.url or 'HTML Input'}")
    lines.append(f"{'Granskningsdatum' if locale == 'sv-SE' else 'Audit Date'}: {audit_data.created_at.strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"{'Typ av input' if locale == 'sv-SE' else 'Input Type'}: {audit_data.input_type}")
    lines.append(f"{'Totalt antal problem' if locale == 'sv-SE' else 'Total Issues'}: {audit_data.total_issues}")
    lines.append("")
    lines.append("")
    
    # Executive Summary
    if executive_summary:
        lines.append("SAMMANFATTNING" if locale == "sv-SE" else "EXECUTIVE SUMMARY")
        lines.append(subseparator)
        lines.append("")
        # Wrap text at 80 characters for readability
        wrapped_summary = _wrap_text(executive_summary, 80)
        lines.append(wrapped_summary)
        lines.append("")
        lines.append("")
    
    # Overview
    lines.append("ÖVERSIKT" if locale == "sv-SE" else "OVERVIEW")
    lines.append(subseparator)
    lines.append("")
    
    overview_text = (
        f"{'Denna granskning identifierade' if locale == 'sv-SE' else 'This audit identified'} "
        f"{audit_data.total_issues} "
        f"{'tillgänglighetsproblem organiserade enligt WCAG 2.2 AA:s fyra principer' if locale == 'sv-SE' else 'accessibility issues organized by the four WCAG 2.2 AA principles'}:"
    )
    lines.append(_wrap_text(overview_text, 80))
    lines.append("")
    
    principle_names = {
        "sv-SE": {
            "Perceivable": "Möjlig att uppfatta",
            "Operable": "Hanterbar",
            "Understandable": "Begriplig",
            "Robust": "Robust"
        },
        "en-US": {
            "Perceivable": "Perceivable",
            "Operable": "Operable",
            "Understandable": "Understandable",
            "Robust": "Robust"
        }
    }
    
    lines.append(f"  - {principle_names[locale]['Perceivable']}: {audit_data.perceivable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"  - {principle_names[locale]['Operable']}: {audit_data.operable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"  - {principle_names[locale]['Understandable']}: {audit_data.understandable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"  - {principle_names[locale]['Robust']}: {audit_data.robust_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append("")
    lines.append("")
    
    # Issues by Principle
    lines.append("PROBLEM EFTER PRINCIP" if locale == "sv-SE" else "ISSUES BY PRINCIPLE")
    lines.append(subseparator)
    lines.append("")
    
    principles = ["Perceivable", "Operable", "Understandable", "Robust"]
    issue_number = 1
    
    for principle in principles:
        principle_issues = [i for i in audit_data.issues if i.wcag_principle == principle]
        if not principle_issues:
            continue
        
        lines.append("")
        lines.append(f"{principle_names[locale][principle].upper()} ({len(principle_issues)} {'PROBLEM' if locale == 'sv-SE' else 'ISSUES'})")
        lines.append("")
        
        for issue in principle_issues:
            lines.append(f"{'Problem' if locale == 'sv-SE' else 'Issue'} {issue_number}: {issue.success_criterion_name or issue.success_criterion}")
            lines.append("")
            
            lines.append(f"  {'Framgångskriterium' if locale == 'sv-SE' else 'Success Criterion'}: {issue.success_criterion}")
            
            severity_label = {
                "critical": "KRITISK" if locale == "sv-SE" else "CRITICAL",
                "serious": "ALLVARLIG" if locale == "sv-SE" else "SERIOUS",
                "moderate": "MÅTTLIG" if locale == "sv-SE" else "MODERATE",
                "minor": "MINDRE" if locale == "sv-SE" else "MINOR"
            }
            lines.append(f"  {'Allvarlighetsgrad' if locale == 'sv-SE' else 'Severity'}: {severity_label.get(issue.severity, issue.severity.upper())}")
            
            if issue.detection_source:
                lines.append(f"  {'Källa' if locale == 'sv-SE' else 'Source'}: {issue.detection_source}")
            
            lines.append("")
            lines.append(f"  {'Beskrivning' if locale == 'sv-SE' else 'Description'}:")
            lines.append(f"    {_wrap_text(issue.description, 76, '    ')}")
            lines.append("")
            
            if issue.element_snippet:
                lines.append(f"  {'Kod' if locale == 'sv-SE' else 'Code'}:")
                # Indent code snippet
                for code_line in issue.element_snippet.split('\n'):
                    lines.append(f"    {code_line}")
                lines.append("")
            
            lines.append(f"  {'Åtgärd' if locale == 'sv-SE' else 'Remediation'}:")
            lines.append(f"    {_wrap_text(issue.remediation, 76, '    ')}")
            lines.append("")
            
            if issue.wcag_reference_url:
                lines.append(f"  {'WCAG-referens' if locale == 'sv-SE' else 'WCAG Reference'}: {issue.wcag_reference_url}")
                lines.append("")
            
            lines.append(subseparator)
            lines.append("")
            issue_number += 1
    
    # Compliance Scorecard
    lines.append("")
    lines.append("EFTERLEVNADSSAMMANFATTNING" if locale == "sv-SE" else "COMPLIANCE SCORECARD")
    lines.append(separator)
    lines.append("")
    
    # Count by severity
    severity_counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    for issue in audit_data.issues:
        severity_counts[issue.severity] += 1
    
    critical_count = severity_counts["critical"]
    serious_count = severity_counts["serious"]
    
    if critical_count > 0:
        status = "EJ EFTERLEVNAD" if locale == "sv-SE" else "NON-COMPLIANT"
    elif serious_count > 0:
        status = "DELVIS EFTERLEVNAD" if locale == "sv-SE" else "PARTIALLY COMPLIANT"
    elif audit_data.total_issues > 0:
        status = "HUVUDSAKLIGEN EFTERLEVNAD" if locale == "sv-SE" else "MOSTLY COMPLIANT"
    else:
        status = "FULLT EFTERLEVNAD" if locale == "sv-SE" else "FULLY COMPLIANT"
    
    lines.append(f"Status: {status}")
    lines.append("")
    lines.append("")
    
    # Stats
    labels = {
        "sv-SE": ["Totalt problem", "Kritiska", "Allvarliga", "Måttliga", "Mindre"],
        "en-US": ["Total Issues", "Critical", "Serious", "Moderate", "Minor"]
    }
    
    lines.append(f"{labels[locale][0]}: {audit_data.total_issues}")
    lines.append(f"{labels[locale][1]}: {severity_counts['critical']}")
    lines.append(f"{labels[locale][2]}: {severity_counts['serious']}")
    lines.append(f"{labels[locale][3]}: {severity_counts['moderate']}")
    lines.append(f"{labels[locale][4]}: {severity_counts['minor']}")
    lines.append("")
    lines.append("")
    
    # Footer
    lines.append(separator)
    footer_text = (
        "Detta dokument genererades automatiskt av ETU Tillgänglighetskontroll." 
        if locale == "sv-SE" 
        else "This document was automatically generated by ETU Accessibility Checker."
    )
    lines.append(footer_text.center(80))
    lines.append(audit_data.created_at.strftime('%Y-%m-%d %H:%M:%S').center(80))
    lines.append(separator)
    
    return "\n".join(lines)


def _wrap_text(text: str, width: int = 80, subsequent_indent: str = "") -> str:
    """
    Wrap text to specified width for better readability.
    
    Args:
        text: Text to wrap
        width: Maximum line width
        subsequent_indent: Indent for wrapped lines
        
    Returns:
        Wrapped text
    """
    words = text.split()
    if not words:
        return text
    
    lines = []
    current_line = []
    current_length = 0
    
    for word in words:
        word_length = len(word)
        
        if current_length + word_length + len(current_line) <= width:
            current_line.append(word)
            current_length += word_length
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            current_length = word_length
    
    if current_line:
        lines.append(" ".join(current_line))
    
    # Add subsequent indent to wrapped lines
    if subsequent_indent and len(lines) > 1:
        lines = [lines[0]] + [subsequent_indent + line for line in lines[1:]]
    
    return "\n".join(lines)
