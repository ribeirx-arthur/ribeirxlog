
import React, { useState } from 'react';
import {
    Truck,
    User,
    Building2,
    ChevronRight,
    Check,
    ArrowRight,
    Play
} from 'lucide-react';
import { UserProfile, Vehicle, Driver, VehiclePropertyType } from '../types';

interface OnboardingProps {
    onComplete: (data: {
        companyName: string;
        city: string;
        vehicle: Partial<Vehicle>;
        driver: Partial<Driver>;
        appMode: 'simple' | 'advanced';
        userRole: 'autonomo' | 'transportadora';
    }) => void;
    onSkip: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [city, setCity] = useState('');

    const [vehiclePlate, setVehiclePlate] = useState('');
    const [vehicleAxles, setVehicleAxles] = useState('6');
    const [vehicleName, setVehicleName] = useState('');

    const [driverName, setDriverName] = useState('');
    const [driverCpf, setDriverCpf] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [driverCnhValidity, setDriverCnhValidity] = useState('');
    const [appMode, setAppMode] = useState<'simple' | 'advanced'>('simple');
    const [wantsToSetupNow, setWantsToSetupNow] = useState<boolean | null>(null);

    const [isDriverManager, setIsDriverManager] = useState<boolean | null>(null);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (isDriverManager !== null && step === 1) {
            setStep(2); // Vai para Veículo (antigo 3)
        } else if (step === 2) {
            setStep(3); // Vai para Motorista (antigo 4)
        } else if (step === 3) {
            handleFinish();
        }
    };

    const handleFinish = () => {
        onComplete({
            companyName,
            city,
            appMode,
            userRole: isDriverManager ? 'autonomo' : 'transportadora',
            vehicle: {
                plate: vehiclePlate,
                axles: parseInt(vehicleAxles),
                name: vehicleName || `Caminhão ${vehiclePlate}`,
                brand: 'Genérico', // Default
                model: 'Genérico', // Default
                type: VehiclePropertyType.PROPRIO,
                year: new Date().getFullYear(),
                societySplitFactor: 100,
                totalKmAccumulated: 0,
                lastMaintenanceKm: 0
            } as any,
            driver: {
                name: driverName,
                cpf: driverCpf,
                phone: driverPhone,
                cnh: '', // Opcional no onboarding rápido
                cnhCategory: 'E', // Default comum
                cnhValidity: driverCnhValidity || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default +1 ano se vazio
                status: 'Ativo'
            } as any
        });
    };

    const isStepValid = () => {
        if (step === 1) return companyName.length > 2 && city.length > 2;
        if (step === 2) return vehiclePlate.length >= 7; // Veículo agora é step 2
        if (step === 3) return driverName.length > 3 && driverCpf.length > 10; // Motorista agora é step 3
        return false;
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            {/* Background Simplificado para evitar travamento de GPU no mobile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
            </div>

            <div className="w-full max-w-lg relative z-10 flex flex-col pt-10 md:pt-0 max-h-screen">
                {/* Header */}
                <div className="text-center mb-6 md:mb-10 space-y-2 md:space-y-4 shrink-0">
                    <div className="inline-flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Truck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <span className="font-black text-xl md:text-2xl tracking-tighter text-white">RBX<span className="text-emerald-500">LOG</span></span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                        {wantsToSetupNow === null ? 'Bem-vindo ao RBX LOG' : 'Vamos configurar sua operação'}
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm">
                        {wantsToSetupNow === null ? 'Como deseja começar no sistema?' : 'Leva menos de 2 minutos. Sem burocracia.'}
                    </p>
                </div>

                {/* Progress Bar (Só aparece se já iniciou configuração) */}
                {wantsToSetupNow && (
                    <div className="w-full h-1 bg-slate-800 rounded-full mb-6 md:mb-10 overflow-hidden shrink-0">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Card Wrapper com Scroll */}
                <div className="flex-1 overflow-y-auto scrollbar-hide w-full pb-10">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        {/* Step -1: Configurar Agora ou Depois */}
                        {wantsToSetupNow === null && (
                            <div className="space-y-8 animate-in fade-in duration-500 py-4">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                                        <Truck className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Primeiros Passos</h3>
                                    <p className="text-slate-400 text-sm">Configure agora para já usar os recursos avançados, ou navegue apenas pelo painel de controle simples (gratuito).</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => setWantsToSetupNow(true)}
                                        className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500 hover:bg-emerald-500/20 transition-all text-left flex gap-4 items-center group relative overflow-hidden"
                                    >
                                        <div className="flex-1 z-10">
                                            <div className="font-black text-emerald-500 uppercase tracking-tighter mb-1 text-lg">Configurar Agora (Recomendado)</div>
                                            <div className="text-xs text-slate-300">Liberar frotas, motoristas e preenchimentos.</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={onSkip}
                                        className="p-6 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-all text-left group"
                                    >
                                        <div className="font-black text-slate-400 uppercase tracking-tighter mb-1">Deixar para Depois</div>
                                        <div className="text-xs text-slate-500">Acessar modo básico e explorar o site gratuito.</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 0: Initial Question */}
                        {step === 1 && wantsToSetupNow === true && isDriverManager === null && (
                            <div className="space-y-8 animate-in fade-in duration-500 py-4">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Você é motorista gestor?</h3>
                                    <p className="text-slate-400 text-sm">Queremos deixar a ferramenta com a sua cara.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => {
                                            setIsDriverManager(true);
                                            setAppMode('simple');
                                        }}
                                        className="p-6 rounded-2xl border border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                                    >
                                        <div className="font-black text-emerald-500 uppercase italic tracking-tighter mb-1">Sim, sou motorista e gestor</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Recomendamos o Modo Simples</div>
                                    </button>
                                    <button
                                        onClick={() => setIsDriverManager(false)}
                                        className="p-6 rounded-2xl border border-slate-800 bg-slate-950 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-left group"
                                    >
                                        <div className="font-black text-sky-500 uppercase italic tracking-tighter mb-1">Não, sou apenas gestor / transportador</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Configuração padrão avançada</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Company */}
                        {step === 1 && isDriverManager !== null && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Sobre sua Empresa</h3>
                                        <p className="text-xs text-slate-500">Como você quer ser chamado nos relatórios?</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome da Transportadora / Fantasia</label>
                                        <input
                                            type="text"
                                            value={companyName}
                                            onChange={e => setCompanyName(e.target.value)}
                                            placeholder="Ex: Transportes Silva"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cidade Base</label>
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="Ex: São Paulo, SP"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium text-base"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Step 2: Vehicle */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Seu Primeiro Veículo</h3>
                                        <p className="text-xs text-slate-500">Vamos cadastrar o caminhão principal.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Placa do Veículo</label>
                                        <input
                                            type="text"
                                            value={vehiclePlate}
                                            onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                            placeholder="ABC-1234"
                                            maxLength={8}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-black tracking-widest uppercase text-base"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Eixos</label>
                                            <select
                                                value={vehicleAxles}
                                                onChange={e => setVehicleAxles(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all font-medium appearance-none"
                                            >
                                                <option value="2">2 Eixos (VUC)</option>
                                                <option value="3">3 Eixos (Toco / Truck)</option>
                                                <option value="4">4 Eixos (Bitruck)</option>
                                                <option value="6">6 Eixos (Carreta LS)</option>
                                                <option value="9">9 Eixos (Rodotrem)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Apelido (Opcional)</label>
                                            <input
                                                type="text"
                                                value={vehicleName}
                                                onChange={e => setVehicleName(e.target.value)}
                                                placeholder="Ex: Scania Azul"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Driver */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Motorista Principal</h3>
                                        <p className="text-xs text-slate-500">Quem dirige esse caminhão? (Pode ser você)</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={driverName}
                                            onChange={e => setDriverName(e.target.value)}
                                            placeholder="Nome do Motorista"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium text-base"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">CPF (Apenas números)</label>
                                        <input
                                            type="text"
                                            value={driverCpf}
                                            onChange={e => setDriverCpf(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000.000.000-00"
                                            maxLength={11}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium tracking-wide"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <button
                                onClick={onSkip}
                                className="text-[10px] md:text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-wider px-2 py-3"
                            >
                                Pular setup
                            </button>

                            {isDriverManager !== null && (
                                <button
                                    onClick={handleNext}
                                    disabled={!isStepValid()}
                                    className={`flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-lg ${isStepValid()
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-emerald-500/20 translate-y-0'
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed translate-y-0'
                                        }`}
                                >
                                    {step === 3 ? 'Começar' : 'Próximo'}
                                    {step === 3 ? <Play className="w-4 h-4 fill-current" /> : <ArrowRight className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Fim do Card */}
                </div>
            </div>

            {/* Dots fora do Card Wrapper */}
            <div className="flex justify-center gap-2 my-6 shrink-0 z-10">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-emerald-500 w-6' : i < step ? 'bg-emerald-500/40' : 'bg-slate-800'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Onboarding;
