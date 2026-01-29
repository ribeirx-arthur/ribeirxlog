import { Trip, Vehicle, Driver, Shipper, UserProfile } from '../types';
import { calculateTripFinance } from './finance';

export interface AIInsight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'prediction';
    category: 'finance' | 'fleet' | 'driver' | 'market';
    title: string;
    description: string;
    impactScore: number; // 0-100
    action?: string;
}

export function generateAIInsights(
    trips: Trip[],
    vehicles: Vehicle[],
    drivers: Driver[],
    shippers: Shipper[],
    profile: UserProfile
): AIInsight[] {
    const insights: AIInsight[] = [];
    const now = new Date();

    // 1. ANÁLISE DE LUCRATIVIDADE DA FROTA (Detecção de Anomalias)
    vehicles.forEach(vehicle => {
        const vehicleTrips = trips.filter(t => t.vehicleId === vehicle.id);
        if (vehicleTrips.length === 0) return;

        const avgKmPerLiter = vehicleTrips.reduce((acc, t) => acc + (t.totalKm / (t.litersDiesel || 1)), 0) / vehicleTrips.length;

        // Regra: Caminhão fazendo menos que 2.0km/l é crítico
        if (avgKmPerLiter < 2.0 && vehicle.type === 'Próprio') {
            insights.push({
                id: `consumo-${vehicle.id}`,
                type: 'negative',
                category: 'fleet',
                title: `Consumo Crítico: ${vehicle.plate}`,
                description: `O veículo ${vehicle.name} está com média de ${avgKmPerLiter.toFixed(2)} km/l, abaixo do ideal.`,
                impactScore: 85,
                action: 'Agendar revisão de bicos injetores'
            });
        }
    });

    // 2. PREVISÃO DE FATURAMENTO (Desempenho Financeiro)
    const currentMonthTrips = trips.filter(t => {
        const d = new Date(t.receiptDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    if (currentMonthTrips.length > 0) {
        let currentRevenue = 0;
        currentMonthTrips.forEach(t => {
            const v = vehicles.find(veh => veh.id === t.vehicleId);
            const d = drivers.find(drv => drv.id === t.driverId);
            if (v && d) currentRevenue += calculateTripFinance(t, v, d, profile).lucroSociety;
        });

        const daysPassed = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const projectedRevenue = (currentRevenue / daysPassed) * daysInMonth;

        insights.push({
            id: 'revenue-forecast',
            type: 'prediction',
            category: 'finance',
            title: 'Projeção de Fechamento',
            description: `Ritmo atual indica faturamento de R$ ${projectedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} até o fim do mês.`,
            impactScore: 90,
            action: 'Ver relatório completo'
        });
    }

    // 3. ANÁLISE DE MOTORISTAS (Desempenho)
    drivers.forEach(driver => {
        const driverTrips = trips.filter(t => t.driverId === driver.id && t.status === 'Pago');
        if (driverTrips.length > 5) {
            const totalRevenue = driverTrips.reduce((acc, t) => acc + t.freteSeco, 0);

            // Regra: Motorista que faturou mais que 50k é Top Performer
            if (totalRevenue > 50000) {
                insights.push({
                    id: `top-driver-${driver.id}`,
                    type: 'positive',
                    category: 'driver',
                    title: `Top Performer: ${driver.name.split(' ')[0]}`,
                    description: `Gerou R$ ${totalRevenue.toLocaleString()} em fretes pagos. Considere bonificação.`,
                    impactScore: 75,
                    action: 'Enviar elogio'
                });
            }
        }
    });

    // Sort by impact
    return insights.sort((a, b) => b.impactScore - a.impactScore);
}

export interface GoldenTip {
    title: string;
    description: string;
    impact: string;
}

export function generateGoldenTips(
    trips: Trip[],
    vehicles: Vehicle[],
    shippers: Shipper[]
): GoldenTip[] {
    const tips: GoldenTip[] = [];

    // 1. DICA DE ROTA LUCRATIVA (Analisa R$/km)
    const routeProfits: Record<string, { revenue: number; km: number }> = {};
    trips.forEach(t => {
        if (!routeProfits[t.destination]) routeProfits[t.destination] = { revenue: 0, km: 0 };
        routeProfits[t.destination].revenue += t.freteSeco;
        routeProfits[t.destination].km += t.totalKm;
    });

    let bestRoute = '';
    let maxRpkm = 0;

    Object.entries(routeProfits).forEach(([dest, data]) => {
        const rpkm = data.revenue / (data.km || 1);
        if (rpkm > maxRpkm && data.km > 1000) { // Filtro de relevância
            maxRpkm = rpkm;
            bestRoute = dest;
        }
    });

    if (bestRoute) {
        tips.push({
            title: 'Rota de Ouro Identificada',
            description: `Destinos para **${bestRoute}** estão pagando R$ ${maxRpkm.toFixed(2)}/km, cerca de 15% acima da média da frota.`,
            impact: 'Aumente a alocação de veículos próprios nesta rota para maximizar a margem líquida.'
        });
    } else {
        tips.push({
            title: 'Otimização de Rotas',
            description: 'Ainda não há dados suficientes para identificar rotas "Outliers".',
            impact: 'Continue registrando viagens para desbloquear esta análise.'
        });
    }

    // 2. DICA DE FLUXO DE CAIXA (Shippers com maior prazo)
    const slowPayer = shippers.reduce((max, s) => s.avgPaymentDays > max.avgPaymentDays ? s : max, shippers[0]);
    if (slowPayer && slowPayer.avgPaymentDays > 30) {
        tips.push({
            title: 'Drenagem de Caixa Detectada',
            description: `O cliente **${slowPayer.name}** tem um ciclo de pagamentos médio de ${slowPayer.avgPaymentDays} dias.`,
            impact: 'Isso trava seu capital de giro. Sugerimos negociar um desconto de 2% para pagamentos em 15 dias.'
        });
    } else {
        tips.push({
            title: 'Saúde de Fluxo de Caixa',
            description: 'Seus prazos de recebimento estão saudáveis (< 30 dias).',
            impact: 'Mantenha a política atual de cobrança.'
        });
    }

    // 3. DICA DE MANUTENÇÃO (Veículo mais antigo/rodado)
    const oldestHighKmVehicle = vehicles
        .filter(v => v.totalKmAccumulated > 100000 || (new Date().getFullYear() - v.year) > 10)
        .sort((a, b) => b.totalKmAccumulated - a.totalKmAccumulated)[0];

    if (oldestHighKmVehicle) {
        tips.push({
            title: 'Momento de Renovação',
            description: `O veículo **${oldestHighKmVehicle.plate}** (${oldestHighKmVehicle.model}) já rodou ${oldestHighKmVehicle.totalKmAccumulated.toLocaleString()} km.`,
            impact: 'A curva de manutenção corretiva deve subir exponencialmente. Considere a venda e substituição nos próximos 6 meses.'
        });
    } else {
        tips.push({
            title: 'Frota Saudável',
            description: 'Sua frota está moderna e a depreciação controlada.',
            impact: 'Foque em manutenção preventiva para estender a vida útil e valor de revenda.'
        });
    }

    return tips;
}
