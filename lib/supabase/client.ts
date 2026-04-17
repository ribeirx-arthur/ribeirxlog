import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// No frontend (cliente), as chaves precisam estar no .env como NEXT_PUBLIC_
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SECURITY] Atenção: Chaves públicas do Supabase não encontradas. O cliente pode não funcionar corretamente.');
}

/**
 * Cliente Supabase padrão (Anônimo).
 * Seguro para uso em componentes do frontend e backend.
 * Sujeito às regras de Row Level Security (RLS) do Banco de Dados.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

/**
 * Cria um cliente Supabase autenticado com o token do Clerk.
 * Útil para queries que precisam do ID do usuário no servidor ou cliente.
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      global: {
        headers: { Authorization: `Bearer ${clerkToken}` },
      },
    }
  );
};
