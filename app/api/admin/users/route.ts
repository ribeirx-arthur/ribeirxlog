import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Verifica se o email passado é admin
const isAdminEmail = (email: string): boolean => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();

    const ADMIN_EMAILS = [
        'arthur@ribeirxlog.com',
        'arthur.ribeirx@gmail.com',
        'arthur.riberix@gmail.com',
        'arthurpsantos01@gmail.com',
        'arthur_ribeiro09@outlook.com',
    ];

    return ADMIN_EMAILS.some(e => lower === e.toLowerCase()) ||
        lower.endsWith('@ribeirxlog.com');
};

export async function GET(req: Request) {
    const adminEmail = req.headers.get('x-admin-email') || '';

    if (!isAdminEmail(adminEmail)) {
        console.warn('[ADMIN API] Acesso negado para:', adminEmail);
        return NextResponse.json({ error: `Não autorizado: ${adminEmail}` }, { status: 403 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const { data: users, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ADMIN API] Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Headers anti-cache explícitos
    return NextResponse.json({ users }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
}

export async function PATCH(req: Request) {
    const adminEmail = req.headers.get('x-admin-email') || '';

    if (!isAdminEmail(adminEmail)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const { userId, updates } = await req.json();

    const { error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
