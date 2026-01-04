#!/usr/bin/env python3
"""
MCP Fetch Server - Fetches web content for accessibility analysis
Provides tools for retrieving HTML content from URLs with proper error handling
"""

import asyncio
import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import AnyUrl

app = Server("ally-checker-fetch")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available fetch tools"""
    return [
        Tool(
            name="fetch_url",
            description="Fetch HTML content from a URL for accessibility analysis. Handles redirects, timeouts, and common errors.",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch (must be http or https)",
                        "format": "uri"
                    },
                    "timeout": {
                        "type": "number",
                        "description": "Request timeout in seconds (default: 30)",
                        "default": 30
                    },
                    "follow_redirects": {
                        "type": "boolean",
                        "description": "Whether to follow redirects (default: true)",
                        "default": True
                    }
                },
                "required": ["url"]
            }
        ),
        Tool(
            name="fetch_url_metadata",
            description="Fetch only metadata (title, description, status) without full HTML content",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch metadata from",
                        "format": "uri"
                    }
                },
                "required": ["url"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "fetch_url":
        url = arguments["url"]
        timeout = arguments.get("timeout", 30)
        follow_redirects = arguments.get("follow_redirects", True)
        
        try:
            async with httpx.AsyncClient(
                follow_redirects=follow_redirects,
                timeout=timeout
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                return [
                    TextContent(
                        type="text",
                        text=f"Successfully fetched {url}\nStatus: {response.status_code}\nContent-Type: {response.headers.get('content-type', 'unknown')}\n\nHTML Content:\n{response.text}"
                    )
                ]
        except httpx.TimeoutException:
            return [
                TextContent(
                    type="text",
                    text=f"Error: Request to {url} timed out after {timeout} seconds"
                )
            ]
        except httpx.HTTPStatusError as e:
            return [
                TextContent(
                    type="text",
                    text=f"Error: HTTP {e.response.status_code} - {url}"
                )
            ]
        except Exception as e:
            return [
                TextContent(
                    type="text",
                    text=f"Error fetching {url}: {str(e)}"
                )
            ]
    
    elif name == "fetch_url_metadata":
        url = arguments["url"]
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.head(url, follow_redirects=True)
                
                # Get basic metadata
                metadata = {
                    "url": str(response.url),
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type", "unknown"),
                    "content_length": response.headers.get("content-length", "unknown"),
                    "server": response.headers.get("server", "unknown"),
                }
                
                return [
                    TextContent(
                        type="text",
                        text=f"Metadata for {url}:\n" + "\n".join([f"{k}: {v}" for k, v in metadata.items()])
                    )
                ]
        except Exception as e:
            return [
                TextContent(
                    type="text",
                    text=f"Error fetching metadata for {url}: {str(e)}"
                )
            ]
    
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
