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
    Clock,
    Activity,
    Server,
    Globe,
    ExternalLink,
    Filter,
    ArrowUpRight,
    CheckCircle2
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
            const res = await fetch(`/api/admin/users?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'x-admin-email': profile.email || 'arthur@ribeirxlog.com'
                }
            });
            const data = await res.json();

            if (!res.ok) {
                console.error("Admin fetch error:", data);
                setErrorMsg(data.error || 'Acesso negado ou erro ao buscar usuários Admin.');
            } else if (data.users) {
                setUsers(data.users);
            }

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
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': profile.email || 'arthur@ribeirxlog.com'
                },
                body: JSON.stringify({ userId, updates })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                fetchUsers();
            } else {
                console.error("Error updating user:", data);
                setErrorMsg(`Erro ao atualizar: ${data.error}`);
            }
        } catch (err: any) {
            setErrorMsg('Erro de rede ao atualizar usuário.');
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
        <div className="space-y-12 pb-24 animate-in fade-in duration-700">
            {/* ─── HI-IMPACT HERO SECTION ─── */}
            <div className="relative h-[450px] w-full bg-slate-900 rounded-[3.5rem] overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                    src="/admin_hero_neural_intel_1776392550237.png"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen group-hover:scale-105 transition-transform duration-[20s] ease-linear"
                    alt="Admin Center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                <div className="absolute top-10 left-10 right-10 flex justify-between items-start">
                    <div className="flex items-center gap-3 bg-slate-950/50 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-2xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">System Live</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchUsers}
                            className="bg-slate-950/80 border border-white/10 p-4 rounded-3xl text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-xl group/btn"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Central <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Admin</span>
                        </h2>
                        <p className="text-slate-300 text-lg font-medium max-w-md">Gerenciamento orbital de licenças, usuários e performance global do ecossistema RibeirxLog.</p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-6 py-4 rounded-[2rem] min-w-[140px]">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Users</p>
                                <p className="text-3xl font-black text-white italic">{users.length}</p>
                            </div>
                            <div className="bg-sky-500/10 backdrop-blur-md border border-sky-500/20 px-6 py-4 rounded-[2rem] min-w-[140px]">
                                <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Active Plans</p>
                                <p className="text-3xl font-black text-white italic">{paidCount}</p>
                            </div>
                            <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 px-6 py-4 rounded-[2rem] min-w-[140px]">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Pending</p>
                                <p className="text-3xl font-black text-white italic">{unpaidCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2">
                             <Server className="w-5 h-5 text-emerald-500" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">DB Nodes</span>
                             <span className="text-xl font-black text-white">Cloud Active</span>
                        </div>
                        <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-2">
                             <Globe className="w-5 h-5 text-sky-500" />
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Region</span>
                             <span className="text-xl font-black text-white">US-East-1</span>
                        </div>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 text-rose-500 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-widest">Protocol Failure</p>
                            <p className="text-rose-400 font-medium text-xs mt-1">{errorMsg}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all hover:scale-105"
                    >
                        Reset Session
                    </button>
                </div>
            )}

            {/* ─── SYSTEM CAPACITY WIDGETS ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col relative overflow-hidden group">
                    <div className="absolute bottom-[-20%] right-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <Database className="w-64 h-64 text-emerald-500" />
                    </div>
                    
                    <div className="relative z-10 w-full space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                <HardDrive className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white text-xl font-black italic uppercase tracking-tighter">Capacity Monitor</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Análise de escalabilidade do banco de dados</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-3xl font-black text-white italic leading-none">{Math.min(((totalTrips * 2) / 512000) * 100, 100).toFixed(2)}%</span>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Utilização Projetada (Postgres Free)</p>
                                </div>
                                <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{(totalTrips * 2 / 1024).toFixed(1)}MB / 512MB Max</span>
                            </div>
                            <div className="h-4 bg-slate-800/50 p-1 rounded-full border border-white/5 relative">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500 bg-[length:200%_auto] animate-gradient rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                    style={{ width: `${Math.max(1, Math.min(((totalTrips * 2) / 512000) * 100, 100))}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-between items-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Zap className="w-12 h-12 text-emerald-500 mb-4 animate-pulse" />
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processed Trips</p>
                        <p className="text-5xl font-black text-white italic tracking-tighter uppercase">{totalTrips.toLocaleString()}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-800 w-full mt-6">
                        <p className="text-[8px] text-emerald-400 font-black uppercase tracking-[0.2em] animate-pulse">Running Neural Engine</p>
                    </div>
                </div>
            </div>

            {/* ─── USER MANAGEMENT INTERFACE ─── */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar licença por ID, E-mail ou Nome..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] py-5 pl-14 pr-8 text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-4 ring-emerald-500/5 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 bg-slate-900 border border-slate-800 p-2 rounded-[2rem] overflow-x-auto scrollbar-hide">
                        {['all', 'paid', 'unpaid', 'preview', 'trial'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${statusFilter === f ? 'bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20 scale-105' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                {f === 'all' ? 'Ver Todos' : f === 'paid' ? 'Licenças Ativas' : f === 'preview' ? 'Modo Demo' : f === 'trial' ? 'Período Trial' : 'Inadimplentes'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-3xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/40">
                                    <th className="p-7 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identidade do Usuário</th>
                                    <th className="p-7 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tier de Acesso</th>
                                    <th className="p-7 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway Status</th>
                                    <th className="p-7 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ciclo Restante</th>
                                    <th className="p-7 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Comandos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {filteredUsers.map(user => {
                                    const daysLeft = getDaysRemaining(user);
                                    return (
                                        <tr key={user.id} className="group hover:bg-emerald-500/[0.01] transition-colors">
                                            <td className="p-7">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-emerald-500 text-lg font-black italic shadow-inner">
                                                        {(user.name || user.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{user.name || 'Anonymous Operator'}</p>
                                                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium mt-1">
                                                            <Mail className="w-3 h-3 text-emerald-500/50" />
                                                            {user.email || 'no-email-anchor'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-7">
                                                <div className="relative inline-block w-full">
                                                    <select
                                                        value={user.plan_type || 'none'}
                                                        onChange={(e) => updateUser(user.id, { plan_type: e.target.value })}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[11px] font-black text-slate-300 outline-none focus:border-emerald-500/50 cursor-pointer appearance-none hover:border-slate-700 transition-colors uppercase tracking-widest"
                                                    >
                                                        <option value="none">Zero Access</option>
                                                        <option value="piloto">Plano Piloto</option>
                                                        <option value="gestor_pro">Gestor Pro Neural</option>
                                                        <option value="frota_elite">Frota Elite Enterprise</option>
                                                        <option value="mensal">Mensal (Legacy)</option>
                                                        <option value="anual">Anual (Legacy)</option>
                                                        <option value="lifetime">Lifetime Infinite</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 rotate-90 pointer-events-none" />
                                                </div>
                                            </td>
                                            <td className="p-7">
                                                <div className="relative inline-block w-full">
                                                    <select
                                                        value={user.payment_status || 'unpaid'}
                                                        onChange={(e) => updateUser(user.id, { payment_status: e.target.value })}
                                                        className={`w-full rounded-xl px-4 py-2.5 text-[11px] font-black outline-none border transition-all cursor-pointer appearance-none uppercase tracking-widest ${user.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                                            user.payment_status === 'trial' ? 'bg-sky-500/10 border-sky-500/30 text-sky-500' :
                                                                user.payment_status === 'preview' ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' :
                                                                    'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                                            }`}
                                                    >
                                                        <option value="unpaid">Pendente / Lock</option>
                                                        <option value="paid">Active / Paid</option>
                                                        <option value="trial">Trial / Coupon</option>
                                                        <option value="preview">Demo / Dev</option>
                                                    </select>
                                                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-current rotate-90 pointer-events-none opacity-50" />
                                                </div>
                                            </td>
                                            <td className="p-7">
                                                {daysLeft !== null ? (
                                                    <div className={`flex items-center gap-3 text-xs font-black p-2.5 rounded-xl border ${daysLeft <= 5 ? 'text-rose-500 bg-rose-500/5 border-rose-500/20' : daysLeft <= 15 ? 'text-amber-500 bg-amber-500/5 border-amber-500/20' : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20'}`}>
                                                        <Clock className="w-4 h-4" />
                                                        {daysLeft > 0 ? `${daysLeft} DAYS LEFT` : 'KEY EXPIRED'}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                        {user.plan_type === 'lifetime' ? <><Zap className="w-3 h-3 text-emerald-500" /> Infinite Lifecycle</> : 'No Active Cycle'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-7 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => updateUser(user.id, { payment_status: user.payment_status === 'paid' ? 'unpaid' : 'paid' })}
                                                        className={`p-3.5 rounded-2xl border transition-all ${user.payment_status === 'paid' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950'}`}
                                                        title={user.payment_status === 'paid' ? 'Desativar Acesso' : 'Ativar Acesso'}
                                                    >
                                                        {user.payment_status === 'paid' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    </button>
                                                    <button className="p-3.5 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="relative">
                                                     <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                                                     <Activity className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Synchronizing Neural Data</p>
                                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.2em]">Aguardando resposta do servidor global...</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="space-y-4 opacity-30">
                                                <Filter className="w-12 h-12 mx-auto text-slate-500" />
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhuma identidade encontrada para este protocolo</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ─── SUPPORT & OPS CENTER ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
                        <Activity className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white text-xl font-black italic uppercase tracking-tighter">Ops Center</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Controle de Redirecionamento de Suporte</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">O sistema de suporte atual está centralizado no WhatsApp Enterprise (+55 13 98820-5888). Caso queira implementar um sistema de tickets interno, o switch está pronto.</p>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Direct</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase">ACTIVE</span>
                            </div>
                            <div className="flex-1 bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between opacity-50">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticket System</span>
                                <span className="text-[10px] font-black text-rose-500 uppercase">OFFLINE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex items-center justify-between relative overflow-hidden group">
                    <div className="space-y-6 w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-500/20">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white text-xl font-black italic uppercase tracking-tighter">Ribeirx Analytics</h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Inteligência de Mercado em Tempo Real</p>
                            </div>
                        </div>
                        
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <span className="text-3xl font-black text-white italic">R$ {(totalTrips * 3500).toLocaleString()}</span>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Volume Estimado Processado na Rede</p>
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest">
                                Full Report <ExternalLink className="w-3 h-3 text-emerald-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
