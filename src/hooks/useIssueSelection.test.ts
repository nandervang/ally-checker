import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useIssueSelection } from './useIssueSelection';
import type { AuditIssue } from '@/data/mockAuditResults';

const mockIssues: AuditIssue[] = [
  { id: '1', severity: 'critical', principle: 'perceivable', guideline: '1.1.1', title: 'Issue 1', description: 'Desc 1', location: 'Loc 1', type: 'error', element: 'img' },
  { id: '2', severity: 'serious', principle: 'operable', guideline: '2.1.1', title: 'Issue 2', description: 'Desc 2', location: 'Loc 2', type: 'error', element: 'button' },
  { id: '3', severity: 'minor', principle: 'understandable', guideline: '3.1.1', title: 'Issue 3', description: 'Desc 3', location: 'Loc 3', type: 'warning', element: 'p' },
];

describe('useIssueSelection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));
    expect(result.current.selected.size).toBe(0);
  });

  it('should load initial selection from localStorage', () => {
    localStorage.setItem('audit-selection', JSON.stringify(['1', '3']));
    const { result } = renderHook(() => useIssueSelection(mockIssues));
    expect(result.current.selected.has('1')).toBe(true);
    expect(result.current.selected.has('3')).toBe(true);
    expect(result.current.selected.size).toBe(2);
  });

  it('should toggle selection', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));

    act(() => {
      result.current.toggle('1');
    });
    expect(result.current.selected.has('1')).toBe(true);
    expect(result.current.announcement).toContain('Issue selected');

    act(() => {
      result.current.toggle('1');
    });
    expect(result.current.selected.has('1')).toBe(false);
    expect(result.current.announcement).toContain('Issue deselected');
  });

  it('should select all issues', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selected.size).toBe(3);
    expect(result.current.announcement).toContain('All 3 issues selected');
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));
    
    act(() => {
      result.current.selectAll();
      result.current.clear();
    });
    expect(result.current.selected.size).toBe(0);
    expect(result.current.announcement).toContain('cleared');
  });

  it('should filter by severity', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));

    act(() => {
      result.current.selectByFilter({ severity: 'critical' });
    });
    
    expect(result.current.selected.has('1')).toBe(true); // Critical
    expect(result.current.selected.has('2')).toBe(false); // Serious
    expect(result.current.announcement).toContain('1 issues selected by filter');
  });

  it('should filter by principle', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));

    act(() => {
      result.current.selectByFilter({ principle: 'operable' });
    });
    
    expect(result.current.selected.has('2')).toBe(true); // Operable
    expect(result.current.selected.has('1')).toBe(false);
  });

  it('should persist selection changes to localStorage', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));

    act(() => {
      result.current.toggle('2');
    });

    const stored = JSON.parse(localStorage.getItem('audit-selection') || '[]');
    expect(stored).toContain('2');
  });

  it('should handle range selection', () => {
    const { result } = renderHook(() => useIssueSelection(mockIssues));
    
    // Select 1 to 3 (indexes 0 to 2)
    act(() => {
      result.current.toggleRange('1', '3');
    });

    expect(result.current.selected.has('1')).toBe(true);
    expect(result.current.selected.has('2')).toBe(true);
    expect(result.current.selected.has('3')).toBe(true);
  });
});
