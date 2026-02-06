
import React, { useMemo, useState, useEffect } from 'react';
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
   const [isMounted, setIsMounted] = useState(false);

   // Previne erros de hidratação do Next.js com Recharts
   useEffect(() => {
      setIsMounted(true);
   }, []);

   // SUPER ENGINE ANALYTICS v4.5 - PREMIUM NEURAL EDITION
   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalFuel: 0,
         totalKm: 0,
         totalMaint: 0,
         totalCommissions: 0,
         totalFixedCosts: (vehicles.length * 4500),

         driverMap: new Map<string, { id: string, name: string, profit: number, revenue: number, trips: number, km: number, commission: number }>(),
         vehicleMap: new Map<string, { id: string, plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
         routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number, fuel: number, otherCosts: number }>(),
         shipperMap: new Map<string, { id: string, name: string, revenue: number, profit: number, count: number, commission: number }>(),

         monthlyStats: {} as Record<string, { name: string, profit: number, revenue: number }>,
         lossMakingTrips: [] as any[],
         mostExpensiveMaintenances: [] as MaintenanceRecord[]
      };

      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let i = 5; i >= 0; i--) {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         const label = months[d.getMonth()];
         stats.monthlyStats[label] = { name: label, profit: 0, revenue: 0 };
      }

      trips.forEach(t => {
         const frete = Number(t.freteSeco || 0);
         const dia = Number(t.diarias || 0);
         const adiant = Number(t.adiantamento || 0);
         const fuel = Number(t.combustivel || 0);
         const other = Number(t.outrasDespesas || 0);
         const km = Number(t.totalKm || 0);

         const v = vehicles.find(veh => veh.id === t.vehicleId) || { id: 'unk', plate: 'Frota N/A', type: 'Próprio' } as Vehicle;
         const d = drivers.find(drv => drv.id === t.driverId) || { id: 'unk', name: 'Motorista N/A' } as Driver;
         const s = shippers.find(ship => ship.id === t.shipperId);

         const fin = calculateTripFinance({ ...t, freteSeco: frete, diarias: dia, adiantamento: adiant, combustivel: fuel, outrasDespesas: other }, v, d, profile);

         stats.totalRevenue += (fin.totalBruto || 0);
         stats.totalProfit += (fin.lucroLiquidoReal || 0);
         stats.totalFuel += fuel;
         stats.totalKm += km;
         stats.totalCommissions += (fin.comissaoMotorista || 0);

         if (t.departureDate) {
            const date = new Date(t.departureDate);
            if (!isNaN(date.getTime())) {
               const label = months[date.getMonth()];
               if (stats.monthlyStats[label]) {
                  stats.monthlyStats[label].profit += (fin.lucroLiquidoReal || 0);
                  stats.monthlyStats[label].revenue += (fin.totalBruto || 0);
               }
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

         if (d.id !== 'unk') {
            const dStat = stats.driverMap.get(d.id) || { id: d.id, name: d.name, profit: 0, revenue: 0, trips: 0, km: 0, commission: 0 };
            dStat.profit += (fin.lucroLiquidoReal || 0);
            dStat.revenue += (fin.totalBruto || 0);
            dStat.trips += 1;
            dStat.commission += (fin.comissaoMotorista || 0);
            stats.driverMap.set(d.id, dStat);
         }

         if (v.id !== 'unk') {
            const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
            vStat.profit += (fin.lucroLiquidoReal || 0);
            vStat.revenue += (fin.totalBruto || 0);
            vStat.trips += 1;
            vStat.km += km;
            stats.vehicleMap.set(v.id, vStat);
         }

         if (t.destination) {
            const rKey = normalizeDestination(t.destination);
            const rStat = stats.routeMap.get(rKey) || { name: t.destination, profit: 0, count: 0, revenue: 0, km: 0, fuel: 0, otherCosts: 0 };
            rStat.profit += (fin.lucroLiquidoReal || 0);
            rStat.revenue += (fin.totalBruto || 0);
            rStat.count += 1;
            rStat.km += km;
            stats.routeMap.set(rKey, rStat);
         }

         if (s) {
            const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
            sStat.revenue += (fin.totalBruto || 0);
            sStat.profit += (fin.lucroLiquidoReal || 0);
            sStat.count += 1;
            stats.shipperMap.set(s.id, sStat);
         }
      });

      maintenances.forEach(m => {
         const cost = Number(m.totalCost || 0);
         stats.totalMaint += cost;
         const vStat = stats.vehicleMap.get(m.vehicleId);
         if (vStat) vStat.maint += cost;
      });

      stats.mostExpensiveMaintenances = [...maintenances]
         .sort((a, b) => Number(b.totalCost || 0) - Number(a.totalCost || 0))
         .slice(0, 5);

      return stats;
   }, [trips, vehicles, drivers, shippers, profile, maintenances]);

   const chartData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dataArr: any[] = [];
      for (let i = 5; i >= 0; i--) {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         const label = months[d.getMonth()];
         dataArr.push(analytics.monthlyStats[label] || { name: label, profit: 0, revenue: 0 });
      }
      return dataArr;
   }, [analytics]);

   const rankedDrivers = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedMaintVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 8), [analytics]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = isNaN(marginRatioValue) ? "0.0" : marginRatioValue.toFixed(1);

   const glassCard = "bg-slate-900/40 backdrop-blur-2xl border border-slate-800/60 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-700 hover:border-emerald-500/30 group";
   const luxuryText = "bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent italic font-black";

   if (!isMounted) return <div className="min-h-screen flex items-center justify-center text-slate-500 uppercase tracking-widest font-black animate-pulse">Iniciando Neural Engine...</div>;

   return (
      <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000 pb-32">
         {/* HEADER PREMIUM */}
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800/50 pb-12">
            <div className="flex items-center gap-8 group cursor-default">
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-teal-600 to-sky-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/30 rotate-3 group-hover:rotate-0 transition-all duration-700">
                  <BarChart3 className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
               </div>
               <div>
                  <h2 className={`text-5xl ${luxuryText} tracking-tighter leading-none`}>RIBEIRX BI</h2>
                  <p className="text-slate-500 text-[11px] font-black tracking-[0.4em] uppercase mt-3 flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                     Sistema de Inteligência Operacional v4.5
                  </p>
               </div>
            </div>

            <nav className="flex bg-slate-950/50 backdrop-blur-xl border border-slate-800 p-2 rounded-[2rem] shadow-2xl">
               {[
                  { id: 'geral', label: 'Monitor', icon: Activity },
                  { id: 'rankings', label: 'Performance', icon: Trophy },
                  { id: 'custos', label: 'Cofre & Auditoria', icon: DollarSign },
                  { id: 'inteligencia', label: 'Estratégico', icon: Brain }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeView === v.id ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                  >
                     <v.icon className={`w-4 h-4 ${activeView === v.id ? 'text-emerald-600' : 'text-slate-600'}`} />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {activeView === 'geral' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <LuxuryStat title="Receita Consolidada" value={analytics.totalRevenue} color="text-white" icon={Wallet} trend="+12%" />
                  <LuxuryStat title="Lucro Líquido Real" value={analytics.totalProfit} color="text-emerald-400" icon={TrendingUp} trend="+8%" />
                  <LuxuryStat title="Margem de Retorno" value={`${marginRatio}%`} color="text-sky-400" icon={Target} trend="Estável" />
                  <LuxuryStat title="Rentabilidade/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} trend="+2%" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-2 min-h-[500px]"}>
                     <div className="flex justify-between items-start mb-12">
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fluxo de Lucratividade</h3>
                           <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Volume histórico de 6 meses</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black text-slate-400 uppercase">Lucro</span></div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500" /><span className="text-[9px] font-black text-slate-400 uppercase">Receita</span></div>
                        </div>
                     </div>
                     <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                 <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                              <Tooltip content={<PremiumTooltip />} />
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fill="url(#pGrad)" animationDuration={2000} />
                              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="8 4" fill="url(#rGrad)" animationDuration={2500} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col items-center justify-between py-16"}>
                     <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Eficiência Real</h3>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Target Operational ROI</p>
                     </div>
                     <div className="relative w-72 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={25} data={[{ value: Math.max(5, Number(marginRatio)), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#0f172a' }} dataKey="value" cornerRadius={30} angleAxisId={0} animationDuration={2000} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-6xl font-black text-white tracking-tighter">{marginRatio}%</p>
                           <span className="text-[10px] font-black text-emerald-500 uppercase mt-2 px-3 py-1 bg-emerald-500/10 rounded-full">Operação Blindada</span>
                        </div>
                     </div>
                     <div className="w-full space-y-4 px-6">
                        <div className="flex justify-between items-end"><p className="text-[10px] font-black text-slate-500 uppercase">Taxa de Otimização</p><p className="text-sm font-black text-white">{marginRatio}%</p></div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${marginRatio}%` }} /></div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-right-10 duration-700">
               <NeuralRank title="Elite dos Motoristas" desc="Ranking por lucro líquido gerado" icon={Trophy} color="emerald" data={rankedDrivers.map(d => ({ name: d.name, val: d.profit, sub: `${d.trips} viagens realizadas` }))} />
               <NeuralRank title="Transportadoras" desc="Faturamento bruto acumulado" icon={Building2} color="sky" data={rankedShippers.map(s => ({ name: s.name, val: s.profit, sub: 'Performance de Carga' }))} />
               <NeuralRank title="Rotas de Alta Margem" desc="Top 8 destinos mais rentáveis" icon={MapPin} color="amber" data={rankedRoutes.map(r => ({ name: r.name, val: r.profit, sub: `${r.count} operações` }))} />
               <NeuralRank title="Drenos da Frota" desc="Veículos com maior custo mecânico" icon={AlertTriangle} color="rose" data={rankedMaintVehicles.filter(v => v.maint > 0).map(v => ({ name: v.plate, val: v.maint, sub: 'Manutenção Acumulada' }))} />
            </div>
         )}

         {activeView === 'custos' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-1"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-12">Divisão de Gastos</h3>
                     <div className="h-[350px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Diesel', value: analytics.totalFuel || 1, fill: '#38bdf8' },
                                    { name: 'Manutenção', value: analytics.totalMaint || 1, fill: '#f43f5e' },
                                    { name: 'Comissão', value: analytics.totalCommissions || 1, fill: '#fbbf24' },
                                    { name: 'Lucro Real', value: analytics.totalProfit || 1, fill: '#10b981' }
                                 ]}
                                 innerRadius={90} outerRadius={120} paddingAngle={10} dataKey="value"
                              >
                                 <Cell fill="#38bdf8" />
                                 <Cell fill="#f43f5e" />
                                 <Cell fill="#fbbf24" />
                                 <Cell fill="#10b981" />
                              </Pie>
                              <Tooltip content={<SimplePieTooltip />} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center -mt-2"><PieIcon className="w-10 h-10 text-slate-800" /></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-12">
                        <CostLabel label="Diesel" val={analytics.totalFuel} color="bg-sky-400" />
                        <CostLabel label="Peças" val={analytics.totalMaint} color="bg-rose-500" />
                        <CostLabel label="Comissão" val={analytics.totalCommissions} color="bg-amber-400" />
                        <CostLabel label="Lucro" val={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Auditoria de Intervenções (Top 5)</h3>
                     <div className="space-y-6">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-8 bg-slate-950/40 border border-slate-800/50 rounded-[2.5rem] hover:border-rose-500/40 transition-all hover:translate-x-3 group/item">
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 group-hover/item:scale-110 transition-transform"><Wrench className="w-8 h-8" /></div>
                                    <div>
                                       <p className="text-xl font-black text-white uppercase tracking-tight">{m.description || 'Manutenção Corretiva'}</p>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                          {vehicles.find(v => v.id === m.vehicleId)?.plate || 'Placa N/A'} • {m.type} • {m.date ? new Date(m.date).toLocaleDateString() : 'Sem Data'}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-3xl font-black text-rose-500 tracking-tighter">R$ {Number(m.totalCost || 0).toLocaleString()}</p>
                                    <span className="text-[8px] font-black text-slate-600 uppercase">Impacto Financeiro</span>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-24 text-center opacity-20"><History className="w-16 h-16 mx-auto mb-6" /><p className="text-lg font-black uppercase italic">Nenhum rastro de despesa grave.</p></div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'inteligencia' && (
            <div className="animate-in zoom-in-95 duration-700">
               <div className={glassCard + " bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-950 border-indigo-500/20"}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 py-10">
                     <div className="space-y-12">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400"><Lightbulb className="w-8 h-8" /></div>
                           <h3 className="text-4xl font-black text-white uppercase italic leading-none">Visão Neural</h3>
                        </div>
                        <div className="space-y-6">
                           <div className="p-8 bg-slate-950/60 rounded-[2.5rem] border border-slate-800">
                              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">Recomendação Estratégica</p>
                              <p className="text-white text-lg font-medium leading-relaxed italic">
                                 "Sua rota para <b>{rankedRoutes[0]?.name || 'seu destino principal'}</b> está com um ROI de {(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}/km. Recomendamos concentrar a frota neste eixo para maximizar a retenção de lucro deste mês."
                              </p>
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="p-6 bg-slate-950/60 rounded-[2rem] border border-slate-800">
                                 <p className="text-slate-500 text-[9px] font-black uppercase mb-1">Carga de Operação</p>
                                 <p className="text-2xl font-black text-white">{trips.length} <span className="text-xs text-slate-600">Viagens</span></p>
                              </div>
                              <div className="p-6 bg-slate-950/60 rounded-[2rem] border border-emerald-500/20">
                                 <p className="text-emerald-500 text-[9px] font-black uppercase mb-1">Status Global</p>
                                 <p className="text-2xl font-black text-white">LUCRO</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="bg-slate-950/80 rounded-[4rem] p-12 border border-slate-800 shadow-inner flex flex-col items-center justify-center text-center relative">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] pointer-events-none" />
                        <Brain className="w-20 h-20 text-indigo-500 mb-8 animate-pulse" />
                        <h4 className="text-2xl font-black text-white uppercase italic mb-6">Processamento de ROI</h4>
                        <div className="w-full space-y-3">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex justify-between items-center p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                                 <span className="text-xs font-black text-slate-400 uppercase">{r.name}</span>
                                 <span className="text-sm font-black text-emerald-500">R$ {(r.profit / r.km).toFixed(2)}/km</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// COMPONENTES AUXILIARES
const LuxuryStat = ({ title, value, color, icon: Icon, trend }: any) => (
   <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] translate-x-16 -translate-y-16 group-hover:bg-white/10 transition-all" />
      <div className="flex justify-between items-start mb-6">
         <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl"><Icon className={`w-7 h-7 ${color}`} /></div>
         <span className={`text-[9px] font-black px-3 py-1 rounded-full bg-slate-950 border border-slate-800 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-3xl font-black ${color} tracking-tighter`}>{typeof value === 'number' ? `R$ ${Number(value || 0).toLocaleString()}` : value}</p>
   </div>
);

const NeuralRank = ({ title, desc, icon: Icon, color, data }: any) => {
   const c = color === 'emerald' ? 'text-emerald-500' : color === 'sky' ? 'text-sky-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500';
   return (
      <div className="bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] shadow-2xl space-y-10 group/rank">
         <div className="flex items-center gap-6">
            <div className={`w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 ${c} group-hover/rank:scale-110 transition-transform`}><Icon className="w-8 h-8" /></div>
            <div>
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{desc}</p>
            </div>
         </div>
         <div className="space-y-4">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center gap-6 p-6 bg-slate-950/60 rounded-[2rem] border border-slate-800/40 hover:border-white/10 transition-all">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-700 text-lg">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                     <p className="text-base font-black text-white uppercase truncate">{item.name}</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{item.sub}</p>
                  </div>
                  <div className="text-right">
                     <p className={`${c} font-black text-2xl tracking-tighter`}>R$ {Number(item.val || 0).toLocaleString()}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

const PremiumTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-700 p-6 rounded-2xl shadow-3xl backdrop-blur-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">{label}</p>
            <div className="space-y-3">
               <div className="flex justify-between gap-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Receita Bruta</span>
                  <span className="text-sm font-black text-sky-400">R$ {Number(payload[1].value || 0).toLocaleString()}</span>
               </div>
               <div className="flex justify-between gap-10">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Lucro Líquido</span>
                  <span className="text-sm font-black text-emerald-500">R$ {Number(payload[0].value || 0).toLocaleString()}</span>
               </div>
            </div>
         </div>
      );
   }
   return null;
};

const SimplePieTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{payload[0].name}</p>
            <p className="text-sm font-black text-emerald-500">R$ {Number(payload[0].value || 0).toLocaleString()}</p>
         </div>
      );
   }
   return null;
};

const CostLabel = ({ label, val, color }: any) => (
   <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
      <div className="flex items-center gap-2 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${color}`} /><span className="text-[9px] font-black text-slate-500 uppercase">{label}</span></div>
      <p className="text-sm font-black text-white">R$ {Number(val || 0).toLocaleString()}</p>
   </div>
);

export default Performance;
