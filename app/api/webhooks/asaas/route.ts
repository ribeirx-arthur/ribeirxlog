
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializamos o Supabase com a Service Role para ignorar RLS no webhook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { event, payment } = body;

        console.log('Webhook Asaas recebido:', event, payment.id);

        // Eventos de sucesso de pagamento
        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const planType = payment.externalReference;
            const customerEmail = await getCustomerEmail(payment.customer);

            if (customerEmail) {
                // Atualizamos o perfil do usuário no Supabase
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        payment_status: 'paid',
                        plan_type: planType,
                        updated_at: new Date().toISOString()
                    })
                    .eq('email', customerEmail);

                if (error) {
                    console.error('Erro ao atualizar perfil via Webhook:', error);
                    return NextResponse.json({ error: 'Erro ao atualizar banco' }, { status: 500 });
                }

                console.log(`Upgrade de plano concluído para: ${customerEmail} -> ${planType}`);
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('Erro no processamento do Webhook Asaas:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

/**
 * Busca o e-mail do cliente no Asaas para associar ao perfil do Supabase
 */
async function getCustomerEmail(customerId: string): Promise<string | null> {
    try {
        const response = await fetch(`${process.env.ASAAS_API_URL}/customers/${customerId}`, {
            method: 'GET',
            headers: {
                'access_token': process.env.ASAAS_API_KEY!,
                'Content-Type': 'application/json'
            }
        });
        const customer = await response.json();
        return customer.email;
    } catch (error) {
        console.error('Erro ao buscar e-mail do cliente no Asaas:', error);
        return null;
    }
}
