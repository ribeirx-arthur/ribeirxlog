
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Clock,
  Calendar
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
}

type TimeFilter = 'semanal' | 'mensal' | 'anual' | 'total';

const Dashboard: React.FC<DashboardProps> = ({ trips, vehicles, drivers, shippers, profile }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mensal');

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
      if (timeFilter === 'anual') {
        return receiptDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [trips, timeFilter]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let pendingReceivables = 0;
    let driverCommissions = 0;

    filteredTrips.forEach(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);
      const driver = drivers.find(d => d.id === trip.driverId);
      if (vehicle && driver) {
        const finance = calculateTripFinance(trip, vehicle, driver, profile);
        totalRevenue += finance.totalBruto;
        totalProfit += finance.lucroSociety;
        driverCommissions += finance.comissaoMotorista;
        if (trip.status === 'Pendente' || trip.status === 'Parcial') {
          pendingReceivables += finance.saldoAReceber;
        }
      }
    });

    return { totalRevenue, totalProfit, pendingReceivables, driverCommissions };
  }, [filteredTrips, vehicles, drivers, profile]);

  const chartData = useMemo(() => {
    // Generate simple trend data based on the filter
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (timeFilter === 'anual' || timeFilter === 'total') {
      return months.map((m, i) => ({
        name: m,
        value: filteredTrips
          .filter(t => new Date(t.receiptDate).getMonth() === i)
          .reduce((acc, t) => {
            const v = vehicles.find(veh => veh.id === t.vehicleId);
            const d = drivers.find(drv => drv.id === t.driverId);
            return acc + (v && d ? calculateTripFinance(t, v, d, profile).lucroSociety : 0);
          }, 0)
      }));
    }
    // For weekly/monthly, just show last few items or days
    return filteredTrips.slice(-10).map(t => ({
      name: t.receiptDate.split('-').reverse().slice(0, 2).join('/'),
      value: calculateTripFinance(t, vehicles.find(v => v.id === t.vehicleId)!, drivers.find(d => d.id === t.driverId)!, profile).lucroSociety
    }));
  }, [filteredTrips, timeFilter, vehicles, drivers, profile]);

  const pieData = useMemo(() => {
    const propio = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Próprio').length;
    const sociedade = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Sociedade').length;
    const total = propio + sociedade || 1;
    return [
      { name: 'Próprio', value: Math.round((propio / total) * 100), color: '#10b981' },
      { name: 'Sociedade', value: Math.round((sociedade / total) * 100), color: '#f43f5e' },
    ];
  }, [filteredTrips, vehicles]);

  const aiInsights = useMemo(() => {
    return generateAIInsights(trips, vehicles, drivers, shippers, profile);
  }, [trips, vehicles, drivers, shippers, profile]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta, {profile.name}!</h1>
          <p className="text-slate-400">Aqui está o resumo operacional da sua frota.</p>
        </div>

        <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
          {(['semanal', 'mensal', 'anual', 'total'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${timeFilter === f
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* AI Section with Fade In Animation */}
      {profile.config.enableBI !== false && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AIInsights
            insights={aiInsights}
            trips={trips}
            vehicles={vehicles}
            shippers={shippers}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Faturamento Bruto"
          value={`R$ ${stats.totalRevenue.toLocaleString()}`}
          trend={timeFilter}
          isPositive={true}
          icon={DollarSign}
        />
        <StatCard
          title="Lucro Líquido Real"
          value={`R$ ${stats.totalProfit.toLocaleString()}`}
          trend={timeFilter}
          isPositive={true}
          icon={TrendingUp}
        />
        <StatCard
          title="Saldo a Receber"
          value={`R$ ${stats.pendingReceivables.toLocaleString()}`}
          trend="Pendente"
          isPositive={false}
          icon={Clock}
        />
        <StatCard
          title="Saldo Motoristas"
          value={`R$ ${stats.driverCommissions.toLocaleString()}`}
          trend="Comissões"
          isPositive={true}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white">Fluxo de Caixa: Lucratividade</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              Período: <span className="text-emerald-500 font-bold uppercase">{timeFilter}</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white mb-1">Distribuição de Frota</h3>
            <p className="text-xs text-slate-400 mb-6">Volume de viagens por tipo de propriedade</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean; icon: any }> = ({ title, value, trend, isPositive, icon: Icon }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:bg-slate-800 transition-colors group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-900 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);

export default Dashboard;
