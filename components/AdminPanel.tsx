
import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Shield, 
    Zap, 
    Activity, 
    Search, 
    RefreshCcw, 
    Crown, 
    UserPlus, 
    Filter,
    ArrowUpRight,
    TrendingUp,
    Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { UserProfile } from '../types';

interface AdminPanelProps {
    currentProfile: UserProfile;
}

interface AdminUser {
    id: string;
    email: string;
    name: string;
    plan_type: string;
    payment_status: string;
    trial_ends_at: string | null;
    subscription_expires_at: string | null;
    created_at: string;
    last_sign_in_at: string | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentProfile }) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Security check: Only Arthur (or specific emails) can see this
    const isAdmin = currentProfile.email === 'arthurribeiro@ribeirxlog.com.br' || 
                    currentProfile.email === 'arthurribeiro.contato@gmail.com' ||
                    currentProfile.email === 'ribeirxlog@gmail.com';

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // We fetch from the 'profiles' table which contains user-allowed info
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (userId: string, newPlan: string) => {
        setIsUpdating(true);
        try {
            // Update plan and extend expiration if needed (e.g. 30 days for monthly)
            const expirationDate = newPlan === 'none' ? null : new Date();
            if (expirationDate) {
                if (newPlan === 'frota_elite') {
                    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
                } else {
                    expirationDate.setDate(expirationDate.getDate() + 32); // 32 days for safety
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update({ 
                    plan_type: newPlan,
                    payment_status: newPlan === 'none' ? 'pending' : 'paid',
                    subscription_expires_at: expirationDate?.toISOString() || null
                })
                .eq('id', userId);

            if (error) throw error;
            
            setUsers(users.map(u => u.id === userId ? { 
                ...u, 
                plan_type: newPlan, 
                payment_status: newPlan === 'none' ? 'pending' : 'paid',
                subscription_expires_at: expirationDate?.toISOString() || null
            } : u));
            setEditingUser(null);
            alert('Plano atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('Falha ao atualizar plano.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <Lock className="w-16 h-16 text-rose-500 mb-6" />
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h2>
                <p className="text-slate-500 mt-2">Esta área é exclusiva para a administração do RibeirxLog.</p>
            </div>
        );
    }

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header / Stats */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-1 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Controle de Sistema</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
                        Painel <span className="text-indigo-500">Master</span>
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xl">Gerencie usuários, libere planos e monitore o crescimento da plataforma.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 px-10 shadow-xl flex items-center gap-6">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Usuários</p>
                            <p className="text-3xl font-black text-white italic">{users.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
                <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou e-mail..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-sm font-medium text-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                </div>
                <button 
                    onClick={fetchUsers}
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
                </button>
            </div>

            {/* User List */}
            <div className="bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-slate-950/30 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="p-8">Usuário</th>
                                <th className="p-8">Plano Atual</th>
                                <th className="p-8">Status</th>
                                <th className="p-8">Cadastro</th>
                                <th className="p-8 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Activity className="w-12 h-12 animate-spin text-indigo-500" />
                                            <p className="font-black uppercase tracking-[0.5em] text-xs">Escaneando Base de Dados...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tight">{user.name || 'Sem Nome'}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                user.plan_type === 'frota_elite' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                user.plan_type === 'gestor_pro' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                user.plan_type === 'piloto' ? 'bg-sky-500/10 text-sky-500 border-sky-500/20' :
                                                'bg-slate-800 text-slate-500 border-white/5'
                                            }`}>
                                                {user.plan_type?.replace('_', ' ').toUpperCase() || 'FREE'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.payment_status === 'paid' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.payment_status === 'paid' ? 'Ativo' : 'Aguardando'}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </td>
                                        <td className="p-8 text-right">
                                            <button 
                                                onClick={() => setEditingUser(user)}
                                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                                            >
                                                Alterar Plano
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-500 uppercase font-black text-xs tracking-widest">Nenhum usuário encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edição de Plano */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setEditingUser(null)} />
                    <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <header className="mb-10 text-center">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-6">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Ajustar Privilégios</h3>
                            <p className="text-slate-500 text-xs mt-2 uppercase font-bold tracking-widest">Usuário: {editingUser.email}</p>
                        </header>

                        <div className="space-y-4">
                            {[
                                { id: 'none', label: 'Desativar / Pendente', color: 'bg-slate-950', icon: Lock },
                                { id: 'piloto', label: 'Plano Piloto', color: 'bg-sky-500/10 text-sky-500', icon: Activity },
                                { id: 'gestor_pro', label: 'Gestor Pro', color: 'bg-emerald-500/10 text-emerald-500', icon: TrendingUp },
                                { id: 'frota_elite', label: 'Plano Pro Anual', color: 'bg-amber-500/10 text-amber-500', icon: Crown }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleUpdatePlan(editingUser.id, p.id)}
                                    disabled={isUpdating}
                                    className={`w-full flex items-center justify-between p-6 rounded-2xl border border-white/5 hover:border-indigo-500/50 transition-all group ${editingUser.plan_type === p.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-950'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${p.color}`}>
                                            <p.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-white uppercase tracking-tighter">{p.label}</span>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 transition-colors" />
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setEditingUser(null)}
                            className="w-full mt-10 p-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
