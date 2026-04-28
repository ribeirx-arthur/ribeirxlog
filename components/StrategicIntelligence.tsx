import React, { useMemo, useState } from 'react';
import {
    Brain,
    AlertTriangle,
    Lightbulb,
    TrendingUp,
    ShieldAlert,
    CheckCircle2,
    ArrowUpRight,
    Truck,
    Disc,
    Clock,
    Zap,
    Target,
    BarChart3,
    Users,
    Calendar,
    Wallet,
    ArrowDownRight,
    HelpCircle,
    Filter,
    RefreshCcw,
    Lock
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile, MaintenanceRecord, Tire, Buggy } from '../types';
import { calculateTripFinance } from '../services/finance';
import { generateMonthlyProjections } from '../services/aiAnalysis';
import { buildAIContext, serializeContextToPrompt } from '../services/buildAIContext';
// Recharts import removido em prol de um SVG Custom Failsafe (NeuralProjectionSVG)

interface StrategicIntelligenceProps {
    trips: Trip[];
    vehicles: Vehicle[];
    drivers: Driver[];
    shippers: Shipper[];
    profile: UserProfile;
    maintenances: MaintenanceRecord[];
    tires: Tire[];
    buggies: Buggy[];
}

type InsightCategory = 'Tudo' | 'Crítico' | 'Financeiro' | 'Frota' | 'Performance';

const StrategicIntelligence: React.FC<StrategicIntelligenceProps> = ({
    trips, vehicles, drivers, shippers, profile, maintenances, tires, buggies
}) => {
    const [activeCategory, setActiveCategory] = useState<InsightCategory>('Tudo');
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [mounted, setMounted] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (chatMessages.length > 0) {
            scrollToBottom();
        }
    }, [chatMessages, loadingAI]);

    const projections = useMemo(() => {
        const data = generateMonthlyProjections(trips, vehicles, drivers, profile);
        console.log("[DEBUG] Gráfico Projections Data:", data);
        return data;
    }, [trips, vehicles, drivers, profile]);

    const handleSendMessage = async (text?: string) => {
        const messageToSend = text || input;
        if (!messageToSend.trim()) return;

        const newMessages = [...chatMessages, { role: 'user', content: messageToSend } as const];
        setChatMessages(newMessages);
        setInput('');
        setLoadingAI(true);
        
        try {
            // Construir contexto no cliente para evitar payload 413
            const rawCtx = buildAIContext(trips, vehicles, drivers, profile);
            const contextString = serializeContextToPrompt(rawCtx);

            const resp = await fetch('/api/ai/advice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    contextString,
                    messages: newMessages 
                })
            });
            const data = await resp.json();
            if (data.advice) {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.advice }]);
            }
        } catch (e) {
            console.error("Erro Chat AI:", e);
        } finally {
            setLoadingAI(false);
        }
    };
    const analytics = useMemo(() => {
        const list: any[] = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const parseDate = (dStr: string) => {
            if (!dStr) return new Date(NaN);
            if (dStr.includes('/')) {
                const [d, m, y] = dStr.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
            return new Date(dStr);
        };

        // --- 1. FINANCIAL ANALYSIS ---
        const monthTrips = trips.filter(t => {
            const d = parseDate(t.departureDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthRevenue = monthTrips.reduce((acc, t) => acc + (t.freteSeco + t.diarias), 0);
        const monthProfit = monthTrips.reduce((acc, t) => {
            const v = vehicles.find(veh => veh.id === t.vehicleId);
            const d = drivers.find(drv => drv.id === t.driverId);
            if (v && d) {
                return acc + calculateTripFinance(t, v, d, profile).lucroLiquidoReal;
            }
            return acc;
        }, 0);

        // Break-even logic (mocking fixed costs as a % of revenue for simplicity, or 5k per vehicle)
        const estimatedFixedCosts = vehicles.length * 3500;
        const isProfitable = monthProfit > estimatedFixedCosts;
        const breakEvenProgress = Math.min(100, (monthProfit / estimatedFixedCosts) * 100);

        list.push({
            type: isProfitable ? 'success' : 'warning',
            icon: Wallet,
            title: 'Ponto de Equilíbrio (Break-even)',
            message: isProfitable
                ? `Sua operação já cobriu os custos fixos estimados (R$ ${estimatedFixedCosts.toLocaleString()}) e está gerando lucro líquido.`
                : `Faltam R$ ${(estimatedFixedCosts - monthProfit).toLocaleString()} em lucro para cobrir os custos fixos deste mês.`,
            action: "Otimize a ocupação dos veículos para acelerar o retorno.",
            category: 'Financeiro',
            trend: isProfitable ? 'up' : 'down'
        });

        // --- 2. PREDICTIVE MAINTENANCE ---
        vehicles.forEach(v => {
            const vehicleTrips = trips.filter(t => t.vehicleId === v.id);
            if (vehicleTrips.length > 2) {
                const last30DaysTrips = vehicleTrips.filter(t => {
                    const d = new Date(t.departureDate);
                    return (now.getTime() - d.getTime()) < (30 * 24 * 60 * 60 * 1000);
                });
                const avgKmPerMonth = last30DaysTrips.reduce((acc, t) => acc + t.totalKm, 0);
                const kmRemaining = (v.lastMaintenanceKm + (v.thresholds?.oilChangeKm || 10000)) - v.totalKmAccumulated;

                if (kmRemaining > 0 && avgKmPerMonth > 0) {
                    const monthsLeft = kmRemaining / avgKmPerMonth;
                    const daysLeft = Math.round(monthsLeft * 30);

                    if (daysLeft < 15) {
                        list.push({
                            type: 'critical',
                            icon: Clock,
                            title: `Predição: Veículo ${v.plate}`,
                            message: `Com base no ritmo atual (${avgKmPerMonth.toLocaleString()} KM/mês), a próxima troca de óleo deve ocorrer em aproximadamente ${daysLeft} dias.`,
                            action: "Agende a revisão na oficina para a próxima semana.",
                            category: 'Frota'
                        });
                    }
                }
            }
        });

        // --- 3. DRIVER PERFORMANCE (ROI) ---
        const driverStats = drivers.map(d => {
            const dTrips = trips.filter(t => t.driverId === d.id);
            const totalProfit = dTrips.reduce((acc, t) => {
                const v = vehicles.find(veh => veh.id === t.vehicleId);
                if (v) return acc + calculateTripFinance(t, v, d, profile).lucroLiquidoReal;
                return acc;
            }, 0);
            return { name: d.name, profit: totalProfit, tripsCount: dTrips.length };
        }).filter(d => d.tripsCount > 0).sort((a, b) => b.profit - a.profit);

        if (driverStats.length > 0) {
            const topDriver = driverStats[0];
            list.push({
                type: 'success',
                icon: Users,
                title: 'Líder de Eficiência',
                message: `${topDriver.name} é o motorista que mais gerou margem líquida recentemente (R$ ${topDriver.profit.toLocaleString()}).`,
                action: "Considere compartilhar as técnicas de condução deste motorista com a equipe.",
                category: 'Performance'
            });
        }

        // --- 4. TIRE LIFECYCLE ---
        const totalTires = tires.length;
        const criticalTiresCount = tires.filter(t => t.status === 'critical').length;
        if (criticalTiresCount / totalTires > 0.1) {
            list.push({
                type: 'critical',
                icon: Disc,
                title: 'Risco de Ativos: Pneus',
                message: `Mais de 10% da sua frota está com pneus em estado crítico. Isso aumenta o risco de paradas não planejadas e acidentes.`,
                action: "Execute a substituição imediata dos pneus marcados em vermelho.",
                category: 'Frota'
            });
        }

        // --- 5. CNH & DOCS (CRITICAL) ---
        drivers.forEach(d => {
            if (d.cnhValidity) {
                const [y, m, day] = d.cnhValidity.split('-').map(Number);
                const validityDate = new Date(y, m - 1, day);
                const diffDays = Math.ceil((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 15) {
                    list.push({
                        type: 'critical',
                        icon: ShieldAlert,
                        title: `Documentação: ${d.name}`,
                        message: diffDays < 0
                            ? `CNH vencida há ${Math.abs(diffDays)} dias. Risco jurídico altíssimo.`
                            : `CNH vence em ${diffDays} dias. Providencie a renovação urgente.`,
                        action: diffDays < 0 ? "BLOQUEAR MOTORISTA" : "Encaminhar para renovação.",
                        category: 'Crítico'
                    });
                }
            }
        });

        return list;
    }, [trips, vehicles, drivers, profile, tires, maintenances]);

    const filteredInsights = analytics.filter(i => activeCategory === 'Tudo' || i.category === activeCategory);

    const stats = useMemo(() => {
        const revenue = trips.reduce((acc, t) => acc + (t.freteSeco + t.diarias), 0);
        const profit = trips.reduce((acc, t) => {
            const v = vehicles.find(veh => veh.id === t.vehicleId);
            const d = drivers.find(drv => drv.id === t.driverId);
            if (v && d) return acc + calculateTripFinance(t, v, d, profile).lucroLiquidoReal;
            return acc;
        }, 0);
        return { revenue, profit, margin: (profit / revenue) * 100 || 0 };
    }, [trips, vehicles, drivers, profile]);

    if (!mounted) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-24">
            {/* Neural Intel Hero */}
            <div className="relative h-[400px] md:h-[28rem] rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-emerald-500/20 shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-slate-950 group-hover:scale-105 transition-transform duration-[30s] ease-linear" />
                <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/black-thread-light.png')] animate-pulse-slow" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-indigo-500 rounded-full animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Rede Neural Ativa</span>
                    </div>
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 md:gap-8">
                        <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                                    Núcleo <span className="text-indigo-500">Estratégico</span>
                                </h1>
                            <p className="text-slate-400 text-xs sm:text-lg font-medium max-w-2xl leading-relaxed">
                                Arthur, conectei sua frota ao motor de <span className="text-white">Inteligência Estratégica</span>. Cada dado agora é um plano de ação para escalar sua margem líquida.
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                             <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-2xl flex items-center gap-3 sm:gap-5 group hover:-translate-y-1 transition-transform">
                                <div className="p-3 sm:p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                    <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
                                </div>
                                <div>
                                    <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status do Núcleo</p>
                                    <p className="text-base sm:text-xl font-black text-emerald-500 uppercase">Sinapse Estável</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insight Filter Navigation */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-md border border-indigo-500/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-xl">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 p-1.5 bg-slate-950/50 rounded-3xl md:rounded-full border border-slate-800">
                    {(['Tudo', 'Crítico', 'Financeiro', 'Frota', 'Performance'] as InsightCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 md:px-10 py-3 md:py-4 rounded-xl md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 md:gap-4 flex-1 md:flex-none ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-[0_10px_30px_rgba(79,70,229,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-4 bg-slate-950/30 px-6 py-3 rounded-full border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    Última Sincronização: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Summary - Reimagined */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {[
                    { label: 'Eficiência Operacional', value: `${stats.margin.toFixed(1)}%`, icon: Target, color: 'text-indigo-400', trail: 'Margem Líquida' },
                    { label: 'Volume Sob Gestão', value: `R$ ${stats.profit.toLocaleString()}`, icon: Wallet, color: 'text-emerald-400', trail: 'Lucro Acumulado' },
                    { label: 'Integridade da Frota', value: `${((vehicles.length - analytics.filter(i => i.category === 'Frota' && i.type === 'critical').length) / vehicles.length * 100).toFixed(0)}%`, icon: Truck, color: 'text-sky-400', trail: 'Saúde dos Ativos' },
                ].map((s, i) => (
                    <div key={i} className="group relative bg-slate-900/40 backdrop-blur-sm border border-white/5 p-6 md:p-8 rounded-3xl md:rounded-[3rem] hover:bg-slate-800/60 transition-all duration-500">
                        <div className="flex items-start justify-between">
                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-950/50 border border-white/5 ${s.color} group-hover:scale-110 transition-transform`}>
                                <s.icon className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.trail}</span>
                        </div>
                        <div className="mt-6 md:mt-8 space-y-1">
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
                            <p className="text-3xl md:text-4xl font-black text-white tracking-tighter italic uppercase">{s.value}</p>
                        </div>
                        <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* AI PROJECTION CHART - More Minimalistic & Clean */}
                <div className="lg:col-span-12 bg-slate-900/40 backdrop-blur-xl border border-white/5 p-10 rounded-[3.5rem] group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[100px] -mr-48 -mt-48 rounded-full" />
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="text-indigo-400 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    Predição Algorítmica de Fluxo
                                </h3>
                                <p className="text-slate-500 text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase mt-2 ml-10 md:ml-14">Previsão de Séries Temporais / Projeção Neural</p>
                            </div>
                            <div className="flex items-center gap-6 px-8 py-4 bg-slate-950/50 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Consolidado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Probabilidade Futura</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="h-[400px] w-full mt-4 flex items-center justify-center relative">
                            <NeuralProjectionSVG data={projections} />
                        </div>
                    </div>
                </div>

                {/* AI CHAT INTERFACE - Premium & Clean */}
                <div className="lg:col-span-12 xl:col-span-12">
                   <div className="bg-slate-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
                      <div className="md:w-1/3 p-8 sm:p-12 bg-indigo-600/5 border-r border-white/5 flex flex-col justify-between">
                         <div className="space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 group-hover:rotate-6 transition-transform">
                                <Brain className="text-white w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">RBX Núcleo Intel</h4>
                                <p className="text-indigo-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Motor de Estratégia</p>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed italic border-l-2 border-indigo-500/30 pl-4 sm:pl-6">
                                "Eu analiso milhares de pontos de dados da sua operação para encontrar vazamentos de lucro e oportunidades de expansão em tempo real."
                            </p>
                         </div>
 
                         <div className="mt-8 sm:mt-12 space-y-4">
                            <div className="flex items-center gap-3 text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <ShieldAlert className="w-4 h-4 text-indigo-500" /> Protocolo: AES-256
                            </div>
                            <div className="flex items-center gap-3 text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <Zap className="w-4 h-4 text-emerald-500" /> Latência: 0.2ms
                            </div>
                         </div>
                       </div>

                      <div className="flex-1 p-10 flex flex-col min-h-[600px] bg-slate-950/40">
                        {profile.plan_type === 'piloto' || profile.plan_type === 'none' ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                                <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-2xl">
                                    <Lock className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h4>
                                    <p className="text-slate-500 text-sm font-bold max-w-sm">Este terminal de inteligência avançada requer credenciais do plano **PRO**.</p>
                                </div>
                                <button className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-amber-950 px-12 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-105 transition-all active:scale-95">
                                    Unlock Neural Core
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar mb-8">
                                    {chatMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 opacity-60">
                                            <Disc className="w-16 h-16 text-indigo-500/30 animate-spin-slow" />
                                            <div className="space-y-2">
                                                <h5 className="text-xl font-black text-slate-400 uppercase italic tracking-tighter">Terminal Inicializado</h5>
                                                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Aguardando comando de voz ou texto...</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 max-w-lg">
                                                {['Qual meu lucro projetado?', 'Como reduzir custo de frota?', 'Análise de performance CNH', 'Dicas para escala trimestral'].map(hint => (
                                                    <button 
                                                        key={hint}
                                                        onClick={() => handleSendMessage(hint)}
                                                        className="px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-600/10 hover:text-indigo-400 hover:border-indigo-500/30 transition-all text-left"
                                                    >
                                                        {hint}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                <div className={`max-w-[85%] p-8 rounded-[2.5rem] text-sm leading-relaxed shadow-lg
                                                    ${msg.role === 'user' 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-slate-900 border border-white/10 text-slate-300 rounded-tl-none border-l-4 border-l-indigo-600'}`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {msg.role === 'user' ? <Users className="w-4 h-4" /> : <Brain className="w-4 h-4 text-indigo-500" />}
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                            {msg.role === 'user' ? 'Arthur' : 'RBX Intelligence'}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-line text-base font-medium leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {loadingAI && (
                                        <div className="flex justify-start animate-in fade-in duration-300">
                                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex items-center gap-6">
                                                <div className="flex gap-2">
                                                    {[0, 0.2, 0.4].map(delay => (
                                                        <div key={delay} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">Analisando ecossistema...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                                    <div className="flex items-center gap-4 bg-slate-900 border border-white/10 rounded-[2.5rem] p-3 pl-8 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                                        <input 
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Pergunte qualquer coisa sobre sua operação..."
                                            className="flex-1 bg-transparent border-none py-4 text-base text-white placeholder-slate-600 focus:outline-none"
                                        />
                                        <button 
                                            onClick={() => handleSendMessage()}
                                            disabled={!input.trim() || loadingAI}
                                            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-90"
                                        >
                                            <ArrowUpRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                      </div>
                   </div>
                </div>

                {/* Insight Cards Overlaying Background Images */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {filteredInsights.map((insight, idx) => (
                        <div
                            key={idx}
                            className={`group p-10 rounded-[3.5rem] border transition-all duration-500 hover:translate-y-[-8px] flex flex-col gap-8 relative overflow-hidden shadow-xl
                    ${insight.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' :
                        insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' :
                            insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' :
                                'bg-slate-950/40 border-white/5 hover:bg-slate-950/60'}`}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg
                                        ${insight.type === 'critical' ? 'bg-rose-500/20 text-rose-500' :
                                            insight.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                                                insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                                    'bg-slate-800 text-slate-400'}`}>
                                        <insight.icon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className={`px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em]
                                            ${insight.type === 'critical' ? 'text-rose-500' :
                                                insight.type === 'warning' ? 'text-amber-500' :
                                                    insight.type === 'success' ? 'text-emerald-500' :
                                                        'text-slate-400'}`}>
                                            {insight.category}
                                        </span>
                                    </div>
                                </div>
                                {insight.trend && (
                                    <div className={`flex items-center gap-2 px-4 py-1.5 bg-slate-950 rounded-full text-[9px] font-black ${insight.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} border border-white/5`}>
                                        {insight.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        TENDÊNCIA DE MERCADO
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl sm:text-3xl font-black text-white leading-tight uppercase tracking-tighter italic group-hover:text-indigo-400 transition-colors">{insight.title}</h3>
                                <p className="text-slate-400 text-sm sm:text-lg font-medium leading-relaxed italic border-l-2 border-indigo-500/20 pl-4 sm:pl-8">
                                    "{insight.message}"
                                </p>
                            </div>

                            {insight.action && (
                                <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/5 flex items-start gap-4 sm:gap-5 shadow-2xl">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Plano de Ação</p>
                                        <p className="text-white text-sm sm:text-base font-bold leading-tight">{insight.action}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest relative z-10">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Sincronia: Processamento em Tempo Real</span>
                                </div>
                                <Disc className="w-4 h-4 animate-spin-slow opacity-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------------------------------------
// NEURAL CUSTOM SVG COMPONENT (Failsafe for Next.js SSR / Recharts Bug)
// ------------------------------------------------------------------------------------------------
const NeuralProjectionSVG = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const width = 800;
    const height = 300;
    const padding = 40;

    const maxVal = Math.max(...data.map(d => d.value), 100);
    const globalMax = maxVal * 1.05;

    const getX = (index: number) => (index * (width - 2 * padding)) / (data.length - 1) + padding;
    const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / globalMax;

    const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
    const areaPath = `M ${getX(0)},${height - padding} L ${points} L ${getX(data.length - 1)},${height - padding} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible drop-shadow-2xl">
            <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
                <filter id="glowLine"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            {/* Grid and Y-Axis */}
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
                const yPos = getY(globalMax * v);
                const val = globalMax * v;
                return (
                    <g key={i}>
                        <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
                        <text x={padding - 10} y={yPos + 3} fill="#475569" fontSize="10" fontWeight="900" textAnchor="end">
                            R$ {val >= 1000 ? (val / 1000).toFixed(1) + 'k' : Math.round(val)}
                        </text>
                    </g>
                );
            })}

            {/* Gradient Area */}
            <path d={areaPath} fill="url(#projGrad)" className="animate-in fade-in zoom-in-95 duration-1000" />
            
            {/* Segments for Solid (Actual) and Dashed (Future) */}
            {data.map((d, i) => {
                if (i === 0) return null;
                const prev = data[i - 1];
                return (
                    <line 
                        key={`line-${i}`}
                        x1={getX(i - 1)} y1={getY(prev.value)} 
                        x2={getX(i)} y2={getY(d.value)} 
                        stroke={d.isFuture ? "#f43f5e" : "#6366f1"} 
                        strokeWidth={d.isFuture ? "3" : "4"} 
                        strokeDasharray={d.isFuture ? "6,4" : "none"}
                        strokeLinecap="round" 
                        filter={d.isFuture ? "none" : "url(#glowLine)"} 
                    />
                );
            })}

            {/* X-Axis Labels */}
            {data.map((d, i) => (
                <text key={`label-${i}`} x={getX(i)} y={height - 10} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="900" className="uppercase">
                    {d.month}
                </text>
            ))}

            {/* Data Points */}
            {data.map((d, i) => (
                <circle 
                    key={`dot-${i}`} 
                    cx={getX(i)} 
                    cy={getY(d.value)} 
                    r={d.isFuture ? "4" : "5"} 
                    fill={d.isFuture ? "#f43f5e" : "#6366f1"} 
                    stroke="#0f172a" 
                    strokeWidth="2" 
                    className="hover:scale-150 transition-transform cursor-crosshair origin-center"
                    style={{ transformOrigin: `${getX(i)}px ${getY(d.value)}px` }}
                >
                    <title>{d.month}: R$ {Math.round(d.value).toLocaleString()}</title>
                </circle>
            ))}
        </svg>
    );
};

export default StrategicIntelligence;
