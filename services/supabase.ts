import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://smwzfhbazdjrkoywpnfd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3pmaGJhemRqcmtveXdwbmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MzgzNTYsImV4cCI6MjA4NTIxNDM1Nn0.wDWqDeGAh2RrnAIu5MyRl79PVrexnYoFLM2_5qDdOyI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${clerkToken}` },
    },
  });
};
