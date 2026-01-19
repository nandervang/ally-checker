import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables - hardcoded fallback for development
// In production builds, these are replaced via build.ts
const supabaseUrl = 'https://fbfmrqmrioszslqwxwbw.supabase.co';
const supabaseAnonKey = 'sb_publishable_s9nEpcns2In-Y3z5jgHqGQ_oLA2mViK';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Config Error.");
  throw new Error(
    'Missing Supabase environment variables. Please check .env.local file.'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
