#!/usr/bin/env python3
"""
MPC Magenta A11y Server - Component accessibility patterns
Provides tools for accessing Magenta A11y component testing patterns
"""

import asyncio
import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("ally-checker-magenta")

# Magenta A11y Component Categories
MAGENTA_COMPONENTS = {
    "button": {
        "url": "https://www.magentaa11y.com/checklist-web/button/",
        "category": "Interactive",
        "description": "Button component accessibility testing"
    },
    "checkbox": {
        "url": "https://www.magentaa11y.com/checklist-web/checkbox/",
        "category": "Forms",
        "description": "Checkbox accessibility patterns"
    },
    "radio": {
        "url": "https://www.magentaa11y.com/checklist-web/radio-button/",
        "category": "Forms",
        "description": "Radio button accessibility"
    },
    "link": {
        "url": "https://www.magentaa11y.com/checklist-web/link/",
        "category": "Interactive",
        "description": "Link accessibility testing"
    },
    "form": {
        "url": "https://www.magentaa11y.com/checklist-web/form/",
        "category": "Forms",
        "description": "Form accessibility patterns"
    },
    "text-input": {
        "url": "https://www.magentaa11y.com/checklist-web/text-input/",
        "category": "Forms",
        "description": "Text input field accessibility"
    },
    "select": {
        "url": "https://www.magentaa11y.com/checklist-web/select/",
        "category": "Forms",
        "description": "Select dropdown accessibility"
    },
    "heading": {
        "url": "https://www.magentaa11y.com/checklist-web/heading/",
        "category": "Structure",
        "description": "Heading hierarchy and semantics"
    },
    "image": {
        "url": "https://www.magentaa11y.com/checklist-web/image/",
        "category": "Media",
        "description": "Image alternative text patterns"
    },
    "table": {
        "url": "https://www.magentaa11y.com/checklist-web/table/",
        "category": "Structure",
        "description": "Data table accessibility"
    },
    "dialog": {
        "url": "https://www.magentaa11y.com/checklist-web/dialog/",
        "category": "Interactive",
        "description": "Modal dialog accessibility"
    },
    "menu": {
        "url": "https://www.magentaa11y.com/checklist-web/menu/",
        "category": "Navigation",
        "description": "Navigation menu patterns"
    },
    "tabs": {
        "url": "https://www.magentaa11y.com/checklist-web/tabs/",
        "category": "Interactive",
        "description": "Tab panel accessibility"
    },
    "accordion": {
        "url": "https://www.magentaa11y.com/checklist-web/accordion/",
        "category": "Interactive",
        "description": "Accordion/disclosure patterns"
    },
    "carousel": {
        "url": "https://www.magentaa11y.com/checklist-web/carousel/",
        "category": "Interactive",
        "description": "Carousel/slideshow accessibility"
    },
    "tooltip": {
        "url": "https://www.magentaa11y.com/checklist-web/tooltip/",
        "category": "Interactive",
        "description": "Tooltip accessibility patterns"
    }
}

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available Magenta A11y tools"""
    return [
        Tool(
            name="get_magenta_component",
            description="Get Magenta A11y testing checklist for a specific component (button, form, dialog, tabs, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "component": {
                        "type": "string",
                        "description": "Component name",
                        "enum": list(MAGENTA_COMPONENTS.keys())
                    }
                },
                "required": ["component"]
            }
        ),
        Tool(
            name="search_magenta_patterns",
            description="Search Magenta A11y for components matching a description or category",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query (e.g., 'forms', 'interactive', 'navigation')"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_magenta_testing_methods",
            description="Get general testing methods from Magenta A11y (keyboard, screen reader, visual)",
            inputSchema={
                "type": "object",
                "properties": {
                    "method": {
                        "type": "string",
                        "description": "Testing method",
                        "enum": ["keyboard", "screen-reader", "visual", "all"]
                    }
                },
                "required": ["method"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle tool calls"""
    
    if name == "get_magenta_component":
        component = arguments["component"]
        
        if component not in MAGENTA_COMPONENTS:
            return [TextContent(
                type="text",
                text=f"Error: Unknown component '{component}'. Available: {', '.join(MAGENTA_COMPONENTS.keys())}"
            )]
        
        comp_data = MAGENTA_COMPONENTS[component]
        url = comp_data["url"]
        
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                # Return component info with testing checklist summary
                return [TextContent(
                    type="text",
                    text=f"""# Magenta A11y: {component.title()} Component

**Category**: {comp_data['category']}
**Description**: {comp_data['description']}
**Source**: {url}

## Testing Checklist

Magenta A11y provides comprehensive testing checklists covering:

### 1. Keyboard Testing
- Tab navigation and focus order
- Enter/Space activation
- Arrow key navigation (where applicable)
- Escape key to close/cancel
- Focus visible indicator

### 2. Screen Reader Testing
- Proper role announcement
- Label and state conveyed
- Instructions provided
- Error messages accessible
- Focus management

### 3. Visual Testing
- Color contrast (4.5:1 minimum for normal text)
- Focus indicator visible
- Touch target size (minimum 44x44px)
- Text spacing and readability
- Error identification

Visit {url} for complete testing procedures and code examples.

Content preview:
{response.text[:3000]}

... (visit {url} for full checklist with examples)
"""
                )]
        except Exception as e:
            return [TextContent(
                type="text",
                text=f"Error fetching Magenta pattern for '{component}': {str(e)}\n\nDirect link: {url}"
            )]
    
    elif name == "search_magenta_patterns":
        query = arguments["query"].lower()
        
        # Search components by name, category, or description
        matches = []
        for comp_name, comp_data in MAGENTA_COMPONENTS.items():
            if (query in comp_name.lower() or 
                query in comp_data["category"].lower() or 
                query in comp_data["description"].lower()):
                matches.append(f"**{comp_name.title()}** ({comp_data['category']}): {comp_data['description']}\n   → {comp_data['url']}")
        
        if matches:
            return [TextContent(
                type="text",
                text=f"# Magenta A11y Components matching '{query}':\n\n" + "\n\n".join(matches)
            )]
        else:
            return [TextContent(
                type="text",
                text=f"No components found matching '{query}'.\n\nAvailable components: {', '.join(MAGENTA_COMPONENTS.keys())}\n\nBrowse all at: https://www.magentaa11y.com/"
            )]
    
    elif name == "get_magenta_testing_methods":
        method = arguments["method"]
        
        testing_info = {
            "keyboard": """# Magenta A11y: Keyboard Testing Method

## General Keyboard Testing Procedures:

1. **Tab Navigation**
   - Tab through all interactive elements
   - Shift+Tab to navigate backwards
   - Focus order should be logical (top-to-bottom, left-to-right)
   - No keyboard traps (can always escape)

2. **Activation**
   - Enter key activates links and buttons
   - Space bar activates buttons and toggles checkboxes
   - Arrow keys for custom components (radios, menus, tabs)

3. **Focus Indicators**
   - Visible focus indicator on all interactive elements
   - Minimum 3:1 contrast ratio for focus indicator
   - Focus indicator not obscured by other content

4. **Keyboard Shortcuts**
   - Document any keyboard shortcuts
   - Shortcuts should be escapable
   - Don't override browser/OS shortcuts

Reference: https://www.magentaa11y.com/
""",
            "screen-reader": """# Magenta A11y: Screen Reader Testing Method

## General Screen Reader Testing:

1. **Semantic HTML**
   - Proper headings (h1-h6)
   - Landmarks (header, nav, main, aside, footer)
   - Lists and list items
   - Tables with headers

2. **ARIA Labels and Descriptions**
   - aria-label for icon buttons
   - aria-labelledby for complex labels
   - aria-describedby for additional instructions
   - aria-live for dynamic content

3. **Role Announcements**
   - Correct role conveyed (button, link, checkbox, etc.)
   - Custom components use appropriate ARIA roles
   - State changes announced (expanded, selected, checked)

4. **Screen Reader Testing Tools**
   - NVDA (Windows - free)
   - JAWS (Windows - commercial)
   - VoiceOver (macOS/iOS - built-in)
   - TalkBack (Android - built-in)

5. **Common Issues to Check**
   - All content readable in reading mode
   - Form labels properly associated
   - Error messages announced
   - Loading states communicated
   - Focus management in dialogs/modals

Reference: https://www.magentaa11y.com/
""",
            "visual": """# Magenta A11y: Visual Testing Method

## General Visual Testing:

1. **Color Contrast**
   - Normal text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum
   - UI components: 3:1 minimum
   - Test with tools: WebAIM, Axe DevTools

2. **Text Spacing**
   - Line height: at least 1.5x font size
   - Paragraph spacing: at least 2x font size
   - Letter spacing: at least 0.12x font size
   - Word spacing: at least 0.16x font size

3. **Touch Targets**
   - Minimum 44x44 CSS pixels
   - Adequate spacing between targets
   - Works on mobile devices

4. **Zoom and Reflow**
   - Test at 200% zoom
   - No horizontal scrolling (except data tables)
   - Content reflows properly
   - No loss of functionality

5. **Visual Indicators**
   - Focus indicator visible (3:1 contrast)
   - Error states clearly marked
   - Required fields indicated
   - Current page/section highlighted

6. **Motion and Animation**
   - Respect prefers-reduced-motion
   - Animations can be paused
   - No auto-playing content (or can be stopped)
   - No flashing content >3Hz

Reference: https://www.magentaa11y.com/
""",
            "all": """# Magenta A11y: Complete Testing Methods

## 1. Keyboard Testing
- Tab navigation and focus order
- Activation (Enter/Space)
- Visible focus indicators
- No keyboard traps

## 2. Screen Reader Testing
- Semantic HTML structure
- ARIA labels and roles
- State announcements
- Dynamic content updates

## 3. Visual Testing
- Color contrast (4.5:1 / 3:1)
- Text spacing and zoom
- Touch target size (44x44px)
- Motion and animations

## Component-Specific Testing
Each Magenta A11y component checklist includes:
- Expected keyboard behavior
- Screen reader announcements
- Visual requirements
- Code examples
- Common mistakes

Browse components: https://www.magentaa11y.com/
"""
        }
        
        return [TextContent(
            type="text",
            text=testing_info.get(method, f"Unknown testing method: {method}")
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
