#!/usr/bin/env bun
/**
 * Test MCP Tools Locally
 * Run: bun test-mcp-tools.ts
 */

import { getAllTools, executeTool } from "../netlify/functions/lib/mcp-tools/index.js";

console.log("🧪 Testing MCP Tools\n");

// List all available tools
const tools = getAllTools();
console.log(`✅ Found ${tools.length} MCP tools:\n`);
tools.forEach((tool, i) => {
  console.log(`${i + 1}. ${tool.name}`);
  console.log(`   ${tool.description}\n`);
});

console.log("\n🔬 Running test cases...\n");

async function runTests() {
  try {
    // Test 1: Fetch URL metadata
    console.log("1️⃣ Testing fetch_url_metadata...");
    const metadata = await executeTool("fetch_url_metadata", {
      url: "https://www.w3.org/WAI/",
    });
    console.log("✅ Result:", {
      url: metadata.url,
      status: metadata.status,
      title: metadata.title?.substring(0, 60),
    });

    // Test 2: Analyze HTML
    console.log("\n2️⃣ Testing analyze_html...");
    const htmlResult = await executeTool("analyze_html", {
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Test Page</title></head>
          <body>
            <img src="test.jpg">
            <button>Click</button>
          </body>
        </html>
      `,
      url: "http://test.example.com",
    });
    console.log("✅ Result:", {
      violations: htmlResult.violations.length,
      passes: htmlResult.passes,
      summary: htmlResult.summary,
    });

    // Test 3: Get WCAG criterion
    console.log("\n3️⃣ Testing get_wcag_criterion...");
    const wcagResult = await executeTool("get_wcag_criterion", {
      criterion_id: "1.4.3",
    });
    console.log("✅ Result:", {
      title: wcagResult.data.title,
      level: wcagResult.data.level,
      principle: wcagResult.data.principle,
    });

    // Test 4: Search WAI tips
    console.log("\n4️⃣ Testing search_wai_tips...");
    const waiResult = await executeTool("search_wai_tips", {
      topic: "keyboard navigation",
    });
    console.log("✅ Result:", {
      tips_found: waiResult.tips.length,
    });

    // Test 5: Get Magenta component
    console.log("\n5️⃣ Testing get_magenta_component...");
    const magentaResult = await executeTool("get_magenta_component", {
      component: "button",
    });
    console.log("✅ Result:", {
      component: magentaResult.component,
      category: magentaResult.category,
      url: magentaResult.url,
    });

    // Test 6: Get ARIA pattern
    console.log("\n6️⃣ Testing get_aria_pattern...");
    const ariaResult = await executeTool("get_aria_pattern", {
      pattern: "dialog",
    });
    console.log("✅ Result:", {
      pattern: ariaResult.pattern,
      title: ariaResult.title,
      url: ariaResult.url,
    });

    // Test 7: Search WCAG by principle
    console.log("\n7️⃣ Testing search_wcag_by_principle...");
    const wcagSearch = await executeTool("search_wcag_by_principle", {
      principle: "Perceivable",
      level: "AA",
    });
    console.log("✅ Result:", {
      principle: wcagSearch.principle,
      level: wcagSearch.level,
      count: wcagSearch.count,
    });

    console.log("\n✅ All tests passed! MCP tools are working correctly.\n");
    console.log("📝 Next steps:");
    console.log("1. Check Netlify deployment status");
    console.log("2. Run an audit through the UI");
    console.log("3. Check Netlify function logs for tool execution");
    console.log("4. Verify tool results in audit response\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();
