import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://smwzfhbazdjrkoywpnfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JUiuhrK40bM-heG6ghlgSQ_3Q8UAQ6v';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing. Using fallback for build phase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
