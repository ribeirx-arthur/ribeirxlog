
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

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        onComplete({
            companyName,
            city,
            appMode,
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
        if (step === 2) return appMode !== null;
        if (step === 3) return vehiclePlate.length >= 7;
        if (step === 4) return driverName.length > 3 && driverCpf.length > 10;
        return false;
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Truck className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-white">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Vamos configurar sua operação</h1>
                    <p className="text-slate-400 text-sm">Leva menos de 2 minutos. Sem burocracia.</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full mb-10 overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                    {/* Step 1: Company */}
                    {step === 1 && (
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
                                        autoFocus
                                        type="text"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="Ex: Transportes Silva"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cidade Base</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                        placeholder="Ex: São Paulo, SP"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: User Profile / App Mode */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                                    <Check className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Escolha sua Experiência</h3>
                                    <p className="text-xs text-slate-500">Como você prefere usar o Ribeirx Log?</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => setAppMode('simple')}
                                    className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${appMode === 'simple' ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className={`font-black text-sm uppercase italic tracking-tighter mb-1 ${appMode === 'simple' ? 'text-emerald-950' : 'text-emerald-500'}`}>Modo Autônomo (Simples)</div>
                                    <div className={`text-xs font-medium ${appMode === 'simple' ? 'text-emerald-900' : 'text-slate-500'}`}>Foco em lucro, despesas de viagem e compliance rápido. Direto ao ponto.</div>
                                    {appMode === 'simple' && <div className="absolute top-2 right-2 bg-emerald-950 text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                                </button>

                                <button
                                    onClick={() => setAppMode('advanced')}
                                    className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${appMode === 'advanced' ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className={`font-black text-sm uppercase italic tracking-tighter mb-1 ${appMode === 'advanced' ? 'text-emerald-950' : 'text-sky-500'}`}>Modo Transportadora (Completo)</div>
                                    <div className={`text-xs font-medium ${appMode === 'advanced' ? 'text-emerald-900' : 'text-slate-500'}`}>Gestão de balsa, frota, BI avançado e controle total de manutenção preditiva.</div>
                                    {appMode === 'advanced' && <div className="absolute top-2 right-2 bg-emerald-950 text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Vehicle */}
                    {step === 3 && (
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
                                        autoFocus
                                        type="text"
                                        value={vehiclePlate}
                                        onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                                        placeholder="ABC-1234"
                                        maxLength={8}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-black tracking-widest uppercase text-lg"
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

                    {/* Step 4: Driver */}
                    {step === 4 && (
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
                                        autoFocus
                                        type="text"
                                        value={driverName}
                                        onChange={e => setDriverName(e.target.value)}
                                        placeholder="Nome do Motorista"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-medium"
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
                    <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between">
                        <button
                            onClick={onSkip}
                            className="text-xs font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-wider"
                        >
                            Pular setup
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${isStepValid()
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-emerald-500/20 translate-y-0'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed translate-y-0'
                                }`}
                        >
                            {step === 4 ? 'Começar a usar' : 'Próximo'}
                            {step === 4 ? <Play className="w-4 h-4 fill-current" /> : <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Steps Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-emerald-500 w-6' : i < step ? 'bg-emerald-500/40' : 'bg-slate-800'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
