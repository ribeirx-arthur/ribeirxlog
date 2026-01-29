
import React from 'react';
import {
    Check,
    CreditCard,
    QrCode,
    MessageCircle,
    ShieldCheck,
    Clock,
    Truck,
    AlertCircle,
    Copy,
    CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionViewProps {
    profile: UserProfile;
}

const PIX_KEY = "13988205888";
const WHATSAPP_NUMBER = "5513988205888";

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ profile }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = (plan: string) => {
        const message = encodeURIComponent(`Olá Arthur! Gostaria de confirmar o pagamento do plano ${plan} para o Ribeirx Log (Email: ${profile.email}). Segue o comprovante.`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <header className="text-center md:text-left">
                <h2 className="text-4xl font-black text-white tracking-tighter">Assinatura & Planos</h2>
                <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Gerencie seu acesso profissional ao Ribeirx Log</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <PlanCard
                    title="Mensal"
                    price="R$ 59,90"
                    period="/mês"
                    features={["1 Veículo", "Dashboards IA", "Relatórios PDF"]}
                    onSelect={() => handleWhatsApp('Mensal')}
                />
                <PlanCard
                    title="Anual Profissional"
                    price="R$ 497,00"
                    period="/ano"
                    isPopular
                    features={["Frota Ilimitada", "IA Avançada", "Suporte VIP", "2 Meses Grátis"]}
                    onSelect={() => handleWhatsApp('Anual')}
                />
                <PlanCard
                    title="Placa Única"
                    price="R$ 297,00"
                    period=" único"
                    features={["Vitalício p/ 1 Veículo", "Sem Mensalidade", "Certificado de Uso"]}
                    onSelect={() => handleWhatsApp('Vitalício')}
                />
            </div>

            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-emerald-500">
                    <QrCode className="w-64 h-64" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Como Efetuar o Pagamento</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <Step
                                num="1"
                                title="Escolha seu Plano"
                                desc="Selecione acima o plano que melhor atende sua frota."
                            />
                            <Step
                                num="2"
                                title="Pague via Pix"
                                desc="Utilize a chave Pix abaixo para realizar o pagamento."
                            />
                            <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 flex items-center justify-between group ml-10">
                                <div>
                                    <span className="block text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Chave Pix (Telefone)</span>
                                    <span className="block text-lg text-white font-mono font-bold tracking-tighter">{PIX_KEY}</span>
                                </div>
                                <button
                                    onClick={handleCopyPix}
                                    className="p-4 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 group-hover:scale-105 active:scale-95"
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5 font-black" /> : <Copy className="w-5 h-5 font-black" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{copied ? "Copiado" : "Copiar"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Step
                                num="3"
                                title="Envie o Comprovante"
                                desc="Clique no botão abaixo para nos enviar o print pelo WhatsApp."
                            />
                            <button
                                onClick={() => handleWhatsApp('de Interesse')}
                                className="w-full py-6 ml-10 max-w-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all uppercase tracking-widest text-sm"
                            >
                                <MessageCircle className="w-6 h-6" /> Enviar por WhatsApp
                            </button>
                            <Step
                                num="4"
                                title="Liberação Imediata"
                                desc="Nossa equipe validará seu comprovante e liberará seu acesso na hora."
                            />
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex items-center justify-center gap-6 p-8 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
                <div className="text-slate-400 text-xs font-medium max-w-lg leading-relaxed italic">
                    "Operamos com transparência total. Seu acesso é vital para nós e garantimos a ativação imediata após a confirmação manual via WhatsApp."
                </div>
            </div>
        </div>
    );
};

const PlanCard = ({ title, price, period, features, isPopular, onSelect }: any) => (
    <div className={`p-8 rounded-[2.5rem] flex flex-col transition-all border ${isPopular ? 'bg-slate-900 border-emerald-500/50 scale-105 shadow-2xl' : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}>
        {isPopular && (
            <div className="inline-block px-3 py-1 bg-emerald-500 text-slate-950 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-4 self-start">
                Popular
            </div>
        )}
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">{title}</h3>
        <div className="mb-6">
            <span className="text-3xl font-black text-white">{price}</span>
            <span className="text-slate-500 text-sm font-bold">{period}</span>
        </div>
        <div className="space-y-3 mb-8 flex-1">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="w-3 h-3 text-emerald-500" /> {f}
                </div>
            ))}
        </div>
        <button
            onClick={onSelect}
            className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isPopular ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
        >
            Selecionar Plano
        </button>
    </div>
);

const Step = ({ num, title, desc }: any) => (
    <div className="flex gap-4 group">
        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-500 font-black shrink-0 transition-all group-hover:border-emerald-500/50">
            {num}
        </div>
        <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default SubscriptionView;
