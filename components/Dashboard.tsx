
import React, { useMemo, useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Clock,
  Calendar,
  PieChart as PieIcon,
  Users,
  ChevronDown,
  Filter,
  Search,
  Download,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile } from '../types';
import { calculateTripFinance } from '../services/finance';
import { generateAIInsights, generateMonthlyProjections } from '../services/aiAnalysis';
import { AIInsights } from './AIInsights';
import { useAppMode } from '../contexts/AppModeContext';
import {
  Plus,
  Wallet,
  BarChart3,
  Map as MapIcon,
  History,
  Zap,
  Activity,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  profile: UserProfile;
  onPopulateDemo?: () => void;
  setActiveTab?: (tab: any) => void;
}

type TimeFilter = 'semanal' | 'mensal' | 'anual' | 'total' | 'personalizado';

const Dashboard: React.FC<DashboardProps> = ({ trips, vehicles, drivers, shippers, profile, onPopulateDemo, setActiveTab }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('mensal');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
      if (timeFilter === 'total') return true;

      const dateStr = trip.receiptDate || trip.departureDate;
      const targetDate = new Date(dateStr);

      if (isNaN(targetDate.getTime())) return false;

      if (timeFilter === 'personalizado') {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return targetDate >= start && targetDate <= end;
      }

      if (timeFilter === 'semanal') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return targetDate >= sevenDaysAgo;
      }
      if (timeFilter === 'mensal') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return targetDate >= thirtyDaysAgo;
      }
      if (timeFilter === 'anual') return targetDate.getFullYear() === now.getFullYear();
      return true;
    });
  }, [trips, timeFilter, startDate, endDate]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalNetProfit = 0;
    let driverCommissions = 0;
    let pendingReceivables = 0;
    let totalAdvanceBalance = 0;

    filteredTrips.forEach(trip => {
      const vehicle = vehicles.find(v => v.id === trip.vehicleId) || { plate: 'GENERIC', type: 'Próprio', societySplitFactor: 100 } as Vehicle;
      const driver = drivers.find(d => d.id === trip.driverId) || { name: 'Generic' } as Driver;
      const finance = calculateTripFinance(trip, vehicle, driver, profile);

      totalRevenue += finance.totalBruto;
      totalProfit += finance.lucroLiquidoReal;
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
      return finance.lucroLiquidoReal;
    };

    if (timeFilter === 'anual' || timeFilter === 'total') {
      return months.map((m, i) => ({
        name: m,
        value: filteredTrips
          .filter(t => t.receiptDate && new Date(t.receiptDate).getMonth() === i)
          .reduce((acc, t) => acc + getYValue(t), 0)
      }));
    }
    return filteredTrips.slice(-8).map(t => ({
      name: (t.receiptDate || '').split('-').reverse().slice(0, 2).join('/'),
      value: getYValue(t)
    }));
  }, [filteredTrips, timeFilter, vehicles, drivers, profile]);

  const pieData = useMemo(() => {
    // Top 5 Caminhões por Renda
    const revenueByVehicle: { [plate: string]: number } = {};
    filteredTrips.forEach(t => {
      const v = vehicles.find(veh => veh.id === t.vehicleId);
      const plate = v?.plate || 'Outros';
      const d = drivers.find(d => d.id === t.driverId) || { name: 'Generic' } as Driver;
      const finance = calculateTripFinance(t, v || { plate: 'GENERIC' } as Vehicle, d, profile);
      revenueByVehicle[plate] = (revenueByVehicle[plate] || 0) + finance.totalBruto;
    });

    const colors = ['#10b981', '#3b82f6', '#f43f5e', '#f59e0b', '#8b5cf6'];
    const sorted = Object.entries(revenueByVehicle)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return sorted.map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    }));
  }, [filteredTrips, vehicles, drivers, profile]);

  const { uiStyle, features } = useAppMode();
  const aiInsights = useMemo(() => generateAIInsights(trips, vehicles, drivers, shippers, profile), [trips, vehicles, drivers, shippers, profile]);
  const projections = useMemo(() => generateMonthlyProjections(trips, vehicles, drivers, profile), [trips, vehicles, drivers, profile]);

  if (!mounted) return null;

  // RENDER MINIMAL DASHBOARD (SIMPLE MODE)
  if (uiStyle === 'minimal') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Painel <span className="text-emerald-500">RBS v2.0</span>
            </h1>
            <div className="h-1 flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-full" />
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-1">Inteligência Logística para Autônomos</p>
        </header>

        {/* Big Balance Card with Futuristic Background */}
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-1 shadow-2xl relative overflow-hidden group">
          <div className="bg-emerald-500 rounded-[2.8rem] p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-emerald-500/0 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-1000 animate-pulse-slow" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-slide-diagonal" />
            <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-1000">
              <Zap className="w-80 h-80 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/20 rounded-full border border-emerald-950/10">
                  <Activity className="w-3 h-3 text-emerald-950" />
                  <span className="text-emerald-950/70 font-black uppercase text-[10px] tracking-widest">Saldo de Lucro Líquido</span>
                </div>
                <h2 className="text-7xl font-black text-emerald-950 tracking-tighter leading-none">R$ {stats.totalProfit.toLocaleString()}</h2>
                <div className="flex items-center gap-3 pt-2">
                  <div className="px-3 py-1 bg-emerald-600/20 border border-emerald-400/20 rounded-xl">
                     <p className="text-[10px] font-black text-emerald-950 uppercase tracking-widest">
                       {filteredTrips.length} Viagens Filtradas
                     </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-emerald-600/30 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] border border-white/20 backdrop-blur-xl shadow-xl">
                  <p className="text-emerald-950/70 text-[10px] font-black uppercase tracking-widest mb-1">Total Receita</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-950 italic tracking-tighter">R$ {stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] border border-white/20 backdrop-blur-xl shadow-xl">
                  <p className="text-emerald-950/70 text-[10px] font-black uppercase tracking-widest mb-1 font-bold">Saldo a Receber</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-950 italic tracking-tighter">R$ {stats.pendingReceivables.toLocaleString()}</p>
                </div>
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

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500"><BarChart3 className="w-5 h-5" /></div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Ações Rápidas</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction color="sky" icon={Plus} label="Novo Frete" onClick={() => setActiveTab?.('new-trip')} />
                <QuickAction color="emerald" icon={Wallet} label="Lançar Gasto" onClick={() => setActiveTab?.('trips')} />
                <QuickAction color="amber" icon={MapIcon} label="Ver Rotas" onClick={() => setActiveTab?.('gps-tracking')} />
                <QuickAction color="purple" icon={BarChart3} label="Relatórios" onClick={() => setActiveTab?.('performance')} />
              </div>
              <div className="pt-4 border-t border-slate-800 text-center">
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic group-hover:text-emerald-500 transition-colors">Modo Simples RBS v1.7</p>
              </div>
            </div>

            {/* Banner de Imagem Temática Caminhão/Tecnologia */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-xl aspect-[2/1] border border-slate-800 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-slate-900/80 group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">Tecnologia em Movimento</h4>
                <p className="text-xs font-bold text-emerald-500">Lucro de ponta a ponta na sua rota</p>
              </div>
            </div>
          </div>
        </div>

        {profile.config.userRole === 'autonomo' && <AutonomousDriverTips />}
      </div>
    );
  }

  // RENDER NEURAL/DEEP DASHBOARD (ADVANCED/INTERMEDIATE)
  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 relative">
      {/* Background Ambience */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ─── ORBITAL NAVIGATION & FILTERS ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 z-10 relative">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                <BarChart3 className="w-8 h-8 relative z-10" />
                {uiStyle === 'deep' && (
                  <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl animate-[ping_3s_linear_infinite]" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                  Análise <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Estratégica</span>
                </h1>
                {isFree && (
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest shadow-lg shadow-amber-500/5">
                    Plano Básico
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.34em]">
                    {uiStyle === 'deep' ? 'Monitor de Logística Avançada' : 'Estratégia Operacional RBS'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl transition-all hover:border-emerald-500/40 group shadow-2xl ${timeFilter === 'personalizado' ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left pr-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Janela de Dados</p>
                <p className="text-sm font-black text-white uppercase tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                  {timeFilter === 'personalizado' ? `${startDate.split('-').reverse().slice(0, 2).join('/')} - ${endDate.split('-').reverse().slice(0, 2).join('/')}` : timeFilter}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-500 ${showDatePicker ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {showDatePicker && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-3xl p-8 z-[200] animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Presets Orbitais</h4>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {(['semanal', 'mensal', 'anual', 'total'] as TimeFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setTimeFilter(f); setShowDatePicker(false); }}
                      className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === f ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/5 hover:border-white/10 hover:text-white'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Inicial</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setTimeFilter('personalizado'); }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Data Final</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setTimeFilter('personalizado'); }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-all font-bold"
                    />
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="w-full py-4 bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all"
                  >
                    Sincronizar Dados
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="p-4 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── HI-IMPACT HERO BANNER ─── */}
      <div className="relative h-[480px] w-full bg-slate-900 rounded-[4rem] overflow-hidden border border-slate-800 shadow-3xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900/80 to-slate-950 group-hover:scale-105 transition-transform duration-[30s] ease-linear" />
        <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/connected.png')] animate-slide-diagonal" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        <div className="absolute top-12 left-12">
           <div className="flex items-center gap-3 bg-slate-950/50 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Análise de Dados Ativa</span>
           </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6 max-w-3xl">
             <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-[10px] font-black uppercase tracking-[0.25em]">Monitor de Pulso Estratégico</span>
             </div>
             <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[1] md:leading-[0.85]">
               Rentabilidade <span className="text-emerald-500 italic drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">Otimizada</span>
             </h2>
             <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-xl">
               Análise profunda de rentabilidade, gestão de custos invisíveis e projeções financeiras alimentadas por inteligência artificial tática.
             </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl space-y-3 min-w-full sm:min-w-[200px] hover:border-emerald-500/30 transition-all group/card">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximo Pagamento</p>
                   <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">+ R$ {(projections.length > 0 ? (projections[0].projected || 0) : 0).toLocaleString()}</p>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[65%] group-hover/card:w-[85%] transition-all duration-1000" />
                </div>
             </div>
             <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl space-y-3 min-w-full sm:min-w-[200px] hover:border-sky-500/30 transition-all group/card">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ranking Global</p>
                   <Activity className="w-4 h-4 text-sky-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">Elite <span className="text-sky-500 text-xl font-medium">{(stats.totalProfit / (Math.max(stats.totalRevenue, 1) || 1) * 100).toFixed(1)}</span></p>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-sky-500 w-[45%] group-hover/card:w-[75%] transition-all duration-1000" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* ─── PENDING MONITOR ALERT ─── */}
      {stats.pendingReceivables > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Zap className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-2 flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Protocolo de Caixa: Saldo Pendente Detectado</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
              Existem <span className="text-indigo-400 font-black">R$ {stats.pendingReceivables.toLocaleString()}</span> aguardando liberação. Este valor representa lucro em trânsito e impacta diretamente sua reserva de emergência.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab?.('trips')}
            className="px-8 py-4 bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            Revisar Pendentes
          </button>
        </div>
      )}

      {profile.config.enableBI !== false && (
        <AIInsights insights={aiInsights} trips={trips} vehicles={vehicles} shippers={shippers} />
      )}

      {/* ─── STATS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Volume de Receita" value={`R$ ${stats.totalRevenue.toLocaleString()}`} trend={timeFilter} isPositive={true} icon={DollarSign} uiStyle={uiStyle} color="emerald" />
        <StatCard
          title="Lucro Residual"
          value={`R$ ${stats.totalProfit.toLocaleString()}`}
          trend={timeFilter}
          isPositive={true}
          icon={TrendingUp}
          uiStyle={uiStyle}
          color="emerald"
        />
        <StatCard title="Fluxo em Trânsito" value={`R$ ${stats.pendingReceivables.toLocaleString()}`} trend="Pendente" isPositive={false} icon={Clock} uiStyle={uiStyle} color="amber" />
        {profile.config.userRole !== 'autonomo' ? (
          <StatCard title="Capital Humano" value={`R$ ${stats.driverCommissions.toLocaleString()}`} trend="Comissões" isPositive={true} icon={CreditCard} uiStyle={uiStyle} color="indigo" />
        ) : (
          <StatCard title="Ativos Monitorados" value={vehicles.length.toString()} trend="Placas" isPositive={true} icon={Users} uiStyle={uiStyle} color="sky" />
        )}
      </div>

      {profile.config.userRole === 'autonomo' && <AutonomousDriverTips />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ${uiStyle === 'deep' ? 'ring-1 ring-emerald-500/20' : ''}`}>
          {uiStyle === 'deep' && <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Activity className="w-32 h-32 text-emerald-500" /></div>}
          <h3 className="font-black text-slate-500 uppercase text-[10px] tracking-widest mb-8 border-b border-slate-800 pb-4">Desempenho de Caixa <span className="text-emerald-500">Tempo Real</span></h3>
          <div className="h-64 w-full">
            <DashboardNeuralChart data={chartData} uiStyle={uiStyle} />
          </div>
        </div>

        <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden ${uiStyle === 'deep' ? 'ring-1 ring-emerald-500/20' : ''}`}>
          <h3 className="font-black text-slate-500 uppercase text-[10px] tracking-widest mb-6 border-b border-slate-800 pb-4">Ranking de Renda / Placa</h3>
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

      {/* Projection Chart Section */}
      <div className={`bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden ${uiStyle === 'deep' ? 'ring-1 ring-purple-500/20' : ''}`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12">
          <Sparkles className="w-48 h-48 text-purple-500" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-800/50 pb-6">
          <div>
            <h3 className="font-black text-white uppercase text-xl tracking-tighter flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-500" /> Insights Preditivos IA
            </h3>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Projeção Baseada em Redes Neurais e Histórico de Rentabilidade</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
             <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Previsão Próximos 3 Meses</span>
          </div>
        </div>
        
        <div className="h-72 w-full">
           <DashboardProjectionChart data={projections} uiStyle={uiStyle} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-800/50">
           {projections.filter(p => p.isFuture).map((p, i) => (
             <div key={i} className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Expectativa {p.month}</span>
                <span className="text-lg font-black text-purple-400 italic">R$ {p.projected.toLocaleString()}</span>
                <div className="flex items-center gap-2 mt-1">
                   <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500/50 animate-pulse" style={{ width: '70%' }} />
                   </div>
                   <span className="text-[8px] font-bold text-slate-600">Confiança 85%</span>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, color, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-6 bg-slate-950 border border-slate-800 rounded-3xl hover:border-${color}-500/50 hover:bg-slate-900 transition-all group`}>
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

const DashboardProjectionChart = ({ data, uiStyle }: { data: any[], uiStyle?: string }) => {
  if (!data || data.length === 0) return null;
  const w = 800; const h = 300; const p = 40;
  
  // Encontrar o maior valor entre actual e projected para escala
  const maxV = Math.max(...data.map(d => Math.max(d.actual, d.projected)), 1000) * 1.2;
  const getX = (i: number) => p + (i * (w - 2 * p)) / (data.length - 1);
  const getY = (v: number) => h - p - (v * (h - 2 * p)) / maxV;

  // Pontos para a linha histórica (actual) e projetada
  const historyPts = data.filter(d => !d.isFuture).map((d, i) => `${getX(i)},${getY(d.actual)}`).join(' ');
  
  // Projeção começa no último ponto histórico
  const lastHistoryIndex = data.findIndex(d => d.isFuture) - 1;
  const projectionPts = data.slice(lastHistoryIndex >= 0 ? lastHistoryIndex : 0).map((d, i) => {
    const idx = (lastHistoryIndex >= 0 ? lastHistoryIndex : 0) + i;
    return `${getX(idx)},${getY(d.projected)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <defs>
        <linearGradient id="progG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Grid Lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={p} y1={getY(maxV * f / 1.2)} x2={w-p} y2={getY(maxV * f / 1.2)} stroke="#1e293b" strokeDasharray="4 4" />
      ))}

      {/* Area under projection */}
      <path 
        d={`M ${getX(lastHistoryIndex)},${h-p} L ${projectionPts} L ${getX(data.length-1)},${h-p} Z`} 
        fill="url(#progG)" 
        className="opacity-50"
      />

      {/* Historical Line */}
      <polyline points={historyPts} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Projection Line (Dashed) */}
      <polyline points={projectionPts} fill="none" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" className="animate-[pulse_2s_infinite]" />

      {/* Points */}
      {data.map((d, i) => (
        <g key={i}>
          <circle 
            cx={getX(i)} 
            cy={getY(d.isFuture ? d.projected : d.actual)} 
            r={d.isFuture ? "5" : "4"} 
            fill="#0f172a" 
            stroke={d.isFuture ? "#a855f7" : "#10b981"} 
            strokeWidth="2" 
          />
          <text x={getX(i)} y={h - 10} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">{d.month}</text>
          {d.isFuture && (
             <text x={getX(i)} y={getY(d.projected) - 15} textAnchor="middle" fill="#a855f7" fontSize="9" fontWeight="black">R$ {Math.round(d.projected/1000)}k</text>
          )}
        </g>
      ))}
    </svg>
  );
};

const StatCard: React.FC<{ title: string; value: string; trend: string; isPositive: boolean; icon: any; uiStyle?: string; color?: string }> = ({ title, value, trend, isPositive, icon: Icon, uiStyle, color = 'emerald' }) => {
  const colorClasses: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500 shadow-emerald-500/20',
    sky: 'text-sky-500 bg-sky-500 shadow-sky-500/20',
    indigo: 'text-indigo-500 bg-indigo-500 shadow-indigo-500/20',
    amber: 'text-amber-500 bg-amber-500 shadow-amber-500/20',
    rose: 'text-rose-500 bg-rose-500 shadow-rose-500/20',
    purple: 'text-purple-500 bg-purple-500 shadow-purple-500/20',
  };

  const selectedColor = colorClasses[color] || colorClasses.emerald;
  const colorHex = selectedColor.split(' ')[0];

  return (
    <div className={`bg-slate-900 border border-slate-800 p-8 rounded-[3rem] hover:bg-slate-800/80 transition-all group relative overflow-hidden shadow-2xl ${uiStyle === 'deep' ? 'hover:ring-1 hover:ring-white/10' : ''}`}>
      <div className="flex items-center justify-between mb-8">
        <div className={`p-4 bg-slate-950 rounded-2xl ${colorHex} group-hover:scale-110 group-hover:bg-opacity-100 transition-all duration-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl ${isPositive ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
          {isPositive && <ArrowUpRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{title}</h4>
        <p className={`text-3xl font-black text-white italic tracking-tighter transition-all duration-500 group-hover:translate-x-1 ${uiStyle === 'deep' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]' : ''}`}>{value}</p>
      </div>
      
      {/* Neural Decoration */}
      <div className="absolute bottom-4 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-12 h-12" />
      </div>
      
      {uiStyle === 'deep' && (
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${color}-500/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700`} />
      )}
    </div>
  );
};

const AutonomousDriverTips = () => {
  return (
    <div className="bg-sky-500/10 border border-sky-500/20 p-8 rounded-[2.5rem] shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Minuto do Autônomo</h3>
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Dicas valiosas para aumentar o seu lucro na estrada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-sky-500/10 hover:border-sky-500/30 transition-all group">
          <h4 className="text-sky-500 font-black text-sm uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">1. Otimização do Diesel</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Mantenha a rotação do motor na faixa verde (torque máximo). Isso pode gerar uma economia de até **15% no consumo**. Lembre-se: aceleração suave é dinheiro no bolso!
          </p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-sky-500/10 hover:border-sky-500/30 transition-all group">
          <h4 className="text-sky-500 font-black text-sm uppercase tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">2. Gestão de Pneus</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Calibre os pneus a frio (com o caminhão parado). Rodar com a pressão correta não só poupa combustível mas aumenta a lona e a vida útil para recapagem.
          </p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-sky-500/10 hover:border-sky-500/30 transition-all group">
          <h4 className="text-sky-500 font-black text-sm uppercase tracking-tighter mb-2 group-hover:text-amber-400 transition-colors">3. Gestão Financeira</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Separe sempre um percentual do valor líquido do frete (ex: 10%) para um "Caixa de Reserva". Manutenções inesperadas ou quebras não podem parar o seu faturamento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
