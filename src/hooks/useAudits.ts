import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Audit, AuditInsert } from '@/types/database';

interface UseAuditsReturn {
  audits: Audit[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching audits for the current user
 * @param userId - User ID to fetch audits for (optional, defaults to current auth user)
 */
export function useAudits(userId?: string): UseAuditsReturn {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if userId not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAudits([]);
          return;
        }
        targetUserId = user.id;
      }

      const { data, error: fetchError } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAudits(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch audits');
      setError(error);
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchAudits();
  }, [fetchAudits]);

  return {
    audits,
    loading,
    error,
    refetch: fetchAudits,
  };
}

interface UseAuditReturn {
  audit: Audit | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching a single audit by ID
 * @param auditId - Audit ID to fetch
 */
export function useAudit(auditId: string | null): UseAuditReturn {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAudit = useCallback(async () => {
    if (!auditId) {
      setAudit(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single<Audit>();

      if (fetchError) throw fetchError;
      setAudit(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch audit');
      setError(error);
      console.error('Error fetching audit:', error);
    } finally {
      setLoading(false);
    }
  }, [auditId]);

  useEffect(() => {
    void fetchAudit();
  }, [fetchAudit]);

  return {
    audit,
    loading,
    error,
    refetch: fetchAudit,
  };
}

interface CreateAuditParams {
  userId: string;
  inputType: 'url' | 'html' | 'snippet' | 'document';
  inputValue: string;
  url?: string;
  sessionId?: string;
}

interface UseCreateAuditReturn {
  createAudit: (params: CreateAuditParams) => Promise<Audit>;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook for creating audits
 */
export function useCreateAudit(): UseCreateAuditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAudit = useCallback(async (params: CreateAuditParams): Promise<Audit> => {
    try {
      setLoading(true);
      setError(null);

      const auditData: AuditInsert = {
        user_id: params.userId,
        session_id: params.sessionId || null,
        input_type: params.inputType,
        input_value: params.inputValue,
        url: params.url || null,
        status: 'queued',
      };

      const { data, error: insertError } = await supabase
        .from('audits')
        .insert(auditData)
        .select<'*', Audit>()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create audit');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createAudit,
    loading,
    error,
  };
}
