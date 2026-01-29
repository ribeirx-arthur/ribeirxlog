import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Truck, LogIn, Lock } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            alert(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-10 w-full max-w-md shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-emerald-950/50 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-emerald-500/10">
                        <Truck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">RIBEIRX <span className="text-emerald-500">LOG</span></h1>
                    <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                        <span className="text-emerald-500/80">Gestão Inteligente</span>
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 ml-1">Email Corporativo</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                                placeholder="nome@ribeirxlog.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 ml-1">Senha de Acesso</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                                    placeholder="••••••••••••"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <span className="animate-pulse">Autenticando...</span>
                        ) : (
                            <>
                                Entrar no Sistema <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                    <p className="text-xs text-slate-500">
                        Acesso restrito a pessoal autorizado.<br />
                        IP Registrado para fins de segurança.
                    </p>
                </div>
            </div>
        </div>
    );
}
