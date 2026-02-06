
import React, { useMemo, useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Clock,
  Calendar,
  PieChart as PieIcon
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile } from '../types';
import { calculateTripFinance } from '../services/finance';
import { generateAIInsights } from '../services/aiAnalysis';
import { AIInsights } from './AIInsights';

interface DashboardProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  profile: UserProfile;
  onPopulateDemo?: () => void;
}

type TimeFilter = 'semanal' | 'mensal' | 'anual' | 'total';

const Dashboard: React.FC<DashboardProps> = ({ trips, vehicles, drivers, shippers, profile, onPopulateDemo }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mensal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = ['arthur@ribeirxlog.com', 'arthur_ribeiro09@outlook.com'].includes(profile.email?.trim().toLowerCase() || '');
  const isFree = profile.payment_status !== 'paid' && !isAdmin;

  const filteredTrips = useMemo(() => {
    const now = new Date();
    return trips.filter(trip => {
      if (timeFilter === 'total') return true;
      const receiptDate = new Date(trip.receiptDate);
      if (timeFilter === 'semanal') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return receiptDate >= sevenDaysAgo;
      }
      if (timeFilter === 'mensal') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return receiptDate >= thirtyDaysAgo;
      }
      if (timeFilter === 'anual') return receiptDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [trips, timeFilter]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let pendingReceivables = 0;
    let driverCommissions = 0;

    filteredTrips.forEach(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId) || { plate: 'GENERIC', type: 'Próprio' } as Vehicle;
      const driver = drivers.find(d => d.id === trip.driverId) || { name: 'Generic' } as Driver;
      const finance = calculateTripFinance(trip, vehicle, driver, profile);
      totalRevenue += finance.totalBruto;
      totalProfit += finance.lucroSociety;
      driverCommissions += finance.comissaoMotorista;
      if (trip.status === 'Pendente' || trip.status === 'Parcial') pendingReceivables += finance.saldoAReceber;
    });
    return { totalRevenue, totalProfit, pendingReceivables, driverCommissions };
  }, [filteredTrips, vehicles, drivers, profile]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (timeFilter === 'anual' || timeFilter === 'total') {
      return months.map((m, i) => ({
        name: m,
        value: filteredTrips
          .filter(t => new Date(t.receiptDate).getMonth() === i)
          .reduce((acc, t) => {
            const v = vehicles.find(veh => veh.id === t.vehicleId) || { plate: 'GENERIC' } as Vehicle;
            const d = drivers.find(drv => drv.id === t.driverId) || { name: 'Generic' } as Driver;
            return acc + calculateTripFinance(t, v, d, profile).lucroSociety;
          }, 0)
      }));
    }
    return filteredTrips.slice(-8).map(t => ({
      name: (t.receiptDate || '').split('-').reverse().slice(0, 2).join('/'),
      value: calculateTripFinance(t, vehicles.find(v => v.id === t.vehicleId) || { plate: 'GENERIC' } as Vehicle, drivers.find(d => d.id === t.driverId) || { name: 'Generic' } as Driver, profile).lucroSociety
    }));
  }, [filteredTrips, timeFilter, vehicles, drivers, profile]);

  const pieData = useMemo(() => {
    const propio = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Próprio').length;
    const sociedade = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Sociedade').length;
    const total = propio + sociedade || 1;
    return [
      { name: 'Próprio', value: propio, color: '#10b981' },
      { name: 'Sociedade', value: sociedade, color: '#f43f5e' },
    ];
  }, [filteredTrips, vehicles]);

  const aiInsights = useMemo(() => generateAIInsights(trips, vehicles, drivers, shippers, profile), [trips, vehicles, drivers, shippers, profile]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">Bem-vindo, {profile.name}!</h1>{isFree && <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-500 uppercase tracking-widest">Grátis</span>}</div>
          <p className="text-slate-400">Resumo operacional da frota.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            {(['semanal', 'mensal', 'anual', 'total'] as TimeFilter[]).map((f) => (
              <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${timeFilter === f ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'}`}>{f}</button>
            ))}
          </div>
        </div>
      </header>

      {profile.config.enableBI !== false && (
        <AIInsights insights={aiInsights} trips={trips} vehicles={vehicles} shippers={shippers} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturamento Bruto" value={`R$ ${stats.totalRevenue.toLocaleString()}`} trend={timeFilter} isPositive={true} icon={DollarSign} />
        <StatCard title="Lucro Líquido Real" value={`R$ ${stats.totalProfit.toLocaleString()}`} trend={timeFilter} isPositive={true} icon={TrendingUp} />
        <StatCard title="Saldo a Receber" value={`R$ ${stats.pendingReceivables.toLocaleString()}`} trend="Pendente" isPositive={false} icon={Clock} />
        <StatCard title="Saldo Motoristas" value={`R$ ${stats.driverCommissions.toLocaleString()}`} trend="Comissões" isPositive={true} icon={CreditCard} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
          <h3 className="font-bold text-white mb-6">Fluxo de Lucratividade</h3>
          <div className="h-64 w-full">
            <DashboardNeuralChart data={chartData} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
          <h3 className="font-bold text-white mb-6">Distribuição de Frota</h3>
          <div className="h-48 w-full flex items-center justify-center">
            <DashboardNeuralPie data={pieData} />
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-300">{item.name}</span></div>
                <span className="font-bold text-white">{Math.round((item.value / filteredTrips.length || 1) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------
// DASHBOARD CUSTOM SVG (Failsafe)
// ------------------------------------------------------------------------------------------------

const DashboardNeuralChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  const w = 600; const h = 250; const p = 30;
  const maxV = Math.max(...data.map(d => d.value), 100) * 1.1;
  const getX = (i: number) => p + (i * (w - 2 * p)) / (data.length - 1);
  const getY = (v: number) => h - p - (v * (h - 2 * p)) / maxV;
  const pts = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const area = `M ${getX(0)},${h - p} L ${pts} L ${getX(data.length - 1)},${h - p} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient>
      </defs>
      <path d={area} fill="url(#dG)" />
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <text key={i} x={getX(i)} y={h - 5} textAnchor="middle" fill="#64748b" fontSize="10">{d.name}</text>)}
    </svg>
  );
};

const DashboardNeuralPie = ({ data }: { data: any[] }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let currentAngle = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32">
      {data.map((d, i) => {
        const perc = d.value / total;
        const angle = perc * 360;
        const x1 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
        const y1 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
        currentAngle += angle;
        const x2 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
        const y2 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
        const large = angle > 180 ? 1 : 0;
        return <path key={i} d={`M 50,50 L ${x1},${y1} A 40,40 0 ${large} 1 ${x2},${y2} Z`} fill={d.color} stroke="#0f172a" strokeWidth="2" />;
      })}
      <circle cx="50" cy="50" r="25" fill="#1e293b" opacity="0.6" />
    </svg>
  );
};

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean; icon: any }> = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:bg-slate-800 transition-colors group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-900 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform"><Icon className="w-5 h-5" /></div>
      <div className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>{trend}</div>
    </div>
    <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default Dashboard;
