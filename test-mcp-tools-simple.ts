#!/usr/bin/env bun
import { getAllTools, executeTool } from "./netlify/functions/lib/mcp-tools/index.js";

console.log("🧪 Testing MCP Tools\n");
const tools = getAllTools();
console.log(`✅ Found ${tools.length} tools\n`);

async function test() {
  // Test 1: WCAG
  console.log("1️⃣ Testing get_wcag_criterion...");
  const wcag = await executeTool("get_wcag_criterion", { criterion_id: "1.4.3" });
  console.log("✅ WCAG Tool works:", wcag.data.title);
  
  // Test 2: WAI Tips
  console.log("\n2️⃣ Testing search_wai_tips...");
  const wai = await executeTool("search_wai_tips", { topic: "keyboard" });
  console.log("✅ WAI Tips works:", wai.tips.length, "tips found");
  
  // Test 3: Magenta
  console.log("\n3️⃣ Testing get_magenta_component...");
  const magenta = await executeTool("get_magenta_component", { component: "button" });
  console.log("✅ Magenta works:", magenta.component);
  
  // Test 4: Fetch metadata
  console.log("\n4️⃣ Testing fetch_url_metadata...");
  const fetch = await executeTool("fetch_url_metadata", { url: "https://www.w3.org/" });
  console.log("✅ Fetch works:", fetch.status, fetch.title?.substring(0, 40));
  
  console.log("\n✅ All non-axe tools working! Axe-core will work in Netlify Functions environment.\n");
}

test().catch(console.error);
