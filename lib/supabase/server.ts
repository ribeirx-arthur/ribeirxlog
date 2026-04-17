import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente Supabase com privilégios de Administrador (Service Role).
 * IMPORTANTE: Nunca use este cliente em componentes do lado do cliente (Client Components).
 * Este arquivo está protegido por 'server-only'.
 */
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any; 
  // Nota: Retornamos 'null' se as chaves faltarem para não quebrar o Build.
  // Em tempo de execução, se for nulo, as rotas que dependem dele tratarão o erro.
