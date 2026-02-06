
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
   ChevronRight,
   History,
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
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   // ANALYTICS ENGINE v6.0 - NO-DEPENDENCY SVG ENGINE (Failsafe)
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

         const v = vehicles.find(veh => veh.id === t.vehicleId) || { id: 'u', plate: 'Frota N/A' } as Vehicle;
         const d = drivers.find(drv => drv.id === t.driverId) || { id: 'u', name: 'Motorista N/A' } as Driver;
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

         if (d.id !== 'u') {
            const dStat = stats.driverMap.get(d.id) || { id: d.id, name: d.name, profit: 0, revenue: 0, trips: 0, km: 0, commission: 0 };
            dStat.profit += (fin.lucroLiquidoReal || 0);
            dStat.revenue += (fin.totalBruto || 0);
            dStat.trips += 1;
            dStat.commission += (fin.comissaoMotorista || 0);
            stats.driverMap.set(d.id, dStat);
         }

         if (v.id !== 'u') {
            const vStat = stats.vehicleMap.get(v.id) || { id: v.id, plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
            vStat.profit += (fin.lucroLiquidoReal || 0);
            vStat.revenue += (fin.totalBruto || 0);
            vStat.trips += 1;
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

   const glassCard = "bg-slate-900/60 backdrop-blur-3xl border border-slate-800/80 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-700 hover:border-emerald-500/30 group";
   const luxuryTitle = "bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent italic font-black uppercase";

   if (!mounted) return <div className="p-32 flex items-center justify-center font-black text-slate-800 tracking-[1em] animate-pulse">INITIATING BI ENGINE...</div>;

   return (
      <div className="space-y-16 animate-in fade-in duration-1000 pb-32">
         {/* HEADER PREMIUM Neural 5.0 */}
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800/50 pb-12">
            <div className="flex items-center gap-10 group">
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 via-teal-700 to-sky-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-6 group-hover:rotate-0 transition-all duration-700">
                  <BarChart3 className="w-12 h-12 text-white" />
               </div>
               <div>
                  <h2 className={`text-6xl ${luxuryTitle} tracking-tighter leading-none`}>Neural BI</h2>
                  <p className="text-slate-500 text-[10px] font-black tracking-[0.5em] uppercase mt-4 flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                     Strategic Analytics v6.0 • Fully Blinded
                  </p>
               </div>
            </div>

            <nav className="flex bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-2 rounded-[2.5rem] shadow-2xl scale-110">
               {[
                  { id: 'geral', label: 'Monitor', icon: Activity },
                  { id: 'rankings', label: 'Eilte', icon: Trophy },
                  { id: 'custos', label: 'Cofre', icon: DollarSign },
                  { id: 'inteligencia', label: 'Cérebro', icon: Brain }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-10 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4 ${activeView === v.id ? 'bg-white text-slate-950 shadow-2xl' : 'text-slate-600 hover:text-white'
                        }`}
                  >
                     <v.icon className={`w-4 h-4 ${activeView === v.id ? 'text-emerald-500' : ''}`} />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {activeView === 'geral' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <PremiumStat title="Receita Consolidada" value={analytics.totalRevenue} color="text-white" icon={Wallet} trend="+12%" />
                  <PremiumStat title="Lucro Líquido Real" value={analytics.totalProfit} color="text-emerald-400" icon={TrendingUp} trend="+7.5%" />
                  <PremiumStat title="ROI de Operação" value={`${marginRatio}%`} color="text-sky-400" icon={Target} trend="Optimal" />
                  <PremiumStat title="Rentabilidade/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} trend="+3%" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className={glassCard + " lg:col-span-2 min-h-[550px]"}>
                     <div className="flex justify-between items-start mb-12">
                        <div>
                           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Fluxo de Lucratividade</h3>
                           <p className="text-slate-500 text-[10px] font-black tracking-[0.3em] uppercase mt-3">Análise Temporal de 6 Meses (Neural SVG)</p>
                        </div>
                     </div>
                     <div className="h-[380px] w-full relative">
                        {/* CUSTOM FAILSAFE SVG CHART */}
                        <NeuralAreaChart data={chartData} />
                     </div>
                  </div>

                  <div className={glassCard + " flex flex-col items-center justify-between py-16"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter text-center">Eficiência Real</h3>
                     <div className="relative w-72 h-72">
                        <NeuralRadialGauge value={Number(marginRatio)} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-6xl font-black text-white tracking-tighter">{marginRatio}%</p>
                           <span className="text-[10px] font-black text-emerald-500 uppercase mt-2 px-3 py-1 bg-emerald-500/10 rounded-full">Saúde Operacional</span>
                        </div>
                     </div>
                     <div className="w-full space-y-4 px-10">
                        <div className="flex justify-between items-center"><p className="text-[10px] font-black text-slate-500 uppercase">Fator de Retenção</p><p className="text-sm font-black text-white">{marginRatio}%</p></div>
                        <div className="h-3 bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${marginRatio}%` }} /></div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 animate-in slide-in-from-right-10 duration-700">
               <EliteRanking title="Performance de Lucro" desc="Motoristas que mais geraram retorno líquido" icon={Trophy} color="emerald" data={rankedDrivers.map(d => ({ name: d.name, val: d.profit, sub: `${d.trips} Trips Realizadas` }))} />
               <EliteRanking title="Ranking de Comissões" desc="Total de ganhos brutos recebidos pelos motoristas" icon={Coins} color="sky" data={rankedCommissions.map(d => ({ name: d.name, val: d.commission, sub: 'Ganhos Acumulados' }))} />
               <EliteRanking title="Principais Clientes" desc="Maiores geradores de faturamento e lucro" icon={Building2} color="amber" data={rankedShippers.map(s => ({ name: s.name, val: s.profit, sub: 'Parceria de Alto Nível' }))} />
               <EliteRanking title="Rotas de Alta Margem" desc="Top 8 destinos mais rentáveis da frota" icon={MapPin} color="rose" data={rankedRoutes.map(r => ({ name: r.name, val: r.profit, sub: 'Performance Logística' }))} />
            </div>
         )}

         {activeView === 'custos' && (
            <div className="space-y-12 animate-in zoom-in-95 duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className={glassCard + " lg:col-span-1"}>
                     <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-12 text-center">Auditoria de Evasão</h3>
                     <div className="h-[380px] w-full flex items-center justify-center relative">
                        <NeuralPieChart data={[
                           { label: 'Diesel', value: analytics.totalFuel, color: '#38bdf8' },
                           { label: 'Manutenção', value: analytics.totalMaint, color: '#f43f5e' },
                           { label: 'Comissão', value: analytics.totalCommissions, color: '#fbbf24' },
                           { label: 'Lucro', value: analytics.totalProfit, color: '#10b981' }
                        ]} />
                     </div>
                     <div className="grid grid-cols-2 gap-6 mt-12">
                        <MiniStat label="Diesel" val={analytics.totalFuel} color="bg-sky-400" />
                        <MiniStat label="Peças" val={analytics.totalMaint} color="bg-rose-500" />
                        <MiniStat label="Comissão" val={analytics.totalCommissions} color="bg-amber-400" />
                        <MiniStat label="LUCRO" val={analytics.totalProfit} color="bg-emerald-500" />
                     </div>
                  </div>

                  <div className={glassCard + " lg:col-span-2"}>
                     <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-10">Rastreio de Maiores Gastos</h3>
                     <div className="space-y-6">
                        {analytics.mostExpensiveMaintenances.length > 0 ? (
                           analytics.mostExpensiveMaintenances.map((m, i) => (
                              <div key={i} className="flex items-center justify-between p-10 bg-slate-950/40 border border-slate-800/80 rounded-[2.5rem] hover:border-rose-500/40 transition-all hover:translate-x-3 group/item shadow-xl">
                                 <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-rose-500 group-hover/item:scale-110 transition-transform"><Wrench className="w-8 h-8" /></div>
                                    <div>
                                       <p className="text-2xl font-black text-white uppercase tracking-tighter">{m.description || 'Intervenção'}</p>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">
                                          {vehicles.find(v => v.id === m.vehicleId)?.plate || 'Frota N/A'} • {m.type} • {m.date ? new Date(m.date).toLocaleDateString() : 'Auditoria Manual'}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-4xl font-black text-rose-500 tracking-tighter">R$ {Number(m.totalCost).toLocaleString()}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="py-24 text-center opacity-20"><History className="w-20 h-20 mx-auto mb-6" /><p className="text-xl font-black uppercase italic tracking-widest">Nenhuma intervenção mecânica grave.</p></div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'inteligencia' && (
            <div className="animate-in zoom-in-95 duration-700">
               <div className={glassCard + " bg-gradient-to-br from-indigo-950/20 via-slate-950 to-indigo-950/20 border-indigo-500/20"}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 py-16">
                     <div className="space-y-12">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl shadow-indigo-500/20"><Lightbulb className="w-10 h-10" /></div>
                           <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Visão Neural</h3>
                        </div>
                        <div className="space-y-6">
                           <div className="p-10 bg-slate-950/80 rounded-[3rem] border border-slate-800 shadow-2xl">
                              <p className="text-indigo-400 text-[11px] font-black uppercase tracking-[0.5em] mb-6">Recomendação Estratégica</p>
                              <p className="text-white text-2xl font-medium leading-relaxed italic">
                                 "Sua rota para <b>{rankedRoutes[0]?.name || 'seu destino principal'}</b> está entregando lucro de R$ {(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}/km. Concentrar 20% mais frota neste eixo elevaria o lucro mensal projetado em R$ {(analytics.totalProfit * 0.15).toLocaleString()}."
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="bg-slate-950/90 rounded-[4rem] p-16 border border-slate-800 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 group-hover:via-emerald-500 transition-all duration-1000" />
                        <Brain className="w-32 h-32 text-indigo-500 mb-10 animate-pulse" />
                        <h4 className="text-3xl font-black text-white uppercase italic mb-8 tracking-tighter">ROI de Alta Performance</h4>
                        <div className="w-full space-y-4">
                           {rankedRoutes.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex justify-between items-center p-8 bg-slate-900/60 rounded-3xl border border-slate-800 group hover:border-indigo-500/40 transition-all">
                                 <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{r.name}</span>
                                 <span className="text-xl font-black text-emerald-500">R$ {(r.profit / r.km).toFixed(2)}/km</span>
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

// ------------------------------------------------------------------------------------------------
// NEURAL CUSTOM SVG COMPONENTS (Zero Library, Failsafe Graphics)
// ------------------------------------------------------------------------------------------------

const NeuralAreaChart = ({ data }: { data: any[] }) => {
   if (!data || data.length === 0) return null;

   const width = 800;
   const height = 400;
   const padding = 40;

   const maxProfit = Math.max(...data.map(d => d.profit), 100);
   const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
   const globalMax = Math.max(maxProfit, maxRevenue) * 1.1;

   const getX = (index: number) => (index * (width - 2 * padding)) / (data.length - 1) + padding;
   const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / globalMax;

   const profitPoints = data.map((d, i) => `${getX(i)},${getY(d.profit)}`).join(' ');
   const revenuePoints = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ');

   const profitPath = `M ${getX(0)},${height - padding} L ${profitPoints} L ${getX(data.length - 1)},${height - padding} Z`;
   const revenuePath = `M ${getX(0)},${getY(data[0].revenue)} ${data.slice(1).map((d, i) => `L ${getX(i + 1)},${getY(d.revenue)}`).join(' ')}`;

   return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-2xl overflow-visible">
         <defs>
            <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.6" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
         </defs>

         {/* Grid Lines */}
         {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <line key={i} x1={padding} y1={getY(globalMax * v)} x2={width - padding} y2={getY(globalMax * v)} stroke="#334155" strokeWidth="1" strokeDasharray="5,5" opacity="0.2" />
         ))}

         {/* Profit Area */}
         <path d={profitPath} fill="url(#pGrad)" className="animate-in fade-in duration-1000" />
         <polyline points={profitPoints} fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

         {/* Revenue Line */}
         <path d={revenuePath} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="10,5" opacity="0.6" />

         {/* Vertical Labels */}
         {data.map((d, i) => (
            <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fill="#475569" className="text-[14px] font-black uppercase tracking-tighter">{d.name}</text>
         ))}

         {/* Data Points */}
         {data.map((d, i) => (
            <circle key={i} cx={getX(i)} cy={getY(d.profit)} r="6" fill="#10b981" stroke="#0f172a" strokeWidth="3" />
         ))}
      </svg>
   );
};

const NeuralRadialGauge = ({ value }: { value: number }) => {
   const radius = 90;
   const circum = 2 * Math.PI * radius;
   const offset = circum - (Math.min(value, 100) / 100) * circum;

   return (
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
         <circle cx="100" cy="100" r={radius} fill="none" stroke="#0f172a" strokeWidth="18" />
         <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="url(#gGrad)" strokeWidth="22"
            strokeDasharray={circum} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
         />
         <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#0ea5e9" /></linearGradient>
         </defs>
      </svg>
   );
};

const NeuralPieChart = ({ data }: { data: any[] }) => {
   const radius = 100;
   const center = 150;
   let cumulativeAngle = 0;
   const total = data.reduce((acc, d) => acc + (d.value || 0), 1) || 1;

   return (
      <svg viewBox="0 0 300 300" className="w-full h-full scale-110 drop-shadow-3xl">
         {data.map((d, i) => {
            const perc = (d.value || 0) / total;
            const angle = perc * 360;
            const x1 = center + radius * Math.cos((Math.PI * cumulativeAngle) / 180);
            const y1 = center + radius * Math.sin((Math.PI * cumulativeAngle) / 180);
            cumulativeAngle += angle;
            const x2 = center + radius * Math.cos((Math.PI * cumulativeAngle) / 180);
            const y2 = center + radius * Math.sin((Math.PI * cumulativeAngle) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            const pathData = `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;

            return (
               <g key={i} className="hover:scale-105 transition-all duration-500 origin-center cursor-pointer">
                  <path d={pathData} fill={d.color} stroke="#0f172a" strokeWidth="4" />
               </g>
            );
         })}
         <circle cx={center} cy={center} r="65" fill="#0f172a" opacity="0.5" />
      </svg>
   );
};

const PremiumStat = ({ title, value, color, icon: Icon, trend }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[80px] translate-x-16 -translate-y-16 group-hover:bg-white/10 transition-all pointer-events-none" />
      <div className="flex justify-between items-start mb-8">
         <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 shadow-xl group-hover:scale-110 transition-all duration-700"><Icon className={`w-8 h-8 ${color}`} /></div>
         <span className={`text-[10px] font-black px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 ${trend.includes('+') ? 'text-emerald-500 shadow-emerald-500/10' : 'text-slate-500'} shadow-lg`}>{trend}</span>
      </div>
      <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className={`text-4xl font-black ${color} tracking-tighter`}>{typeof value === 'number' ? `R$ ${Number(value).toLocaleString()}` : value}</p>
   </div>
);

const EliteRanking = ({ title, desc, icon: Icon, color, data }: any) => {
   const c = color === 'emerald' ? 'text-emerald-500' : color === 'sky' ? 'text-sky-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500';
   return (
      <div className="bg-slate-900/60 border border-slate-800/80 p-12 rounded-[3.5rem] shadow-2xl group/rank">
         <div className="flex items-center gap-8 mb-12">
            <div className={`w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 ${c} group-hover/rank:rotate-12 transition-all`}><Icon className="w-10 h-10" /></div>
            <div>
               <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{title}</h3>
               <p className="text-[11px] text-slate-500 uppercase font-bold tracking-[0.2em]">{desc}</p>
            </div>
         </div>
         <div className="space-y-6">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center gap-8 p-8 bg-slate-950/60 rounded-[2.5rem] border border-slate-800/50 hover:border-emerald-500/20 transition-all shadow-xl group/item">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${i < 3 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900 text-slate-700'} border border-slate-800 shadow-inner group-hover/item:scale-110 transition-transform`}>
                     {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-2xl font-black text-white uppercase truncate tracking-tighter">{item.name}</p>
                     <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.sub}</p>
                  </div>
                  <div className="text-right">
                     <p className={`${c} font-black text-3xl tracking-tighter`}>R$ {Number(item.val).toLocaleString()}</p>
                     <ChevronRight className="w-4 h-4 text-slate-800 inline-block ml-2 group-hover/item:translate-x-1 transition-transform" />
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

const MiniStat = ({ label, val, color }: any) => (
   <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-[2rem] shadow-xl group hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-3"><div className={`w-2.5 h-2.5 rounded-full ${color} shadow-[0_0_10px_rgba(16,185,129,0.3)]`} /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-black text-white tracking-tighter">R$ {Number(val || 0).toLocaleString()}</p>
   </div>
);

export default Performance;
