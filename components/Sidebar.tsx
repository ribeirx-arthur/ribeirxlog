
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
  Landmark,
  Target
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
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab, setActiveTab, profile, isOpen, onClose, appVersion, isDemo, isCollapsed, setIsCollapsed
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
    'arthur_ribeiro09@outlook.com',
    'arthurribeiro.contato@gmail.com',
    'arthurribeiro@ribeirxlog.com.br',
    'ribeirxlog@gmail.com',
    'arthur@ribeirxlog.com.br'
  ];
  const isAdmin = adminEmails.includes(userEmail) ||
    userEmail.endsWith('@ribeirxlog.com') ||
    userEmail.endsWith('@ribeirxlog.com.br');

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
                fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 z-[200]
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-64 md:translate-x-0'}
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}>
        {/* Logo Section */}
        <div className={`p-6 border-b border-white/5 shrink-0 transition-all duration-500 ${isCollapsed ? 'px-4 flex justify-center' : 'md:p-8'}`}>
          <div 
            className={`flex items-center gap-3 group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`} 
            onClick={() => navigate('dashboard')}
          >
            <div className="relative shrink-0">
              <img
                src="/icon.svg"
                alt="RBX"
                className={`w-auto object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500 ${isCollapsed ? 'h-8' : 'h-10'}`}
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                <span className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">RBX<span className="text-emerald-500">LOG</span></span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Intelligence</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 md:space-y-8 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Primary Actions */}
          {!isDemo && (
            <div className="space-y-2">
              <button
                onClick={() => navigate('new-trip')}
                className={`
                   w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all overflow-hidden
                   ${activeTab === 'new-trip'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_10px_20px_rgba(16,185,129,0.2)]'
                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'}
                   ${isCollapsed ? 'justify-center px-0' : ''}
               `}
              >
                <PlusCircle className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-500">Lançar Viagem</span>}
              </button>
            </div>
          )}

          {/* Main Menu */}
          <nav className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 italic animate-in fade-in">Operação & BI</p>}
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id as TabType)}
                title={isCollapsed ? item.label : ''}
                className={`
                    w-full flex items-center justify-between px-4 py-3.5 rounded-[1.25rem] transition-all group relative
                    ${activeTab === item.id
                    ? 'bg-white/5 text-white ring-1 ring-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}
                    ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === item.id ? 'text-emerald-500' : 'group-hover:text-slate-300'}`} />
                  {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 h-4 overflow-hidden">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{item.badge}</span>
                )}
                {isCollapsed && activeTab === item.id && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Management Section */}
          {managementItems.length > 0 && (
            <nav className="space-y-1">
              {!isCollapsed && <p className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 italic animate-in fade-in">Gestão & Frota</p>}
              {managementItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id as TabType)}
                  title={isCollapsed ? item.label : ''}
                  className={`
                      w-full flex items-center justify-between px-4 py-3.5 rounded-[1.25rem] transition-all group relative
                      ${activeTab === item.id
                      ? 'bg-white/5 text-white ring-1 ring-white/10'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'}
                      ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${activeTab === item.id ? 'text-emerald-500' : 'group-hover:text-slate-300'}`} />
                    {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 h-4 overflow-hidden">{item.label}</span>}
                  </div>
                  {isCollapsed && activeTab === item.id && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  )}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* User profile box */}
        <div className={`p-4 border-t border-white/5 transition-all duration-500 ${isCollapsed ? 'items-center flex flex-col gap-4' : ''}`}>
          <div className={`bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3 py-3 flex items-center gap-3 transition-all duration-500 ${isCollapsed ? 'justify-center w-12 h-12 p-0 rounded-xl' : ''}`}>
            {!isCollapsed ? (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-400 leading-none block truncate uppercase tracking-[0.1em]">{profile.name || 'Usuário'}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1 block">
                    {profile.plan_type?.replace('_', ' ') || 'Grátis'}
                  </span>
                </div>
                {!isDemo && (
                  <button onClick={() => signOut()} title="Sair" className="p-1.5 text-slate-500 hover:text-rose-500 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 rounded-lg",
                    userButtonTrigger: "focus:shadow-none"
                  }
                }}
              />
            )}
          </div>
          
          <div className={`flex items-center transition-all duration-500 ${isCollapsed ? 'justify-center border-t border-white/5 pt-4 w-full' : 'justify-between mt-4'}`}>
            {!isCollapsed && <p className="text-[8px] font-black text-slate-700 tracking-[0.4em] uppercase">v{appVersion || '1.7.1'}</p>}
            <button 
              onClick={() => setIsCollapsed?.(!isCollapsed)}
              className="p-2 text-slate-600 hover:text-emerald-500 transition-colors hover:bg-emerald-500/5 rounded-lg"
              title={isCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4 -rotate-90" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
