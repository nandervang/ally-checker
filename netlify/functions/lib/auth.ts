/**
 * Authentication utilities for Netlify Functions
 * 
 * Validates API keys and handles authentication errors
 */

import type { HandlerEvent } from "@netlify/functions";

export interface AuthResult {
  isAuthenticated: boolean;
  error?: string;
}

/**
 * Validate API key from request headers
 * 
 * Checks for X-Report-Service-Key header and validates against
 * REPORT_SERVICE_KEY environment variable.
 * 
 * @param event - Netlify function event
 * @returns Authentication result
 */
export function validateApiKey(event: HandlerEvent): AuthResult {
  const apiKey = event.headers["x-report-service-key"];
  const expectedKey = process.env.REPORT_SERVICE_KEY;
  
  // Allow requests from localhost (local development)
  const host = event.headers.host || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    console.log('[LOCAL DEV] Bypassing API key validation for localhost');
    return { isAuthenticated: true };
  }

  // Allow requests without auth if REPORT_SERVICE_KEY is not configured
  // This is useful for development and open public APIs
  if (!expectedKey) {
    console.log('[AUTH] No REPORT_SERVICE_KEY configured, allowing request');
    return { isAuthenticated: true };
  }

  // Require API key if REPORT_SERVICE_KEY is configured
  if (!apiKey) {
    console.error('[AUTH] Missing API key in request headers');
    return {
      isAuthenticated: false,
      error: "Missing X-Report-Service-Key header",
    };
  }

  // Validate API key
  console.log('[AUTH] Comparing keys:', {
    received: apiKey.substring(0, 10) + '...',
    expected: expectedKey.substring(0, 10) + '...',
    match: apiKey === expectedKey
  });
  
  if (apiKey !== expectedKey) {
    console.error('[AUTH] API key mismatch');
    return {
      isAuthenticated: false,
      error: "Invalid API key",
    };
  }

  console.log('[AUTH] API key validated successfully');
  return { isAuthenticated: true };
}

/**
 * Get CORS headers for responses
 * 
 * @param allowedOrigin - Allowed origin (default: *)
 * @returns CORS headers object
 */
export function getCorsHeaders(allowedOrigin = "*") {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, X-Report-Service-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Create authentication error response
 * 
 * @param error - Error message
 * @returns Netlify function response
 */
export function createAuthErrorResponse(error: string) {
  return {
    statusCode: 401,
    headers: getCorsHeaders(),
    body: JSON.stringify({
      error: "Unauthorized",
      message: error,
    }),
  };
}
