#!/usr/bin/env python3
"""
MCP WAI Tips Server - W3C WAI Tips and Resources
Provides tools for accessing WAI developing, designing, and writing tips
"""

import asyncio
import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("ally-checker-wai-tips")

# W3C WAI Resources
WAI_RESOURCES = {
    "developing": {
        "url": "https://www.w3.org/WAI/tips/developing/",
        "title": "Developing for Web Accessibility",
        "description": "Tips for getting started with web accessibility development"
    },
    "designing": {
        "url": "https://www.w3.org/WAI/tips/designing/",
        "title": "Designing for Web Accessibility",
        "description": "Tips for user interface and visual design"
    },
    "writing": {
        "url": "https://www.w3.org/WAI/tips/writing/",
        "title": "Writing for Web Accessibility",
        "description": "Tips for writing and presenting content"
    },
    "main": {
        "url": "https://www.w3.org/WAI/",
        "title": "W3C Web Accessibility Initiative",
        "description": "Main WAI homepage with standards, guidelines, and resources"
    },
    "understanding": {
        "url": "https://www.w3.org/WAI/WCAG21/Understanding/",
        "title": "Understanding WCAG 2.1",
        "description": "Understanding documents for WCAG 2.1 success criteria"
    },
    "understanding22": {
        "url": "https://www.w3.org/WAI/WCAG22/Understanding/",
        "title": "Understanding WCAG 2.2",
        "description": "Understanding documents for WCAG 2.2 success criteria"
    },
    "aria": {
        "url": "https://www.w3.org/WAI/ARIA/apg/",
        "title": "ARIA Authoring Practices Guide (APG)",
        "description": "WAI-ARIA patterns and widgets"
    }
}

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available WAI tips tools"""
    return [
        Tool(
            name="get_wai_resource",
            description="Get W3C WAI resource content (developing tips, designing tips, writing tips, ARIA patterns, Understanding docs)",
            inputSchema={
                "type": "object",
                "properties": {
                    "resource": {
                        "type": "string",
                        "description": "Resource to fetch",
                        "enum": ["developing", "designing", "writing", "main", "understanding", "understanding22", "aria"]
                    },
                    "specific_page": {
                        "type": "string",
                        "description": "Optional specific page URL path (e.g., 'headings-and-labels.html' for Understanding docs)"
                    }
                },
                "required": ["resource"]
            }
        ),
        Tool(
            name="search_wai_tips",
            description="Search for WAI tips related to a specific accessibility concern (headings, forms, images, colors, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic to search for (e.g., 'headings', 'forms', 'images', 'color contrast', 'keyboard navigation')"
                    }
                },
                "required": ["topic"]
            }
        ),
        Tool(
            name="get_aria_pattern",
            description="Get WAI-ARIA pattern documentation for interactive components",
            inputSchema={
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "ARIA pattern name (e.g., 'dialog', 'tabs', 'accordion', 'menu', 'button', 'combobox')"
                    }
                },
                "required": ["pattern"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "get_wai_resource":
        resource = arguments["resource"]
        specific_page = arguments.get("specific_page")
        
        if resource not in WAI_RESOURCES:
            return [TextContent(
                type="text",
                text=f"Error: Unknown resource '{resource}'. Available: {', '.join(WAI_RESOURCES.keys())}"
            )]
        
        url = WAI_RESOURCES[resource]["url"]
        if specific_page:
            url = url.rstrip('/') + '/' + specific_page.lstrip('/')
        
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Extract main content (simplified - in production, parse HTML properly)
                html = response.text
                
                # Basic content extraction
                title = WAI_RESOURCES[resource]["title"]
                if specific_page:
                    title = f"{title} - {specific_page}"
                
                return [TextContent(
                    type="text",
                    text=f"# {title}\n\nSource: {url}\n\n{html[:5000]}\n\n... (content truncated, visit {url} for full content)"
                )]
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error fetching {url}: {str(e)}"
            )]
    
    elif name == "search_wai_tips":
        topic = arguments["topic"].lower()
        
        # Map topics to relevant WAI resources
        tips = []
        
        if any(word in topic for word in ["heading", "label", "title"]):
            tips.append("**Developing Tip**: Provide informative, unique page titles and use headings to convey meaning and structure")
            tips.append("**Understanding WCAG 2.4.6 (Headings and Labels)**: https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html")
        
        if any(word in topic for word in ["form", "input", "label"]):
            tips.append("**Developing Tip**: Associate a label with every form control")
            tips.append("**Designing Tip**: Provide clear and consistent navigation options")
        
        if any(word in topic for word in ["image", "alt", "alternative"]):
            tips.append("**Developing Tip**: Provide text alternatives for images")
            tips.append("**Writing Tip**: Write meaningful text alternatives for images")
        
        if any(word in topic for word in ["color", "contrast"]):
            tips.append("**Designing Tip**: Provide sufficient contrast between foreground and background")
            tips.append("**Designing Tip**: Don't use color alone to convey information")
        
        if any(word in topic for word in ["keyboard", "navigation", "focus"]):
            tips.append("**Developing Tip**: Ensure that all interactive elements are keyboard accessible")
            tips.append("**Developing Tip**: Provide a skip link and ensure keyboard focus is visible and clear")
        
        if any(word in topic for word in ["aria", "role", "state"]):
            tips.append("**ARIA Patterns**: Use WAI-ARIA roles, states, and properties correctly")
            tips.append("**Reference**: https://www.w3.org/WAI/ARIA/apg/")
        
        if not tips:
            tips.append(f"No specific tips found for '{topic}'. Try: headings, forms, images, color, keyboard, aria")
            tips.append("Browse all tips at: https://www.w3.org/WAI/tips/developing/")
        
        return [TextContent(
            type="text",
            text="\n\n".join(tips)
        )]
    
    elif name == "get_aria_pattern":
        pattern = arguments["pattern"].lower()
        
        # Map common patterns to APG URLs
        aria_patterns = {
            "dialog": "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
            "modal": "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
            "tabs": "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
            "accordion": "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
            "menu": "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/",
            "button": "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
            "combobox": "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
            "disclosure": "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
            "listbox": "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
            "tooltip": "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
            "breadcrumb": "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",
            "carousel": "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
            "feed": "https://www.w3.org/WAI/ARIA/apg/patterns/feed/",
            "table": "https://www.w3.org/WAI/ARIA/apg/patterns/table/",
            "grid": "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
            "treegrid": "https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/",
            "tree": "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/"
        }
        
        if pattern in aria_patterns:
            url = aria_patterns[pattern]
            
            try:
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    
                    return [TextContent(
                        type="text",
                        text=f"# WAI-ARIA {pattern.title()} Pattern\n\nSource: {url}\n\n{response.text[:5000]}\n\n... (visit {url} for full pattern with examples)"
                    )]
            except Exception as e:
                return [TextContent(
                    type="text",
                    text=f"Error fetching ARIA pattern for '{pattern}': {str(e)}\n\nDirect link: {url}"
                )]
        else:
            available = ", ".join(aria_patterns.keys())
            return [TextContent(
                type="text",
                text=f"Pattern '{pattern}' not found. Available patterns: {available}\n\nBrowse all patterns at: https://www.w3.org/WAI/ARIA/apg/patterns/"
            )]
    
    return [TextContent(
        type="text",
        text=f"Unknown tool: {name}"
    )]

def main():
    """Run the server using stdin/stdout streams"""
    import sys
    from mcp.server.stdio import stdio_server
    
    async def run():
        async with stdio_server() as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )
    
    asyncio.run(run())

if __name__ == "__main__":
    main()
