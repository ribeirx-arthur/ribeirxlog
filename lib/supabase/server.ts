import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // No servidor, falhar cedo se as chaves críticas estiverem faltando
  // Mas não exponha as chaves no erro
  console.error('[SECURITY] Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no ambiente.');
}

/**
 * Cliente Supabase com privilégios de Administrador (Service Role).
 * IMPORTANTE: Nunca use este cliente em componentes do lado do cliente (Client Components).
 * Este arquivo está protegido por 'server-only'.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
