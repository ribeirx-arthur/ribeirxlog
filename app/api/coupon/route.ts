import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Configuração do servidor incompleta' }, { status: 500 });
    }

    try {
        const { email, couponCode } = await req.json();

        if (!email || !couponCode) {
            return NextResponse.json({ error: 'E-mail e código do cupom são obrigatórios' }, { status: 400 });
        }

        // Buscar perfil para ver se já usou cupom
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (profileError || !profile) {
            console.error('[COUPON API] Perfil não encontrado:', profileError);
            return NextResponse.json({ error: 'Perfil não encontrado. Verifique se o e-mail está correto.' }, { status: 404 });
        }

        if (profile.config?.hasUsedCoupon) {
            return NextResponse.json({ error: 'Você já utilizou um cupom promocional nesta conta.' }, { status: 400 });
        }

        // Validar cupom — cupons válidos
        const validCoupons: Record<string, { plan: string, days: number }> = {
            'SAAS': { plan: 'piloto', days: 30 },
            'RIBEIRX30': { plan: 'piloto', days: 30 },
        };

        const coupon = validCoupons[couponCode.toUpperCase().trim()];

        if (!coupon) {
            return NextResponse.json({ error: 'Cupom inválido ou expirado' }, { status: 400 });
        }

        // Calcular data de expiração
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + coupon.days);

        // Atualizar perfil
        const updatedConfig = { ...(profile.config || {}), hasUsedCoupon: true };

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                plan_type: coupon.plan,
                payment_status: 'paid',
                trial_ends_at: expiresAt.toISOString(),
                config: updatedConfig
            })
            .eq('email', email.toLowerCase().trim());

        if (error) {
            console.error('[COUPON API] Erro no Supabase:', error);
            return NextResponse.json({ error: 'Erro ao aplicar cupom no banco de dados' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Cupom aplicado com sucesso! Plano ${coupon.plan} ativado por ${coupon.days} dias.`,
            plan: coupon.plan
        });

    } catch (error) {
        console.error('[COUPON API] Internal Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
