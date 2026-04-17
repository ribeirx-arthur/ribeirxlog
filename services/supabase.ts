import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Legacy Supabase Client
 * @deprecated Use import { supabase } from '@/lib/supabase/client' instead.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const createClerkSupabaseClient = (clerkToken: string) => {
  if (!supabaseUrl || !supabaseAnonKey) return null as any;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${clerkToken}` },
    },
  });
};
