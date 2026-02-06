
import React, { useMemo, useState } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import {
   TrendingUp,
   Truck,
   MapPin,
   Target,
   Wallet,
   Activity,
   Building2,
   Trophy,
   Lightbulb,
   Fuel,
   Wrench,
   Percent,
   Coins,
   BarChart3,
   DollarSign,
   History,
   Brain
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

type BIView = 'geral' | 'rankings' | 'inteligencia';

const Performance: React.FC<PerformanceProps> = ({
   trips = [],
   vehicles = [],
   drivers = [],
   shippers = [],
   profile,
   maintenances = []
}) => {
   const [activeView, setActiveView] = useState<BIView>('geral');

   // ENGINE SIMPLIFICADA v4.0 (Zero Gráficos de Fluxo / Zero Auditoria)
   const analytics = useMemo(() => {
      const stats = {
         totalRevenue: 0,
         totalProfit: 0,
         totalKm: 0,
         totalMaint: 0,

         driverMap: new Map<string, { id: string, name: string, profit: number, revenue: number, trips: number, km: number, commission: number }>(),
         vehicleMap: new Map<string, { id: string, plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
         routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number, fuel: number, otherCosts: number }>(),
         shipperMap: new Map<string, { id: string, name: string, revenue: number, profit: number, count: number, commission: number }>(),

         lossMakingTrips: [] as any[]
      };

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

         stats.totalRevenue += (fin.totalBruto || 0);
         stats.totalProfit += (fin.lucroLiquidoReal || 0);
         stats.totalKm += km;

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
            stats.shipperMap.set(s.id, sStat);
         }
      });

      maintenances.forEach(m => {
         const cost = Number(m.totalCost || 0);
         stats.totalMaint += cost;
         const vStat = stats.vehicleMap.get(m.vehicleId);
         if (vStat) vStat.maint += cost;
      });

      return stats;
   }, [trips, vehicles, drivers, shippers, profile, maintenances]);

   const marginRatioValue = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100);
   const marginRatio = isNaN(marginRatioValue) ? "0.0" : marginRatioValue.toFixed(1);

   const rankedDrivers = useMemo(() => Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedShippers = useMemo(() => Array.from(analytics.shipperMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedRoutes = useMemo(() => Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 10), [analytics]);
   const rankedVehicles = useMemo(() => Array.from(analytics.vehicleMap.values()).sort((a, b) => b.maint - a.maint).slice(0, 10), [analytics]);

   return (
      <div className="space-y-10 pb-32">
         <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10 border-b border-slate-800 pb-10">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">BI & Performance</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Visão Geral da Operação</p>
               </div>
            </div>

            <nav className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
               {[
                  { id: 'geral', label: 'Dashboard', icon: Activity },
                  { id: 'rankings', label: 'Rankings', icon: Trophy },
                  { id: 'inteligencia', label: 'Sugestões', icon: Lightbulb }
               ].map((v) => (
                  <button
                     key={v.id}
                     onClick={() => setActiveView(v.id as BIView)}
                     className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${activeView === v.id ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'
                        }`}
                  >
                     <v.icon className="w-3.5 h-3.5" />
                     {v.label}
                  </button>
               ))}
            </nav>
         </header>

         {activeView === 'geral' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Faturamento" value={analytics.totalRevenue} color="text-white" icon={Wallet} />
                  <StatCard title="Lucro Real" value={analytics.totalProfit} color="text-emerald-500" icon={TrendingUp} />
                  <StatCard title="Margem" value={`${marginRatio}%`} color="text-sky-400" icon={Target} />
                  <StatCard title="Lucro/KM" value={`R$ ${(analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2)}`} color="text-amber-400" icon={MapPin} />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 lg:col-span-2 flex flex-col justify-center items-center h-[400px]">
                     <h3 className="text-xl font-black text-white uppercase italic mb-8">Saúde Operacional (ROI)</h3>
                     <div className="relative w-64 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ value: Math.max(2, Number(marginRatio)), fill: '#10b981' }]}>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: '#0f172a' }} dataKey="value" cornerRadius={30} angleAxisId={0} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <p className="text-5xl font-black text-white">{marginRatio}%</p>
                           <span className="text-[10px] text-slate-500 font-black uppercase">KPI Real</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                     <h3 className="text-xl font-black text-white uppercase italic">Resumo Financeiro</h3>
                     <div className="space-y-4">
                        <SimpleRow label="Receita Bruta" value={analytics.totalRevenue} color="text-white" />
                        <SimpleRow label="Custos Operacionais" value={analytics.totalRevenue - analytics.totalProfit} color="text-rose-500" />
                        <hr className="border-slate-800" />
                        <SimpleRow label="Lucro Líquido" value={analytics.totalProfit} color="text-emerald-500" />
                     </div>
                     <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Custo Médio por KM</p>
                        <p className="text-xl font-black text-white">R$ {((analytics.totalRevenue - analytics.totalProfit) / (analytics.totalKm || 1)).toFixed(2)}</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeView === 'rankings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in slide-in-from-right-8 duration-500">
               <RankPanel title="Elite de Motoristas" data={rankedDrivers.map(d => ({ name: d.name, val: d.profit, sub: `${d.trips} viagens` }))} color="emerald" />
               <RankPanel title="Principais Clientes" data={rankedShippers.map(s => ({ name: s.name, val: s.profit, sub: 'Faturamento Lucro' }))} color="sky" />
               <RankPanel title="Rotas Mais Rentáveis" data={rankedRoutes.map(r => ({ name: r.name, val: r.profit, sub: `${r.count} viagens realizadas` }))} color="amber" />
               <RankPanel title="Manutenções por Veículo" data={rankedVehicles.filter(v => v.maint > 0).map(v => ({ name: v.plate, val: v.maint, sub: 'Gasto acumulado' }))} color="rose" />
            </div>
         )}

         {activeView === 'inteligencia' && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-white uppercase italic">Insight da Frota</h3>
                     <p className="text-slate-400 text-sm leading-relaxed italic">
                        "Com base no histórico das suas <b>{trips.length}</b> viagens, a rota para <b>{rankedRoutes[0]?.name || '...'}</b> é a que apresenta o melhor retorno sobre investimento. O veículo <b>{rankedVehicles[0]?.plate || '...'}</b> teve o maior impacto em manutenção este mês."
                     </p>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center items-center text-center">
                     <Brain className="w-10 h-10 text-emerald-500 mb-4" />
                     <p className="text-white font-black uppercase text-xs">Total Operado</p>
                     <p className="text-3xl font-black text-white">R$ {analytics.totalRevenue.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// COMPONENTES DE APOIO
const StatCard = ({ title, value, color, icon: Icon }: any) => (
   <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <div className="w-8 h-8 bg-slate-950 rounded-lg flex items-center justify-center mb-4"><Icon className={`w-4 h-4 ${color}`} /></div>
      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{title}</p>
      <p className={`text-xl font-black ${color}`}>{typeof value === 'number' ? `R$ ${Number(value || 0).toLocaleString()}` : value}</p>
   </div>
);

const SimpleRow = ({ label, value, color }: any) => (
   <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 font-bold uppercase">{label}</span>
      <span className={`font-black ${color}`}>R$ {Number(value || 0).toLocaleString()}</span>
   </div>
);

const RankPanel = ({ title, data, color }: any) => {
   const c = color === 'emerald' ? 'text-emerald-500' : color === 'sky' ? 'text-sky-500' : color === 'amber' ? 'text-amber-500' : 'text-rose-500';
   return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
         <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500'}`} /> {title}
         </h3>
         <div className="space-y-3">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/30">
                  <div>
                     <p className="text-[11px] font-black text-white uppercase">{item.name}</p>
                     <p className="text-[8px] text-slate-500 uppercase font-bold">{item.sub}</p>
                  </div>
                  <p className={`text-sm font-black ${c}`}>R$ {Number(item.val || 0).toLocaleString()}</p>
               </div>
            ))}
            {data.length === 0 && <p className="text-center py-6 text-[10px] text-slate-600 uppercase">Sem dados</p>}
         </div>
      </div>
   );
};

export default Performance;
