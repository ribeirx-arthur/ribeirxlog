import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
    Users,
    Search,
    ShieldCheck,
    Mail,
    Lock,
    Unlock,
    AlertCircle,
    RefreshCcw,
    Database,
    HardDrive,
    Zap,
    ChevronRight,
    ShieldAlert,
    Calendar,
    Clock
} from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AdminPanelProps {
    profile: UserProfile;
    supabaseClient: SupabaseClient;
}

export const AdminPanel = ({ profile, supabaseClient }: AdminPanelProps) => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [totalTrips, setTotalTrips] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [supabaseClient]);

    const fetchUsers = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            // Usa o client autenticado (que tem o RLS permissivo para admins)
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Admin fetch error:", error);
                if (error.message?.toLowerCase().includes('jwt expired')) {
                    setErrorMsg('Sua sessão de segurança expirou. Por favor, atualize a página para renovar seu acesso de Admin.');
                } else {
                    setErrorMsg(error.message);
                }
            } else if (data) {
                setUsers(data);
            }

            // Puxa o total de viagens para o heatmap
            const { count, error: tripError } = await supabaseClient
                .from('trips')
                .select('*', { count: 'exact', head: true });

            if (!tripError && count !== null) setTotalTrips(count);

        } catch (err: any) {
            console.error("Admin general error:", err);
            setErrorMsg('Erro de conexão ao buscar dados do Admin.');
        }
        setLoading(false);
    };

    const updateUser = async (userId: string, updates: any) => {
        const { error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (!error) {
            fetchUsers();
        } else {
            console.error("Error updating user:", error);
            if (error.message?.toLowerCase().includes('jwt expired')) {
                setErrorMsg('Sessão expirada. Atualize a página antes de continuar.');
            } else {
                setErrorMsg(`Erro ao atualizar: ${error.message}`);
            }
        }
    };

    const filteredUsers = users.filter(u => {
        const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const userStatus = u.payment_status || 'unpaid';
        const statusMatch = statusFilter === 'all' || userStatus === statusFilter;
        return (emailMatch || nameMatch) && statusMatch;
    });

    const getDaysRemaining = (user: any) => {
        const expiry = user.subscription_expires_at || user.trial_ends_at;
        if (!expiry) return null;
        const diff = Math.ceil((new Date(expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const paidCount = users.filter(u => u.payment_status === 'paid').length;
    const unpaidCount = users.filter(u => !u.payment_status || u.payment_status === 'unpaid').length;

    return (
        <div className="space-y-8 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        Central <span className="text-emerald-500">Admin</span>
                    </h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Gerenciamento de Planos e Usuários</p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={fetchUsers}
                        className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-slate-500 hover:text-emerald-500 transition-colors flex items-center justify-center"
                        title="Atualizar Dados"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center min-w-[100px]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-white italic">{users.length}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl text-center min-w-[100px]">
                        <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Pagos</p>
                        <p className="text-2xl font-black text-emerald-400 italic">{paidCount}</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-3xl text-center min-w-[100px]">
                        <p className="text-[10px] font-black text-rose-500/70 uppercase tracking-widest">Pendentes</p>
                        <p className="text-2xl font-black text-rose-400 italic">{unpaidCount}</p>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl flex items-center justify-between gap-4 text-rose-500">
                    <div className="flex items-center gap-4">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <p className="font-bold text-sm">{errorMsg}</p>
                    </div>
                    {errorMsg.includes('expirou') && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors"
                        >
                            Recarregar Página
                        </button>
                    )}
                </div>
            )}

            {/* Resto dos painéis (Heatmap de Capacidade) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                        <Database className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 w-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <HardDrive className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-black italic uppercase tracking-tighter">Capacidade do Banco (500MB Free)</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Monitoramento de Escalabilidade</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.min(((totalTrips * 2) / 512000) * 100, 100).toFixed(2)}% de Uso Estimado</span>
                                <span className="text-xs font-black text-white italic">{(totalTrips * 2 / 1024).toFixed(1)}MB / 500MB</span>
                            </div>
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.max(1, Math.min(((totalTrips * 2) / 512000) * 100, 100))}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] p-8 flex flex-col justify-center text-center">
                    <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total de Viagens</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter uppercase">{totalTrips.toLocaleString()}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">+ de {Math.floor(500000 - totalTrips).toLocaleString()} disponíveis no plano free</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl py-4 pl-12 pr-6 text-slate-200 outline-none focus:border-emerald-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 bg-slate-900/50 border border-slate-800 p-1.5 rounded-3xl">
                    {['all', 'paid', 'unpaid', 'preview', 'trial'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : f === 'preview' ? 'Demo' : f === 'trial' ? 'Trial' : 'Pendentes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredUsers.map(user => {
                                const daysLeft = getDaysRemaining(user);
                                return (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-500 font-black italic">
                                                    {(user.name || user.email || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{user.name || 'Sem Nome'}</p>
                                                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email || 'Nenhum e-mail'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <select
                                                value={user.plan_type || 'none'}
                                                onChange={(e) => updateUser(user.id, { plan_type: e.target.value })}
                                                className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-emerald-500/50 cursor-pointer"
                                            >
                                                <option value="none">Sem Plano</option>
                                                <option value="piloto">Piloto</option>
                                                <option value="gestor_pro">Gestor Pro</option>
                                                <option value="frota_elite">Frota Elite</option>
                                                <option value="mensal">Mensal (Legado)</option>
                                                <option value="anual">Anual (Legado)</option>
                                                <option value="lifetime">Lifetime (Vitalício)</option>
                                            </select>
                                        </td>
                                        <td className="p-5">
                                            <select
                                                value={user.payment_status || 'unpaid'}
                                                onChange={(e) => updateUser(user.id, { payment_status: e.target.value })}
                                                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none border transition-all cursor-pointer ${user.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                        user.payment_status === 'trial' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' :
                                                            user.payment_status === 'preview' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                                                                'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                                    }`}
                                            >
                                                <option value="unpaid">Pendente</option>
                                                <option value="paid">Pago</option>
                                                <option value="trial">Trial/Cupom</option>
                                                <option value="preview">Demo</option>
                                            </select>
                                        </td>
                                        <td className="p-5">
                                            {daysLeft !== null ? (
                                                <div className={`flex items-center gap-2 text-xs font-black ${daysLeft <= 5 ? 'text-rose-500' : daysLeft <= 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    {daysLeft > 0 ? `${daysLeft} dias` : 'EXPIRADO'}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-600 font-bold">
                                                    {user.plan_type === 'lifetime' ? '∞ Vitalício' : '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => updateUser(user.id, { payment_status: user.payment_status === 'paid' ? 'unpaid' : 'paid' })}
                                                className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                                title={user.payment_status === 'paid' ? 'Bloquear' : 'Liberar'}
                                            >
                                                {user.payment_status === 'paid' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {loading && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consultando Banco de Dados localmente...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nenhum usuário encontrado</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
