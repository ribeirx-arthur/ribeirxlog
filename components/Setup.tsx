
import React, { useState, useRef } from 'react';
import {
  Truck,
  Users,
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Camera,
  Upload,
  AlertTriangle,
  Save
} from 'lucide-react';
import { Vehicle, Driver, Shipper, VehiclePropertyType, Buggy } from '../types';

interface SetupProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  buggies: Buggy[];
  onUpdateVehicles: (v: Vehicle[]) => void;
  onUpdateDrivers: (d: Driver[]) => void;
  onUpdateShippers: (s: Shipper[]) => void;
  onUpdateBuggies: (b: Buggy[]) => void;
  onDeleteVehicle: (id: string) => void;
  onDeleteDriver: (id: string) => void;
  onDeleteShipper: (id: string) => void;
  onDeleteBuggy: (id: string) => void;
  initialSubTab?: SetupTab;
}

type SetupTab = 'vehicles' | 'drivers' | 'shippers' | 'buggies';

const Setup: React.FC<SetupProps> = ({
  vehicles, drivers, shippers, buggies,
  onUpdateVehicles, onUpdateDrivers, onUpdateShippers, onUpdateBuggies,
  onDeleteVehicle, onDeleteDriver, onDeleteShipper, onDeleteBuggy,
  initialSubTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SetupTab>(initialSubTab || 'vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: SetupTab } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredVehicles = vehicles.filter(v => v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || v.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDrivers = drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.cpf.includes(searchTerm));
  const filteredShippers = shippers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cnpj.includes(searchTerm));
  const filteredBuggies = buggies.filter(b => b.plate.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
    } else {
      // Default initial states for new records
      const initialStates = {
        vehicles: { id: '', plate: '', name: '', brand: '', model: '', year: new Date().getFullYear(), type: VehiclePropertyType.PROPRIO, societySplitFactor: 100, totalKmAccumulated: 0, lastMaintenanceKm: 0 },
        drivers: { id: '', name: '', cpf: '', phone: '', cnh: '', cnhCategory: 'E', cnhValidity: '', status: 'Ativo' as const },
        shippers: { id: '', name: '', cnpj: '', avgPaymentDays: 15 },
        buggies: { id: '', plate: '', brand: '', model: '', axles: 3, tireType: 'dual' }
      };
      setEditingItem({ ...initialStates[activeSubTab as keyof typeof initialStates], id: Math.random().toString(36).substr(2, 9) });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeSubTab === 'vehicles') {
        const exists = vehicles.find(v => v.id === editingItem.id);
        await onUpdateVehicles(exists ? vehicles.map(v => v.id === editingItem.id ? editingItem : v) : [editingItem, ...vehicles]);
      } else if (activeSubTab === 'drivers') {
        const exists = drivers.find(d => d.id === editingItem.id);
        await onUpdateDrivers(exists ? drivers.map(d => d.id === editingItem.id ? editingItem : d) : [editingItem, ...drivers]);
      } else if (activeSubTab === 'shippers') {
        const exists = shippers.find(s => s.id === editingItem.id);
        await onUpdateShippers(exists ? shippers.map(s => s.id === editingItem.id ? editingItem : s) : [editingItem, ...shippers]);
      } else if (activeSubTab === 'buggies') {
        const exists = buggies.find(b => b.id === editingItem.id);
        await onUpdateBuggies(exists ? buggies.map(b => b.id === editingItem.id ? editingItem : b) : [editingItem, ...buggies]);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error in handleSave:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'vehicles') onDeleteVehicle(deleteConfirm.id);
    if (deleteConfirm.type === 'drivers') onDeleteDriver(deleteConfirm.id);
    if (deleteConfirm.type === 'shippers') onDeleteShipper(deleteConfirm.id);
    if (deleteConfirm.type === 'buggies') onDeleteBuggy(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fieldName = activeSubTab === 'shippers' ? 'logoUrl' : 'photoUrl';
        setEditingItem({ ...editingItem, [fieldName]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDriverStatus = (id: string) => {
    onUpdateDrivers(drivers.map(d => d.id === id ? { ...d, status: d.status === 'Ativo' ? 'Inativo' : 'Ativo' } : d));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Gestão de Cadastros</h2>
          <p className="text-slate-400 text-sm">Administre os ativos e parceiros da sua operação logística.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </header>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => { setActiveSubTab('vehicles'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'vehicles' ? 'bg-slate-800 text-emerald-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Truck className="w-4 h-4" />
          Frota
        </button>
        <button
          onClick={() => { setActiveSubTab('drivers'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'drivers' ? 'bg-slate-800 text-sky-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Users className="w-4 h-4" />
          Motoristas
        </button>
        <button
          onClick={() => { setActiveSubTab('shippers'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'shippers' ? 'bg-slate-800 text-rose-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Building2 className="w-4 h-4" />
          Transportadoras
        </button>
        <button
          onClick={() => { setActiveSubTab('buggies'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'buggies' ? 'bg-slate-800 text-amber-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Plus className="w-4 h-4" />
          Implementos / Buggy
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={`Buscar em ${activeSubTab === 'vehicles' ? 'veículos' : activeSubTab === 'drivers' ? 'motoristas' : 'parceiros'}...`}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeSubTab === 'vehicles' && filteredVehicles.map(v => (
          <div key={v.id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-500 overflow-hidden border border-slate-700">
                {v.photoUrl ? (
                  <img src={v.photoUrl} alt={v.plate} className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-7 h-7" />
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.type === VehiclePropertyType.PROPRIO ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {v.type}
              </span>
            </div>
            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{v.plate}</h4>
              <p className="text-slate-500 text-xs font-bold uppercase">{v.brand} {v.model} ({v.year})</p>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-700/50 text-[10px]">
              <div>
                <p className="text-slate-500 font-black uppercase tracking-tighter">KM Acumulado</p>
                <p className="text-white font-black text-sm">{v.totalKmAccumulated?.toLocaleString()} KM</p>
              </div>
              <div>
                <p className="text-slate-500 font-black uppercase tracking-tighter">Partilha</p>
                <p className="text-white font-black text-sm">{v.societySplitFactor}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleOpenModal(v)}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
              >
                Editar
              </button>
              <button
                onClick={() => setDeleteConfirm({ id: v.id, type: 'vehicles' })}
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeSubTab === 'drivers' && filteredDrivers.map(d => (
          <div key={d.id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="relative w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 font-black overflow-hidden border border-slate-700">
                {d.photoUrl ? (
                  <img src={d.photoUrl} alt={d.name} className="w-full h-full object-cover" />
                ) : (
                  d.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                )}
              </div>
              <button
                onClick={() => toggleDriverStatus(d.id)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${d.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}
              >
                {d.status === 'Ativo' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {d.status}
              </button>
            </div>
            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors">{d.name}</h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">CPF: {d.cpf}</p>
            </div>
            <div className="space-y-3 py-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <CreditCard className="w-4 h-4 text-slate-500" />
                <span className="font-medium">PIX: {d.pixKey || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="font-medium">CNH {d.cnhCategory} • Val: {d.cnhValidity ? new Date(d.cnhValidity).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleOpenModal(d)}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
              >
                Perfil Completo
              </button>
              <button
                onClick={() => setDeleteConfirm({ id: d.id, type: 'drivers' })}
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeSubTab === 'shippers' && filteredShippers.map(s => (
          <div key={s.id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="relative w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 overflow-hidden border border-slate-700">
                {s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-8 h-8" />
                )}
              </div>
              <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {s.avgPaymentDays} dias p/ pagto
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-white group-hover:text-rose-400 transition-colors">{s.name}</h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">CNPJ: {s.cnpj}</p>
            </div>
            <div className="space-y-3 py-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="font-medium truncate">{s.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <Phone className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{s.phone || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleOpenModal(s)}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
              >
                Editar Dados
              </button>
              <button
                onClick={() => setDeleteConfirm({ id: s.id, type: 'shippers' })}
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {activeSubTab === 'buggies' && filteredBuggies.map(b => (
          <div key={b.id} className="bg-slate-800/40 border border-slate-700/50 rounded-[2rem] p-6 hover:bg-slate-800/60 transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="relative w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 overflow-hidden border border-slate-700 font-black">
                {b.plate.slice(0, 2)}
              </div>
              <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {b.axles} Eixos
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <h4 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors uppercase">{b.plate}</h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">{b.brand} {b.model}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-700/50 text-[10px]">
              <div>
                <p className="text-slate-500 font-black uppercase tracking-tighter">Tipo Rodagem</p>
                <p className="text-white font-black text-sm uppercase">{b.tireType === 'dual' ? 'Dupla' : 'Simples'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleOpenModal(b)}
                className="flex-1 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all"
              >
                Editar
              </button>
              <button
                onClick={() => setDeleteConfirm({ id: b.id, type: 'buggies' })}
                className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Modal for Add/Edit */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-500">
            <header className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">{vehicles.find(v => v.id === editingItem.id) || drivers.find(d => d.id === editingItem.id) || shippers.find(s => s.id === editingItem.id) ? 'Editar' : 'Novo'} {activeSubTab === 'vehicles' ? 'Veículo' : activeSubTab === 'drivers' ? 'Motorista' : 'Parceiro'}</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Preencha todos os campos obrigatórios</p>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-slate-800 rounded-2xl transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Image Upload Area */}
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-3xl group hover:border-emerald-500/30 transition-all">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-32 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-600 cursor-pointer overflow-hidden border border-slate-800 hover:scale-105 transition-transform"
                >
                  {(editingItem.photoUrl || editingItem.logoUrl) ? (
                    <img src={editingItem.photoUrl || editingItem.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 group-hover:text-emerald-500 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Clique para {(editingItem.photoUrl || editingItem.logoUrl) ? 'Trocar' : 'Fazer Upload'} de Foto</p>
              </div>

              {/* Dynamic Forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeSubTab === 'vehicles' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Placa</label>
                      <input type="text" value={editingItem.plate} onChange={e => setEditingItem({ ...editingItem, plate: e.target.value.toUpperCase() })} placeholder="AAA-0000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Apelido/Nome</label>
                      <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Ex: Scania Azul" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Marca</label>
                      <input type="text" value={editingItem.brand} onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })} placeholder="Ex: Scania" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Modelo</label>
                      <input type="text" value={editingItem.model} onChange={e => setEditingItem({ ...editingItem, model: e.target.value })} placeholder="Ex: R450" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo Propriedade</label>
                      <select value={editingItem.type} onChange={e => setEditingItem({ ...editingItem, type: e.target.value as VehiclePropertyType })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none">
                        <option value={VehiclePropertyType.PROPRIO}>Próprio</option>
                        <option value={VehiclePropertyType.SOCIEDADE}>Sociedade</option>
                      </select>
                    </div>
                    {editingItem.type === VehiclePropertyType.SOCIEDADE && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Taxa Partilha (%)</label>
                        <input type="number" value={editingItem.societySplitFactor} onChange={e => setEditingItem({ ...editingItem, societySplitFactor: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                      </div>
                    )}
                  </>
                )}

                {activeSubTab === 'drivers' && (
                  <>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome Completo</label>
                      <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Nome do Motorista" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CPF</label>
                      <input type="text" value={editingItem.cpf} onChange={e => setEditingItem({ ...editingItem, cpf: e.target.value })} placeholder="000.000.000-00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Telefone/WhatsApp</label>
                      <input type="text" value={editingItem.phone} onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })} placeholder="(00) 00000-0000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Chave PIX</label>
                      <input type="text" value={editingItem.pixKey} onChange={e => setEditingItem({ ...editingItem, pixKey: e.target.value })} placeholder="CPF, E-mail ou Celular" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CNH (Categoria)</label>
                      <input type="text" value={editingItem.cnhCategory} onChange={e => setEditingItem({ ...editingItem, cnhCategory: e.target.value })} placeholder="E" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Validade CNH</label>
                      <input
                        type="date"
                        value={editingItem.cnhValidity}
                        onChange={e => setEditingItem({ ...editingItem, cnhValidity: e.target.value })}
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-3.5 text-sm text-white outline-none transition-all
                          ${editingItem.cnhValidity && new Date(editingItem.cnhValidity).getTime() < new Date().getTime() ? 'border-rose-500' :
                            editingItem.cnhValidity && new Date(editingItem.cnhValidity).getTime() < new Date().getTime() + (30 * 24 * 60 * 60 * 1000) ? 'border-amber-500' :
                              'border-slate-800 focus:border-emerald-500'}`}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">URL da Foto da CNH (Opcional)</label>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          placeholder="https://exemplo.com/cnh.jpg"
                          value={editingItem.cnhPhotoUrl || ''}
                          onChange={e => setEditingItem({ ...editingItem, cnhPhotoUrl: e.target.value })}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none"
                        />
                        {editingItem.cnhPhotoUrl && (
                          <div className="w-12 h-12 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex-shrink-0">
                            <img src={editingItem.cnhPhotoUrl} alt="CNH" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeSubTab === 'shippers' && (
                  <>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Razão Social / Nome Fantasia</label>
                      <input type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Transportadora Parceira" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CNPJ</label>
                      <input type="text" value={editingItem.cnpj} onChange={e => setEditingItem({ ...editingItem, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Dias p/ Pagamento</label>
                      <input type="number" value={editingItem.avgPaymentDays} onChange={e => setEditingItem({ ...editingItem, avgPaymentDays: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">E-mail Financeiro</label>
                      <input type="email" value={editingItem.email} onChange={e => setEditingItem({ ...editingItem, email: e.target.value })} placeholder="financeiro@empresa.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Telefone</label>
                      <input type="text" value={editingItem.phone} onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })} placeholder="(00) 0000-0000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                  </>
                )}

                {activeSubTab === 'buggies' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Placa do Implemento</label>
                      <input type="text" value={editingItem.plate} onChange={e => setEditingItem({ ...editingItem, plate: e.target.value.toUpperCase() })} placeholder="AAA-0000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Marca</label>
                      <input type="text" value={editingItem.brand} onChange={e => setEditingItem({ ...editingItem, brand: e.target.value })} placeholder="Ex: Randon" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Modelo</label>
                      <input type="text" value={editingItem.model} onChange={e => setEditingItem({ ...editingItem, model: e.target.value })} placeholder="Ex: Graneleira" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Quantidade de Eixos</label>
                      <select value={editingItem.axles} onChange={e => setEditingItem({ ...editingItem, axles: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none">
                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Eixos</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Tipo de Rodagem</label>
                      <select value={editingItem.tireType} onChange={e => setEditingItem({ ...editingItem, tireType: e.target.value as 'single' | 'dual' })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:border-emerald-500 outline-none">
                        <option value="dual">Rodado Duplo</option>
                        <option value="single">Rodado Simples</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <footer className="p-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
              <button
                onClick={handleSave}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" />
                Salvar Registro
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-[2.5rem] w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Excluir Registro?</h3>
              <p className="text-slate-400 text-sm">
                Você está prestes a apagar este item permanentemente. Isso pode afetar históricos de viagens vinculados.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setDeleteConfirm(null)} className="py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest">Cancelar</button>
              <button onClick={handleDelete} className="py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setup;
