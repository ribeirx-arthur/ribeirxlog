
import React, { useState } from 'react';
import {
  Bell, Search, HelpCircle, User, X, AlertTriangle, ChevronRight, RefreshCcw,
  Share2
} from 'lucide-react';
import { UserProfile, AppNotification, TabType } from '../types';

interface HeaderProps {
  profile: UserProfile;
  notifications: AppNotification[];
  onReadNotification: (id: string) => void;
  setActiveTab: (tab: TabType) => void;
  activeTab: TabType;
  onRefresh?: () => void;
}

const Header: React.FC<HeaderProps> = ({ profile, notifications, onReadNotification, setActiveTab, activeTab, onRefresh }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-[100] md:ml-64">
      <div className="flex items-center gap-4 flex-1">
        {activeTab === 'trips' && (
          <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-96 group focus-within:border-emerald-500/50 transition-all">
            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-emerald-500" />
            <input
              type="text"
              placeholder="Pesquisar placa, motorista ou identificador..."
              className="bg-transparent text-xs text-slate-200 outline-none w-full font-medium"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900 text-[8px] font-black text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificações */}
            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <header className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Central de Avisos</h4>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </header>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => onReadNotification(n.id)}
                        className={`p-5 border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50 transition-colors ${n.read ? 'opacity-60' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'payment_delay' ? 'bg-rose-500/10 text-rose-500' : 'bg-sky-500/10 text-sky-500'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-white">{n.title}</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase mt-2">{new Date(n.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                        <Bell className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Tudo limpo por aqui!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className={`p-3 rounded-2xl transition-all relative ${showFaq ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Creative FAQ Modal */}
            {showFaq && (
              <div className="fixed md:absolute inset-x-4 md:inset-x-auto right-auto md:right-0 top-20 md:top-auto md:mt-4 md:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[110]">
                <div className="h-32 bg-gradient-to-br from-emerald-600 to-teal-800 relative p-6 flex flex-col justify-end overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <h3 className="text-xl font-black text-white relative z-10">Central de Ajuda</h3>
                  <p className="text-emerald-100 text-xs font-medium relative z-10">Tire suas dúvidas ou entre em contato</p>
                </div>

                <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                  {/* Contact Card */}
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suporte Direto</p>
                      <p className="text-sm font-bold text-white">Arthur Ribeiro</p>
                      <a href="mailto:arthur.ribeirx@gmail.com" className="text-xs text-emerald-400 hover:underline">arthur.ribeirx@gmail.com</a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Perguntas Frequentes</p>

                    {[
                      { q: "Como a IA calcula previsões?", a: "Utilizamos algoritmos locais baseados no histórico dos últimos 6 meses de viagens." },
                      { q: "Posso adicionar motoristas?", a: "Sim, através da aba 'Cadastros' > 'Motoristas'. Documentação válida é obrigatória." },
                      { q: "O sistema funciona offline?", a: "Parcialmente. Você pode visualizar dados cacheados, mas precisa de internet para sincronizar." }
                    ].map((item, i) => (
                      <div key={i} className="group cursor-pointer">
                        <h5 className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors mb-1 flex items-center justify-between">
                          {item.q}
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                        </h5>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 text-center border-t border-slate-800">
                  <button onClick={() => setShowFaq(false)} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Fechar Central</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all hover:border-emerald-500/30 group hidden md:flex"
              title="Forçar Atualização"
            >
              <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Ribeirx Log ERP',
                  text: 'Estou usando o Ribeirx Log para gerenciar minha logística. É sensacional!',
                  url: window.location.origin
                }).catch(err => console.log('Error sharing', err));
              } else {
                window.open(`https://wa.me/?text=Estou usando o Ribeirx Log para gerenciar minha logística. Veja aqui: ${window.location.origin}`, '_blank');
              }
            }}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all hover:border-emerald-500/30 group"
            title="Compartilhar App"
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 py-1.5 pl-1.5 pr-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800/80 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${profile.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                  {profile.plan_type || 'Sem Plano'}
                </span>
                <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">{profile.name}</p>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{profile.companyName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-black text-emerald-950 shadow-lg shadow-emerald-500/20 border-2 border-slate-900 overflow-hidden">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} className="w-full h-full object-cover" />
              ) : (
                profile.name.split(' ').map(n => n[0]).join('')
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
