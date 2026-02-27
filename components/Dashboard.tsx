
import React, { useMemo, useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Clock,
  Calendar,
  PieChart as PieIcon,
  Users
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile } from '../types';
import { calculateTripFinance } from '../services/finance';
import { generateAIInsights } from '../services/aiAnalysis';
import { AIInsights } from './AIInsights';
import { useAppMode } from '../contexts/AppModeContext';
import {
  Plus,
  Wallet,
  BarChart3,
  Map as MapIcon,
  History,
  Zap,
  Activity
} from 'lucide-react';

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
  const [activeView, setActiveView] = useState<'geral' | 'sociedade'>('geral');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasSocietyVehicles = useMemo(() => vehicles.some(v => v.type === 'Sociedade'), [vehicles]);

  const isAdmin = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthur.riberix@gmail.com',
    'arthurpsantos01@gmail.com',
    'arthur_ribeiro09@outlook.com'
  ].includes(profile.email?.trim().toLowerCase() || '') || profile.name?.toLowerCase().includes('ribeirxlog');
  const isFree = (profile.payment_status === 'unpaid' || !profile.payment_status) && !isAdmin;


  const filteredTrips = useMemo(() => {
    const now = new Date();
    return trips.filter(trip => {
      // Filtro de Sociedade se ativo
      if (activeView === 'sociedade') {
        const v = vehicles.find(veh => veh.id === trip.vehicleId);
        if (!v || v.type !== 'Sociedade') return false;
      }

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
  }, [trips, timeFilter, activeView, vehicles]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0; // Lucro que fica para o dono (sociedade aplicada)
    let totalNetProfit = 0; // Lucro líquido real total gerado pelo caminhão
    let driverCommissions = 0;
    let pendingReceivables = 0;
    let totalAdvanceBalance = 0;

    filteredTrips.forEach(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId) || { plate: 'GENERIC', type: 'Próprio', societySplitFactor: 100 } as Vehicle;
      const driver = drivers.find(d => d.id === trip.driverId) || { name: 'Generic' } as Driver;
      const finance = calculateTripFinance(trip, vehicle, driver, profile);

      totalRevenue += finance.totalBruto;
      totalProfit += finance.lucroSociety;
      totalNetProfit += finance.lucroLiquidoReal;
      driverCommissions += finance.comissaoMotorista;
      totalAdvanceBalance += finance.saldoAdiantamento;

      if (trip.status === 'Pendente' || trip.status === 'Parcial') {
        pendingReceivables += finance.saldoAReceber;
      }
    });

    return {
      totalRevenue,
      totalProfit,
      totalNetProfit,
      partnerProfit: totalNetProfit - totalProfit,
      pendingReceivables,
      driverCommissions
    };
  }, [filteredTrips, vehicles, drivers, profile]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const getYValue = (t: Trip) => {
      const v = vehicles.find(veh => veh.id === t.vehicleId) || { plate: 'GENERIC' } as Vehicle;
      const d = drivers.find(drv => drv.id === t.driverId) || { name: 'Generic' } as Driver;
      const finance = calculateTripFinance(t, v, d, profile);
      return activeView === 'sociedade' ? finance.lucroLiquidoReal : finance.lucroSociety;
    };

    if (timeFilter === 'anual' || timeFilter === 'total') {
      return months.map((m, i) => ({
        name: m,
        value: filteredTrips
          .filter(t => new Date(t.receiptDate).getMonth() === i)
          .reduce((acc, t) => acc + getYValue(t), 0)
      }));
    }
    return filteredTrips.slice(-8).map(t => ({
      name: (t.receiptDate || '').split('-').reverse().slice(0, 2).join('/'),
      value: getYValue(t)
    }));
  }, [filteredTrips, timeFilter, vehicles, drivers, profile, activeView]);

  const pieData = useMemo(() => {
    if (activeView === 'sociedade') {
      return [
        { name: 'Sua Parte', value: stats.totalProfit, color: '#10b981' },
        { name: 'Parte Sócio', value: stats.partnerProfit, color: '#3b82f6' },
      ];
    }
    const propio = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Próprio').length;
    const sociedade = filteredTrips.filter(t => vehicles.find(v => v.id === t.vehicleId)?.type === 'Sociedade').length;
    return [
      { name: 'Próprio', value: propio, color: '#10b981' },
      { name: 'Sociedade', value: sociedade, color: '#f43f5e' },
    ];
  }, [filteredTrips, vehicles, activeView, stats]);

  const { uiStyle, features } = useAppMode();
  const aiInsights = useMemo(() => generateAIInsights(trips, vehicles, drivers, shippers, profile), [trips, vehicles, drivers, shippers, profile]);

  if (!mounted) return null;

  // RENDER MINIMAL DASHBOARD (SIMPLE MODE)
  if (uiStyle === 'minimal') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-white tracking-tight">Painel de Controle <span className="text-emerald-500">Simples</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Resumo Financeiro & Operacional</p>
        </header>

        {/* Big Balance Card */}
        <div className="bg-emerald-500 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Zap className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 space-y-4">
            <p className="text-emerald-950/60 font-black uppercase text-[10px] tracking-widest">Saldo de Lucro Líquido</p>
            <h2 className="text-6xl font-black text-emerald-950 tracking-tighter">R$ {stats.totalProfit.toLocaleString()}</h2>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-emerald-600/20 px-6 py-3 rounded-2xl border border-emerald-400/20 backdrop-blur-sm">
                <p className="text-emerald-950/60 text-[9px] font-black uppercase mb-1">Total Receita</p>
                <p className="text-emerald-950 font-black">R$ {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-600/20 px-6 py-3 rounded-2xl border border-emerald-400/20 backdrop-blur-sm">
                <p className="text-emerald-950/60 text-[9px] font-black uppercase mb-1">Saldo a Receber</p>
                <p className="text-emerald-950 font-black">R$ {stats.pendingReceivables.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-500"><History className="w-5 h-5" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Últimas Viagens</h3>
            </div>
            <div className="space-y-3">
              {trips.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                  <div>
                    <p className="text-xs font-black text-white">{t.origin} → {t.destination}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{new Date(t.departureDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-black ${t.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}`}>{t.status}</span>
                </div>
              ))}
              {trips.length === 0 && <p className="text-center text-slate-600 py-4 font-bold text-xs uppercase tracking-widest">Nenhuma viagem lançada</p>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500"><BarChart3 className="w-5 h-5" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Ações Rápidas</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <QuickAction color="sky" icon={Plus} label="Novo Frete" />
              <QuickAction color="emerald" icon={Wallet} label="Lançar Gasto" />
              <QuickAction color="amber" icon={MapIcon} label="Ver Rotas" />
              <QuickAction color="purple" icon={BarChart3} label="Relatórios" />
            </div>
            <div className="pt-4 border-t border-slate-800 text-center">
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic group-hover:text-emerald-500 transition-colors">Modo Simples RBS v1.7</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER NEURAL/DEEP DASHBOARD (ADVANCED/INTERMEDIATE)
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl font-black text-white tracking-tighter ${uiStyle === 'deep' ? 'animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400' : ''}`}>
              {uiStyle === 'deep' ? 'System Intel OS' : activeView === 'sociedade' ? 'Sociedade & Gestão' : 'Painel de Inteligência'}
            </h1>
            {isFree && <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-500 uppercase tracking-widest uppercase">Grátis</span>}
            {uiStyle === 'deep' && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{uiStyle === 'deep' ? 'Acesso Prioritário RBS Engine' : activeView === 'sociedade' ? 'Visão de Divisão de Lucros' : 'Visão Estratégica da Frota'}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {hasSocietyVehicles && (
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
              <button
                onClick={() => setActiveView('geral')}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'geral' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
              >
                Geral
              </button>
              <button
                onClick={() => setActiveView('sociedade')}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'sociedade' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
              >
                Sociedade
              </button>
            </div>
          )}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
            {(['semanal', 'mensal', 'anual', 'total'] as TimeFilter[]).map((f) => (
              <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-200'}`}>{f}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Info Alert about Receivables Impact */}
      {stats.pendingReceivables > 0 && (
        <div className="bg-slate-900/40 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="text-white font-bold">O Saldo a Receber impacta o lucro?</p>
            <p className="text-slate-400">Sim! O lucro mostrado abaixo é **Potencial** (inclui o que você já ganhou mas ainda não recebeu o saldo). Monitore o saldo para garantir seu fluxo de caixa real.</p>
          </div>
        </div>
      )}

      {profile.config.enableBI !== false && activeView === 'geral' && (
        <AIInsights insights={aiInsights} trips={trips} vehicles={vehicles} shippers={shippers} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturamento Bruto" value={`R$ ${stats.totalRevenue.toLocaleString()}`} trend={timeFilter} isPositive={true} icon={DollarSign} uiStyle={uiStyle} />
        <StatCard
          title={activeView === 'sociedade' ? "Lucro Gestor (Sua Parte)" : "Lucro Líquido Real"}
          value={`R$ ${stats.totalProfit.toLocaleString()}`}
          trend={activeView === 'sociedade' ? "Líquido" : timeFilter}
          isPositive={true}
          icon={TrendingUp}
          uiStyle={uiStyle}
        />
        {activeView === 'sociedade' ? (
          <StatCard title="Lucro Sócio" value={`R$ ${stats.partnerProfit.toLocaleString()}`} trend="Divisão" isPositive={true} icon={Users} uiStyle={uiStyle} />
        ) : (
          <StatCard title="Saldo a Receber" value={`R$ ${stats.pendingReceivables.toLocaleString()}`} trend="Pendente" isPositive={false} icon={Clock} uiStyle={uiStyle} />
        )}
        <StatCard title="Custos Motoristas" value={`R$ ${stats.driverCommissions.toLocaleString()}`} trend="Comissões" isPositive={true} icon={CreditCard} uiStyle={uiStyle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${uiStyle === 'deep' ? 'ring-1 ring-emerald-500/20' : ''}`}>
          {uiStyle === 'deep' && <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Activity className="w-32 h-32 text-emerald-500" /></div>}
          <h3 className="font-black text-slate-500 uppercase text-[10px] tracking-widest mb-8 border-b border-slate-800 pb-4">Desempenho de Caixa <span className="text-emerald-500">Real-Time</span></h3>
          <div className="h-64 w-full">
            <DashboardNeuralChart data={chartData} uiStyle={uiStyle} />
          </div>
        </div>

        <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden ${uiStyle === 'deep' ? 'ring-1 ring-emerald-500/20' : ''}`}>
          <h3 className="font-black text-slate-500 uppercase text-[10px] tracking-widest mb-6 border-b border-slate-800 pb-4">Status de Operação</h3>
          <div className="h-48 w-full flex items-center justify-center relative">
            <DashboardNeuralPie data={pieData} uiStyle={uiStyle} />
            {uiStyle === 'deep' && <div className="absolute inset-0 border-[1px] border-emerald-500/5 rounded-full animate-[spin_10s_linear_infinite]" />}
          </div>
          <div className="space-y-3 mt-8">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-sm font-black text-white italic">
                  {Math.round((item.value / (pieData.reduce((acc, curr) => acc + curr.value, 0) || 1)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, color }: any) => (
  <button className={`flex flex-col items-center justify-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-${color}-500/50 hover:bg-slate-900 transition-all group`}>
    <div className={`w-12 h-12 bg-${color}-500/10 rounded-2xl flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform`}>
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
  </button>
);

// ------------------------------------------------------------------------------------------------
// DASHBOARD CUSTOM SVG (Failsafe)
// ------------------------------------------------------------------------------------------------

const DashboardNeuralChart = ({ data, uiStyle }: { data: any[], uiStyle?: string }) => {
  if (!data || data.length === 0) return null;
  const w = 600; const h = 250; const p = 30;
  const maxV = Math.max(...data.map(d => d.value), 100) * 1.1;
  const getX = (i: number) => p + (i * (w - 2 * p)) / (Math.max(data.length - 1, 1));
  const getY = (v: number) => h - p - (v * (h - 2 * p)) / maxV;
  const pts = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const area = `M ${getX(0)},${h - p} L ${pts} L ${getX(data.length - 1)},${h - p} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]">
      <defs>
        <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={uiStyle === 'deep' ? "0.5" : "0.3"} />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        {uiStyle === 'deep' && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path d={area} fill="url(#dG)" className={uiStyle === 'deep' ? 'animate-pulse' : ''} />
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter={uiStyle === 'deep' ? 'url(#glow)' : ''} />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={getX(i)} cy={getY(d.value)} r="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <text x={getX(i)} y={h - 5} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">{d.name}</text>
        </g>
      ))}
    </svg>
  );
};

const DashboardNeuralPie = ({ data, uiStyle }: { data: any[], uiStyle?: string }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let currentAngle = 0;
  return (
    <svg viewBox="0 0 100 100" className={`w-36 h-36 ${uiStyle === 'deep' ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]' : ''}`}>
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
      <circle cx="50" cy="50" r="28" fill="#0f172a" />
      {uiStyle === 'deep' && <circle cx="50" cy="50" r="22" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="2 1" className="animate-[spin_20s_linear_infinite]" />}
    </svg>
  );
};

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean; icon: any; uiStyle?: string }> = ({ title, value, trend, isPositive, icon: Icon, uiStyle }) => (
  <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all group relative overflow-hidden shadow-xl ${uiStyle === 'deep' ? 'hover:ring-1 hover:ring-emerald-500/30' : ''}`}>
    <div className="flex items-center justify-between mb-6">
      <div className={`p-4 bg-slate-950 rounded-2xl text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-all duration-500 shadow-inner`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>{trend}</div>
    </div>
    <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
    <p className={`text-2xl font-black text-white italic tracking-tighter ${uiStyle === 'deep' ? 'group-hover:text-emerald-400 transition-colors' : ''}`}>{value}</p>
    {uiStyle === 'deep' && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />}
  </div>
);

export default Dashboard;
