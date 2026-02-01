import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';
import {
    Users,
    Search,
    Filter,
    ShieldCheck,
    CreditCard,
    Mail,
    Calendar,
    Lock,
    Unlock,
    Package,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

export const AdminPanel = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setUsers(data);
        setLoading(false);
    };

    const updatePlan = async (email: string, updates: Partial<UserProfile>) => {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('email', email);

        if (!error) {
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || u.payment_status === statusFilter)
    );

    return (
        <div className="space-y-8 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        Central <span className="text-emerald-500">Admin</span>
                    </h2>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Gerenciamento de Planos e Usuários</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-3xl text-center min-w-[120px]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                        <p className="text-2xl font-black text-white italic">{users.length}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl text-center min-w-[120px]">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ativos</p>
                        <p className="text-2xl font-black text-emerald-500 italic">{users.filter(u => u.payment_status === 'paid').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl py-4 pl-12 pr-6 text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 bg-slate-900/50 border border-slate-800 p-1.5 rounded-3xl">
                    {['all', 'paid', 'unpaid', 'preview'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'paid' ? 'Pagos' : f === 'preview' ? 'Demo' : 'Pendentes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plano Atual</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredUsers.map(user => (
                                <tr key={user.email} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-500 font-black italic">
                                                {user.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-tight">{user.name || 'Sem Nome'}</p>
                                                <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <select
                                            value={user.plan_type || 'none'}
                                            onChange={(e) => updatePlan(user.email, { plan_type: e.target.value as any })}
                                            className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-300 outline-none focus:border-emerald-500/50"
                                        >
                                            <option value="none">Nenhum</option>
                                            <option value="mensal">Mensal</option>
                                            <option value="anual">Anual</option>
                                            <option value="lifetime">Placa Única</option>
                                        </select>
                                    </td>
                                    <td className="p-6">
                                        <select
                                            value={user.payment_status || 'unpaid'}
                                            onChange={(e) => updatePlan(user.email, { payment_status: e.target.value as any })}
                                            className={`rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none border transition-all ${user.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                user.payment_status === 'preview' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                                                    'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                                }`}
                                        >
                                            <option value="unpaid">Pendente</option>
                                            <option value="paid">Pago</option>
                                            <option value="preview">Modo Demo</option>
                                            <option value="trial">Experimental</option>
                                        </select>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => updatePlan(user.email, { payment_status: user.payment_status === 'paid' ? 'unpaid' : 'paid' })}
                                            className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            {user.payment_status === 'paid' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando Banco de Dados...</p>
                                        </div>
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
