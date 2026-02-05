import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://smwzfhbazdjrkoywpnfd.supabase.co";
const supabaseAnonKey = "sb_publishable_JUiuhrK40bM-heG6ghlgSQ_3Q8UAQ6v";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration error');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
