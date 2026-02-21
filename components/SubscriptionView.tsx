
import React, { useEffect } from 'react';
import {
    Check,
    CreditCard,
    QrCode,
    MessageCircle,
    ShieldCheck,
    Truck,
    Copy,
    CheckCircle2,
    Zap,
    LayoutDashboard,
    BarChart3,
    Infinity,
    Star
} from 'lucide-react';
import { UserProfile } from '../types';
import { PIX_KEY, WHATSAPP_NUMBER, PLANS } from '../pricing';


interface SubscriptionViewProps {
    profile: UserProfile;
    initialPlanIntent?: string | null;
    onClearIntent?: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ profile, initialPlanIntent, onClearIntent }) => {
    const [copied, setCopied] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState<string | null>(null);

    useEffect(() => {
        if (initialPlanIntent) {
            // Se houver uma intenção de plano vinda da Landing Page, tenta disparar o checkout automático
            const planToAutoSelect = Object.values(PLANS).find(
                p => p.name.toLowerCase() === initialPlanIntent.toLowerCase() ||
                    p.id.toLowerCase() === initialPlanIntent.toLowerCase()
            );

            if (planToAutoSelect) {
                handleCheckout(planToAutoSelect);
            }
            onClearIntent?.();
        }
    }, [initialPlanIntent]);

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckout = async (plan: any) => {
        setIsLoading(plan.id);
        try {
            // Chama a API Route segura no servidor (a chave do Asaas fica protegida)
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    name: profile.name,
                    planId: plan.id,
                    planName: plan.name,
                    amount: plan.amount
                })
            });
            const data = await res.json();

            if (!res.ok || !data.checkoutUrl) {
                throw new Error(data.error || 'Falha ao gerar link');
            }

            window.open(data.checkoutUrl, '_blank');
        } catch (error: any) {
            console.error('Erro detalhado ao iniciar checkout:', error);
            // Fallback: Se o automático falhar, abre o WhatsApp para não perder a venda
            const message = encodeURIComponent(`Olá Arthur! Tentei assinar o plano ${plan.name} mas o link automático falhou. Pode me ajudar? Meu e-mail é: ${profile.email}`);
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        } finally {
            setIsLoading(null);
        }
    };

    const handleWhatsApp = (planName: string) => {
        const message = encodeURIComponent(`Olá Arthur! Tenho interesse no plano ${planName}. Como faço para assinar?`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700 pb-20 px-4">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <Star className="w-3 h-3" /> Upgrade Profissional
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter text-shadow-glow">Escolha seu Nível de Operação</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">Sua logística merece ser profissional. Escolha um plano agora e desbloqueie o verdadeiro potencial da sua frota com automação e IA.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <PlanCard
                    title={PLANS.PILOTO.name}
                    price={PLANS.PILOTO.price}
                    period={PLANS.PILOTO.period}
                    desc={PLANS.PILOTO.desc}
                    features={["Controle de 1 Veículo", "Alertas CNH & Manutenção", "Cálculo de Lucro Real", "Sem Rastreamento GPS"]}
                    onSelect={() => handleCheckout(PLANS.PILOTO)}
                    loading={isLoading === PLANS.PILOTO.id}
                />
                <PlanCard
                    title={PLANS.GESTOR_PRO.name}
                    price={PLANS.GESTOR_PRO.price}
                    period={PLANS.GESTOR_PRO.period}
                    isPopular
                    desc={PLANS.GESTOR_PRO.desc}
                    features={["Frota Ilimitada", "Rastreamento GPS Real-Time", "Gestão Completa de Pneus", "Módulo BI & Performance", "App do Motorista"]}
                    onSelect={() => handleCheckout(PLANS.GESTOR_PRO)}
                    loading={isLoading === PLANS.GESTOR_PRO.id}
                />
                <PlanCard
                    title={PLANS.FROTA_ELITE.name}
                    price={PLANS.FROTA_ELITE.price}
                    period={PLANS.FROTA_ELITE.period}
                    desc={PLANS.FROTA_ELITE.desc}
                    features={["Tudo do Gestor Pro", "Consultoria de Implantação", "Suporte Prioritário VIP", "Economia de ~3 Mensalidades"]}
                    onSelect={() => handleCheckout(PLANS.FROTA_ELITE)}
                    loading={isLoading === PLANS.FROTA_ELITE.id}
                />
            </div>

            {/* Tabela Comparativa */}
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 bg-slate-800/20 flex items-center gap-4">
                    <LayoutDashboard className="w-6 h-6 text-sky-500" />
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Comparativo Detalhado</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50">
                                <th className="p-6">Funcionalidade</th>
                                <th className="p-6">Piloto</th>
                                <th className="p-6 text-emerald-500">Gestor Pro</th>
                                <th className="p-6">Frota Elite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            <TableRow label="Limite de Veículos" v1="1 Veículo" v2="Ilimitado" v3="Ilimitado" />
                            <TableRow label="Rastreamento GPS" v1="Não" v2="Sim (Todos)" v3="Sim (Todos)" />
                            <TableRow label="Gestão de Pneus" v1="Não" v2="Sim" v3="Sim" />
                            <TableRow label="App do Motorista" v1="Básico" v2="Completo" v3="Completo" />
                            <TableRow label="Inteligência Artificial" v1="Básica" v2="Avançada" v3="Avançada" />
                            <TableRow label="Suporte Técnico" v1="Email" v2="WhatsApp" v3="WhatsApp VIP" />
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Área de Pagamento (PIX) */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/10 border border-slate-800 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-20 -right-20 p-10 opacity-5 pointer-events-none text-emerald-500">
                    <QrCode className="w-96 h-96" />
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ativação Rápida via Pix</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Siga o passo a passo abaixo</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Step num="1" title="Escolha o Plano" desc="Defina qual licença melhor se adapta à sua quantidade de caminhões." />
                            <Step num="2" title="Chave Pix" desc="Realize a transferência para a chave abaixo (Celular/Arthur)." />

                            <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                                <div>
                                    <span className="block text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest opacity-60">Chave Pix (Telefone)</span>
                                    <span className="block text-2xl text-white font-mono font-black tracking-tighter">{PIX_KEY}</span>
                                </div>
                                <button
                                    onClick={handleCopyPix}
                                    className="px-6 py-4 bg-emerald-500 text-slate-950 rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-emerald-500/20"
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5 font-black" /> : <Copy className="w-5 h-5 font-black" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{copied ? "Copiado" : "Copiar Chave"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10 flex flex-col justify-center">
                        <Step num="3" title="Envio do Comprovante" desc="Após o Pix, clique no botão para nos avisar no WhatsApp." />

                        <button
                            onClick={() => handleWhatsApp('Suporte')}
                            className="w-full py-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-emerald-500/30 transition-all uppercase tracking-widest text-lg group"
                        >
                            <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            Falar com Arthur no WhatsApp
                        </button>

                        <div className="flex items-start gap-3 p-6 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">
                                Operamos com liberação manual assistida. Uma vez confirmado o recebimento via WhatsApp, seu painel profissional é ativado na hora.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const TableRow = ({ label, v1, v2, v3 }: any) => (
    <tr className="hover:bg-white/[0.02] transition-colors">
        <td className="p-6 text-slate-400 font-medium">{label}</td>
        <td className="p-6 text-white font-bold">{v1}</td>
        <td className="p-6 text-emerald-500 font-black">{v2}</td>
        <td className="p-6 text-white font-bold">{v3}</td>
    </tr>
);

const PlanCard = ({ title, price, period, desc, features, isPopular, onSelect, loading }: any) => (
    <div className={`p-8 rounded-[3rem] flex flex-col transition-all border relative overflow-hidden group ${isPopular ? 'bg-slate-900 border-emerald-500/50 scale-105 shadow-2xl' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
        {isPopular && (
            <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500 text-slate-950 rounded-full text-[8px] font-black uppercase tracking-widest">
                Pop
            </div>
        )}
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">{desc}</p>
        <div className="mb-8">
            <span className="text-4xl font-black text-white">{price}</span>
            <span className="text-slate-500 text-sm font-bold tracking-tighter">{period}</span>
        </div>
        <div className="space-y-4 mb-10 flex-1">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {f}
                </div>
            ))}
        </div>
        <button
            onClick={onSelect}
            disabled={loading}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isPopular ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {loading ? <CheckCircle2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Processando...' : 'Assinar Agora'}
        </button>
    </div>
);

const Step = ({ num, title, desc }: any) => (
    <div className="flex gap-5 group">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-black shrink-0 transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5">
            {num}
        </div>
        <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
        </div>
    </div>
);

export default SubscriptionView;
