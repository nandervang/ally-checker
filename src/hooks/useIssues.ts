import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Issue } from '@/types/database';

interface UseIssuesReturn {
  issues: Issue[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching issues for a specific audit
 * @param auditId - Audit ID to fetch issues for
 */
export function useIssues(auditId: string | null): UseIssuesReturn {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIssues = useCallback(async () => {
    // Check for null, undefined, empty string, or literal string "null"
    if (!auditId || auditId === 'null' || auditId === 'undefined') {
      setIssues([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('issues')
        .select('*')
        .eq('audit_id', auditId)
        .order('severity', { ascending: false }); // Critical first

      if (fetchError) throw fetchError;
      setIssues(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch issues');
      setError(error);
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    void fetchIssues();
  }, [fetchIssues]);

  return {
    issues,
    loading,
    error,
    refetch: fetchIssues,
  };
}

interface GroupedIssues {
  critical: Issue[];
  serious: Issue[];
  moderate: Issue[];
  minor: Issue[];
}

/**
 * React hook for fetching issues grouped by severity
 * @param auditId - Audit ID to fetch issues for
 */
export function useIssuesGroupedBySeverity(auditId: string | null): UseIssuesReturn & { grouped: GroupedIssues } {
  const { issues, loading, error, refetch } = useIssues(auditId);

  const grouped: GroupedIssues = {
    critical: issues.filter(i => i.severity === 'critical'),
    serious: issues.filter(i => i.severity === 'serious'),
    moderate: issues.filter(i => i.severity === 'moderate'),
    minor: issues.filter(i => i.severity === 'minor'),
  };

  return {
    issues,
    loading,
    error,
    refetch,
    grouped,
  };
}

interface GroupedByPrinciple {
  perceivable: Issue[];
  operable: Issue[];
  understandable: Issue[];
  robust: Issue[];
}

/**
 * React hook for fetching issues grouped by WCAG principle
 * @param auditId - Audit ID to fetch issues for
 */
export function useIssuesGroupedByPrinciple(auditId: string | null): UseIssuesReturn & { grouped: GroupedByPrinciple } {
  const { issues, loading, error, refetch } = useIssues(auditId);

  const grouped: GroupedByPrinciple = {
    perceivable: issues.filter(i => i.wcag_principle === 'perceivable'),
    operable: issues.filter(i => i.wcag_principle === 'operable'),
    understandable: issues.filter(i => i.wcag_principle === 'understandable'),
    robust: issues.filter(i => i.wcag_principle === 'robust'),
  };

  return {
    issues,
    loading,
    error,
    refetch,
    grouped,
  };
}
