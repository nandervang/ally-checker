"""
AI-powered executive summary generation using PydanticAI.
"""

import os
from typing import Optional
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel

from .models import AuditData


# Initialize PydanticAI agent for summary generation
def _create_summary_agent():
    """Create PydanticAI agent for executive summary generation."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    
    model = OpenAIModel("gpt-4o-mini", api_key=api_key)
    return Agent(
        model=model,
        result_type=str,
        system_prompt="""You are an accessibility expert generating executive summaries for WCAG 2.2 AA audit reports.

Your summaries should be:
- Concise (150-250 words)
- Professional and factual
- Focus on key findings and severity
- Highlight compliance status
- Mention top concerns
- Provide actionable overview

Do not include:
- Technical jargon without explanation
- Overly detailed code references
- Recommendations (those are in the full report)
- Apologetic language

Be direct, clear, and helpful."""
    )


def generate_executive_summary(audit_data: AuditData, locale: str = "en-US") -> str:
    """
    Generate AI-powered executive summary for accessibility audit.
    
    Args:
        audit_data: The audit results to summarize
        locale: Language locale (sv-SE or en-US)
        
    Returns:
        Executive summary text
    """
    try:
        agent = _create_summary_agent()
        
        # Build context for AI
        language = "Swedish" if locale == "sv-SE" else "English"
        
        # Severity breakdown
        severity_counts = {}
        for issue in audit_data.issues:
            severity_counts[issue.severity] = severity_counts.get(issue.severity, 0) + 1
        
        # Top issues by principle
        principle_issues = {
            "Perceivable": [],
            "Operable": [],
            "Understandable": [],
            "Robust": []
        }
        for issue in audit_data.issues:
            principle_issues[issue.wcag_principle].append(issue)
        
        # Build prompt
        prompt = f"""Generate an executive summary in {language} for this accessibility audit:

**Audit Overview:**
- URL/Source: {audit_data.url or 'HTML Input'}
- Input Type: {audit_data.input_type}
- Audit Date: {audit_data.created_at.strftime('%Y-%m-%d')}
- Total Issues: {audit_data.total_issues}

**Severity Breakdown:**
- Critical: {severity_counts.get('critical', 0)}
- Serious: {severity_counts.get('serious', 0)}
- Moderate: {severity_counts.get('moderate', 0)}
- Minor: {severity_counts.get('minor', 0)}

**WCAG Principle Breakdown:**
- Perceivable: {audit_data.perceivable_count} issues
- Operable: {audit_data.operable_count} issues
- Understandable: {audit_data.understandable_count} issues
- Robust: {audit_data.robust_count} issues

**Most Common Issues:**
"""
        # Add top 3 most common success criteria
        criterion_counts = {}
        for issue in audit_data.issues[:10]:  # Sample first 10
            key = f"{issue.success_criterion} - {issue.success_criterion_name or 'Unknown'}"
            criterion_counts[key] = criterion_counts.get(key, 0) + 1
        
        for criterion, count in sorted(criterion_counts.items(), key=lambda x: x[1], reverse=True)[:3]:
            prompt += f"- {criterion}: {count} occurrences\n"
        
        if audit_data.suspected_issue:
            prompt += f"\n**Investigated Concern:** {audit_data.suspected_issue}\n"
        
        prompt += f"\nGenerate a professional executive summary in {language}."
        
        # Run agent
        result = agent.run_sync(prompt)
        return result.data
        
    except Exception as e:
        print(f"Error generating AI summary: {e}")
        raise


def generate_executive_summary_anthropic(audit_data: AuditData, locale: str = "en-US") -> str:
    """
    Alternative: Generate summary using Anthropic Claude via PydanticAI.
    
    This is a fallback option if OpenAI is not available.
    """
    try:
        from pydantic_ai.models.anthropic import AnthropicModel
        
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        
        model = AnthropicModel("claude-3-5-sonnet-20241022", api_key=api_key)
        agent = Agent(
            model=model,
            result_type=str,
            system_prompt="You are an accessibility expert generating executive summaries for WCAG 2.2 AA audit reports."
        )
        
        # Same prompt building logic as above
        language = "Swedish" if locale == "sv-SE" else "English"
        severity_counts = {}
        for issue in audit_data.issues:
            severity_counts[issue.severity] = severity_counts.get(issue.severity, 0) + 1
        
        prompt = f"""Generate a concise {language} executive summary (150-250 words) for this accessibility audit:

Total Issues: {audit_data.total_issues}
- Critical: {severity_counts.get('critical', 0)}
- Serious: {severity_counts.get('serious', 0)}  
- Moderate: {severity_counts.get('moderate', 0)}
- Minor: {severity_counts.get('minor', 0)}

WCAG Principles:
- Perceivable: {audit_data.perceivable_count}
- Operable: {audit_data.operable_count}
- Understandable: {audit_data.understandable_count}
- Robust: {audit_data.robust_count}

Focus on compliance status, key concerns, and overall assessment."""
        
        result = agent.run_sync(prompt)
        return result.data
        
    except Exception as e:
        print(f"Error generating Anthropic summary: {e}")
        raise
