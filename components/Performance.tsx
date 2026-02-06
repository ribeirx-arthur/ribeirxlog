
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

   // SUPER ENGINE DE DADOS BI (ANALYTICS v3.8 - High-Visibility & Zero-Crash)
   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalFuel: 0,
         totalKm: 0,
         totalMaint: 0,
         totalCommissions: 0,
         totalFixedCosts: (vehicles.length * 4200),

         driverMap: new Map<string, { id: string, name: string, profit: number, revenue: number, trips: number, km: number, commission: number }>(),
         vehicleMap: new Map<string, { id: string, plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
         routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number, fuel: number, otherCosts: number }>(),
         shipperMap: new Map<string, { id: string, name: string, revenue: number, profit: number, count: number, commission: number }>(),

         monthlyStats: {} as Record<string, { name: string, profit: number, revenue: number }>,
         lossMakingTrips: [] as any[],
         mostExpensiveMaintenances: [] as MaintenanceRecord[]
      };

      // Ensure we ALL 6 SLOTS for the chart even if zeroed
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const lastMonthsLabels: string[] = [];
      for (let i = 5; i >= 0; i--) {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         const label = months[d.getMonth()];
         lastMonthsLabels.push(label);
         stats.monthlyStats[label] = { name: label, profit: 0, revenue: 0 };
      }

      trips.forEach(t => {
         // CRITICAL FIX: Destructure safely with defaults to prevent crashes in calculation
         const safeTrip = {
            ...t,
            freteSeco: Number(t.freteSeco || 0),
            diarias: Number(t.diarias || 0),
            adiantamento: Number(t.adiantamento || 0),
            combustivel: Number(t.combustivel || 0),
            outrasDespesas: Number(t.outrasDespesas || 0)
         };

         const v = vehicles.find(veh => veh.id === t.vehicleId);
         const d = drivers.find(drv => drv.id === t.driverId);
         const s = shippers.find(ship => ship.id === t.shipperId);

         // Bi data generation still runs even if entities are missing (using fallbacks)
         const safeV = v || { id: 'unknown', plate: 'Plaque N/A', type: 'Próprio' } as Vehicle;
         const safeD = d || { id: 'unknown', name: 'Motorista N/A' } as Driver;

         const fin = calculateTripFinance(safeTrip, safeV, safeD, profile);

         stats.totalRevenue += fin.totalBruto;
         stats.totalProfit += fin.lucroLiquidoReal;
         stats.totalFuel += safeTrip.combustivel;
         stats.totalKm += Number(t.totalKm || 0);
         stats.totalCommissions += fin.comissaoMotorista;

         // Feed monthly data - FIX: Check date parsing
         if (t.departureDate) {
            const date = new Date(t.departureDate);
            if (!isNaN(date.getTime())) {
               const label = months[date.getMonth()];
               if (stats.monthlyStats[label]) {
                  stats.monthlyStats[label].profit += fin.lucroLiquidoReal;
                  stats.monthlyStats[label].revenue += fin.totalBruto;
               }
            }
         }

         if (fin.lucroLiquidoReal < 0) {
            stats.lossMakingTrips.push({
               ...t,
               profit: fin.lucroLiquidoReal,
               vehicleLabel: safeV.plate,
               driverLabel: safeD.name
            });
         }

         if (d) {
            const dStat = stats.driverMap.get(d.id) || { id: d.id, name: d.name, profit: 0, revenue: 0, trips: 0, km: 0, commission: 0 };
            dStat.profit += fin.lucroLiquidoReal;
            dStat.revenue += fin.totalBruto;
            dStat.trips += 1;
            dStat.km += Number(t.totalKm || 0);
            dStat.commission += fin.comissaoMotorista;
            stats.driverMap.set(d.id, dStat);
         }

         if (v) {
            const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
            vStat.profit += fin.lucroLiquidoReal;
            vStat.revenue += fin.totalBruto;
            vStat.trips += 1;
            vStat.km += Number(t.totalKm || 0);
            stats.vehicleMap.set(v.id, vStat);
         }

         if (t.destination) {
            const rKey = normalizeDestination(t.destination);
            const rStat = stats.routeMap.get(rKey) || { name: t.destination, profit: 0, count: 0, revenue: 0, km: 0, fuel: 0, otherCosts: 0 };
            if (t.destination.length > rStat.name.length) rStat.name = t.destination;
            rStat.profit += fin.lucroLiquidoReal;
            rStat.revenue += fin.totalBruto;
            rStat.count += 1;
            rStat.km += Number(t.totalKm || 0);
            rStat.fuel += safeTrip.combustivel;
            rStat.otherCosts += safeTrip.outrasDespesas;
            stats.routeMap.set(rKey, rStat);
         }

         if (s) {
            const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
            sStat.revenue += fin.totalBruto;
            sStat.profit += fin.lucroLiquidoReal;
            sStat.count += 1;
            sStat.commission += fin.comissaoMotorista;
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

   // Ensure chart data follows the chronological order we created
   const chartData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const ordered: any[] = [];
      for (let i = 5; i >= 0; i--) {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         const label = months[d.getMonth()];
         ordered.push(analytics.monthlyStats[label] || { name: label, profit: 0, revenue: 0 });
      }
      return ordered;
   }, [analytics]);

   const rankedDrivers = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedCommissions = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 8), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedMaintVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 8), [analytics]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = marginRatioValue.toFixed(1);

   const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-emerald-500/20";
   const gradientText = "bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-black";

   return (
      <div className="space-y-12 animate-in fade-in duration-1000 pb-32">
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
                     Neural Engine v3.8 • Operação Blindada
                  </p>
               </div>
            </div>

            <nav className="flex bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2 rounded-[2rem] shadow-2xl relative z-10">
               {[
                  { id: 'geral', label: 'Monitor', icon: Activity },
                  { id: 'rankings', label: 'Performance', icon: Trophy },
                  { id: 'custos', label: 'Auditoria', icon: DollarSign },
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
                  </button>
               ))}
            </nav>
         </header>

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
                     <div className="mb-12">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fluxo de Lucratividade</h3>
                        <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Volume histórico consolidado</p>
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
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={5} fill="url(#profitGrad)" />
                              <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2} strokeDasharray="10 5" fill="url(#revGrad)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col justify-between"}>
                     <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Eficiência Operacional</h3>
                     </div>

                     <div className="relative w-64 h-64 mx-auto my-12">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={24} data={[{ value: Math.max(5, marginRatioValue), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
                           <p className="text-5xl font-black text-white tracking-tighter">{marginRatio}%</p>
                           <span className="text-[10px] font-black text-emerald-500 uppercase">Margem Real</span>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 bg-slate-950/80 rounded-[2rem] border border-slate-800">
                           <div className="flex justify-between items-center mb-3">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Retenção de Capital</p>
                              <p className="text-xs font-black text-white">{marginRatio}%</p>
                           </div>
                           <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${Math.max(2, marginRatioValue)}%` }} />
                           </div>
                        </div>
                        <div className="flex items-center gap-4 text-center px-4">
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Receita</p>
                              <p className="text-xs font-bold text-white">R$ {(analytics.totalRevenue / 1000).toFixed(1)}k</p>
                           </div>
                           <div className="w-px h-8 bg-slate-800" />
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Custos</p>
                              <p className="text-xs font-bold text-rose-500">R$ {((analytics.totalRevenue - analytics.totalProfit) / 1000).toFixed(1)}k</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-right-12 duration-700">
               <RankingPanel title="Elite dos Motoristas" desc="Lucro líquido total gerado" icon={Trophy} color="emerald" data={rankedDrivers.map(d => ({ name: d.name, value: d.profit, sub: `${d.trips} viagens` }))} />
               <RankingPanel title="Ranking de Comissões" desc="Maior volume de ganho bruto" icon={Coins} color="amber" data={rankedCommissions.map(d => ({ name: d.name, value: d.commission, sub: `Acumulado bruto` }))} />
               <RankingPanel title="Transportadoras Ativas" desc="Faturamento real por cliente" icon={Building2} color="sky" data={rankedShippers.map(s => ({ name: s.name, value: s.profit, sub: `Lucro Limpo` }))} />
               <RankingPanel title="Custo de Frota" desc="Gastos acumulados em manutenção" icon={AlertTriangle} color="rose" data={rankedMaintVehicles.filter(v => v.maint > 0).map(v => ({ name: v.plate, value: v.maint, sub: `Dreno de Caixa` }))} />
            </div>
         )}

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
                                    { name: 'Diesel', value: analytics.totalFuel || 1, fill: '#38bdf8' },
                                    { name: 'Manutenção', value: analytics.totalMaint || 1, fill: '#f43f5e' },
                                    { name: 'Comissão', value: analytics.totalCommissions || 1, fill: '#fbbf24' },
                                    { name: 'Lucro Real', value: analytics.totalProfit || 1, fill: '#10b981' }
                                 ]}
                                 innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value"
                              >
                                 <Cell fill="#38bdf8" /><Cell fill="#f43f5e" /><Cell fill="#fbbf24" /><Cell fill="#10b981" />
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <PieIcon className="w-8 h-8 text-slate-800" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-10">
                        <CostLegLabel label="Diesel" value={analytics.totalFuel} color="bg-sky-400" />
                        <CostLegLabel label="Peças" value={analytics.totalMaint} color="bg-rose-500" />
                        <CostLegLabel label="Comissão" value={analytics.totalCommissions} color="bg-amber-400" />
                        <CostLegLabel label="Lucro" value={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Auditoria de Intervenções</h3>
                     <div className="space-y-4">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-6 bg-slate-950/60 border border-slate-800 rounded-3xl">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500"><Wrench className="w-6 h-6" /></div>
                                    <div>
                                       <p className="text-lg font-black text-white uppercase tracking-tight">{m.description || 'Manutenção'}</p>
                                       <span className="text-[10px] text-slate-500 font-bold uppercase">{m.type} • {new Date(m.date).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-black text-rose-500">R$ {m.totalCost.toLocaleString()}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <p className="text-center py-20 opacity-20 italic">Dados de auditoria limpos.</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'inteligencia' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
               <div className={glassCard + " bg-gradient-to-br from-indigo-950/40 to-slate-900 border-indigo-500/10"}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <div className="space-y-10">
                        <h3 className="text-4xl font-black text-white uppercase italic leading-tight">Análise de ROI por Rota</h3>
                        <div className="space-y-4">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex items-center justify-between p-8 bg-slate-950/80 rounded-[2rem] border border-slate-800">
                                 <p className="text-lg font-black text-white uppercase">{r.name}</p>
                                 <span className="text-emerald-500 font-black">R$ {(r.profit / r.km).toFixed(2)}/km</span>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-slate-950/40 rounded-[3rem] p-10 border border-slate-800">
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">Alerta de Prejuízo Tripulado</h4>
                        {analytics.lossMakingTrips.length > 0 ? (
                           analytics.lossMakingTrips.map((t, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-4 text-rose-500">
                                 <AlertTriangle className="w-5 h-5" />
                                 <p className="text-xs font-black uppercase flex-1">{t.destination}</p>
                                 <span className="font-bold">-R$ {Math.abs(t.profit).toLocaleString()}</span>
                              </div>
                           ))
                        ) : (
                           <div className="py-12 text-center opacity-40"><ShieldCheck className="w-12 h-12 mx-auto mb-4" /><p className="text-sm font-black uppercase">Operação em Lucro</p></div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// --- BASE UI ---

const PremiumStatCard = ({ title, value, color, icon: Icon, trend }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
      <div className="flex items-start justify-between mb-6">
         <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800"><Icon className={`w-6 h-6 ${color}`} /></div>
         <span className={`text-[9px] font-black px-2 py-1 rounded-full ${trend.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>{trend}</span>
      </div>
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black ${color} tracking-tighter`}>{typeof value === 'number' ? `R$ ${value.toLocaleString()}` : value}</p>
   </div>
);

const RankingPanel = ({ title, desc, icon: Icon, color, data }: any) => {
   const c = color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : color === 'sky' ? 'text-sky-500' : 'text-rose-500';
   return (
      <section className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-8">
         <header className="flex items-center gap-5">
            <div className={`w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center ${c}`}><Icon className="w-6 h-6" /></div>
            <div><h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{title}</h3><p className="text-[9px] text-slate-500 uppercase font-black">{desc}</p></div>
         </header>
         <div className="space-y-3">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/60 rounded-[2rem] border border-slate-800/50 hover:bg-slate-950 transition-colors">
                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-600 text-sm">#{i + 1}</div>
                  <div className="flex-1"><p className="text-sm font-black text-white uppercase truncate">{item.name}</p><p className="text-[9px] text-slate-500 font-black">{item.sub}</p></div>
                  <div className="text-right"><p className={`${c} font-black text-lg tracking-tighter`}>R$ {item.value.toLocaleString()}</p></div>
               </div>
            ))}
            {data.length === 0 && <p className="text-center py-10 opacity-20 italic">Sem registros.</p>}
         </div>
      </section>
   );
};

const CustomTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl">
         <p className="text-[9px] font-black text-slate-500 uppercase mb-2">{label}</p>
         <p className="text-xs font-black text-emerald-500">Lucro: R$ {payload[0].value.toLocaleString()}</p>
         <p className="text-xs font-black text-sky-400">Receita: R$ {payload[1].value.toLocaleString()}</p>
      </div>
   );
   return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><p className="text-[10px] font-black text-white uppercase">{payload[0].name}</p><p className="text-sm font-black text-emerald-500">R$ {payload[0].value.toLocaleString()}</p></div>
   );
   return null;
};

const CostLegLabel = ({ label, value, color }: any) => (
   <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl"><div className="flex items-center gap-2 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${color}`} /><span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{label}</span></div><p className="text-xs font-black text-white">R$ {value.toLocaleString()}</p></div>
);

export default Performance;
