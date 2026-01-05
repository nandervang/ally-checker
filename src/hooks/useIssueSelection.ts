import { useState, useCallback, useEffect } from 'react';
import type { AuditIssue } from '@/data/mockAuditResults';

export interface IssueFilter {
  severity?: 'critical' | 'serious' | 'moderate' | 'minor';
  principle?: 'perceivable' | 'operable' | 'understandable' | 'robust';
  successCriterion?: string;
}

export function useIssueSelection(issues: AuditIssue[]) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    // Initialize from localStorage
    const savedSelection = localStorage.getItem('audit-selection');
    if (savedSelection) {
      try {
        const parsed = JSON.parse(savedSelection) as string[];
        return new Set(parsed);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [announcement, setAnnouncement] = useState('');

  // Persist selection to localStorage
  useEffect(() => {
    localStorage.setItem('audit-selection', JSON.stringify([...selected]));
  }, [selected]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      const wasSelected = next.has(id);
      
      if (wasSelected) {
        next.delete(id);
        setAnnouncement(`Issue deselected. ${String(next.size)} total selected.`);
      } else {
        next.add(id);
        setAnnouncement(`Issue selected. ${String(next.size)} total selected.`);
      }
      
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(issues.map(i => i.id));
    setSelected(allIds);
    setAnnouncement(`All ${String(allIds.size)} issues selected.`);
  }, [issues]);

  const clear = useCallback(() => {
    setSelected(new Set());
    setAnnouncement('All selections cleared.');
  }, []);

  const selectByFilter = useCallback((filter: IssueFilter) => {
    const filteredIds = issues
      .filter(issue => {
        if (filter.severity && issue.severity !== filter.severity) return false;
        if (filter.principle && issue.principle !== filter.principle) return false;
        // Note: AuditIssue doesn't have successCriterion, using guideline instead
        if (filter.successCriterion && issue.guideline !== filter.successCriterion) return false;
        return true;
      })
      .map(i => i.id);
    
    setSelected(new Set(filteredIds));
    setAnnouncement(`${String(filteredIds.length)} issues selected by filter.`);
  }, [issues]);

  const toggleRange = useCallback((startId: string, endId: string) => {
    const startIndex = issues.findIndex(i => i.id === startId);
    const endIndex = issues.findIndex(i => i.id === endId);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    const rangeIds = issues.slice(from, to + 1).map(i => i.id);
    
    setSelected(prev => {
      const next = new Set(prev);
      rangeIds.forEach(id => next.add(id));
      return next;
    });
    
    setAnnouncement(`${String(rangeIds.length)} issues selected in range.`);
  }, [issues]);

  return {
    selected,
    count: selected.size,
    toggle,
    selectAll,
    clear,
    selectByFilter,
    toggleRange,
    announcement,
    clearAnnouncement: () => { setAnnouncement(''); },
    isSelected: (id: string) => selected.has(id),
    selectedIssues: issues.filter(i => selected.has(i.id)),
  };
}
