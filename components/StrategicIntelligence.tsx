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
        <div className="space-y-8 animate-in fade-in duration-700 pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 rotate-3 transform transition-transform hover:rotate-0 cursor-default">
                        <Brain className="text-white w-9 h-9" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Inteligência</h2>
                        <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            RBX Log Digital Brain v1.3
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-full border border-slate-800">
                    {(['Tudo', 'Crítico', 'Financeiro', 'Frota', 'Performance'] as InsightCategory[]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                ${activeCategory === cat ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Summary Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Margem Líquida Média', value: `${stats.margin.toFixed(1)}%`, icon: Target, color: 'text-indigo-400' },
                    { label: 'Lucro Total em Dados', value: `R$ ${stats.profit.toLocaleString()}`, icon: BarChart3, color: 'text-emerald-400' },
                    { label: 'Saúde Geral da Frota', value: `${((vehicles.length - analytics.filter(i => i.category === 'Frota' && i.type === 'critical').length) / vehicles.length * 100).toFixed(0)}%`, icon: Truck, color: 'text-sky-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex items-center gap-5 group hover:border-slate-700 transition-colors">
                        <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center ${s.color}`}>
                            <s.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-white">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI FUTURE PROJECTION CHART */}
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                            <TrendingUp className="text-indigo-400 w-5 h-5" />
                            Projeção de Lucro (6 Meses + 3 Futuros)
                        </h3>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Análise de Tendência Estatística via IA</p>
                    </div>
                </div>
                
                <div className="h-[300px] w-full mt-4 flex items-center justify-center relative">
                    <NeuralProjectionSVG data={projections} />
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Realizado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projeção IA Futuro</span>
                    </div>
                </div>
            </div>

            {/* GEMINI AI ADVICE BUTTON/SECTION */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[3rem] flex flex-col items-center text-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center animate-bounce shadow-lg shadow-indigo-500/50">
                    <Brain className="text-white w-7 h-7" />
                </div>
                <div className="max-w-2xl">
                <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Inteligência Estratégica RBX (Groq)</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed mb-6">
                    "Arthur, agora uso o motor ultra-veloz da Groq para ler todas as suas métricas e te dar planos de ação em milissegundos. Clique abaixo para gerar sua análise estratégica."
                </p>
                    
                    {profile.plan_type === 'piloto' || profile.plan_type === 'none' ? (
                        <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 p-8 rounded-[2rem] flex flex-col items-center text-center gap-4">
                            <Lock className="w-10 h-10 text-amber-500 mb-2" />
                            <h4 className="text-lg font-black text-white uppercase italic">Consultoria Exclusiva PRO</h4>
                            <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-sm">
                                Arthur, o chat estratégico em tempo real é um recurso avançado. Faça o upgrade para o plano **PRO** para desbloquear o cérebro digital completo.
                            </p>
                            <button className="mt-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-amber-950 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20">
                                Liberar Acesso PRO
                            </button>
                        </div>
                    ) : (
                        <>
                            {loadingAI && chatMessages.length === 0 ? (
                                <div className="flex items-center gap-3 bg-white/5 px-8 py-4 rounded-full border border-white/10">
                                    <RefreshCcw className="w-4 h-4 text-indigo-400 animate-spin" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Cérebro Processando...</span>
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <button 
                                    onClick={() => handleSendMessage("Gere 3 dicas estratégicas para meu negócio agora.")}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    Gerar Insights Iniciais
                                </button>
                            ) : null}

                            {chatMessages.length > 0 && (
                                <div className="mt-8 flex flex-col gap-4 w-full text-left">
                                    <div className="max-h-[500px] overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm
                                                    ${msg.role === 'user' 
                                                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                        : 'bg-slate-900 border border-indigo-500/20 text-slate-300 rounded-tl-none border-l-4 border-l-indigo-600'}`}>
                                                    <p className="whitespace-pre-line">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                        {loadingAI && (
                                            <div className="flex justify-start">
                                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IA Analisando...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative mt-4 group">
                                        <input 
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Ex: Como abrir uma transportadora com meu lucro atual?"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-full py-5 px-8 pr-16 text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={() => handleSendMessage()}
                                            disabled={!input.trim() || loadingAI}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                                        >
                                            <ArrowUpRight className="text-white w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredInsights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`p-8 rounded-[3rem] border transition-all hover:translate-y-[-4px] flex flex-col gap-6 relative overflow-hidden group
              ${insight.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20' :
                                insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                                    insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        'bg-slate-900 border-slate-800'}`}
                    >
                        <div className={`absolute -right-8 -top-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 rotate-12 group-hover:opacity-[0.07]`}>
                            <insight.icon className="w-48 h-48" />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]
                    ${insight.type === 'critical' ? 'bg-rose-500 text-white' :
                                        insight.type === 'warning' ? 'bg-amber-500 text-amber-950' :
                                            insight.type === 'success' ? 'bg-emerald-500 text-emerald-950' :
                                                'bg-slate-800 text-slate-400'}`}>
                                    {insight.category}
                                </span>
                                {insight.trend && (
                                    <div className={`flex items-center gap-1 text-[9px] font-black ${insight.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {insight.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        TENDÊNCIA
                                    </div>
                                )}
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center 
                ${insight.type === 'critical' ? 'bg-rose-500/20 text-rose-500' :
                                    insight.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                                        insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' :
                                            'bg-slate-800 text-slate-400'}`}>
                                <insight.icon className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter">{insight.title}</h3>
                            <p className="text-slate-400 text-base font-medium leading-relaxed italic border-l-2 border-white/5 pl-6">
                                "{insight.message}"
                            </p>
                        </div>

                        {insight.action && (
                            <div className="relative z-10 bg-black/30 p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                                <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">O que fazer?</p>
                                    <p className="text-slate-300 text-sm font-bold leading-tight">{insight.action}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest relative z-10">
                            <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-indigo-500" />
                                <span>Processamento Analítico Real-time</span>
                            </div>
                            <ArrowUpRight className="w-4 h-4 opacity-30" />
                        </div>
                    </div>
                ))}

                {filteredInsights.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-[3rem]">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-700 mb-6">
                            <Filter className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-black text-white uppercase italic">Nenhum insight nesta categoria</h4>
                        <p className="text-slate-500 text-sm font-medium mt-2">Tente mudar o filtro ou adicione mais dados para análise!</p>
                    </div>
                )}
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-slate-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl hidden md:block opacity-20 rounded-full -mr-32 -mt-32" />
                <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">AI Roadmap</span>
                        <div className="w-full h-px bg-white/5 flex-1" />
                    </div>
                    <h4 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Próximos Passos do Seu Negócio</h4>
                    <p className="text-slate-400 text-lg italic leading-relaxed font-medium">
                        "Para v1.4 estamos preparando a integração com preços de combustíveis regionais e cálculo de depreciação automática da frota. Mantenha seus dados atualizados para a máxima precisão de análise."
                    </p>
                </div>
                <div className="flex flex-col items-center shrink-0 relative z-10">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-700 shadow-2xl">
                        <Target className="w-12 h-12 text-indigo-500" />
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status Operacional</span>
                        <span className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Otimizado
                        </span>
                    </div>
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
