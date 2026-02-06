
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
    Calculator,
    ArrowRight,
    Zap,
    LayoutDashboard,
    Star,
    Infinity,
    Lock,
    QrCode,
    MessageSquare,
    MousePointerClick,
    MessageCircle,
    Users,
    Building2
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../pricing';

interface LandingPageProps {
    onGetStarted: () => void;
    onPurchase: (plan: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase }) => {
    const handleWhatsAppContact = () => {
        const message = encodeURIComponent("Olá Arthur! Vi o Ribeirx Log e gostaria de tirar algumas dúvidas sobre os planos.");
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 font-sans antialiased overflow-x-hidden">
            {/* Smooth Scroll Utility Styling */}
            <style dangerouslySetInnerHTML={{
                __html: `
                html { scroll-behavior: smooth; }
                .glass-card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .text-gradient { background: linear-gradient(135deg, #fff 0%, #94a3b8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .glow-emerald { box-shadow: 0 0 50px -12px rgba(16, 185, 129, 0.5); }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}} />

            {/* Background Decorativo - Neural Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }}></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full"></div>
            </div>

            {/* Navbar Premium */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/70 backdrop-blur-2xl border-b border-white/5 transition-all duration-500">
                <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <Truck className="text-slate-950 w-7 h-7" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Intelligence Dynamics</span>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-10">
                        {['Recursos', 'Como Funciona', 'Planos', 'Contato'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-xs font-black text-slate-400 hover:text-emerald-400 uppercase tracking-widest transition-all">
                                {item}
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={onGetStarted} className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors hidden sm:block">
                            Área do Cliente
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="bg-emerald-500 text-slate-950 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                        >
                            ACESSAR RBS INTEL
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Director's Control Center */}
            <section className="relative pt-48 md:pt-56 pb-20 px-6">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 space-y-10 text-left">
                            <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-left-4 duration-1000">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                RBS Intel v3.1 Enterprise
                            </div>

                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-[-0.04em] leading-[0.9] animate-in fade-in slide-in-from-left-8 duration-1000 delay-200 uppercase">
                                ASSUMA O <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-100 to-sky-400">COMANDO TOTAL.</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-left-12 duration-1000 delay-500">
                                Mais que um sistema, o RBS é o diretor estratégico da sua transportadora.
                                Controle motoristas, transportadoras e frota em uma única interface neural de alta performance.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-700">
                                <button
                                    onClick={onGetStarted}
                                    className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all text-lg hover:scale-105 active:scale-95 group"
                                >
                                    ADQUIRIR ACESSO <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a href="#planos" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all text-lg">
                                    VER PLANOS
                                </a>
                            </div>

                            {/* Core Modules Badges */}
                            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                {[
                                    { icon: Users, label: "Driver CRM" },
                                    { icon: Building2, label: "Carrier Logic" },
                                    { icon: ShieldCheck, label: "Fleet Health" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3 bg-slate-900/50 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <item.icon className="w-4 h-4 text-emerald-500" /> {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Showcase - Compact & Dense */}
                        <div className="lg:col-span-5 relative animate-in slide-in-from-right-12 duration-1000 delay-1000">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full translate-y-20 scale-75 opacity-30"></div>
                            <div className="relative glass-card rounded-[3rem] p-3 border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden hover:scale-105 transition-transform duration-700">
                                <div className="bg-slate-950 rounded-[2.5rem] p-8 space-y-8 border border-white/5 min-h-[450px]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-700 tracking-widest uppercase">Director Terminal v3.1</span>
                                    </div>

                                    {/* Mockup Data Points */}
                                    <div className="space-y-6">
                                        <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Operational Profit</p>
                                            <p className="text-3xl font-black text-white">R$ 142.800,00</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Drivers Online</p>
                                                <p className="text-xl font-black text-white">24 / 24</p>
                                            </div>
                                            <div className="p-4 bg-slate-900 border border-white/5 rounded-xl">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Maintenance</p>
                                                <p className="text-xl font-black text-rose-500">02 Alertas</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center text-sky-500"><MessageCircle className="w-5 h-5" /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-sky-500 uppercase">Chat Intel Assistant</p>
                                                    <p className="text-xs text-slate-400 italic">"Gargalo detectado em fretes via SP-Norte."</p>
                                                </div>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By Section (Micro-social proof) */}
            <section className="py-20 opacity-60">
                <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Focado em Eficiência, Controle e Retorno Financeiro Real</p>
                <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 grayscale group-hover:grayscale-0 transition-all duration-700">
                    <div className="text-2xl font-black text-slate-400 italic tracking-tighter hover:text-emerald-500 transition-colors uppercase">RBS_Infrastructure</div>
                    <div className="text-2xl font-black text-slate-400 italic tracking-tighter hover:text-emerald-500 transition-colors uppercase">Neural_Monitoring</div>
                    <div className="text-2xl font-black text-slate-400 italic tracking-tighter hover:text-emerald-500 transition-colors uppercase">Tech_Logistics</div>
                    <div className="text-2xl font-black text-slate-400 italic tracking-tighter hover:text-emerald-500 transition-colors uppercase">Data_Driven_Fleet</div>
                </div>
            </section>

            {/* Features Section - Deep Details */}
            <section id="recursos" className="py-40 relative">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Feature 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-60">
                        <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                            <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"><BarChart3 className="w-10 h-10" /></div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                AUDITORIA DE <br />
                                <span className="text-emerald-500">MARGEM LIMPA.</span>
                            </h2>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                Pare de adivinhar quanto sobrou no fim do mês. O Ribeirx Log calcula automaticamente todos os seus custos reais. Tenha uma visão cirúrgica do seu retorno sobre investimento direto na sua tela.
                            </p>
                            <ul className="space-y-6">
                                {["Cálculo de Diesel/KM Integrado", "Visão de custos em tempo real", "Monitoramento de taxas de frete"].map(item => (
                                    <li key={item} className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative group perspective-1000">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full scale-75 opacity-50 group-hover:opacity-80 transition-all duration-1000"></div>
                            <div className="glass-card rounded-[4rem] p-4 border-white/10 relative z-10 hover:rotate-2 transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                                <div className="aspect-video bg-slate-950 rounded-[3.5rem] border border-white/5 flex items-center justify-center p-12 overflow-hidden relative">
                                    {/* Abstract High-Tech Visual for Profitability */}
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #10b981 0, #10b981 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
                                    <DollarSign className="w-40 h-40 text-emerald-500 opacity-20 animate-float" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-12 left-12 right-12 p-6 glass-card rounded-2xl border-white/10">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] mb-4">
                                            <span>Real-Time Profit</span>
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[78%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 - Intelligence */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-60">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="absolute inset-0 bg-sky-500/20 blur-[120px] rounded-full scale-75 opacity-50 group-hover:opacity-80 transition-all duration-1000"></div>
                            <div className="glass-card rounded-[4rem] p-4 border-white/10 relative z-10 hover:rotate-[-2deg] transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                                <div className="aspect-video bg-slate-950 rounded-[3.5rem] border border-white/5 flex items-center justify-center p-12 overflow-hidden relative">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #0ea5e9 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                    <BrainCircuit className="w-40 h-40 text-sky-500 opacity-20 animate-float" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000">
                            <div className="inline-flex p-4 bg-sky-500/10 rounded-2xl text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]"><Zap className="w-10 h-10" /></div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                INTELIGÊNCIA <br />
                                <span className="text-sky-500">PROATIVA RBS.</span>
                            </h2>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                Nossa plataforma não apenas organiza, ela avisa. Identifique gargalos na manutenção e oportunidades de frete com base no histórico real dos seus veículos.
                            </p>
                            <div className="p-8 bg-sky-500/5 border border-sky-500/10 rounded-[3rem] backdrop-blur-sm">
                                <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> Sistema em Operação
                                </p>
                                <p className="text-slate-300 text-sm italic leading-relaxed">
                                    "Otimização de custos disponível: Seus últimos 10 fretes indicam uma variação de margem de 12% dependendo da transportadora selecionada."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Smart Calculator Placeholder (The Future Addition) */}
                    <div className="max-w-4xl mx-auto glass-card rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                        <div className="relative z-10">
                            <div className="inline-flex py-2 px-6 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">
                                Em Desenvolvimento
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 italic uppercase">
                                Calculadora <br /><span className="text-emerald-500">Inteligente RBS.</span>
                            </h3>
                            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-16">
                                Em breve: Simule sua viagem completa antes mesmo de ligar o caminhão. Diesel, pedágio, manutenção e taxas — tudo calculado em segundos para garantir o seu preço final.
                            </p>
                            <div className="flex justify-center">
                                <div className="w-full max-w-md h-20 bg-slate-950/50 border border-white/5 rounded-3xl flex items-center px-8 justify-between text-slate-700 italic text-sm">
                                    <span>rbs_smart_calculator.exe</span>
                                    <Clock className="w-5 h-5 animate-spin duration-1000" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 p-20 opacity-5 group-hover:opacity-10 transition-all duration-700">
                            <Calculator className="w-64 h-64 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works - The Flow */}
            <section id="como-funciona" className="py-40 bg-slate-900/40 relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-32 space-y-6">
                        <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter">FLUXO DE SUCESSO.</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em]">Em 3 passos seu negócio sobe de nível</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {[
                            { step: '01', title: 'ONBOARDING INTEL', desc: 'Conecte sua conta RBS e importe seus primeiros fretes em segundos.', icon: MousePointerClick },
                            { step: '02', title: 'PROCESSAMENTO NEURAL', desc: 'Nossa engine analisa cada centavo gasto e gera seus dashboards de lucro real.', icon: Zap },
                            { step: '03', title: 'ESCALA DE MARGEM', desc: 'Use os insights para aceitar fretes melhores e reduzir custos operacionais.', icon: TrendingUp },
                        ].map((item, i) => (
                            <div key={i} className="group relative">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10rem] font-black text-white/5 pointer-events-none">{item.step}</div>
                                <div className="relative glass-card p-12 rounded-[3.5rem] hover:border-emerald-500/30 transition-all duration-500 h-full">
                                    <div className="w-20 h-20 bg-slate-950 border border-white/5 rounded-3xl flex items-center justify-center mb-10 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                        <item.icon className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{item.title}</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section - The Offer */}
            <section id="planos" className="py-40 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-32 space-y-6">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">
                            <Star className="w-3 h-3" /> Parceria & Investimento
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter italic uppercase">Escolha sua <br /> <span className="text-emerald-500">POTÊNCIA.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-end">
                        <LandingPricingCard
                            title="START"
                            price="R$ 59,90"
                            period="/mês"
                            desc="Para o motorista autônomo que quer parar de perder dinheiro."
                            features={["Dashboard Fianceiro Base", "Controle de 1 Veículo", "Relatórios Trimestrais", "Suporte Comunitário"]}
                            onSelect={() => onPurchase('Mensal')}
                        />
                        <LandingPricingCard
                            title="NEURAL ELITE"
                            price="R$ 497,00"
                            period="/ano"
                            isPopular
                            desc="O sistema completo para quem quer ser referência no mercado."
                            features={[
                                "Frota Ilimitada",
                                "Full AI Analysis (Neural Engine)",
                                "Ranking Global de Performance",
                                "Consultoria WhatsApp Prioritária",
                                "Exportação de XML/Fechamentos",
                                "Zero Taxa de Adesão"
                            ]}
                            onSelect={() => onPurchase('Anual')}
                        />
                        <LandingPricingCard
                            title="LIFETIME SOCIEDADE"
                            price="R$ 297,00"
                            period=" único"
                            desc="Pague uma única vez. Seu acesso é vitalício para esse veículo."
                            features={[
                                "Licença Perpétua p/ 1 Placa",
                                "Sem Mensalidades",
                                "Módulo de Manutenção Full",
                                "Histórico para Auditoria"
                            ]}
                            onSelect={() => onPurchase('Vitalício')}
                        />
                    </div>
                </div>
            </section>

            {/* Security & Support Section (Bonus Persuasion) */}
            <section className="py-20 bg-slate-900/50 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {[
                        { icon: Lock, title: "DADOS PROTEGIDOS", desc: "Criptografia de ponta a ponta para seus dados financeiros." },
                        { icon: MessageCircle, title: "SUPORTE ESPECIALIZADO", desc: "Arthur e time estão online no Zap para te ajudar." },
                        { icon: Infinity, title: "CLOUD SYNC", desc: "Acesse do computador, tablet ou celular em qualquer lugar." },
                        { icon: ShieldCheck, title: "REGRAS DA ANTT", desc: "Cálculos adaptados às normas e pedágios vigentes." },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-6 items-start">
                            <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-white/5 shadow-xl"><item.icon className="w-6 h-6" /></div>
                            <div>
                                <h5 className="font-black text-white text-xs uppercase tracking-widest mb-2">{item.title}</h5>
                                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA - The Last Push */}
            <section id="contato" className="py-40 relative">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="glass-card rounded-[4rem] p-12 md:p-24 text-center space-y-12 border-emerald-500/20 glow-emerald relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none"><Truck className="w-64 h-64" /></div>

                        <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight relative z-10">
                            PRONTO PARA DEIXAR O <br />
                            <span className="text-emerald-500 underline decoration-emerald-500/30">AMADORISMO PARA TRÁS?</span>
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative z-10">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-16 py-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-[2.5rem] shadow-2xl transition-all text-2xl hover:scale-105 active:scale-95"
                            >
                                CRIAR CONTA AGORA
                            </button>
                            <button
                                onClick={handleWhatsAppContact}
                                className="w-full sm:w-auto px-12 py-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-[2.5rem] transition-all text-xl flex items-center justify-center gap-4"
                            >
                                <MessageCircle className="w-7 h-7" /> AJUDA NO WHATSAPP
                            </button>
                        </div>

                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest relative z-10">Liberação imediata via Pix após cadastro</p>
                    </div>
                </div>
            </section>

            {/* Footer Premium */}
            <footer className="py-32 border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20">
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <Truck className="text-slate-950 w-6 h-6" />
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white uppercase italic">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                        </div>
                        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
                            A plataforma definitiva para transportadores modernos. Unindo inteligência artificial,
                            gestão de frota e controle financeiro de alta precisão.
                        </p>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 bg-slate-900 border border-white/5 rounded-full hover:bg-emerald-500/10 cursor-pointer transition-colors" />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-8">Navegação</h4>
                        <ul className="space-y-4 text-sm text-slate-500 font-bold">
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Dashboard</li>
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Manutenção</li>
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Tabela de Fretes</li>
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Sistema de Gestão</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-8">Tecnologia</h4>
                        <ul className="space-y-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> RBS Neural v2.0</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Cloud Processing</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Smart Monitoring</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-32 pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">© 2026 RIBEIRX LOGÍSTICA INTELIGENTE. MADE BY ART_RBS.</p>
                    <div className="flex gap-8">
                        <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Políticas de Privacidade</span>
                        <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Termos de Uso</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const LandingPricingCard = ({ title, price, period, desc, features, isPopular, onSelect }: any) => (
    <div className={`p-8 md:p-16 rounded-[3rem] md:rounded-[4.5rem] flex flex-col transition-all border relative overflow-hidden group ${isPopular ? 'bg-slate-900 border-emerald-500/50 scale-105 shadow-[0_40px_100px_rgba(16,185,129,0.15)] z-10' : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}>
        {isPopular && (
            <div className="absolute top-8 right-8 px-6 py-2 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                MAIS VENDIDO
            </div>
        )}
        <div className="mb-12">
            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${isPopular ? 'text-emerald-500' : 'text-slate-500'}`}>{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-6xl md:text-7xl font-black text-white tracking-tighter">{price}</span>
                <span className="text-slate-500 text-lg font-bold tracking-tighter">{period}</span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mt-6 max-w-[250px]">{desc}</p>
        </div>

        <div className="space-y-6 mb-16 flex-1">
            {features.map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-4 text-xs text-white/70 font-bold uppercase tracking-widest">
                    <div className="w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    {f}
                </div>
            ))}
        </div>

        <button
            onClick={onSelect}
            className={`w-full py-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all ${isPopular ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
        >
            ADQUIRIR AGORA
        </button>
    </div>
);

const LandingTableRow = ({ label, v1, v2, v3 }: any) => (
    <tr className="hover:bg-white/[0.04] transition-all group/row">
        <td className="p-10 text-slate-400 font-black text-[10px] uppercase tracking-widest">{label}</td>
        <td className="p-10 text-white font-bold">{v1}</td>
        <td className="p-10">
            <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-400 font-black text-lg italic tracking-tighter">{v2}</span>
            </div>
        </td>
        <td className="p-10 text-white font-bold">{v3}</td>
    </tr>
);

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

const StepItem = ({ icon: Icon, step, title, desc, action }: any) => (
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
        <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mb-4">{desc}</p>
        {action && (
            <button
                onClick={action.onClick}
                className="text-xs text-emerald-500 font-black uppercase tracking-widest flex items-center gap-2 hover:text-emerald-400 transition-colors"
            >
                {action.label} <ArrowRight className="w-4 h-4" />
            </button>
        )}
    </div>
);

export default LandingPage;
