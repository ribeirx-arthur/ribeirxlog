import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Esta rota usa a SERVICE_ROLE_KEY no servidor — ignora RLS e nunca expira
const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) return null;
    return createClient(supabaseUrl, serviceKey);
};

const ADMIN_EMAILS = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthurribeiro2004@hotmail.com'
];

export async function GET(req: Request) {
    // Verifica o header de admin simples para evitar acesso aberto
    const adminEmail = req.headers.get('x-admin-email') || '';
    const isAdmin = ADMIN_EMAILS.some(e => adminEmail.toLowerCase().includes(e));

    if (!isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
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
    const isAdmin = ADMIN_EMAILS.some(e => adminEmail.toLowerCase().includes(e));

    if (!isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
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
