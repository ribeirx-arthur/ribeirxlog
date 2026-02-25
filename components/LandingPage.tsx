
import React, { useState } from 'react';
import LegalModal from './LegalModal';
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
    Building2,
    MapPin,
    Smartphone,
    Navigation,
    Globe,
    Youtube
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../pricing';

interface LandingPageProps {
    onGetStarted: () => void;
    onPurchase: (plan: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase }) => {
    const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);

    const handleWhatsAppContact = () => {
        const message = encodeURIComponent("Olá Arthur! Vi o Ribeirx Log e gostaria de tirar algumas dúvidas sobre os planos.");
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    };

    const handleWaitlistContact = () => {
        const message = encodeURIComponent("Olá Arthur! Quero entrar na LISTA VIP para ter acesso antecipado ao App Ribeirx Driver e garantir os bônus exclusivos quando lançar nas lojas.");
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
                        {['Recursos', 'GPS Tracking', 'Planos', 'Contato'].map((item) => (
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
                                A INTELIGÊNCIA DO <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-100 to-sky-400">SEU CAMINHÃO.</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-left-12 duration-1000 delay-500">
                                Esqueça as planilhas e o caderninho. Assuma o controle total do seu lucro, das despesas de viagem e receba os dados direto no celular com o <span className="text-emerald-400 font-bold">App pelo Zap</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-700">
                                <button
                                    onClick={onGetStarted}
                                    className="w-full sm:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)] transition-all text-lg hover:scale-105 active:scale-95 group"
                                >
                                    CRIAR CONTA GRÁTIS <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a href="#gps-tracking" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all text-lg">
                                    VER NOVIDADES GPS
                                </a>
                            </div>

                            {/* Core Modules Badges */}
                            <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                                {[
                                    { icon: MapPin, label: "Live GPS" },
                                    { icon: Smartphone, label: "Driver App" },
                                    { icon: Users, label: "Driver CRM" },
                                    { icon: Building2, label: "Carrier Logic" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3 bg-slate-900/50 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-default">
                                        <item.icon className="w-4 h-4 text-emerald-500" /> {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Showcase - Compact & Dense */}
                        {/* Interactive Showcase - Fast Demo */}
                        <div className="lg:col-span-5 relative animate-in slide-in-from-right-12 duration-1000 delay-1000">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full translate-y-20 scale-75 opacity-30"></div>
                            <div className="relative glass-card rounded-[3rem] p-3 border-emerald-500/20 shadow-[0_40px_100px_rgba(16,185,129,0.2)] overflow-hidden hover:scale-105 transition-transform duration-700">
                                <img src="/site-rapido.gif" alt="Demonstração do Ribeirx Log" className="w-full h-auto min-h-[400px] object-cover rounded-[2.5rem] bg-slate-950 border border-white/5 shadow-inner" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEW: GPS TRACKING SECTION - FEATURE HIGHLIGHT */}
            <section id="gps-tracking" className="py-40 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/50 skew-y-3 transform origin-bottom-right z-0"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
                        <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
                            <div className="flex flex-col gap-4 items-start">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <Clock className="w-3 h-3" /> Em desenvolvimento (Breve nas lojas de app)
                                </div>
                                <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <Globe className="w-10 h-10" />
                                </div>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                VISÃO GLOBAL <br />
                                <span className="text-emerald-500">EM TEMPO REAL.</span>
                            </h2>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                Abandone os rastreadores caros. Com o <span className="text-white font-bold">Ribeirx Mobile Technology</span>, o celular do seu motorista vira um rastreador de alta precisão.
                            </p>
                            <ul className="space-y-6">
                                {[
                                    "Monitoramento de velocidade ao vivo",
                                    "Histórico de rotas completo",
                                    "Alertas de paradas não programadas",
                                    "Economia média de R$ 150/mês por caminhão"
                                ].map(item => (
                                    <li key={item} className="flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <button onClick={handleWaitlistContact} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                                    <MessageCircle className="w-5 h-5" /> Entrar na Lista VIP
                                </button>
                                <div className="flex gap-2">
                                    <div className="relative group cursor-not-allowed">
                                        <div className="absolute inset-0 bg-black/60 z-10 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest border border-white/20 bg-black/80 px-2 py-1 rounded">Em Breve</span>
                                        </div>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-[52px] opacity-50" />
                                    </div>
                                    <div className="relative group cursor-not-allowed">
                                        <div className="absolute inset-0 bg-black/60 z-10 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest border border-white/20 bg-black/80 px-2 py-1 rounded">Em Breve</span>
                                        </div>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-[52px] opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Video Presentation */}
                        <div className="relative group perspective-1000">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full scale-75 opacity-50"></div>
                            <div className="glass-card rounded-[3rem] border-white/10 relative z-10 p-4 hover:rotate-[-1deg] transition-all duration-700 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
                                <div className="bg-slate-950 rounded-[2.5rem] border border-white/5 overflow-hidden relative">
                                    <img src="/dashboard-motorista.gif" alt="Visão do Sistema e Motorista na estrada" className="w-full h-auto object-cover opacity-90 transition-opacity group-hover:opacity-100" />
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

                    {/* Feature 2 - Intelligence & Driver App */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center mb-60">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="absolute inset-0 bg-sky-500/20 blur-[120px] rounded-full scale-75 opacity-50 group-hover:opacity-80 transition-all duration-1000"></div>
                            <div className="glass-card rounded-[4rem] p-4 border-white/10 relative z-10 hover:rotate-[-2deg] transition-all duration-700 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                                <div className="aspect-video bg-slate-950 rounded-[3.5rem] border border-white/5 flex items-center justify-center p-12 overflow-hidden relative">
                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #0ea5e9 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                    <Smartphone className="w-40 h-40 text-sky-500 opacity-20 animate-float" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-12 animate-in fade-in slide-in-from-right-8 duration-1000">
                            <div className="inline-flex p-4 bg-sky-500/10 rounded-2xl text-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]"><Zap className="w-10 h-10" /></div>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                                APP DO MOTORISTA <br />
                                <span className="text-sky-500">VIA WHATSAPP.</span>
                            </h2>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed">
                                Esqueça downloads complexos. Gere um link, envie no Zap e pronto: seu motorista tem um app completo para enviar comprovantes, iniciar viagens e ativar o GPS.
                            </p>
                            <div className="p-8 bg-sky-500/5 border border-sky-500/10 rounded-[3rem] backdrop-blur-sm">
                                <p className="text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> App Instantâneo (PWA)
                                </p>
                                <p className="text-slate-300 text-sm italic leading-relaxed">
                                    "Motorista João iniciou a viagem SP → RJ. Rastreamento ativo. Previsão de chegada: 18:30."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NEW: Smart Calculator Placeholder (The Future Addition) */}
                    {/* NEW: Smart Calculator - NOW LIVE */}
                    <div className="max-w-4xl mx-auto glass-card rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden group border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                        <div className="relative z-10">
                            <div className="inline-flex py-2 px-6 bg-emerald-500 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-12 animate-pulse shadow-lg shadow-emerald-500/20">
                                Funcionalidade Liberada
                            </div>
                            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 italic uppercase leading-none">
                                Calculadora de <br /><span className="text-emerald-500">Frete Inteligente.</span>
                            </h3>
                            <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
                                <span className="text-white font-bold">Nunca mais pague para trabalhar.</span> Simule diesel, pedágio, manutenção e sua margem de lucro em 10 segundos. Você coloca a origem, destino e veículo, nós te damos o preço exato.
                            </p>
                            <div className="flex justify-center">
                                <a href="#planos" className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl flex items-center gap-4 hover:scale-105 transition-all shadow-2xl uppercase tracking-widest">
                                    Quero Usar Agora <ArrowRight className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 p-20 opacity-10 group-hover:opacity-20 transition-all duration-700 rotate-12">
                            <Calculator className="w-80 h-80 text-emerald-500" />
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

            {/* SOCIAL PROOF - Testimonials (Task 2) */}
            <section className="py-32 relative border-y border-white/5 bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                            <Star className="w-3 h-3 fill-current" /> 100% Aprovado
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                            Quem usa, <span className="text-emerald-500">recomenda.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="João Carlos Ferreira"
                            role="Motorista Autônomo — 6 eixos"
                            city="São Paulo, SP"
                            text="Antes eu anotava tudo no papel e sempre esquecia de cobrar pedágio e diária. Agora lanço a viagem no app e já aparece o valor certo. Economizei R$ 800 no primeiro mês só de erro de cálculo."
                        />
                        <TestimonialCard
                            name="Maria Aparecida Santos"
                            role="Proprietária — Frota 3 caminhões"
                            city="Uberlândia, MG"
                            text="Finalmente consigo ver qual caminhão dá lucro e qual tá me dando prejuízo. O dashboard financeiro é simples e funciona. Não precisa de contador pra entender."
                        />
                        <TestimonialCard
                            name="Rodrigo Mendes"
                            role="Autônomo — 9 eixos"
                            city="Curitiba, PR"
                            text="A calculadora de frete salvou minha vida. Eu aceitava frete ruim sem saber. Agora antes de fechar qualquer valor eu calculo no app. Já recusei 3 fretes podres esse mês."
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section - The Offer */}
            <section id="planos" className="py-40 relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <img src="/background-minimalista.gif" alt="Background Logística Edge" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/70 to-slate-950 pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-32 space-y-6">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">
                            <Star className="w-3 h-3" /> Parceria & Investimento
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter italic uppercase">Escolha sua <br /> <span className="text-emerald-500">POTÊNCIA.</span></h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-end">
                        <LandingPricingCard
                            title="PILOTO"
                            price="R$ 34,90"
                            period="/mês"
                            desc="O essencial para o motorista autônomo organizar as contas do caminhão."
                            features={[
                                "Calculadora de Frete Inteligente",
                                "Controle de Caixa (Entrada/Saída)",
                                "Relatório de Lucro por Viagem",
                                "Sem Rastreamento GPS",
                                "Suporte via Email"
                            ]}
                            onSelect={() => onPurchase('Piloto')}
                        />
                        <LandingPricingCard
                            title="GESTOR PRO"
                            price="R$ 89,90"
                            period="/mês"
                            isPopular
                            desc="Controle total da sua frota com rastreamento e inteligência artificial."
                            features={[
                                "Frota Ilimitada (Promoção)",
                                "GPS Rastreamento (Em breve nas lojas)",
                                "App do Motorista (Em breve)",
                                "Emissão de CIOT/MDF-e (Em breve)",
                                "Gestão de Pneus e Manutenção",
                                "Suporte Prioritário no Zap"
                            ]}
                            onSelect={() => onPurchase('Gestor Pro')}
                        />
                        <LandingPricingCard
                            title="FROTA ELITE"
                            price="R$ 797,00"
                            period="/ano"
                            desc="O mesmo poder do plano Gestor Pro, com 2 meses de economia."
                            features={[
                                "Todas as funções do Gestor Pro",
                                "Economia de R$ 281,00 no ano",
                                "Consultoria de Implantação Grátis",
                                "Selo de Transportadora Verificada",
                                "Prioridade em Novas Funções"
                            ]}
                            onSelect={() => onPurchase('Anual Elite')}
                        />
                    </div>
                </div>
            </section>

            {/* Security & Support Section (Bonus Persuasion) */}
            {/* Help & Tutorials Section (Task Request) */}
            <section className="py-20 bg-slate-900 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6 uppercase">
                                Dúvidas? <br />
                                <span className="text-emerald-500">A gente explica fácil.</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                                Não precisa ser expert em computador. Criamos tutoriais rápidos que te ensinam a usar tudo em menos de 2 minutos.
                            </p>

                            <div className="space-y-4">
                                <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Youtube className="w-5 h-5" />
                                            </div>
                                            <span className="text-white font-bold">Como calcular seu primeiro frete</span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Youtube className="w-5 h-5" />
                                            </div>
                                            <span className="text-white font-bold">Cadastrando motorista pelo WhatsApp</span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-10">
                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <MessageCircle className="w-6 h-6 text-emerald-500" /> Perguntas Frequentes
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { q: "Precisa instalar algo?", a: "Não. Funciona direto no navegador do seu celular ou computador." },
                                    { q: "Serve para autônomo?", a: "Sim! É perfeito para quem tem 1 caminhão ou uma pequena frota." },
                                    { q: "Como pago?", a: "Pix ou Cartão. Liberação imediata." },
                                    { q: "Tem fidelidade?", a: "Não. Você cancela quando quiser, sem multa." }
                                ].map((faq, i) => (
                                    <div key={i} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
                                        <p className="text-emerald-400 font-bold text-sm mb-2">{faq.q}</p>
                                        <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
                                COMEÇAR GRÁTIS AGORA
                            </button>
                            <button
                                onClick={handleWhatsAppContact}
                                className="w-full sm:w-auto px-12 py-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-[2.5rem] transition-all text-xl flex items-center justify-center gap-4"
                            >
                                <MessageCircle className="w-7 h-7" /> TIRAR DÚVIDAS NO ZAP
                            </button>
                        </div>

                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest relative z-10 mt-6">Teste sem cartão de crédito. Você só assina se gostar.</p>
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
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">GPS Tracking</li>
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Digital Driver App</li>
                            <li className="hover:text-emerald-500 cursor-pointer transition-colors">Tabela de Fretes</li>
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
                        <button onClick={() => setLegalType('privacy')} className="text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Políticas de Privacidade</button>
                        <button onClick={() => setLegalType('terms')} className="text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Termos de Uso</button>
                    </div>
                </div>
            </footer>

            <LegalModal
                isOpen={legalType !== null}
                onClose={() => setLegalType(null)}
                type={legalType || 'terms'}
            />
        </div >
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

const TestimonialCard = ({ name, role, city, text }: any) => (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col h-full hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <MessageSquare className="w-32 h-32 text-emerald-500" />
        </div>
        <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-emerald-500 fill-current" />)}
        </div>
        <p className="text-slate-300 font-medium leading-relaxed italic mb-8 relative z-10 text-lg">"{text}"</p>
        <div className="mt-auto relative z-10 pt-6 border-t border-white/5">
            <p className="text-white font-black text-sm uppercase tracking-wide">{name}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{role}</p>
            <div className="flex items-center gap-2 mt-4 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> {city}
            </div>
        </div>
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
