
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, ComposedChart, Line, Area, AreaChart
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
  ChevronRight
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile, MaintenanceRecord } from '../types';
import { calculateTripFinance } from '../services/finance';

interface PerformanceProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  profile: UserProfile;
  maintenances: MaintenanceRecord[];
}

const Performance: React.FC<PerformanceProps> = ({ trips, vehicles, drivers, shippers, profile, maintenances }) => {
  const [activeView, setActiveView] = useState<'geral' | 'rankings' | 'custos'>('geral');

  // ENGINE DE DADOS BI AVANÇADO
  const analytics = useMemo(() => {
    const stats = {
      totalRevenue: 0,
      totalProfit: 0,
      totalFuel: 0,
      totalKm: 0,
      totalMaint: 0,
      totalCommissions: 0,
      
      driverMap: new Map<string, { name: string, profit: number, revenue: number, trips: number, km: number }>(),
      vehicleMap: new Map<string, { plate: string, profit: number, revenue: number, trips: number, maint: number, km: number }>(),
      routeMap: new Map<string, { name: string, profit: number, count: number, revenue: number, km: number }>(),
      shipperMap: new Map<string, { name: string, revenue: number, profit: number, count: number }>()
    };

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

      const dStat = stats.driverMap.get(d.id) || { name: d.name, profit: 0, revenue: 0, trips: 0, km: 0 };
      dStat.profit += fin.lucroLiquidoReal;
      dStat.revenue += fin.totalBruto;
      dStat.trips += 1;
      dStat.km += t.totalKm;
      stats.driverMap.set(d.id, dStat);

      const vStat = stats.vehicleMap.get(v.id) || { plate: v.plate, profit: 0, revenue: 0, trips: 0, maint: 0, km: 0 };
      vStat.profit += fin.lucroLiquidoReal;
      vStat.revenue += fin.totalBruto;
      vStat.trips += 1;
      vStat.km += t.totalKm;
      stats.vehicleMap.set(v.id, vStat);

      const rKey = t.destination;
      const rStat = stats.routeMap.get(rKey) || { name: rKey, profit: 0, count: 0, revenue: 0, km: 0 };
      rStat.profit += fin.lucroLiquidoReal;
      rStat.revenue += fin.totalBruto;
      rStat.count += 1;
      rStat.km += t.totalKm;
      stats.routeMap.set(rKey, rStat);

      const sStat = stats.shipperMap.get(s.id) || { name: s.name, revenue: 0, profit: 0, count: 0 };
      sStat.revenue += fin.totalBruto;
      sStat.profit += fin.lucroLiquidoReal;
      sStat.count += 1;
      stats.shipperMap.set(s.id, sStat);
    });

    maintenances.forEach(m => {
      stats.totalMaint += m.totalCost;
      const vStat = stats.vehicleMap.get(m.vehicleId);
      if (vStat) vStat.maint += m.totalCost;
    });

    return stats;
  }, [trips, vehicles, drivers, shippers, profile, maintenances]);

  const topDrivers = Array.from(analytics.driverMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topVehicles = Array.from(analytics.vehicleMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topRoutes = Array.from(analytics.routeMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topShippers = Array.from(analytics.shipperMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  
  const profitMargin = ((analytics.totalProfit / (analytics.totalRevenue || 1)) * 100).toFixed(1);
  const kmEfficiency = (analytics.totalProfit / (analytics.totalKm || 1)).toFixed(2);

  const costDistributionData = [
    { name: 'Diesel', value: analytics.totalFuel, color: '#38bdf8' },
    { name: 'Manutenção', value: analytics.totalMaint, color: '#f43f5e' },
    { name: 'Comissões', value: analytics.totalCommissions, color: '#f59e0b' },
    { name: 'Outros', value: (analytics.totalRevenue - analytics.totalProfit - analytics.totalFuel - analytics.totalMaint - analytics.totalCommissions), color: '#64748b' },
    { name: 'Lucro Real', value: analytics.totalProfit, color: '#10b981' }
  ].filter(i => i.value > 0);

  // MOTOR DE GESTÃO ESTRATÉGICA (DICAS DINÂMICAS)
  const managementInsights = useMemo(() => {
    const insights = [];
    const maintRatio = (analytics.totalMaint / (analytics.totalRevenue || 1)) * 100;
    
    if (maintRatio > 12) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Custo de Ativos',
        text: `A manutenção atingiu ${maintRatio.toFixed(1)}% da receita. Considere renovação de frota para os veículos com ROI negativo.`
      });
    }

    if (topRoutes.length > 0) {
      const best = topRoutes[0];
      insights.push({
        type: 'strategy',
        icon: Target,
        title: 'Expansão de Rota',
        text: `A rota para ${best.name} é sua "Galinha dos Ovos de Ouro" com R$ ${(best.profit/best.km).toFixed(2)} de lucro/km.`
      });
    }

    if (Number(kmEfficiency) < 2.5) {
      insights.push({
        type: 'action',
        icon: TrendingDown,
        title: 'Ajuste de Tarifa',
        text: `Seu lucro médio por KM (R$ ${kmEfficiency}) está abaixo da meta de R$ 3,00. Revise as negociações de frete seco.`
      });
    }

    return insights;
  }, [analytics, topRoutes, kmEfficiency]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Business Intelligence</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Operação Ribeirx Log v2.0
          </p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {['geral', 'rankings', 'custos'].map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === v ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      {/* VISÃO DE RANKINGS - AUDITORIA DE PERFORMANCE */}
      {activeView === 'rankings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Trophy className="text-amber-500" /> Hall da Fama (Motoristas)
               </h3>
               <span className="text-[10px] font-black text-slate-500 uppercase">Lucro Real</span>
            </div>
            <div className="space-y-4">
               {topDrivers.map((d, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/50 border border-slate-800 rounded-3xl hover:border-emerald-500/50 transition-all group">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center font-black text-emerald-500 group-hover:scale-110 transition-transform">#{i+1}</div>
                    <div className="flex-1">
                       <p className="text-white font-black">{d.name}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">{d.trips} Viagens • R$ {(d.profit/d.km).toFixed(2)}/km</p>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-500 font-black text-lg">R$ {d.profit.toLocaleString()}</p>
                       <p className="text-[8px] text-slate-600 font-black uppercase">Lucro Acumulado</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Truck className="text-sky-500" /> ROI de Ativos (Frota)
               </h3>
               <span className="text-[10px] font-black text-slate-500 uppercase">Rentabilidade</span>
            </div>
            <div className="space-y-4">
               {topVehicles.map((v, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/50 border border-slate-800 rounded-3xl hover:border-sky-500/50 transition-all group">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center font-black text-sky-500 group-hover:scale-110 transition-transform">#{i+1}</div>
                    <div className="flex-1">
                       <p className="text-white font-black">{v.plate}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">{v.km.toLocaleString()} KM • {((v.profit/v.revenue)*100).toFixed(1)}% Margem</p>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-500 font-black text-lg">R$ {v.profit.toLocaleString()}</p>
                       <p className="text-[8px] text-rose-500 font-black uppercase">R$ {v.maint.toLocaleString()} MANUT.</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <MapPin className="text-rose-500" /> Melhores Destinos (Margem)
               </h3>
               <span className="text-[10px] font-black text-slate-500 uppercase">Inteligência Logística</span>
            </div>
            <div className="space-y-4">
               {topRoutes.map((r, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/50 border border-slate-800 rounded-3xl">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center font-black text-rose-500">#{i+1}</div>
                    <div className="flex-1">
                       <p className="text-white font-black">{r.name}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">{r.count} Operações • R$ {r.revenue.toLocaleString()} Bruto</p>
                    </div>
                    <div className="text-right">
                       <p className="text-white font-black text-lg">R$ {r.profit.toLocaleString()}</p>
                       <div className="flex items-center justify-end gap-1">
                          <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                          <p className="text-[9px] text-emerald-500 font-black uppercase">{((r.profit/r.revenue)*100).toFixed(1)}%</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <Building2 className="text-emerald-500" /> Clientes VIP (Volume)
               </h3>
               <span className="text-[10px] font-black text-slate-500 uppercase">Comercial</span>
            </div>
            <div className="space-y-4">
               {topShippers.map((s, i) => (
                 <div key={i} className="flex items-center gap-4 p-5 bg-slate-950/50 border border-slate-800 rounded-3xl">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center font-black text-emerald-500">#{i+1}</div>
                    <div className="flex-1">
                       <p className="text-white font-black">{s.name}</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase">{s.count} Fretes Realizados</p>
                    </div>
                    <div className="text-right">
                       <p className="text-white font-black text-lg">R$ {s.revenue.toLocaleString()}</p>
                       <p className="text-[8px] text-slate-500 font-black uppercase">TOTAL FATURADO</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>
        </div>
      ) : activeView === 'custos' ? (
        /* VISÃO DE CUSTOS - AUDITORIA FINANCEIRA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
           
           <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8">Composição de Gastos</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={costDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                        {costDistributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }} />
                   </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-3 mt-6">
                 {costDistributionData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          {item.name}
                       </div>
                       <span className="text-white">R$ {item.value.toLocaleString()}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8">Auditoria Analítica</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-slate-800">
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase">Centro de Custo</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase">Total Bruto</th>
                          <th className="pb-4 text-[10px] font-black text-slate-500 uppercase">% Receita</th>
                          <th className="pb-4 text-right text-[10px] font-black text-slate-500 uppercase">Impacto</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                       <CostRow label="Diesel (Combustível)" value={analytics.totalFuel} total={analytics.totalRevenue} icon={Fuel} color="sky" />
                       <CostRow label="Manutenção Frota" value={analytics.totalMaint} total={analytics.totalRevenue} icon={Wrench} color="rose" />
                       <CostRow label="Comissão Equipe" value={analytics.totalCommissions} total={analytics.totalRevenue} icon={Percent} color="amber" />
                       <CostRow label="Lucro Líquido" value={analytics.totalProfit} total={analytics.totalRevenue} icon={TrendingUp} color="emerald" />
                    </tbody>
                 </table>
              </div>
              
              <div className="mt-12 p-8 bg-slate-950/50 border border-slate-800 rounded-3xl flex items-center justify-between">
                 <div>
                    <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Taxa de Eficiência Real</h4>
                    <p className="text-3xl font-black text-white tracking-tighter">{(analytics.totalProfit / (analytics.totalRevenue || 1) * 100).toFixed(1)}%</p>
                 </div>
                 <div className="text-right">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Custo por KM Rodado</p>
                    <p className="text-3xl font-black text-rose-500 tracking-tighter">R$ {((analytics.totalRevenue - analytics.totalProfit) / (analytics.totalKm || 1)).toFixed(2)}</p>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* VISÃO GERAL - DASHBOARD INTELIGENTE */
        <div className="space-y-8 animate-in fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Faturamento Bruto" value={`R$ ${analytics.totalRevenue.toLocaleString()}`} icon={Wallet} color="emerald" />
              <StatCard title="Lucro Líquido Real" value={`R$ ${analytics.totalProfit.toLocaleString()}`} icon={TrendingUp} color="sky" />
              <StatCard title="Margem de Lucro" value={`${profitMargin}%`} icon={Target} color="amber" />
              <StatCard title="Lucro por KM" value={`R$ ${kmEfficiency}`} icon={Activity} color="indigo" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h3 className="text-xl font-black text-white tracking-tighter uppercase">Curva de Rentabilidade</h3>
                       <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Acumulado Operacional</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                       <span className="text-[9px] font-black text-slate-400 uppercase">Lucro Líquido</span>
                    </div>
                 </div>
                 <div className="h-72">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[
                       { name: 'W1', val: analytics.totalProfit * 0.2 },
                       { name: 'W2', val: analytics.totalProfit * 0.45 },
                       { name: 'W3', val: analytics.totalProfit * 0.7 },
                       { name: 'W4', val: analytics.totalProfit },
                     ]}>
                       <defs>
                        <linearGradient id="colorP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                       <Tooltip cursor={{stroke: '#10b981'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                       <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorP)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              {/* PAINEL DE GESTÃO ESTRATÉGICA & INSIGHTS */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col overflow-hidden relative group">
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <Zap className="w-60 h-60" />
                 </div>
                 
                 <header className="relative z-10 mb-8">
                    <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
                       <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight">Gestão Estratégica</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Dicas de Eficiência em Tempo Real</p>
                 </header>

                 <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {managementInsights.map((insight, idx) => (
                      <div key={idx} className="p-5 bg-slate-950/50 border border-slate-800 rounded-3xl group/item hover:border-indigo-500/30 transition-all animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                        <div className="flex items-start gap-4">
                           <div className={`mt-1 p-2.5 rounded-xl ${insight.type === 'warning' ? 'bg-rose-500/10 text-rose-500' : insight.type === 'strategy' ? 'bg-sky-500/10 text-sky-500' : insight.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <insight.icon className="w-5 h-5" />
                           </div>
                           <div className="space-y-1">
                              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{insight.title}</h4>
                              <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-2 group-hover/item:line-clamp-none transition-all">
                                {insight.text}
                              </p>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-800 relative z-10">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
                       <span>Motor de BI v2.0</span>
                       <span className="flex items-center gap-1 text-emerald-500 animate-pulse">
                          <Activity className="w-3 h-3" /> ATIVO
                       </span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const CostRow = ({ label, value, total, icon: Icon, color }: any) => {
   const perc = ((value / (total || 1)) * 100).toFixed(1);
   const colorMap: any = {
      sky: 'text-sky-500 bg-sky-500/10',
      rose: 'text-rose-500 bg-rose-500/10',
      amber: 'text-amber-500 bg-amber-500/10',
      emerald: 'text-emerald-500 bg-emerald-500/10'
   };

   return (
      <tr className="group hover:bg-slate-800/30 transition-all">
         <td className="py-5">
            <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                  <Icon className="w-4 h-4" />
               </div>
               <span className="text-xs font-bold text-slate-200">{label}</span>
            </div>
         </td>
         <td className="py-5 text-sm font-black text-white">R$ {value.toLocaleString()}</td>
         <td className="py-5">
            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-black text-slate-400">{perc}%</span>
         </td>
         <td className="py-5 text-right">
            <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden ml-auto">
               <div className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'sky' ? 'bg-sky-500' : 'bg-rose-500'}`} style={{ width: `${perc}%` }} />
            </div>
         </td>
      </tr>
   );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const themes: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/10',
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/10',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/10',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/10'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] hover:bg-slate-800/50 transition-all group relative overflow-hidden">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${themes[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-2">{title}</h4>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    </div>
  );
};

export default Performance;
