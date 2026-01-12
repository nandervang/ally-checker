/**
 * MCP Fetch Tool - TypeScript Implementation
 * Fetches web content for accessibility analysis
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const fetchTools: Tool[] = [
  {
    name: "fetch_url",
    description: "Fetch HTML content from a URL for accessibility analysis. Handles redirects, timeouts, and common errors.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch (must be http or https)",
        },
        timeout: {
          type: "number",
          description: "Request timeout in seconds (default: 30)",
        },
        follow_redirects: {
          type: "boolean",
          description: "Whether to follow redirects (default: true)",
        }
      },
      required: ["url"]
    }
  },
  {
    name: "fetch_url_metadata",
    description: "Fetch only metadata (title, description, status) without full HTML content",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch metadata from",
        }
      },
      required: ["url"]
    }
  }
];

export async function handleFetchTool(name: string, args: any): Promise<any> {
  if (name === "fetch_url") {
    const url = args.url;
    const timeout = args.timeout || 30;
    const followRedirects = args.follow_redirects !== false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
      
      const response = await fetch(url, {
        redirect: followRedirects ? 'follow' : 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'A11yChecker/1.0 (Accessibility Audit Bot)',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const contentType = response.headers.get('content-type') || '';
      
      return {
        content: html,
        url: response.url, // Final URL after redirects
        status: response.status,
        statusText: response.statusText,
        contentType,
        size: html.length,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout} seconds`);
      }
      throw error;
    }
  }
  
  if (name === "fetch_url_metadata") {
    const url = args.url;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'A11yChecker/1.0 (Accessibility Audit Bot)',
        }
      });
      
      clearTimeout(timeoutId);
      
      // If HEAD doesn't work, try GET with early abort
      let title = '';
      let description = '';
      
      if (response.ok) {
        const getResponse = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'A11yChecker/1.0 (Accessibility Audit Bot)',
          }
        });
        
        const html = await getResponse.text();
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1].trim() : '';
        
        // Extract meta description
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        description = descMatch ? descMatch[1].trim() : '';
      }
      
      return {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type') || '',
        title,
        description,
      };
    } catch (error) {
      throw new Error(`Failed to fetch metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  throw new Error(`Unknown fetch tool: ${name}`);
}
