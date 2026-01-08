# Magenta A11y-Style Testing Features + Multi-Template Reports

## Overview
Added comprehensive testing guidance to audit issue reports, inspired by [Magenta A11y](https://www.magentaa11y.com/) approach, combining WCAG success criteria with practical testing instructions. Includes **5 configurable report templates** for different use cases and regional standards.

## New Features Added

### 1. Enhanced Issue Type Definition
**File**: `src/types/audit.ts`

Added 6 new optional fields to the `Issue` interface:

```typescript
how_to_reproduce?: string;        // Step-by-step reproduction instructions
keyboard_testing?: string;         // Keyboard interaction testing (Tab, Enter, Space, etc.)
screen_reader_testing?: string;    // Screen reader testing (Name, Role, State, Value)
visual_testing?: string;           // Visual inspection testing (contrast, focus, spacing)
expected_behavior?: string;        // WCAG success criteria explanation
report_text?: string;              // Swedish ETU-formatted accessibility report
```

### 2. AI Agent Enhancement
**File**: `netlify/functions/gemini-agent.ts`

Updated the Gemini AI system prompt to generate these testing fields for each issue:

- **How to Reproduce**: Clear step-by-step instructions to trigger the accessibility issue
- **Keyboard Testing**: Specific keyboard interactions (Tab, Enter, Space, Arrow keys, Esc) with expected vs. actual behavior
- **Screen Reader Testing**: Name, Role, State, Value announcements for assistive technology users
- **Visual Testing**: Color contrast measurements, focus indicators, text spacing, zoom testing
- **Expected Behavior**: Explanation of relevant WCAG success criteria and correct implementation

### 3. UI Components
**File**: `src/components/SelectableIssueCard.tsx`

Added collapsible accordion sections using shadcn/ui components:

- **How to Reproduce** (PlayCircle icon) - Reproduction steps in expandable section
- **Keyboard Testing** (Keyboard icon) - Keyboard interaction guidance
- **Screen Reader Testing** (AudioLines icon) - Screen reader testing instructions
- **Visual Testing** (Eye icon) - Visual inspection steps
- **Expected Behavior** (CheckCircle2 icon) - WCAG requirements highlighted in accent color
- **Swedish Report** (FileText icon) - ETU-formatted accessibility report with copy button

Each section:
- Only appears if the field has content
- Uses accordion for progressive disclosure (testing sections)
- Includes relevant icons for quick identification
- Preserves whitespace formatting for multi-line instructions
- Styled consistently with the theme system

The Swedish Report section:
- Displays full ETU-formatted report in monospace font
- Has a "Kopiera" (Copy) button to copy report to clipboard
- Bordered section with muted background for visual distinction
- Positioned at the end before the "Learn More" link

### 4. Database Schema
**File**: `supabase/migrations/004_add_testing_fields.sql`

Added new columns to the `issues` table:
```sql
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS how_to_reproduce TEXT,
ADD COLUMN IF NOT EXISTS keyboard_testing TEXT,
ADD COLUMN IF NOT EXISTS screen_reader_testing TEXT,
ADD COLUMN IF NOT EXISTS visual_testing TEXT,
ADD COLUMN IF NOT EXISTS expected_behavior TEXT,
ADD COLUMN IF NOT EXISTS report_text TEXT;
```

### 5. Report Template System

**Settings**: `src/services/settingsService.ts`  
**UI**: `src/components/SettingsSheet.tsx`

Users can select from **5 professional report templates**:

1. **ETU Swedish** (`etu-swedish`)
   - Swedish-language professional reports
   - Follows ETU (Swedish accessibility) standards
   - Includes Webbriktlinjer links
   - Categories: Uppfattbar, Hanterbar, Begriplig, Robust
   - Target audience: Swedish government/public sector

2. **WCAG International** (`wcag-international`) - Default
   - English-language WCAG-focused reports
   - International standard format
   - Links to WCAG Understanding documents
   - Includes WCAG techniques
   - Target audience: International projects

3. **VPAT US** (`vpat-us`)
   - Section 508 compliance format
   - Includes conformance level (Supports/Partially Supports/Does Not Support)
   - Priority and effort estimates
   - US federal standards (Section 508, WCAG, EN 301 549)
   - Target audience: US government/federal contractors

4. **Simple** (`simple`)
   - Concise developer-focused format
   - Quick problem/solution structure
   - Before/After code examples
   - Minimal documentation overhead
   - Target audience: Developers, agile teams

5. **Technical** (`technical`)
   - Detailed technical documentation
   - DOM paths and CSS selectors
   - Assistive technology impact analysis
   - Testing checklists
   - ARIA authoring practices references
   - Target audience: Technical leads, QA teams

**Template Structure:**
- Each template has consistent sections but different formatting
- AI automatically generates report_text based on selected template
- Users can switch templates in Settings → Report Configuration
- Template preference saved per user

### 5. Data Layer Updates

**Response Parser** (`src/lib/audit/response-parser.ts`):
- Parses new fields from AI responses including report_text
- Maps field name variations (testing_instructions, test_instructions)

**Audit Service** (`src/lib/audit/audit-service.ts`):
- Saves new testing fields to database
- Includes fields in issue insert operations

**Database Types** (`src/types/database.ts`):
- Updated Row, Insert, and Update interfaces
- Added all 6 testing fields to type definitions

### 6. Mock Data
**File**: `src/data/mockAuditResults.ts`

Added example testing content to demonstrate the feature:

**Issue 1 - Missing Alt Text**:
- Reproduction: Navigate to homepage → Inspect logo → Notice missing alt
- Screen Reader Testing: Expected vs. actual announcements
- Visual Testing: Determine if decorative or informative
- Expected Behavior: WCAG 1.1.1 explanation

**Issue 2 - Color Contrast**:
- Reproduction: Inspect paragraph → Calculate contrast ratio
- Visual Testing: DevTools color picker, zoom to 200%, lighting conditions
- Expected Behavior: WCAG 1.4.3 requirements (4.5:1 for normal text)

**Issue 3 - Keyboard Accessibility**:
- Reproduction: Try keyboard navigation → Notice dropdown unreachable
- Keyboard Testing: Detailed Tab, Enter, Space, Arrow, Esc behaviors
- Screen Reader Testing: Name, Role, State expectations
- Visual Testing: Focus indicator visibility and contrast
- Expected Behavior: WCAG 2.1.1 keyboard operability requirements
- **Swedish Report**: Complete ETU-formatted report with:
  - Swedish title "2.1.1 Dropdown – Tangentbordsåtkomst saknas"
  - Category "Hanterbar (Operable)"
  - WCAG and EN 301 549 references
  - Swedish web guidelines (Webbriktlinjer) links
  - Detailed Swedish descriptions
  - Remediation with "Bör" and "Kan" recommendations
  - Code example with Swedish comments
  - Related requirements

## Testing Guide Examples

### Keyboard Testing Format
```
Test keyboard-only navigation:
• Tab: Focus should move visibly to the dropdown with clear focus indicator (3:1 contrast minimum)
• Enter or Space: Should open/close the dropdown menu
• Arrow keys (↑/↓): Should navigate through dropdown options when open
• Esc: Should close dropdown and return focus to trigger button

Current behavior:
• Tab: Dropdown is skipped (not in tab order)
• Enter/Space: No effect
```

### Screen Reader Testing Format
```
Test with NVDA/JAWS/VoiceOver:
• Name: Should announce 'Search, button'
• Role: Should identify as 'button'
• State: Should announce 'collapsed' when closed
• Current: Only announces 'button' without purpose
```

### Visual Testing Format
```
• Use browser DevTools color picker
• Test: Foreground #767676 on Background #FFFFFF
• Result: 3.2:1 ratio (fails WCAG AA 4.5:1 requirement)
• Zoom to 200% to verify text remains readable
```

## Benefits

1. **Developer-Friendly**: Step-by-step instructions make issues reproducible
2. **Testable**: Clear testing procedures for QA teams and developers
3. **Educational**: Links testing methods to WCAG success criteria
4. **Professional**: Matches industry-standard accessibility documentation (Magenta A11y)
5. **Comprehensive**: Covers keyboard, screen reader, and visual testing
6. **Actionable**: Provides both "what's wrong" and "how to verify the fix"
7. **Multi-Regional**: 5 templates for different standards (Swedish ETU, US VPAT, International WCAG)
8. **Flexible**: Simple template for quick dev work, Technical for detailed analysis
9. **Copy-Paste Ready**: One-click copy of complete formatted reports
10. **Configurable**: User can switch templates based on project needs

## Future Enhancements

- Mobile screen reader gestures (swipe, double-tap)
- Automated testing script suggestions
- Screen reader comparison tables (NVDA vs JAWS vs VoiceOver)
- Video examples of testing procedures
- Integration with browser accessibility testing tools

## Migration Status

✅ Types updated (6 fields including report_text)
✅ AI agent prompt enhanced with 5 template formats
✅ UI components implemented with copy functionality
✅ Settings UI with template selector dropdown
✅ Database migration created (includes report_text)
✅ Data layer updated
✅ Mock data with multiple template examples

⚠️ Database migration ready to run when Supabase is started

## Report Template Examples

### ETU Swedish (etu-swedish)

```markdown
## 2.1.1 Dropdown – Tangentbordsåtkomst saknas

Anpassad dropdown kan inte nås eller användas med enbart tangentbord

Kategori: Hanterbar (Operable)

WCAG-kriterium:
2.1.1 Keyboard (nivå A)
2.4.7 Focus Visible (nivå AA)

EN 301 549 Kapitel: 9.2.1.1, 9.2.4.7

Webbriktlinjer:
https://webbriktlinjer.se/riktlinjer/66-gor-alla-funktioner-tillgangliga-fran-tangentbordet/

WCAG-förklaring: All funktionalitet måste kunna användas med tangentbord...

### Beskrivning av felet
[Swedish description]

### Hur man återskapar felet
1. [Step 1 in Swedish]

### Konsekvens för användaren:
[Swedish user impact]

### Åtgärda:
Bör        [Primary recommendation]
Kan        [Secondary recommendation]

### Kodexempel
[Code]

### Relaterade krav
WCAG 2.1: 2.1.1 (Level A), EN 301 549: 9.2.1.1
```

### WCAG International (wcag-international)

```markdown
## 1.4.3 Insufficient color contrast

**WCAG Success Criterion:** 1.4.3 Contrast (Minimum) (Level AA)
**WCAG Principle:** Perceivable
**Severity:** Serious

### Issue Description
Text uses a color combination that produces only 3.2:1 contrast ratio...

### How to Reproduce
1. Navigate to main content
2. Inspect paragraph text
3. Calculate contrast ratio

### User Impact
Users with low vision will have difficulty reading...

### Remediation
**Required:** Increase contrast to 4.5:1
**Recommended:** Aim for 7:1 (AAA level)

### Code Example
\`\`\`css
/* Fixed */
.content p { color: #595959; }
\`\`\`

### WCAG Resources
- Understanding 1.4.3: [link]
- Techniques: G18, G145
```

### Simple (simple)

```markdown
## Images missing alt text

**Problem:** Images lack alternative text for screen readers
**WCAG:** 1.1.1 | **Severity:** Critical

### What's Wrong
5 images missing alt attributes. Screen readers only hear filename.

### How to Fix
Add descriptive alt attributes to informative images.

### Code
❌ **Before:**
\`\`\`html
<img src='logo.png'>
\`\`\`

✅ **After:**
\`\`\`html
<img src='logo.png' alt='Company logo'>
\`\`\`

**Reference:** [WCAG link]
```

### VPAT US (vpat-us)

```markdown
## 1.1.1 - Images Missing Alternative Text

**Section 508 Reference:** 1194.22(a)
**WCAG 2.1 Reference:** 1.1.1 Non-text Content (Level A)
**Conformance Level:** Does Not Support

### Issue Summary
Images lack text alternatives required by Section 508 and WCAG...

### Impact on Users with Disabilities
Screen reader users cannot perceive image content...

### Remediation Strategy
**Priority:** High
**Effort:** Small
**Action Items:**
- Add alt attributes to all images
- Test with JAWS and NVDA

### Applicable Standards
- Section 508: 1194.22(a)
- WCAG 2.1: 1.1.1 (Level A)
- EN 301 549: 9.1.1.1
```

### Technical (technical)

```markdown
## [WCAG 2.1.1] Keyboard Accessibility - Interactive Elements

### Technical Summary
**Violation:** Non-focusable interactive element (div with onclick)
**WCAG Criterion:** 2.1.1 Keyboard (Level A)
**Severity:** Critical
**Detection Method:** Heuristic

### Technical Analysis
Custom dropdown implemented as DIV element with onclick handler lacks tabindex...

### Affected Elements
- **Selector:** .dropdown
- **DOM Path:** body > main > nav > div.dropdown
- **Context:** Language selector component

### Assistive Technology Impact
- **Screen Readers:** Not announced as interactive control
- **Keyboard Navigation:** Element skipped in tab order
- **Voice Control:** Cannot be targeted by voice commands

### Implementation Requirements
**Must:**
- Convert to semantic button element
- Add ARIA attributes (role, aria-expanded, aria-haspopup)

### Testing Criteria
- [ ] Element receives keyboard focus via Tab
- [ ] Space/Enter triggers dropdown
- [ ] Screen reader announces role and state
```
