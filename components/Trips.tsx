
import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Trash2,
  MapPin,
  Truck as TruckIcon,
  User as UserIcon,
  Building2,
  ArrowUpDown,
  TrendingUp,
  Calendar as CalendarIcon,
  ChevronDown,
  Coins,
  AlertTriangle,
  Loader2,
  Edit3,
  Save,
  Navigation,
  Gauge,
  Droplets,
  Wallet,
  ExternalLink,
  FolderOpen,
  Plus,
  MessageCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Trip, Vehicle, Driver, Shipper, UserProfile, PaymentStatus, TripProof } from '../types';
import { calculateTripFinance } from '../services/finance';
import { generateTripReceipt, generateMonthlyReport } from '../services/pdfGenerator';

interface TripsProps {
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  onUpdateTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  profile: UserProfile;
}

type SortOption = 'recent' | 'profit' | 'gross';
type StatusFilter = 'all' | 'pending' | 'paid';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const Trips: React.FC<TripsProps> = ({ trips, setTrips, onUpdateTrip, onDeleteTrip, vehicles, drivers, shippers, profile }) => {
  const isAdmin = [
    'arthur@ribeirxlog.com',
    'arthur.ribeirx@gmail.com',
    'arthur.riberix@gmail.com',
    'arthurpsantos01@gmail.com',
    'arthur_ribeiro09@outlook.com'
  ].includes(profile.email?.trim().toLowerCase() || '');
  const isFree = profile.payment_status !== 'paid' && !isAdmin;

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [tripToDeleteId, setTripToDeleteId] = useState<string | null>(null);
  const [viewingFilesTripId, setViewingFilesTripId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedTrips = useMemo(() => {
    let result = trips.filter(t => {
      const vehicle = vehicles.find(v => v.id === t.vehicleId);
      const shipper = shippers.find(s => s.id === t.shipperId);
      const matchesSearch =
        (vehicle?.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipper?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending' && t.status === 'Pendente') ||
        (statusFilter === 'paid' && t.status === 'Pago');

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'recent') {
        const dateA = a.departureDate || '';
        const dateB = b.departureDate || '';
        return dateB.localeCompare(dateA);
      }
      const vA = vehicles.find(v => v.id === a.vehicleId);
      const dA = drivers.find(d => d.id === a.driverId);
      const vB = vehicles.find(v => v.id === b.vehicleId);
      const dB = drivers.find(d => d.id === b.driverId);
      if (!vA || !dA || !vB || !dB) return 0;
      const finA = calculateTripFinance(a, vA, dA, profile);
      const finB = calculateTripFinance(b, vB, dB, profile);
      if (sortBy === 'profit') return finB.lucroLiquidoReal - finA.lucroLiquidoReal;
      if (sortBy === 'gross') return finB.totalBruto - finA.totalBruto;
      return 0;
    });

    return result;
  }, [trips, searchTerm, statusFilter, sortBy, vehicles, drivers, profile]);

  const statsSummary = useMemo(() => {
    return filteredAndSortedTrips.reduce((acc, t) => {
      const v = vehicles.find(veh => veh.id === t.vehicleId);
      const d = drivers.find(drv => drv.id === t.driverId);
      if (v && d) {
        const fin = calculateTripFinance(t, v, d, profile);
        acc.profit += fin.lucroLiquidoReal;
        acc.gross += fin.totalBruto;
      }
      return acc;
    }, { profit: 0, gross: 0 });
  }, [filteredAndSortedTrips, vehicles, drivers, profile]);

  const handleUpdate = () => {
    if (isFree) {
      alert("⚠️ EDIÇÃO BLOQUEADA\n\nUsuários grátis não podem alterar dados de viagens.");
      return;
    }
    if (editingTrip) {
      // Automação WhatsApp ao finalizar
      const oldTrip = trips.find(t => t.id === editingTrip.id);
      if (profile.config.autoSendWhatsApp &&
        editingTrip.transitStatus === 'Finalizado' &&
        oldTrip?.transitStatus !== 'Finalizado') {

        const vehicle = vehicles.find(v => v.id === editingTrip.vehicleId);
        const driver = drivers.find(d => d.id === editingTrip.driverId);
        if (driver) {
          const msg = `Resumo da Viagem RibeirxLog (Finalizada):\nDestino: ${editingTrip.destination}\nPlaca: ${vehicle?.plate || '---'}\nData: ${formatDate(editingTrip.departureDate)}\nStatus: Finalizado ✅`;
          window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }

      onUpdateTrip(editingTrip);
      setEditingTrip(null);
      setMenuOpenId(null);
    }
  };

  const handleGenerateReceipt = (tripId: string) => {
    if (isFree) {
      alert("⚠️ PDF BLOQUEADO\n\nA geração de recibos é exclusiva para assinantes PRO.");
      return;
    }
    const trip = trips.find(t => t.id === tripId);
    const vehicle = trip ? vehicles.find(v => v.id === trip.vehicleId) : null;
    const driver = trip ? drivers.find(d => d.id === trip.driverId) : null;

    if (trip && vehicle && driver) {
      generateTripReceipt(trip, vehicle, driver, profile);
    }
  };

  const handleGenerateMonthlyReport = () => {
    if (isFree) {
      alert("⚠️ RELATÓRIO BLOQUEADO\n\nGerar relatórios mensais em PDF requer assinatura PRO.");
      return;
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const year = String(now.getFullYear());
    generateMonthlyReport(trips, vehicles, drivers, profile, month, year);
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const selectedVehicle = selectedTrip ? vehicles.find(v => v.id === selectedTrip.vehicleId) : null;
  const selectedDriver = selectedTrip ? drivers.find(d => d.id === selectedTrip.driverId) : null;
  const finance = selectedTrip && selectedVehicle && selectedDriver ? calculateTripFinance(selectedTrip, selectedVehicle, selectedDriver, profile) : null;

  return (
    <div className="space-y-6">
      {/* Filtros e Top Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Viagens</h2>
            <p className="text-slate-400 text-sm mt-1">Gerenciamento dinâmico de fretes e rentabilidade.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateMonthlyReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-sky-500/20"
            >
              <Download className="w-4 h-4" /> Relatório Mensal PDF
            </button>
            <div className="hidden lg:flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500">Lucro Filtrado</span>
                <span className="text-emerald-500 font-bold text-sm">R$ {statsSummary.profit.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Bruto</span>
                <span className="text-white font-bold text-sm">R$ {statsSummary.gross.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${showFilters ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
              <Filter className="w-4 h-4" /> Filtros Avançados
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pesquisa Inteligente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Placa, destino ou ID..." className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Financeiro</label>
              <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-700">
                {(['all', 'pending', 'paid'] as StatusFilter[]).map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === f ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Pagos'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ordenar Por</label>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 appearance-none focus:outline-none">
                  <option value="recent">Mais Recentes</option>
                  <option value="profit">Maior Lucratividade</option>
                  <option value="gross">Maior Valor Bruto</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listagem de Viagens */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTrips.map(trip => {
          const vehicle = vehicles.find(v => v.id === trip.vehicleId) || { plate: 'DOC. PENDENTE', name: 'Veículo não vinculado' } as Vehicle;
          const driver = drivers.find(d => d.id === trip.driverId) || { name: 'Motorista não vinculado' } as Driver;
          const tripFinance = calculateTripFinance(trip, vehicle, driver, profile);
          return (
            <div key={trip.id} className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/60 transition-all group relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 lg:w-1/4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${trip.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <MapPin className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg leading-tight mb-1 group-hover:text-emerald-400 transition-colors">{trip.destination || 'Destino Pendente'}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">{vehicle.plate}</span>
                      <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5"><CalendarIcon className="w-3 h-3 text-emerald-500" /> {formatDate(trip.departureDate)}</p>

                      {/* Transit Status Pill/Dot */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700/50 rounded-lg">
                        <span className={`w-1.5 h-1.5 rounded-full ${trip.transitStatus === 'Em Trânsito' ? 'bg-sky-400 animate-pulse' :
                          trip.transitStatus === 'Finalizado' ? 'bg-slate-500' : 'bg-amber-400'
                          }`}></span>
                        <span className="text-[9px] font-black uppercase text-slate-400">{trip.transitStatus || 'Agendado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 px-4 border-l border-slate-700/50">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Equipe & Cliente</p>
                    <p className="text-white text-sm font-bold truncate">{driver.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Rentabilidade</p>
                    <p className="text-emerald-500 text-sm font-black">
                      R$ {(vehicle.type === 'Sociedade' ? tripFinance.lucroSociety : tripFinance.lucroLiquidoReal).toLocaleString()}
                    </p>
                    {vehicle.type === 'Sociedade' && (
                      <p className="text-[8px] text-slate-500 font-bold">({vehicle.societySplitFactor}% sociedade)</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Saldo a Receber</p>
                    <p className="text-sky-400 text-sm font-black">R$ {tripFinance.saldoAReceber.toLocaleString()}</p>
                  </div>
                  <div className="hidden md:block space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Status</p>
                    <div className={`flex items-center gap-1.5 text-xs font-black ${trip.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {trip.status === 'Pago' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} {trip.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 lg:w-auto">
                  <button
                    onClick={() => handleGenerateReceipt(trip.id)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 rounded-2xl text-xs font-black text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <FileText className="w-3.5 h-3.5" /> Gerar Recibo PDF
                  </button>
                  <button onClick={() => setMenuOpenId(menuOpenId === trip.id ? null : trip.id)} className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white"> <MoreVertical className="w-5 h-5" /> </button>
                  {menuOpenId === trip.id && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-20 py-2">
                      <button onClick={() => { setEditingTrip({ ...trip }); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-500 hover:bg-emerald-500/10 font-bold"> <Edit3 className="w-4 h-4" /> Editar </button>
                      {trip.transitStatus === 'Finalizado' && (
                        <button
                          onClick={() => {
                            const msg = `Resumo da Viagem RibeirxLog:\nDestino: ${trip.destination}\nPlaca: ${vehicle.plate}\nData: ${formatDate(trip.departureDate)}\nStatus: ${trip.transitStatus || 'Agendado'}`;
                            window.open(`https://wa.me/${driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-500/10 font-bold"
                        >
                          <MessageCircle className="w-4 h-4" /> Enviar p/ WhatsApp
                        </button>
                      )}
                      <button onClick={() => { setViewingFilesTripId(trip.id); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-sky-500 hover:bg-sky-500/10 font-bold"> <FileText className="w-4 h-4" /> Ver Rastreio & Docs </button>
                      <button onClick={() => { setTripToDeleteId(trip.id); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10 font-bold"> <Trash2 className="w-4 h-4" /> Excluir </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Edição de Viagem - CORREÇÃO DE SCROLL */}
      {editingTrip && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl my-auto shadow-2xl overflow-hidden flex flex-col">
            <header className="p-8 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 z-10">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                  <Edit3 className="w-8 h-8 text-emerald-500" /> Editar Viagem #{editingTrip.id}
                </h3>
              </div>
              <button onClick={() => setEditingTrip(null)} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all"> <X className="w-6 h-6" /> </button>
            </header>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="lg:col-span-8 space-y-8">
                {/* Campos Principais: Veículo, Motorista, Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Veículo</label>
                    <select
                      value={editingTrip.vehicleId}
                      onChange={e => setEditingTrip({ ...editingTrip, vehicleId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Motorista</label>
                    <select
                      value={editingTrip.driverId}
                      onChange={e => setEditingTrip({ ...editingTrip, driverId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold"
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cliente/Transportadora</label>
                    <select
                      value={editingTrip.shipperId}
                      onChange={e => setEditingTrip({ ...editingTrip, shipperId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold"
                    >
                      {shippers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data Saída</label>
                    <input type="date" value={editingTrip.departureDate} onChange={e => setEditingTrip({ ...editingTrip, departureDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Retorno Previsto</label>
                    <input type="date" value={editingTrip.returnDate} onChange={e => setEditingTrip({ ...editingTrip, returnDate: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status Pagamento</label>
                    <select value={editingTrip.status} onChange={e => setEditingTrip({ ...editingTrip, status: e.target.value as PaymentStatus })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-black">
                      <option value="Pendente">Pendente</option><option value="Pago">Pago</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status da Operação</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                      {(['Agendado', 'Em Trânsito', 'Finalizado'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setEditingTrip({ ...editingTrip, transitStatus: s })}
                          className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${editingTrip.transitStatus === s
                            ? 'bg-sky-500 text-white shadow-lg'
                            : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Quilometragem (KM)</label>
                    <input type="number" value={editingTrip.totalKm || ''} onChange={e => setEditingTrip({ ...editingTrip, totalKm: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-black" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receitas</h4>
                    <input type="number" value={editingTrip.freteSeco || ''} onChange={e => setEditingTrip({ ...editingTrip, freteSeco: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white font-bold" placeholder="Frete" />
                    <input type="number" value={editingTrip.diarias || ''} onChange={e => setEditingTrip({ ...editingTrip, diarias: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white font-bold" placeholder="Diárias" />
                  </div>
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diesel</h4>
                    <input type="number" value={editingTrip.combustivel || ''} onChange={e => setEditingTrip({ ...editingTrip, combustivel: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sky-400 font-bold" placeholder="Valor" />
                    <input type="number" value={editingTrip.litersDiesel || ''} onChange={e => setEditingTrip({ ...editingTrip, litersDiesel: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Litros" />
                  </div>
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outros</h4>
                    <input type="number" value={editingTrip.adiantamento || ''} onChange={e => setEditingTrip({ ...editingTrip, adiantamento: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Adiant." />
                    <input type="number" value={editingTrip.outrasDespesas || ''} onChange={e => setEditingTrip({ ...editingTrip, outrasDespesas: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Despesas" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-[2rem] p-8 shadow-2xl sticky top-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase text-center mb-4 tracking-widest">Resultado Real Estimado</p>
                  <h4 className="text-4xl font-black text-emerald-500 text-center tracking-tighter mb-8">R$ {(editingTrip.freteSeco + editingTrip.diarias - editingTrip.combustivel - editingTrip.outrasDespesas).toLocaleString()}</h4>
                  <button onClick={handleUpdate} className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl flex items-center justify-center gap-3"> <Save className="w-5 h-5" /> Salvar </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Exclusão */}
      {tripToDeleteId && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-[2.5rem] w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Excluir Viagem?</h3>
              <p className="text-slate-400 text-sm">
                Esta ação é irreversível. O registro da viagem será removido permanentemente do sistema.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => setTripToDeleteId(null)}
                className="py-4 bg-slate-800 text-slate-300 font-black rounded-2xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (isFree) {
                    alert("⚠️ EXCLUSÃO BLOQUEADA\n\nUsuários grátis não podem excluir viagens.");
                    setTripToDeleteId(null);
                    return;
                  }
                  onDeleteTrip(tripToDeleteId);
                  setTripToDeleteId(null);
                }}
                className="py-4 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingFilesTripId && (
        <TripDetailsModal tripId={viewingFilesTripId} onClose={() => setViewingFilesTripId(null)} isFree={isFree} />
      )}
    </div>
  );
};

const TripDetailsModal = ({ tripId, onClose, isFree }: { tripId: string, onClose: () => void, isFree: boolean }) => {
  const [proofs, setProofs] = useState<TripProof[]>([]);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    const loadData = async () => {
      const { data: proofsData } = await supabase.from('trip_proofs').select('*').eq('trip_id', tripId).order('uploaded_at', { ascending: false });
      if (proofsData) {
        setProofs(proofsData.map((p: any) => ({
          id: p.id,
          tripId: p.trip_id,
          type: p.type,
          fileUrl: p.file_url,
          fileName: p.file_name,
          fileSize: p.file_size,
          uploadedBy: p.uploaded_by,
          uploadedAt: p.uploaded_at,
          approved: p.approved
        })));
      }

      const { data: locData } = await supabase.from('vehicle_locations').select('*').eq('trip_id', tripId).order('timestamp', { ascending: false }).limit(1).single();
      if (locData) setLastLocation(locData);

      setLoading(false);
    };
    loadData();
  }, [tripId, refreshTrigger]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFree) {
      alert("⚠️ UPLOAD BLOQUEADO\n\nAnexar documentos é exclusivo para assinantes PRO.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${tripId}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('trip-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trip-proofs')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('trip_proofs')
        .insert([{
          trip_id: tripId,
          type: 'expense',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: 'manager',
          uploaded_at: new Date().toISOString(),
          approved: true
        }]);

      if (insertError) throw insertError;
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-sky-500" /> Detalhes & Documentos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar space-y-8 pr-2">
          {/* Rastreamento */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Monitoramento em Tempo Real
            </h4>
            {lastLocation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">
                      {new Date(lastLocation.timestamp).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-slate-400 text-sm">
                      Velocidade: {Math.round(lastLocation.speed || 0 * 3.6)} km/h
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Ver no</span> Maps <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">O motorista ainda não iniciou o rastreamento via App Motorista.</p>
            )}
          </div>

          {/* Comprovantes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" /> Arquivos Anexados ({proofs.length})
              </h4>
              <label className={`cursor-pointer px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all hover:text-white flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Anexar Documento
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            {proofs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {proofs.map((proof) => (
                  <div key={proof.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col gap-3 group/item">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-900 border border-white/5 px-2 py-0.5 rounded italic">
                          {proof.uploadedBy === 'manager' ? 'Escritório' : 'Motorista'}
                        </span>
                        <p className="text-white font-bold text-sm mt-1 truncate" title={proof.fileName}>
                          {proof.fileName}
                        </p>
                      </div>
                      {(proof.approved || proof.uploadedBy === 'manager') && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <a
                      href={proof.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-full py-2 bg-slate-700 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg text-center flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-3 h-3" /> Visualizar
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/30 rounded-xl p-8 text-center border border-dashed border-slate-700">
                <p className="text-slate-500 text-sm">Nenhum arquivo ou comprovante nesta viagem.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trips;
