# Feature Specification: Accessibility Checker Application

**Feature Branch**: `001-accessibility-checker`  
**Created**: 2025-12-30  
**Status**: In Development  
**Input**: User description: "A11y checker app with URL/HTML input, axe-core + AI analysis, WCAG-organized output"

## Development Workflow *(mandatory)*

**Git & Branch Strategy:**

This feature uses a **long-lived feature branch** workflow with beads (bd) for issue tracking:

1. **All development happens on `001-accessibility-checker` branch**
   - Do NOT work directly on `main` 
   - Keep all commits on the feature branch during development
   
2. **Issue tracking syncs to `main` via bd**
   - Run `bd sync` to synchronize issue database (not code)
   - Issues are tracked in `.beads/*.jsonl` files on the `main` branch
   - Code stays on the feature branch, issues sync across branches

3. **Merge to `main` at major milestones only**
   - When significant features are complete and tested
   - After quality gates pass (tests, linters, builds)
   - Use merge commits to preserve feature branch history:
     ```bash
     git checkout main
     git merge --no-ff 001-accessibility-checker
     git push
     ```

4. **Continue development on feature branch after merge**
   - Stay on `001-accessibility-checker` for ongoing work
   - The feature branch remains active until fully complete
   - Multiple merges to main are expected during development

**Critical Rules:**
- ✅ Work on feature branch: `git checkout 001-accessibility-checker`
- ✅ Sync issues: `bd sync` (syncs to main automatically)
- ✅ Merge to main only at milestones
- ❌ Do NOT delete feature branch after merging
- ❌ Do NOT work directly on main during active development

## Testing & Verification *(mandatory)*

**BEFORE marking any task as complete, you MUST:**

1. **Write tests** - Create unit tests for the functionality
2. **Run tests** - Execute tests and verify they pass
3. **Manual verification** - Test the feature in the running app
4. **Check errors** - Run `get_errors` tool to verify no type errors
5. **Document results** - Record test output and verification steps

**Verification Checklist:**

```markdown
## Task: [TASK-ID] - [Task Name]

### Implementation
- [ ] Code written
- [ ] Types defined
- [ ] Edge cases handled

### Testing
- [ ] Unit tests written
- [ ] Tests pass (attach output)
- [ ] Manual test performed
- [ ] No TypeScript errors
- [ ] No runtime errors

### Evidence
```
[Paste test output here]
```

### Verification Steps
1. [What you tested]
2. [How you verified it works]
3. [Edge cases checked]
```

**Never say "mostly complete" or "should work" - either it's verified and complete, or it's not done.**

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick HTML Snippet Analysis (Priority: P1)

A developer is working on a component and wants to quickly check if a small piece of HTML code has accessibility issues before committing it. They paste the HTML snippet into the checker and receive immediate feedback organized by WCAG principles.

**Why this priority**: This is the core value proposition - fast, friction-free accessibility validation during active development. Developers can catch issues before they reach production.

**Independent Test**: Can be fully tested by pasting a simple HTML snippet (e.g., `<button>Click me</button>`) and verifying that analysis results appear organized by WCAG principles. Delivers immediate value without requiring external dependencies.

**Acceptance Scenarios**:

1. **Given** the user has opened the application, **When** they paste an HTML code snippet (e.g., `<img src="cat.jpg">`) into the input area and click the "Analyze" button, **Then** they see a list of accessibility issues categorized by WCAG principles (Perceivable, Operable, Understandable, Robust)
2. **Given** the user has pasted HTML with no accessibility issues, **When** they click "Analyze", **Then** they see a success message indicating no violations were found
3. **Given** the user has pasted invalid HTML syntax, **When** they click "Analyze", **Then** they see a clear error message explaining the syntax issue

---

### User Story 2 - Full HTML Document Analysis (Priority: P2)

A quality assurance tester receives a complete HTML file to audit. They paste the full HTML source code into the checker to get a comprehensive accessibility report covering all WCAG 2.2 AA violations and potential issues.

**Why this priority**: Extends the core functionality to handle complete documents, enabling pre-deployment validation and comprehensive audits of entire pages.

**Independent Test**: Can be tested by pasting a complete HTML document with `<!DOCTYPE>`, `<html>`, `<head>`, and `<body>` tags and verifying comprehensive analysis across all sections. Delivers value for QA workflows.

**Acceptance Scenarios**:

1. **Given** the user has a complete HTML document with multiple sections, **When** they paste it and click "Analyze", **Then** they receive a comprehensive report identifying all issues across the entire document structure
2. **Given** the HTML contains both automated-detectable issues (missing alt text) and AI-analyzable issues (generic alt text like "image"), **When** analysis completes, **Then** both types of issues appear in the appropriate WCAG category
3. **Given** the analysis finds 20+ issues, **When** results display, **Then** issues are grouped by WCAG principle with expandable sections for better readability

---

### User Story 3 - URL-Based Website Audit (Priority: P2)

A content manager wants to audit a live webpage without accessing the source code. They enter the page URL, and the system fetches the HTML, performs the analysis, and provides a detailed accessibility report.

**Why this priority**: Enables auditing of production websites and third-party pages without requiring technical access to source code. Critical for managers and non-technical auditors.

**Independent Test**: Can be tested by entering a live URL (e.g., "https://example.com") and verifying the system fetches, analyzes, and reports issues. Delivers value for content teams and accessibility auditors.

**Acceptance Scenarios**:

1. **Given** the user enters a valid public URL, **When** they click "Analyze", **Then** the system fetches the page HTML and displays accessibility issues organized by WCAG principles
2. **Given** the URL is inaccessible (404, timeout, or network error), **When** they click "Analyze", **Then** they see a clear error message explaining the fetch failure
3. **Given** the URL requires authentication or returns JavaScript-rendered content, **When** they attempt analysis, **Then** they receive a message explaining limitations and suggesting they use the HTML source input method instead

---

### User Story 4 - Targeted Issue Investigation (Priority: P3)

A developer suspects a specific accessibility problem (e.g., "color contrast might be too low") but isn't sure. They provide their HTML code along with a brief description of the suspected issue, and the AI agent investigates that specific concern in detail while also running the standard audit.

**Why this priority**: Provides expert-level assistance for ambiguous or subjective accessibility concerns that automated tools might miss. Enhances the tool's value for learning and nuanced investigations.

**Independent Test**: Can be tested by providing HTML code plus a suspected issue description (e.g., "Is this button's label clear enough?") and verifying the AI provides focused analysis on that concern. Delivers educational value and deeper insights.

**Acceptance Scenarios**:

1. **Given** the user provides HTML and describes a suspected issue (e.g., "Is this alt text meaningful?"), **When** they click "Analyze", **Then** the report includes a dedicated section addressing the specific concern with AI-powered heuristic analysis
2. **Given** the user provides only a suspected issue description without HTML, **When** they click "Analyze", **Then** the system prompts them to provide HTML code for analysis
3. **Given** the suspected issue is not found during analysis, **When** results display, **Then** the report clearly states the investigated concern and explains why it was not flagged as a violation

---

### User Story 5 - Issue Description Only Guidance (Priority: P3)

A non-technical user (e.g., content writer) wants to understand if something might be an accessibility issue but doesn't have code. They describe the situation (e.g., "I have an image with alt text 'click here'"), and the AI provides educational guidance about potential accessibility concerns.

**Why this priority**: Makes the tool accessible to non-developers and serves an educational purpose, expanding the user base beyond developers.

**Independent Test**: Can be tested by entering only a text description of a potential issue and verifying the AI provides relevant accessibility guidance. Delivers educational value without requiring technical knowledge.

**Acceptance Scenarios**:

1. **Given** the user enters only a description of a possible issue (e.g., "My button just says 'Submit' with no context"), **When** they submit, **Then** they receive educational guidance about why this might be problematic and suggestions for improvement
2. **Given** the description is too vague, **When** submitted, **Then** the AI asks clarifying questions to provide better guidance
3. **Given** the described situation is actually accessible, **When** analyzed, **Then** the response confirms this and explains why it meets accessibility standards

---

### User Story 6 - Visual & Interaction Validation (Priority: P2)

A developer wants to verify that their interactive components (modals, menus) work correctly with keyboard navigation and have visible focus states. They run an audit that includes Playwright-driven simulated user interactions.

**Why this priority**: Automated static analysis (axe-core) cannot verify dynamic behaviors like keyboard traps, focus management, or visual reflow. This bridges the gap between static analysis and manual testing.

**Independent Test**: Can be tested by auditing a page with a modal and verifying the report confirms whether focus is trapped correctly or leaks out.

**Acceptance Scenarios**:

1. **Given** the user audits a page with interactive elements, **When** analysis runs, **Then** the report includes "Visual Validation" results showing focus indicator screenshots
2. **Given** the page has a keyboard trap (focus gets stuck), **When** the keyboard navigation test runs, **Then** it is flagged as a Critical "Keyboard Trap" issue
3. **Given** the user wants to check responsiveness, **When** the "Reflow" test runs, **Then** it verifies content allows 320px width without horizontal scrolling (WCAG 1.4.10)

---

### Edge Cases

- What happens when the HTML contains inline SVGs with complex accessibility requirements?
- How does the system handle extremely large HTML documents (100+ KB)?
- What if the HTML uses custom web components or framework-specific syntax (React, Vue)?
- How are dynamically-generated or JavaScript-dependent interactive elements analyzed when only static HTML is provided?
- What if the user provides a URL that redirects multiple times or uses a non-standard port?
- How does the system handle HTML with mixed character encodings or non-UTF-8 content?
- What if the suspected issue description is in Swedish or another language?
- How are issues prioritized when a single element violates multiple WCAG criteria?
- What happens when axe-core and AI heuristics provide conflicting assessments?

## Requirements *(mandatory)*

### Functional Requirements

**Input Handling**
- **FR-001**: System MUST accept three input types: (1) URL string, (2) full HTML source code, (3) HTML code snippet
- **FR-002**: System MUST allow users to optionally include a text description of a suspected accessibility issue alongside any input type
- **FR-003**: System MUST allow users to provide only a suspected issue description without HTML/URL for educational guidance
- **FR-004**: System MUST validate URL format before attempting to fetch content
- **FR-005**: System MUST sanitize and validate HTML input to prevent security issues while preserving structure for analysis
- **FR-006**: Input area MUST be prominently displayed as the focal point of the UI with minimum 18px font size

**Analysis Engine**
- **FR-007**: System MUST use axe-core library for automated WCAG 2.2 AA compliance checking
- **FR-008**: System MUST employ AI agent (Gemini 2.5 Flash) with MCP tools to evaluate subjective accessibility concerns (e.g., alt text meaningfulness via analyze_html, button label clarity, heading structure logic), using WCAG documentation retrieval (get_wcag_criterion, search_wcag_by_principle) for accurate criterion mapping
- **FR-008a**: **[NEW]** System MUST integrate Playwright for visual and interaction testing (focus styles, keyboard navigation, reflow)
- **FR-009**: When a suspected issue is provided, AI agent MUST perform focused investigation on that specific concern in addition to standard audit
- **FR-010**: System MUST detect and report violations across all four WCAG principles: Perceivable, Operable, Understandable, Robust
- **FR-011**: System MUST identify WCAG 2.2 AA success criteria violated by each issue
- **FR-012**: Analysis MUST run asynchronously in the background. The API MUST return an audit ID immediately, allowing the client to poll for progress.
- **FR-012a**: **[NEW]** System MUST provide real-time progress updates (0-100%) and current stage description (e.g., "Analyzing Layout", "Checking Contrast", "Generating Report")

**Visual & Interaction Testing**
- **FR-042**: **[NEW]** System MUST capture screenshots of element focus states to verify WCAG 2.4.7 (Focus Visible)
- **FR-043**: **[NEW]** System MUST simulate keyboard navigation (Tab/Shift+Tab) to detect logical reading order and focus traps (WCAG 2.4.3, 2.1.2)
- **FR-044**: **[NEW]** System MUST verify "Reflow" (WCAG 1.4.10) by simulating a 320px viewport and detecting horizontal scrollbars

**URL Fetching**
- **FR-013**: System MUST fetch HTML content from provided URLs using HTTP/HTTPS protocols
- **FR-014**: System MUST handle common fetch errors (404, timeout, DNS failure) with clear user-friendly messages
- **FR-015**: System MUST respect robots.txt and implement reasonable rate limiting to avoid overwhelming target servers
- **FR-016**: System MUST set a timeout of 60 seconds for full audit operations (increased for Playwright tests)
- **FR-017**: System MUST inform users when JavaScript-rendered content cannot be analyzed from URL-based input

**Output & Reporting**
- **FR-018**: System MUST organize all findings into four primary sections: Perceivable, Operable, Understandable, Robust
- **FR-019**: Each reported issue MUST include: (1) description, (2) affected WCAG success criterion, (3) severity level, (4) location in code, (5) suggested remediation, (6) **[NEW]** how to reproduce, (7) **[NEW]** keyboard testing instructions, (8) **[NEW]** screen reader testing instructions, (9) **[NEW]** visual testing instructions, (10) **[NEW]** expected behavior, (11) **[NEW]** formatted report text
- **FR-019a**: **[NEW]** Testing instructions MUST follow Magenta A11y format with clear step-by-step procedures for manual verification
- **FR-019b**: **[NEW]** Report text MUST be generated according to user's selected report template (ETU Swedish, WCAG International, VPAT US, Simple, or Technical)
- **FR-020**: When no issues are found, system MUST display a clear success message confirming accessibility compliance
- **FR-021**: System MUST distinguish between automated findings (axe-core) and AI heuristic findings in the report
- **FR-022**: When a suspected issue is investigated, system MUST include a dedicated section addressing that concern
- **FR-023**: Report MUST use minimum 18px font size and maintain 4.5:1 color contrast for all text
- **FR-024**: Issues MUST be sortable and filterable by severity, WCAG principle, and success criterion
- **FR-025**: **[NEW]** System MUST provide collapsible testing sections (keyboard, screen reader, visual) for each issue in the UI
- **FR-026**: **[NEW]** System MUST provide copy-to-clipboard functionality for formatted report text
- **FR-026a**: **[NEW]** Frontend MUST stream or poll analysis progress, showing users exactly what the agent is doing (e.g., "Step 2/5: Verifying contrast...")

**User Interface**
- **FR-027**: UI MUST be modern, simple, and desktop-optimized while remaining fully responsive
- **FR-028**: UI MUST feature a large "Analyze" button (minimum 44x44px) as the primary call-to-action
- **FR-029**: Input area MUST be the visual focal point with ample space for pasting code
- **FR-030**: UI MUST provide clear visual feedback during analysis (loading state)
- **FR-031**: UI MUST be fully keyboard accessible with visible focus indicators (3px outline, 3:1 contrast minimum)
- **FR-032**: UI MUST follow Material Design 3 design tokens and ShadCN 2.0 component patterns
- **FR-033**: UI MUST support both light and dark themes while maintaining WCAG AA contrast ratios
- **FR-034**: UI MUST support Swedish (sv-SE) localization for all user-facing text

**Settings & Configuration**
- **FR-035**: **[NEW]** System MUST allow users to select default report template from 5 options: ETU Swedish, WCAG International, VPAT US, Simple, Technical
- **FR-036**: **[NEW]** Settings UI MUST provide clear descriptions of each report template's purpose and target audience
- **FR-037**: **[NEW]** Report template selection MUST persist in user settings (localStorage) across sessions
- **FR-038**: **[NEW]** Default report template MUST be "WCAG International" for new users

**Error Handling**
- **FR-039**: System MUST provide clear, actionable error messages for invalid HTML syntax
- **FR-040**: System MUST gracefully handle analysis failures and explain what went wrong
- **FR-041**: System MUST validate that at least one input field (URL, HTML, or issue description) is provided before allowing analysis

### Key Entities

- **Analysis Input**: Represents user-submitted content for analysis, containing one or more of: URL string, HTML source code, code snippet, suspected issue description. Tracks input type and timestamp.

- **Audit Report**: Comprehensive results of accessibility analysis, organized by WCAG principles. Contains collections of violations, warnings, and passes. Includes metadata like analysis timestamp, input type, total issue count, **[NEW]** progress (0-100), and **[NEW]** current_stage.

- **Accessibility Issue**: Individual violation or warning identified during analysis. Contains: description, WCAG success criterion reference (e.g., 1.4.3), severity level (critical/serious/moderate/minor), code location, affected HTML element, detection source (axe-core or AI heuristic), suggested remediation steps, **[NEW]** how_to_reproduce (step-by-step reproduction instructions), **[NEW]** keyboard_testing (keyboard-specific testing procedures), **[NEW]** screen_reader_testing (screen reader testing instructions), **[NEW]** visual_testing (visual verification steps), **[NEW]** expected_behavior (description of correct accessible behavior), **[NEW]** report_text (formatted report text according to selected template).

- **Report Template**: **[NEW]** Configurable format for generating structured accessibility reports. Five templates available:
  - **ETU Swedish**: Professional reports for Swedish public sector compliance (Webbriktlinjer, EN 301 549)
  - **WCAG International**: International standard format referencing WCAG 2.1/2.2 (default)
  - **VPAT US**: Section 508 compliance format for US federal procurement
  - **Simple**: Concise format for agile development teams with before/after code examples
  - **Technical**: Detailed technical analysis with DOM paths and implementation details

- **WCAG Principle Category**: Organizational container for issues, corresponding to one of four WCAG principles (Perceivable, Operable, Understandable, Robust). Each category contains related issues and displays summary statistics.

- **Suspected Issue Investigation**: When user provides a specific concern, this represents the AI agent's focused analysis results, including: original concern description, AI assessment, related WCAG criteria, confirmation or dismissal of concern, educational context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can analyze a simple HTML snippet and receive categorized results in under 5 seconds
- **SC-002**: System successfully detects 95% of common WCAG 2.2 AA violations testable by automated tools (verified against known test cases)
- **SC-003**: AI heuristic analysis provides meaningful insights for subjective issues (alt text quality, label clarity) in 80% of cases as verified by accessibility expert review
- **SC-004**: The application interface itself achieves 100% WCAG 2.2 AA compliance as verified by axe-core and manual audit
- **SC-005**: Lighthouse accessibility audit of the application UI scores 95 or higher
- **SC-006**: Users can complete full analysis workflow using only keyboard navigation in under 30 seconds
- **SC-007**: All interactive elements meet 44x44px minimum touch target size requirement
- **SC-008**: All body text renders at minimum 18px font size across all screen sizes
- **SC-009**: URL fetch operations complete successfully for 95% of publicly accessible websites
- **SC-010**: Zero critical accessibility violations in production deployment
- **SC-011**: Swedish localization covers 100% of user-facing interface text
- **SC-012**: System provides useful feedback when analyzing incomplete or malformed HTML in 90% of test cases

## Technical Architecture *(mandatory)*

### MCP Architecture Overview

**Migration Status**: Migrated from Python to TypeScript (January 2026)

The system uses Model Context Protocol (MCP) to enable AI agents to interact with specialized accessibility analysis tools. Originally implemented as Python-based MCP servers, the architecture was migrated to **TypeScript/Node.js in-process tools** for Netlify Functions compatibility.

**Migration Rationale**:
- Python runtime not available in Netlify Functions (only in build phase)
- Eliminated child process spawn overhead and stdio communication
- Type-safe integration with TypeScript codebase
- Simplified deployment (no Python dependencies in production)
- Faster execution (in-process vs. child processes)

**Current Architecture** (TypeScript):
1. **fetch tools**: Web content retrieval with native fetch API and timeout control
2. **wcag-docs tools**: WCAG 2.2 criterion documentation database and search
3. **axe-core tools**: Automated accessibility testing using jsdom + axe-core
4. **wai-tips tools**: W3C WAI accessibility tips and ARIA patterns
5. **magenta tools**: Magenta A11y component testing patterns

All tools run **in-process** within the Netlify Function, providing modular capabilities without external dependencies or process spawning.

### Available MCP Tools

The AI agent has access to **13 TypeScript MCP tools** for comprehensive accessibility auditing:

**Fetch Tools** (2):
| Tool | Module | Purpose |
|------|--------|---------|  
| `fetch_url` | fetch.ts | Retrieve HTML content from URLs with 30s timeout and redirect handling |
| `fetch_url_metadata` | fetch.ts | Get HTTP headers, title, and description without full content download |

**Axe-Core Tools** (2):
| Tool | Module | Purpose |
|------|--------|---------|  
| `analyze_html` | axe-core.ts | Run axe-core WCAG checks on HTML strings using jsdom |
| `analyze_url` | axe-core.ts | Fetch and analyze live URLs with axe-core (combines fetch + analyze) |

**WCAG Documentation Tools** (3):
| Tool | Module | Purpose |
|------|--------|---------|  
| `get_wcag_criterion` | wcag-docs.ts | Retrieve specific WCAG 2.2 criterion details by ID (e.g., 1.1.1) |
| `search_wcag_by_principle` | wcag-docs.ts | Find criteria by principle (Perceivable/Operable/Understandable/Robust) |
| `get_all_criteria` | wcag-docs.ts | List all WCAG criteria with optional level/principle filtering |

**WAI Tips Tools** (3):
| Tool | Module | Purpose |
|------|--------|---------|  
| `get_wai_resource` | wai-tips.ts | Fetch W3C WAI resources (Developing/Designing/Writing/ARIA/Understanding) |
| `search_wai_tips` | wai-tips.ts | Search accessibility tips by topic (navigation, forms, images, multimedia, etc.) |
| `get_aria_pattern` | wai-tips.ts | Get ARIA authoring patterns (dialog, tabs, accordion, menu, etc.) |

**Magenta A11y Tools** (3):
| Tool | Module | Purpose |
|------|--------|---------|  
| `get_magenta_component` | magenta.ts | Component testing checklists (button, form, table, dialog, etc.) |
| `search_magenta_patterns` | magenta.ts | Search patterns by category (interactive/form/content/navigation) |
| `get_magenta_testing_methods` | magenta.ts | Testing methodology guidance (keyboard/screen-reader/visual) |

**Implementation**: All tools located in `netlify/functions/lib/mcp-tools/` with central routing via `index.ts`

**Primary Model**: Google Gemini 2.5 Flash with native MCP support

Gemini was selected for its:
- **Native MCP Support**: Built-in integration with MCP ClientSession (no custom bridge needed)
- **Function Calling**: Automatic tool execution with multi-turn conversations
- **Cost Efficiency**: Better pricing than Claude for high-volume function calling
- **Reliability**: Temperature 0.3 for consistent, reproducible analysis

**Integration Flow** (TypeScript Architecture):
1. Load TypeScript MCP tools via `getAllTools()` from `netlify/functions/lib/mcp-tools/index.ts`
2. Convert tool schemas to Gemini function declarations via `convertToGeminiFormat()`
3. Initialize Gemini model with tools array (13 tools available)
4. Execute analysis with system instructions for accessibility auditing
5. Function calling loop:
   - Model requests tool execution (e.g., `fetch_url`, `analyze_html`)
   - Route to handler via `executeTool(toolName, args)` (prefix-based routing)
   - Execute TypeScript tool in-process (no child processes)
   - Feed results back to model as function response
   - Continue until model generates final answer
6. Parse final response into structured AuditResult with WCAG categorization

**System Instructions**: The AI agent receives comprehensive context about accessibility principles, WCAG 2.2 criteria, common violations, and remediation strategies. It's instructed to use MCP tools systematically: fetch content, run automated checks, search WCAG documentation, and provide actionable remediation guidance.

### Environment Configuration

**Required Environment Variables**:
- `GEMINI_API_KEY`: Google AI Studio API key for Gemini 2.5 Flash access

**MCP Tool Configuration**: TypeScript tools loaded as ES modules (no child processes). Implementation in `netlify/functions/lib/mcp-tools/`:
- **fetch.ts**: Native fetch API with AbortSignal timeout (30s)
- **wcag-docs.ts**: In-memory WCAG 2.2 criterion database (86 criteria)
- **axe-core.ts**: jsdom virtual DOM + axe-core npm package
- **wai-tips.ts**: W3C WAI resource fetching and ARIA pattern URLs
- **magenta.ts**: Magenta A11y component testing checklist database
- **index.ts**: Tool aggregation and routing logic

**Netlify Bundler Configuration** (`netlify.toml`):
```toml
[functions]
  external_node_modules = ["jsdom", "axe-core"]
```
Marking jsdom and axe-core as external prevents bundling issues with CSS assets and browser compatibility modules.

## Assumptions

- Users have basic understanding of HTML structure (for HTML input methods)
- Target websites for URL analysis are publicly accessible and don't require authentication
- JavaScript-rendered content analysis is out of scope for initial version (static HTML only)
- **AI heuristic analysis uses Google Gemini 2.5 Flash with function calling (13 TypeScript MCP tools)**
- **MCP tools run in-process as TypeScript modules (no Python dependencies or child processes)**
- **jsdom and axe-core are marked as external in Netlify bundler configuration**
- **GEMINI_API_KEY is configured in Netlify environment variables**
- **Node.js 20 runtime with Bun 1.3 for build (configured in netlify.toml)**
- Users have modern browsers supporting ES6+ JavaScript features
- Swedish Lag (2018:1937) compliance requirements are met by ensuring WCAG 2.2 AA compliance (Swedish law references WCAG standards)
- Analysis is performed client-side for HTML snippets and server-side for URL fetching (for security and CORS reasons)
- System focuses on web content accessibility, not mobile app or desktop software accessibility

## Out of Scope

- Real-time monitoring or continuous accessibility scanning
- Integration with CI/CD pipelines or automated testing frameworks (future enhancement)
- Accessibility remediation automation (only suggestions provided)
- Analysis of PDF documents, video content, or audio files
- User account management or saving analysis history
- Comparison of multiple analyses or historical trending
- Browser extension or IDE plugin versions
- Mobile app native analysis
- WCAG AAA (Level AAA) compliance checking
- Automated fixing or code transformation features
- Multi-page website crawling and batch analysis
