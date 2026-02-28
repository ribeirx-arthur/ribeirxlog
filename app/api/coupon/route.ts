
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { email, couponCode } = await req.json();

        // Buscar perfil para ver se já usou cupom
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('config')
            .eq('email', email)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
        }

        if (profile.config?.hasUsedCoupon) {
            return NextResponse.json({ error: 'Você já utilizou um cupom promocional nesta conta.' }, { status: 400 });
        }

        // Validar cupom
        const validCoupons: Record<string, { plan: string, days: number }> = {
            'TVCAMINHONEIRO': { plan: 'piloto', days: 30 }
        };

        const coupon = validCoupons[couponCode.toUpperCase()];

        if (!coupon) {
            return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 });
        }

        // Calcular data de expiração (30 dias a partir de hoje)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + coupon.days);

        // Atualizar perfil: Marca como usado, define o plano e a nova data
        const updatedConfig = { ...profile.config, hasUsedCoupon: true };

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                plan_type: coupon.plan,
                payment_status: 'paid',
                trial_ends_at: expiresAt.toISOString(),
                config: updatedConfig
            })
            .eq('email', email);

        if (error) {
            console.error('[COUPON API] Erro no Supabase:', error);
            return NextResponse.json({ error: 'Erro ao aplicar cupom' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Cupom aplicado com sucesso! Plano ${coupon.plan} ativado por ${coupon.days} dias.`,
            plan: coupon.plan
        });

    } catch (error) {
        console.error('[COUPON API] Internal Error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
