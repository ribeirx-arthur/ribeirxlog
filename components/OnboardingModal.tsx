
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Building2, 
  Truck, 
  ShieldCheck, 
  Rocket, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: Partial<UserProfile>) => void;
  profile: UserProfile;
}

type Step = 'welcome' | 'path-choice' | 'basic-info' | 'company-details' | 'success';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, profile }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [path, setPath] = useState<'simple' | 'advanced' | null>(null);
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    companyName: profile.companyName || '',
    truckCount: 1,
    userRole: 'autonomo' as 'autonomo' | 'transportadora'
  });

  const [checklist, setChecklist] = useState({
    calculator: false,
    trips: false,
    ai: false,
    firstVehicle: false
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 'welcome') setStep('path-choice');
    else if (step === 'path-choice') setStep('basic-info');
    else if (step === 'basic-info') setStep('company-details');
    else if (step === 'company-details') {
      const updatedProfile: Partial<UserProfile> = {
        name: formData.name,
        phone: formData.phone,
        companyName: formData.companyName,
        config: {
          ...profile.config,
          onboardingCompleted: true,
          appMode: path === 'simple' ? 'simple' : 'advanced',
          userRole: formData.userRole
        }
      };
      onComplete(updatedProfile);
      setStep('success');
    }
  };

  const handleBack = () => {
    if (step === 'path-choice') setStep('welcome');
    else if (step === 'basic-info') setStep('path-choice');
    else if (step === 'company-details') setStep('basic-info');
  };

  const tutorials = [
    { 
      id: 'calculator', 
      title: 'Calculadora de Frete', 
      desc: 'Como precificar sua rota com lucro real.',
      icon: Zap,
      color: 'text-amber-400'
    },
    { 
      id: 'trips', 
      title: 'Lançamento de Viagem', 
      desc: 'Gestão completa de despesas e comprovantes.',
      icon: Truck,
      color: 'text-emerald-400'
    },
    { 
      id: 'ai', 
      title: 'Inteligência Neural', 
      desc: 'Como usar a IA para prever cenários faturáveis.',
      icon: Sparkles,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl" />
      
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-3xl overflow-hidden flex flex-col md:flex-row md:h-[700px] max-h-[95vh] md:max-h-none">
        
        {/* Sidebar/Hero part of the modal */}
        <div className="w-full md:w-80 bg-slate-950 p-6 md:p-10 flex flex-row md:flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
            <Rocket className="w-48 h-48 text-emerald-500 -rotate-12" />
          </div>
          
          <div className="relative z-10 flex items-center md:block">
            <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
              Ribeirx<span className="text-emerald-500">Log</span>
            </h2>
            <div className="hidden md:block w-12 h-1 bg-emerald-500 rounded-full mt-4" />
          </div>

          <div className="relative z-10 hidden md:block">
            <StepIndicator current={step} isMobile={false} />
          </div>

          <div className="flex md:hidden relative z-10">
            <StepIndicator current={step} isMobile={true} />
          </div>

          <div className="relative z-10 pt-8 border-t border-white/5 hidden md:block">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">
                  Sua privacidade <br /> é nossa prioridade.
                </p>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950">
          
          {step === 'welcome' && (
            <div className="h-full flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
               <div className="space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                   <Sparkles className="w-3 h-3 text-emerald-500" />
                   <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Início da Jornada Neural</span>
                 </div>
                 <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none">
                   BEM-VINDO AO <br /> 
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">FUTURO DA LOGÍSTICA</span>
                 </h1>
                 <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                   Prepare-se para transformar dados em lucro real. Vamos configurar seu ambiente em menos de 2 minutos.
                 </p>
               </div>
               
               <button 
                 onClick={handleNext}
                 className="group w-full md:w-fit px-10 py-5 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 Iniciar Onboarding
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          )}

          {step === 'path-choice' && (
            <div className="h-full flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
               <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Escolha seu Caminho</h3>
                 <p className="text-slate-500 text-sm font-medium">Como você deseja explorar o sistema hoje?</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ChoiceCard 
                   icon={Rocket}
                   title="Modo Simples"
                   desc="Foco em lucro rápido, calculadora e gestão básica. Ideal para quem quer agilidade total."
                   selected={path === 'simple'}
                   onClick={() => setPath('simple')}
                   color="emerald"
                 />
                 <ChoiceCard 
                   icon={Sparkles}
                   title="Inteligência Avançada"
                   desc="Métricas profundas, análise de IA, BI completo e visão estratégica profissional."
                   selected={path === 'advanced'}
                   onClick={() => setPath('advanced')}
                   color="sky"
                 />
               </div>

               <div className="flex items-center justify-between pt-8 border-t border-white/5">
                 <button onClick={handleBack} className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                 </button>
                 <button 
                   disabled={!path}
                   onClick={handleNext}
                   className={`px-10 py-5 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all ${!path ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                 >
                   Continuar
                 </button>
               </div>
            </div>
          )}

          {step === 'basic-info' && (
            <div className="h-full flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
               <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Dados de Contato</h3>
                 <p className="text-slate-500 text-sm font-medium">Precisamos disso para o suporte via WhatsApp (+55 13 98820-5888)</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Arthur Ribeiro"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-emerald-500/50 focus:bg-slate-950 transition-all font-bold placeholder:text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+55 (00) 00000-0000"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-emerald-500/50 focus:bg-slate-950 transition-all font-bold placeholder:text-slate-800"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-8 border-t border-white/5">
                 <button onClick={handleBack} className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                 </button>
                 <button 
                   disabled={!formData.name || !formData.phone}
                   onClick={handleNext}
                   className={`px-10 py-5 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all ${(!formData.name || !formData.phone) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                 >
                   Continuar
                 </button>
               </div>
            </div>
          )}

          {step === 'company-details' && (
            <div className="h-full flex flex-col justify-center space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
               <div className="space-y-2">
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Detalhes da Operação</h3>
                 <p className="text-slate-500 text-sm font-medium">Configure sua frota base para o BI.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa / Nome Fantasia</label>
                    <div className="relative group">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input 
                        type="text" 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        placeholder="Ex: RibeirxLog Transportes"
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-emerald-500/50 focus:bg-slate-950 transition-all font-bold placeholder:text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, userRole: 'autonomo'})}
                      className={`p-6 rounded-3xl border transition-all text-left ${formData.userRole === 'autonomo' ? 'bg-emerald-500 text-slate-950 border-white/10 shadow-xl shadow-emerald-500/10' : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10'}`}
                    >
                      <User className="w-6 h-6 mb-3" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Motorista Autônomo</p>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, userRole: 'transportadora'})}
                      className={`p-6 rounded-3xl border transition-all text-left ${formData.userRole === 'transportadora' ? 'bg-indigo-500 text-white border-white/10 shadow-xl shadow-indigo-500/10' : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10'}`}
                    >
                      <Building2 className="w-6 h-6 mb-3" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Pequena Transportadora</p>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantidade de Caminhões</label>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => setFormData({...formData, truckCount: Math.max(1, formData.truckCount - 1)})}
                         className="w-12 h-12 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-center text-white hover:bg-slate-900"
                       >-</button>
                       <div className="flex-1 text-center bg-slate-950 border border-white/5 py-3 rounded-xl font-black text-white">{formData.truckCount}</div>
                       <button 
                         onClick={() => setFormData({...formData, truckCount: formData.truckCount + 1})}
                         className="w-12 h-12 bg-slate-950 border border-white/5 rounded-xl flex items-center justify-center text-white hover:bg-slate-900"
                       >+</button>
                    </div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-8 border-t border-white/5">
                 <button onClick={handleBack} className="text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                 </button>
                 <button 
                   onClick={handleNext}
                   className="px-10 py-5 bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
                 >
                   Finalizar Configuração
                 </button>
               </div>
            </div>
          )}

          {step === 'success' && (
            <div className="h-full flex flex-col justify-center items-center space-y-8 animate-in zoom-in-95 fade-in duration-500 text-center">
               <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse" />
                  <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl">
                     <CheckCircle2 className="w-12 h-12" />
                  </div>
               </div>
               
               <div className="space-y-4">
                 <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter">PRONTO PARA TRIPULAR!</h3>
                 <p className="text-slate-400 text-lg font-medium max-w-sm">
                   Acesse seus tutoriais agora ou comece a lucrar lançando sua primeira viagem.
                 </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="p-6 bg-slate-950 border border-emerald-500/20 rounded-3xl text-left space-y-4 group hover:bg-slate-900 transition-all">
                     <div className="flex items-center justify-between">
                        <HelpCircle className="w-6 h-6 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Passo a Passo</span>
                     </div>
                     <h4 className="text-white font-black uppercase text-sm italic tracking-tighter">Aprender o Sistema</h4>
                     <p className="text-xs text-slate-500 font-bold leading-relaxed">Assista guias rápidos de frete e gestão.</p>
                     <button className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">Ver Tutoriais</button>
                  </div>
                  <div className="p-6 bg-slate-950 border border-sky-500/20 rounded-3xl text-left space-y-4 group hover:bg-slate-900 transition-all">
                     <div className="flex items-center justify-between">
                        <ArrowUpRight className="w-6 h-6 text-sky-500" />
                        <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest">Quick Start</span>
                     </div>
                     <h4 className="text-white font-black uppercase text-sm italic tracking-tighter">Lançar Primeira Viagem</h4>
                     <p className="text-xs text-slate-500 font-bold leading-relaxed">Vá direto para o campo de batalha.</p>
                     <button 
                       onClick={() => window.location.reload()}
                       className="w-full py-3 bg-sky-500/10 border border-sky-500/20 text-sky-500 text-[9px] font-black uppercase tracking-widest rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-all"
                     >Ir ao Dashboard</button>
                  </div>
               </div>

               <div className="pt-4 flex flex-col items-center gap-3">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Suporte 24h via Neural Link</p>
                  <a 
                    href="https://wa.me/5513988205888" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">+55 13 98820-5888</span>
                  </a>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const ChoiceCard = ({ icon: Icon, title, desc, selected, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`p-8 rounded-[2.5rem] border transition-all text-left space-y-4 group relative overflow-hidden ${selected ? `bg-${color}-500 text-slate-950 border-white/10 shadow-2xl` : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10'}`}
  >
    <div className={`p-4 rounded-2xl ${selected ? 'bg-slate-950 text-white shadow-inner' : `bg-${color}-500/10 text-${color}-500`} transition-all w-fit`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h4 className={`text-xl font-black uppercase tracking-tighter italic ${selected ? 'text-slate-950' : 'text-white'}`}>{title}</h4>
      <p className={`text-xs font-bold leading-relaxed ${selected ? 'text-slate-950/70' : 'text-slate-500'}`}>{desc}</p>
    </div>
    {selected && (
      <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
    )}
  </button>
);

const StepIndicator = ({ current, isMobile }: { current: Step, isMobile?: boolean }) => {
  const steps: Step[] = ['welcome', 'path-choice', 'basic-info', 'company-details', 'success'];
  const currentIndex = steps.indexOf(current);

  if (isMobile) {
    return (
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i <= currentIndex ? 'bg-emerald-500 w-6 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 w-3'}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {['Início', 'Perfil', 'Contato', 'Frota', 'Finalizado'].map((label, i) => (
        <div key={i} className="flex items-center gap-4">
           <div className={`w-2 h-10 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
           <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${i <= currentIndex ? 'text-white' : 'text-slate-600'}`}>{label}</p>
        </div>
      ))}
    </div>
  );
};
