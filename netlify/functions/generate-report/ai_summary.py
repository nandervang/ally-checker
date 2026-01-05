"""
AI-powered executive summary generation using PydanticAI.

Supported AI Providers:
- Gemini (Google): Fast, cost-effective, default choice
- OpenAI (GPT-4): High quality, used by GitHub Copilot
- Anthropic (Claude): Excellent reasoning, alternative option
- Groq: Ultra-fast inference with open models
- Ollama: Local models, no API costs

Provider Priority:
1. Gemini (if GEMINI_API_KEY set)
2. OpenAI (if OPENAI_API_KEY set) - Same models as GitHub Copilot
3. Anthropic (if ANTHROPIC_API_KEY set)
4. Groq (if GROQ_API_KEY set)
5. Ollama (if running locally)
"""

import os
from typing import Optional, Literal
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.models.gemini import GeminiModel

from .models import AuditData


SYSTEM_PROMPT = """You are an accessibility expert generating executive summaries for WCAG 2.2 AA audit reports.

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


# Initialize PydanticAI agent for summary generation
def _create_summary_agent(provider: Literal["openai", "gemini", "anthropic", "groq", "ollama"] = "gemini"):
    """
    Create PydanticAI agent for executive summary generation.
    
    Args:
        provider: AI provider to use (gemini, openai, anthropic, groq, or ollama)
        
    Returns:
        Configured PydanticAI Agent
        
    Note:
        OpenAI uses the same GPT-4 models as GitHub Copilot.
    """
    if provider == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not configured")
        model = GeminiModel("gemini-2.0-flash-exp", api_key=api_key)
        
    elif provider == "openai":
        # Same models as GitHub Copilot (GPT-4o, GPT-4, etc.)
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        model = OpenAIModel("gpt-4o-mini", api_key=api_key)
        
    elif provider == "anthropic":
        from pydantic_ai.models.anthropic import AnthropicModel
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        model = AnthropicModel("claude-3-5-sonnet-20241022", api_key=api_key)
        
    elif provider == "groq":
        from pydantic_ai.models.groq import GroqModel
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not configured")
        # Ultra-fast inference with Llama or Mixtral
        model = GroqModel("llama-3.3-70b-versatile", api_key=api_key)
        
    elif provider == "ollama":
        from pydantic_ai.models.oautomatic fallback chain:
    Gemini → OpenAI (same as GitHub Copilot) → Anthropic → Groq → Ollama
    
    Args:
        audit_data: The audit results to summarize
        locale: Language locale (sv-SE or en-US)
        
    Returns:
        Executive summary text
    """
    # Try providers in order of preference
    providers = []
    
    if os.environ.get("GEMINI_API_KEY"):
        providers.append("gemini")
    if os.environ.get("OPENAI_API_KEY"):  # GitHub Copilot uses these models
        providers.append("openai")
    if os.environ.get("ANTHROPIC_API_KEY"):
        providers.append("anthropic")
    if os.environ.get("GROQ_API_KEY"):
        providers.append("groq")
    
    # Always try Ollama last (local, no API key)
    providers.append("ollama")
    
    if len(providers) == 1:  # Only Ollama
        print("Warning: No cloud AI providers configured, will attempt local Ollama
    Args:
        audit_data: The audit results to summarize
        locale: Language locale (sv-SE or en-US)
        
    Returns:
        Executive summary text
    """
    # Try providers in order: Gemini (default) -> OpenAI -> Anthropic
    providers = []
    
    if os.environ.get("GEMINI_API_KEY"):
        providers.append("gemini")
    if os.environ.get("OPENAI_API_KEY"):
        providers.append("openai")
    if os.environ.get("ANTHROPIC_API_KEY"):
        providers.append("anthropic")
    
    if not providers:
        raise ValueError("No AI provider API keys configured (need GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)")
    
    last_error = None
    for provider in providers:
        try:
            agent = _create_summary_agent(provider)
        
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
            print(f"Error generating AI summary with {provider}: {e}")
            last_error = e
            continue  # Try next provider
    
n result.data
        
    except Exception as e:
        print(f"Error generating Anthropic summary: {e}")
        raise
