'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { AlertCircle, Loader2 } from 'lucide-react';

function DriverLoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) {
            validateToken(token);
        } else {
            setError('Token inválido ou ausente');
            setLoading(false);
        }
    }, [token]);

    const validateToken = async (token: string) => {
        try {
            // Validate driver token
            const { data, error: rpcError } = await supabase
                .rpc('validate_driver_token', { token });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                setError('Erro ao validar token');
                setLoading(false);
                return;
            }

            if (!data || data.length === 0 || !data[0].is_valid) {
                setError('Token inválido ou expirado. Entre em contato com o gestor.');
                setLoading(false);
                return;
            }

            // Store driver session
            localStorage.setItem('driver_session', JSON.stringify({
                driverId: data[0].driver_id,
                driverName: data[0].driver_name,
                driverPhone: data[0].driver_phone,
                token,
                loginAt: new Date().toISOString(),
            }));

            // Redirect to driver app
            router.push('/driver/app');
        } catch (err) {
            console.error('Validation error:', err);
            setError('Erro ao processar login');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Validando Acesso</h1>
                    <p className="text-slate-400">Aguarde um momento...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-3">Acesso Negado</h1>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4 text-left">
                            <p className="text-xs text-slate-500 mb-2 uppercase font-bold">O que fazer?</p>
                            <ul className="text-sm text-slate-300 space-y-2">
                                <li>• Entre em contato com seu gestor</li>
                                <li>• Solicite um novo link de acesso</li>
                                <li>• Verifique se o link está completo</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default function DriverLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        }>
            <DriverLoginContent />
        </Suspense>
    );
}
