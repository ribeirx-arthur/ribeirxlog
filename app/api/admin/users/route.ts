import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Hardcoded fallback — mesma estratégia usada em services/supabase.ts
const SUPABASE_URL = 'https://smwzfhbazdjrkoywpnfd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3pmaGJhemRqcmtveXdwbmZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzODM1NiwiZXhwIjoyMDg1MjE0MzU2fQ.yeLyesYmXIsG-VKFra0D0wZ2TIZkJkmEVcmKXcBh4DM';

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return null;
    }
    return createClient(supabaseUrl, serviceKey);
};

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

    const adminClient = getAdminClient();
    if (!adminClient) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const { data: users, error } = await adminClient
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
