
import React, { useMemo, useState } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   Legend, PieChart, Pie, Cell, ComposedChart, Line, Area, AreaChart,
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
   Brain,
   ArrowRight,
   Info,
   BarChart3,
   Search,
   DollarSign,
   Calendar,
   History
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

const Performance: React.FC<PerformanceProps> = ({ trips, vehicles, drivers, shippers, profile, maintenances }) => {
   const [activeView, setActiveView] = useState<BIView>('geral');

   // SUPER ENGINE DE DADOS BI (ANALYTICS v3.0)
   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalFuel: 0,
         totalKm: 0,
         totalMaint: 0,
         totalCommissions: 0,
         totalFixedCosts: (vehicles.length * 3500), // Estimativa de custos fixos

         driverMap: new Map<string, { id: string, name: string, profit: number, revenue: number, trips: number, km: number, commission: number }>(),
         vehicleMap: new Map<string, { id: string, plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
         routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number, fuel: number, otherCosts: number }>(),
         shipperMap: new Map<string, { id: string, name: string, revenue: number, profit: number, count: number, commission: number }>(),

         maintenanceCategories: {
            'Preventiva': 0,
            'Corretiva': 0,
            'Preditiva': 0
         },
         mostExpensiveMaintenances: [] as MaintenanceRecord[],
         lossMakingTrips: [] as any[],
         monthlyData: [] as any[]
      };

      // Limitar e ordenar as manutenções mais caras
      stats.mostExpensiveMaintenances = [...maintenances]
         .sort((a, b) => b.totalCost - a.totalCost)
         .slice(0, 5);

      trips.forEach(t => {
         const v = vehicles.find(veh => veh.id === t.vehicleId);
         const d = drivers.find(drv => drv.id === t.driverId);
         const s = shippers.find(ship => ship.id === t.shipperId);
         if (!v || !d || !s) return;

         const fin = calculateTripFinance(t, v, d, profile);

         stats.totalRevenue += fin.totalBruto;
         stats.totalProfit += fin.lucroLiquidoReal;
         stats.totalFuel += t.combustivel;
         stats.totalKm += t.totalKm;
         stats.totalCommissions += fin.comissaoMotorista;

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
         dStat.km += t.totalKm;
         dStat.commission += fin.comissaoMotorista;
         stats.driverMap.set(d.id, dStat);

         const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
         vStat.profit += fin.lucroLiquidoReal;
         vStat.revenue += fin.totalBruto;
         vStat.trips += 1;
         vStat.km += t.totalKm;
         stats.vehicleMap.set(v.id, vStat);

         const rKey = normalizeDestination(t.destination);
         const rStat = stats.routeMap.get(rKey) || { name: t.destination, profit: 0, count: 0, revenue: 0, km: 0, fuel: 0, otherCosts: 0 };
         if (t.destination.length > rStat.name.length) rStat.name = t.destination;
         rStat.profit += fin.lucroLiquidoReal;
         rStat.revenue += fin.totalBruto;
         rStat.count += 1;
         rStat.km += t.totalKm;
         rStat.fuel += t.combustivel;
         rStat.otherCosts += t.outrasDespesas;
         stats.routeMap.set(rKey, rStat);

         const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
         sStat.revenue += fin.totalBruto;
         sStat.profit += fin.lucroLiquidoReal;
         sStat.count += 1;
         sStat.commission += fin.comissaoMotorista;
         stats.shipperMap.set(s.id, sStat);
      });

      maintenances.forEach(m => {
         stats.totalMaint += m.totalCost;
         if (stats.maintenanceCategories[m.type] !== undefined) {
            stats.maintenanceCategories[m.type] += m.totalCost;
         }
         const vStat = stats.vehicleMap.get(m.vehicleId);
         if (vStat) vStat.maint += m.totalCost;
      });

      return stats;
   }, [trips, vehicles, drivers, shippers, profile, maintenances]);

   // Data for Rankings
   const rankedDrivers = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedCommissions = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 10), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedMaintVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 10), [analytics]);

   const marginRatio = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100).toFixed(1);

   return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-24">
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 border-b border-slate-800 pb-10">
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                     <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                     <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Super BI</h2>
                     <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Análise de Performance Ribeirx v3.0
                     </p>
                  </div>
               </div>
            </div>

            <nav className="flex bg-slate-900 border border-slate-800 p-2 rounded-3xl shadow-xl">
               {[
                  { id: 'geral', label: 'Geral', icon: Activity },
                  { id: 'rankings', label: 'Rankings', icon: Trophy },
                  { id: 'custos', label: 'Auditoria de Custos', icon: DollarSign },
                  { id: 'inteligencia', label: 'Inteligência', icon: Lightbulb }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeView === v.id ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-slate-500 hover:text-slate-200'
                        }`}
                  >
                     <v.icon className={`w-4 h-4 ${activeView === v.id ? 'text-emerald-950' : 'text-emerald-500'}`} />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {/* 1. VISÃO GERAL */}
         {activeView === 'geral' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatItem title="Faturamento Total" value={analytics.totalRevenue} color="text-white" icon={Wallet} />
                  <StatItem title="Lucro Líquido Real" value={analytics.totalProfit} color="text-emerald-500" icon={TrendingUp} />
                  <StatItem title="Eficiência (Margem)" value={`${marginRatio}%`} color="text-sky-400" icon={Target} />
                  <StatItem title="Lucro p/ KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <LineChartIcon className="w-64 h-64" />
                     </div>
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Fluxo de Lucratividade</h3>
                     <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={[
                              { name: 'Início', profit: 0, revenue: 0 },
                              { name: 'Operação', profit: analytics.totalProfit * 0.4, revenue: analytics.totalRevenue * 0.4 },
                              { name: 'Atual', profit: analytics.totalProfit, revenue: analytics.totalRevenue },
                           ]}>
                              <defs>
                                 <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontWeight: 'bold' }} />
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={4} fill="url(#profitGrad)" />
                              <Area type="monotone" dataKey="revenue" stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col items-center text-center">
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Saúde Financeira</h3>
                     <div className="relative w-48 h-48 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[{ name: 'ROI', value: Number(marginRatio), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 40]} angleAxisId={0} tick={false} />
                              <RadialBar background dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-4xl font-black text-white tracking-tighter">{marginRatio}%</p>
                           <p className="text-[9px] font-black text-slate-500 uppercase">Margem Operacional</p>
                        </div>
                     </div>
                     <div className="space-y-4 w-full">
                        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800">
                           <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Custo Total / Receita</p>
                           <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (100 - Number(marginRatio)))}%` }} />
                           </div>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium italic">
                           Sua operação retém R$ {((analytics.totalProfit / analytics.totalRevenue) * 1).toLocaleString(undefined, { maximumFractionDigits: 2 })} de cada R$ 1,00 faturado.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 2. RANKINGS (HALL DA FAMA) */}
         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-right-10 duration-500">
               <RankingTable
                  title="Motoristas Campeões (Lucro)"
                  icon={Trophy}
                  color="text-amber-400"
                  data={rankedDrivers.map(d => ({ name: d.name, value: d.profit, subValue: `${d.trips} viagens` }))}
               />
               <RankingTable
                  title="Ranking de Comissões Pago"
                  icon={Coins}
                  color="text-emerald-400"
                  data={rankedCommissions.map(d => ({ name: d.name, value: d.commission, subValue: `Total acumulado` }))}
               />
               <RankingTable
                  title="Transportadoras Rentáveis"
                  icon={Building2}
                  color="text-sky-400"
                  data={rankedShippers.map(s => ({ name: s.name, value: s.profit, subValue: `Lucro Líquido Real` }))}
               />
               <RankingTable
                  title="Custos por Veículo (Drenos)"
                  icon={AlertTriangle}
                  color="text-rose-500"
                  data={rankedMaintVehicles.filter(v => v.maint > 0).map(v => ({ name: v.plate, value: v.maint, subValue: `Gastos Totais em Manutenção` }))}
               />
               <RankingTable
                  title="Rotas Estratégicas (Margem)"
                  icon={MapPin}
                  color="text-rose-400"
                  data={rankedRoutes.map(r => ({ name: r.name, value: r.profit, subValue: `R$ ${(r.profit / r.km).toFixed(2)} / km` }))}
               />
            </div>
         )}

         {/* 3. AUDITORIA DE CUSTOS */}
         {activeView === 'custos' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[3rem] p-10">
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Composição de Gastos</h3>
                     <div className="h-64 mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Diesel', value: analytics.totalFuel, fill: '#38bdf8' },
                                    { name: 'Manutenção', value: analytics.totalMaint, fill: '#f43f5e' },
                                    { name: 'Comissões', value: analytics.totalCommissions, fill: '#fbbf24' },
                                    { name: 'Custos Fixos', value: analytics.totalFixedCosts, fill: '#6366f1' }
                                 ].filter(i => i.value > 0)}
                                 innerRadius={70}
                                 outerRadius={90}
                                 dataKey="value"
                              >
                                 <Cell fill="#38bdf8" />
                                 <Cell fill="#f43f5e" />
                                 <Cell fill="#fbbf24" />
                                 <Cell fill="#6366f1" />
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-4">
                        {[
                           { label: 'Diesel', value: analytics.totalFuel, color: 'bg-sky-400' },
                           { label: 'Manutenção', value: analytics.totalMaint, color: 'bg-rose-500' },
                           { label: 'Comissões', value: analytics.totalCommissions, color: 'bg-amber-400' },
                           { label: 'Custos Fixos', value: analytics.totalFixedCosts, color: 'bg-indigo-500' }
                        ].map(item => (
                           <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                 <span className="text-xs font-bold text-slate-400">{item.label}</span>
                              </div>
                              <span className="text-xs font-black text-white">R$ {item.value.toLocaleString()}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-10">
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Manutenções mais Caras (Drenos de Caixa)</h3>
                     <div className="space-y-4">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-rose-500/50 transition-all">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500">
                                       <Wrench className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <p className="text-white font-black">{m.description || 'Manutenção não descrita'}</p>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase">
                                          {vehicles.find(v => v.id === m.vehicleId)?.plate} • {m.type} • {new Date(m.date).toLocaleDateString()}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-rose-500 font-black text-xl">R$ {m.totalCost.toLocaleString()}</p>
                                    <p className="text-[8px] text-slate-600 font-black uppercase">Custo Integral</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full py-10 opacity-30 italic">Nenhum registro de manutenção.</div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 4. INTELIGÊNCIA ESTRATÉGICA */}
         {activeView === 'inteligencia' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/10 rounded-[3rem] p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
                     <Brain className="w-64 h-64 text-indigo-500" />
                  </div>
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <header>
                           <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Análise de ROI de Rotas</h3>
                           <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mt-2">Está valendo a pena fazer essa viagem?</p>
                        </header>
                        <div className="space-y-6">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex items-center justify-between p-6 bg-slate-950/80 rounded-3xl border border-slate-800">
                                 <div>
                                    <p className="text-white font-black uppercase text-sm tracking-tighter">{r.name}</p>
                                    <div className="flex gap-4 mt-1">
                                       <span className="text-[9px] text-emerald-500 font-bold uppercase">R$ {(r.profit / r.km).toFixed(2)} lucro/km</span>
                                       <span className="text-[9px] text-slate-500 font-bold uppercase">{r.count} viagens</span>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="flex items-center gap-1 text-emerald-500 font-black">
                                       <TrendingUp className="w-4 h-4" />
                                       {((r.profit / r.revenue) * 100).toFixed(0)}%
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alerta: Viagens com Prejuízo</h4>
                        {analytics.lossMakingTrips.length > 0 ? (
                           analytics.lossMakingTrips.map((t, i) => (
                              <div key={i} className="flex items-center gap-4 text-rose-500">
                                 <AlertTriangle className="w-5 h-5 shrink-0" />
                                 <div className="flex-1">
                                    <p className="text-[11px] font-black uppercase">{t.destination}</p>
                                    <p className="text-[9px] text-slate-500 font-medium">Veículo {t.vehicleLabel} • Prejuízo de R$ {Math.abs(t.profit).toLocaleString()}</p>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-700" />
                              </div>
                           ))
                        ) : (
                           <div className="flex items-center gap-4 text-emerald-500 grayscale opacity-40">
                              <ShieldCheck className="w-5 h-5" />
                              <p className="text-xs font-bold italic">Nenhuma viagem registrando prejuízo operacional hoje.</p>
                           </div>
                        )}

                        <div className="pt-8 border-t border-slate-800 mt-4">
                           <div className="flex items-center gap-4 p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                              <Lightbulb className="w-8 h-8 text-indigo-400" />
                              <p className="text-[10px] text-indigo-200 font-medium leading-relaxed italic">
                                 "Sua rota aérea de {rankedRoutes[0]?.name || '---'} é a mais lucrativa por KM. Foque seus melhores veículos e motoristas nesta operação para maximizar o ROI."
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

// COMPONENTES AUXILIARES
const StatItem = ({ title, value, color, icon: Icon }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl group hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between mb-6">
         <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
            <Icon className={`w-6 h-6 ${color}`} />
         </div>
         <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-3 h-3 text-slate-600" />
         </div>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className={`text-2xl font-black ${color} tracking-tighter`}>
         {typeof value === 'number' ? `R$ ${value.toLocaleString()}` : value}
      </p>
   </div>
);

const RankingTable = ({ title, icon: Icon, color, data }: any) => (
   <section className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
         <h3 className="text-xl font-black text-white flex items-center gap-4 uppercase italic">
            <Icon className={`w-6 h-6 ${color}`} /> {title}
         </h3>
      </header>
      <div className="space-y-4">
         {data.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-6 p-6 bg-slate-950/50 border border-slate-800 rounded-[2rem] hover:border-emerald-500/30 transition-all group">
               <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-500 group-hover:text-white transition-colors">
                  #{i + 1}
               </div>
               <div className="flex-1">
                  <p className="text-white font-black text-base tracking-tight uppercase">{item.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.subValue}</p>
               </div>
               <div className="text-right">
                  <p className={`${color} font-black text-xl tracking-tighter`}>R$ {item.value.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-600 font-black uppercase">Resultado</p>
               </div>
            </div>
         ))}
         {data.length === 0 && <p className="text-center py-10 opacity-20 italic">Sem dados suficientes.</p>}
      </div>
   </section>
);

const LineChartIcon = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
   </svg>
);

export default Performance;
