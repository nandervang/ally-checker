#!/usr/bin/env python3
"""
MCP Server for Document Accessibility Auditing

Provides tools for analyzing PDF and DOCX documents for accessibility compliance
following PDF/UA (ISO 14289) and WCAG 2.2 AA standards.

Tools:
- audit_pdf: Comprehensive PDF accessibility audit
- audit_docx: Comprehensive DOCX accessibility audit
- extract_pdf_structure: Extract PDF structure information
- extract_docx_structure: Extract DOCX structure information
- check_pdf_tags: Validate PDF tagging and structure
- check_alt_text: Verify alternative text for images
- check_reading_order: Validate logical reading order
- check_color_contrast: Analyze color contrast in documents
"""

import asyncio
import json
import logging
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from pdf_auditor import audit_pdf_accessibility
from docx_auditor import audit_docx_accessibility
from pdf_tools import (
    extract_pdf_structure,
    check_pdf_tags,
    check_pdf_alt_text,
    check_pdf_reading_order,
    check_pdf_contrast,
)
from docx_tools import (
    extract_docx_structure,
    check_docx_headings,
    check_docx_alt_text,
    check_docx_tables,
    check_docx_hyperlinks,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("document-accessibility-server")

# Create server instance
server = Server("document-accessibility-server")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available document accessibility tools."""
    return [
        Tool(
            name="audit_pdf",
            description="""Perform comprehensive PDF accessibility audit following PDF/UA and WCAG 2.2 AA standards.
            
            Checks include:
            - Document structure and tagging (headings, reading order, logical structure)
            - Alternative text for images, charts, and graphics
            - Color contrast for text and backgrounds
            - Form field accessibility (labels, tab order)
            - Language specification and metadata
            - Table structure (headers, scope, relationships)
            - Navigation and bookmarks
            - Security settings affecting accessibility
            
            Returns detailed report with issues categorized by WCAG principle and severity.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the PDF file to audit"
                    },
                    "detailed": {
                        "type": "boolean",
                        "description": "Include detailed analysis (slower but more thorough)",
                        "default": True
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="audit_docx",
            description="""Perform comprehensive DOCX accessibility audit following WCAG 2.2 AA standards.
            
            Checks include:
            - Heading structure and hierarchy
            - Alternative text for images and objects
            - Table accessibility (headers, simple structure)
            - Hyperlink text descriptiveness
            - Color contrast for text
            - Reading order
            - Metadata and language settings
            - Built-in accessibility checker results
            
            Returns detailed report with issues categorized by WCAG principle and severity.""",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Path to the DOCX file to audit"
                    },
                    "detailed": {
                        "type": "boolean",
                        "description": "Include detailed analysis",
                        "default": True
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="extract_pdf_structure",
            description="Extract structure information from PDF (headings, tags, reading order)",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to PDF file"}
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="extract_docx_structure",
            description="Extract structure information from DOCX (headings, styles, sections)",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to DOCX file"}
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="check_pdf_tags",
            description="Validate PDF tagging and structure compliance with PDF/UA",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to PDF file"}
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="check_alt_text",
            description="Check for missing or inadequate alternative text in PDF or DOCX",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to document file"},
                    "file_type": {
                        "type": "string",
                        "enum": ["pdf", "docx"],
                        "description": "Document type"
                    }
                },
                "required": ["file_path", "file_type"]
            }
        ),
        Tool(
            name="check_reading_order",
            description="Validate logical reading order in PDF document",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to PDF file"}
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="check_color_contrast",
            description="Analyze color contrast ratios in PDF document",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Path to PDF file"},
                    "wcag_level": {
                        "type": "string",
                        "enum": ["AA", "AAA"],
                        "description": "WCAG conformance level",
                        "default": "AA"
                    }
                },
                "required": ["file_path"]
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls for document accessibility auditing."""
    try:
        if name == "audit_pdf":
            result = await audit_pdf_accessibility(
                arguments["file_path"],
                detailed=arguments.get("detailed", True)
            )
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "audit_docx":
            result = await audit_docx_accessibility(
                arguments["file_path"],
                detailed=arguments.get("detailed", True)
            )
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "extract_pdf_structure":
            result = extract_pdf_structure(arguments["file_path"])
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "extract_docx_structure":
            result = extract_docx_structure(arguments["file_path"])
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "check_pdf_tags":
            result = check_pdf_tags(arguments["file_path"])
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "check_alt_text":
            file_type = arguments["file_type"]
            if file_type == "pdf":
                result = check_pdf_alt_text(arguments["file_path"])
            else:
                result = check_docx_alt_text(arguments["file_path"])
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "check_reading_order":
            result = check_pdf_reading_order(arguments["file_path"])
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        elif name == "check_color_contrast":
            result = check_pdf_contrast(
                arguments["file_path"],
                wcag_level=arguments.get("wcag_level", "AA")
            )
            return [TextContent(type="text", text=json.dumps(result, indent=2))]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}", exc_info=True)
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e), "tool": name})
        )]


async def main():
    """Run the MCP server."""
    logger.info("Starting document accessibility MCP server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
