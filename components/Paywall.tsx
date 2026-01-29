
import React from 'react';
import {
    CreditCard,
    QrCode,
    CheckCircle2,
    Lock,
    Truck,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    MessageCircle,
    Copy,
    ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types';

interface PaywallProps {
    profile: UserProfile;
    onRefreshProfile: () => void;
    onSignOut: () => void;
}

const PIX_KEY = "13988205888";
const WHATSAPP_NUMBER = "5513988205888";

const Paywall: React.FC<PaywallProps> = ({ profile, onRefreshProfile, onSignOut }) => {
    const [copied, setCopied] = React.useState(false);
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefreshProfile();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Olá Arthur! Acabei de realizar o pagamento do Ribeirx Log para o email: ${profile.email}. Segue o comprovante em anexo.`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
                        <Lock className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-4">
                        Acesso Pendente
                    </h1>
                    <p className="text-slate-400 text-sm max-w-sm">
                        Olá, <span className="text-white font-bold">{profile.name || profile.email}</span>!
                        Sua conta está aguardando a compensação do pagamento para liberar o painel.
                    </p>
                </div>

                {/* Status do Plano */}
                <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Forma de Pagamento</span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">Pix Direto</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group">
                            <div className="overflow-hidden">
                                <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">Copia e Cola (Chave Pix)</span>
                                <span className="block text-sm text-white font-mono truncate">{PIX_KEY}</span>
                            </div>
                            <button
                                onClick={handleCopyPix}
                                className="p-3 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-all shrink-0"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="text-center p-4">
                            <p className="text-xs text-slate-500 italic">Após pagar, clique no botão abaixo para nos enviar o comprovante via WhatsApp.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleWhatsApp}
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all text-sm uppercase tracking-widest"
                    >
                        <MessageCircle className="w-5 h-5" /> Enviar Comprovante no WhatsApp
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-3 border border-white/10 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                        {isRefreshing ? "Verificando..." : "Já paguei, verificar acesso"}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 uppercase font-black tracking-widest flex items-center justify-center gap-2 pt-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Liberação manual imediata após o envio
                    </p>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                    <button
                        onClick={onSignOut}
                        className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                    >
                        Sair da Conta
                    </button>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <AlertCircle className="w-3 h-3" /> Precisa de suporte?
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Paywall;
