#!/usr/bin/env python3
"""
MCP Axe-Core Server - Runs axe-core accessibility analysis on HTML content
Provides automated WCAG 2.2 violation detection
"""

import asyncio
import json
from mcp.server import Server
from mcp.types import Tool, TextContent
from playwright.async_api import async_playwright

app = Server("ally-checker-axe-core")

# Axe-core script will be injected into pages
AXE_SCRIPT_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.0/axe.min.js"

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available axe-core analysis tools"""
    return [
        Tool(
            name="analyze_html",
            description="Run axe-core accessibility analysis on HTML content. Returns WCAG violations with severity, impact, and remediation guidance.",
            inputSchema={
                "type": "object",
                "properties": {
                    "html": {
                        "type": "string",
                        "description": "The HTML content to analyze"
                    },
                    "rules": {
                        "type": "array",
                        "description": "Specific axe rules to run (optional, defaults to wcag2aa)",
                        "items": {"type": "string"}
                    },
                    "context": {
                        "type": "object",
                        "description": "Optional context (url, filename) for reporting",
                        "properties": {
                            "url": {"type": "string"},
                            "filename": {"type": "string"}
                        }
                    }
                },
                "required": ["html"]
            }
        ),
        Tool(
            name="analyze_url",
            description="Fetch a URL and run axe-core analysis on it",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch and analyze",
                        "format": "uri"
                    },
                    "wait_for_selector": {
                        "type": "string",
                        "description": "CSS selector to wait for before analyzing (optional)"
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Page load timeout in milliseconds (default: 30000)",
                        "default": 30000
                    }
                },
                "required": ["url"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "analyze_html":
        html = arguments["html"]
        rules = arguments.get("rules", ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        context = arguments.get("context", {})
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            try:
                # Set HTML content
                await page.set_content(html)
                
                # Inject axe-core
                await page.add_script_tag(url=AXE_SCRIPT_URL)
                
                # Run axe analysis
                results = await page.evaluate(f"""
                    async () => {{
                        const results = await axe.run({{
                            runOnly: {{
                                type: 'tag',
                                values: {json.dumps(rules)}
                            }}
                        }});
                        return results;
                    }}
                """)
                
                # Format results
                violations = results.get("violations", [])
                passes = results.get("passes", [])
                
                summary = f"""Axe-Core Analysis Results
{'='*50}
Context: {context.get('url') or context.get('filename') or 'HTML content'}
Date: {results.get('timestamp', 'N/A')}

Summary:
- Violations: {len(violations)}
- Passes: {len(passes)}
- Incomplete: {len(results.get('incomplete', []))}
"""
                
                if violations:
                    summary += "\n\nViolations:\n" + "="*50 + "\n\n"
                    for i, violation in enumerate(violations, 1):
                        summary += f"{i}. {violation['help']} ({violation['id']})\n"
                        summary += f"   Impact: {violation.get('impact', 'unknown')}\n"
                        summary += f"   WCAG Tags: {', '.join(violation.get('tags', []))}\n"
                        summary += f"   Description: {violation['description']}\n"
                        summary += f"   Affected nodes: {len(violation.get('nodes', []))}\n"
                        summary += f"   Help: {violation.get('helpUrl', 'N/A')}\n\n"
                        
                        # Show first few nodes
                        for node in violation.get('nodes', [])[:3]:
                            summary += f"     - Target: {' > '.join(node.get('target', []))}\n"
                            summary += f"       HTML: {node.get('html', '')[:100]}...\n"
                else:
                    summary += "\n✅ No violations found!\n"
                
                return [TextContent(type="text", text=summary)]
                
            finally:
                await browser.close()
    
    elif name == "analyze_url":
        url = arguments["url"]
        wait_for = arguments.get("wait_for_selector")
        timeout = arguments.get("timeout", 30000)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            try:
                # Navigate to URL
                await page.goto(url, timeout=timeout)
                
                # Wait for selector if specified
                if wait_for:
                    await page.wait_for_selector(wait_for, timeout=5000)
                
                # Inject axe-core
                await page.add_script_tag(url=AXE_SCRIPT_URL)
                
                # Run axe analysis
                results = await page.evaluate("""
                    async () => {
                        const results = await axe.run({
                            runOnly: {
                                type: 'tag',
                                values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
                            }
                        });
                        return results;
                    }
                """)
                
                # Format results (same as analyze_html)
                violations = results.get("violations", [])
                passes = results.get("passes", [])
                
                summary = f"""Axe-Core Analysis Results
{'='*50}
URL: {url}
Date: {results.get('timestamp', 'N/A')}

Summary:
- Violations: {len(violations)}
- Passes: {len(passes)}
"""
                
                if violations:
                    summary += "\n\nViolations:\n" + "="*50 + "\n\n"
                    for i, violation in enumerate(violations, 1):
                        summary += f"{i}. {violation['help']} ({violation['id']})\n"
                        summary += f"   Impact: {violation.get('impact', 'unknown')}\n"
                        summary += f"   WCAG Tags: {', '.join(violation.get('tags', []))}\n"
                        summary += f"   Affected nodes: {len(violation.get('nodes', []))}\n\n"
                
                return [TextContent(type="text", text=summary)]
                
            finally:
                await browser.close()
    
    raise ValueError(f"Unknown tool: {name}")

async def main():
    """Run the MCP server"""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
