import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://smwzfhbazdjrkoywpnfd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_JUiuhrK4ObM-heG6gHlgSQ_3Q8UAQ6v";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration error: Missing URL or Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${clerkToken}` },
    },
  });
};
