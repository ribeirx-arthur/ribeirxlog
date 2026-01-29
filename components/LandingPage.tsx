
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
    ArrowRight,
    Zap,
    LayoutDashboard,
    Star,
    Infinity,
    Lock,
    QrCode,
    MessageSquare,
    MousePointerClick
} from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onPurchase: (plan: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 font-sans antialiased overflow-x-hidden">
            {/* Background Decorativo - Grid Digital */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

            {/* Navbar Minimalista */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Truck className="text-slate-950 w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white uppercase italic">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={onGetStarted} className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors hidden md:block">
                            Login
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                        >
                            Acessar Sistema
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Premium & Impactful */}
            <section className="relative pt-44 pb-32 px-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none">
                    <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/20 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                        <ShieldCheck className="w-3 h-3" /> Gestão Logística de Nova Geração
                    </div>
                    <h1 className="text-6xl md:text-9xl font-black text-white tracking-[ -0.05em] leading-[0.85] mb-10">
                        A Inteligência que seu <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-100 to-sky-400">Lucro Precisava.</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
                        Abandone as planilhas. O Ribeirx Log automatiza seus fretes,
                        monitora sua frota e usa IA para maximizar seu lucro líquido em cada KM.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all text-lg hover:ring-4 ring-emerald-500/20"
                        >
                            Começar Agora <ChevronRight className="w-5 h-5" />
                        </button>
                        <a href="#planos" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all">
                            Conhecer Planos
                        </a>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-slate-900/50 relative border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={TrendingUp}
                            color="emerald"
                            title="Lucro Real 100%"
                            desc="Saiba quanto sobrou de verdade, descontando diesel, comissões, taxas e pneus automaticamente."
                        />
                        <FeatureCard
                            icon={BrainCircuit}
                            color="sky"
                            title="Ribeirx AI Insights"
                            desc="Nossa IA analisa suas rotas e avisa quais clientes e destinos estão gerando mais margem líquida."
                        />
                        <FeatureCard
                            icon={Clock}
                            color="amber"
                            title="Frota Zero Parada"
                            desc="Alertas inteligentes de manutenção preventiva para você nunca mais ser pego de surpresa na oficina."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing - A Página que o Usuário Gostou (Ported from SubscriptionView) */}
            <section id="planos" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6 mb-20 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <Star className="w-3 h-3" /> Tabelas & Planos
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Planos para quem Vive da Estrada.</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm">Escolha a parceria ideal para profissionalizar sua frota e escalar seus resultados.</p>
                </div>

                <div className="max-w-7xl mx-auto px-6 mb-32 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <LandingPricingCard
                        title="Mensal"
                        price="R$ 59,90"
                        period="/mês"
                        desc="Para quem está começando a organizar a casa agora."
                        features={["1 Veículo Ativo", "Dashboards IA", "Controle de Fretes", "Relatórios em PDF"]}
                        onSelect={() => onPurchase('Mensal')}
                    />
                    <LandingPricingCard
                        title="Anual Profissional"
                        price="R$ 497,00"
                        period="/ano"
                        isPopular
                        desc="O melhor custo-benefício para frotas e empresas."
                        features={["Frota Ilimitada", "IA Avançada (Golden Tips)", "Ranking de Performance", "Suporte VIP", "Economia de 2 meses"]}
                        onSelect={() => onPurchase('Anual')}
                    />
                    <LandingPricingCard
                        title="Placa Única"
                        price="R$ 297,00"
                        period=" único"
                        desc="Pague uma vez e use para sempre sem mensalidades."
                        features={["Vitalício p/ 1 Veículo", "Todas as Ferramentas", "Histórico Permanente", "Sem Custos de Manutenção"]}
                        onSelect={() => onPurchase('Vitalício')}
                    />
                </div>
            </section>

            {/* Como Funciona - NEW */}
            <section className="py-24 bg-slate-900 border-y border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
                    <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">Como Começar? É Simples.</h3>
                    <p className="text-slate-400 max-w-xl mx-auto text-sm">Siga os 3 passos para profissionalizar sua gestão hoje mesmo.</p>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    <StepItem
                        icon={MousePointerClick}
                        step="01"
                        title="Escolha seu Plano"
                        desc="Selecione acima a licença que melhor atende o tamanho da sua operação atual."
                    />
                    <StepItem
                        icon={QrCode}
                        step="02"
                        title="Pagamento Pix"
                        desc="Após o login, você receberá a chave Pix para realizar o pagamento de forma segura."
                    />
                    <StepItem
                        icon={MessageSquare}
                        step="03"
                        title="Liberação Instantânea"
                        desc="Envie o comprovante pelo WhatsApp e nossa equipe liberará seu painel em minutos."
                    />
                </div>
            </section>

            {/* Tabela Comparativa Detalhada (The "Interested" part) */}
            <section className="py-32 relative">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-sky-500">
                            <BarChart3 className="w-48 h-48" />
                        </div>
                        <div className="p-10 border-b border-slate-800 bg-slate-800/20 flex items-center gap-4 relative z-10">
                            <LayoutDashboard className="w-8 h-8 text-sky-500" />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Comparativo Detalhado de Recursos</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Veja por que o Profissional é a melhor escolha</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto relative z-10">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/50">
                                        <th className="p-8">Funcionalidade</th>
                                        <th className="p-8">Mensal</th>
                                        <th className="p-8 text-emerald-500">Anual Profissional</th>
                                        <th className="p-8">Placa Única</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <LandingTableRow label="Limite de Veículos" v1="1 Veículo" v2="Frota Ilimitada" v3="1 Veículo (Vitalício)" />
                                    <LandingTableRow label="Inteligência Artificial" v1="Básica" v2="Avançada (Ribeirx AI)" v3="Básica" />
                                    <LandingTableRow label="Análise de Performance" v1="Não" v2="Sim (Rankings)" v3="Não" />
                                    <LandingTableRow label="Suporte Técnico" v1="Padrão" v2="WhatsApp Prioritário" v3="Padrão" />
                                    <LandingTableRow label="Gestão de Custos" v1="Completa" v2="Completa + Automatizada" v3="Completa" />
                                    <LandingTableRow label="Custo de Atualização" v1="Grátis" v2="Incluso" v3="Grátis p/ Sempre" />
                                </tbody>
                            </table>
                        </div>
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
                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-4 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Sistema Seguro & ISO-Compliant
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] hover:bg-slate-800 transition-all group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' :
            color === 'sky' ? 'bg-sky-500/10 text-sky-500 shadow-sky-500/5' :
                'bg-amber-500/10 text-amber-500 shadow-amber-500/5'
            }`}>
            <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
);

const LandingPricingCard = ({ title, price, period, desc, features, isPopular, onSelect }: any) => (
    <div className={`p-8 md:p-12 rounded-[3.5rem] flex flex-col transition-all border relative overflow-hidden group ${isPopular ? 'bg-slate-900 border-emerald-500/50 scale-105 shadow-2xl z-10' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
        {isPopular && (
            <div className="absolute top-10 right-10 px-4 py-1.5 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-widest">
                Recomendado
            </div>
        )}
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">{desc}</p>
        <div className="mb-10">
            <span className="text-5xl font-black text-white">{price}</span>
            <span className="text-slate-500 text-sm font-bold tracking-tighter ml-1">{period}</span>
        </div>
        <div className="space-y-5 mb-12 flex-1">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" /> {f}
                </div>
            ))}
        </div>
        <button
            onClick={onSelect}
            className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest transition-all ${isPopular ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 active:scale-95' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
        >
            Escolher Plano
        </button>
    </div>
);

const LandingTableRow = ({ label, v1, v2, v3 }: any) => (
    <tr className="hover:bg-white/[0.02] transition-colors last:border-0 border-slate-800">
        <td className="p-8 text-slate-400 font-medium whitespace-nowrap">{label}</td>
        <td className="p-8 text-white font-bold">{v1}</td>
        <td className="p-8 text-emerald-400 font-black text-lg">{v2}</td>
        <td className="p-8 text-white font-bold">{v3}</td>
    </tr>
);

const StepItem = ({ icon: Icon, step, title, desc }: any) => (
    <div className="flex flex-col items-center text-center group">
        <div className="relative mb-8">
            <div className="w-20 h-20 bg-slate-800 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-xl group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 transition-all">
                <Icon className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="absolute -top-4 -right-4 w-10 h-10 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                {step}
            </div>
        </div>
        <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">{desc}</p>
    </div>
);

export default LandingPage;
