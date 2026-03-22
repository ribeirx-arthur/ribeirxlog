/**
 * buildAIContext.ts
 *
 * Constrói um snapshot rico e pré-calculado de toda a operação do usuário.
 * Esse objeto é enviado para o Gemini antes de qualquer pergunta,
 * garantindo que a IA nunca "invente" dados que ela não tem.
 */

import { Trip, Vehicle, Driver, UserProfile, MonthlyExpenseItem } from '../types';
import { calculateTripFinance } from './finance';

export interface AIOperationContext {
    // ─── Identidade ───────────────────────────────────────────────
    ownerName: string;
    companyName: string;
    userRole: 'autonomo' | 'transportadora' | 'unknown';

    // ─── Frota ───────────────────────────────────────────────────
    totalVehicles: number;
    vehiclePlates: string[];

    // ─── Motoristas ──────────────────────────────────────────────
    totalDrivers: number;
    driverNames: string[];

    // ─── Financeiro Bruto (Todos os Tempos) ─────────────────────
    allTimeTrips: number;
    allTimeGrossRevenue: number;
    allTimeTotalProfit: number;
    allTimeAvgProfitPerTrip: number;
    allTimeProfitMarginPct: number;

    // ─── Financeiro Mensal (Últimos 30 dias) ─────────────────────
    last30dTrips: number;
    last30dGrossRevenue: number;
    last30dNetProfit: number;
    last30dAvgFreight: number;

    // ─── Top Rotas (por lucro líquido médio) ─────────────────────
    topRoutes: { route: string; tripsCount: number; avgProfit: number }[];

    // ─── Motoristas (ROI) ────────────────────────────────────────
    driverROI: { name: string; trips: number; totalProfit: number }[];

    // ─── Gastos Fixos & Dívidas (do Perfil) ─────────────────────
    totalMonthlyDebt: number;        // total das dívidas mensais
    totalMonthlyFixed: number;       // total dos gastos fixos
    monthlyExpenseBreakdown: { label: string; amount: number; category: string }[];
    personalMonthlyNeeds: number;    // pró-labore mínimo esperado
    savingsGoalPct: number;          // % do lucro que quer guardar

    // ─── Fluxo de Caixa Líquido Estimado ─────────────────────────
    estimatedMonthlyCashFlow: number; // last30dNetProfit - totalMonthly - personalNeeds
    isCashFlowPositive: boolean;

    // ─── Capacidade de Poupança ──────────────────────────────────
    estimatedMonthlySavings: number;  // quanto sobra para guardar por mês no ritmo atual
}

export function buildAIContext(
    trips: Trip[],
    vehicles: Vehicle[],
    drivers: Driver[],
    profile: UserProfile,
): AIOperationContext {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ─── Financial calculations ────────────────────────────────────────────────
    const calcProfit = (trip: Trip): number => {
        const v = vehicles.find(vh => vh.id === trip.vehicleId);
        const d = drivers.find(dr => dr.id === trip.driverId);
        if (!v || !d) return 0;
        return calculateTripFinance(trip, v, d, profile).lucroLiquidoReal;
    };

    // All-time
    const allTimeGross = trips.reduce((a, t) => a + t.freteSeco + t.diarias, 0);
    const allTimeProfit = trips.reduce((a, t) => a + calcProfit(t), 0);

    // Last 30 days
    const recentTrips = trips.filter(t => new Date(t.departureDate) >= thirtyDaysAgo);
    const last30dGross = recentTrips.reduce((a, t) => a + t.freteSeco + t.diarias, 0);
    const last30dProfit = recentTrips.reduce((a, t) => a + calcProfit(t), 0);
    const last30dAvgFreight = recentTrips.length > 0 ? last30dGross / recentTrips.length : 0;

    // ─── Top Routes ───────────────────────────────────────────────────────────
    const routeMap: Record<string, { profits: number[]; count: number }> = {};
    trips.forEach(t => {
        const key = `${t.origin || 'N/A'} → ${t.destination}`;
        if (!routeMap[key]) routeMap[key] = { profits: [], count: 0 };
        routeMap[key].profits.push(calcProfit(t));
        routeMap[key].count++;
    });
    const topRoutes = Object.entries(routeMap)
        .map(([route, { profits, count }]) => ({
            route,
            tripsCount: count,
            avgProfit: profits.reduce((a, b) => a + b, 0) / profits.length
        }))
        .sort((a, b) => b.avgProfit - a.avgProfit)
        .slice(0, 5);

    // ─── Driver ROI ───────────────────────────────────────────────────────────
    const driverROI = drivers.map(d => {
        const dTrips = trips.filter(t => t.driverId === d.id);
        const totalProfit = dTrips.reduce((a, t) => a + calcProfit(t), 0);
        return { name: d.name, trips: dTrips.length, totalProfit };
    }).filter(d => d.trips > 0).sort((a, b) => b.totalProfit - a.totalProfit);

    // ─── Monthly Expenses ─────────────────────────────────────────────────────
    const expenses: MonthlyExpenseItem[] = profile.monthlyExpenses || [];
    const totalDebt = expenses.filter(e => e.category === 'debt').reduce((a, e) => a + e.amount, 0);
    const totalFixed = expenses.filter(e => e.category !== 'debt').reduce((a, e) => a + e.amount, 0);
    const totalMonthly = totalDebt + totalFixed;
    const personalNeeds = profile.personalMonthlyNeeds || 0;
    const savingsGoalPct = profile.savingsGoalPct || 0;

    const cashFlow = last30dProfit - totalMonthly - personalNeeds;
    const estimatedSavings = cashFlow > 0 ? (last30dProfit * (savingsGoalPct / 100)) : 0;

    return {
        ownerName: profile.name || 'Usuário',
        companyName: profile.companyName || 'Empresa não informada',
        userRole: profile.config.userRole || 'unknown',

        totalVehicles: vehicles.length,
        vehiclePlates: vehicles.map(v => v.plate),

        totalDrivers: drivers.length,
        driverNames: drivers.map(d => d.name),

        allTimeTrips: trips.length,
        allTimeGrossRevenue: allTimeGross,
        allTimeTotalProfit: allTimeProfit,
        allTimeAvgProfitPerTrip: trips.length > 0 ? allTimeProfit / trips.length : 0,
        allTimeProfitMarginPct: allTimeGross > 0 ? (allTimeProfit / allTimeGross) * 100 : 0,

        last30dTrips: recentTrips.length,
        last30dGrossRevenue: last30dGross,
        last30dNetProfit: last30dProfit,
        last30dAvgFreight: last30dAvgFreight,

        topRoutes,
        driverROI,

        totalMonthlyDebt: totalDebt,
        totalMonthlyFixed: totalFixed,
        monthlyExpenseBreakdown: expenses.map(e => ({ label: e.label, amount: e.amount, category: e.category })),
        personalMonthlyNeeds: personalNeeds,
        savingsGoalPct,

        estimatedMonthlyCashFlow: cashFlow,
        isCashFlowPositive: cashFlow > 0,
        estimatedMonthlySavings: estimatedSavings,
    };
}

/**
 * Serializa o contexto em um texto estruturado para o prompt do Gemini.
 * O Gemini entende melhor dados em formato de texto do que JSON puro.
 */
export function serializeContextToPrompt(ctx: AIOperationContext): string {
    const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pct = (n: number) => `${n.toFixed(1)}%`;

    const routesText = ctx.topRoutes.length > 0
        ? ctx.topRoutes.map(r => `  • ${r.route} (${r.tripsCount} viagens, lucro médio ${fmt(r.avgProfit)})`).join('\n')
        : '  • Nenhuma rota registrada ainda';

    const driversText = ctx.driverROI.length > 0
        ? ctx.driverROI.map(d => `  • ${d.name}: ${d.trips} viagens, lucro gerado ${fmt(d.totalProfit)}`).join('\n')
        : '  • Nenhum motorista com viagens registradas';

    const expensesText = ctx.monthlyExpenseBreakdown.length > 0
        ? ctx.monthlyExpenseBreakdown.map(e => `  • ${e.label} [${e.category}]: ${fmt(e.amount)}`).join('\n')
        : '  • Nenhum gasto fixo cadastrado';

    return `
══════════════════════════════════════════
🚛 PERFIL COMPLETO DO OPERADOR
══════════════════════════════════════════

IDENTIDADE:
  Nome: ${ctx.ownerName}
  Empresa: ${ctx.companyName}
  Modo de Operação: ${ctx.userRole === 'autonomo' ? 'Autônomo (CPF)' : ctx.userRole === 'transportadora' ? 'Transportadora (CNPJ)' : 'Não informado'}

FROTA:
  Veículos: ${ctx.totalVehicles} (${ctx.vehiclePlates.join(', ') || 'nenhum cadastrado'})
  Motoristas: ${ctx.totalDrivers} (${ctx.driverNames.join(', ') || 'nenhum cadastrado'})

HISTÓRICO GERAL (TODOS OS TEMPOS):
  Total de Viagens: ${ctx.allTimeTrips}
  Faturamento Bruto Total: ${fmt(ctx.allTimeGrossRevenue)}
  Lucro Líquido Total: ${fmt(ctx.allTimeTotalProfit)}
  Margem Líquida Média: ${pct(ctx.allTimeProfitMarginPct)}
  Lucro Médio por Viagem: ${fmt(ctx.allTimeAvgProfitPerTrip)}

ÚLTIMOS 30 DIAS:
  Viagens: ${ctx.last30dTrips}
  Faturamento Bruto: ${fmt(ctx.last30dGrossRevenue)}
  Lucro Líquido: ${fmt(ctx.last30dNetProfit)}
  Frete Médio: ${fmt(ctx.last30dAvgFreight)}

TOP 5 ROTAS MAIS LUCRATIVAS:
${routesText}

PERFORMANCE POR MOTORISTA:
${driversText}

══════════════════════════════════════════
💸 SITUAÇÃO FINANCEIRA PESSOAL
══════════════════════════════════════════

COMPROMISSOS MENSAIS OBRIGATÓRIOS:
${expensesText}

  TOTAL DÍVIDAS (financiamentos, empréstimos): ${fmt(ctx.totalMonthlyDebt)}
  TOTAL FIXOS (aluguel, contador, etc.):       ${fmt(ctx.totalMonthlyFixed)}
  TOTAL MENSAL:                                ${fmt(ctx.totalMonthlyDebt + ctx.totalMonthlyFixed)}

NECESSIDADES PESSOAIS:
  Pró-labore mínimo necessário:  ${fmt(ctx.personalMonthlyNeeds)}
  Meta de poupança mensal:       ${pct(ctx.savingsGoalPct)} do lucro

FLUXO DE CAIXA LÍQUIDO ESTIMADO (30 dias):
  Lucro da operação:       ${fmt(ctx.last30dNetProfit)}
  (-) Compromissos fixos:  ${fmt(ctx.totalMonthlyDebt + ctx.totalMonthlyFixed)}
  (-) Pró-labore:          ${fmt(ctx.personalMonthlyNeeds)}
  = SALDO LIVRE:           ${fmt(ctx.estimatedMonthlyCashFlow)} ${ctx.isCashFlowPositive ? '✅' : '🔴 NEGATIVO'}
  
  Capacidade de poupança estimada: ${fmt(ctx.estimatedMonthlySavings)}/mês
══════════════════════════════════════════
`.trim();
}
