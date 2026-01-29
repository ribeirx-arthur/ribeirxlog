
import React from 'react';
import {
    Check,
    ChevronRight,
    Truck,
    TrendingUp,
    BrainCircuit,
    Clock,
    ShieldCheck,
    BarChart3,
    DollarSign,
    ArrowRight
} from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 font-sans antialiased overflow-x-hidden">
            {/* Background Decorativo - Grid Digital */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

            {/* Navbar Minimalista */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Truck className="text-slate-950 w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                    >
                        Acessar Sistema
                    </button>
                </div>
            </nav>

            {/* Hero Section - Premium & Impactful */}
            <section className="relative pt-44 pb-32 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none">
                    <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/20 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 animate-in fade-in zoom-in duration-1000">
                        <ShieldCheck className="w-3 h-3" /> Logística de Nova Geração
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black text-white tracking-[107: -0.05em] leading-[0.85] mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        Acelerando seu <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-100 to-sky-400">Sucesso na Estrada.</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200 font-medium leading-relaxed">
                        Abandone os controles manuais. O Ribeirx Log automatiza seus custos,
                        monitora a saúde da sua frota e usa IA para maximizar seu lucro líquido.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                        <button
                            onClick={onGetStarted}
                            className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all text-lg"
                        >
                            Começar Agora <ChevronRight className="w-5 h-5" />
                        </button>
                        <a href="#planos" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all">
                            Ver Planos
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid - Glassmorphism */}
            <section className="py-20 bg-slate-900/50 relative border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={TrendingUp}
                            color="emerald"
                            title="Lucro Real"
                            desc="Descubra quanto sobrou de verdade em cada viagem, descontando diesel, comissões e manutenção."
                        />
                        <FeatureCard
                            icon={BrainCircuit}
                            color="sky"
                            title="Dicas de IA"
                            desc="Nossa IA Ribeirx analisa seus dados e avisa quais rotas e clientes trazem mais dinheiro no bolso."
                        />
                        <FeatureCard
                            icon={Clock}
                            color="amber"
                            title="Alertas de Oficina"
                            desc="Nunca mais perca uma troca de óleo. Avisamos quando cada peça do seu caminhão precisa de atenção."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing - Premium & Clear */}
            <section id="planos" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">Planos que cabem no bolso.</h2>
                        <p className="text-slate-400">Escolha o melhor jeito de profissionalizar sua frota.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

                        {/* Plano Mensal */}
                        <PricingCard
                            title="Mensal"
                            price="R$ 59,90"
                            period="/mês"
                            desc="Ideal para começar a organizar sua empresa agora."
                            features={[
                                "Acesso completo ao Dashboard",
                                "Gestão de 1 Veículo",
                                "Controle de Fretes e Gastos",
                                "Relatórios em PDF",
                                "Alertas de Manutenção"
                            ]}
                            buttonText="Assinar Mensal"
                            onClick={onGetStarted}
                        />

                        {/* Plano Anual - Popular Choice */}
                        <PricingCard
                            title="Anual Profissional"
                            price="R$ 497,00"
                            period="/ano"
                            desc="O melhor custo-benefício para quem vive da estrada."
                            isPopular={true}
                            features={[
                                "TUDO do plano mensal",
                                "Gestão de Frota Livre (Ilimitada)",
                                "Inteligência Artificial Ribeirx AI",
                                "Rankings de Performance",
                                "Economia de 2 meses grátis",
                                "Suporte Prioritário VIP"
                            ]}
                            buttonText="Quero Plano Profissional"
                            onClick={onGetStarted}
                        />

                        {/* Licença Única / Lifetime Option */}
                        <PricingCard
                            title="Placa Única"
                            price="R$ 297,00"
                            period=" valor único"
                            desc="Pague uma vez por caminhão e esqueça mensalidades."
                            features={[
                                "Acesso Vitalício p/ 1 Veículo",
                                "Lançamentos ilimitados",
                                "Controle de Lucratividade",
                                "Certificado de Uso Permanente",
                                "Sem custos de manutenção"
                            ]}
                            buttonText="Comprar Licença"
                            onClick={onGetStarted}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <Truck className="text-slate-950 w-5 h-5" />
                        </div>
                        <span className="text-lg font-black tracking-tighter text-white uppercase italic">Ribeirx Log v2.0</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 Ribeirx Logística Inteligente. Todos os direitos reservados.</p>
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-2 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Sistema Seguro & Criptografado
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-slate-900 border border-white/5 p-8 rounded-[2rem] hover:bg-slate-800 transition-all group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
            color === 'sky' ? 'bg-sky-500/10 text-sky-500' :
                'bg-amber-500/10 text-amber-500'
            }`}>
            <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const PricingCard = ({ title, price, period, desc, features, isPopular, buttonText, onClick }: any) => (
    <div className={`relative bg-slate-900 border ${isPopular ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-105 z-10' : 'border-white/5'} p-8 rounded-[2.5rem] flex flex-col`}>
        {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Mais Recomendado
            </div>
        )}
        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-300 mb-2 uppercase tracking-wide">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{price}</span>
                <span className="text-slate-500 font-bold text-sm tracking-tighter">{period}</span>
            </div>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed">{desc}</p>
        </div>
        <div className="space-y-4 mb-10 flex-1">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    {f}
                </div>
            ))}
        </div>
        <button
            onClick={onClick}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isPopular ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
        >
            {buttonText}
        </button>
    </div>
);

export default LandingPage;
