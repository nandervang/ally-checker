#!/usr/bin/env bun
/**
 * Verify Playwright Screenshot Capture
 * Run: bun test-screenshot-capture.ts
 */

import { executeTool } from "./netlify/functions/lib/mcp-tools/index.js";
import { writeFileSync } from "fs";

console.log("📸 Testing Playwright Screenshot Capture...\n");

async function runScreenshotTest() {
  try {
    const url = "https://example.com";
    const selector = "h1";
    
    console.log(`Navigating to ${url} and selecting ${selector}...`);
    
    // Execute the MCP tool
    const result = await executeTool("capture_element_screenshot", {
        url,
        selector,
        highlight: true,
        fullPage: false
    });
    
    console.log("Result received:", JSON.stringify(result, null, 2));

    const screenshotData = result.screenshot;

    if (screenshotData && screenshotData.base64) {
        console.log("✅ Screenshot captured successfully!");
        console.log(`   Dimensions: ${screenshotData.width}x${screenshotData.height}`);
        console.log(`   Mime: ${screenshotData.mimeType}`);
        console.log(`   Description: ${screenshotData.description || 'N/A'}`);
        
        // Save to file for manual verification
        const filename = "captured-element-evidence.png";
        writeFileSync(filename, Buffer.from(screenshotData.base64, 'base64'));
        console.log(`\n💾 Saved proof to: ${filename}`);
        
        // Verify output structure matches what the agent needs
        if (screenshotData.base64 && screenshotData.mimeType) {
            console.log("✅ Output schema matches Agent requirements (base64 + mimeType).");
        } else {
            console.error("❌ Output schema mismatch!");
        }
        
    } else {
        console.error("❌ Failed to capture screenshot (no base64 data returned).");
        console.error("Error details:", result.error);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runScreenshotTest();
