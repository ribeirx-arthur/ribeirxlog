
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // PEGANDO VARIÁVEIS NA HORA (SEM BIBLIOTECAS EXTERNAS NO TOPO)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const asaasUrl = process.env.ASAAS_API_URL;
        const asaasKey = process.env.ASAAS_API_KEY;

        // SE NÃO TIVER CHAVE (MOMENTO DO BUILD), APENAS PASSA DIRETO
        if (!supabaseUrl || !supabaseKey || !asaasKey) {
            console.log('Build mode: Bypassing webhook logic.');
            return NextResponse.json({ status: 'build_ok' }, { status: 200 });
        }

        const body = await req.json();
        const { event, payment, subscription } = body;

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const planType = payment.externalReference || subscription?.externalReference;

            // 1. BUSCA E-MAIL DO CLIENTE NO ASAAS USANDO FETCH NATIVO
            const customerRes = await fetch(`${asaasUrl}/customers/${payment.customer}`, {
                method: 'GET',
                headers: { 'access_token': asaasKey }
            });
            const customer = await customerRes.json();
            const customerEmail = customer.email;

            if (customerEmail) {
                // 2. ATUALIZA O SUPABASE VIA API REST (SEM USAR A LIB DO SUPABASE)
                // Isso evita o erro de "supabaseUrl is required" no build
                const updateRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${customerEmail}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        payment_status: 'paid',
                        plan_type: planType,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateRes.ok) {
                    console.error('Erro ao atualizar via API REST do Supabase');
                } else {
                    console.log(`Upgrade de plano concluído: ${customerEmail} -> ${planType}`);
                }
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('Webhook Runtime Error:', error);
        return NextResponse.json({ received: true }, { status: 200 });
    }
}
