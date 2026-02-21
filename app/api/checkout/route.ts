
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const asaasUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

    // Procura por qualquer variação comum do nome da chave
    const allKeys = Object.keys(process.env);
    const possibleNames = ['ASAAS_API_KEY', 'NEXT_PUBLIC_ASAAS_API_KEY', 'ASAS_API_KEY', 'ASAAS_KEY', 'ASAAS_TOKEN'];
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
                keys_found: allKeys.filter(k => k.includes('ASA') || k.includes('ASAS')),
                status: 'Missing environment variable in Project Settings'
            }
        }, { status: 500 });
    }

    // Log para depuração (sem expor a chave inteira)
    console.log(`[DEBUG-SERVER] Chave carregada. Tamanho: ${asaasKey.length}. Começa com $: ${asaasKey.startsWith('$')}`);

    try {
        const { email, name, planId, planName, amount } = await req.json();

        // 1. Busca ou cria cliente no Asaas
        const searchRes = await fetch(`${asaasUrl}/customers?email=${email}`, {
            headers: { 'access_token': asaasKey }
        });
        const searchData = await searchRes.json();

        let customerId: string;
        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
        } else {
            const createRes = await fetch(`${asaasUrl}/customers`, {
                method: 'POST',
                headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, notificationDisabled: false })
            });
            const newCustomer = await createRes.json();
            customerId = newCustomer.id;
        }

        // 2. Cria a cobrança
        const dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0];
        const paymentRes = await fetch(`${asaasUrl}/payments`, {
            method: 'POST',
            headers: { 'access_token': asaasKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: customerId,
                billingType: 'UNDEFINED',
                value: amount,
                dueDate,
                description: `Plano RibeirxLog: ${planName}`,
                externalReference: planId,
            })
        });
        const payment = await paymentRes.json();

        if (!payment.invoiceUrl) {
            console.error('Asaas payment error - Full response:', JSON.stringify(payment));
            console.error('Asaas payment error - Status:', paymentRes.status);
            return NextResponse.json({
                error: 'Falha ao gerar cobrança',
                details: payment
            }, { status: 500 });
        }

        return NextResponse.json({ checkoutUrl: payment.invoiceUrl });
    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
