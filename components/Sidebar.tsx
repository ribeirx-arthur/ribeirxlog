
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
  Wrench,
  Landmark
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
  isDemo?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, profile, isOpen, onClose, appVersion, isDemo
}) => {
  const { signOut } = useAuth();

  const navigate = (tab: TabType) => {
    setActiveTab(tab);
    onClose?.();
  };

  const userEmail = profile.email?.trim().toLowerCase() || '';
  const adminEmails = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthur.riberix@gmail.com',
    'arthurpsantos01@gmail.com',
    'arthur_ribeiro09@outlook.com'
  ];
  const isAdmin = adminEmails.includes(userEmail) ||
    userEmail.endsWith('@ribeirxlog.com') ||
    (profile.name?.toLowerCase().includes('ribeirxlog'));

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Viagens', icon: Truck },
    ...(profile.config.enableOngoingTrips ? [{ id: 'ongoing-trips', label: 'Viagens Ativas', icon: MapPin, badge: 'PRO' }] : []),
    ...(profile.config.enableBank ? [{ id: 'bank', label: 'Banco', icon: Landmark, badge: 'PRO' }] : []),
    { id: 'performance', label: 'BI & Performance', icon: TrendingUp },
    { id: 'intelligence', label: 'IA Estratégica', icon: Brain },
    { id: 'tires', label: 'Gestão de Pneus', icon: Disc, badge: 'PRO' },
    { id: 'compliance', label: 'Documentos & CNH', icon: ShieldCheck, badge: 'PRO' },
    { id: 'help', label: 'Central de Ajuda', icon: HelpCircle },
  ];

  // Itens que só aparecem se NÃO for modo Demo
  const managementItems = !isDemo ? [
    { id: 'drivers', label: 'Motoristas', icon: Users },
    { id: 'setup', label: 'Frota & Unidades', icon: PlusCircle },
    { id: 'freight-calculator', label: 'Calculadora', icon: Calculator },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'subscription', label: 'Planos & Assinaturas', icon: CreditCard },
    ...(isAdmin ? [{ id: 'admin', label: 'Painel Admin', icon: ShieldAlert }] : [])
  ] : [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
                fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-[200]
                transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-64 md:translate-x-0'}
            `}>
        {/* Logo Section */}
        <div className="p-6 md:p-8 border-b border-white/5 shrink-0">
          <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('dashboard')}>
            <div className="relative">
              <img
                src="/icon.svg"
                alt="RBX"
                className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg md:text-xl font-black tracking-tighter text-white uppercase italic leading-none">RBX<span className="text-emerald-500">LOG</span></span>
              <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Intelligence</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 md:space-y-8 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Primary Actions (Hidden in Demo) */}
          {!isDemo && (
            <div className="space-y-2">
              <button
                onClick={() => navigate('new-trip')}
                className={`
                   w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                   ${activeTab === 'new-trip'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]'
                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'}
               `}
              >
                <PlusCircle className="w-4 h-4" />
                Lançar Viagem
              </button>
            </div>
          )}

          {/* Main Menu */}
          <nav className="space-y-1">
            <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 italic">Operação & BI</p>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id as TabType)}
                className={`
                    w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group
                    ${activeTab === item.id
                    ? 'bg-white/5 text-white ring-1 ring-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-emerald-500' : 'group-hover:text-slate-300'}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Management Section (Filtered in Demo) */}
          {managementItems.length > 0 && (
            <nav className="space-y-1">
              <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 italic">Gestão & Frota</p>
              {managementItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id as TabType)}
                  className={`
                      w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group
                      ${activeTab === item.id
                      ? 'bg-white/5 text-white ring-1 ring-white/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 transition-colors ${activeTab === item.id ? 'text-emerald-500' : 'group-hover:text-slate-300'}`} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* User profile box (Static/Clean) */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.25)] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-400 leading-none block truncate uppercase tracking-wider">{profile.name || 'Usuário'}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1 block">
                {profile.plan_type === 'frota_elite' ? '✦ Frota Elite' :
                  profile.plan_type === 'gestor_pro' ? 'Gestor Pro' :
                    profile.plan_type === 'piloto' ? 'Plano Piloto' :
                      profile.plan_type === 'lifetime' ? 'Legado Vitalício' :
                        profile.plan_type === 'anual' ? 'Legado Anual' :
                          profile.plan_type === 'mensal' ? 'Legado Mensal' :
                            'Conta Grátis'}
              </span>
            </div>
            {!isDemo && (
              <button onClick={() => signOut()} title="Sair" className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-center text-[9px] font-black text-slate-700 tracking-[0.3em] uppercase mt-4">v{appVersion || '1.7.1'}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
