# Issue Collection & Custom Report Feature Proposal

**Date**: 2026-01-05  
**Status**: PROPOSAL - Awaiting Approval  
**Priority**: P1 (Core Feature)  

## Executive Summary

Add ability for users to:
1. **Select specific issues** from audit results using checkboxes
2. **Generate custom reports** containing only selected issues
3. **Create accessibility statements** highlighting selected issues as known limitations
4. **Save issue collections** (Phase 2) for tracking remediation progress

**Why**: Users often want to focus on critical issues first, create reports for specific stakeholders, or track progress on a subset of problems.

---

## Current State Analysis

### ✅ What We Have
- Full audit reports with all issues (Word/HTML/Markdown/Text)
- Issue filtering by severity and WCAG principle (view only)
- Accessibility statement generator (ally-checker-9iv - planned)

### ❌ What's Missing
- **No way to select individual issues**
- **No custom report from subset of issues**
- **No saved collections or issue tracking**
- **No granular report control**

### 📊 Existing Beads Tasks
- **ally-checker-9iv**: Accessibility statement from full audit
- **ally-checker-ewb**: Statement template library
- **No tasks for issue selection/collection**

---

## Proposed User Flow

### Flow 1: Quick Full Report (Current - Keep Simple)
```
View Results → Click "Download Report" → Select Format → Download
```
**No changes to this flow**

### Flow 2: Custom Report (New Feature)
```
1. View audit results (all issues displayed)
2. Click "Create Custom Report" button
3. Selection mode activates:
   ├─ Checkboxes appear on each issue card
   ├─ Floating toolbar shows selection count
   ├─ Users select/deselect issues
   └─ Can filter + bulk select (e.g., "select all critical")
4. Click "Generate Report (7 selected)"
5. Choose format: Word / PDF / HTML / Markdown
6. Download custom report with only selected issues
```

### Flow 3: Accessibility Statement from Selected Issues (Phase 2)
```
1. Select critical issues that can't be fixed immediately
2. Click "Generate Statement"
3. Statement shows selected issues as "Known Limitations"
4. Export HTML statement for publishing
```

---

## UI/UX Design Proposal

### Visual Layout

#### **Default State** (Current)
```
┌─────────────────────────────────────────────────┐
│ Audit Results                                   │
│ [Filter ▼] [Sort ▼]  [Download Report ▼]       │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐        │
│ │ 🔴 Critical • WCAG 1.1.1            │        │
│ │ Images missing alt text             │        │
│ │ Perceivable • 3 occurrences         │        │
│ └─────────────────────────────────────┘        │
│ ┌─────────────────────────────────────┐        │
│ │ 🟠 Serious • WCAG 2.4.7             │        │
│ │ Focus indicators missing            │        │
│ └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

#### **Selection Mode** (New)
```
┌─────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     │
│ ┃ ✓ 3 issues selected                  ┃     │  ← Floating Toolbar
│ ┃ [Select All] [Clear] [Generate Report]┃     │    (sticky bottom)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     │
├─────────────────────────────────────────────────┤
│ Audit Results                                   │
│ [Filter ▼] [Sort ▼]  [✓ Selection Mode Active] │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐        │
│ │ [✓] 🔴 Critical • WCAG 1.1.1        │ ← Selected (border highlight)
│ │     Images missing alt text         │        │
│ │     Perceivable • 3 occurrences     │        │
│ └─────────────────────────────────────┘        │
│ ┌─────────────────────────────────────┐        │
│ │ [ ] 🟠 Serious • WCAG 2.4.7         │ ← Not selected
│ │     Focus indicators missing        │        │
│ └─────────────────────────────────────┘        │
│ ┌─────────────────────────────────────┐        │
│ │ [✓] 🟡 Moderate • WCAG 1.4.3        │ ← Selected
│ │     Insufficient color contrast     │        │
│ └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. **Toggle Button** (Top Toolbar)
```tsx
<Button 
  onClick={() => setSelectionMode(!selectionMode)}
  variant={selectionMode ? "default" : "outline"}
  aria-pressed={selectionMode}
>
  {selectionMode ? "✓ Selection Mode" : "Create Custom Report"}
</Button>
```

#### 2. **Issue Card with Checkbox**
```tsx
<div 
  role="checkbox"
  aria-checked={isSelected}
  aria-labelledby={`issue-${id}-title`}
  className={cn(
    "issue-card",
    isSelected && "border-3 border-primary bg-primary/5"
  )}
  onClick={handleToggle}
  onKeyDown={e => e.key === ' ' && handleToggle()}
  tabIndex={0}
>
  {selectionMode && (
    <Checkbox 
      checked={isSelected}
      className="absolute top-4 left-4"
      aria-hidden="true" // Visual only, parent handles semantics
    />
  )}
  {/* Issue content */}
</div>
```

#### 3. **Floating Selection Toolbar**
```tsx
{selectedCount > 0 && (
  <div 
    role="toolbar"
    aria-label="Bulk issue actions"
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
               bg-primary text-primary-foreground p-4 rounded-lg shadow-xl"
  >
    <div className="flex items-center gap-4">
      <span aria-live="polite">
        ✓ {selectedCount} issue{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <Button onClick={selectAll} variant="secondary">
        Select All ({totalIssues})
      </Button>
      <Button onClick={clearSelection} variant="ghost">
        Clear
      </Button>
      <Button onClick={generateCustomReport} variant="default" size="lg">
        Generate Report ({selectedCount})
      </Button>
    </div>
  </div>
)}
```

### Accessibility Features (WCAG 2.2 AA Compliant)

#### Visual Indicators
- ✅ **Checkbox** (primary indicator)
- ✅ **3px border** highlight (3:1 contrast ratio)
- ✅ **Background tint** (subtle, not sole indicator)
- ✅ **Checkmark icon** (redundant confirmation)

#### Keyboard Navigation
| Key | Action |
|-----|--------|
| `Space` | Toggle selection on focused card |
| `Arrow Up/Down` | Navigate between cards |
| `Shift + Arrow` | Select range (future) |
| `Ctrl/Cmd + A` | Select all visible |
| `Escape` | Exit selection mode, clear selection |
| `Enter` | On toolbar → Generate report |

#### Screen Reader Announcements
```tsx
// Live region for status updates
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>

// Example announcements:
- "Selection mode activated. Use spacebar to select issues."
- "Issue selected. 3 total selected."
- "All 15 issues selected."
- "Generating custom report with 7 selected issues."
```

#### ARIA Patterns
```tsx
// Issue list container
<div 
  role="group"
  aria-labelledby="issues-heading"
  aria-describedby="selection-instructions"
>
  {/* Issues */}
</div>

// Instructions (visually hidden)
<p id="selection-instructions" className="sr-only">
  Use spacebar to select issues. Use arrow keys to navigate.
</p>
```

---

## Mobile/Responsive Design

### Touch Targets
- **Minimum 48x48px** checkboxes on mobile (larger than desktop 44px)
- **Bottom sheet toolbar** (slides up from bottom)
- **Large "Generate Report" button** (full width on small screens)

### Mobile Flow Enhancements
```
1. Tap "Custom Report" → Selection mode
2. Large checkboxes appear (48x48px)
3. Bottom sheet shows: "3 selected [Generate]"
4. Tap "Generate" → Format picker bottom sheet
5. Download
```

### Alternative Mobile Interactions
- **Long press** card → Toggle selection
- **Swipe right** → Add to selection
- **Swipe left** → Remove from selection

---

## Technical Implementation

### Phase 1: MVP (Core Feature)

#### Database Changes
**Option 1: No DB Changes (Ephemeral Selection)**
- Selection state in React component state
- Cleared on page refresh
- Simpler implementation

**Option 2: Persist Selection (Recommended for UX)**
```sql
-- Add selection state to existing issues table
ALTER TABLE issues 
ADD COLUMN is_selected BOOLEAN DEFAULT false,
ADD COLUMN selected_at TIMESTAMPTZ;

-- Clear selection after 24 hours (background job)
```

#### Frontend Components
```typescript
// src/hooks/useIssueSelection.ts
export function useIssueSelection(issues: AuditIssue[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  
  const selectAll = () => setSelected(new Set(issues.map(i => i.id)));
  const clear = () => setSelected(new Set());
  const selectByFilter = (filter: IssueFilter) => {
    // Filter + select logic
  };
  
  return { selected, toggle, selectAll, clear, selectByFilter };
}

// src/components/IssueSelectionToolbar.tsx
export function IssueSelectionToolbar({
  count,
  totalIssues,
  onSelectAll,
  onClear,
  onGenerateReport
}: Props) {
  return (
    <div role="toolbar" className="selection-toolbar">
      {/* Toolbar content */}
    </div>
  );
}

// src/components/SelectableIssueCard.tsx
export function SelectableIssueCard({
  issue,
  isSelected,
  selectionMode,
  onToggle
}: Props) {
  return (
    <div 
      role="checkbox"
      aria-checked={isSelected}
      onClick={onToggle}
      className={cn(isSelected && "selected")}
    >
      {selectionMode && <Checkbox checked={isSelected} />}
      {/* Existing issue card content */}
    </div>
  );
}
```

#### Backend API
```typescript
// netlify/functions/generate-report.ts
interface CustomReportRequest {
  audit_id: string;
  issue_ids: string[];  // ← New: Selected issue IDs
  template: string;
  format: 'word' | 'html' | 'markdown' | 'text';
}

// Filter issues before generating report
const selectedIssues = auditData.issues.filter(i => 
  request.issue_ids.includes(i.id)
);
```

#### Report Metadata
```json
{
  "report_type": "custom",
  "total_audit_issues": 15,
  "selected_issues": 7,
  "selection_criteria": "User selection",
  "generated_at": "2026-01-05T14:30:00Z"
}
```

### Phase 2: Saved Collections (Future)

#### Database Schema
```sql
CREATE TABLE issue_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  audit_id UUID REFERENCES audits(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_issues (
  collection_id UUID REFERENCES issue_collections(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, issue_id)
);

-- RLS Policies
ALTER TABLE issue_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own collections"
  ON issue_collections FOR ALL
  USING (auth.uid() = user_id);
```

#### UI for Collections
```tsx
// Collection management dropdown
<DropdownMenu>
  <DropdownMenuTrigger>
    Saved Collections
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => loadCollection(id)}>
      Critical Items (5 issues)
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => loadCollection(id)}>
      Legal Compliance (12 issues)
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={saveCurrentSelection}>
      💾 Save current selection...
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Implementation Effort Estimation

### Phase 1: Core Custom Report (MVP)
**Estimated Time**: 2-3 days

| Task | Hours |
|------|-------|
| `useIssueSelection` hook | 2h |
| Selection mode toggle | 1h |
| Checkbox UI on cards | 3h |
| Floating toolbar | 2h |
| Keyboard navigation | 3h |
| Screen reader support | 2h |
| Backend report filtering | 2h |
| Testing | 3h |
| **Total** | **18h** |

### Phase 2: Saved Collections
**Estimated Time**: 2 days

| Task | Hours |
|------|-------|
| Database schema | 1h |
| Supabase queries | 2h |
| Collection CRUD UI | 4h |
| Load/save logic | 2h |
| RLS policies | 1h |
| Testing | 2h |
| **Total** | **12h** |

### Phase 3: Accessibility Statement from Selection
**Estimated Time**: 1 day

| Task | Hours |
|------|-------|
| Statement filter logic | 2h |
| Template updates | 2h |
| UI integration | 2h |
| Testing | 2h |
| **Total** | **8h** |

---

## New Beads Tasks to Create

### High Priority (P1) - Must Have

**Task 1: ally-checker-xxx**  
**Title**: Implement issue selection UI with checkboxes  
**Type**: task  
**Description**: Enable users to select individual issues from audit results for custom report generation  
**Estimate**: 18h

**Task 2: ally-checker-yyy**  
**Title**: Generate custom reports from selected issues subset  
**Type**: task  
**Description**: Allow users to generate reports containing only selected issues  
**Depends on**: Task 1  
**Estimate**: 8h

### Medium Priority (P2) - Should Have

**Task 3: ally-checker-zzz**  
**Title**: Implement issue collections and persistence  
**Type**: task  
**Description**: Enable users to save, name, and reuse issue collections  
**Estimate**: 12h

**Task 4: ally-checker-aaa**  
**Title**: Generate accessibility statements from selected issues  
**Type**: task  
**Description**: Create focused accessibility statements highlighting only selected issues  
**Depends on**: Task 1, ally-checker-9iv  
**Estimate**: 8h

### Low Priority (P3) - Nice to Have

**Task 5: ally-checker-bbb**  
**Title**: Add bulk selection by filter criteria  
**Type**: task  
**Description**: Enable bulk selection based on severity, principle, or criterion  
**Estimate**: 6h

---

## Success Metrics

### User Experience
- ✅ Users can select specific issues in < 5 seconds
- ✅ Custom report generation works within 3 clicks
- ✅ 100% keyboard accessible (all actions)
- ✅ Screen reader announces all state changes

### Technical
- ✅ Selection state persists during session
- ✅ No performance degradation with 500+ issues
- ✅ Custom reports maintain same quality as full reports
- ✅ WCAG 2.2 AA compliant (zero violations)

### Business
- ✅ 60%+ of users use custom report feature (analytics)
- ✅ Reduced report generation time by 40% (fewer issues = faster)
- ✅ Increased user satisfaction (feedback surveys)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Performance**: Selection UI slows down with 500+ issues | Virtualize issue list, lazy load checkboxes |
| **Accessibility**: Complex selection UI hard to navigate | Extensive keyboard testing, screen reader testing |
| **UX Confusion**: Users don't understand custom vs full report | Clear labels, tooltips, onboarding tour |
| **Data Loss**: Selection cleared accidentally | Auto-save to localStorage, confirmation dialog |
| **Report Quality**: Custom reports missing context | Add disclaimer, show total vs selected count |

---

## Alternative Approaches Considered

### Alternative 1: Filter-Based Reports
**Concept**: Generate reports from filter state (no checkboxes)  
**Pros**: Simpler UI, no selection state  
**Cons**: Less granular, can't mix criteria (e.g., "these 3 critical + that 1 moderate")  
**Decision**: ❌ Rejected - Too limiting

### Alternative 2: Tag-Based Collections
**Concept**: Tag issues instead of selecting (like Gmail labels)  
**Pros**: More flexible, persistent  
**Cons**: Steeper learning curve, overkill for MVP  
**Decision**: ❌ Rejected for MVP, consider for Phase 3

### Alternative 3: Drag & Drop Report Builder
**Concept**: Drag issues into report builder panel  
**Pros**: Visual, intuitive  
**Cons**: Accessibility nightmare, complex implementation  
**Decision**: ❌ Rejected - Not WCAG compliant

---

## Open Questions

1. **Should selection persist across page refreshes?**  
   **Recommendation**: Yes (localStorage for MVP, DB for Phase 2)

2. **Should we support multi-audit collections?**  
   **Recommendation**: No for MVP, yes for Phase 2

3. **What's the default report type: Full or Custom?**  
   **Recommendation**: Keep "Download Report" as full report default, make "Custom" explicit opt-in

4. **Should we allow editing custom reports after generation?**  
   **Recommendation**: No - generated reports are immutable. Re-select and regenerate.

5. **Mobile: Bottom toolbar or floating FAB?**  
   **Recommendation**: Bottom toolbar (Material Design 3 pattern, more accessible)

---

## Approval Checklist

**Please review and approve:**

- [ ] Overall approach (selection mode + floating toolbar)
- [ ] UI/UX design (checkboxes, visual indicators)
- [ ] Accessibility implementation (keyboard, screen reader)
- [ ] Mobile responsive design (bottom sheet, 48px targets)
- [ ] Phase 1 scope (ephemeral selection, custom reports)
- [ ] Phase 2 scope (saved collections)
- [ ] Estimated effort (18h MVP, 12h collections)
- [ ] New beads tasks (5 tasks created)

**Feedback/Changes Requested**:
_[Your notes here]_

**Approval**:  
- [ ] ✅ **APPROVED** - Proceed with implementation  
- [ ] 🔄 **REVISIONS NEEDED** - See feedback above  
- [ ] ❌ **REJECTED** - Do not implement  

---

## Next Steps After Approval

1. **Create 5 beads tasks** (ally-checker-xxx through ally-checker-bbb)
2. **Update spec.md** with new functional requirements (FR-XXX series)
3. **Update data-model.md** if persisting collections
4. **Implement Phase 1 MVP** (18h estimate)
5. **User testing** with accessibility advocates
6. **Iterate based on feedback**
7. **Phase 2: Collections** (if approved)

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-05  
**Author**: GitHub Copilot  
**Reviewed By**: _[Awaiting review]_
