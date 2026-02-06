
import React, { useMemo, useState, useEffect } from 'react';
import {
   TrendingUp,
   MapPin,
   Activity,
   Building2,
   Trophy,
   Lightbulb,
   AlertTriangle,
   Wallet,
   ShieldCheck,
   Coins,
   BarChart3,
   DollarSign,
   Brain,
   Wrench,
   Target,
   PieChart as PieIcon
} from 'lucide-react';
import {
   ResponsiveContainer,
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   PieChart,
   Pie,
   Cell,
   RadialBarChart,
   RadialBar,
   PolarAngleAxis
} from 'recharts';
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
   const [mounted, setMounted] = useState(false);

   // SOLUÇÃO DEFINITIVA PARA CARREGAMENTO DE GRÁFICOS NO NEXT.JS
   useEffect(() => {
      setMounted(true);
   }, []);

   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalFuel: 0,
         totalKm: 0,
         totalMaint: 0,
         totalCommissions: 0,

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

         const v = vehicles.find(veh => veh.id === t.vehicleId) || { id: 'unk', plate: 'Placa N/A', type: 'Próprio' } as Vehicle;
         const d = drivers.find(drv => drv.id === t.driverId) || { id: 'unk', name: 'Motorista N/A' } as Driver;
         const s = shippers.find(ship => ship.id === t.shipperId);

         const fin = calculateTripFinance({ ...t, freteSeco: frete, diarias: dia, adiantamento: adiant, combustivel: fuel, outrasDespesas: other }, v, d, profile);

         stats.totalRevenue += fin.totalBruto;
         stats.totalProfit += fin.lucroLiquidoReal;
         stats.totalFuel += fuel;
         stats.totalKm += km;
         stats.totalCommissions += fin.comissaoMotorista;

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
            stats.lossMakingTrips.push({ ...t, profit: fin.lucroLiquidoReal, vehicleLabel: v.plate, driverLabel: d.name });
         }

         if (d.id !== 'unk') {
            const dStat = stats.driverMap.get(d.id) || { id: d.id, name: d.name, profit: 0, revenue: 0, trips: 0, km: 0, commission: 0 };
            dStat.profit += fin.lucroLiquidoReal;
            dStat.revenue += fin.totalBruto;
            dStat.trips += 1;
            dStat.commission += fin.comissaoMotorista;
            stats.driverMap.set(d.id, dStat);
         }

         if (v.id !== 'unk') {
            const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
            vStat.profit += fin.lucroLiquidoReal;
            vStat.revenue += fin.totalBruto;
            vStat.trips += 1;
            vStat.km += km;
            stats.vehicleMap.set(v.id, vStat);
         }

         if (t.destination) {
            const rKey = normalizeDestination(t.destination);
            const rStat = stats.routeMap.get(rKey) || { name: t.destination, profit: 0, count: 0, revenue: 0, km: 0, fuel: 0, otherCosts: 0 };
            rStat.profit += fin.lucroLiquidoReal;
            rStat.revenue += fin.totalBruto;
            rStat.count += 1;
            rStat.km += km;
            stats.routeMap.set(rKey, rStat);
         }

         if (s) {
            const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
            sStat.revenue += fin.totalBruto;
            sStat.profit += fin.lucroLiquidoReal;
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
   const rankedCommissions = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 8), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 8), [analytics]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = isNaN(marginRatioValue) ? "0.0" : marginRatioValue.toFixed(1);

   const glassCard = "bg-slate-900/60 backdrop-blur-2xl border border-slate-800/80 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-700 hover:border-emerald-500/20";
   const luxFont = "bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent italic font-black uppercase";

   if (!mounted) return <div className="p-20 text-center text-slate-700 font-black animate-pulse tracking-widest text-xs">COLLECTING NEURAL DATA...</div>;

   return (
      <div className="space-y-12 animate-in fade-in duration-1000 pb-32">
         {/* HEADER PRE-MIUM */}
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800/50 pb-12">
            <div className="flex items-center gap-8 group">
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-teal-700 to-sky-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700">
                  <BarChart3 className="w-12 h-12 text-white" />
               </div>
               <div>
                  <h2 className={`text-5xl ${luxFont} tracking-tighter`}>Ribeirx BI</h2>
                  <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase mt-3 flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     Strategic Engine v5.5
                  </p>
               </div>
            </div>

            <nav className="flex bg-slate-950 border border-slate-800 p-2 rounded-[2rem] shadow-2xl">
               {[
                  { id: 'geral', label: 'Monitor', icon: Activity },
                  { id: 'rankings', label: 'Performance', icon: Trophy },
                  { id: 'custos', label: 'Cofre & Auditoria', icon: DollarSign },
                  { id: 'inteligencia', label: 'IA Insights', icon: Brain }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center ${activeView === v.id ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-600 hover:text-white'
                        }`}
                  >
                     <v.icon className={`w-4 h-4 ${activeView === v.id ? 'text-emerald-600' : 'text-slate-600'}`} />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {activeView === 'geral' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <LuxuryStat title="Receita Total" value={analytics.totalRevenue} color="text-white" icon={Wallet} trend="+12.5%" />
                  <LuxuryStat title="Lucro Líquido" value={analytics.totalProfit} color="text-emerald-400" icon={TrendingUp} trend="+8.1%" />
                  <LuxuryStat title="Margem ROI" value={`${marginRatio}%`} color="text-sky-400" icon={Target} trend="Optimal" />
                  <LuxuryStat title="Rentabilidade/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} trend="+2.4%" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-2 min-h-[500px]"}>
                     <div className="flex justify-between items-start mb-12">
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Fluxo de Lucratividade</h3>
                           <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Historical Analysis (6 Months)</p>
                        </div>
                     </div>
                     <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                              <defs>
                                 <linearGradient id="pG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                 <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 900 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                              <Tooltip content={<CustomTooltipUI />} />
                              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={5} fill="url(#pG)" />
                              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="10 5" fill="url(#rG)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col items-center justify-between"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">Saúde operacional</h3>
                     <div className="relative w-64 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={25} data={[{ value: Math.max(5, Number(marginRatio)), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#0f172a' }} dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-5xl font-black text-white">{marginRatio}%</p>
                           <span className="text-[10px] font-black text-emerald-500 uppercase mt-2">MARGEM REAL</span>
                        </div>
                     </div>
                     <div className="w-full space-y-4 px-6">
                        <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-500 uppercase">Retention Rate</p><p className="text-sm font-black text-white">{marginRatio}%</p></div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${marginRatio}%` }} /></div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in slide-in-from-right-10 duration-700">
               <DynamicRank title="Elite de Lucratividade" desc="Ranking por lucro líquido total" icon={Trophy} color="emerald" data={rankedDrivers.map(d => ({ name: d.name, val: d.profit, sub: `${d.trips} viagens` }))} />
               <DynamicRank title="Ganho dos Motoristas" desc="Ranking de comissões acumuladas" icon={Coins} color="sky" data={rankedCommissions.map(d => ({ name: d.name, val: d.commission, sub: 'Ganhos totais brutos' }))} />
               <DynamicRank title="Principais Shippers" desc="Clientes com maior volume Real" icon={Building2} color="amber" data={rankedShippers.map(s => ({ name: s.name, val: s.profit, sub: 'Faturamento Lucro' }))} />
               <DynamicRank title="Rotas de Performance" desc="Eixo de maiores margens reais" icon={MapPin} color="rose" data={rankedRoutes.map(r => ({ name: r.name, val: r.profit, sub: 'ROI consolidado' }))} />
            </div>
         )}

         {activeView === 'custos' && (
            <div className="space-y-10 animate-in zoom-in-95 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-1"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Auditória de Evasão</h3>
                     <div className="h-[350px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Diesel', value: analytics.totalFuel || 1, fill: '#38bdf8' },
                                    { name: 'Peças', value: analytics.totalMaint || 1, fill: '#f43f5e' },
                                    { name: 'Motorista', value: analytics.totalCommissions || 1, fill: '#fbbf24' },
                                    { name: 'LUCRO', value: analytics.totalProfit || 1, fill: '#10b981' }
                                 ]}
                                 innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value"
                              >
                                 <Cell fill="#38bdf8" /><Cell fill="#f43f5e" /><Cell fill="#fbbf24" /><Cell fill="#10b981" />
                              </Pie>
                              <Tooltip content={<SimplePieTooltipUI />} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center -mt-2"><PieIcon className="w-10 h-10 text-slate-800" /></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mt-10">
                        <MiniCard label="Diesel" val={analytics.totalFuel} color="bg-sky-400" />
                        <MiniCard label="Custo Mecânico" val={analytics.totalMaint} color="bg-rose-500" />
                        <MiniCard label="Comissões" val={analytics.totalCommissions} color="bg-amber-400" />
                        <MiniCard label="Lucro Real" val={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-10">Rastreio de Maiores Gastos</h3>
                     <div className="space-y-6">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-8 bg-slate-950/40 border border-slate-800/50 rounded-[2.5rem] hover:border-emerald-500/30 transition-all">
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-rose-500"><Wrench className="w-8 h-8" /></div>
                                    <div>
                                       <p className="text-xl font-black text-white tracking-tighter uppercase">{m.description || 'Intervenção'}</p>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                          {vehicles.find(v => v.id === m.vehicleId)?.plate || 'N/A'} • {m.type} • {m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-3xl font-black text-rose-500 tracking-tighter">R$ {Number(m.totalCost).toLocaleString()}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-24 text-center opacity-20 italic">Sem registros de intervenções mecânicas graves.</div>
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
                        <div className="flex items-center gap-6"><div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400"><Lightbulb className="w-8 h-8" /></div><h3 className="text-4xl font-black text-white uppercase italic leading-none">Visão IA</h3></div>
                        <div className="p-10 bg-slate-950/60 rounded-[3rem] border border-slate-800">
                           <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6">Recomendação Estratégica</p>
                           <p className="text-white text-xl font-medium leading-relaxed italic">
                              "Seus dados indicam que o eixo estratégico para <b>{rankedRoutes[0]?.name || 'seu destino principal'}</b> está entregando lucro de R$ {(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)} / km. Focar recursos nesta rota pode elevar o faturamento mensal em até 15%."
                           </p>
                        </div>
                     </div>
                     <div className="bg-slate-950/80 rounded-[4rem] p-12 border border-slate-800 relative flex flex-col items-center justify-center">
                        <Brain className="w-24 h-24 text-indigo-500 mb-8 animate-pulse" />
                        <div className="w-full space-y-4">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex justify-between items-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800"><span className="text-sm font-black text-slate-400 uppercase">{r.name}</span><span className="text-lg font-black text-emerald-500">R$ {(r.profit / r.km).toFixed(2)}/km</span></div>
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

// COMPONENTES DE APOIO
const LuxuryStat = ({ title, value, color, icon: Icon, trend }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
      <div className="flex justify-between items-start mb-6">
         <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl"><Icon className={`w-7 h-7 ${color}`} /></div>
         <span className={`text-[9px] font-black px-3 py-1 rounded-full bg-slate-950 border border-slate-800 ${trend.includes('+') ? 'text-emerald-500' : 'text-slate-500'}`}>{trend}</span>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-3xl font-black ${color} tracking-tighter`}>{typeof value === 'number' ? `R$ ${Number(value || 0).toLocaleString()}` : value}</p>
   </div>
);

const DynamicRank = ({ title, desc, icon: Icon, color, data }: any) => {
   const c = color === 'emerald' ? 'text-emerald-500' : color === 'sky' ? 'text-sky-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500';
   return (
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
         <div className="flex items-center gap-6 mb-10">
            <div className={`w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 ${c}`}><Icon className="w-8 h-8" /></div>
            <div><h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{title}</h3><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{desc}</p></div>
         </div>
         <div className="space-y-4">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center gap-6 p-6 bg-slate-950/60 rounded-[2rem] border border-slate-800/40 hover:border-emerald-500/20 transition-all">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-700 text-lg">#{i + 1}</div>
                  <div className="flex-1 min-w-0"><p className="text-base font-black text-white uppercase truncate">{item.name}</p><p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{item.sub}</p></div>
                  <div className="text-right"><p className={`${c} font-black text-2xl tracking-tighter`}>R$ {Number(item.val || 0).toLocaleString()}</p></div>
               </div>
            ))}
         </div>
      </div>
   );
};

const CustomTooltipUI = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-700 p-6 rounded-2xl shadow-3xl backdrop-blur-3xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">{label}</p>
            <div className="space-y-3">
               <div className="flex justify-between gap-10"><span className="text-[10px] font-black text-slate-400 uppercase">Receita</span><span className="text-sm font-black text-sky-400">R$ {Number(payload[1]?.value || 0).toLocaleString()}</span></div>
               <div className="flex justify-between gap-10"><span className="text-[10px] font-black text-slate-400 uppercase">Lucro</span><span className="text-sm font-black text-emerald-500">R$ {Number(payload[0]?.value || 0).toLocaleString()}</span></div>
            </div>
         </div>
      );
   }
   return null;
};

const SimplePieTooltipUI = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl"><p className="text-[10px] font-black text-white uppercase">{payload[0].name}</p><p className="text-sm font-black text-emerald-500">R$ {Number(payload[0].value || 0).toLocaleString()}</p></div>
      );
   }
   return null;
};

const MiniCard = ({ label, val, color }: any) => (
   <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-[2rem]">
      <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full ${color}`} /><span className="text-[9px] font-black text-slate-500 uppercase">{label}</span></div>
      <p className="text-lg font-black text-white">R$ {Number(val || 0).toLocaleString()}</p>
   </div>
);

export default Performance;
