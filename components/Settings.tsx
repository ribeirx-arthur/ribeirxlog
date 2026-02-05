
import React, { useState, useRef } from 'react';
import {
   Save,
   Percent,
   ShieldCheck,
   User,
   Bell,
   Database,
   Camera,
   Upload,
   Building2,
   Mail,
   Phone,
   Briefcase,
   Clock,
   AlertTriangle,
   Lightbulb,
   FileSearch,
   Download,
   Trash2,
   RefreshCw,
   Server,
   CloudLightning,
   Gauge,
   Sun,
   Moon,
   Wrench,
   TrendingUp,
   Layers,
   List,
   Settings2,
   Sparkles,
   Check,
   Calculator
} from 'lucide-react';
import { useAppMode } from '../contexts/AppModeContext';
import { UserProfile, Vehicle, Driver, Shipper, Trip, MaintenanceRecord } from '../types';

interface SettingsProps {
   profile: UserProfile;
   setProfile: (p: UserProfile) => void;
   // Adicionados para backup
   trips: Trip[];
   vehicles: Vehicle[];
   drivers: Driver[];
   shippers: Shipper[];
   maintenances: MaintenanceRecord[];
   onImportData: (data: any) => void;
   onResetData: () => void;
}

type SettingsSubTab = 'profile' | 'mode' | 'calculations' | 'notifications' | 'data';

const Settings: React.FC<SettingsProps> = ({
   profile, setProfile,
   trips, vehicles, drivers, shippers, maintenances,
   onImportData, onResetData
}) => {
   const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('profile');
   const [tempProfile, setTempProfile] = useState<UserProfile>({ ...profile });
   const [isResetting, setIsResetting] = useState(false);

   const logoInputRef = useRef<HTMLInputElement>(null);
   const signatureInputRef = useRef<HTMLInputElement>(null);
   const importInputRef = useRef<HTMLInputElement>(null);

   if (!profile || !profile.config) {
      return <div className="flex items-center justify-center h-64 text-slate-400 font-black uppercase">Carregando Ribeirx Engine...</div>;
   }

   const handleConfigChange = (key: keyof UserProfile['config'], value: any) => {
      setProfile({
         ...profile,
         config: { ...profile.config, [key]: value }
      });
   };

   const handleProfileSave = () => {
      setProfile(tempProfile);
      alert("Perfil operacional atualizado!");
   };

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setTempProfile({
               ...tempProfile,
               [type === 'logo' ? 'logoUrl' : 'signatureUrl']: reader.result as string
            });
         };
         reader.readAsDataURL(file);
      }
   };

   // BACKUP LOGIC
   const handleExport = () => {
      const backupData = {
         profile,
         trips,
         vehicles,
         drivers,
         shippers,
         maintenances,
         exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ribeirx-log-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
   };

   const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (event) => {
            try {
               const data = JSON.parse(event.target?.result as string);
               if (data.profile && data.trips) {
                  onImportData(data);
                  alert("Backup restaurado com sucesso!");
               } else {
                  alert("Arquivo de backup inválido.");
               }
            } catch (err) {
               alert("Erro ao ler o arquivo.");
            }
         };
         reader.readAsText(file);
      }
   };

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
         <header>
            <h2 className="text-4xl font-black text-white tracking-tighter">Painel de Controle</h2>
            <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Configurações de Identidade & Sistema</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-3 space-y-2">
               <NavButton id="profile" label="Meu Perfil" icon={User} active={activeSubTab} onClick={setActiveSubTab} />
               <NavButton id="mode" label="Modo de Aplicação" icon={Layers} active={activeSubTab} onClick={setActiveSubTab} />
               <NavButton id="calculations" label="Regras de Cálculo" icon={ShieldCheck} active={activeSubTab} onClick={setActiveSubTab} />
               <NavButton id="notifications" label="Alertas e IA" icon={Bell} active={activeSubTab} onClick={setActiveSubTab} />
               <NavButton id="data" label="Backup e Dados" icon={Database} active={activeSubTab} onClick={setActiveSubTab} />
            </aside>

            <main className="lg:col-span-9">
               {activeSubTab === 'profile' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4">
                     <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                           <Building2 className="w-64 h-64" />
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                           <div className="relative group">
                              <div className="w-40 h-40 bg-slate-950 rounded-[2rem] border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50">
                                 {tempProfile.logoUrl ? (
                                    <img src={tempProfile.logoUrl} className="w-full h-full object-contain p-4" alt="Company Logo" />
                                 ) : (
                                    <Building2 className="w-12 h-12 text-slate-700" />
                                 )}
                                 <div onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                                    <Camera className="w-8 h-8 text-white mb-2" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Logo Empresa</span>
                                 </div>
                              </div>
                              <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                           </div>

                           <div className="flex-1 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Field label="Nome Operacional" icon={User} value={tempProfile.name} onChange={v => setTempProfile({ ...tempProfile, name: v })} />
                                 <Field label="E-mail Administrativo" icon={Mail} value={tempProfile.email} onChange={v => setTempProfile({ ...tempProfile, email: v })} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Field label="Nome da Empresa" icon={Briefcase} value={tempProfile.companyName} onChange={v => setTempProfile({ ...tempProfile, companyName: v })} />
                                 <Field label="Telefone / WhatsApp" icon={Phone} value={tempProfile.phone || ''} onChange={v => setTempProfile({ ...tempProfile, phone: v })} placeholder="(00) 00000-0000" />
                              </div>
                           </div>
                        </div>

                        <div className="pt-8 border-t border-slate-800">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Aparência do Sistema</p>
                           <div className="flex gap-4">
                              <button
                                 onClick={() => handleConfigChange('theme', 'dark')}
                                 className={`flex-1 p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${(profile.config.theme || 'dark') === 'dark'
                                    ? 'bg-slate-800 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                              >
                                 <Moon className="w-5 h-5" />
                                 <span className="text-xs font-black uppercase">Modo Escuro</span>
                              </button>
                              <button
                                 onClick={() => handleConfigChange('theme', 'light')}
                                 className={`flex-1 p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${profile.config.theme === 'light'
                                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-lg'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                              >
                                 <Sun className="w-5 h-5" />
                                 <span className="text-xs font-black uppercase">Modo Claro</span>
                              </button>
                           </div>
                        </div>

                        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                           <div className="flex items-center gap-6">
                              <div className="relative group">
                                 <div className="w-48 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-500/50">
                                    {tempProfile.signatureUrl ? (
                                       <img src={tempProfile.signatureUrl} className="w-full h-full object-contain" alt="Signature" />
                                    ) : (
                                       <span className="text-[9px] font-black text-slate-700 uppercase">Assinatura Digital</span>
                                    )}
                                    <div onClick={() => signatureInputRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                                       <Upload className="w-5 h-5 text-white" />
                                    </div>
                                 </div>
                                 <input type="file" ref={signatureInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'signature')} />
                              </div>
                           </div>
                           <button onClick={handleProfileSave} className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 uppercase tracking-widest text-xs">
                              <Save className="w-5 h-5" /> Atualizar Identidade
                           </button>
                        </div>
                     </section>
                  </div>
               )}

               {/* ABA MODO DE APLICAÇÃO */}
               {activeSubTab === 'mode' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                           <Layers className="w-64 h-64" />
                        </div>

                        <header className="flex items-center justify-between border-b border-slate-800 pb-6 relative z-10">
                           <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                              <Layers className="text-purple-500" /> Complexidade do Sistema
                           </h3>
                           <span className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Modo Atual: {profile.config.appMode || 'advanced'}
                           </span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                           {/* MODO SIMPLES */}
                           <button
                              onClick={() => handleConfigChange('appMode', 'simple')}
                              className={`group text-left p-6 rounded-3xl border transition-all relative overflow-hidden ${profile.config.appMode === 'simple'
                                 ? 'bg-slate-800 border-purple-500 shadow-xl shadow-purple-500/10'
                                 : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                 }`}
                           >
                              <div className="relative z-10 space-y-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${profile.config.appMode === 'simple' ? 'bg-purple-500 text-white translate-y-[-2px]' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800'}`}>
                                    <List className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                       <h4 className={`text-sm font-black uppercase tracking-wide ${profile.config.appMode === 'simple' ? 'text-white' : 'text-slate-300'}`}>Simples</h4>
                                       {profile.config.appMode === 'simple' && <Check className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                       Ideal para autônomos. Foca apenas no registro básico de receitas e despesas. Sem manutenção detalhada ou BI complexo.
                                    </p>
                                 </div>
                                 <ul className="space-y-2 pt-2">
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Registro de Viagens
                                    </li>
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Controle de Caixa
                                    </li>
                                 </ul>
                              </div>
                           </button>

                           {/* MODO INTERMEDIÁRIO */}
                           <button
                              onClick={() => handleConfigChange('appMode', 'intermediate')}
                              className={`group text-left p-6 rounded-3xl border transition-all relative overflow-hidden ${profile.config.appMode === 'intermediate'
                                 ? 'bg-slate-800 border-purple-500 shadow-xl shadow-purple-500/10'
                                 : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                 }`}
                           >
                              <div className="relative z-10 space-y-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${profile.config.appMode === 'intermediate' ? 'bg-purple-500 text-white translate-y-[-2px]' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800'}`}>
                                    <Layers className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                       <h4 className={`text-sm font-black uppercase tracking-wide ${profile.config.appMode === 'intermediate' ? 'text-white' : 'text-slate-300'}`}>Intermediário</h4>
                                       {profile.config.appMode === 'intermediate' && <Check className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                       Adiciona gestão básica de manutenção e resultados por veículo. Ótimo para quem tem 2-3 caminhões.
                                    </p>
                                 </div>
                                 <ul className="space-y-2 pt-2">
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Manutenção Preventiva
                                    </li>
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Resultados por Placa
                                    </li>
                                 </ul>
                              </div>
                           </button>

                           {/* MODO AVANÇADO */}
                           <button
                              onClick={() => handleConfigChange('appMode', 'advanced')}
                              className={`group text-left p-6 rounded-3xl border transition-all relative overflow-hidden ${profile.config.appMode === 'advanced'
                                 ? 'bg-slate-800 border-purple-500 shadow-xl shadow-purple-500/10'
                                 : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                 }`}
                           >
                              <div className="relative z-10 space-y-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${profile.config.appMode === 'advanced' ? 'bg-purple-500 text-white translate-y-[-2px]' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800'}`}>
                                    <Sparkles className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                       <h4 className={`text-sm font-black uppercase tracking-wide ${profile.config.appMode === 'advanced' ? 'text-white' : 'text-slate-300'}`}>Avançado (ERP)</h4>
                                       {profile.config.appMode === 'advanced' && <Check className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                       Experiência completa. BI, Gestão de Pneus, Sócios, Motoristas e Auditoria. Para gestores de frota.
                                    </p>
                                 </div>
                                 <ul className="space-y-2 pt-2">
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Tudo Incluso + Pneus
                                    </li>
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> BI & Inteligência
                                    </li>
                                 </ul>
                              </div>
                           </button>

                           {/* MODO PERSONALIZADO */}
                           <button
                              onClick={() => handleConfigChange('appMode', 'custom')}
                              className={`group text-left p-6 rounded-3xl border transition-all relative overflow-hidden ${profile.config.appMode === 'custom'
                                 ? 'bg-slate-800 border-purple-500 shadow-xl shadow-purple-500/10'
                                 : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                 }`}
                           >
                              <div className="relative z-10 space-y-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${profile.config.appMode === 'custom' ? 'bg-purple-500 text-white translate-y-[-2px]' : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800'}`}>
                                    <Settings2 className="w-6 h-6" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                       <h4 className={`text-sm font-black uppercase tracking-wide ${profile.config.appMode === 'custom' ? 'text-white' : 'text-slate-300'}`}>Personalizado</h4>
                                       {profile.config.appMode === 'custom' && <Check className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                       Configure manualmente quais módulos deseja ver ativos na aba "Alertas e IA".
                                    </p>
                                 </div>
                                 <ul className="space-y-2 pt-2">
                                    <li className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                                       <Check className="w-3 h-3 text-emerald-500" /> Flexibilidade Total
                                    </li>
                                 </ul>
                              </div>
                           </button>
                        </div>

                        {profile.config.appMode === 'custom' && (
                           <div className="pt-8 border-t border-slate-800 animate-in slide-in-from-bottom-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Módulos Ativos</p>
                              <div className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800">
                                 <ToggleOption
                                    label="Manutenção Completa"
                                    description="Controle de óleo, peças e serviços."
                                    checked={profile.config.enableMaintenance ?? true}
                                    onChange={v => handleConfigChange('enableMaintenance', v)}
                                    icon={Wrench}
                                 />
                                 <ToggleOption
                                    label="Business Intelligence"
                                    description="Gráficos e relatórios de performance."
                                    checked={profile.config.enableBI ?? true}
                                    onChange={v => handleConfigChange('enableBI', v)}
                                    icon={TrendingUp}
                                 />
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}
               {activeSubTab === 'calculations' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                           <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                              <Percent className="text-emerald-500" /> Taxas Operacionais Padrão
                           </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <Field label="Comissão Frete Seco (%)" type="number" value={profile.config.percMotFrete.toString()} onChange={v => handleConfigChange('percMotFrete', Number(v))} />
                           <Field label="Comissão Diárias (%)" type="number" value={profile.config.percMotDiaria.toString()} onChange={v => handleConfigChange('percMotDiaria', Number(v))} />
                        </div>

                        <div className="space-y-4 pt-6">
                           <ToggleOption label="Telemetria Ativa (KM)" description="Monitora desgaste de frota baseado no odômetro das viagens." checked={profile.config.showMileage} onChange={v => handleConfigChange('showMileage', v)} icon={Gauge} />
                           <ToggleOption label="Divisão Automática" description="Calcula ROI de sócios automaticamente em veículos marcados." checked={profile.config.autoSplitSociety} onChange={v => handleConfigChange('autoSplitSociety', v)} icon={CloudLightning} />
                        </div>
                     </div>
                  </div>
               )}

               {/* ABA NOTIFICAÇÕES INTELIGENTES */}
               {activeSubTab === 'notifications' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                        <header className="flex items-center justify-between border-b border-slate-800 pb-6">
                           <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                              <Bell className="text-sky-500" /> Central de Alertas & IA
                           </h3>
                           <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Motor v2 Ativo</span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                           <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 group hover:border-sky-500/30 transition-all">
                              <div className="flex items-center justify-between mb-6">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500">
                                       <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-black text-white uppercase tracking-widest">Inadimplência de Viagem</h4>
                                       <p className="text-[10px] text-slate-500 font-bold">Avisar se o frete não for pago em:</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <input
                                       type="number"
                                       value={profile.config.paymentAlertDays}
                                       onChange={e => handleConfigChange('paymentAlertDays', Number(e.target.value))}
                                       className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-center text-white font-black focus:border-sky-500 outline-none"
                                    />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">DIAS</span>
                                 </div>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">O sistema monitora a data de retorno prevista e gera um alerta crítico se o status não for alterado para 'Pago' após este prazo.</p>
                           </div>

                           <div className="space-y-4">
                              <ToggleOption label="Módulo de Manutenção" description="Habilita aba de gestão de frotas, trocas de óleo e pneus." checked={profile.config.enableMaintenance} onChange={v => handleConfigChange('enableMaintenance', v)} icon={Wrench} />
                              <ToggleOption label="Cálculo de Frete Estratégico" description="Habilita a calculadora de frete com matriz de custo complexa." checked={profile.config.enableFreightCalculator ?? true} onChange={v => handleConfigChange('enableFreightCalculator', v)} icon={Calculator} />
                              <ToggleOption label="Business Intelligence Avançado" description="Habilita painel de performance, rankings e análise de lucro por KM." checked={profile.config.enableBI} onChange={v => handleConfigChange('enableBI', v)} icon={TrendingUp} />
                              <ToggleOption label="Integridade de Dados" description="Avisa se foram detectadas viagens sem KM ou valores de combustível preenchidos." checked={profile.config.notifyIncompleteData} onChange={v => handleConfigChange('notifyIncompleteData', v)} icon={FileSearch} />
                              <ToggleOption label="Saúde Predutiva" description="Gera alertas de manutenção quando um veículo atinge 90% da vida útil de algum componente." checked={profile.config.notifyMaintenance} onChange={v => handleConfigChange('notifyMaintenance', v)} icon={AlertTriangle} />
                              <ToggleOption label="Dicas de Performance (IA)" description="Habilita o motor de sugestões estratégicas no dashboard de BI." checked={profile.config.showTips} onChange={v => handleConfigChange('showTips', v)} icon={Lightbulb} />
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* ABA BACKUP E DADOS */}
               {activeSubTab === 'data' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none">
                           <Server className="w-64 h-64" />
                        </div>

                        <header className="flex items-center justify-between border-b border-slate-800 pb-6 relative z-10">
                           <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                              <Database className="text-amber-500" /> Resiliência de Dados
                           </h3>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estatísticas do Banco</h4>
                              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 grid grid-cols-2 gap-6">
                                 <StatItem label="Lançamentos" value={trips.length} />
                                 <StatItem label="Ativos" value={vehicles.length} />
                                 <StatItem label="Equipe" value={drivers.length} />
                                 <StatItem label="Histórico" value={maintenances.length} />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ações de Segurança</h4>
                              <div className="space-y-3">
                                 <button onClick={handleExport} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all">
                                    <Download className="w-4 h-4" /> Exportar Backup (JSON)
                                 </button>
                                 <button onClick={() => importInputRef.current?.click()} className="w-full py-4 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all">
                                    <RefreshCw className="w-4 h-4" /> Restaurar de Arquivo
                                 </button>
                                 <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
                              </div>
                           </div>
                        </div>

                        <div className="pt-10 border-t border-slate-800 relative z-10">
                           <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                                    <Trash2 className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Zona de Perigo</h4>
                                    <p className="text-[10px] text-slate-500 font-bold">Excluir todos os registros permanentemente.</p>
                                 </div>
                              </div>
                              {isResetting ? (
                                 <div className="flex items-center gap-4">
                                    <button onClick={() => setIsResetting(false)} className="px-6 py-3 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
                                    <button onClick={() => { onResetData(); setIsResetting(false); }} className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-rose-600/20">Confirmar Apagar Tudo</button>
                                 </div>
                              ) : (
                                 <button onClick={() => setIsResetting(true)} className="px-10 py-4 bg-rose-500 text-rose-950 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all">
                                    Resetar ERP
                                 </button>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </main>
         </div >
      </div >
   );
};

const NavButton = ({ id, label, icon: Icon, active, onClick }: any) => (
   <button onClick={() => onClick(id)} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${active === id ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
      <Icon className="w-5 h-5" /> {label}
   </button>
);

const Field = ({ label, icon: Icon, value, onChange, type = "text", placeholder = "" }: any) => (
   <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
         {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
         <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${Icon ? 'pl-12' : 'px-4'} pr-4 py-4 text-white font-bold focus:border-emerald-500 outline-none transition-all`} />
      </div>
   </div>
);

const ToggleOption = ({ label, description, checked, onChange, icon: Icon }: any) => (
   <label className="flex items-center justify-between cursor-pointer group p-6 bg-slate-950/50 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
      <div className="flex items-center gap-4">
         <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
            <Icon className="w-5 h-5" />
         </div>
         <div className="space-y-0.5">
            <span className="text-xs text-slate-200 font-black uppercase tracking-tight">{label}</span>
            <p className="text-[9px] text-slate-500 font-medium italic">{description}</p>
         </div>
      </div>
      <div className="relative inline-flex items-center">
         <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
         <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
      </div>
   </label>
);

const StatItem = ({ label, value }: any) => (
   <div>
      <p className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-tighter">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
   </div>
);

export default Settings;
