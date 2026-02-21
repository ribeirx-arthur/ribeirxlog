
import React, { useState, useRef } from 'react';
import {
   User, Building2, Phone, Mail, Camera,
   Percent, Disc, Gauge, TrendingUp, Calculator, Brain, Wrench, CloudLightning,
   Bell, Clock, FileSearch, AlertTriangle, Lightbulb,
   Download, Upload, Trash2, RefreshCw, Server,
   Check, ChevronRight, Info, Save, Settings2
} from 'lucide-react';
import { UserProfile, Vehicle, Driver, Shipper, Trip, MaintenanceRecord } from '../types';

interface SettingsProps {
   profile: UserProfile;
   setProfile: (p: UserProfile) => void;
   trips: Trip[];
   vehicles: Vehicle[];
   drivers: Driver[];
   shippers: Shipper[];
   maintenances: MaintenanceRecord[];
   onImportData: (data: any) => void;
   onResetData: () => void;
}

type Section = 'empresa' | 'calculos' | 'modulos' | 'alertas' | 'dados';

const Settings: React.FC<SettingsProps> = ({
   profile, setProfile,
   trips, vehicles, drivers, shippers, maintenances,
   onImportData, onResetData
}) => {
   const [active, setActive] = useState<Section>('empresa');
   const [tempProfile, setTempProfile] = useState<UserProfile>({ ...profile });
   const [saved, setSaved] = useState(false);
   const [isResetting, setIsResetting] = useState(false);

   const logoRef = useRef<HTMLInputElement>(null);
   const sigRef = useRef<HTMLInputElement>(null);
   const importRef = useRef<HTMLInputElement>(null);

   if (!profile || !profile.config) {
      return <div className="flex items-center justify-center h-64 text-slate-500 font-bold">Carregando...</div>;
   }

   // ─── helpers ───────────────────────────────────────
   const cfg = (key: keyof UserProfile['config'], value: any) => {
      setProfile({ ...profile, config: { ...profile.config, [key]: value } });
   };

   const saveProfile = () => {
      setProfile(tempProfile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
   };

   const uploadImg = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
         setTempProfile({
            ...tempProfile,
            [type === 'logo' ? 'logoUrl' : 'signatureUrl']: reader.result as string
         });
      };
      reader.readAsDataURL(file);
   };

   const exportBackup = () => {
      const data = { profile, trips, vehicles, drivers, shippers, maintenances, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ribeirx-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
   };

   const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
         try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.profile && data.trips) { onImportData(data); alert('Backup restaurado!'); }
            else alert('Arquivo inválido.');
         } catch { alert('Erro ao ler o arquivo.'); }
      };
      reader.readAsText(file);
   };

   // ─── nav items ─────────────────────────────────────
   const navItems: { id: Section; label: string; emoji: string; desc: string }[] = [
      { id: 'empresa', label: 'Minha Empresa', emoji: '🏢', desc: 'Nome, logo e contato' },
      { id: 'calculos', label: 'Comissões & Custos', emoji: '💰', desc: 'Como o lucro é calculado' },
      { id: 'modulos', label: 'Módulos do App', emoji: '🧩', desc: 'Ativar ou ocultar seções' },
      { id: 'alertas', label: 'Alertas', emoji: '🔔', desc: 'O que o sistema avisa' },
      { id: 'dados', label: 'Backup & Dados', emoji: '🗄️', desc: 'Exportar e importar' },
   ];

   return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">

         {/* Header */}
         <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">Configurações</h2>
            <p className="text-slate-500 text-sm mt-1">Personalize o app para a sua operação.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ── Left nav ── */}
            <aside className="lg:col-span-1 space-y-1">
               {navItems.map(n => (
                  <button
                     key={n.id}
                     onClick={() => setActive(n.id)}
                     className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all group ${active === n.id
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-slate-800/40 border border-transparent'
                        }`}
                  >
                     <span className="text-xl">{n.emoji}</span>
                     <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black leading-none ${active === n.id ? 'text-emerald-400' : 'text-slate-300'}`}>{n.label}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{n.desc}</p>
                     </div>
                     <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${active === n.id ? 'text-emerald-500' : 'text-slate-700 group-hover:text-slate-500'}`} />
                  </button>
               ))}
            </aside>

            {/* ── Content ── */}
            <main className="lg:col-span-3 space-y-5">

               {/* ════════════════════════════ EMPRESA ════════════════════════════ */}
               {active === 'empresa' && (
                  <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">

                     <Card title="Dados da empresa" subtitle="Aparecem nos PDFs de recibo gerados pelo app.">
                        {/* Logo */}
                        <div className="flex items-start gap-6 mb-6">
                           <button
                              onClick={() => logoRef.current?.click()}
                              className="relative w-24 h-24 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden group hover:border-emerald-500/50 transition-all shrink-0"
                           >
                              {tempProfile.logoUrl
                                 ? <img src={tempProfile.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                                 : <Building2 className="w-8 h-8 text-slate-700" />}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                                 <Camera className="w-5 h-5 text-white" />
                                 <span className="text-[9px] font-black text-white mt-1">LOGO</span>
                              </div>
                           </button>
                           <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={e => uploadImg(e, 'logo')} />

                           <div className="flex-1 space-y-1">
                              <p className="text-sm font-black text-white">Logo da empresa</p>
                              <p className="text-xs text-slate-500 leading-relaxed">Clique no quadrado ao lado para enviar sua logo. Ela vai aparecer no cabeçalho dos recibos enviados para os embarcadores.</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <Field label="Seu nome / apelido" icon={User} value={tempProfile.name} onChange={v => setTempProfile({ ...tempProfile, name: v })} placeholder="Ex: João Motorista" />
                           <Field label="Nome da empresa" icon={Building2} value={tempProfile.companyName || ''} onChange={v => setTempProfile({ ...tempProfile, companyName: v })} placeholder="Ex: Transportes João LTDA" />
                           <Field label="CPF ou CNPJ" icon={FileSearch} value={tempProfile.cpfCnpj || ''} onChange={v => setTempProfile({ ...tempProfile, cpfCnpj: v })} placeholder="000.000.000-00" />
                           <Field label="E-mail de contato" icon={Mail} value={tempProfile.email} onChange={v => setTempProfile({ ...tempProfile, email: v })} placeholder="seu@email.com" />
                           <Field label="WhatsApp / Telefone" icon={Phone} value={tempProfile.phone || ''} onChange={v => setTempProfile({ ...tempProfile, phone: v })} placeholder="(11) 99999-9999" />
                        </div>
                     </Card>

                     <div className="flex justify-end">
                        <button
                           onClick={saveProfile}
                           className={`flex items-center gap-3 px-8 py-4 font-black rounded-2xl uppercase text-xs tracking-wider transition-all shadow-xl ${saved ? 'bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-emerald-950 shadow-emerald-500/20'}`}
                        >
                           {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar alterações</>}
                        </button>
                     </div>
                  </div>
               )}

               {/* ════════════════════════════ CÁLCULOS ════════════════════════════ */}
               {active === 'calculos' && (
                  <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">

                     <Card title="Comissão dos motoristas" subtitle="O sistema usa esses percentuais para calcular o lucro líquido de cada viagem automaticamente.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <NumberField
                              label="Comissão do Frete Seco"
                              value={profile.config.percMotFrete}
                              onChange={v => cfg('percMotFrete', v)}
                              unit="%"
                              hint="Porcentagem que o motorista recebe sobre o valor do frete principal."
                              example="Se o frete é R$2.000 e a comissão é 10%, o motorista recebe R$200."
                           />
                           <NumberField
                              label="Comissão das Diárias"
                              value={profile.config.percMotDiaria}
                              onChange={v => cfg('percMotDiaria', v)}
                              unit="%"
                              hint="Porcentagem que o motorista recebe sobre as diárias cobradas."
                              example="Se a diária é R$100 e a comissão é 30%, o motorista recebe R$30."
                           />
                        </div>
                        <Tip>Cada motorista pode ter uma comissão individual diferente dessa. Configure em Cadastros → Motorista → Editar.</Tip>
                     </Card>

                     <Card title="Custo de desgaste (pneus e mecânica)" subtitle="Ativar isso torna o lucro líquido mais realista, pois desconta os gastos invisíveis do dia a dia.">
                        <Toggle
                           label="Calcular desgaste automaticamente"
                           desc="Quando ativado, o sistema desconta um custo por km de pneus e mecânica em cada viagem."
                           checked={profile.config.calculateDepreciation}
                           onChange={v => cfg('calculateDepreciation', v)}
                        />

                        {profile.config.calculateDepreciation && (
                           <div className="mt-4 space-y-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                              <p className="text-xs text-slate-400 font-medium">
                                 Deixe em <strong className="text-white">0,00</strong> para o sistema estimar automaticamente com base na quantidade de eixos do caminhão. Ou informe um valor fixo:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <NumberField
                                    label="Custo de pneus por KM"
                                    value={profile.config.costPerKmTire || 0}
                                    onChange={v => cfg('costPerKmTire', v)}
                                    unit="R$/km"
                                    hint="Quanto você gasta em média com pneus por quilômetro rodado."
                                    example="Ex: R$0,85/km → se rodou 500km, abate R$425,00 do lucro."
                                    step={0.01}
                                 />
                                 <NumberField
                                    label="Custo de mecânica por KM"
                                    value={profile.config.costPerKmMaintenance || 0}
                                    onChange={v => cfg('costPerKmMaintenance', v)}
                                    unit="R$/km"
                                    hint="Quanto você gasta em média com manutenção por quilômetro."
                                    example="Ex: R$0,50/km → se rodou 500km, abate R$250,00 do lucro."
                                    step={0.01}
                                 />
                              </div>
                           </div>
                        )}
                     </Card>

                     <Card title="Outras opções de cálculo">
                        <Toggle
                           label="Monitorar KM rodados"
                           desc="Registra a quilometragem de cada viagem no odômetro do veículo. Necessário para os alertas de manutenção."
                           checked={profile.config.showMileage}
                           onChange={v => cfg('showMileage', v)}
                        />
                        <Toggle
                           label="Divisão automática de lucro (Sociedade)"
                           desc="Veículos marcados como 'em sociedade' terão o lucro dividido automaticamente entre os sócios."
                           checked={profile.config.autoSplitSociety}
                           onChange={v => cfg('autoSplitSociety', v)}
                        />
                     </Card>
                  </div>
               )}

               {/* ════════════════════════════ MÓDULOS ════════════════════════════ */}
               {active === 'modulos' && (
                  <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">

                     <Card title="Módulos do app" subtitle="Ative apenas o que você usa. Desativar um módulo o oculta do menu — você não perde os dados.">
                        <div className="space-y-3">
                           <ModuleCard
                              emoji="🧮"
                              label="Calculadora de Frete"
                              desc="Simula o custo completo de uma viagem antes de fechar o preço com o embarcador."
                              checked={profile.config.enableFreightCalculator ?? true}
                              onChange={v => cfg('enableFreightCalculator', v)}
                              tag="Popular"
                           />
                           <ModuleCard
                              emoji="📊"
                              label="BI & Performance"
                              desc="Relatórios avançados: rotas mais lucrativas, ranking de motoristas, gráficos de tendência."
                              checked={profile.config.enableBI}
                              onChange={v => cfg('enableBI', v)}
                           />
                           <ModuleCard
                              emoji="🔧"
                              label="Saúde da Frota"
                              desc="Controle de manutenções, troca de óleo, freios e outros componentes dos veículos."
                              checked={profile.config.enableMaintenance}
                              onChange={v => cfg('enableMaintenance', v)}
                           />
                           <ModuleCard
                              emoji="🛞"
                              label="Gestão de Pneus"
                              desc="Cadastro individual de pneus com custo por km, vida útil e alertas de troca."
                              checked={(profile.config.enabledFeatures || []).includes('tires') || profile.config.enableMaintenance}
                              onChange={v => {
                                 const cur = profile.config.enabledFeatures || [];
                                 cfg('enabledFeatures', v ? [...cur, 'tires'] : cur.filter((f: string) => f !== 'tires'));
                              }}
                           />
                           <ModuleCard
                              emoji="🧠"
                              label="Inteligência IA"
                              desc="Dicas automáticas geradas com base nos seus dados: alertas de fretes ruins, embarcadores problemáticos e mais."
                              checked={profile.config.showTips !== false}
                              onChange={v => cfg('showTips', v)}
                              tag="Recomendado"
                           />
                        </div>
                     </Card>

                     <Tip>Dica: no menu lateral, seções desativadas somem automaticamente. Se quiser reativar depois, volte aqui.</Tip>
                  </div>
               )}

               {/* ════════════════════════════ ALERTAS ════════════════════════════ */}
               {active === 'alertas' && (
                  <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">

                     <Card title="Alerta de pagamento atrasado" subtitle="O sistema monitora se um frete não foi marcado como pago dentro do prazo esperado.">
                        <div className="flex items-center justify-between gap-6 flex-wrap">
                           <div className="space-y-1">
                              <p className="text-sm font-bold text-white">Avisar após quantos dias sem pagamento?</p>
                              <p className="text-xs text-slate-500">Conta a partir da data de retorno da viagem.</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <input
                                 type="number"
                                 value={profile.config.paymentAlertDays}
                                 onChange={e => cfg('paymentAlertDays', Number(e.target.value))}
                                 className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-center text-white font-black text-lg focus:border-emerald-500 outline-none"
                              />
                              <span className="text-sm font-bold text-slate-400">dias</span>
                           </div>
                        </div>
                        <Tip>Ex: se colocar 7 dias, o sistema avisa se a viagem completou 7 dias desde o retorno e ainda está com pagamento pendente.</Tip>
                     </Card>

                     <Card title="Outros alertas" subtitle="Cada um pode ser ativado ou desativado independentemente.">
                        <div className="space-y-3">
                           <Toggle
                              label="Alerta de viagem com dados incompletos"
                              desc="Avisa se uma viagem foi lançada sem KM rodados ou sem valor de combustível."
                              checked={profile.config.notifyIncompleteData}
                              onChange={v => cfg('notifyIncompleteData', v)}
                           />
                           <Toggle
                              label="Alerta de manutenção próxima"
                              desc="Avisa quando um veículo está se aproximando do limite de km para troca de óleo, pneus ou freios."
                              checked={profile.config.notifyMaintenance}
                              onChange={v => cfg('notifyMaintenance', v)}
                           />
                           <Toggle
                              label="Dicas da IA no Dashboard"
                              desc="Exibe sugestões automáticas baseadas nos seus dados, como fretes abaixo do custo ou embarcadores com atraso."
                              checked={profile.config.showTips}
                              onChange={v => cfg('showTips', v)}
                           />
                        </div>
                     </Card>
                  </div>
               )}

               {/* ════════════════════════════ DADOS ════════════════════════════ */}
               {active === 'dados' && (
                  <div className="space-y-5 animate-in slide-in-from-bottom-3 duration-300">

                     <Card title="Seus dados em números">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           <Stat label="Viagens" value={trips.length} emoji="🚛" />
                           <Stat label="Veículos" value={vehicles.length} emoji="🚜" />
                           <Stat label="Motoristas" value={drivers.length} emoji="👤" />
                           <Stat label="Manutenções" value={maintenances.length} emoji="🔧" />
                        </div>
                     </Card>

                     <Card title="Backup dos dados" subtitle="Exporte todos os seus dados em um arquivo JSON. Guarde em lugar seguro.">
                        <div className="space-y-3">
                           <button
                              onClick={exportBackup}
                              className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all"
                           >
                              <Download className="w-4 h-4" /> Baixar backup (JSON)
                           </button>
                           <button
                              onClick={() => importRef.current?.click()}
                              className="w-full py-4 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all"
                           >
                              <Upload className="w-4 h-4" /> Restaurar de arquivo
                           </button>
                           <input type="file" ref={importRef} className="hidden" accept=".json" onChange={importBackup} />
                        </div>
                        <Tip>O backup inclui viagens, veículos, motoristas e embarcadores. Não inclui fotos e documentos.</Tip>
                     </Card>

                     <Card title="Zona de perigo" className="border-rose-500/20">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-white">Apagar todos os registros</p>
                              <p className="text-xs text-slate-500">Remove permanentemente todas as viagens e dados. Não pode ser desfeito.</p>
                           </div>
                           {isResetting ? (
                              <div className="flex gap-3 shrink-0">
                                 <button onClick={() => setIsResetting(false)} className="px-5 py-3 bg-slate-800 text-slate-400 rounded-xl text-xs font-black uppercase">Cancelar</button>
                                 <button onClick={() => { onResetData(); setIsResetting(false); }} className="px-5 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-rose-600/20">Confirmar</button>
                              </div>
                           ) : (
                              <button onClick={() => setIsResetting(true)} className="shrink-0 px-6 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                 Resetar tudo
                              </button>
                           )}
                        </div>
                     </Card>
                  </div>
               )}

            </main>
         </div>
      </div>
   );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Card: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className }) => (
   <div className={`bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-5 ${className || ''}`}>
      <div className="space-y-0.5">
         <h3 className="text-sm font-black text-white">{title}</h3>
         {subtitle && <p className="text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
      </div>
      {children}
   </div>
);

const Field: React.FC<{ label: string; icon?: any; value: string; onChange: (v: string) => void; placeholder?: string }> = ({ label, icon: Icon, value, onChange, placeholder }) => (
   <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
         {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />}
         <input
            type="text"
            value={value || ''}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3.5 text-sm text-white font-medium focus:border-emerald-500 outline-none transition-all placeholder-slate-700`}
         />
      </div>
   </div>
);

const NumberField: React.FC<{ label: string; value: number; onChange: (v: number) => void; unit: string; hint: string; example: string; step?: number }> = ({ label, value, onChange, unit, hint, example, step = 1 }) => {
   const [showInfo, setShowInfo] = useState(false);
   return (
      <div className="space-y-2">
         <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex-1">{label}</label>
            <button onClick={() => setShowInfo(p => !p)} className="text-slate-600 hover:text-emerald-500 transition-colors">
               <Info className="w-3.5 h-3.5" />
            </button>
         </div>
         <div className="relative">
            <input
               type="number"
               value={value}
               step={step}
               onChange={e => onChange(Number(e.target.value))}
               className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-14 py-3.5 text-sm text-white font-bold focus:border-emerald-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">{unit}</span>
         </div>
         {showInfo && (
            <div className="p-3 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-1">
               <p className="text-[10px] text-slate-400 leading-relaxed">{hint}</p>
               <p className="text-[10px] text-emerald-500 font-bold">{example}</p>
            </div>
         )}
      </div>
   );
};

const Toggle: React.FC<{ label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, desc, checked, onChange }) => (
   <label className="flex items-center justify-between cursor-pointer gap-4 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/60 hover:border-slate-700 transition-all group">
      <div className="space-y-0.5">
         <p className={`text-xs font-black ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</p>
         <p className="text-[10px] text-slate-600 leading-relaxed">{desc}</p>
      </div>
      <div className="relative shrink-0">
         <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
         <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
      </div>
   </label>
);

const ModuleCard: React.FC<{ emoji: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; tag?: string }> = ({ emoji, label, desc, checked, onChange, tag }) => (
   <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border transition-all ${checked ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'}`}>
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-xs font-black ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</p>
            {tag && <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{tag}</span>}
         </div>
         <p className="text-[10px] text-slate-600 leading-relaxed">{desc}</p>
      </div>
      <div className="relative shrink-0">
         <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
         <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
      </div>
   </label>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
   <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
      <span className="text-amber-500 text-sm shrink-0">💡</span>
      <p className="text-[11px] text-amber-400/80 leading-relaxed font-medium">{children}</p>
   </div>
);

const Stat: React.FC<{ label: string; value: number; emoji: string }> = ({ label, value, emoji }) => (
   <div className="bg-slate-950 rounded-2xl p-4 text-center space-y-1 border border-slate-800">
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
   </div>
);

export default Settings;
