
import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { validateApiKey, getCorsHeaders, createAuthErrorResponse } from "./lib/auth";
import type { Database } from "../../src/types/database";

interface AuditRequest {
  mode: "url" | "html" | "snippet" | "document";
  content: string;
  model: "claude" | "gemini" | "gpt4";
  geminiModel?: "gemini-2.5-flash" | "gemini-2.5-pro";
  language?: string;
  documentType?: "pdf" | "docx";
  filePath?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * AI Agent Audit Function (Dispatcher)
 * 
 * This function accepts the audit request, creates a record in Supabase,
 * and delegates the actual processing to a background function.
 * This prevents timeouts for long-running audits.
 */
export const handler: Handler = async (event: HandlerEvent) => {
  const headers = getCorsHeaders();

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Validate authentication
  const auth = validateApiKey(event);
  if (!auth.isAuthenticated) {
    return createAuthErrorResponse(auth.error!);
  }

  try {
    const body = event.body ?? "{}";
    const request = JSON.parse(body) as AuditRequest;
    
    // Validate request
    if (!request.mode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: mode" }),
      };
    }

    // Get user ID from Authorization header (Supabase JWT)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId: string | undefined = request.userId;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.warn('Failed to decode JWT:', e);
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured');
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server Configuration Error" }) };
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Create audit record
    const { data: auditData, error: auditError } = await supabase
      .from('audits')
      .insert({
        user_id: userId || null,
        session_id: request.sessionId || null,
        url: request.mode === 'url' ? request.content : null,
        status: 'pending',
        progress: 0,
        current_stage: 'Queued',
        input_type: request.mode,
        input_value: (request.mode === 'html' || request.mode === 'snippet') ? request.content : null,
        document_type: request.documentType || null,
        document_path: request.filePath || null,
        ai_model: request.geminiModel || request.model,
        wcag_version: '2.1',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (auditError || !auditData) {
      console.error("Failed to create audit record:", auditError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Database Write Error" }) };
    }

    // Trigger Background Function
    const host = event.headers.host;
    const protocol = event.headers['x-forwarded-proto'] || 'http';
    const backgroundUrl = `${protocol}://${host}/.netlify/functions/ai-agent-audit-background`;

    console.log(`Triggering background audit: ${backgroundUrl} for Audit ID: ${auditData.id}`);

    // Fire and forget (awaiting the acceptance, not the completion)
    try {
        await fetch(backgroundUrl, {
            method: 'POST',
            body: JSON.stringify({ auditId: auditData.id }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        console.error("Failed to trigger background function:", e);
        await supabase.from('audits').update({ status: 'failed', error_message: 'Failed to start background worker' }).eq('id', auditData.id);
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to start audit worker" }) };
    }

    // Return immediate response with Audit ID
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        auditId: auditData.id,
        status: 'pending',
        message: 'Audit started in background'
      }),
    };

  } catch (error) {
    console.error("Error starting audit:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
