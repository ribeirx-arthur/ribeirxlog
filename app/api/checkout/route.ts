
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const asaasUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

    // Procura por qualquer variação comum do nome da chave
    const allKeys = Object.keys(process.env);
    const possibleNames = [
        'ASAAS_API_KEY',
        'VITE_ASAAS_API_KEY',
        'NEXT_PUBLIC_ASAAS_API_KEY',
        'ASAS_API_KEY',
        'ASAAS_KEY',
        'ASAAS_TOKEN'
    ];
    const foundName = possibleNames.find(name => allKeys.includes(name));
    const asaasKey = foundName ? process.env[foundName] : null;

    // Log para depuração na Vercel
    console.log('[DEBUG-SERVER] Nomes de chaves encontrados que podem ser Asaas:', allKeys.filter(k => k.includes('ASA') || k.includes('ASAS')));
    console.log('[DEBUG-SERVER] Chave selecionada do campo:', foundName);

    if (!asaasKey) {
        console.error('[ERROR-SERVER] Nenhuma chave Asaas encontrada nas variáveis de ambiente.');
        return NextResponse.json({
            error: 'Asaas not configured',
            debug_info: {
                all_available_keys: allKeys,
                keys_found: allKeys.filter(k => k.includes('ASA') || k.includes('ASAS')),
                status: 'Missing environment variable in Project Settings'
            }
        }, { status: 500 });
    }

    // Log para depuração (sem expor a chave inteira)
    console.log(`[DEBUG-SERVER] Chave carregada. Tamanho: ${asaasKey.length}. Começa com $: ${asaasKey.startsWith('$')}`);

    try {
        const { email, name, planId, planName, amount, cpfCnpj } = await req.json();

        // 1. Busca ou cria cliente no Asaas
        const searchRes = await fetch(`${asaasUrl}/customers?email=${email}`, {
            headers: { 'access_token': asaasKey }
        });
        const searchData = await searchRes.json();

        let customerId: string;
        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;

            // 1.1 Atualiza o CPF se ele existir (para garantir que cadastros antigos incompletos funcionem)
            if (cpfCnpj) {
                await fetch(`${asaasUrl}/customers/${customerId}`, {
                    method: 'POST',
                    headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cpfCnpj })
                });
            }
        } else {
            const createRes = await fetch(`${asaasUrl}/customers`, {
                method: 'POST',
                headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    cpfCnpj,
                    notificationDisabled: false
                })
            });
            const newCustomer = await createRes.json();

            if (!newCustomer.id) {
                console.error('Erro ao criar cliente Asaas:', newCustomer);
                // Se o erro for CPF/CNPJ inválido, avisar o usuário
                const errorDesc = newCustomer.errors?.[0]?.description || 'Dados inválidos';
                return NextResponse.json({
                    error: `Falha ao cadastrar cliente: ${errorDesc}`,
                    details: newCustomer
                }, { status: 500 });
            }

            customerId = newCustomer.id;
        }

        // 2. Cria a Assinatura (Recorrente Mensal)
        const subscriptionRes = await fetch(`${asaasUrl}/subscriptions`, {
            method: 'POST',
            headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: customerId,
                billingType: 'UNDEFINED', // Permite Cartão, Boleto ou Pix
                value: amount,
                nextDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // 1 dia para o primeiro pagamento
                cycle: 'MONTHLY',
                description: `Assinatura RibeirxLog: ${planName}`,
                externalReference: planId,
            })
        });
        const subscription = await subscriptionRes.json();

        // Se der erro na assinatura (ex: falta de dados), tenta pegar o invoice do link de pagamento
        // No Asaas, ao criar uma assinatura, ele gera uma cobrança (payment) inicial
        if (!subscription.id) {
            console.error('Asaas subscription error:', JSON.stringify(subscription));
            return NextResponse.json({
                error: 'Falha ao gerar assinatura',
                details: subscription
            }, { status: 500 });
        }

        // Busca o link da FATURA dessa assinatura
        // No Asaas, para pegar o link de pagamento da primeira parcela da assinatura:
        const paymentsRes = await fetch(`${asaasUrl}/payments?subscription=${subscription.id}`, {
            headers: { 'access_token': asaasKey }
        });
        const paymentsData = await paymentsRes.json();
        const firstPayment = paymentsData.data?.[0];

        if (!firstPayment?.invoiceUrl) {
            return NextResponse.json({ checkoutUrl: `https://www.asaas.com/customer/subscription/view/${subscription.id}` });
        }

        return NextResponse.json({ checkoutUrl: firstPayment.invoiceUrl });
    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
