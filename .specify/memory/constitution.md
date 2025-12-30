<!--
Sync Impact Report:
- Version change: INITIAL → 1.0.0
- Project: ETU Accessibility App (Educational Testing Unit)
- Added principles: WCAG 2.2 AA & EAA & Swedish Law Compliance, Beads Task Tracking, Material Design 3 with Enhanced Accessibility
- Enhanced requirements: 18px+ fonts, large touch targets, Swedish Lag (2018:1937) compliance
- Templates requiring updates: ✅ All templates will align with these principles
- Follow-up TODOs: None
-->

# ETU Accessibility App Constitution

## Core Principles

### I. Legal Accessibility Compliance (NON-NEGOTIABLE)

**MUST adhere strictly to WCAG 2.2 Level AA, the European Accessibility Act (EAA), and Swedish Lag (2018:1937) om tillgänglighet till digital offentlig service.**

All audit logic, generated code, and user interface components MUST comply with:

**WCAG 2.2 Level AA Standards:**
- Perceivable: Text alternatives, captions, adaptable layouts, distinguishable content (minimum 4.5:1 contrast for normal text, 3:1 for large text)
- Operable: Full keyboard accessibility, sufficient time, seizure-safe content, navigable, multiple input modalities
- Understandable: Readable content, predictable behavior, comprehensive input assistance
- Robust: Maximum compatibility with current and future assistive technologies

**European Accessibility Act (EAA) Requirements:**
- Digital accessibility for products and services offered to EU consumers
- Built environment accessibility where applicable
- Accessible documentation and support materials
- Procurement compliance for public sector entities

**Swedish Lag (2018:1937):**
- Digital public services MUST be accessible
- Compliance statements MUST be published
- Monitoring and enforcement requirements
- Remediation procedures for non-compliance

**Rationale**: Triple-layer legal compliance (WCAG, EAA, Swedish law) is mandatory. Non-compliance exposes organizations to legal action, fines, and prevents citizens with disabilities from accessing essential services.

### II. Beads for Task Tracking and Memory (NON-NEGOTIABLE)

**MUST use Beads (`bd`) for all task tracking, issue management, and project memory instead of standard markdown task lists.**

All work items, issues, and tasks MUST be tracked using the Beads CLI:
- Use `bd` commands to create, update, and close issues
- NO markdown checklists or TODO comments for tracking work
- All task status updates MUST flow through Beads database
- Session memory and handoffs MUST reference Beads issue IDs

**Rationale**: Beads provides persistent, queryable task tracking that survives sessions and enables better collaboration and continuity across development cycles.

### III. Enhanced Accessibility UI Standards (NON-NEGOTIABLE)

**MUST use ShadCN 2.0 with Google Material Design 3 aesthetic, enhanced for maximum accessibility.**

All UI components MUST follow these enhanced accessibility requirements:

**Typography:**
- Base font size: 18px minimum (exceeds WCAG large text threshold)
- Headings: 24px minimum for h3, 32px for h2, 40px for h1
- Line height: 1.5 minimum for body text, 1.3 for headings
- Letter spacing: Optimized for readability
- Font family: System fonts with fallbacks, MUST support Swedish characters (å, ä, ö)

**Touch Targets:**
- Minimum size: 44x44px (exceeds WCAG 2.2 AA requirement of 24x24px)
- Spacing between targets: 8px minimum
- Mobile-first design with touch-optimized controls
- Large, clearly labeled buttons and interactive elements

**Material Design 3 Tokens:**
- Color: M3 color roles (primary, secondary, tertiary, error, surface variants) with WCAG AA contrast
- Elevation: M3 elevation levels with clear visual hierarchy
- Shape: M3 shape scale with rounded corners for touch-friendliness
- Motion: M3 motion patterns respecting prefers-reduced-motion
- State layers: Clear hover, focus, pressed, dragged states with 3px focus indicators

**Keyboard Accessibility:**
- Full keyboard navigation for all interactive elements
- Visible focus indicators (3px solid outline, minimum 3:1 contrast)
- Logical tab order matching visual flow
- Skip links for main content areas
- Keyboard shortcuts documented and configurable

**Component Library:**
- ShadCN 2.0 components as base
- All components customized with M3 tokens
- Enhanced for Swedish localization (sv-SE)
- Dark mode support with maintained contrast ratios

**Rationale**: Enhanced accessibility requirements (18px+ fonts, 44px touch targets) ensure the app is usable by people with visual impairments, motor disabilities, and older adults. ShadCN 2.0 with M3 provides modern, accessible components that can be consistently themed.

### IV. Test-Driven Development

Tests MUST be written before implementation for all features and bug fixes.

Follow the Red-Green-Refactor cycle:
1. Write failing test
2. Implement minimal code to pass
3. Refactor while maintaining passing tests

Focus areas requiring comprehensive testing:
- Accessibility: Automated accessibility testing with axe-core or similar
- Component rendering and interactions
- Keyboard navigation and focus management
- Screen reader announcements
- Color contrast validation
- Responsive behavior

**Rationale**: TDD ensures code quality, prevents regressions, and validates accessibility requirements are met from the start.

### V. TypeScript-First with Bun Runtime

All code MUST be written in TypeScript with strict type checking enabled.

Use Bun as the primary runtime and package manager:
- `bun` for all script execution
- `bun install` for dependency management
- `bun test` for running tests
- `bun run` for executing scripts

**Rationale**: TypeScript provides type safety and better developer experience. Bun offers superior performance and native TypeScript support.

### Technology Stack Requirements

### Required Technologies
- **Runtime**: Bun (latest stable)
- **UI Framework**: React 19+ with TypeScript
- **UI Component Library**: ShadCN 2.0 configured with Material Design 3 tokens and enhanced accessibility
- **Styling**: TailwindCSS with M3 design tokens and custom accessibility utilities
- **Task Management**: Beads CLI (`bd`) - MANDATORY for all issue tracking
- **Version Control**: Git with Beads integration
- **Accessibility Testing**: 
  - axe-core for automated WCAG validation
  - @testing-library with accessibility queries
  - Lighthouse accessibility audits
  - Manual keyboard and screen reader testing
- **Localization**: Swedish (sv-SE) as primary, English (en-US) as secondary
- **Spec-Driven Development**: GitHub Spec-kit for all development phases

### Prohibited Practices
- ❌ Using `npm` or `yarn` when `bun` is available
- ❌ Markdown task lists or TODO comments for project tracking (use `bd` CLI only)
- ❌ Custom color schemes that bypass M3 tokens or violate contrast requirements
- ❌ Shipping components without accessibility testing and WCAG validation
- ❌ Font sizes below 18px for body text
- ❌ Touch targets smaller than 44x44px
- ❌ Missing keyboard navigation or focus indicators
- ❌ Skipping Swedish Lag (2018:1937) compliance checks
- ❌ Non-compliant audit logic that misses WCAG 2.2 or EAA violations

## Development Workflow

### Code Review Requirements
All code changes MUST:
1. Pass automated accessibility testing (axe-core, Lighthouse)
2. Include manual keyboard navigation testing with documented results
3. Verify WCAG 2.2 AA compliance for affected components
4. Validate Swedish Lag (2018:1937) compliance for public-facing features
5. Use Beads issues for tracking - run `bd update <id> --status in_progress` when starting work
6. Follow M3 design token conventions with 18px+ fonts and 44px+ touch targets
7. Include TypeScript type definitions with strict mode enabled
8. Include Swedish localization for user-facing strings
9. Document keyboard shortcuts and screen reader behavior

### Quality Gates
Before merging to main:
- ✅ All tests passing (unit, integration, accessibility)
- ✅ No TypeScript errors with strict mode
- ✅ axe-core accessibility audit passing (0 violations)
- ✅ Lighthouse accessibility score ≥ 95
- ✅ Manual keyboard navigation verified
- ✅ Screen reader testing completed (NVDA/JAWS/VoiceOver)
- ✅ M3 token usage validated (18px+ fonts, 44px+ touch targets)
- ✅ Color contrast ratios verified (4.5:1 minimum for normal text)
- ✅ Beads issue updated: `bd close <id>` or `bd update <id> --status completed`
- ✅ Swedish localization complete for new features

### Beads Task Management Workflow
**MANDATORY**: All task tracking MUST use Beads CLI, not markdown checklists.

**Starting work:**
```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress
```

**During work:**
```bash
bd update <id> --comment "Progress update"
bd sync               # Sync with git regularly
```

**Completing work:**
```bash
bd close <id>         # Mark work complete
bd sync               # Final sync
git push              # Push changes
```

**Never:**
- ❌ Create markdown TODO lists
- ❌ Use comment-based task tracking
- ❌ Skip Beads updates for work items

### Documentation Requirements
- WCAG 2.2 AA compliance MUST be documented for each component
- EAA and Swedish Lag (2018:1937) compliance notes for public-facing features
- M3 token usage MUST be explained for custom components
- Enhanced accessibility features (18px+ fonts, 44px+ touch) MUST be highlighted
- Keyboard shortcuts and navigation patterns MUST be documented
- Screen reader behavior and ARIA usage MUST be described
- Swedish localization coverage MUST be tracked
- All work tracked via Beads issues with proper status updates

## Governance

This constitution supersedes all other development practices and guidelines. As Project Lead, all team members and AI agents MUST comply with these principles without exception.

### Spec-Driven Development with Beads
**MANDATORY**: Follow GitHub Spec-kit methodology for all development phases:
1. **/speckit.constitution** - Establish project principles (this document)
2. **/speckit.specify** - Create detailed specifications
3. **/speckit.plan** - Create implementation plans
4. **/speckit.tasks** - Generate actionable tasks (tracked in Beads)
5. **/speckit.implement** - Execute implementation

All tasks generated by spec-kit MUST be tracked using Beads CLI (`bd`), not markdown.

### Amendment Process
1. Propose amendment via Beads: `bd create --title "Constitution Amendment: <topic>"`
2. Document rationale, impact analysis, and legal implications
3. Review legal compliance (WCAG, EAA, Swedish law)
4. Approve via consensus with stakeholder sign-off
5. Update version following semantic versioning
6. Communicate changes: `bd update <id> --status completed`
7. Update dependent templates and documentation

### Compliance Review Schedule
- **Daily**: Beads task updates (`bd sync`)
- **Weekly**: Accessibility audit of new components (axe-core + manual)
- **Bi-weekly**: Full WCAG 2.2 AA compliance review
- **Monthly**: EAA and Swedish Lag (2018:1937) compliance assessment
- **Quarterly**: Third-party accessibility audit
- **Per PR**: Beads tracking validation, M3 token usage, 18px+ fonts, 44px+ touch targets

### Legal Accountability
All features MUST maintain compliance audit trail:
- WCAG 2.2 AA test results documented
- EAA compliance checklist completed
- Swedish Lag (2018:1937) requirements verified
- Accessibility statement kept current (required by Swedish law)
- Remediation procedures documented for reported issues

### Versioning Policy
- **MAJOR**: Breaking changes to core principles
- **MINOR**: New principles or expanded requirements
- **PATCH**: Clarifications or non-semantic updates

**Version**: 1.0.0 | **Ratified**: 2025-12-30 | **Last Amended**: 2025-12-30
