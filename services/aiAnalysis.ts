import { Trip, Vehicle, Driver, UserProfile } from '../types';
import { calculateTripFinance } from './finance';

export interface AIInsight {
    id: string;
    title: string;
    message?: string;
    description?: string; // Usado por AIInsights.tsx
    type: 'success' | 'warning' | 'info' | 'positive' | 'negative' | 'neutral';
    date: string;
    impactScore?: number; // Usado por AIInsights.tsx
}

export interface GoldenTip {
    title: string;
    description: string;
    impact: string;
}


export interface MonthlyProjection {
    month: string;
    actual: number;
    projected: number;
    value?: number;
    isFuture: boolean;
}

export function generateAIInsights(
    trips: Trip[],
    vehicles?: Vehicle[],
    drivers?: Driver[],
    shippers?: any[],
    profile?: UserProfile
): AIInsight[] {
    const insights: AIInsight[] = [];
    const now = new Date();

    if (trips.length === 0) return [];

    // 1. Analisar tendência de lucro
    const recentTrips = trips.slice(0, 10);
    const avgProfit = recentTrips.reduce((acc, t) => acc + (t.freteSeco * 0.15), 0) / recentTrips.length;

    if (avgProfit > 2000) {
        insights.push({
            id: 'profit-good',
            title: 'Alta Rentabilidade',
            message: 'Suas últimas viagens estão com margem acima da média. Ótimo trabalho!',
            description: 'Suas últimas viagens estão com margem acima da média. Ótimo trabalho!',
            type: 'positive',
            impactScore: 85,
            date: now.toISOString()
        });
    }

    // 2. Alerta de Manutenção Preventiva (Simulado)
    const longDistanceTrips = trips.filter(t => (t.totalKm || 0) > 2000);
    if (longDistanceTrips.length > 3) {
        insights.push({
            id: 'maintenance-check',
            title: 'Revisão Necessária',
            message: 'Vários veículos rodaram distâncias longas recentemente. Verifique o óleo.',
            description: 'Vários veículos rodaram distâncias longas recentemente. Verifique o óleo.',
            type: 'negative',
            impactScore: 80,
            date: now.toISOString()
        });
    }

    return insights;
}

export function generateGoldenTips(
    trips: Trip[],
    vehicles?: Vehicle[],
    shippers?: any[]
): GoldenTip[] {
    return [
        {
            title: "Abastecimento Estratégico",
            description: "Negocie o diesel em postos parceiros fixos nas suas rotas mais comuns. Parcerias de fidelidade podem reduzir em até 5%.",
            impact: "Redução de 5% no custo",
        },
        {
            title: "Rotas Mais Lucrativas do Sudeste",
            description: "Rotas retornando para o Sudeste estão com frete 12% mais alto esta semana devido ao escoamento da safra.",
            impact: "Aumento de Receita",
        },
        {
            title: "Desgaste de Arrastos Menor",
            description: "Mantenha a calibragem dos pneus milimetricamente em dia. Pressões fora do ideal aumentam consumo em 3% e destroem lonas.",
            impact: "Redução de depreciação",
        }
    ];
}

export function generateMonthlyProjections(
    trips: Trip[],
    vehicles: Vehicle[],
    drivers: Driver[],
    profile: UserProfile
): MonthlyProjection[] {
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const projections: MonthlyProjection[] = [];

    // 1. Coletar dados históricos dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();
        
        const parseDate = (dStr: string) => {
            if (!dStr) return new Date(NaN);
            if (dStr.includes('/')) {
                const [d, m, y] = dStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dStr);
        };

        const monthTrips = trips.filter(t => {
            const rt = parseDate(t.receiptDate || t.departureDate);
            return rt.getMonth() === monthIndex && rt.getFullYear() === year;
        });

        let revenue = 0;
        monthTrips.forEach(t => {
            const v = vehicles.find(veh => veh.id === t.vehicleId) || { plate: 'GENERIC', type: 'Próprio', societySplitFactor: 100 } as any;
            const drv = drivers.find(d => d.id === t.driverId) || { name: 'Generic' } as any;
            const finance = calculateTripFinance(t, v, drv, profile);
            revenue += finance.lucroLiquidoReal;
        });

        projections.push({
            month: monthsNames[monthIndex],
            actual: isNaN(revenue) ? 0 : revenue,
            projected: isNaN(revenue) ? 0 : revenue,
            value: isNaN(revenue) ? 0 : revenue,
            isFuture: false
        });
    }

    // 2. Calcular Tendência
    const pastValues = projections.map(p => p.actual);
    const avgRevenue = pastValues.reduce((a, b) => a + b, 0) / (pastValues.length || 1);
    
    let growthFactor = 1.0;
    if (pastValues.length >= 3) {
        const last3 = pastValues.slice(-3);
        const diff1 = last3[2] - last3[1];
        const diff2 = last3[1] - last3[0];
        const avgDiff = (diff1 + diff2) / 2;
         growthFactor = 1 + (avgDiff / (avgRevenue || 1)) * 0.5;
         growthFactor = Math.max(0.85, Math.min(1.15, growthFactor));
    }

    // 3. Projetar próximos 3 meses
    let lastValue = projections[projections.length - 1].actual;
    if (lastValue > avgRevenue * 2 || lastValue < avgRevenue * 0.5) {
        lastValue = (lastValue + avgRevenue) / 2;
    }

    for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const projectedValue = lastValue * Math.pow(growthFactor, i);
        
        projections.push({
            month: monthsNames[d.getMonth()],
            actual: 0,
            projected: isNaN(projectedValue) ? 0 : Math.round(projectedValue),
            value: isNaN(projectedValue) ? 0 : Math.round(projectedValue),
            isFuture: true
        });
    }

    // 4. Fallback para Transfrotas Novas (Gráfico não ficar vazio)
    const hasHistory = projections.some(p => p.actual > 0);
    if (!hasHistory || trips.length === 0) {
        const dummyBase = 12000;
        const simulatedProjections: MonthlyProjection[] = [];
        
        // Simular 6 meses passados até o atual
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const factor = 1 + (Math.sin((5 - i) * 0.5) * 0.1); // Leve variação para não ser linha reta
            const val = dummyBase * (1 + (5 - i) * 0.05) * factor;
            simulatedProjections.push({
                month: monthsNames[d.getMonth()],
                actual: Math.round(val),
                projected: Math.round(val),
                value: Math.round(val),
                isFuture: false
            });
        }
        
        // Simular 3 meses futuros
        const lastVal = simulatedProjections[5].actual;
        for (let i = 1; i <= 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const val = lastVal * Math.pow(1.08, i);
            simulatedProjections.push({
                month: monthsNames[d.getMonth()],
                actual: 0,
                projected: Math.round(val),
                value: Math.round(val),
                isFuture: true
            });
        }
        return simulatedProjections;
    }

    return projections;
}

export async function getStrategicAIAdvice(
    trips: Trip[] = [],
    vehicles: Vehicle[] = [],
    drivers: Driver[] = [],
    profile: UserProfile = {} as UserProfile,
    apiKey: string,
    messages?: { role: string; content: string }[],
    contextString?: string
) {
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
        return "Configure sua GROQ_API_KEY no arquivo .env para receber conselhos estratégicos personalizados.";
    }

    try {
        const stats = contextString ? null : {
            totalTrips: trips.length,
            avgRevenue: trips.reduce((acc, t) => acc + t.freteSeco, 0) / (trips.length || 1),
            vehiclesCount: vehicles.length,
            driversCount: drivers.length,
            mainDestinations: Array.from(new Set(trips.map(t => t.destination))).slice(0, 5),
            totalLucro: trips.reduce((acc, t) => {
                const v = vehicles.find(veh => veh.id === t.vehicleId) || { plate: 'GENERIC', type: 'Próprio', societySplitFactor: 100 } as any;
                const d = drivers.find(drv => drv.id === t.driverId) || { name: 'Generic' } as any;
                return acc + calculateTripFinance(t, v, d, profile).lucroLiquidoReal;
            }, 0)
        };

        const contextPrompt = contextString || `Contexto da Frota do Usuário:
- Viagens: ${stats?.totalTrips}
- Faturamento Médio: R$ ${stats?.avgRevenue.toFixed(2)}
- Lucro Líquido Real: R$ ${stats?.totalLucro.toFixed(2)}
- Principais Destinos: ${stats?.mainDestinations.join(', ')}
- Veículos: ${stats?.vehiclesCount}

Se houver mensagens anteriores, continue a conversa com o usuário. Caso contrário, dê 3 dicas estratégicas rápidas baseadas no lucro e destinos acima. Seja breve e responda SEMPRE em Português-Brasil.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Você é um consultor sênior de logística e ERP. Responda em Português-Brasil. Seja estratégico e motivador.' },
                    { role: 'system', content: contextPrompt },
                    ...(messages || []).map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }))
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'Erro na API da Groq');
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error: any) {
        console.error('Groq API Error:', error);
        return `Tive um problema ao processar sua dúvida: ${error.message}. Verifique sua chave de API ou tente novamente em instantes.`;
    }
}
