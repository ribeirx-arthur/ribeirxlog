
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3';

interface AsaasCustomer {
    id: string;
    email: string;
    name: string;
}

export const asaasService = {
    /**
     * Busca ou cria um cliente no Asaas pelo e-mail
     */
    async getOrCreateCustomer(email: string, name: string): Promise<string> {
        try {
            // 1. Tenta buscar cliente existente
            const response = await fetch(`${ASAAS_API_URL}/customers?email=${email}`, {
                method: 'GET',
                headers: {
                    'access_token': ASAAS_API_KEY!,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.data && data.data.length > 0) {
                return data.data[0].id;
            }

            // 2. Se não existir, cria um novo
            const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'access_token': ASAAS_API_KEY!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    notificationDisabled: false
                })
            });

            const newCustomer = await createResponse.json();
            return newCustomer.id;
        } catch (error) {
            console.error('Erro ao gerenciar cliente Asaas:', error);
            throw error;
        }
    },

    /**
     * Cria uma cobrança e retorna o link de pagamento
     */
    async createSubscriptionLink(customerId: string, planType: string, amount: number): Promise<string> {
        try {
            const response = await fetch(`${ASAAS_API_URL}/payments`, {
                method: 'POST',
                headers: {
                    'access_token': ASAAS_API_KEY!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer: customerId,
                    billingType: 'UNDEFINED', // Permite que o cliente escolha entre Cartão, Boleto ou Pix
                    value: amount,
                    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().split('T')[0], // Amanhã
                    description: `Plano RibeirxLog: ${planType}`,
                    externalReference: planType, // Usamos isso no webhook para saber qual plano dar upgrade
                })
            });

            const payment = await response.json();
            return payment.invoiceUrl; // Link do Checkout do Asaas
        } catch (error) {
            console.error('Erro ao criar cobrança Asaas:', error);
            throw error;
        }
    }
};
