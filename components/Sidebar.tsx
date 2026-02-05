
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
  ShieldCheck
} from 'lucide-react';
import { UserButton, useAuth } from "@clerk/nextjs";
import { useAppMode } from '../contexts/AppModeContext';
import { TabType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile }) => {
  const { features } = useAppMode();
  const { signOut } = useAuth();

  const menuItems = [
    // ... existing items ...
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Viagens', icon: Truck },
    { id: 'performance', label: 'BI & Performance', icon: TrendingUp, hidden: !features.canAccessBI },
    { id: 'maintenance', label: 'Saúde da Frota', icon: ShieldAlert, hidden: !features.canAccessFullMaintenance },
    { id: 'tires', label: 'Gestão de Pneus', icon: Disc, hidden: !features.canAccessTires },
    { id: 'intelligence', label: 'Inteligência', icon: Brain },
    { id: 'setup', label: 'Cadastros', icon: Users },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'admin', label: 'Administração', icon: ShieldCheck, hidden: !['arthur@ribeirxlog.com', 'arthur.ribeirx@gmail.com'].includes(profile.email?.trim().toLowerCase() || '') },
  ];

  const adminEmails = ['arthur@ribeirxlog.com', 'arthur.ribeirx@gmail.com'];
  const isAdmin = adminEmails.includes(profile.email?.trim().toLowerCase() || '');

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto hidden md:flex z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Truck className="text-white w-6 h-6" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter text-white">RIBEIRX<span className="text-emerald-500">LOG</span></span>
            <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Inteligência Logística</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-2">Main Navigation</p>
          {menuItems.filter(item => !item.hidden).map((item) => {
            const Icon = item.icon;
            const isLocked = profile.payment_status !== 'paid' &&
              !['subscription', 'settings', 'admin', 'intelligence'].includes(item.id) &&
              !isAdmin;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {isLocked && <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />}
                {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />}
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
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Conta Grátis</span>
            </div>
          </div>
          <button onClick={() => signOut()} className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-700 tracking-[0.3em] uppercase">v1.6.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
