
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Truck,
  Users,
  Calculator,
  MapPin,
  ChevronDown,
  LogOut,
  CreditCard,
  PlusCircle,
  HelpCircle,
  Settings,
  ShieldCheck,
  TrendingUp,
  ShieldAlert,
  Disc,
  Brain,
  FolderOpen,
  Database,
  X,
  Wrench
} from 'lucide-react';
import { UserButton, useAuth } from "@clerk/nextjs";
import { useAppMode } from '../contexts/AppModeContext';
import { TabType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: UserProfile;
  isOpen?: boolean;
  onClose?: () => void;
  appVersion?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile, isOpen, onClose, appVersion }) => {
  const { features } = useAppMode();
  const { signOut } = useAuth();
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const adminEmails = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthur.riberix@gmail.com',
    'arthurpsantos01@gmail.com',
    'arthur_ribeiro09@outlook.com'
  ];
  const isAdmin = adminEmails.includes(profile.email?.trim().toLowerCase() || '') || profile.name?.toLowerCase().includes('ribeirxlog');

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    onClose?.();
  };

  // ─── PRIMARY items — always visible ───
  const primaryItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Visão financeira' },
    { id: 'trips', label: 'Viagens', icon: Truck, desc: 'Histórico de fretes' },
    { id: 'drivers', label: 'Motoristas', icon: Users, desc: 'Sua equipe' },
    { id: 'freight-calculator', label: 'Calcular Frete', icon: Calculator, desc: 'Simular viagem' },
    { id: 'gps-tracking', label: 'Mapa', icon: MapPin, desc: 'Rastear rotas' },
  ] as const;

  // ─── TOOLS — hidden in expandable group ───
  const toolItems = [
    { id: 'performance', label: 'BI & Performance', icon: TrendingUp, hidden: !features.canAccessBI },
    { id: 'maintenance', label: 'Saúde da Frota', icon: ShieldAlert, hidden: !features.canAccessFullMaintenance },
    { id: 'tires', label: 'Gestão de Pneus', icon: Disc, hidden: !features.canAccessTires },
    { id: 'intelligence', label: 'Inteligência IA', icon: Brain, hidden: profile.config.showTips === false },
    { id: 'proof-gallery', label: 'Documentos', icon: FolderOpen, hidden: false },
    { id: 'setup', label: 'Cadastros', icon: Database, hidden: false },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, hidden: !isAdmin },
  ].filter(i => !i.hidden) as any[];

  const isToolActive = toolItems.some(t => t.id === activeTab);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[140] md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`w-64 bg-slate-900 border-r border-slate-800/60 flex flex-col h-screen fixed left-0 top-0 z-[150] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* ── Logo ── */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tighter text-white">RIBEIRX<span className="text-emerald-500">LOG</span></span>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-none">Inteligência Logística</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-white md:hidden transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Trial warning ── */}
        {profile.payment_status !== 'paid' && !isAdmin && (
          <div className="mx-4 mb-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl">
            <p className="text-[10px] text-amber-400 font-bold leading-relaxed">
              ⚡ Versão gratuita — <button onClick={() => navigate('subscription')} className="underline">fazer upgrade</button>
            </p>
          </div>
        )}

        {/* ── New Trip CTA ── */}
        <div className="px-4 mb-4 shrink-0">
          <button
            onClick={() => navigate('new-trip')}
            className={`w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-2xl transition-all shadow-lg text-sm ${activeTab === 'new-trip'
              ? 'bg-sky-500 text-white shadow-sky-500/20'
              : 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-emerald-500/20 hover:scale-[1.02] active:scale-95'
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>

        {/* ── Primary Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-2">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Principal</p>

          {primaryItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id as TabType)}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800/50 text-slate-500 group-hover:bg-slate-700 group-hover:text-white'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className={`text-xs font-bold leading-none ${isActive ? 'text-emerald-400' : ''}`}>{item.label}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 font-medium">{item.desc}</p>
                </div>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
              </button>
            );
          })}

          {/* ── Ferramentas (collapsible) ── */}
          <div className="pt-3">
            <button
              onClick={() => setToolsExpanded(p => !p)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${isToolActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em]">Ferramentas</p>
              </div>
              <div className={`flex items-center gap-2 transition-all`}>
                {isToolActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${toolsExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${toolsExpanded || isToolActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-0.5 pt-1 pl-2">
                {toolItems.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id as TabType)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold">{item.label}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* ── Bottom utility strip ── */}
        <div className="shrink-0 border-t border-slate-800/60 px-4 pt-3 pb-4 space-y-3">
          {/* Icon row */}
          <div className="flex items-center justify-around">
            {[
              { id: 'settings', icon: Settings, label: 'Config.' },
              { id: 'help', icon: HelpCircle, label: 'Ajuda' },
              { id: 'subscription', icon: CreditCard, label: 'Plano' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => navigate(id as TabType)}
                title={label}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === id ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/40'}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase tracking-wide">{label}</span>
              </button>
            ))}
          </div>

          {/* User row */}
          <div className="bg-slate-800/30 rounded-2xl px-3 py-2.5 flex items-center gap-3">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-white leading-none block truncate">{profile.name || 'Usuário'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                {profile.plan_type === 'lifetime' ? '✦ Vitalício' :
                  profile.plan_type === 'anual' ? 'Anual' :
                    profile.plan_type === 'mensal' ? 'Mensal' : 'Conta Grátis'}
              </span>
            </div>
            <button onClick={() => signOut()} title="Sair" className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-center text-[9px] font-black text-slate-700 tracking-[0.3em] uppercase">v{appVersion || '1.7.1'}</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
