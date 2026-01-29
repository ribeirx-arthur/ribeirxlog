
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
  CreditCard
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { TabType, UserProfile } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Viagens', icon: Truck },
    { id: 'performance', label: 'BI & Performance', icon: TrendingUp },
    { id: 'maintenance', label: 'Saúde da Frota', icon: ShieldAlert, hidden: !profile.config.showMileage },
    { id: 'setup', label: 'Cadastros', icon: Users },
    { id: 'subscription', label: 'Assinatura', icon: CreditCard },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto hidden md:flex z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Truck className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">RIBEIRX<span className="text-emerald-500">LOG</span></span>
        </div>

        <nav className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 ml-2">Menu Principal</p>
          {menuItems.filter(item => !item.hidden).map((item) => {
            const Icon = item.icon;
            const isLocked = profile.payment_status !== 'paid' && !['subscription', 'settings'].includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                disabled={isLocked && activeTab === item.id} // Don't disable but maybe show locked
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed group' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isLocked && <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <button
          onClick={() => setActiveTab('new-trip')}
          className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all shadow-lg ${activeTab === 'new-trip'
            ? 'bg-sky-500 text-white shadow-sky-500/20'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}
        >
          <PlusCircle className="w-5 h-5" />
          Novo Lançamento
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 transition-colors py-2 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
