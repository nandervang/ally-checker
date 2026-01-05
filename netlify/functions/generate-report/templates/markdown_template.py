"""
Markdown report template generation.
"""

from typing import Optional

from ..models import AuditData


def generate_markdown_report(
    audit_data: AuditData,
    executive_summary: Optional[str],
    locale: str = "sv-SE"
) -> str:
    """
    Generate Markdown accessibility report.
    
    Args:
        audit_data: Audit results data
        executive_summary: AI-generated summary (optional)
        locale: Language locale
        
    Returns:
        Markdown string
    """
    lines = []
    
    # Title
    lines.append(f"# {'Tillgänglighetsrapport' if locale == 'sv-SE' else 'Accessibility Audit Report'}")
    lines.append("")
    lines.append(f"**{'WCAG 2.2 AA Kompatibilitetsbedömning' if locale == 'sv-SE' else 'WCAG 2.2 AA Compliance Assessment'}**")
    lines.append("")
    lines.append("---")
    lines.append("")
    
    # Metadata
    lines.append(f"## {'Metadata' if locale == 'sv-SE' else 'Audit Metadata'}")
    lines.append("")
    lines.append(f"- **{'Granskad källa' if locale == 'sv-SE' else 'Audited Source'}:** {audit_data.url or 'HTML Input'}")
    lines.append(f"- **{'Granskningsdatum' if locale == 'sv-SE' else 'Audit Date'}:** {audit_data.created_at.strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"- **{'Typ av input' if locale == 'sv-SE' else 'Input Type'}:** {audit_data.input_type}")
    lines.append(f"- **{'Totalt antal problem' if locale == 'sv-SE' else 'Total Issues'}:** {audit_data.total_issues}")
    lines.append("")
    
    # Executive Summary
    if executive_summary:
        lines.append(f"## {'Sammanfattning' if locale == 'sv-SE' else 'Executive Summary'}")
        lines.append("")
        lines.append(executive_summary)
        lines.append("")
    
    # Overview
    lines.append(f"## {'Översikt' if locale == 'sv-SE' else 'Overview'}")
    lines.append("")
    lines.append(
        f"{'Denna granskning identifierade' if locale == 'sv-SE' else 'This audit identified'} "
        f"**{audit_data.total_issues}** "
        f"{'tillgänglighetsproblem organiserade enligt WCAG 2.2 AA:s fyra principer' if locale == 'sv-SE' else 'accessibility issues organized by the four WCAG 2.2 AA principles'}:"
    )
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
    
    lines.append(f"- **{principle_names[locale]['Perceivable']}:** {audit_data.perceivable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"- **{principle_names[locale]['Operable']}:** {audit_data.operable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"- **{principle_names[locale]['Understandable']}:** {audit_data.understandable_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append(f"- **{principle_names[locale]['Robust']}:** {audit_data.robust_count} {'problem' if locale == 'sv-SE' else 'issues'}")
    lines.append("")
    
    # Issues by Principle
    lines.append(f"## {'Problem efter princip' if locale == 'sv-SE' else 'Issues by Principle'}")
    lines.append("")
    
    principles = ["Perceivable", "Operable", "Understandable", "Robust"]
    
    for principle in principles:
        principle_issues = [i for i in audit_data.issues if i.wcag_principle == principle]
        if not principle_issues:
            continue
        
        lines.append(f"### {principle_names[locale][principle]} ({len(principle_issues)})")
        lines.append("")
        
        for idx, issue in enumerate(principle_issues, 1):
            lines.append(f"#### {'Problem' if locale == 'sv-SE' else 'Issue'} {idx}: {issue.success_criterion_name or issue.success_criterion}")
            lines.append("")
            
            # Severity badge
            severity_emoji = {
                "critical": "🔴",
                "serious": "🟠",
                "moderate": "🟡",
                "minor": "🟢"
            }
            lines.append(f"**{'Allvarlighetsgrad' if locale == 'sv-SE' else 'Severity'}:** {severity_emoji.get(issue.severity, '⚪')} {issue.severity.upper()}")
            lines.append("")
            
            lines.append(f"**{'Framgångskriterium' if locale == 'sv-SE' else 'Success Criterion'}:** {issue.success_criterion}")
            lines.append("")
            
            if issue.detection_source:
                lines.append(f"**{'Källa' if locale == 'sv-SE' else 'Source'}:** {issue.detection_source}")
                lines.append("")
            
            lines.append(f"**{'Beskrivning' if locale == 'sv-SE' else 'Description'}:**")
            lines.append("")
            lines.append(issue.description)
            lines.append("")
            
            if issue.element_snippet:
                lines.append(f"**{'Kod' if locale == 'sv-SE' else 'Code'}:**")
                lines.append("")
                lines.append("```html")
                lines.append(issue.element_snippet)
                lines.append("```")
                lines.append("")
            
            lines.append(f"**{'Åtgärd' if locale == 'sv-SE' else 'Remediation'}:**")
            lines.append("")
            lines.append(issue.remediation)
            lines.append("")
            
            if issue.wcag_reference_url:
                lines.append(f"**{'WCAG-referens' if locale == 'sv-SE' else 'WCAG Reference'}:** [{issue.success_criterion}]({issue.wcag_reference_url})")
                lines.append("")
            
            lines.append("---")
            lines.append("")
    
    # Compliance Scorecard
    lines.append(f"## {'Efterlevnadssammanfattning' if locale == 'sv-SE' else 'Compliance Scorecard'}")
    lines.append("")
    
    # Count by severity
    severity_counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    for issue in audit_data.issues:
        severity_counts[issue.severity] += 1
    
    critical_count = severity_counts["critical"]
    serious_count = severity_counts["serious"]
    
    if critical_count > 0:
        status = "🔴 " + ("Ej efterlevnad" if locale == "sv-SE" else "Non-Compliant")
    elif serious_count > 0:
        status = "🟡 " + ("Delvis efterlevnad" if locale == "sv-SE" else "Partially Compliant")
    elif audit_data.total_issues > 0:
        status = "🟢 " + ("Huvudsakligen efterlevnad" if locale == "sv-SE" else "Mostly Compliant")
    else:
        status = "✅ " + ("Fullt efterlevnad" if locale == "sv-SE" else "Fully Compliant")
    
    lines.append(f"**Status:** {status}")
    lines.append("")
    
    # Stats table
    lines.append(f"| {'Kategori' if locale == 'sv-SE' else 'Category'} | {'Antal' if locale == 'sv-SE' else 'Count'} |")
    lines.append("|---|---|")
    lines.append(f"| {'Totalt problem' if locale == 'sv-SE' else 'Total Issues'} | {audit_data.total_issues} |")
    lines.append(f"| 🔴 {'Kritiska' if locale == 'sv-SE' else 'Critical'} | {severity_counts['critical']} |")
    lines.append(f"| 🟠 {'Allvarliga' if locale == 'sv-SE' else 'Serious'} | {severity_counts['serious']} |")
    lines.append(f"| 🟡 {'Måttliga' if locale == 'sv-SE' else 'Moderate'} | {severity_counts['moderate']} |")
    lines.append(f"| 🟢 {'Mindre' if locale == 'sv-SE' else 'Minor'} | {severity_counts['minor']} |")
    lines.append("")
    
    # Footer
    lines.append("---")
    lines.append("")
    lines.append(f"*{'Detta dokument genererades automatiskt av ETU Tillgänglighetskontroll.' if locale == 'sv-SE' else 'This document was automatically generated by ETU Accessibility Checker.'}*")
    lines.append(f"*{audit_data.created_at.strftime('%Y-%m-%d %H:%M:%S')}*")
    
    return "\n".join(lines)
