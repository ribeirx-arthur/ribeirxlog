
import React, { useState } from 'react';
import {
    X, HelpCircle, ChevronRight, ChevronLeft, CheckCircle2, MessageCircle,
    BarChart3, Calculator, MapPin, Settings2, Truck, BookOpen, AlertCircle,
    ExternalLink, Bug, Send, User, Mail, FileText, Star, GraduationCap,
    Play, Pause, ChevronDown, BrainCircuit
} from 'lucide-react';
import { TabType } from '../types';

const WHATSAPP_SUPPORT = '5513988205888';

interface TutorialModule {
    id: string;
    icon: React.ElementType;
    title: string;
    tab: TabType;
    steps: {
        title: string;
        desc: string;
        tip?: string;
    }[];
    slideshow?: {
        title: string;
        desc: string;
    }[];
}

const MODULES: TutorialModule[] = [
    {
        id: 'calculator',
        icon: Calculator,
        title: 'Calculadora de Frete',
        tab: 'freight-calculator',
        steps: [
            { title: '1. Informe a rota', desc: 'Digite a cidade de origem e destino. Clique em "Calcular Rota" para usar a IA.', tip: 'Sempre confirme a distância no Qualp antes de finalizar.' },
            { title: '2. Configure o veículo', desc: 'Selecione o caminhão, número de eixos e tipo de carga (ANTT).', tip: 'O tipo de carga impacta diretamente o piso mínimo legal.' },
            { title: '3. Defina os custos', desc: 'Preço do diesel, margem de lucro desejada e comissão do motorista.', tip: 'Use a margem mínima de 15% para cobrir imprevistos.' },
            { title: '4. Analise o resultado', desc: 'O sistema calcula o frete sugerido, custo real e alerta se o valor não é lucrativo.', tip: 'Se o status for VERMELHO, recuse o frete.' },
        ],
        slideshow: [
            { title: 'Frete Não Lucrativo', desc: 'Se o frete ofertado está abaixo do custo real, o sistema alerta com borda vermelha.' },
            { title: 'Compliance ANTT', desc: 'O piso mínimo ANTT é calculado automaticamente para proteger você legalmente.' },
        ]
    },
    {
        id: 'trips',
        icon: MapPin,
        title: 'Lançar Viagem',
        tab: 'new-trip',
        steps: [
            { title: '1. Selecione a rota', desc: 'Informe origem e destino. O sistema sugere dados de viagens anteriores na mesma rota.' },
            { title: '2. Aloque recursos', desc: 'Selecione o caminhão, motorista e transportadora. No modo simples, esses campos são opcionais.' },
            { title: '3. Preencha o financeiro', desc: 'Frete seco, diárias, combustível e outras despesas.' },
            { title: '4. Monitore o resultado', desc: 'O painel lateral já mostra o lucro estimado em tempo real enquanto você preenche.' },
        ]
    },
    {
        id: 'dashboard',
        icon: BarChart3,
        title: 'Dashboard',
        tab: 'dashboard',
        steps: [
            { title: 'Visão Geral', desc: 'O dashboard mostra faturamento, lucro líquido e despesas do período selecionado.' },
            { title: 'Filtros de Período', desc: 'Filtre por semana, mês ou intervalo personalizado para analisar períodos específicos.' },
            { title: 'Cartões de Alerta', desc: 'Viagens com pendências de recebimento são destacadas automaticamente.' },
        ]
    },
    {
        id: 'setup',
        icon: Settings2,
        title: 'Cadastros',
        tab: 'setup',
        steps: [
            { title: 'Veículos', desc: 'Cadastre a placa, eixos, marca e modelo. Adicione documentação (ANTT, tacógrafo, seguro).' },
            { title: 'Motoristas', desc: 'Nome, CPF, CNH e validade. O sistema alerta quando a CNH está perto de vencer.' },
            { title: 'Transportadoras', desc: 'CNPJ, contato e prazo médio de pagamento para monitorar recebíveis.' },
        ]
    },
    {
        id: 'fleet',
        icon: Truck,
        title: 'Saúde da Frota',
        tab: 'maintenance',
        steps: [
            { title: 'Alertas de Manutenção', desc: 'Configure KMs limite para óleo, freios, pneus e revisão geral.' },
            { title: 'Histórico de Serviços', desc: 'Registre cada manutenção com custo, data e KM para cálculo de custos por KM.' },
        ]
    },
    {
        id: 'ia',
        icon: BrainCircuit,
        title: 'IA e Lucratividade',
        tab: 'intelligence',
        steps: [
            { title: 'IA para Controle Próprio', desc: 'A IA RBX foi feita para quem quer dominar 100% dos seus gastos próprios. Ela analisa padrões que o olho humano ignora.' },
            { title: 'Projeção de Lucro', desc: 'Acesse a aba de Inteligência para ver como a IA projeta seus lucros baseada no histórico de despesas reais.' },
            { title: 'Perguntas Estratégicas', desc: 'Peça orientações como "Como aumentar meu lucro nos próximos 3 meses?" e receba um plano de ação.' },
        ]
    },
];

interface TutorialSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveTab: (tab: TabType) => void;
    tutorialMode?: 'simple' | 'advanced';
}

const TutorialSidebar: React.FC<TutorialSidebarProps> = ({
    isOpen, onClose, setActiveTab, tutorialMode = 'simple'
}) => {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
    const [activeSection, setActiveSection] = useState<'tutorials' | 'bug-report'>('tutorials');

    // Bug report state
    const [bugName, setBugName] = useState('');
    const [bugEmail, setBugEmail] = useState('');
    const [bugDesc, setBugDesc] = useState('');
    const [bugSent, setBugSent] = useState(false);

    const selectedModule = MODULES.find(m => m.id === activeModule);

    const handleMarkComplete = (id: string) => {
        setCompletedModules(prev => ({ ...prev, [id]: true }));
        setActiveModule(null);
    };

    const handleNeedHelp = (title: string) => {
        const text = encodeURIComponent(`Olá! Preciso de ajuda com: ${title} no RibeirxLog.`);
        window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${text}`, '_blank');
    };

    const handleSendBugReport = () => {
        if (!bugDesc.trim()) return;
        const text = encodeURIComponent(
            `🐛 RELATO DE ERRO — RibeirxLog\n\n` +
            `Nome: ${bugName || 'Não informado'}\n` +
            `Email: ${bugEmail || 'Não informado'}\n\n` +
            `Descrição:\n${bugDesc}`
        );
        window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${text}`, '_blank');
        setBugSent(true);
        setTimeout(() => {
            setBugName(''); setBugEmail(''); setBugDesc(''); setBugSent(false);
        }, 4000);
    };

    const completedCount = Object.values(completedModules).filter(Boolean).length;

    return (
        <>
            {/* Overlay (mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 z-[190] md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 z-[195] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Central de Ajuda</h3>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">
                                {tutorialMode === 'advanced' ? '⭐ Modo Avançado' : '⚡ Modo Simples'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Section tabs */}
                <div className="flex border-b border-slate-800 shrink-0">
                    <button
                        onClick={() => { setActiveSection('tutorials'); setActiveModule(null); }}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'tutorials' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}`}
                    >
                        📚 Tutoriais
                    </button>
                    <button
                        onClick={() => { setActiveSection('bug-report'); setActiveModule(null); }}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === 'bug-report' ? 'text-rose-400 border-b-2 border-rose-500' : 'text-slate-500 hover:text-white'}`}
                    >
                        🐛 Relatar Erro
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">

                    {/* ── TUTORIALS SECTION ── */}
                    {activeSection === 'tutorials' && !activeModule && (
                        <div className="p-4 space-y-3">
                            {/* Progress */}
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Seu Progresso</p>
                                    <span className="text-[10px] font-black text-white">{completedCount}/{MODULES.length}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${(completedCount / MODULES.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1">
                                {tutorialMode === 'advanced' ? 'Detalhamento Profissional' : 'Guia Passo a Passo'}
                            </p>

                            {MODULES.map(mod => (
                                <button
                                    key={mod.id}
                                    onClick={() => { setActiveModule(mod.id); setCurrentSlide(0); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all group ${completedModules[mod.id]
                                        ? 'border-emerald-500/30 bg-emerald-500/5'
                                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${completedModules[mod.id] ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
                                        {completedModules[mod.id] ? <CheckCircle2 className="w-5 h-5" /> : <mod.icon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-tight ${completedModules[mod.id] ? 'text-emerald-400' : 'text-white'}`}>{mod.title}</p>
                                        <p className="text-[10px] text-slate-500">{mod.steps.length} passos</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 transition-all group-hover:translate-x-1" />
                                </button>
                            ))}

                            {/* WhatsApp support CTA */}
                            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
                                <p className="text-[10px] text-slate-400 mb-3">Não encontrou o que precisa?</p>
                                <a
                                    href={`https://wa.me/${WHATSAPP_SUPPORT}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 w-full justify-center"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Falar com Suporte
                                </a>
                            </div>
                        </div>
                    )}

                    {/* ── MODULE DETAIL ── */}
                    {activeSection === 'tutorials' && activeModule && selectedModule && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-slate-800 flex items-center gap-3 shrink-0">
                                <button onClick={() => setActiveModule(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-white uppercase tracking-tight">{selectedModule.title}</p>
                                    <p className="text-[9px] text-slate-500 uppercase">{selectedModule.steps.length} passos</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab(selectedModule.tab)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 text-sky-400 text-[9px] font-black uppercase rounded-lg hover:bg-sky-500/30 transition-all"
                                >
                                    Abrir <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {/* Steps */}
                                {selectedModule.steps.map((s, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                                        <div className="flex-1 pb-3 border-b border-slate-800 last:border-0">
                                            <p className="text-xs font-black text-white mb-1">{s.title}</p>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                                            {s.tip && tutorialMode === 'advanced' && (
                                                <div className="mt-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-2">
                                                    <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-amber-400/80 leading-tight">{s.tip}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Slideshow highlights (advanced only) */}
                                {tutorialMode === 'advanced' && selectedModule.slideshow && (
                                    <div className="pt-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Destaques Visuais</p>
                                        <div className="relative">
                                            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl min-h-[100px]">
                                                <p className="text-xs font-black text-white mb-1">{selectedModule.slideshow[currentSlide].title}</p>
                                                <p className="text-[11px] text-slate-400 leading-relaxed">{selectedModule.slideshow[currentSlide].desc}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <button
                                                    onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                                                    disabled={currentSlide === 0}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 transition-all"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <div className="flex gap-1.5">
                                                    {selectedModule.slideshow.map((_, i) => (
                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? 'bg-emerald-500 w-4' : 'bg-slate-700'}`} />
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentSlide(s => Math.min((selectedModule.slideshow?.length || 1) - 1, s + 1))}
                                                    disabled={currentSlide === (selectedModule.slideshow?.length || 1) - 1}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-white disabled:opacity-30 transition-all"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Module actions */}
                            <div className="p-4 border-t border-slate-800 flex gap-2 shrink-0">
                                <button
                                    onClick={() => handleNeedHelp(selectedModule.title)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <MessageCircle className="w-4 h-4" /> Preciso de Ajuda
                                </button>
                                <button
                                    onClick={() => handleMarkComplete(activeModule)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Já sei usar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── BUG REPORT SECTION ── */}
                    {activeSection === 'bug-report' && (
                        <div className="p-4 space-y-4">
                            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                                <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Relatar um Problema</p>
                                <p className="text-[11px] text-slate-400 leading-relaxed">Encontrou um bug ou comportamento inesperado? Descreva aqui e enviaremos diretamente para o suporte via WhatsApp.</p>
                            </div>

                            {!bugSent ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome (opcional)</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                            <input
                                                type="text"
                                                value={bugName}
                                                onChange={e => setBugName(e.target.value)}
                                                placeholder="Seu nome"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-white text-xs font-medium focus:border-rose-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de Contato (opcional)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                            <input
                                                type="email"
                                                value={bugEmail}
                                                onChange={e => setBugEmail(e.target.value)}
                                                placeholder="email@exemplo.com"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-white text-xs font-medium focus:border-rose-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição do Problema *</label>
                                        <textarea
                                            value={bugDesc}
                                            onChange={e => setBugDesc(e.target.value)}
                                            placeholder="O que aconteceu? Em qual tela? O que você estava fazendo?"
                                            rows={5}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white text-xs font-medium focus:border-rose-500/50 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendBugReport}
                                        disabled={!bugDesc.trim()}
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${bugDesc.trim()
                                            ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 active:scale-95'
                                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        Enviar via WhatsApp
                                    </button>
                                    <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest">Isso abrirá o WhatsApp com a mensagem pré-formatada</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 py-8 animate-in fade-in duration-500">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-white mb-1">Obrigado!</p>
                                        <p className="text-xs text-slate-400">Relatório enviado para o suporte.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default TutorialSidebar;
