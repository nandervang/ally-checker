/**
 * AI Agent Service
 * 
 * Handles communication with Netlify Functions for AI-powered audits
 */

import type { AuditResult, AuditIssue } from "@/data/mockAuditResults";

interface AIAuditRequest {
  mode: "url" | "html" | "snippet";
  content: string;
  model: "claude" | "gemini" | "gpt4";
  language?: string;
}

interface AIAuditResponse {
  summary: {
    url?: string;
    timestamp: string;
    totalIssues: number;
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;
    passCount: number;
    model: string;
  };
  issues: AuditIssue[];
  wcagCompliance: {
    levelA: { passed: number; failed: number; percentage: number };
    levelAA: { passed: number; failed: number; percentage: number };
    levelAAA: { passed: number; failed: number; percentage: number };
  };
  rawAnalysis: string;
  toolResults: Array<{ tool: string; result: unknown; error?: string }>;
  mcpToolsUsed?: string[];
  sourcesConsulted?: string[];
  auditMethodology?: {
    model: string;
    phases: Array<{ phase: string; description: string }>;
    totalToolCalls: number;
    uniqueToolsUsed: number;
    wcagCriteriaResearched: number;
    ariaPatternsConsulted: number;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Call AI agent to perform comprehensive accessibility audit
 */
export async function runAIAgentAudit(
  request: AIAuditRequest
): Promise<AuditResult> {
  const functionUrl =
    import.meta.env.VITE_NETLIFY_FUNCTIONS_URL ||
    "/.netlify/functions/ai-agent-audit";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add API key if configured
    const apiKey = import.meta.env?.VITE_REPORT_SERVICE_KEY;
    console.log('[DEBUG aiAgentService] VITE_REPORT_SERVICE_KEY:', apiKey ? 'SET' : 'NOT SET', apiKey?.substring(0, 10));
    console.log('[DEBUG aiAgentService] import.meta.env:', import.meta.env);
    if (apiKey) {
      headers["X-Report-Service-Key"] = apiKey;
    }

    const response = await fetch(functionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      const errorMessage = error.details || error.error || "AI audit failed";
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as AIAuditResponse;

    // Convert AI response to AuditResult format
    return convertToAuditResult(data, request);
  } catch (error) {
    console.error("AI Agent Audit Error:", error);
    throw error;
  }
}

/**
 * Convert AI audit response to standard AuditResult format
 */
function convertToAuditResult(
  response: AIAuditResponse,
  request: AIAuditRequest
): AuditResult {
  // Map backend response to agent_trace format
  const agent_trace = {
    duration_ms: response.duration_ms,
    tools_used: response.mcpToolsUsed || [],
    sources_consulted: response.sourcesConsulted || [],
    steps: [
      {
        action: 'ai_agent_analysis',
        timestamp: response.summary.timestamp,
        tool: response.summary.model,
        reasoning: `Analyzed ${request.mode} using ${response.summary.model}`,
        output: `Found ${response.summary.totalIssues} accessibility issues across ${response.issues.filter(i => i.wcag_principle).length} WCAG principles`,
      },
    ],
  };

  return {
    url: request.mode === "url" ? request.content : undefined,
    timestamp: response.summary.timestamp,
    summary: {
      totalIssues: response.summary.totalIssues,
      critical: response.summary.criticalCount,
      serious: response.summary.seriousCount,
      moderate: response.summary.moderateCount,
      minor: response.summary.minorCount,
      passed: response.summary.passCount,
      failed: response.summary.totalIssues,
    },
    issues: response.issues,
    agent_trace,
  };
}

/**
 * Check if AI agent features are available
 */
export function isAIAgentAvailable(): boolean {
  // Check if API key is configured
  const hasApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  // In development, always return true for testing
  if (import.meta.env.DEV) {
    return true;
  }

  return hasApiKey;
}

/**
 * Get estimated audit time for AI agent mode
 */
export function getEstimatedAuditTime(mode: "url" | "html" | "snippet"): string {
  switch (mode) {
    case "url":
      return "30-60 seconds";
    case "html":
      return "20-40 seconds";
    case "snippet":
      return "10-20 seconds";
    default:
      return "~30 seconds";
  }
}
