
import React, { useMemo, useState } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   Legend, PieChart, Pie, Cell, ComposedChart, Line,
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

   // SUPER ENGINE DE DADOS BI (ANALYTICS v3.9 - Ultimate Stability)
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
         // Safe destructuring
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
            dStat.km += km;
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
            rStat.fuel += fuel;
            rStat.otherCosts += other;
            stats.routeMap.set(rKey, rStat);
         }

         if (s) {
            const sStat = stats.shipperMap.get(s.id) || { id: s.id, name: s.name, revenue: 0, profit: 0, count: 0, commission: 0 };
            sStat.revenue += (fin.totalBruto || 0);
            sStat.profit += (fin.lucroLiquidoReal || 0);
            sStat.count += 1;
            sStat.commission += (fin.comissaoMotorista || 0);
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
   const rankedMaintVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 8), [analytics]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = isNaN(marginRatioValue) ? "0.0" : marginRatioValue.toFixed(1);

   const glassCard = "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group";

   return (
      <div className="space-y-10 animate-in fade-in duration-700 pb-32">
         {/* HEADER BLINDADO */}
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800/50 pb-10">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-900/40">
                  <BarChart3 className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Sua Performance</h2>
                  <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Dados Consolidados Ribeirx v3.9</p>
               </div>
            </div>

            <nav className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-xl">
               {[
                  { id: 'geral', label: 'Dashboard', icon: Activity },
                  { id: 'rankings', label: 'Rankings', icon: Trophy },
                  { id: 'custos', label: 'Auditoria', icon: DollarSign },
                  { id: 'inteligencia', label: 'Sugestões', icon: Lightbulb }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === v.id ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-600 hover:text-white'
                        }`}
                  >
                     <v.icon className="w-3.5 h-3.5" />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {/* 1. DASHBOARD GERAL - NOVO GRÁFICO DE BARRAS */}
         {activeView === 'geral' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DeepStat title="Faturamento Bruto" value={analytics.totalRevenue} color="text-white" icon={Wallet} />
                  <DeepStat title="Lucro Líquido" value={analytics.totalProfit} color="text-emerald-500" icon={TrendingUp} />
                  <DeepStat title="Margem Média" value={`${marginRatio}%`} color="text-sky-400" icon={Target} />
                  <DeepStat title="Lucro/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Evolução do Faturamento vs Lucro</h3>
                     <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <Tooltip content={<SimpleTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                              <Bar dataKey="revenue" name="Receita" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={40} />
                              <Bar dataKey="profit" name="Lucro" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col justify-center items-center text-center"}>
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Saúde Operacional</h3>
                     <div className="relative w-56 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ value: Math.max(2, Number(marginRatio)), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#0f172a' }} dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-4xl font-black text-white">{marginRatio}%</p>
                           <span className="text-[10px] text-slate-500 font-black uppercase">KPI Global</span>
                        </div>
                     </div>
                     <div className="mt-8 w-full space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                           <span>Despesas</span>
                           <span>{(100 - Number(marginRatio)).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-rose-500" style={{ width: `${100 - Number(marginRatio)}%` }} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* 2. RANKINGS - HALL DA FAMA */}
         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-700">
               <SimpleRanking title="Maiores Lucros (Motoristas)" icon={Trophy} color="text-amber-500" data={rankedDrivers.map(d => ({ name: d.name, value: d.profit, sub: `${d.trips} viagens` }))} />
               <SimpleRanking title="Ranking de Comissões" icon={Coins} color="text-emerald-500" data={rankedCommissions.map(d => ({ name: d.name, value: d.commission, sub: `Rendimento bruto` }))} />
               <SimpleRanking title="Clientes mais Rentáveis" icon={Building2} color="text-sky-500" data={rankedShippers.map(s => ({ name: s.name, value: s.profit, sub: `Faturamento Limpo` }))} />
               <SimpleRanking title="Drenos de Manutenção" icon={AlertTriangle} color="text-rose-500" data={rankedMaintVehicles.filter(v => v.maint > 0).map(v => ({ name: v.plate, value: v.maint, sub: `Custo em Peças/Mão de Obra` }))} />
            </div>
         )}

         {/* 3. AUDITORIA - COMPONENTES BLINDADOS CONTRA CRASH */}
         {activeView === 'custos' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={glassCard + " lg:col-span-1"}>
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Divisão de Custos</h3>
                     <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Diesel', value: Number(analytics.totalFuel || 1), fill: '#38bdf8' },
                                    { name: 'Peças', value: Number(analytics.totalMaint || 1), fill: '#f43f5e' },
                                    { name: 'Pessoal', value: Number(analytics.totalCommissions || 1), fill: '#fbbf24' },
                                    { name: 'Lucro', value: Number(analytics.totalProfit || 1), fill: '#10b981' }
                                 ]}
                                 innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value"
                              >
                                 <Cell fill="#38bdf8" /><Cell fill="#f43f5e" /><Cell fill="#fbbf24" /><Cell fill="#10b981" />
                              </Pie>
                              <Tooltip content={<MiniPieTooltip />} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-3 mt-4">
                        <SimpleLegend label="Combustível" value={analytics.totalFuel} color="bg-sky-400" />
                        <SimpleLegend label="Manutenções" value={analytics.totalMaint} color="bg-rose-500" />
                        <SimpleLegend label="Comissões" value={analytics.totalCommissions} color="bg-amber-400" />
                        <SimpleLegend label="Resultado Real" value={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Auditoria de Maiores Gastos</h3>
                     <div className="space-y-4">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-6 bg-slate-950/80 border border-slate-800 rounded-3xl">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500"><Wrench className="w-6 h-6" /></div>
                                    <div>
                                       <p className="text-white font-black uppercase text-sm">{m.description || 'Intervenção Mecânica'}</p>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase">
                                          {vehicles.find(v => v.id === m.vehicleId)?.plate || 'VEÍCULO N/A'} • {m.type} • {m.date ? new Date(m.date).toLocaleDateString() : 'SEM DATA'}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-rose-500 font-black text-xl">R$ {Number(m.totalCost || 0).toLocaleString()}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-20 text-center opacity-30 italic"><History className="w-12 h-12 mx-auto mb-4" /><p>Sem gastos elevados registrados.</p></div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'inteligencia' && (
            <div className="animate-in fade-in duration-500">
               <div className={glassCard + " bg-gradient-to-br from-indigo-950/20 to-slate-900"}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <h3 className="text-3xl font-black text-white uppercase italic">Análise de Lucro/KM</h3>
                        <div className="space-y-3">
                           {rankedRoutes.slice(0, 4).map((r, i) => (
                              <div key={i} className="flex items-center justify-between p-6 bg-slate-950/60 border border-slate-800 rounded-2xl">
                                 <p className="text-white font-black uppercase text-xs">{r.name}</p>
                                 <div className="text-right">
                                    <p className="text-emerald-500 font-black">R$ {(r.profit / r.km).toFixed(2)} / KM</p>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase">{r.count} Viagens</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="flex flex-col justify-center items-center p-10 bg-slate-950/40 rounded-3xl border border-slate-800">
                        <Lightbulb className="w-12 h-12 text-indigo-400 mb-6" />
                        <p className="text-lg font-black text-white uppercase mb-4">Dica Estratégica</p>
                        <p className="text-slate-400 text-sm text-center italic leading-relaxed">
                           "Suas rotas para <b>{rankedRoutes[0]?.name || '...'}</b> estão rendendo uma margem superior à média da frota. Considere priorizar o envio de mais veículos para essa região para maximizar seu lucro mensal."
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// --- COMPONENTES ATÔMICOS ---

const DeepStat = ({ title, value, color, icon: Icon }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl group hover:border-slate-600 transition-all">
      <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 mb-6"><Icon className={`w-5 h-5 ${color}`} /></div>
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-black ${color} tracking-tighter`}>{typeof value === 'number' ? `R$ ${Number(value || 0).toLocaleString()}` : value}</p>
   </div>
);

const SimpleRanking = ({ title, icon: Icon, color, data }: any) => (
   <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
         <Icon className={`w-6 h-6 ${color}`} />
         <h3 className="text-lg font-black text-white uppercase italic">{title}</h3>
      </div>
      <div className="space-y-3">
         {data.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/60 rounded-2xl border border-slate-800/40 hover:bg-slate-950 transition-colors">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-slate-600">#{i + 1}</div>
               <div className="flex-1"><p className="text-sm font-black text-white uppercase truncate">{item.name}</p><p className="text-[9px] text-slate-500 font-black">{item.sub}</p></div>
               <div className="text-right"><p className={`${color} font-black text-lg tracking-tighter`}>R$ {Number(item.value || 0).toLocaleString()}</p></div>
            </div>
         ))}
         {data.length === 0 && <p className="text-center py-10 opacity-20 italic">Dados insuficientes.</p>}
      </div>
   </section>
);

const SimpleTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
      return (
         <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">{label}</p>
            <p className="text-xs font-black text-sky-400">Receita: R$ {Number(payload[0].value || 0).toLocaleString()}</p>
            <p className="text-xs font-black text-emerald-500">Lucro: R$ {Number(payload[1].value || 0).toLocaleString()}</p>
         </div>
      );
   }
   return null;
};

const MiniPieTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl"><p className="text-[9px] font-black text-white uppercase">{payload[0].name}</p><p className="text-sm font-black text-emerald-500">R$ {Number(payload[0].value || 0).toLocaleString()}</p></div>
   );
   return null;
};

const SimpleLegend = ({ label, value, color }: any) => (
   <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl">
      <div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full ${color}`} /><span className="text-[9px] font-black text-slate-500 uppercase">{label}</span></div>
      <span className="text-xs font-black text-white">R$ {Number(value || 0).toLocaleString()}</span>
   </div>
);

export default Performance;
