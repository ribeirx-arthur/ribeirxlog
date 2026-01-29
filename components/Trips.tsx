
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
  Wallet
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile, PaymentStatus } from '../types';
import { calculateTripFinance } from '../services/finance';

interface TripsProps {
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  onUpdateTrip: (trip: Trip) => void;
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

const Trips: React.FC<TripsProps> = ({ trips, setTrips, onUpdateTrip, vehicles, drivers, shippers, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [tripToDeleteId, setTripToDeleteId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  const printableRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedTrips = useMemo(() => {
    let result = trips.filter(t => {
      const vehicle = vehicles.find(v => v.id === t.vehicleId);
      const matchesSearch = 
        (vehicle?.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm);
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'pending' && t.status === 'Pendente') ||
        (statusFilter === 'paid' && t.status === 'Pago');

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return b.departureDate.localeCompare(a.departureDate);
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
    if (editingTrip) {
      onUpdateTrip(editingTrip);
      setEditingTrip(null);
      setMenuOpenId(null);
    }
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
          const vehicle = vehicles.find(v => v.id === trip.vehicleId);
          const driver = drivers.find(d => d.id === trip.driverId);
          if (!vehicle || !driver) return null;
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
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 px-4 border-l border-slate-700/50">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Equipe & Cliente</p>
                    <p className="text-white text-sm font-bold truncate">{driver.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Rentabilidade</p>
                    <p className="text-emerald-500 text-sm font-black">R$ {tripFinance.lucroLiquidoReal.toLocaleString()}</p>
                  </div>
                  <div className="hidden md:block space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest">Recebimento</p>
                    <div className={`flex items-center gap-1.5 text-xs font-black ${trip.status === 'Pago' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {trip.status === 'Pago' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} {trip.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 lg:w-auto">
                  <button onClick={() => setSelectedTripId(trip.id)} className="px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-black text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center gap-2"> Recibo <ArrowUpDown className="w-3 h-3 text-emerald-500" /> </button>
                  <button onClick={() => setMenuOpenId(menuOpenId === trip.id ? null : trip.id)} className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-500 hover:text-white"> <MoreVertical className="w-5 h-5" /> </button>
                  {menuOpenId === trip.id && (
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-20 py-2">
                      <button onClick={() => { setEditingTrip({...trip}); setMenuOpenId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-emerald-500 hover:bg-emerald-500/10 font-bold"> <Edit3 className="w-4 h-4" /> Editar </button>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data Saída</label>
                      <input type="date" value={editingTrip.departureDate} onChange={e => setEditingTrip({...editingTrip, departureDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Retorno Previsto</label>
                      <input type="date" value={editingTrip.returnDate} onChange={e => setEditingTrip({...editingTrip, returnDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status Pagamento</label>
                      <select value={editingTrip.status} onChange={e => setEditingTrip({...editingTrip, status: e.target.value as PaymentStatus})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-black">
                        <option value="Pendente">Pendente</option><option value="Pago">Pago</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Quilometragem (KM)</label>
                      <input type="number" value={editingTrip.totalKm || ''} onChange={e => setEditingTrip({...editingTrip, totalKm: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-black" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receitas</h4>
                       <input type="number" value={editingTrip.freteSeco || ''} onChange={e => setEditingTrip({...editingTrip, freteSeco: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white font-bold" placeholder="Frete" />
                       <input type="number" value={editingTrip.diarias || ''} onChange={e => setEditingTrip({...editingTrip, diarias: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white font-bold" placeholder="Diárias" />
                    </div>
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Diesel</h4>
                       <input type="number" value={editingTrip.combustivel || ''} onChange={e => setEditingTrip({...editingTrip, combustivel: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sky-400 font-bold" placeholder="Valor" />
                       <input type="number" value={editingTrip.litersDiesel || ''} onChange={e => setEditingTrip({...editingTrip, litersDiesel: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Litros" />
                    </div>
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outros</h4>
                       <input type="number" value={editingTrip.adiantamento || ''} onChange={e => setEditingTrip({...editingTrip, adiantamento: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Adiant." />
                       <input type="number" value={editingTrip.outrasDespesas || ''} onChange={e => setEditingTrip({...editingTrip, outrasDespesas: Number(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white" placeholder="Despesas" />
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
    </div>
  );
};

export default Trips;
