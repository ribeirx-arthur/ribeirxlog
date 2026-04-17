
import React, { useState } from 'react';
import {
    Truck, User, Building2, ChevronRight, Check, ArrowRight, Play,
    Zap, BookOpen, Phone, Mail, Hash, Settings2, AlertCircle, MessageCircle,
    GraduationCap, CheckCircle2, X, BarChart3, Calculator, MapPin, Star
} from 'lucide-react';
import { UserProfile, Vehicle, Driver, VehiclePropertyType } from '../types';

const WHATSAPP_SUPPORT = '5513988205888';

interface OnboardingProps {
    onComplete: (data: {
        name: string;
        phone: string;
        companyName: string;
        city: string;
        truckCount: number;
        userRole: 'autonomo' | 'transportadora';
        vehicle: Partial<Vehicle>;
        driver: Partial<Driver>;
        appMode: 'simple' | 'intermediate' | 'advanced';
        tutorialMode: 'simple' | 'advanced';
    }) => void;
    onSkip: () => void;
    profile: UserProfile;
}

const TUTORIAL_MODULES = [
    { id: 'dashboard', icon: BarChart3, title: 'Dashboard Financeiro', desc: 'Entender lucros, despesas e indicadores.' },
    { id: 'calculator', icon: Calculator, title: 'Calculadora de Frete', desc: 'Calcular custos reais antes de aceitar.' },
    { id: 'trips', icon: MapPin, title: 'Lançar Viagem', desc: 'Registrar origem, destino, combustível e despesas.' },
    { id: 'setup', icon: Settings2, title: 'Cadastros', desc: 'Veículos, motoristas e transportadoras.' },
    { id: 'fleet', icon: Truck, title: 'Saúde da Frota', desc: 'Alertas de manutenção e pneus.' },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip, profile }) => {
    // Flow control
    const [step, setStep] = useState(0); // 0=Tutorial select, 1=Profile, 2=AppMode, 3=Vehicle, 4=Checklist

    // Step 0 — Tutorial mode
    const [tutorialMode, setTutorialMode] = useState<'simple' | 'advanced' | null>(null);

    // Step 1 — Profile data
    const [name, setName] = useState(profile.name || '');
    const [phone, setPhone] = useState(profile.phone || '');
    const [companyName, setCompanyName] = useState(profile.companyName || '');
    const [city, setCity] = useState('');
    const [truckCount, setTruckCount] = useState(1);
    const [userRole, setUserRole] = useState<'autonomo' | 'transportadora'>('autonomo');

    // Step 2 — App mode
    const [appMode, setAppMode] = useState<'simple' | 'intermediate' | 'advanced'>('simple');

    // Step 3 — Vehicle
    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleAxles, setVehicleAxles] = useState('6');
    const [vehicleName, setVehicleName] = useState('');

    // Step 4 — Checklist
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});

    const totalSteps = 5;
    const progress = ((step + 1) / totalSteps) * 100;

    const formatPhone = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const sendToWhatsApp = (module: string) => {
        const text = encodeURIComponent(`Olá! Preciso de ajuda com o módulo: ${module} do RibeirxLog.`);
        window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${text}`, '_blank');
    };

    const handleFinish = () => {
        onComplete({
            name,
            phone: phone.replace(/\D/g, ''),
            companyName: companyName || 'Minha Transportadora',
            city,
            truckCount,
            userRole,
            appMode,
            tutorialMode: tutorialMode || 'simple',
            vehicle: {
                plate: vehiclePlate,
                axles: parseInt(vehicleAxles),
                name: vehicleName || `Caminhão ${vehiclePlate}`,
                brand: 'Genérico',
                model: 'Genérico',
                type: VehiclePropertyType.PROPRIO,
                year: new Date().getFullYear(),
                societySplitFactor: 100,
                totalKmAccumulated: 0,
                lastMaintenanceKm: 0,
            } as any,
            driver: {
                name,
                phone: phone.replace(/\D/g, ''),
                status: 'Ativo',
                cnhCategory: 'E',
                cnhValidity: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            } as any,
        });
    };

    const isStep1Valid = name.length > 2 && phone.replace(/\D/g, '').length >= 10;
    const isStep3Valid = vehiclePlate.length >= 7;

    const canNext = () => {
        if (step === 0) return tutorialMode !== null;
        if (step === 1) return isStep1Valid;
        if (step === 2) return true;
        if (step === 3) return true; // vehicle is optional (can skip)
        return true;
    };

    const handleNext = () => {
        if (step < 4) setStep(s => s + 1);
        else handleFinish();
    };

    const STEP_LABELS = ['Tutorial', 'Seu Perfil', 'Modo do App', '1º Veículo', 'Checklist'];

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
            </div>

            <div className="w-full max-w-lg relative z-10 flex flex-col py-8 gap-6">
                {/* Header */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Truck className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-white">RBX<span className="text-emerald-500">LOG</span></span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                        {step === 0 && 'Bem-vindo! Como prefere começar?'}
                        {step === 1 && 'Agora me conta sobre você'}
                        {step === 2 && 'Como quer usar o sistema?'}
                        {step === 3 && 'Seu primeiro caminhão'}
                        {step === 4 && 'Checklist de Aprendizado'}
                    </h1>
                    <p className="text-slate-400 text-xs">
                        Passo {step + 1} de {totalSteps} — {STEP_LABELS[step]}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-2">
                    {STEP_LABELS.map((label, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-emerald-500 w-6' : i < step ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-2xl">

                    {/* ── STEP 0: Tutorial selection ── */}
                    {step === 0 && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <p className="text-xs text-slate-400 text-center">Escolha o nível de tutorial que melhor se encaixa com você:</p>
                            <button
                                onClick={() => setTutorialMode('simple')}
                                className={`w-full p-5 rounded-2xl border text-left transition-all group flex items-start gap-4 ${tutorialMode === 'simple' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-950 hover:border-emerald-500/50'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tutorialMode === 'simple' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-500'}`}>
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-sm uppercase tracking-tight flex items-center gap-2">
                                        Tutorial Simples
                                        {tutorialMode === 'simple' && <Check className="w-4 h-4 text-emerald-500" />}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Guia visual com ícones e passo a passo claro. Ideal para quem está começando.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setTutorialMode('advanced')}
                                className={`w-full p-5 rounded-2xl border text-left transition-all group flex items-start gap-4 ${tutorialMode === 'advanced' ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-950 hover:border-sky-500/50'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tutorialMode === 'advanced' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-500'}`}>
                                    <Star className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-white text-sm uppercase tracking-tight flex items-center gap-2">
                                        Tutorial Avançado
                                        {tutorialMode === 'advanced' && <Check className="w-4 h-4 text-sky-500" />}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Detalhamento profissional de cada funcionalidade. Para quem quer dominar o sistema.</p>
                                </div>
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest">Você pode trocar o modo a qualquer momento em Dúvidas/FAQ</p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Profile data ── */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-500">
                            {/* Required fields */}
                            <div className="space-y-3">
                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Obrigatórios</p>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Como quer ser chamado?"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Celular (WhatsApp)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(formatPhone(e.target.value))}
                                            placeholder="(13) 98820-5888"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none transition-all font-medium tracking-wider"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Optional fields */}
                            <div className="space-y-3 pt-2 border-t border-slate-800">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Opcionais (melhora seus relatórios)</p>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa / Fantasia</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            placeholder="Transportes Silva"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:border-emerald-500 outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => setUserRole('autonomo')} className={`py-2.5 px-3 rounded-xl border text-[11px] font-black uppercase transition-all ${userRole === 'autonomo' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-950 text-slate-500'}`}>
                                                🚛 Autônomo
                                            </button>
                                            <button onClick={() => setUserRole('transportadora')} className={`py-2.5 px-3 rounded-xl border text-[11px] font-black uppercase transition-all ${userRole === 'transportadora' ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-700 bg-slate-950 text-slate-500'}`}>
                                                🏢 Transportadora
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nº Caminhões</label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {[1, 2, 5, 10].map(n => (
                                                <button key={n} onClick={() => setTruckCount(n)} className={`py-2 rounded-xl text-xs font-black transition-all border ${truckCount === n ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 text-slate-500 border-slate-700 hover:border-slate-500'}`}>
                                                    {n === 10 ? '10+' : n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: App mode ── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-500">
                            <p className="text-xs text-slate-400 text-center mb-2">Cada modo exibe apenas as ferramentas que você precisa:</p>
                            {[
                                {
                                    mode: 'simple' as const,
                                    label: 'Modo Simples',
                                    emoji: '⚡',
                                    desc: 'Viagens, caixa e frete. Ideal para autônomos no dia a dia.',
                                    color: 'emerald'
                                },
                                {
                                    mode: 'intermediate' as const,
                                    label: 'Modo Intermediário',
                                    emoji: '📊',
                                    desc: 'Dashboard financeiro, motoristas e saúde da frota.',
                                    color: 'sky'
                                },
                                {
                                    mode: 'advanced' as const,
                                    label: 'Modo Avançado',
                                    emoji: '🚀',
                                    desc: 'Tudo desbloqueado: BI, IA, GPS, compliance e multi-motorista.',
                                    color: 'amber'
                                },
                            ].map(opt => (
                                <button
                                    key={opt.mode}
                                    onClick={() => setAppMode(opt.mode)}
                                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${appMode === opt.mode
                                        ? `border-${opt.color}-500 bg-${opt.color}-500/10`
                                        : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <div className="flex-1">
                                        <p className={`font-black text-sm uppercase tracking-tight ${appMode === opt.mode ? `text-${opt.color}-400` : 'text-white'}`}>
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                                    </div>
                                    {appMode === opt.mode && <Check className={`w-5 h-5 text-${opt.color}-500 shrink-0`} />}
                                </button>
                            ))}
                            <p className="text-[10px] text-slate-600 text-center uppercase tracking-widest">Você pode alterar em Configurações a qualquer momento</p>
                        </div>
                    )}

                    {/* ── STEP 3: Vehicle ── */}
                    {step === 3 && (
                        <div className="space-y-5 animate-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-emerald-400 font-medium">Pode pular e cadastrar depois em <strong>Cadastros → Veículos</strong></p>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Placa do Veículo</label>
                                    <input
                                        type="text"
                                        value={vehiclePlate}
                                        onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                        placeholder="ABC-1234 ou BRA2E19"
                                        maxLength={8}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm font-black tracking-widest uppercase focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Eixos</label>
                                        <select
                                            value={vehicleAxles}
                                            onChange={e => setVehicleAxles(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm font-medium focus:border-emerald-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="2">2 — VUC</option>
                                            <option value="3">3 — Toco/Truck</option>
                                            <option value="4">4 — Bitruck</option>
                                            <option value="6">6 — Carreta LS</option>
                                            <option value="9">9 — Rodotrem</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Apelido</label>
                                        <input
                                            type="text"
                                            value={vehicleName}
                                            onChange={e => setVehicleName(e.target.value)}
                                            placeholder="Scania Azul"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white text-sm font-medium focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Checklist ── */}
                    {step === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <p className="text-xs text-slate-400 text-center">Marque os módulos que você já entende. Para os outros, podemos chamar o suporte agora.</p>
                            <div className="space-y-2">
                                {TUTORIAL_MODULES.map(mod => (
                                    <div key={mod.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${checklist[mod.id] ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${checklist[mod.id] ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                            <mod.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black uppercase tracking-tight ${checklist[mod.id] ? 'text-emerald-400' : 'text-white'}`}>{mod.title}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{mod.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setChecklist(prev => ({ ...prev, [mod.id]: true }))}
                                                title="Já sei usar"
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${checklist[mod.id] ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            {!checklist[mod.id] && (
                                                <button
                                                    onClick={() => sendToWhatsApp(mod.title)}
                                                    title="Preciso de ajuda"
                                                    className="w-8 h-8 rounded-lg bg-slate-800 text-slate-500 hover:bg-emerald-500/20 hover:text-emerald-400 flex items-center justify-center transition-all"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-3">
                                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-slate-400">Clicar em <strong className="text-white">💬</strong> abre o WhatsApp com nosso suporte automaticamente.</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-3">
                        <button
                            onClick={() => {
                                if (step === 0) onSkip();
                                else setStep(s => s - 1);
                            }}
                            className="text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-wider px-2 py-2 flex items-center gap-1"
                        >
                            {step === 0 ? (
                                <><X className="w-3 h-3" /> Pular tudo</>
                            ) : (
                                <><ChevronRight className="w-3 h-3 rotate-180" /> Voltar</>
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            {step === 3 && (
                                <button
                                    onClick={() => setStep(4)}
                                    className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-all border border-slate-700 hover:border-slate-500"
                                >
                                    Pular veículo
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!canNext()}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg ${canNext()
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20 active:scale-95'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}
                            >
                                {step === 4 ? (
                                    <><Play className="w-4 h-4 fill-current" /> Começar</>
                                ) : (
                                    <>Próximo <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
