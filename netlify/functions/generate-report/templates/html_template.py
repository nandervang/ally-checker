"""
HTML report template generation.
"""

from typing import Optional
from jinja2 import Template

from ..models import AuditData


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="{{ 'sv' if locale == 'sv-SE' else 'en' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ 'Tillgänglighetsrapport' if locale == 'sv-SE' else 'Accessibility Report' }} - {{ audit_data.created_at.strftime('%Y-%m-%d') }}</title>
    <style>
        :root {
            --primary-color: #003366;
            --secondary-color: #006699;
            --critical-color: #990000;
            --serious-color: #CC3300;
            --moderate-color: #CC9900;
            --minor-color: #669900;
            --bg-color: #ffffff;
            --text-color: #1a1a1a;
            --border-color: #cccccc;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 18px;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        header {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 3rem 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        h2 {
            font-size: 2rem;
            color: var(--primary-color);
            margin: 2rem 0 1rem;
            border-bottom: 3px solid var(--secondary-color);
            padding-bottom: 0.5rem;
        }
        
        h3 {
            font-size: 1.5rem;
            color: var(--secondary-color);
            margin: 1.5rem 0 1rem;
        }
        
        .metadata {
            background-color: #f5f5f5;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }
        
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        
        .metadata-label {
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 0.25rem;
        }
        
        .executive-summary {
            background-color: #e8f4f8;
            border-left: 5px solid var(--secondary-color);
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 4px;
        }
        
        .overview {
            background-color: #f9f9f9;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 2rem 0;
        }
        
        .principle-section {
            margin: 2rem 0;
            padding: 1.5rem;
            background-color: #fafafa;
            border-radius: 8px;
        }
        
        .issue-card {
            background-color: white;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .issue-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .severity-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
            text-transform: uppercase;
            color: white;
        }
        
        .severity-critical { background-color: var(--critical-color); }
        .severity-serious { background-color: var(--serious-color); }
        .severity-moderate { background-color: var(--moderate-color); }
        .severity-minor { background-color: var(--minor-color); }
        
        .issue-meta {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 1rem;
        }
        
        .issue-description, .issue-remediation {
            margin: 1rem 0;
        }
        
        .issue-description strong, .issue-remediation strong {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--primary-color);
        }
        
        .code-snippet {
            background-color: #f4f4f4;
            border-left: 4px solid var(--secondary-color);
            padding: 1rem;
            margin: 1rem 0;
            overflow-x: auto;
            border-radius: 4px;
        }
        
        .code-snippet code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9rem;
        }
        
        .scorecard {
            background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
        }
        
        .compliance-status {
            text-align: center;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 2rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .stat-card {
            background-color: white;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            line-height: 1;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1rem;
            color: #666;
        }
        
        footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border-color);
            color: #666;
            font-size: 0.9rem;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            h1 {
                font-size: 2rem;
            }
            h2 {
                font-size: 1.5rem;
            }
            .metadata-grid, .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header role="banner">
        <h1>{{ 'Tillgänglighetsrapport' if locale == 'sv-SE' else 'Accessibility Audit Report' }}</h1>
        <p>{{ 'WCAG 2.2 AA Kompatibilitetsbedömning' if locale == 'sv-SE' else 'WCAG 2.2 AA Compliance Assessment' }}</p>
    </header>
    
    <main role="main">
        <section class="metadata" aria-labelledby="metadata-heading">
            <h2 id="metadata-heading">{{ 'Metadata' if locale == 'sv-SE' else 'Audit Metadata' }}</h2>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="metadata-label">{{ 'Granskad källa' if locale == 'sv-SE' else 'Audited Source' }}:</span>
                    <span>{{ audit_data.url or 'HTML Input' }}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">{{ 'Granskningsdatum' if locale == 'sv-SE' else 'Audit Date' }}:</span>
                    <span>{{ audit_data.created_at.strftime('%Y-%m-%d %H:%M') }}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">{{ 'Typ av input' if locale == 'sv-SE' else 'Input Type' }}:</span>
                    <span>{{ audit_data.input_type }}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">{{ 'Totalt antal problem' if locale == 'sv-SE' else 'Total Issues' }}:</span>
                    <span>{{ audit_data.total_issues }}</span>
                </div>
            </div>
        </section>
        
        {% if executive_summary %}
        <section class="executive-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">{{ 'Sammanfattning' if locale == 'sv-SE' else 'Executive Summary' }}</h2>
            <p>{{ executive_summary }}</p>
        </section>
        {% endif %}
        
        <section class="overview" aria-labelledby="overview-heading">
            <h2 id="overview-heading">{{ 'Översikt' if locale == 'sv-SE' else 'Overview' }}</h2>
            <p>{{ 'Denna granskning identifierade' if locale == 'sv-SE' else 'This audit identified' }} <strong>{{ audit_data.total_issues }}</strong> {{ 'tillgänglighetsproblem organiserade enligt WCAG 2.2 AA:s fyra principer' if locale == 'sv-SE' else 'accessibility issues organized by the four WCAG 2.2 AA principles' }}:</p>
            <ul style="margin-top: 1rem; margin-left: 2rem;">
                <li><strong>{{ 'Möjlig att uppfatta' if locale == 'sv-SE' else 'Perceivable' }}:</strong> {{ audit_data.perceivable_count }} {{ 'problem' if locale == 'sv-SE' else 'issues' }}</li>
                <li><strong>{{ 'Hanterbar' if locale == 'sv-SE' else 'Operable' }}:</strong> {{ audit_data.operable_count }} {{ 'problem' if locale == 'sv-SE' else 'issues' }}</li>
                <li><strong>{{ 'Begriplig' if locale == 'sv-SE' else 'Understandable' }}:</strong> {{ audit_data.understandable_count }} {{ 'problem' if locale == 'sv-SE' else 'issues' }}</li>
                <li><strong>{{ 'Robust' if locale == 'sv-SE' else 'Robust' }}:</strong> {{ audit_data.robust_count }} {{ 'problem' if locale == 'sv-SE' else 'issues' }}</li>
            </ul>
        </section>
        
        <section aria-labelledby="issues-heading">
            <h2 id="issues-heading">{{ 'Problem efter princip' if locale == 'sv-SE' else 'Issues by Principle' }}</h2>
            
            {% for principle, principle_name in [
                ('Perceivable', 'Möjlig att uppfatta' if locale == 'sv-SE' else 'Perceivable'),
                ('Operable', 'Hanterbar' if locale == 'sv-SE' else 'Operable'),
                ('Understandable', 'Begriplig' if locale == 'sv-SE' else 'Understandable'),
                ('Robust', 'Robust' if locale == 'sv-SE' else 'Robust')
            ] %}
                {% set principle_issues = audit_data.issues | selectattr('wcag_principle', 'equalto', principle) | list %}
                {% if principle_issues %}
                <div class="principle-section">
                    <h3>{{ principle_name }} ({{ principle_issues | length }})</h3>
                    
                    {% for issue in principle_issues %}
                    <article class="issue-card">
                        <div class="issue-header">
                            <div class="issue-title">{{ issue.success_criterion_name or issue.success_criterion }}</div>
                            <span class="severity-badge severity-{{ issue.severity }}">{{ issue.severity }}</span>
                        </div>
                        
                        <div class="issue-meta">
                            <strong>{{ 'Framgångskriterium' if locale == 'sv-SE' else 'Success Criterion' }}:</strong> {{ issue.success_criterion }}
                            {% if issue.detection_source %}
                            | <strong>{{ 'Källa' if locale == 'sv-SE' else 'Source' }}:</strong> {{ issue.detection_source }}
                            {% endif %}
                        </div>
                        
                        <div class="issue-description">
                            <strong>{{ 'Beskrivning' if locale == 'sv-SE' else 'Description' }}:</strong>
                            <p>{{ issue.description }}</p>
                        </div>
                        
                        {% if issue.element_snippet %}
                        <div class="code-snippet">
                            <strong>{{ 'Kod' if locale == 'sv-SE' else 'Code' }}:</strong>
                            <code>{{ issue.element_snippet }}</code>
                        </div>
                        {% endif %}
                        
                        <div class="issue-remediation">
                            <strong>{{ 'Åtgärd' if locale == 'sv-SE' else 'Remediation' }}:</strong>
                            <p>{{ issue.remediation }}</p>
                        </div>
                        
                        {% if issue.wcag_reference_url %}
                        <p><a href="{{ issue.wcag_reference_url }}" target="_blank" rel="noopener noreferrer">{{ 'WCAG-referens' if locale == 'sv-SE' else 'WCAG Reference' }}</a></p>
                        {% endif %}
                    </article>
                    {% endfor %}
                </div>
                {% endif %}
            {% endfor %}
        </section>
        
        <section class="scorecard" aria-labelledby="scorecard-heading">
            <h2 id="scorecard-heading">{{ 'Efterlevnadssammanfattning' if locale == 'sv-SE' else 'Compliance Scorecard' }}</h2>
            
            {% set critical_count = audit_data.issues | selectattr('severity', 'equalto', 'critical') | list | length %}
            {% set serious_count = audit_data.issues | selectattr('severity', 'equalto', 'serious') | list | length %}
            {% set moderate_count = audit_data.issues | selectattr('severity', 'equalto', 'moderate') | list | length %}
            {% set minor_count = audit_data.issues | selectattr('severity', 'equalto', 'minor') | list | length %}
            
            {% if critical_count > 0 %}
                {% set status = 'Ej efterlevnad' if locale == 'sv-SE' else 'Non-Compliant' %}
                {% set status_color = '#990000' %}
            {% elif serious_count > 0 %}
                {% set status = 'Delvis efterlevnad' if locale == 'sv-SE' else 'Partially Compliant' %}
                {% set status_color = '#CC9900' %}
            {% elif audit_data.total_issues > 0 %}
                {% set status = 'Huvudsakligen efterlevnad' if locale == 'sv-SE' else 'Mostly Compliant' %}
                {% set status_color = '#669900' %}
            {% else %}
                {% set status = 'Fullt efterlevnad' if locale == 'sv-SE' else 'Fully Compliant' %}
                {% set status_color = '#009900' %}
            {% endif %}
            
            <div class="compliance-status" style="color: {{ status_color }};">{{ status }}</div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">{{ audit_data.total_issues }}</div>
                    <div class="stat-label">{{ 'Totalt problem' if locale == 'sv-SE' else 'Total Issues' }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #990000;">{{ critical_count }}</div>
                    <div class="stat-label">{{ 'Kritiska' if locale == 'sv-SE' else 'Critical' }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #CC3300;">{{ serious_count }}</div>
                    <div class="stat-label">{{ 'Allvarliga' if locale == 'sv-SE' else 'Serious' }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #CC9900;">{{ moderate_count }}</div>
                    <div class="stat-label">{{ 'Måttliga' if locale == 'sv-SE' else 'Moderate' }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #669900;">{{ minor_count }}</div>
                    <div class="stat-label">{{ 'Mindre' if locale == 'sv-SE' else 'Minor' }}</div>
                </div>
            </div>
        </section>
    </main>
    
    <footer role="contentinfo">
        <p>{{ 'Detta dokument genererades automatiskt av ETU Tillgänglighetskontroll.' if locale == 'sv-SE' else 'This document was automatically generated by ETU Accessibility Checker.' }}</p>
        <p>{{ audit_data.created_at.strftime('%Y-%m-%d %H:%M:%S') }}</p>
    </footer>
</body>
</html>
"""


def generate_html_report(
    audit_data: AuditData,
    executive_summary: Optional[str],
    locale: str = "sv-SE"
) -> str:
    """
    Generate HTML accessibility report.
    
    Args:
        audit_data: Audit results data
        executive_summary: AI-generated summary (optional)
        locale: Language locale
        
    Returns:
        HTML string
    """
    template = Template(HTML_TEMPLATE)
    return template.render(
        audit_data=audit_data,
        executive_summary=executive_summary,
        locale=locale
    )
