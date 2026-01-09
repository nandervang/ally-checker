import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserSession, UserSessionInsert } from '@/types/database';

interface UseSessionReturn {
  session: UserSession | null;
  loading: boolean;
  error: Error | null;
  createSession: (locale?: 'sv-SE' | 'en-US') => Promise<UserSession>;
  updateSession: (preferences: Record<string, unknown>) => Promise<void>;
}

/**
 * React hook for managing user sessions
 * Handles session creation, retrieval, and persistence
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check localStorage for existing session ID
        const sessionId = localStorage.getItem('ally_checker_session_id');

        if (sessionId) {
          // Fetch session from database
          const { data, error: fetchError } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('id', sessionId)
            .single<UserSession>();

          if (fetchError) {
            console.error('Error fetching session:', fetchError);
            // Clear invalid session ID
            localStorage.removeItem('ally_checker_session_id');
          } else {
            setSession(data);
            
            // Update last_active_at
            await supabase
              .from('user_sessions')
              .update({ last_active_at: new Date().toISOString() })
              .eq('id', sessionId);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, []);

  const createSession = useCallback(async (locale: 'sv-SE' | 'en-US' = 'sv-SE'): Promise<UserSession> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user (if authenticated)
      const { data: { user } } = await supabase.auth.getUser();

      const sessionData: UserSessionInsert = {
        supabase_user_id: user?.id || null,
        locale,
        preferences: {},
      };

      const { data, error: insertError } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select<'*', UserSession>()
        .single();

      if (insertError) throw insertError;

      // Store session ID in localStorage
      localStorage.setItem('ally_checker_session_id', data.id);
      setSession(data);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create session');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (preferences: Record<string, unknown>): Promise<void> => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('user_sessions')
        .update({ preferences: preferences as never })
        .eq('id', session.id)
        .select<'*', UserSession>()
        .single();

      if (updateError) throw updateError;
      setSession(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update session');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    createSession,
    updateSession,
  };
}
