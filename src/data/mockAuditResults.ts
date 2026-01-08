/**
 * Mock audit results for testing the results display
 * Based on WCAG 2.2 AA standards with categorization by principles
 */

export interface AuditIssue {
  id: string;
  principle: "perceivable" | "operable" | "understandable" | "robust";
  guideline: string;
  wcagLevel: "A" | "AA" | "AAA";
  severity: "critical" | "serious" | "moderate" | "minor";
  title: string;
  description: string;
  element: string;
  selector: string;
  impact: string;
  remediation: string;
  helpUrl: string;
  occurrences: number;
  codeExample?: string; // Corrected code showing how to fix the issue
  // Compatibility fields for Issue type
  wcag_criterion?: string; // Same as guideline
  wcag_url?: string; // Same as helpUrl
  how_to_fix?: string; // Same as remediation
  // Magenta A11y-style testing fields
  how_to_reproduce?: string;
  keyboard_testing?: string;
  screen_reader_testing?: string;
  visual_testing?: string;
  expected_behavior?: string;
  // Swedish ETU-style report
  report_text?: string;
}

export interface AuditResult {
  auditId?: string;
  url?: string;
  fileName?: string;
  documentType?: "html" | "pdf" | "docx";
  timestamp: string;
  summary: {
    totalIssues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    passed: number;
    failed: number;
  };
  issues: AuditIssue[];
  agent_trace?: {
    steps: Array<{
      timestamp: string;
      action: string;
      tool?: string;
      input?: Record<string, unknown>;
      output?: string;
      reasoning?: string;
    }>;
    tools_used: string[];
    sources_consulted: string[];
    duration_ms?: number;
  };
}

export const mockHtmlAuditResult: AuditResult = {
  url: "https://example.com",
  documentType: "html",
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues: 12,
    critical: 3,
    serious: 4,
    moderate: 3,
    minor: 2,
    passed: 15,
    failed: 12,
  },
  issues: [
    {
      id: "issue-1",
      principle: "perceivable",
      guideline: "1.1.1 Non-text Content",
      wcag_criterion: "1.1.1",
      wcagLevel: "A",
      severity: "critical",
      title: "Images missing alt text",
      description: "Images must have alternative text for screen readers",
      element: "<img src='logo.png'>",
      selector: "img[src='logo.png']",
      impact: "Screen reader users cannot understand image content. They will only hear 'image' or the filename, which provides no meaningful information about the image's purpose.",
      remediation: "Add descriptive alt text that conveys the purpose and content of the image",
      how_to_fix: "Add descriptive alt text that conveys the purpose and content of the image",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
      wcag_url: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
      occurrences: 5,
      codeExample: "<img src='logo.png' alt='Company logo'>",
      how_to_reproduce: "1. Navigate to the homepage\n2. Locate the logo image at the top of the page\n3. Inspect the image element in browser DevTools\n4. Notice the missing alt attribute",
      keyboard_testing: "N/A - Decorative images should not be focusable. This image should have alt=\"\" if decorative, or descriptive alt text if informative.",
      screen_reader_testing: "Test with NVDA/JAWS/VoiceOver:\n• Navigate to image with screen reader\n• Expected: Announces image purpose (e.g., 'Company logo, image')\n• Current: Announces only 'image' or filename 'logo.png'\n• Missing: Accessible name describing the image",
      visual_testing: "• Verify image loads correctly\n• Check if image conveys essential information\n• Determine if decorative (alt=\"\") or informative (needs descriptive alt)",
      expected_behavior: "WCAG 1.1.1 Non-text Content (Level A): All non-text content that is presented to the user has a text alternative that serves the equivalent purpose. Images must have alt attributes that describe their purpose and content for users who cannot see them.",
      report_text: `## 1.1.1 Images missing alt text

**Problem:** Images lack alternative text for screen readers
**WCAG:** 1.1.1 | **Severity:** Critical

### What's Wrong
The logo image and 4 other images on the page are missing alt attributes. Screen reader users will only hear "image" or the filename instead of understanding the image's purpose.

### How to Fix
Add descriptive alt attributes to all informative images. For decorative images, use alt="".

### Code
❌ **Before:**
\`\`\`html
<img src='logo.png'>
\`\`\`

✅ **After:**
\`\`\`html
<img src='logo.png' alt='Company logo'>
\`\`\`

**Reference:** https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html`,
    },
    {
      id: "issue-2",
      principle: "perceivable",
      guideline: "1.4.3 Contrast (Minimum)",
      wcag_criterion: "1.4.3",
      wcagLevel: "AA",
      severity: "serious",
      title: "Insufficient color contrast",
      description: "Text color contrast ratio is below 4.5:1 minimum",
      element: "<p style='color: #767676; background: #fff'>",
      selector: ".content p",
      impact: "Users with low vision, color blindness, or viewing in bright sunlight cannot read the text. This affects approximately 8% of men and 0.5% of women with color vision deficiency.",
      remediation: "Use a darker text color to achieve at least 4.5:1 contrast ratio against white background",
      how_to_fix: "Use a darker text color to achieve at least 4.5:1 contrast ratio against white background",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
      wcag_url: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
      occurrences: 8,
      codeExample: "<p style='color: #595959; background: #fff'>Text with 7:1 contrast ratio</p>",
      how_to_reproduce: "1. Navigate to the main content area\n2. Observe the paragraph text styling\n3. Use browser DevTools to inspect computed color values\n4. Calculate contrast ratio using a contrast checker tool",
      visual_testing: "• Use browser DevTools color picker to check contrast\n• Test: Foreground #767676 on Background #FFFFFF\n• Result: 4.54:1 ratio (fails for normal text, needs 4.5:1)\n• Zoom page to 200% to verify text remains readable\n• Test in bright sunlight or low-light conditions",
      expected_behavior: "WCAG 1.4.3 Contrast (Minimum) Level AA: Text should have a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt+ bold). Current ratio of 3.2:1 fails this requirement.",
      report_text: `## 1.4.3 Insufficient color contrast

**WCAG Success Criterion:** 1.4.3 Contrast (Minimum) (Level AA)
**WCAG Principle:** Perceivable
**Severity:** Serious

### Issue Description
Text in the main content area uses a color combination (#767676 on #FFFFFF) that produces a contrast ratio of only 3.2:1, which fails to meet the WCAG AA minimum requirement of 4.5:1 for normal-sized text.

### How to Reproduce
1. Navigate to the main content area
2. Use browser DevTools to inspect paragraph text
3. Use the color picker to identify foreground and background colors
4. Calculate contrast ratio using a contrast checker tool
5. Verify the ratio is below 4.5:1

### User Impact
Users with low vision, color blindness, or those viewing content in bright sunlight will have difficulty reading the text. This affects approximately 8% of men and 0.5% of women with color vision deficiency, as well as older users with age-related vision changes.

### Remediation
**Required:** Increase text color contrast to at least 4.5:1 by darkening the text color to #595959 or darker.
**Recommended:** Aim for 7:1 contrast ratio (AAA level) for improved readability: use #4D4D4D or darker.

### Code Example
\`\`\`css
/* Current - FAILS WCAG AA */
.content p {
  color: #767676; /* 3.2:1 contrast */
  background: #fff;
}

/* Fixed - PASSES WCAG AA */
.content p {
  color: #595959; /* 7:1 contrast */
  background: #fff;
}
\`\`\`

### WCAG Resources
- Understanding 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- Techniques: G18, G145`,
    },
    {
      id: "issue-3",
      principle: "operable",
      guideline: "2.1.1 Keyboard",
      wcag_criterion: "2.1.1",
      wcagLevel: "A",
      severity: "critical",
      title: "Interactive elements not keyboard accessible",
      description: "Custom dropdown cannot be operated with keyboard",
      element: "<div class='dropdown' onclick='toggle()'>",
      selector: ".dropdown",
      impact: "Keyboard users, including many people with motor disabilities who cannot use a mouse, are completely unable to access the dropdown functionality. This creates a barrier that prevents task completion.",
      remediation: "Make the element focusable and add keyboard event handlers for Enter and Space keys",
      how_to_fix: "Make the element focusable and add keyboard event handlers for Enter and Space keys",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
      wcag_url: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
      occurrences: 3,
      codeExample: "<button class='dropdown' onclick='toggle()' onkeydown='handleKey(event)'>Options</button>",
      how_to_reproduce: "1. Navigate to the settings page\n2. Try to access the language dropdown using only your keyboard\n3. Press Tab key to move focus through interactive elements\n4. Notice the dropdown is not reachable or cannot be opened with Enter/Space",
      keyboard_testing: "Test keyboard-only navigation:\n• Tab: Focus should move visibly to the dropdown with a clear focus indicator (3:1 contrast minimum)\n• Enter or Space: Should open/close the dropdown menu\n• Arrow keys (↑/↓): Should navigate through dropdown options when open\n• Esc: Should close dropdown and return focus to trigger button\n• Tab when open: Should close dropdown and move to next element\n\nCurrent behavior:\n• Tab: Dropdown is skipped (not in tab order)\n• Enter/Space: No effect - keyboard users cannot open dropdown",
      screen_reader_testing: "Test with NVDA/JAWS/VoiceOver:\n• Name: Should announce 'Language selector' or similar descriptive name\n• Role: Should identify as 'button' or 'combobox'\n• State: Should announce 'collapsed' when closed, 'expanded' when open\n• Value: Should announce currently selected option\n\nCurrent behavior:\n• Role: Announces as 'group' or 'clickable' (incorrect)\n• Missing: Proper ARIA role and state attributes\n• No keyboard interaction possible",
      visual_testing: "• Verify visible focus indicator appears when dropdown receives focus\n• Focus ring should have minimum 3:1 contrast against background\n• Focus indicator should be at least 2px thick or have clear visual distinction\n• Test with keyboard navigation to ensure focus is always visible",
      expected_behavior: "WCAG 2.1.1 Keyboard (Level A): All functionality must be operable through a keyboard interface without requiring specific timings for individual keystrokes. The dropdown must be reachable via Tab, openable with Enter or Space, navigable with arrow keys, and closable with Escape.",
      report_text: `## 2.1.1 Dropdown – Tangentbordsåtkomst saknas

Anpassad dropdown kan inte nås eller användas med enbart tangentbord

Kategori: Hanterbar (Operable)

WCAG-kriterium:
2.1.1 Keyboard (nivå A)
2.4.7 Focus Visible (nivå AA)

EN 301 549 Kapitel: 9.2.1.1, 9.2.4.7

Webbriktlinjer:
https://webbriktlinjer.se/riktlinjer/66-gor-alla-funktioner-tillgangliga-fran-tangentbordet/
https://webbriktlinjer.se/riktlinjer/68-markera-vilket-element-som-har-fokus/

WCAG-förklaring: All funktionalitet måste kunna användas med tangentbord utan att kräva specifika tidsinställningar för enskilda tangenttryckningar. Fokusindikatorer måste vara tydligt synliga.

### Beskrivning av felet

Språkväljaren är implementerad som en <div> med onclick-hanterare, vilket gör den oåtkomlig för tangentbordsanvändare. Elementet är inte i tabordningen och kan därför inte nås med Tab-tangenten. Dessutom saknas ARIA-roller och attribut som skulle göra komponenten förståelig för skärmläsare.

### Hur man återskapar felet
1. Navigera till inställningssidan där språkväljaren finns
2. Försök använda endast tangentbordet för att nå dropdown-menyn
3. Tryck på Tab-tangenten för att förflytta fokus genom interaktiva element
4. Observera att dropdown-menyn hoppas över och inte kan nås eller öppnas med Enter/Space

### Konsekvens för användaren:

Användare som förlitar sig på tangentbordnavigering, inklusive många med motoriska funktionsnedsättningar som inte kan använda mus, är helt utestängda från att ändra språkinställningar. Detta skapar en barriär som förhindrar uppgiftsutförande och bryter mot grundläggande tillgänglighetskrav.

### Åtgärda:
Bör        Byt ut <div>-elementet mot ett semantiskt <button>-element med korrekt ARIA-attribut (role="combobox", aria-expanded, aria-haspopup)
Kan        Lägg till tangentbordshanterare för Enter, Space (öppna/stänga), piltangenter (navigera alternativ) och Escape (stäng dropdown)

### Kodexempel
\`\`\`html
<button 
  class="dropdown" 
  role="combobox"
  aria-expanded="false"
  aria-haspopup="listbox"
  aria-label="Välj språk"
  onclick="toggle()"
  onkeydown="handleKey(event)">
  Svenska
</button>
<ul role="listbox" aria-label="Språkalternativ" hidden>
  <li role="option" tabindex="0">Svenska</li>
  <li role="option" tabindex="0">English</li>
</ul>
\`\`\`

### Relaterade krav
WCAG 2.1: 2.1.1 (Level A), 2.4.7 (Level AA), EN 301 549: 9.2.1.1, 9.2.4.7`,
    },
    {
      id: "issue-4",
      principle: "operable",
      guideline: "2.4.4 Link Purpose (In Context)",
      wcagLevel: "A",
      severity: "serious",
      title: "Links with non-descriptive text",
      description: "Link text 'Click here' doesn't describe destination",
      element: "<a href='/products'>Click here</a>",
      selector: "a[href='/products']",
      impact: "Screen reader users who navigate by links hear only 'Click here' without context about where the link goes. This is especially problematic when using screen reader features that list all links on a page.",
      remediation: "Use descriptive link text that makes sense out of context",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
      occurrences: 4,
      codeExample: "<a href='/products'>View our products</a>",
    },
    {
      id: "issue-5",
      principle: "understandable",
      guideline: "3.1.1 Language of Page",
      wcagLevel: "A",
      severity: "critical",
      title: "Missing language attribute",
      description: "HTML element missing lang attribute",
      element: "<html>",
      selector: "html",
      impact: "Screen readers cannot determine the correct pronunciation and voice to use. This results in garbled speech output, making content incomprehensible to blind users.",
      remediation: "Add lang attribute with appropriate language code (e.g., 'en' for English, 'sv' for Swedish)",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
      occurrences: 1,
      codeExample: "<html lang='en'>",
    },
    {
      id: "issue-6",
      principle: "understandable",
      guideline: "3.3.2 Labels or Instructions",
      wcagLevel: "A",
      severity: "serious",
      title: "Form inputs without labels",
      description: "Input fields missing associated labels",
      element: "<input type='text' name='email'>",
      selector: "input[name='email']",
      impact: "Users cannot identify the purpose of form fields",
      remediation: "Add label: <label for='email'>Email address</label><input id='email' type='text'>",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html",
      occurrences: 6,
    },
    {
      id: "issue-7",
      principle: "robust",
      guideline: "4.1.1 Parsing",
      wcagLevel: "A",
      severity: "serious",
      title: "Invalid HTML structure",
      description: "Duplicate ID attributes found",
      element: "<div id='content'>",
      selector: "#content",
      impact: "Assistive technologies may not parse content correctly",
      remediation: "Ensure all ID attributes are unique",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/parsing.html",
      occurrences: 2,
    },
    {
      id: "issue-8",
      principle: "perceivable",
      guideline: "1.4.11 Non-text Contrast",
      wcagLevel: "AA",
      severity: "moderate",
      title: "UI component contrast too low",
      description: "Button border has insufficient 3:1 contrast ratio",
      element: "<button class='primary'>",
      selector: ".primary",
      impact: "Users with low vision cannot distinguish UI controls",
      remediation: "Increase border contrast to at least 3:1 ratio",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html",
      occurrences: 7,
    },
    {
      id: "issue-9",
      principle: "operable",
      guideline: "2.5.5 Target Size",
      wcagLevel: "AAA",
      severity: "moderate",
      title: "Touch targets too small",
      description: "Interactive elements smaller than 44x44 pixels",
      element: "<button style='padding: 2px'>",
      selector: ".icon-btn",
      impact: "Users with motor disabilities may have difficulty tapping",
      remediation: "Increase touch target size to at least 44x44px",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/target-size.html",
      occurrences: 9,
    },
    {
      id: "issue-10",
      principle: "understandable",
      guideline: "3.2.4 Consistent Identification",
      wcagLevel: "AA",
      severity: "moderate",
      title: "Inconsistent component labeling",
      description: "Same functionality labeled differently across pages",
      element: "<button>Submit</button> vs <button>Send</button>",
      selector: "form button",
      impact: "Users may be confused by inconsistent labels",
      remediation: "Use consistent labels for the same functionality",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html",
      occurrences: 3,
    },
    {
      id: "issue-11",
      principle: "robust",
      guideline: "4.1.2 Name, Role, Value",
      wcagLevel: "A",
      severity: "minor",
      title: "Custom controls missing ARIA attributes",
      description: "Custom checkbox missing role and aria-checked",
      element: "<div class='checkbox'>",
      selector: ".checkbox",
      impact: "Assistive technologies cannot interpret custom controls",
      remediation: "Add role='checkbox' and aria-checked='false' attributes",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
      occurrences: 4,
    },
    {
      id: "issue-12",
      principle: "perceivable",
      guideline: "1.3.1 Info and Relationships",
      wcagLevel: "A",
      severity: "minor",
      title: "Headings not in logical order",
      description: "Page skips from <h1> to <h3>",
      element: "<h3>Section Title</h3>",
      selector: "h3",
      impact: "Screen reader users may miss content hierarchy",
      remediation: "Use headings in sequential order (h1, h2, h3)",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
      occurrences: 2,
    },
  ],
};

export const mockPdfAuditResult: AuditResult = {
  fileName: "annual-report-2024.pdf",
  documentType: "pdf",
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues: 8,
    critical: 2,
    serious: 3,
    moderate: 2,
    minor: 1,
    passed: 10,
    failed: 8,
  },
  issues: [
    {
      id: "pdf-issue-1",
      principle: "perceivable",
      guideline: "1.1.1 Non-text Content",
      wcagLevel: "A",
      severity: "critical",
      title: "PDF images without alt text",
      description: "Images in PDF lack alternative text descriptions",
      element: "Figure on page 3",
      selector: "Page 3, Figure 1",
      impact: "Screen reader users cannot access image content",
      remediation: "Add alt text to all images using PDF accessibility tools",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
      occurrences: 12,
    },
    {
      id: "pdf-issue-2",
      principle: "perceivable",
      guideline: "1.3.1 Info and Relationships",
      wcagLevel: "A",
      severity: "critical",
      title: "PDF not tagged",
      description: "Document lacks proper tag structure",
      element: "Document root",
      selector: "Document",
      impact: "Screen readers cannot navigate document structure",
      remediation: "Add tags using Adobe Acrobat or similar PDF tool",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
      occurrences: 1,
    },
    {
      id: "pdf-issue-3",
      principle: "operable",
      guideline: "2.4.2 Page Titled",
      wcagLevel: "A",
      severity: "serious",
      title: "PDF missing document title",
      description: "Document properties missing title metadata",
      element: "Document properties",
      selector: "Metadata",
      impact: "Users cannot identify document in browser tabs",
      remediation: "Add document title in PDF properties",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html",
      occurrences: 1,
    },
    {
      id: "pdf-issue-4",
      principle: "perceivable",
      guideline: "1.4.3 Contrast (Minimum)",
      wcagLevel: "AA",
      severity: "serious",
      title: "PDF text has low contrast",
      description: "Light gray text on white background",
      element: "Text on pages 5-8",
      selector: "Pages 5-8",
      impact: "Users with low vision cannot read text",
      remediation: "Increase text color contrast to at least 4.5:1",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
      occurrences: 15,
    },
    {
      id: "pdf-issue-5",
      principle: "understandable",
      guideline: "3.1.1 Language of Page",
      wcagLevel: "A",
      severity: "serious",
      title: "PDF language not set",
      description: "Document language not specified in metadata",
      element: "Document properties",
      selector: "Metadata",
      impact: "Screen readers use wrong pronunciation",
      remediation: "Set document language in PDF properties",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
      occurrences: 1,
    },
    {
      id: "pdf-issue-6",
      principle: "perceivable",
      guideline: "1.3.2 Meaningful Sequence",
      wcagLevel: "A",
      severity: "moderate",
      title: "PDF reading order incorrect",
      description: "Columns read in wrong order",
      element: "Pages 10-12",
      selector: "Multi-column layout",
      impact: "Screen reader users hear content in wrong order",
      remediation: "Fix reading order using PDF accessibility tools",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html",
      occurrences: 3,
    },
    {
      id: "pdf-issue-7",
      principle: "robust",
      guideline: "4.1.2 Name, Role, Value",
      wcagLevel: "A",
      severity: "moderate",
      title: "PDF form fields not labeled",
      description: "Form fields missing accessible names",
      element: "Form on page 20",
      selector: "Page 20 form fields",
      impact: "Screen reader users cannot identify form fields",
      remediation: "Add tooltip text or labels to all form fields",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
      occurrences: 8,
    },
    {
      id: "pdf-issue-8",
      principle: "perceivable",
      guideline: "1.4.5 Images of Text",
      wcagLevel: "AA",
      severity: "minor",
      title: "PDF uses images of text",
      description: "Scanned pages contain non-selectable text",
      element: "Pages 15-18",
      selector: "Scanned images",
      impact: "Users cannot resize or reflow text",
      remediation: "Run OCR or recreate as accessible text",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html",
      occurrences: 4,
    },
  ],
};

export const mockDocxAuditResult: AuditResult = {
  fileName: "project-proposal.docx",
  documentType: "docx",
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues: 6,
    critical: 1,
    serious: 2,
    moderate: 2,
    minor: 1,
    passed: 12,
    failed: 6,
  },
  issues: [
    {
      id: "docx-issue-1",
      principle: "perceivable",
      guideline: "1.1.1 Non-text Content",
      wcagLevel: "A",
      severity: "critical",
      title: "Images without alt text",
      description: "Embedded images lack alternative text",
      element: "Images in sections 2.3 and 4.1",
      selector: "Images",
      impact: "Screen reader users cannot access image content",
      remediation: "Right-click image > Edit Alt Text",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html",
      occurrences: 7,
    },
    {
      id: "docx-issue-2",
      principle: "perceivable",
      guideline: "1.3.1 Info and Relationships",
      wcagLevel: "A",
      severity: "serious",
      title: "Manual formatting instead of styles",
      description: "Headings formatted manually with bold/larger font",
      element: "Section headings",
      selector: "Manual formatting",
      impact: "Screen readers cannot identify document structure",
      remediation: "Use built-in Heading 1, Heading 2 styles",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html",
      occurrences: 9,
    },
    {
      id: "docx-issue-3",
      principle: "understandable",
      guideline: "3.1.1 Language of Page",
      wcagLevel: "A",
      severity: "serious",
      title: "Document language not set",
      description: "Language not specified in document properties",
      element: "Document properties",
      selector: "Metadata",
      impact: "Screen readers may use wrong pronunciation",
      remediation: "Set language in File > Options > Language",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
      occurrences: 1,
    },
    {
      id: "docx-issue-4",
      principle: "perceivable",
      guideline: "1.4.3 Contrast (Minimum)",
      wcagLevel: "AA",
      severity: "moderate",
      title: "Low contrast text",
      description: "Light blue text on white background",
      element: "Hyperlinks and callout boxes",
      selector: "Colored text",
      impact: "Users with low vision cannot read text",
      remediation: "Use darker colors with 4.5:1 contrast ratio",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
      occurrences: 12,
    },
    {
      id: "docx-issue-5",
      principle: "robust",
      guideline: "4.1.2 Name, Role, Value",
      wcagLevel: "A",
      severity: "moderate",
      title: "Tables missing headers",
      description: "Data tables without header row designation",
      element: "Tables on pages 6, 9, 14",
      selector: "Tables",
      impact: "Screen reader users cannot understand table structure",
      remediation: "Select header row > Table Design > Header Row",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
      occurrences: 3,
    },
    {
      id: "docx-issue-6",
      principle: "operable",
      guideline: "2.4.6 Headings and Labels",
      wcagLevel: "AA",
      severity: "minor",
      title: "Non-descriptive hyperlinks",
      description: "Links with text 'Click here' or URLs",
      element: "Hyperlinks throughout document",
      selector: "Links",
      impact: "Screen reader users cannot understand link purpose",
      remediation: "Use descriptive link text instead of URLs",
      helpUrl: "https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html",
      occurrences: 8,
    },
  ],
  agent_trace: {
    steps: [
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        action: "fetch_webpage",
        tool: "mcp_fetch_server",
        input: { url: "https://example.com" },
        output: "Successfully fetched HTML content (15.2 KB)",
        reasoning: "Need to retrieve the webpage content for analysis"
      },
      {
        timestamp: new Date(Date.now() - 4500).toISOString(),
        action: "run_axe_analysis",
        tool: "mcp_axe_core_server",
        input: { html: "...", rules: ["wcag2aa"] },
        output: "Found 12 accessibility violations across 4 WCAG principles",
        reasoning: "Running automated accessibility testing with axe-core"
      },
      {
        timestamp: new Date(Date.now() - 3000).toISOString(),
        action: "consult_wcag_docs",
        tool: "mcp_wcag_docs_server",
        input: { criterion: "1.1.1" },
        output: "WCAG 1.1.1 requires text alternatives for non-text content",
        reasoning: "Looking up WCAG guidance for missing alt text issues"
      },
      {
        timestamp: new Date(Date.now() - 2000).toISOString(),
        action: "analyze_color_contrast",
        tool: "mcp_axe_core_server",
        input: { elements: ["#header", ".nav-item"] },
        output: "Found 8 color contrast violations (ratios between 2.1:1 and 3.8:1)",
        reasoning: "Performing detailed contrast analysis on flagged elements"
      },
      {
        timestamp: new Date(Date.now() - 500).toISOString(),
        action: "generate_recommendations",
        reasoning: "Synthesizing findings into actionable remediation guidance",
        output: "Generated 12 prioritized recommendations with WCAG references"
      }
    ],
    tools_used: [
      "mcp_fetch_server",
      "mcp_axe_core_server", 
      "mcp_wcag_docs_server"
    ],
    sources_consulted: [
      "WCAG 2.2 Guidelines",
      "axe-core rule definitions",
      "W3C Understanding docs"
    ],
    duration_ms: 5200
  }
};
