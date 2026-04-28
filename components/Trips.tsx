
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
import { supabase, createClerkSupabaseClient } from '../services/supabase';
import { useAuth } from '@clerk/nextjs';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Hero Section - Neural Intel Design */}
      <div className="relative h-64 md:h-80 rounded-[3rem] overflow-hidden border border-emerald-500/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-slate-950 group-hover:scale-105 transition-transform duration-[30s] ease-linear" />
        <div className="absolute inset-0 opacity-20 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-10 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">Logistics Command</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none italic uppercase">
              Fluxo de <span className="text-emerald-500">Operações</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl">
              Gerencie cada etapa da sua operação logística com precisão cirúrgica e inteligência financeira.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Lucro Filtrado</p>
                    <p className="text-xl font-black text-white leading-none">R$ {statsSummary.profit.toLocaleString()}</p>
                  </div>
               </div>
             </div>
             <button
               onClick={handleGenerateMonthlyReport}
               className="h-full px-8 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2"
             >
               <Download className="w-4 h-4" /> Relatório Semanal
             </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar placa, destino ou ID da operação..." 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl pl-16 pr-8 py-5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold placeholder:text-slate-600" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`flex items-center gap-3 px-8 py-5 rounded-3xl border transition-all text-xs font-black uppercase tracking-widest ${showFilters ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
          >
            <Filter className="w-5 h-5" /> 
            {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </button>
        </div>

        {showFilters && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300 pt-4 border-t border-white/5 mt-4">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Status da Operação</label>
              <div className="flex p-2 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                {(['all', 'pending', 'paid'] as StatusFilter[]).map((f) => (
                  <button 
                    key={f} 
                    onClick={() => setStatusFilter(f)} 
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'}`}
                  >
                    {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pendentes' : 'Concluídos'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Priorização de Fluxo</label>
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as SortOption)} 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                >
                  <option value="recent">Cronologia Recente</option>
                  <option value="profit">Máxima Rentabilidade</option>
                  <option value="gross">Volume Bruto</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Listagem de Viagens */}
      <div className="grid grid-cols-1 gap-6">
        {filteredAndSortedTrips.map(trip => {
          const vehicle = vehicles.find(v => v.id === trip.vehicleId) || { plate: 'DOC. PENDENTE', name: 'Veículo não vinculado' } as Vehicle;
          const driver = drivers.find(d => d.id === trip.driverId) || { name: 'Motorista não vinculado' } as Driver;
          const tripFinance = calculateTripFinance(trip, vehicle, driver, profile);
          
          return (
            <div key={trip.id} className={`group relative bg-slate-900/30 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 hover:bg-slate-800/40 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/5 shadow-lg ${menuOpenId === trip.id ? 'z-50' : 'z-10'}`}>
               {/* Accent bar */}
               <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-[2.5rem] transition-all group-hover:w-3 ${trip.status === 'Pago' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
               
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-6 lg:w-1/3">
                  <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-2xl relative group-hover:rotate-12 transition-transform duration-500 ${trip.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                    <MapPin className="w-10 h-10" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full ${trip.transitStatus === 'Em Trânsito' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-black text-white text-2xl tracking-tighter leading-none group-hover:text-emerald-400 transition-colors italic uppercase">{trip.destination || 'Em Aberto'}</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-slate-950 text-[10px] font-black text-emerald-500 border border-emerald-500/30 rounded-full uppercase tracking-widest">{vehicle.plate}</span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400">
                        <CalendarIcon className="w-3 h-3 text-emerald-500" />
                        {formatDate(trip.departureDate)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 flex-1 pl-8 lg:border-l lg:border-white/5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em] italic">Comando & Log</p>
                    <p className="text-white text-sm font-bold truncate tracking-tight">{driver.name}</p>
                    <p className="text-[10px] font-black text-emerald-500/70 uppercase">vessel: {vehicle.name}</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em] italic">Rentabilidade</p>
                    <p className="text-2xl font-black text-white tracking-tighter leading-none">
                      <span className="text-xs text-slate-500 font-bold mr-1">R$</span>
                      {(vehicle.type === 'Sociedade' ? tripFinance.lucroSociety : tripFinance.lucroLiquidoReal).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-emerald-500" />
                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Impacto Positivo</span>
                    </div>
                  </div>

                  <div className="hidden lg:flex flex-col justify-center space-y-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest self-start ${trip.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                      {trip.status === 'Pago' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      STATUS: {trip.status}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/50 rounded-2xl border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest self-start">
                        Fase: {trip.transitStatus || 'Pendente'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 relative">
                  <button
                    onClick={() => handleGenerateReceipt(trip.id)}
                    className="p-5 bg-white/5 hover:bg-emerald-500 hover:text-slate-950 border border-white/10 rounded-[2rem] text-white transition-all duration-300 shadow-xl group/btn"
                    title="Baixar Recibo"
                  >
                    <FileText className="w-6 h-6 transition-transform group-hover/btn:scale-110" />
                  </button>
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === trip.id ? null : trip.id)} 
                    className="p-5 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-[2rem] text-slate-500 hover:text-white transition-all shadow-xl"
                  > 
                    <MoreVertical className="w-6 h-6" /> 
                  </button>
                  
                  {menuOpenId === trip.id && (
                    <div className="absolute right-0 top-full mt-4 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-3xl z-[9999] py-4 overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="px-6 py-2 mb-2 border-b border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Ações Rápidas</p>
                      </div>
                      <button onClick={() => { setViewingFilesTripId(trip.id); setMenuOpenId(null); }} className="w-full flex items-center gap-4 px-8 py-4 text-xs text-white hover:bg-sky-500/10 font-black uppercase tracking-widest transition-all"> <ExternalLink className="w-5 h-5 text-sky-500" /> anexar docs e obs </button>
                      <button onClick={() => { setEditingTrip({ ...trip }); setMenuOpenId(null); }} className="w-full flex items-center gap-4 px-8 py-4 text-xs text-white hover:bg-emerald-500/10 font-black uppercase tracking-widest transition-all"> <Edit3 className="w-5 h-5 text-emerald-500" /> editar viagem </button>
                      <button onClick={() => { setTripToDeleteId(trip.id); setMenuOpenId(null); }} className="w-full flex items-center gap-4 px-8 py-4 text-xs text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest transition-all"> <Trash2 className="w-5 h-5" /> Eliminar </button>
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
                    <input type="number" value={editingTrip.outrasDespesas || ''} onChange={e => setEditingTrip({ ...editingTrip, outrasDespesas: Number(e.target.value) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Despesas" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2">
                       Monitoramento Financeiro PRO <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[8px]">EXCLUSIVO</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">Pagamento Ida</p>
                          <input type="number" value={editingTrip.paymentIda || ''} onChange={e => setEditingTrip({ ...editingTrip, paymentIda: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold text-sm" placeholder="R$ 0,00" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">Saldo a Receber (Ida)</p>
                          <input type="number" value={editingTrip.balanceIda || ''} onChange={e => setEditingTrip({ ...editingTrip, balanceIda: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-500 font-bold text-sm" placeholder="R$ 0,00" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">Pagamento Volta</p>
                          <input type="number" value={editingTrip.paymentVolta || ''} onChange={e => setEditingTrip({ ...editingTrip, paymentVolta: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-bold text-sm" placeholder="R$ 0,00" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-600 uppercase">Saldo a Receber (Volta)</p>
                          <input type="number" value={editingTrip.balanceVolta || ''} onChange={e => setEditingTrip({ ...editingTrip, balanceVolta: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sky-400 font-bold text-sm" placeholder="R$ 0,00" />
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Observações Gerais</label>
                        <textarea
                        value={editingTrip.observations || ''}
                        onChange={e => setEditingTrip({ ...editingTrip, observations: e.target.value })}
                        placeholder="Observações da viagem..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-medium min-h-[100px] resize-none outline-none focus:border-emerald-500 transition-all shadow-inner"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-500 uppercase ml-1 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Nota p/ Gerenciador
                        </label>
                        <textarea
                        value={editingTrip.fleetManagerNote || ''}
                        onChange={e => setEditingTrip({ ...editingTrip, fleetManagerNote: e.target.value })}
                        placeholder="Instruções para a frota..."
                        className="w-full bg-slate-950 border border-rose-500/20 rounded-xl p-4 text-slate-300 font-medium min-h-[100px] resize-none outline-none focus:border-rose-500 transition-all shadow-inner"
                        />
                    </div>
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
      {
        tripToDeleteId && (
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
        )
      }
      {viewingFilesTripId && (
        <TripDetailsModal
          trip={trips.find(t => t.id === viewingFilesTripId)!}
          onUpdateTrip={onUpdateTrip}
          onClose={() => setViewingFilesTripId(null)}
          isFree={isFree}
        />
      )}
    </div>
  );
};

const TripDetailsModal = ({ trip, onUpdateTrip, onClose, isFree }: { trip: Trip, onUpdateTrip: (t: Trip) => void, onClose: () => void, isFree: boolean }) => {
  const { getToken } = useAuth();
  const tripId = trip.id;
  const [observations, setObservations] = useState(trip.observations || '');
  const [isSavingObs, setIsSavingObs] = useState(false);

  const [proofs, setProofs] = useState<TripProof[]>([]);
  const [lastLocation, setLastLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newDocObservation, setNewDocObservation] = useState('');

  React.useEffect(() => {
    const loadData = async () => {
      const token = await getToken({ template: 'supabase' });
      const client = token ? createClerkSupabaseClient(token) : supabase;
      const { data: proofsData } = await client.from('trip_proofs').select('*').eq('trip_id', tripId).order('uploaded_at', { ascending: false });
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

      const { data: locData } = await client.from('vehicle_locations').select('*').eq('trip_id', tripId).order('timestamp', { ascending: false }).limit(1).single();
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
      const token = await getToken({ template: 'supabase' });
      const client = token ? createClerkSupabaseClient(token) : supabase;

      // Sanitiza o nome do arquivo para evitar erros de encoding no upload do Supabase
      const safeFileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${tripId}_${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await client.storage
        .from('trip-proofs')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = client.storage
        .from('trip-proofs')
        .getPublicUrl(fileName);

      const { error: insertError } = await client
        .from('trip_proofs')
        .insert([{
          trip_id: tripId,
          type: 'expense',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          uploaded_by: 'manager',
          uploaded_at: new Date().toISOString(),
          approved: true,
          observations: newDocObservation // Use the new observation field
        }]);

      if (insertError) {
        // Fallback case the 'observations' column doesn't exist right now
        if (insertError.code === '42703' || insertError.message?.includes('observations')) {
          console.warn('observations column missing, retrying without it');
          const { error: retryError } = await client
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
          if (retryError) throw retryError;
        } else {
          throw insertError;
        }
      }
      setNewDocObservation(''); // Clear observations after success
      setRefreshTrigger(prev => prev + 1);
      alert('Arquivo anexo enviado com sucesso!'); // Feedback positivo para o usuário
    } catch (error: any) {
      console.error('DEBUG - Upload Error Full Object:', error);
      const msg = error.message || error.error_description || 'Erro ao enviar arquivo';
      const code = error.code || (error.status ? `Status ${error.status}` : 'No Code');
      alert(`[ERRO DE UPLOAD]\n\nMensagem: ${msg}\nCódigo: ${code}\n\nVerifique se:\n1. O bucket "trip-proofs" existe no Supabase.\n2. As permissões de RLS permitem o upload.\n3. O arquivo não é muito grande.`);
    } finally {
      setIsUploading(false);
      // Limpa o input file para permitir o envio do mesmo arquivo novamente se necessário
      e.target.value = '';
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
          {/* Observações da Viagem */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" /> Observações da Viagem
            </h4>
            <div className="space-y-3">
              <textarea
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Adicione notas, observações ou status complementares..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 font-medium min-h-[100px] resize-none outline-none focus:border-emerald-500 transition-all text-sm"
              />
              <button
                onClick={async () => {
                  if (isFree) {
                    alert("⚠️ ACESSO BLOQUEADO\n\nEdição de observações é para assinantes PRO.");
                    return;
                  }
                  setIsSavingObs(true);
                  await onUpdateTrip({ ...trip, observations });
                  setIsSavingObs(false);
                }}
                disabled={isSavingObs || observations === (trip.observations || '')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-700 text-white text-xs font-black uppercase rounded-lg transition-all"
              >
                {isSavingObs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {isSavingObs ? 'Salvando...' : 'Salvar Observação'}
              </button>
            </div>
          </div>

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
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4 mb-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-sky-500" /> Observação do Documento (Opcional)
              </h4>
              <textarea
                value={newDocObservation}
                onChange={e => setNewDocObservation(e.target.value)}
                placeholder="Ex: Nota fiscal referente ao conserto do pneu..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-300 font-medium min-h-[60px] resize-none outline-none focus:border-sky-500 transition-all text-xs"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" /> Arquivos Anexados ({proofs.length})
              </h4>
              <label className={`cursor-pointer px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500 text-[10px] font-black uppercase tracking-widest hover:bg-sky-500 transition-all hover:text-white flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {isUploading ? 'Enviando...' : 'Anexar Documento'}
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
