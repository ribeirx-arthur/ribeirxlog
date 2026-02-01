import React, { useMemo } from 'react';
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
    Target
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile, MaintenanceRecord, Tire, Buggy } from '../types';
import { calculateTripFinance } from '../services/finance';

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

const StrategicIntelligence: React.FC<StrategicIntelligenceProps> = ({
    trips, vehicles, drivers, shippers, profile, maintenances, tires, buggies
}) => {
    const insights = useMemo(() => {
        const list: any[] = [];
        const now = new Date();

        // 1. CNH Validity Alerts
        drivers.forEach(d => {
            if (d.cnhValidity) {
                const [y, m, day] = d.cnhValidity.split('-').map(Number);
                const validityDate = new Date(y, m - 1, day);
                const diffDays = Math.ceil((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    list.push({
                        type: 'critical',
                        icon: ShieldAlert,
                        title: 'CNH Vencida!',
                        message: `A CNH do motorista ${d.name} venceu em ${validityDate.toLocaleDateString()}. Impedir novas viagens imediatamente.`,
                        category: 'Documentação'
                    });
                } else if (diffDays <= 30) {
                    list.push({
                        type: 'warning',
                        icon: Clock,
                        title: 'CNH Próxima do Vencimento',
                        message: `A CNH do motorista ${d.name} vence em ${diffDays} dias (${validityDate.toLocaleDateString()}).`,
                        category: 'Documentação'
                    });
                }
            }
        });

        // 2. Tire Health Alerts
        const criticalTires = tires.filter(t => t.status === 'critical' || t.status === 'warning');
        if (criticalTires.length > 0) {
            list.push({
                type: 'warning',
                icon: Disc,
                title: 'Manutenção de Pneus',
                message: `Existem ${criticalTires.length} pneus em estado crítico ou de atenção. Verifique o mapa de pneus.`,
                category: 'Frota'
            });
        }

        // 3. Maintenance Alerts
        vehicles.forEach(v => {
            const kmSinceLast = v.totalKmAccumulated - v.lastMaintenanceKm;
            const threshold = v.thresholds?.oilChangeKm || 10000;
            if (kmSinceLast >= threshold) {
                list.push({
                    type: 'critical',
                    icon: AlertTriangle,
                    title: 'Manutenção Vencida',
                    message: `O veículo ${v.plate} ultrapassou o limite de manutenção (${kmSinceLast.toLocaleString()} km rodados).`,
                    category: 'Frota'
                });
            }
        });

        // 4. Financial Insights (Best Routes/Rev)
        if (trips.length > 5) {
            const routeProfit = new Map<string, number>();
            trips.forEach(t => {
                const v = vehicles.find(veh => veh.id === t.vehicleId);
                const d = drivers.find(drv => drv.id === t.driverId);
                if (v && d) {
                    const fin = calculateTripFinance(t, v, d, profile);
                    const current = routeProfit.get(t.destination) || 0;
                    routeProfit.set(t.destination, current + fin.lucroLiquidoReal);
                }
            });

            const bestRoute = Array.from(routeProfit.entries()).sort((a, b) => b[1] - a[1])[0];
            if (bestRoute) {
                list.push({
                    type: 'success',
                    icon: TrendingUp,
                    title: 'Rota de Alta Performance',
                    message: `A rota para ${bestRoute[0]} gerou o maior lucro acumulado recentemente (R$ ${bestRoute[1].toLocaleString()}).`,
                    category: 'Performance'
                });
            }
        }

        // 5. Default welcoming insights if list is empty
        if (list.length === 0) {
            list.push({
                type: 'info',
                icon: Lightbulb,
                title: 'Tudo em dia!',
                message: 'Sua operação está rodando dentro dos conformes. Continue monitorando os lançamentos!',
                category: 'Geral'
            });
        }

        return list;
    }, [trips, vehicles, drivers, profile, tires, maintenances]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Brain className="text-white w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Inteligência Estratégica</h2>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Motor de Análise Ribeirx Log v2.5</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`p-6 rounded-[2.5rem] border transition-all hover:scale-[1.02] flex flex-col gap-4 relative overflow-hidden group
              ${insight.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5' :
                                insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                                    insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        'bg-slate-900 border-slate-800'}`}
                    >
                        <div className={`absolute -right-6 -top-6 opacity-5 group-hover:scale-150 transition-transform duration-1000 rotate-12`}>
                            <insight.icon className="w-32 h-32" />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest
                ${insight.type === 'critical' ? 'bg-rose-500 text-white' :
                                    insight.type === 'warning' ? 'bg-amber-500 text-amber-950' :
                                        insight.type === 'success' ? 'bg-emerald-500 text-emerald-950' :
                                            'bg-slate-800 text-slate-400'}`}>
                                {insight.category}
                            </span>
                            <insight.icon className={`w-5 h-5 
                ${insight.type === 'critical' ? 'text-rose-500' :
                                    insight.type === 'warning' ? 'text-amber-500' :
                                        insight.type === 'success' ? 'text-emerald-500' :
                                            'text-slate-400'}`}
                            />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">{insight.title}</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed italic pr-4">
                                "{insight.message}"
                            </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest relative z-10">
                            <span>Ribeirx AI Engine</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-between gap-8">
                <div className="flex-1">
                    <h4 className="text-white font-black text-xl mb-2">Como funcionam os Insights?</h4>
                    <p className="text-slate-400 text-sm italic leading-relaxed">
                        "Nosso motor analisa em tempo real os dados de viagens, manutenção e documentos. O objetivo é transformar números brutos em decisões inteligentes para aumentar sua margem e segurança."
                    </p>
                </div>
                <div className="hidden md:flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700 mb-2">
                        <Zap className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Processando...</span>
                </div>
            </div>
        </div>
    );
};

export default StrategicIntelligence;
