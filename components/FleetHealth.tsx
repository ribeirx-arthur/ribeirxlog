
import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  AlertTriangle, 
  Droplet, 
  CircleDot,
  Plus,
  History,
  DollarSign,
  Wrench,
  ArrowLeft,
  Save,
  ShieldCheck,
  Activity,
  BarChart3,
  Download,
  FileText,
  Zap,
  Edit3,
  X,
  Settings2
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, MaintenanceType, MaintenanceThresholds } from '../types';

interface FleetHealthProps {
  vehicles: Vehicle[];
  maintenances: MaintenanceRecord[];
  onAddMaintenance: (record: MaintenanceRecord) => void;
  onUpdateMaintenance: (record: MaintenanceRecord) => void;
  onUpdateVehicleThresholds: (vehicleId: string, thresholds: MaintenanceThresholds) => void;
}

const FleetHealth: React.FC<FleetHealthProps> = ({ 
  vehicles, 
  maintenances, 
  onAddMaintenance, 
  onUpdateMaintenance,
  onUpdateVehicleThresholds
}) => {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'report' | 'config'>('list');
  const [selectedAsset, setSelectedAsset] = useState<Vehicle | null>(null);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [filterPlate, setFilterPlate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Preventiva',
    description: '',
    totalCost: 0,
    provider: ''
  });

  const [tempThresholds, setTempThresholds] = useState<MaintenanceThresholds>({
    oilChangeKm: 10000,
    tireChangeKm: 40000,
    brakeCheckKm: 15000,
    engineRevKm: 100000
  });

  const handleOpenReport = (v: Vehicle) => {
    setSelectedAsset(v);
    setView('report');
  };

  const handleOpenConfig = (v: Vehicle) => {
    setSelectedAsset(v);
    setTempThresholds(v.thresholds || {
      oilChangeKm: 10000,
      tireChangeKm: 40000,
      brakeCheckKm: 15000,
      engineRevKm: 100000
    });
    setView('config');
  };

  const handleSaveConfig = () => {
    if (selectedAsset) {
      onUpdateVehicleThresholds(selectedAsset.id, tempThresholds);
      setView('list');
      alert("Configurações de manutenção atualizadas!");
    }
  };

  const filteredHistory = useMemo(() => {
    return maintenances.filter(m => {
      const v = vehicles.find(veh => veh.id === m.vehicleId);
      return v?.plate.toLowerCase().includes(filterPlate.toLowerCase());
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenances, vehicles, filterPlate]);

  const handleSave = () => {
    if (!newRecord.vehicleId || !newRecord.description || !newRecord.totalCost) {
      alert("Por favor, preencha os campos obrigatórios.");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === newRecord.vehicleId);

    if (view === 'edit' && editingRecord) {
      onUpdateMaintenance({ ...editingRecord, ...newRecord } as MaintenanceRecord);
    } else {
      const record: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        vehicleId: newRecord.vehicleId!,
        date: newRecord.date!,
        kmAtMaintenance: selectedVehicle?.totalKmAccumulated || 0,
        type: newRecord.type as MaintenanceType,
        description: newRecord.description!,
        totalCost: Number(newRecord.totalCost),
        provider: newRecord.provider
      };
      onAddMaintenance(record);
    }

    setView('list');
    resetForm();
  };

  const resetForm = () => {
    setNewRecord({
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Preventiva',
      description: '',
      totalCost: 0,
      provider: ''
    });
    setEditingRecord(null);
  };

  const handleEditClick = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setNewRecord({ ...record });
    setView('edit');
  };

  // Helper para cálculo de saúde baseado em thresholds dinâmicos
  const getAssetHealth = (v: Vehicle) => {
    const kmSinceLast = v.totalKmAccumulated - v.lastMaintenanceKm;
    const t = v.thresholds || { oilChangeKm: 10000, tireChangeKm: 40000, brakeCheckKm: 15000, engineRevKm: 100000 };
    
    const scores = [
      Math.max(0, 100 - (kmSinceLast / t.oilChangeKm) * 100),
      Math.max(0, 100 - (v.totalKmAccumulated % t.tireChangeKm / t.tireChangeKm) * 100),
      Math.max(0, 100 - (kmSinceLast / t.brakeCheckKm) * 100),
      Math.max(0, 100 - (v.totalKmAccumulated % t.engineRevKm / t.engineRevKm) * 100)
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  if (view === 'config' && selectedAsset) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-24">
         <header className="flex items-center gap-6 border-b border-slate-800 pb-8">
            <button onClick={() => setView('list')} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
               <h2 className="text-4xl font-black text-white tracking-tighter">Variáveis de Manutenção</h2>
               <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Ativo: {selectedAsset.plate}</p>
            </div>
         </header>

         <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <ThresholdInput 
                  label="Intervalo Troca de Óleo (KM)" 
                  value={tempThresholds.oilChangeKm} 
                  onChange={v => setTempThresholds({...tempThresholds, oilChangeKm: v})} 
                  icon={Droplet} 
               />
               <ThresholdInput 
                  label="Vida Útil Pneus (KM)" 
                  value={tempThresholds.tireChangeKm} 
                  onChange={v => setTempThresholds({...tempThresholds, tireChangeKm: v})} 
                  icon={CircleDot} 
               />
               <ThresholdInput 
                  label="Revisão de Freios (KM)" 
                  value={tempThresholds.brakeCheckKm} 
                  onChange={v => setTempThresholds({...tempThresholds, brakeCheckKm: v})} 
                  icon={Zap} 
               />
               <ThresholdInput 
                  label="Revisão Geral Motor (KM)" 
                  value={tempThresholds.engineRevKm} 
                  onChange={v => setTempThresholds({...tempThresholds, engineRevKm: v})} 
                  icon={Activity} 
               />
            </div>
            
            <button 
               onClick={handleSaveConfig}
               className="w-full py-6 bg-sky-500 hover:bg-sky-600 text-sky-950 font-black rounded-3xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
               <Save className="w-5 h-5" /> Atualizar Parâmetros de Frota
            </button>
         </section>
      </div>
    );
  }

  if (view === 'report' && selectedAsset) {
    const kmSinceLast = selectedAsset.totalKmAccumulated - selectedAsset.lastMaintenanceKm;
    const t = selectedAsset.thresholds || { oilChangeKm: 10000, tireChangeKm: 40000, brakeCheckKm: 15000, engineRevKm: 100000 };
    
    const components = [
      { name: 'Óleo & Filtros', life: Math.max(0, 100 - (kmSinceLast / t.oilChangeKm) * 100), icon: Droplet, limit: `${t.oilChangeKm.toLocaleString()} KM`, color: 'sky' },
      { name: 'Pneus (Tração)', life: Math.max(0, 100 - (selectedAsset.totalKmAccumulated % t.tireChangeKm / t.tireChangeKm) * 100), icon: CircleDot, limit: `${t.tireChangeKm.toLocaleString()} KM`, color: 'amber' },
      { name: 'Lonas de Freio', life: Math.max(0, 100 - (kmSinceLast / t.brakeCheckKm) * 100), icon: Zap, limit: `${t.brakeCheckKm.toLocaleString()} KM`, color: 'rose' },
      { name: 'Revisão Motor', life: Math.max(0, 100 - (selectedAsset.totalKmAccumulated % t.engineRevKm / t.engineRevKm) * 100), icon: Activity, limit: `${t.engineRevKm.toLocaleString()} KM`, color: 'indigo' },
    ];

    const healthScore = Math.round(components.reduce((acc, c) => acc + c.life, 0) / components.length);

    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <button onClick={() => setView('list')} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div>
                  <h2 className="text-4xl font-black text-white tracking-tighter">Relatório de Ativo</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Análise Técnica: {selectedAsset.plate}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => handleOpenConfig(selectedAsset)} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-sky-500 transition-all">
                  <Settings2 className="w-6 h-6" />
               </button>
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-[2rem] flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Odômetro Geral</p>
                     <p className="text-xl font-black text-white">{selectedAsset.totalKmAccumulated.toLocaleString()} KM</p>
                  </div>
                  <div className="w-px h-10 bg-slate-800" />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${healthScore > 70 ? 'bg-emerald-500/10 text-emerald-500' : healthScore > 30 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                     {healthScore}%
                  </div>
               </div>
            </div>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
               {components.map((c, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 group hover:border-emerald-500/30 transition-all">
                     <div className="flex justify-between items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.color === 'sky' ? 'text-sky-500 bg-sky-500/10' : c.color === 'amber' ? 'text-amber-500 bg-amber-500/10' : c.color === 'rose' ? 'text-rose-500 bg-rose-500/10' : 'text-indigo-500 bg-indigo-500/10'}`}>
                           <c.icon className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ciclo: {c.limit}</span>
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-white">{c.name}</h4>
                        <div className="flex justify-between items-end mt-4 mb-2">
                           <p className={`text-3xl font-black ${c.life < 20 ? 'text-rose-500' : 'text-white'}`}>{Math.round(c.life)}%</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">Vida Útil</p>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${c.life < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${c.life}%` }} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="space-y-6">
               <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                     <ShieldCheck className="w-32 h-32" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-4">Parecer da Frota</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-6 font-medium">
                     {healthScore > 80 
                       ? 'Este ativo está em condições impecáveis. Nenhuma intervenção de alto custo prevista para os próximos 5.000 km.'
                       : healthScore > 40
                       ? 'Atenção necessária em fluídos. Recomenda-se agendamento para troca de óleo nos próximos 15 dias.'
                       : 'CRÍTICO: Veículo requer parada imediata para revisão de sistemas de segurança e rodagem.'}
                  </p>
                  <button className="w-full py-4 bg-white text-indigo-600 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">
                     Agendar Revisão
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-12 animate-in fade-in duration-500 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Saúde da Frota</h2>
            <p className="text-slate-400 text-sm">Monitoramento em tempo real de desgaste e intervenções.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setView('add'); }}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            Nova Manutenção
          </button>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {vehicles.map(v => {
            const healthScore = getAssetHealth(v);
            const kmSinceLast = v.totalKmAccumulated - v.lastMaintenanceKm;
            const threshold = v.thresholds?.oilChangeKm || 10000;

            return (
              <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Truck className="w-40 h-40 -mr-10 -mt-10" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-5">
                     <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 ${healthScore < 20 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-800 border-slate-700 text-emerald-500'}`}>
                        <Truck className="w-8 h-8" />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-white">{v.plate}</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">{v.name}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenConfig(v)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                       <Settings2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenReport(v)} className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:border-emerald-500 transition-all">
                      <BarChart3 className="w-3 h-3 text-emerald-500" /> Ver Relatório
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saúde Ativa</p>
                    </div>
                    <div className="flex items-end justify-between">
                       <p className={`text-2xl font-black ${healthScore < 20 ? 'text-rose-500' : 'text-white'}`}>{healthScore}%</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{Math.max(0, threshold - kmSinceLast).toLocaleString()} KM RESTANTES</p>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${healthScore < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${healthScore}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico de Oficina</p>
                    </div>
                    <div className="flex items-end justify-between">
                       <p className="text-2xl font-black text-white">R$ {maintenances.filter(m => m.vehicleId === v.id).reduce((acc, curr) => acc + curr.totalCost, 0).toLocaleString()}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">GASTO TOTAL</p>
                    </div>
                    <div className="flex gap-1">
                       {maintenances.filter(m => m.vehicleId === v.id).slice(0, 5).map((m, i) => (
                         <div key={i} className="w-2 h-2 rounded-full bg-indigo-500" title={m.date} />
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <History className="text-emerald-500 w-6 h-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Histórico Cronológico</h3>
           </div>

           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ativo / Data</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serviço</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredHistory.map(m => {
                        const v = vehicles.find(veh => veh.id === m.vehicleId);
                        return (
                          <tr key={m.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-6">
                               <p className="text-white font-black">{v?.plate}</p>
                               <p className="text-[10px] text-slate-500 font-bold">{new Date(m.date).toLocaleDateString()}</p>
                            </td>
                            <td className="px-8 py-6 max-w-md">
                               <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-1">"{m.description}"</p>
                               <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${m.type === 'Preventiva' ? 'bg-sky-500/10 text-sky-500' : 'bg-rose-500/10 text-rose-500'}`}>{m.type}</span>
                            </td>
                            <td className="px-8 py-6">
                               <p className="text-sm font-black text-white">R$ {m.totalCost.toLocaleString()}</p>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button 
                                  onClick={() => handleEditClick(m)}
                                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Edit3 className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex items-center gap-6 border-b border-slate-800 pb-8">
           <button onClick={() => { setView('list'); resetForm(); }} className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
             <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {view === 'edit' ? 'Editar Manutenção' : 'Lançar Manutenção'}
              </h2>
              <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Atualização de Vida Útil do Ativo</p>
           </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-slate-900 border-2 border-emerald-500/20 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">1. Detalhes da Oficina</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Selecione o Veículo</label>
                <select 
                   value={newRecord.vehicleId} 
                   onChange={e => setNewRecord({...newRecord, vehicleId: e.target.value})}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500 outline-none appearance-none font-bold"
                >
                  <option value="">Escolher...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data</label>
                <input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none font-bold" />
              </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Descrição do Serviço</label>
                <textarea 
                  rows={4}
                  placeholder="Ex: Troca de filtros, pastilhas e óleo do motor..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-sm text-slate-200 focus:border-emerald-500 outline-none resize-none font-medium shadow-inner"
                  value={newRecord.description}
                  onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                />
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Valor Total (R$)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                     <input type="number" placeholder="0,00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-black text-lg focus:border-emerald-500 outline-none" value={newRecord.totalCost || ''} onChange={e => setNewRecord({...newRecord, totalCost: Number(e.target.value)})} />
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Tipo</label>
                  <div className="flex gap-4">
                    {(['Preventiva', 'Corretiva'] as MaintenanceType[]).map(type => (
                      <button 
                        key={type}
                        onClick={() => setNewRecord({...newRecord, type})}
                        className={`flex-1 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${newRecord.type === type ? 'bg-emerald-500 border-emerald-400 text-emerald-950 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </section>

          <button onClick={handleSave} className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-4 text-lg uppercase tracking-widest">
            <Save className="w-6 h-6" /> {view === 'edit' ? 'Salvar Alterações' : 'Finalizar Registro'}
          </button>
        </div>

        <div className="lg:col-span-4 sticky top-24 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShieldCheck className="w-32 h-32" />
              </div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Resumo Financeiro</h3>
              <div className="space-y-4 relative z-10">
                  <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800 flex justify-between items-center group">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custo</span>
                    <span className="text-2xl font-black text-white">R$ {(newRecord.totalCost || 0).toLocaleString()}</span>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ThresholdInput = ({ label, value, onChange, icon: Icon }: any) => (
   <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
         <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
         <input 
            type="number" 
            value={value} 
            onChange={e => onChange(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:border-sky-500 outline-none"
         />
      </div>
   </div>
);

export default FleetHealth;
