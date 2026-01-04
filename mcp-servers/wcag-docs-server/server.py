#!/usr/bin/env python3
"""
MCP WCAG Docs Server - Provides WCAG 2.2 success criteria details
Helps AI agents understand and explain WCAG guidelines
"""

import asyncio
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("ally-checker-wcag-docs")

# WCAG 2.2 Success Criteria Database (excerpt - full DB would be comprehensive)
WCAG_CRITERIA = {
    "1.1.1": {
        "level": "A",
        "principle": "Perceivable",
        "guideline": "1.1 Text Alternatives",
        "name": "Non-text Content",
        "description": "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#non-text-content",
        "examples": [
            "Images have alt text that describes their content or function",
            "Form inputs have associated labels",
            "Icons have accessible names",
            "Decorative images have empty alt attributes"
        ]
    },
    "1.3.1": {
        "level": "A",
        "principle": "Perceivable",
        "guideline": "1.3 Adaptable",
        "name": "Info and Relationships",
        "description": "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#info-and-relationships",
        "examples": [
            "Headings are marked up with <h1>-<h6> elements",
            "Lists use <ul>, <ol>, or <dl> elements",
            "Data tables use proper table markup with <th> headers",
            "Form labels are associated with inputs using <label> or aria-labelledby"
        ]
    },
    "1.4.3": {
        "level": "AA",
        "principle": "Perceivable",
        "guideline": "1.4 Distinguishable",
        "name": "Contrast (Minimum)",
        "description": "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#contrast-minimum",
        "examples": [
            "Normal text has 4.5:1 contrast ratio",
            "Large text (18pt+) has 3:1 contrast ratio",
            "Use color contrast tools to verify ratios"
        ]
    },
    "2.1.1": {
        "level": "A",
        "principle": "Operable",
        "guideline": "2.1 Keyboard Accessible",
        "name": "Keyboard",
        "description": "All functionality of the content is operable through a keyboard interface.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#keyboard",
        "examples": [
            "All interactive elements can be accessed via Tab key",
            "Custom widgets support keyboard interaction",
            "No keyboard traps exist",
            "Skip links allow bypassing repetitive content"
        ]
    },
    "2.4.1": {
        "level": "A",
        "principle": "Operable",
        "guideline": "2.4 Navigable",
        "name": "Bypass Blocks",
        "description": "A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#bypass-blocks",
        "examples": [
            "Skip to main content link",
            "ARIA landmarks (main, navigation, etc.)",
            "Heading structure for navigation"
        ]
    },
    "3.1.1": {
        "level": "A",
        "principle": "Understandable",
        "guideline": "3.1 Readable",
        "name": "Language of Page",
        "description": "The default human language of each Web page can be programmatically determined.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#language-of-page",
        "examples": [
            "<html lang=\"en\"> for English pages",
            "<html lang=\"sv\"> for Swedish pages",
            "Screen readers use lang attribute for pronunciation"
        ]
    },
    "3.3.1": {
        "level": "A",
        "principle": "Understandable",
        "guideline": "3.3 Input Assistance",
        "name": "Error Identification",
        "description": "If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#error-identification",
        "examples": [
            "Form validation errors are clearly described",
            "Error messages are associated with form fields",
            "Errors are announced to screen readers"
        ]
    },
    "4.1.2": {
        "level": "A",
        "principle": "Robust",
        "guideline": "4.1 Compatible",
        "name": "Name, Role, Value",
        "description": "For all user interface components, the name and role can be programmatically determined.",
        "understanding": "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
        "how_to_meet": "https://www.w3.org/WAI/WCAG22/quickref/#name-role-value",
        "examples": [
            "Buttons have accessible names",
            "Custom controls use ARIA roles",
            "State changes are communicated to assistive tech"
        ]
    }
}

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available WCAG documentation tools"""
    return [
        Tool(
            name="get_wcag_criterion",
            description="Get detailed information about a specific WCAG 2.2 success criterion (e.g., '1.1.1', '2.4.1')",
            inputSchema={
                "type": "object",
                "properties": {
                    "criterion_id": {
                        "type": "string",
                        "description": "The WCAG success criterion ID (e.g., '1.1.1', '1.4.3', '2.1.1')",
                        "pattern": "^[1-4]\\.[0-9]{1,2}\\.[0-9]{1,2}$"
                    }
                },
                "required": ["criterion_id"]
            }
        ),
        Tool(
            name="search_wcag_by_principle",
            description="Search WCAG criteria by principle (Perceivable, Operable, Understandable, Robust)",
            inputSchema={
                "type": "object",
                "properties": {
                    "principle": {
                        "type": "string",
                        "description": "The WCAG principle to search",
                        "enum": ["Perceivable", "Operable", "Understandable", "Robust"]
                    },
                    "level": {
                        "type": "string",
                        "description": "Filter by conformance level (optional)",
                        "enum": ["A", "AA", "AAA"]
                    }
                },
                "required": ["principle"]
            }
        ),
        Tool(
            name="get_all_criteria",
            description="Get a list of all WCAG 2.2 success criteria with basic info",
            inputSchema={
                "type": "object",
                "properties": {
                    "level": {
                        "type": "string",
                        "description": "Filter by conformance level (optional)",
                        "enum": ["A", "AA", "AAA"]
                    }
                }
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "get_wcag_criterion":
        criterion_id = arguments["criterion_id"]
        
        if criterion_id not in WCAG_CRITERIA:
            return [
                TextContent(
                    type="text",
                    text=f"WCAG criterion {criterion_id} not found in database. This is a limited implementation with common criteria."
                )
            ]
        
        criterion = WCAG_CRITERIA[criterion_id]
        
        result = f"""WCAG {criterion_id}: {criterion['name']} (Level {criterion['level']})

Principle: {criterion['principle']}
Guideline: {criterion['guideline']}

Description:
{criterion['description']}

Examples:
{chr(10).join(f"- {ex}" for ex in criterion['examples'])}

Resources:
- Understanding: {criterion['understanding']}
- How to Meet: {criterion['how_to_meet']}
"""
        
        return [TextContent(type="text", text=result)]
    
    elif name == "search_wcag_by_principle":
        principle = arguments["principle"]
        level = arguments.get("level")
        
        matches = [
            (cid, crit) for cid, crit in WCAG_CRITERIA.items()
            if crit["principle"] == principle and (not level or crit["level"] == level)
        ]
        
        if not matches:
            return [
                TextContent(
                    type="text",
                    text=f"No criteria found for principle '{principle}'" + (f" at level {level}" if level else "")
                )
            ]
        
        result = f"WCAG Criteria for {principle}" + (f" (Level {level})" if level else "") + ":\n\n"
        for cid, crit in matches:
            result += f"- {cid}: {crit['name']} (Level {crit['level']})\n  {crit['description'][:100]}...\n\n"
        
        return [TextContent(type="text", text=result)]
    
    elif name == "get_all_criteria":
        level = arguments.get("level")
        
        matches = [
            (cid, crit) for cid, crit in WCAG_CRITERIA.items()
            if not level or crit["level"] == level
        ]
        
        result = "WCAG 2.2 Success Criteria" + (f" (Level {level})" if level else "") + ":\n\n"
        for cid, crit in matches:
            result += f"{cid}: {crit['name']} (Level {crit['level']}) - {crit['principle']}\n"
        
        return [TextContent(type="text", text=result)]
    
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
