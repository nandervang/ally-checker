#!/usr/bin/env python3
"""
Quick test script to validate MCP servers are working correctly.
This tests each server can start up and respond to basic tool calls.
"""
import asyncio
import json
from pathlib import Path

async def test_wcag_docs_server():
    """Test WCAG docs server can return criterion details"""
    print("\n🧪 Testing WCAG Docs Server...")
    try:
        # Import the server module
        import sys
        sys.path.insert(0, str(Path(__file__).parent / "wcag-docs-server"))
        from server import WCAG_CRITERIA, get_wcag_criterion
        
        # Test get criterion
        result = await get_wcag_criterion("1.1.1")
        assert result is not None, "Should return criterion 1.1.1"
        assert "Non-text Content" in result, "Should contain criterion name"
        print(f"✅ WCAG Docs Server: Retrieved criterion 1.1.1")
        print(f"   Preview: {result[:100]}...")
        
        # Test database has expected criteria
        assert len(WCAG_CRITERIA) == 8, f"Should have 8 criteria, got {len(WCAG_CRITERIA)}"
        print(f"✅ WCAG Docs Server: Database contains {len(WCAG_CRITERIA)} criteria")
        
        return True
    except Exception as e:
        print(f"❌ WCAG Docs Server failed: {e}")
        return False

async def test_fetch_server():
    """Test fetch server can make HTTP requests"""
    print("\n🧪 Testing Fetch Server...")
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).parent / "fetch-server"))
        from server import fetch_url_metadata
        
        # Test fetching metadata from a known reliable site
        result = await fetch_url_metadata("https://www.w3.org/WAI/WCAG22/quickref/")
        assert result is not None, "Should return metadata"
        assert "200" in result or "content-type" in result.lower(), "Should contain HTTP status or headers"
        print(f"✅ Fetch Server: Retrieved metadata from W3C")
        print(f"   Preview: {result[:150]}...")
        
        return True
    except Exception as e:
        print(f"❌ Fetch Server failed: {e}")
        return False

async def test_axe_server():
    """Test axe-core server can analyze HTML"""
    print("\n🧪 Testing Axe-Core Server...")
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).parent / "axe-core-server"))
        from server import analyze_html
        
        # Test with simple HTML that has accessibility issues
        test_html = """
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Test</title></head>
        <body>
            <img src="test.jpg">
            <button></button>
        </body>
        </html>
        """
        
        result = await analyze_html(test_html)
        assert result is not None, "Should return analysis result"
        # Should detect missing alt text and empty button
        assert "violations" in result.lower() or "img" in result.lower(), "Should detect violations"
        print(f"✅ Axe-Core Server: Analyzed HTML successfully")
        print(f"   Preview: {result[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Axe-Core Server failed: {e}")
        print(f"   Note: This test requires Playwright and Chromium to be installed")
        return False

async def main():
    """Run all server tests"""
    print("=" * 60)
    print("MCP Server Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test each server
    results.append(("WCAG Docs", await test_wcag_docs_server()))
    results.append(("Fetch", await test_fetch_server()))
    results.append(("Axe-Core", await test_axe_server()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {name} Server")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\n{total_passed}/{len(results)} servers passed tests")
    
    if total_passed == len(results):
        print("\n🎉 All MCP servers are working correctly!")
    else:
        print("\n⚠️  Some servers need attention")
    
    return total_passed == len(results)

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
