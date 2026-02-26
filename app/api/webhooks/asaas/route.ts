import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos chaves do .env para conectar ao Supabase usando permissões master de serviço (Service Role)
// pois este é um webhook que não possui sessão de usuário ativo.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log('[ASAAS WEBHOOK] Evento recebido:', body.event);

        // O Asaas envia os eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED (no caso de boleto), etc.
        if (body.event === 'PAYMENT_RECEIVED' || body.event === 'PAYMENT_CONFIRMED') {
            const payment = body.payment;

            const customerId = payment.customer; // O Client ID gerado lá no Checkout
            const planIdToUpgrade = payment.externalReference; // Na api/checkout nós enviamos o planId nesse campo

            console.log(`[ASAAS WEBHOOK] Pagamento recebido para Cliente: ${customerId} | Plano-Alvo: ${planIdToUpgrade}`);

            if (planIdToUpgrade) {
                const asaasUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';
                const asaasKey = process.env.ASAAS_API_KEY || process.env.VITE_ASAAS_API_KEY || process.env.NEXT_PUBLIC_ASAAS_API_KEY || '';

                if (!asaasKey) {
                    console.error('[ASAAS WEBHOOK] Chave do Asaas não encontrada.');
                } else {
                    try {
                        // Busca o e-mail do cliente no Asaas
                        const res = await fetch(`${asaasUrl}/customers/${customerId}`, {
                            headers: { 'access_token': asaasKey }
                        });
                        const data = await res.json();

                        if (data && data.email) {
                            const customerEmail = data.email;

                            const { error } = await supabaseAdmin
                                .from('profiles')
                                .update({ plan_type: planIdToUpgrade, payment_status: 'paid' })
                                .eq('email', customerEmail);

                            if (error) {
                                console.error('[ASAAS WEBHOOK] Erro ao atualizar plano no Supabase:', error);
                            } else {
                                console.log(`[ASAAS WEBHOOK] Sucesso! Plano atualizado para: ${planIdToUpgrade} (Email: ${customerEmail})`);
                            }
                        } else {
                            console.error('[ASAAS WEBHOOK] Email do cliente não encontrado.', data);
                        }
                    } catch (err) {
                        console.error('[ASAAS WEBHOOK] Erro na comunicação com o Asaas:', err);
                    }
                }
            }

            return NextResponse.json({ received: true, success: true });
        }

        // Se o cliente atrasar (Overdue/Deleted), nós rebaixamos ele para FREE
        if (body.event === 'PAYMENT_OVERDUE' || body.event === 'PAYMENT_DELETED') {
            const payment = body.payment;
            console.log(`[ASAAS WEBHOOK] Pagamento Atrasado/Cancelado | Cliente: ${payment.customer}`);

            const asaasUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';
            const asaasKey = process.env.ASAAS_API_KEY || process.env.VITE_ASAAS_API_KEY || process.env.NEXT_PUBLIC_ASAAS_API_KEY || '';

            if (asaasKey) {
                try {
                    const res = await fetch(`${asaasUrl}/customers/${payment.customer}`, {
                        headers: { 'access_token': asaasKey }
                    });
                    const data = await res.json();

                    if (data && data.email) {
                        const { error } = await supabaseAdmin
                            .from('profiles')
                            .update({ plan_type: 'none', payment_status: 'unpaid' })
                            .eq('email', data.email);

                        if (error) {
                            console.error('[ASAAS WEBHOOK] Erro ao remover assinatura no Supabase:', error);
                        } else {
                            console.log(`[ASAAS WEBHOOK] Sucesso! Usuário downgrade para none/unpaid.`);
                        }
                    }
                } catch (err) {
                    console.error('[ASAAS WEBHOOK] Erro ao processar downgrade.', err);
                }
            }

            return NextResponse.json({ received: true, downgraded: true });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[ASAAS WEBHOOK ERROR]', error);
        return NextResponse.json({ error: 'Erro ao processar Webhook do Asaas' }, { status: 500 });
    }
}
