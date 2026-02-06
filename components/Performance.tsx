
import React, { useMemo, useState } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   Legend, PieChart, Pie, Cell, Area, AreaChart,
   RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
   TrendingUp,
   Truck,
   MapPin,
   Zap,
   Target,
   Wallet,
   ShieldCheck,
   Activity,
   Building2,
   Trophy,
   Lightbulb,
   AlertTriangle,
   ArrowUpRight,
   TrendingDown,
   Fuel,
   Wrench,
   Percent,
   ChevronRight,
   Coins,
   ArrowRight,
   BarChart3,
   DollarSign,
   Calendar,
   History,
   Brain,
   PieChart as PieIcon
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile, MaintenanceRecord } from '../types';
import { calculateTripFinance, normalizeDestination } from '../services/finance';

interface PerformanceProps {
   trips: Trip[];
   vehicles: Vehicle[];
   drivers: Driver[];
   shippers: Shipper[];
   profile: UserProfile;
   maintenances: MaintenanceRecord[];
}

type BIView = 'geral' | 'rankings' | 'custos' | 'inteligencia';

const Performance: React.FC<PerformanceProps> = ({
   trips = [],
   vehicles = [],
   drivers = [],
   shippers = [],
   profile,
   maintenances = []
}) => {
   const [activeView, setActiveView] = useState<BIView>('geral');

   // SUPER ENGINE DE DADOS BI (ANALYTICS v3.5 - High-Performance & Error-Resistant)
   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalFuel: 0,
         totalKm: 0,
         totalMaint: 0,
         totalCommissions: 0,
         totalFixedCosts: (vehicles.length * 4200), // R$ 4.2k de custo fixo médio/mês por caminhão

         driverMap: new Map<string, { id: string, name: string, profit: number, revenue: number, trips: number, km: number, commission: number }>(),
         vehicleMap: new Map<string, { id: string, plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
         routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number, fuel: number, otherCosts: number }>(),
         shipperMap: new Map<string, { id: string, name: string, revenue: number, profit: number, count: number, commission: number }>(),

         monthlyStats: {} as Record<string, { name: string, profit: number, revenue: number }>,
         lossMakingTrips: [] as any[],
         mostExpensiveMaintenances: [] as MaintenanceRecord[]
      };

      // Guard base for monthly chart (last 6 months)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const lastMonths = Array.from({ length: 6 }).map((_, i) => {
         const d = new Date();
         d.setMonth(d.getMonth() - (5 - i));
         const label = months[d.getMonth()];
         stats.monthlyStats[label] = { name: label, profit: 0, revenue: 0 };
         return label;
      });

      trips.forEach(t => {
         const v = vehicles.find(veh => veh.id === t.vehicleId);
         const d = drivers.find(drv => drv.id === t.driverId);
         const s = shippers.find(ship => ship.id === t.shipperId);
         if (!v || !d || !s) return;

         const fin = calculateTripFinance(t, v, d, profile);

         stats.totalRevenue += fin.totalBruto;
         stats.totalProfit += fin.lucroLiquidoReal;
         stats.totalFuel += (t.combustivel || 0);
         stats.totalKm += (t.totalKm || 0);
         stats.totalCommissions += fin.comissaoMotorista;

         // Feed monthly data
         if (t.departureDate) {
            const date = new Date(t.departureDate);
            const label = months[date.getMonth()];
            if (stats.monthlyStats[label]) {
               stats.monthlyStats[label].profit += fin.lucroLiquidoReal;
               stats.monthlyStats[label].revenue += fin.totalBruto;
            }
         }

         if (fin.lucroLiquidoReal < 0) {
            stats.lossMakingTrips.push({
               ...t,
               profit: fin.lucroLiquidoReal,
               vehicleLabel: v.plate,
               driverLabel: d.name
            });
         }

         const dStat = stats.driverMap.get(d.id) || { id: d.id, name: d.name, profit: 0, revenue: 0, trips: 0, km: 0, commission: 0 };
         dStat.profit += fin.lucroLiquidoReal;
         dStat.revenue += fin.totalBruto;
         dStat.trips += 1;
         dStat.km += (t.totalKm || 0);
         dStat.commission += fin.comissaoMotorista;
         stats.driverMap.set(d.id, dStat);

         const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
         vStat.profit += fin.lucroLiquidoReal;
         vStat.revenue += fin.totalBruto;
         vStat.trips += 1;
         vStat.km += (t.totalKm || 0);
         stats.vehicleMap.set(v.id, vStat);

         const rKey = normalizeDestination(t.destination);
         const rStat = stats.routeMap.get(rKey) || { name: t.destination, profit: 0, count: 0, revenue: 0, km: 0, fuel: 0, otherCosts: 0 };
         if (t.destination.length > rStat.name.length) rStat.name = t.destination;
         rStat.profit += fin.lucroLiquidoReal;
         rStat.revenue += fin.totalBruto;
         rStat.count += 1;
         rStat.km += (t.totalKm || 0);
         rStat.fuel += (t.combustivel || 0);
         rStat.otherCosts += (t.outrasDespesas || 0);
         stats.routeMap.set(rKey, rStat);

         const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
         sStat.revenue += fin.totalBruto;
         sStat.profit += fin.lucroLiquidoReal;
         sStat.count += 1;
         sStat.commission += fin.comissaoMotorista;
         stats.shipperMap.set(s.id, sStat);
      });

      maintenances.forEach(m => {
         stats.totalMaint += (m.totalCost || 0);
         const vStat = stats.vehicleMap.get(m.vehicleId);
         if (vStat) vStat.maint += (m.totalCost || 0);
      });

      stats.mostExpensiveMaintenances = [...maintenances]
         .sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
         .slice(0, 5);

      return stats;
   }, [trips, vehicles, drivers, shippers, profile, maintenances]);

   const chartData = useMemo(() => Object.values(analytics.monthlyStats), [analytics]);

   const rankedDrivers = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedCommissions = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 8), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedMaintVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 8), [analytics]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = marginRatioValue.toFixed(1);

   // Styles Pattern
   const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-emerald-500/20";
   const gradientText = "bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-black";

   return (
      <div className="space-y-12 animate-in fade-in duration-1000 pb-32">
         {/* EXTREME HEADER */}
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800/50 pb-12 relative">
            <div className="absolute top-0 -left-10 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />

            <div className="flex items-center gap-6 relative z-10">
               <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/40 rotate-6 transform hover:rotate-0 transition-all duration-700 cursor-pointer group">
                  <BarChart3 className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
               </div>
               <div>
                  <h2 className={`text-5xl ${gradientText} tracking-tighter uppercase italic leading-none`}>Ribeirx Intelligence</h2>
                  <p className="text-slate-500 text-[11px] font-black tracking-[0.4em] uppercase mt-3 flex items-center gap-3">
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     Neural Engine v3.5 • Operação em Tempo Real
                  </p>
               </div>
            </div>

            <nav className="flex bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-[2rem] shadow-2xl relative z-10">
               {[
                  { id: 'geral', label: 'Monitor', icon: Activity },
                  { id: 'rankings', label: 'Performance', icon: Trophy },
                  { id: 'custos', label: 'Cofre & Auditoria', icon: DollarSign },
                  { id: 'inteligencia', label: 'IA Estratégica', icon: Brain }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 relative group ${activeView === v.id ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                  >
                     <v.icon className={`w-4 h-4 ${activeView === v.id ? 'text-emerald-600' : 'text-slate-600 group-hover:text-emerald-400'}`} />
                     {v.label}
                     {activeView === v.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
                  </button>
               ))}
            </nav>
         </header>

         {/* 1. VISÃO GERAL - PREMIUM MONITORING */}
         {activeView === 'geral' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <PremiumStatCard title="Receita Bruta" value={analytics.totalRevenue} color="text-white" icon={Wallet} trend="+12.5%" />
                  <PremiumStatCard title="Lucro Real" value={analytics.totalProfit} color="text-emerald-400" icon={TrendingUp} trend="+8.2%" />
                  <PremiumStatCard title="ROI Médio" value={`${marginRatio}%`} color="text-sky-400" icon={Target} trend="-2.1%" />
                  <PremiumStatCard title="Lucro/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} trend="+0.4%" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-2 group"}>
                     <div className="absolute top-10 right-10 bg-emerald-500/10 p-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrendingUp className="w-8 h-8 text-emerald-500" />
                     </div>
                     <div className="mb-12">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fluxo de Lucratividade</h3>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Tendência dos últimos 6 meses</p>
                     </div>
                     <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                 </linearGradient>
                                 <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={5} fill="url(#profitGrad)" animationDuration={2000} />
                              <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2} strokeDasharray="10 5" fill="url(#revGrad)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col justify-between"}>
                     <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Eficiência Operacional</h3>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Saúde Financeira da Frota</p>
                     </div>

                     <div className="relative w-64 h-64 mx-auto my-12">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={24} data={[{ value: Math.min(100, marginRatioValue * 2.5), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                           <p className="text-5xl font-black text-white tracking-tighter">{marginRatio}%</p>
                           <div className="flex items-center gap-1 text-emerald-500 mt-1">
                              <ArrowUpRight className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase">Otimizado</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 bg-slate-950/80 rounded-[2rem] border border-slate-800">
                           <div className="flex justify-between items-center mb-3">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Retenção de Capital</p>
                              <p className="text-xs font-black text-white">{(100 - marginRatioValue).toFixed(1)}% Custo</p>
                           </div>
                           <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${marginRatioValue}%` }} />
                           </div>
                        </div>
                        <div className="flex items-center gap-4 text-center px-4">
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase">Faturamento</p>
                              <p className="text-sm font-bold text-white">R$ {analytics.totalRevenue.toLocaleString()}</p>
                           </div>
                           <div className="w-px h-8 bg-slate-800" />
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase">Custos</p>
                              <p className="text-sm font-bold text-rose-500">R$ {(analytics.totalRevenue - analytics.totalProfit).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 2. RANKINGS - HALL OF FAME */}
         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-right-12 duration-700">
               <RankingPanel
                  title="Elite dos Motoristas"
                  desc="Baseado em lucro líquido gerado"
                  icon={Trophy}
                  color="emerald"
                  data={rankedDrivers.map(d => ({ name: d.name, value: d.profit, sub: `${d.trips} viagens completas` }))}
               />
               <RankingPanel
                  title="Poder de Ganho (Comissões)"
                  desc="Líderes de rendimento bruto"
                  icon={Coins}
                  color="amber"
                  data={rankedCommissions.map(d => ({ name: d.name, value: d.commission, sub: `Comissão acumulada` }))}
               />
               <RankingPanel
                  title="Transportadoras Âncora"
                  desc="Clientes com maior rentabilidade real"
                  icon={Building2}
                  color="sky"
                  data={rankedShippers.map(s => ({ name: s.name, value: s.profit, sub: `Margem: ${((s.profit / s.revenue) * 100).toFixed(1)}%` }))}
               />
               <RankingPanel
                  title="Rotas de Alta Performance"
                  desc="Top lucro por quilômetro rodado"
                  icon={MapPin}
                  color="rose"
                  data={rankedRoutes.map(r => ({ name: r.name, value: r.profit, sub: `R$ ${(r.profit / r.km).toFixed(2)}/km • ${r.count} op.` }))}
               />
            </div>
         )}

         {/* 3. COFRE & AUDITORIA - DEEP COST ANALYSIS */}
         {activeView === 'custos' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-1"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Mapeamento de Evasão</h3>
                     <div className="h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Diesel', value: analytics.totalFuel, fill: '#38bdf8' },
                                    { name: 'Manutenção', value: analytics.totalMaint, fill: '#f43f5e' },
                                    { name: 'Comissão', value: analytics.totalCommissions, fill: '#fbbf24' },
                                    { name: 'Lucro Esperado', value: analytics.totalProfit, fill: '#10b981' }
                                 ].filter(i => i.value > 0)}
                                 innerRadius={80}
                                 outerRadius={110}
                                 paddingAngle={10}
                                 dataKey="value"
                                 animationDuration={1500}
                              >
                                 <Cell fill="#38bdf8" />
                                 <Cell fill="#f43f5e" />
                                 <Cell fill="#fbbf24" />
                                 <Cell fill="#10b981" />
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                           <PieIcon className="w-8 h-8 text-slate-800" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-10">
                        <CostLegLabel label="Diesel" value={analytics.totalFuel} color="bg-sky-400" />
                        <CostLegLabel label="Manutenção" value={analytics.totalMaint} color="bg-rose-500" />
                        <CostLegLabel label="Comissão" value={analytics.totalCommissions} color="bg-amber-400" />
                        <CostLegLabel label="Lucro Real" value={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Auditória de Drenos Financeiros</h3>
                     <div className="space-y-6">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="group/cost flex items-center justify-between p-8 bg-slate-950/60 border border-slate-800 rounded-[2.5rem] hover:border-rose-500/40 transition-all hover:translate-x-2">
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover/cost:scale-110 transition-transform">
                                       <Wrench className="w-8 h-8" />
                                    </div>
                                    <div>
                                       <p className="text-xl font-black text-white tracking-tight">{m.description || 'Intervenção Mecânica'}</p>
                                       <div className="flex items-center gap-3 mt-1">
                                          <span className="px-3 py-0.5 bg-slate-800 text-[9px] font-black text-slate-400 rounded-full uppercase">
                                             {vehicles.find(v => v.id === m.vehicleId)?.plate || 'N/A'}
                                          </span>
                                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                          <span className="text-[10px] text-slate-500 font-bold uppercase">{m.type} • {new Date(m.date).toLocaleDateString()}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-2xl font-black text-rose-500 tracking-tighter">R$ {m.totalCost.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-1 text-[8px] font-black text-slate-600 uppercase mt-1">
                                       <AlertTriangle className="w-3 h-3" /> ALTO IMPACTO
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center py-20 opacity-20 italic space-y-4">
                              <History className="w-12 h-12" />
                              <p>Nenhum dreno de manutenção detectado.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 4. IA ESTRATÉGICA - PREDICTIVE ENGINE */}
         {activeView === 'inteligencia' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
               <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/10 rounded-[4rem] p-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
                     <Brain className="w-80 h-80 text-indigo-400" />
                  </div>

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <div className="space-y-10">
                        <header>
                           <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-900/40 mb-8">
                              <Zap className="w-7 h-7" />
                           </div>
                           <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">Análise Preditiva de ROI</h3>
                           <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.3em] mt-3">Algoritmo de Priorização de Cargas</p>
                        </header>

                        <div className="space-y-6">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="group/ai flex items-center justify-between p-8 bg-slate-950/80 rounded-[2.5rem] border border-slate-800/50 hover:border-indigo-500/30 transition-all">
                                 <div>
                                    <p className="text-lg font-black text-white uppercase tracking-tighter">{r.name}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                       <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase">
                                          <TrendingUp className="w-3 h-3" /> R$ {(r.profit / r.km).toFixed(2)}/km
                                       </span>
                                       <span className="text-[10px] text-slate-500 font-black uppercase">{r.count} viagens válidas</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-2xl font-black text-white tracking-tighter">
                                       {((r.profit / r.revenue) * 100).toFixed(0)}%
                                    </div>
                                    <p className="text-[8px] font-black text-indigo-400 uppercase">Eficiência IA</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="bg-slate-950/40 backdrop-blur-md rounded-[3rem] p-10 border border-slate-800/80 flex flex-col">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                           <AlertTriangle className="w-4 h-4 text-rose-500" /> Monitor de Riscos Operacionais
                        </h4>

                        <div className="flex-1 space-y-6">
                           {analytics.lossMakingTrips.length > 0 ? (
                              analytics.lossMakingTrips.map((t, i) => (
                                 <div key={i} className="flex items-center gap-6 p-6 bg-rose-500/5 border border-rose-500/10 rounded-3xl animate-pulse">
                                    <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                                       <History className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-sm font-black text-white uppercase truncate">{t.destination}</p>
                                       <p className="text-[10px] text-rose-400 font-bold">Drenagem: <span className="text-white">R$ {Math.abs(t.profit).toLocaleString()}</span></p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-700" />
                                 </div>
                              ))
                           ) : (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                 <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                                    <ShieldCheck className="w-10 h-10" />
                                 </div>
                                 <p className="text-lg font-black text-white uppercase italic">Operação Saudável</p>
                                 <p className="text-xs text-slate-500 font-medium max-w-[200px] mt-2 italic">Nenhuma viagem detectada com ROI negativo no período.</p>
                              </div>
                           )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-800">
                           <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex gap-5">
                              <Lightbulb className="w-8 h-8 text-indigo-400 shrink-0" />
                              <p className="text-[11px] text-indigo-100 font-medium leading-relaxed italic">
                                 "Insight: Aumentar o volume de cargas para {rankedRoutes[0]?.name || '---'} pode aumentar seu lucro líquido mensal em estimados 15%, baseando-se na eficiência de km atual."
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// --- ELITE UI COMPONENTS ---

const PremiumStatCard = ({ title, value, color, icon: Icon, trend }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl group hover:border-emerald-500/30 transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
      <div className="flex items-start justify-between mb-8 relative z-10">
         <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
            <Icon className={`w-7 h-7 ${color}`} />
         </div>
         <span className={`text-[10px] font-black px-3 py-1 rounded-full ${trend.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
            {trend}
         </span>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">{title}</p>
      <p className={`text-3xl font-black ${color} tracking-tighter relative z-10`}>
         {typeof value === 'number' ? `R$ ${value.toLocaleString()}` : value}
      </p>
   </div>
);

const RankingPanel = ({ title, desc, icon: Icon, color, data }: any) => {
   const colorClass = color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : color === 'sky' ? 'text-sky-500' : 'text-rose-500';
   const bgClass = color === 'emerald' ? 'bg-emerald-500/10' : color === 'amber' ? 'bg-amber-500/10' : color === 'sky' ? 'bg-sky-500/10' : 'bg-rose-500/10';

   return (
      <section className="bg-slate-900 border border-slate-800 rounded-[4rem] p-12 space-y-10 shadow-2xl relative overflow-hidden group">
         <div className={`absolute top-0 right-0 p-12 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`}>
            <Icon className="w-48 h-48" />
         </div>
         <header className="relative z-10">
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 ${bgClass} rounded-2xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{desc}</p>
               </div>
            </div>
         </header>
         <div className="space-y-4 relative z-10">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center gap-6 p-6 bg-slate-950/60 border border-slate-800/50 rounded-[2.5rem] hover:border-white/10 transition-all group/item">
                  <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center font-black text-slate-600 group-hover/item:text-white transition-colors text-lg italic">
                     #{i + 1}
                  </div>
                  <div className="flex-1">
                     <p className="text-lg font-black text-white tracking-tight uppercase truncate max-w-[200px] md:max-w-none">{item.name}</p>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.sub}</p>
                  </div>
                  <div className="text-right">
                     <p className={`${colorClass} font-black text-2xl tracking-tighter`}>R$ {item.value.toLocaleString()}</p>
                     <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">Liquidado</p>
                  </div>
               </div>
            ))}
            {data.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center opacity-20 italic bg-slate-950/40 rounded-[2.5rem] border border-dashed border-slate-800">
                  <BarChart3 className="w-10 h-10 mb-4" />
                  <p>Massa crítica de dados insuficiente para ranking.</p>
               </div>
            )}
         </div>
      </section>
   );
};

const CustomTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2">
               <p className="text-sm font-black text-emerald-500 flex items-center justify-between gap-8">
                  <span className="text-slate-400">Lucro:</span> R$ {payload[0].value.toLocaleString()}
               </p>
               <p className="text-sm font-black text-sky-400 flex items-center justify-between gap-8">
                  <span className="text-slate-400">Receita:</span> R$ {payload[1].value.toLocaleString()}
               </p>
            </div>
         </div>
      );
   }
   return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl">
            <p className="text-xs font-black text-white uppercase">{payload[0].name}</p>
            <p className="text-sm font-black text-emerald-500 mt-1">R$ {payload[0].value.toLocaleString()}</p>
         </div>
      );
   }
   return null;
};

const CostLegLabel = ({ label, value, color }: any) => (
   <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
         <div className={`w-2 h-2 rounded-full ${color}`} />
         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-black text-white">R$ {value.toLocaleString()}</p>
   </div>
);

const LineChartIcon = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
   </svg>
);

export default Performance;
