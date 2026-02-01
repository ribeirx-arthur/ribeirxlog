
import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Save,
  Calendar,
  Truck,
  User,
  Building2,
  Wallet,
  Droplets,
  Clock,
  ChevronRight,
  Gauge,
  AlertCircle,
  Hash,
  ArrowRightLeft,
  Fuel,
  Coins,
  Activity,
  ExternalLink,
  History
} from 'lucide-react';
import { Vehicle, Driver, Shipper, Trip, UserProfile, PaymentStatus } from '../types';

interface NewTripProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  onSave: (trip: Trip) => void;
  profile: UserProfile;
  trips: Trip[];
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const NewTrip: React.FC<NewTripProps> = ({ vehicles, drivers, shippers, onSave, profile, trips }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    vehicleId: '',
    driverId: '',
    shipperId: '',
    freteSeco: 0,
    diarias: 0,
    adiantamento: 0,
    combustivel: 0,
    litersDiesel: 0,
    outrasDespesas: 0,
    departureDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    receiptDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    status: 'Pendente' as PaymentStatus,
    totalKm: 0
  });

  const suggestedTrip = trips.slice().reverse().find(t =>
    t.destination.toLowerCase() === formData.destination.toLowerCase() &&
    t.shipperId === formData.shipperId &&
    formData.destination !== '' &&
    formData.shipperId !== ''
  );

  const handleQuickFill = () => {
    if (suggestedTrip) {
      setFormData({
        ...formData,
        freteSeco: suggestedTrip.freteSeco,
        diarias: suggestedTrip.diarias,
        combustivel: suggestedTrip.combustivel,
        litersDiesel: suggestedTrip.litersDiesel,
        outrasDespesas: suggestedTrip.outrasDespesas,
        totalKm: suggestedTrip.totalKm,
        origin: suggestedTrip.origin || formData.origin
      });
    }
  };

  const isSimple = profile.config.appMode === 'simple';
  const isIntermediate = profile.config.appMode === 'intermediate';
  const isAdvanced = !isSimple && !isIntermediate;

  const handleSave = () => {
    const isSimple = profile.config.appMode === 'simple';
    const isMissingCrucial = !formData.origin || !formData.destination ||
      (!isSimple && (!formData.vehicleId || !formData.driverId || !formData.shipperId));

    if (isMissingCrucial) {
      alert("Campos Obrigatórios: Origem, Destino" + (isSimple ? "." : ", Veículo, Motorista e Transportadora."));
      return;
    }

    const newTrip: Trip = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      // Default Generic IDs in Simple Mode if not set
      vehicleId: formData.vehicleId || 'generic-vehicle',
      driverId: formData.driverId || 'generic-driver',
      shipperId: formData.shipperId || 'generic-shipper',
    } as Trip;
    onSave(newTrip);
  };

  const estimatedProfit = (formData.freteSeco + formData.diarias) - (formData.combustivel + formData.outrasDespesas);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-36">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Novo Lançamento</h2>
          <p className="text-slate-400 text-sm mt-1">Gestão integral de frete, consumo e rentabilidade operacional.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Motor de Cálculo Ativo</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">

          {/* 1. ITINERÁRIO E LOGÍSTICA */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5 text-sky-500" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">1. Rota e Itinerário</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Origem do Carregamento</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Cidade - UF"
                    value={formData.origin}
                    list="origins-list"
                    onChange={e => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-sky-500 outline-none transition-all font-bold"
                  />
                  <datalist id="origins-list">
                    {Array.from(new Set(trips.map(t => t.origin).filter(Boolean))).map(o => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Destino da Entrega</label>
                <div className="relative">
                  <Navigation className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="text"
                    placeholder="Cidade - UF"
                    value={formData.destination}
                    list="destinations-list"
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white focus:border-emerald-500 outline-none transition-all font-bold"
                  />
                  <datalist id="destinations-list">
                    {Array.from(new Set(trips.map(t => t.destination).filter(Boolean))).map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {suggestedTrip && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <History className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Rota Recorrente Detectada</p>
                    <p className="text-xs text-slate-400 font-medium">Encontramos dados de uma viagem anterior para este destino.</p>
                  </div>
                </div>
                <button
                  onClick={handleQuickFill}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Preencher dados automaticamente
                </button>
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data Saída</label>
                <input type="date" value={formData.departureDate} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Retorno Previsto</label>
                <input type="date" value={formData.returnDate} onChange={e => setFormData({ ...formData, returnDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-sky-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Data Recebimento</label>
                <input type="date" value={formData.receiptDate} onChange={e => setFormData({ ...formData, receiptDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-500 font-bold outline-none focus:border-emerald-500" />
              </div>
            </div>
          </section>

          {/* 2. ALOCAÇÃO DE RECURSOS - Hidden in Simple Mode */}
          {!isSimple && (
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">2. Alocação de Recursos</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Veículo</label>
                  <select value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-emerald-500 appearance-none">
                    <option value="">Selecionar...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Motorista</label>
                  <select value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-emerald-500 appearance-none">
                    <option value="">Selecionar...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Transportadora</label>
                  <select value={formData.shipperId} onChange={e => setFormData({ ...formData, shipperId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-emerald-500 appearance-none">
                    <option value="">Selecionar...</option>
                    {shippers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">Status Financeiro</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as PaymentStatus })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-emerald-500 appearance-none">
                    <option value="Pendente">Aguardando Recebimento</option>
                    <option value="Parcial">Recebido Parcial</option>
                    <option value="Pago">Totalmente Liquidado</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* 3. FINANCEIRO E TELEMETRIA */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">3. Financeiro & Telemetria</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Receitas (R$)</h4>
                <div className="space-y-3">
                  <input type="number" placeholder="Frete Seco" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none" value={formData.freteSeco || ''} onChange={e => setFormData({ ...formData, freteSeco: Number(e.target.value) })} />
                  <input type="number" placeholder="Diárias" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none" value={formData.diarias || ''} onChange={e => setFormData({ ...formData, diarias: Number(e.target.value) })} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Custos & Consumo</h4>
                <div className="space-y-3">
                  <input type="number" placeholder="Combustível (R$)" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sky-400 font-bold outline-none" value={formData.combustivel || ''} onChange={e => setFormData({ ...formData, combustivel: Number(e.target.value) })} />
                  <input type="number" placeholder="Litros Diesel" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none" value={formData.litersDiesel || ''} onChange={e => setFormData({ ...formData, litersDiesel: Number(e.target.value) })} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestão de Fluxo</h4>
                <div className="space-y-3">
                  <input type="number" placeholder="Adiantamento" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-rose-500 font-bold outline-none" value={formData.adiantamento || ''} onChange={e => setFormData({ ...formData, adiantamento: Number(e.target.value) })} />
                  <input type="number" placeholder="Outras Despesas" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-bold outline-none" value={formData.outrasDespesas || ''} onChange={e => setFormData({ ...formData, outrasDespesas: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="max-w-md space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Distância Total (KM)</label>
                  <a
                    href="https://qualp.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 hover:text-emerald-400 transition-colors bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/20"
                  >
                    Calcular Rota (QualP) <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="relative">
                  <Gauge className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input type="number" placeholder="KM Total Rodado" className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-white font-black text-xl outline-none focus:border-emerald-500" value={formData.totalKm || ''} onChange={e => setFormData({ ...formData, totalKm: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full py-7 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-[2rem] shadow-2xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-4 text-xl uppercase tracking-[0.1em] relative z-[10]"
            >
              <Save className="w-7 h-7" />
              Finalizar Lançamento
            </button>
          </div>
        </div>

        {/* SIDEBAR: BI PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 lg:sticky lg:top-24 shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Activity className="w-48 h-48" />
            </div>

            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-800 pb-4">Prévia do Resultado</h3>

            <div className="space-y-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lucro Estimado</p>
                <p className={`text-4xl font-black tracking-tighter ${estimatedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  R$ {estimatedProfit.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Faturamento</p>
                  <p className="text-sm font-black text-white">R$ {(formData.freteSeco + formData.diarias).toLocaleString()}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Custos Totais</p>
                  <p className="text-sm font-black text-rose-500">R$ {(formData.combustivel + formData.outrasDespesas).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Itinerário</p>
                      <p className="text-[11px] font-bold text-slate-300">{formData.origin || '...'} <span className="text-emerald-500 mx-1">→</span> {formData.destination || '...'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-500">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Eficiência</p>
                      <p className="text-[11px] font-bold text-slate-300">R$ {(formData.totalKm > 0 ? (estimatedProfit / formData.totalKm).toFixed(2) : '0.00')} / KM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTrip;
