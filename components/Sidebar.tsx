
import React from 'react';
import {
  LayoutDashboard,
  Truck,
  TrendingUp,
  Settings,
  PlusCircle,
  Users,
  ShieldAlert,
  LogOut,
  CreditCard,
  Disc,
  Brain,
  ShieldCheck,
  X,
  Calculator,
  Database,
  MapPin,
  FolderOpen,
  HelpCircle
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
  const { features, uiStyle } = useAppMode();
  const { signOut } = useAuth();

  const adminEmails = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthur.riberix@gmail.com',
    'arthurpsantos01@gmail.com',
    'arthur_ribeiro09@outlook.com'
  ];
  const isAdmin = adminEmails.includes(profile.email?.trim().toLowerCase() || '') || profile.name?.toLowerCase().includes('ribeirxlog');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gps-tracking', label: 'Mapa', icon: MapPin },
    { id: 'proof-gallery', label: 'Documentos', icon: FolderOpen },
    { id: 'trips', label: 'Viagens', icon: Truck },
    { id: 'drivers', label: 'Motoristas', icon: Users },
    { id: 'performance', label: 'BI & Performance', icon: TrendingUp, hidden: !features.canAccessBI },
    { id: 'maintenance', label: 'Saúde da Frota', icon: ShieldAlert, hidden: !features.canAccessFullMaintenance },
    { id: 'tires', label: 'Gestão de Pneus', icon: Disc, hidden: !features.canAccessTires },
    { id: 'intelligence', label: 'Inteligência', icon: Brain, hidden: profile.config.showTips === false },
    { id: 'freight-calculator', label: 'Cálculo de Frete', icon: Calculator, hidden: profile.config.enableFreightCalculator === false },
    { id: 'setup', label: 'Cadastros', icon: Database },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'help', label: 'Tutoriais & Ajuda', icon: HelpCircle },
    { id: 'admin', label: 'Administração', icon: ShieldCheck, hidden: !isAdmin },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[140] md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-[150] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${uiStyle === 'deep' ? 'shadow-[10px_0_30px_rgba(16,185,129,0.05)]' : ''}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${uiStyle === 'deep' ? 'animate-in zoom-in-50 duration-500' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${uiStyle === 'minimal' ? 'bg-white text-black' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}>
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tighter text-white">RIBEIRX<span className={uiStyle === 'minimal' ? 'text-white/50' : 'text-emerald-500'}>LOG</span></span>
                <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                  {uiStyle === 'minimal' ? 'Logística Simples' : uiStyle === 'deep' ? 'Neural OS RBS' : 'Inteligência Logística'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400 md:hidden border border-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {profile.payment_status !== 'paid' && !isAdmin && (
              <div className="mx-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Versão Gratuita</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">Sua conta possui limites de registros. Faça upgrade para acesso total.</p>
              </div>
            )}
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-2">Navegação {uiStyle === 'deep' ? 'Tática' : ''}</p>
            {menuItems.filter(item => !item.hidden).map((item) => {
              const Icon = item.icon;
              const isLocked = profile.payment_status !== 'paid' &&
                !['subscription', 'settings', 'admin', 'intelligence'].includes(item.id) &&
                !isAdmin;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as TabType); onClose?.(); }}
                  className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                    ? (uiStyle === 'neural' || uiStyle === 'deep'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20')
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  {isLocked && <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />}
                  {activeTab === item.id && (
                    <div className={`w-1.5 h-1.5 rounded-full ${uiStyle === 'deep' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : (uiStyle === 'minimal' ? 'bg-white' : 'bg-emerald-500')}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <button
            onClick={() => setActiveTab('new-trip')}
            className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${activeTab === 'new-trip'
              ? 'bg-sky-500 text-white shadow-sky-500/30'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              }`}
          >
            <PlusCircle className="w-5 h-5" />
            Novo Lançamento
          </button>

          <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10 rounded-xl" } }} />
              <div className="flex flex-col">
                <span className="text-xs font-black text-white truncate w-24">{profile.name || 'Usuário'}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  {profile.plan_type === 'lifetime' ? 'Plano Vitalício' :
                    profile.plan_type === 'anual' ? 'Plano Anual' :
                      profile.plan_type === 'mensal' ? 'Plano Mensal' : 'Conta Grátis'}
                </span>
              </div>
            </div>
            <button onClick={() => signOut()} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-700 tracking-[0.3em] uppercase">v{appVersion || '1.7.0'}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
