import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getAdminClient = () => {
    // É importante pegar as variáveis de ambiente dentro da função em Serverless Functions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // Tenta múltiplos nomes, priorizando os mais comuns
    let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!serviceKey) serviceKey = '';

    console.log('[ADMIN API] supabaseUrl:', !!supabaseUrl, ' serviceKey:', !!serviceKey);

    if (!supabaseUrl || !serviceKey) {
        return null;
    }
    return createClient(supabaseUrl, serviceKey);
};

// Verifica se o email passado é admin — via env var ou lista interna
const isAdminEmail = (email: string): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase();

    // Verifica via variável de ambiente (recomendado para produção)
    const envAdminEmail = process.env.ADMIN_EMAIL || '';
    if (envAdminEmail && lower === envAdminEmail.toLowerCase()) return true;

    // Lista de fallback — adicione seu email aqui se necessário
    const ADMIN_EMAILS = [
        'arthur@ribeirxlog.com',
        'arthur.ribeirx@gmail.com',
        'arthurribeiro2004@hotmail.com',
        'arthur_ribeiro09@outlook.com',
        'ribeirx',
    ];

    return ADMIN_EMAILS.some(e => lower.includes(e.toLowerCase()));
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
    // Permite diagnóstico via navegador adicionando ?debug=1 na URL
    if (req.url.includes('debug=1')) {
        return NextResponse.json({
            error: 'Modo Diagnóstico',
            debug: {
                SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                SERVICE_ROLE_KEY_ALT1: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
                SERVICE_ROLE_KEY_ALT2: !!process.env.SUPABASE_SERVICE_KEY,
                allSupabaseVars: Object.keys(process.env).filter(k => k.toLowerCase().includes('supa') || k.toLowerCase().includes('service'))
            }
        }, { status: 200 });
    }

    const adminEmail = req.headers.get('x-admin-email') || '';

    if (!isAdminEmail(adminEmail)) {
        console.warn('[ADMIN API] Acesso negado para:', adminEmail);
        return NextResponse.json({ error: `Não autorizado: ${adminEmail}` }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        const diag = {
            error: 'SERVICE_ROLE_KEY não configurada no servidor',
            debug: {
                SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                SERVICE_ROLE_KEY_ALT1: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
                SERVICE_ROLE_KEY_ALT2: !!process.env.SUPABASE_SERVICE_KEY,
                allSupabaseVars: Object.keys(process.env).filter(k => k.toLowerCase().includes('supa') || k.toLowerCase().includes('service'))
            }
        };
        return NextResponse.json(diag, { status: 500 });
    }

    const { data: users, error } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
    const adminEmail = req.headers.get('x-admin-email') || '';

    if (!isAdminEmail(adminEmail)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        return NextResponse.json({ error: 'SERVICE_ROLE_KEY não configurada no servidor' }, { status: 500 });
    }

    const { userId, updates } = await req.json();

    const { error } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
