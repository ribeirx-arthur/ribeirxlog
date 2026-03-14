
import React, { useMemo, useState } from 'react';
import { 
  Truck as TruckIcon, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CreditCard,
  DollarSign,
  ArrowRightLeft,
  X,
  Save,
  CheckCircle2,
  Eye,
  Building2,
  Calendar,
  Layers,
  FileText,
  Hash
} from 'lucide-react';
import { Trip, Vehicle, Driver, UserProfile } from '../types';

interface OngoingTripsProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  profile: UserProfile;
  onEditTrip: (trip: Trip) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const OngoingTrips: React.FC<OngoingTripsProps> = ({ trips, vehicles, drivers, profile, onEditTrip }) => {
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const ongoingTrips = useMemo(() => {
    return trips.filter(t => t.status !== 'Pago' && (t.transitStatus === 'Em Trânsito' || t.transitStatus === 'Agendado'))
      .sort((a, b) => (b.departureDate || '').localeCompare(a.departureDate || ''));
  }, [trips]);

  const stats = useMemo(() => {
    return ongoingTrips.reduce((acc, trip) => {
      acc.totalToReceive += (trip.balanceIda || 0) + (trip.balanceVolta || 0);
      return acc;
    }, { totalToReceive: 0 });
  }, [ongoingTrips]);

  const handleQuickSave = () => {
    if (editingTrip) {
      onEditTrip(editingTrip);
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
        setEditingTrip(null);
      }, 1500);
    }
  };

  const handleForceFinish = (trip: Trip) => {
    onEditTrip({
      ...trip,
      transitStatus: 'Finalizado',
      status: 'Pago',
      balanceIda: 0,
      balanceVolta: 0
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Viagens em <span className="text-emerald-500 underline decoration-emerald-500/30">Andamento</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Monitoramento Financeiro PRO
          </p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-8 shadow-2xl">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total a Receber</p>
            <p className="text-2xl font-black text-emerald-500 tracking-tighter italic">R$ {stats.totalToReceive.toLocaleString()}</p>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div className="space-y-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Viagens Ativas</p>
            <p className="text-2xl font-black text-white tracking-tighter italic">{ongoingTrips.length}</p>
          </div>
        </div>
      </header>

      {ongoingTrips.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[3rem] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
            <TruckIcon className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter">Nenhuma viagem em trânsito</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Suas viagens com status 'Em Trânsito' ou 'Agendado' aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {ongoingTrips.map(trip => {
            const vehicle = vehicles.find(v => v.id === trip.vehicleId);
            const driver = drivers.find(d => d.id === trip.driverId);
            const totalToReceive = (trip.balanceIda || 0) + (trip.balanceVolta || 0);

            return (
              <div 
                key={trip.id} 
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:bg-slate-800/50 transition-all group relative overflow-hidden shadow-xl"
              >
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left: Vessel Info */}
                  <div className="lg:w-1/4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                        <TruckIcon className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tighter leading-none">{vehicle?.plate || '---'}</h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 truncate">{driver?.name || 'Motorista'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-slate-400">
                         <MapPin className="w-3.5 h-3.5 text-rose-500" />
                         <span className="text-xs font-bold uppercase tracking-tighter text-white">{trip.destination}</span>
                       </div>
                       <div className="flex items-center gap-2 text-slate-500">
                         <Clock className="w-3.5 h-3.5" />
                         <span className="text-[10px] font-black uppercase">{formatDate(trip.departureDate)}</span>
                       </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      trip.transitStatus === 'Em Trânsito' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${trip.transitStatus === 'Em Trânsito' ? 'bg-sky-400 animate-pulse' : 'bg-amber-400'}`} />
                      {trip.transitStatus}
                    </div>
                  </div>

                  {/* Middle: Financial Snapshot */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-6 lg:p-8">
                    {/* Ida */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Pagamento Ida
                        </span>
                        <span className="text-sm font-black text-white italic">R$ {(trip.paymentIda || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo a Receber</span>
                        <span className={`text-sm font-black ${(trip.balanceIda || 0) > 0 ? 'text-emerald-500' : 'text-slate-600'}`}>
                          R$ {(trip.balanceIda || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Volta */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" /> Pagamento Volta
                        </span>
                        <span className="text-sm font-black text-white italic">R$ {(trip.paymentVolta || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Saldo a Receber</span>
                        <span className={`text-sm font-black ${(trip.balanceVolta || 0) > 0 ? 'text-sky-400' : 'text-slate-600'}`}>
                          R$ {(trip.balanceVolta || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & Total */}
                  <div className="lg:w-1/5 flex flex-col justify-between items-end gap-6 self-stretch">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Pendente</p>
                      <p className="text-3xl font-black text-white tracking-tighter italic">R$ {totalToReceive.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <button 
                          onClick={() => setEditingTrip(trip)}
                          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 group/btn transition-all text-xs"
                        >
                          Editar Financeiro <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleForceFinish(trip)}
                          className="w-full px-6 py-2.5 bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 border border-slate-700 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Concluir Viagem
                        </button>
                        <button 
                          onClick={() => setViewingTrip(trip)}
                          className="w-full px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest shadow-inner shadow-slate-950/50"
                        >
                          <Eye className="w-4 h-4" /> Ver Viagem Completa
                        </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar simulation based on received vs total */}
                <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (((trip.paymentIda || 0) + (trip.paymentVolta || 0)) / ((trip.paymentIda || 0) + (trip.balanceIda || 0) + (trip.paymentVolta || 0) + (trip.balanceVolta || 0) || 1)) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabela de Devedores e Extrato */}
      {ongoingTrips.some(t => (t.balanceIda || 0) > 0 || (t.balanceVolta || 0) > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Extrato de Devedores</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Viagens ativas com saldo pedente</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="pb-4 pl-4">ID Viagem</th>
                  <th className="pb-4">Placa / Motorista</th>
                  <th className="pb-4">Cliente / Origem → Destino</th>
                  <th className="pb-4 text-right pr-4">Saldo Devedor (Total)</th>
                  <th className="pb-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-300">
                {ongoingTrips
                  .filter(t => (t.balanceIda || 0) > 0 || (t.balanceVolta || 0) > 0)
                  .map(trip => {
                    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                    const driver = drivers.find(d => d.id === trip.driverId);
                    const totalDev = (trip.balanceIda || 0) + (trip.balanceVolta || 0);
                    return (
                      <tr key={`debt-${trip.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                        <td className="py-4 pl-4 text-slate-500">#{trip.id.substring(0, 6)}</td>
                        <td className="py-4">
                          <p className="text-white">{vehicle?.plate || '---'}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{driver?.name}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-slate-400 text-xs">{trip.origin} → {trip.destination}</p>
                        </td>
                        <td className="py-4 text-right pr-4">
                          <span className="text-amber-500">R$ {totalDev.toLocaleString()}</span>
                        </td>
                        <td className="py-4 text-center">
                          <button 
                            onClick={() => setEditingTrip(trip)}
                            className="p-2 bg-slate-800 text-slate-400 hover:text-emerald-500 rounded-lg group-hover:bg-slate-700 transition-all inline-flex mx-auto"
                            title="Inspecionar / Editar"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Trip Details Modal */}
      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[400] flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-5xl my-auto shadow-3xl overflow-hidden relative animate-in slide-in-from-bottom-8 duration-500">
            {/* Header decorativo */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-500" />
            
            <div className="p-8 lg:p-12">
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Dossiê da Viagem</span>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">{viewingTrip.origin} <span className="text-emerald-500">→</span> {viewingTrip.destination}</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 italic">
                    <Hash className="w-3.5 h-3.5" /> ID da Viagem: #{viewingTrip.id.substring(0, 12)}
                  </p>
                </div>
                <button 
                  onClick={() => setViewingTrip(null)}
                  className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-3xl transition-all shadow-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Col 1: Logística */}
                <div className="space-y-8">
                  <div className="bg-slate-950/50 rounded-[2rem] border border-slate-800 p-8 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <TruckIcon className="w-4 h-4 text-emerald-500" /> Detalhes da Frota
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Placa do Veículo</p>
                        <p className="text-xl font-black text-white">{vehicles.find(v => v.id === viewingTrip.vehicleId)?.plate || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Motorista Designado</p>
                        <p className="text-lg font-black text-slate-300">{drivers.find(d => d.id === viewingTrip.driverId)?.name || '---'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Datas da Operação</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" /> {formatDate(viewingTrip.departureDate)}
                          </div>
                          <span className="text-slate-700 font-bold">...</span>
                          <div className="flex items-center gap-1.5 text-xs text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> {viewingTrip.transitStatus}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Col 2: Financeiro */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950/80 rounded-[2rem] border border-emerald-500/20 p-8 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Monitoramento IDA</span>
                        <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">Recebido</p>
                          <p className="text-2xl font-black text-white italic">R$ {(viewingTrip.paymentIda || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">A Receber</p>
                          <p className="text-2xl font-black text-emerald-500 italic">R$ {(viewingTrip.balanceIda || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 rounded-[2rem] border border-sky-500/20 p-8 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest italic">Monitoramento VOLTA</span>
                        <div className="p-2 bg-sky-500/10 rounded-lg"><ArrowRightLeft className="w-4 h-4 text-sky-400" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">Recebido</p>
                          <p className="text-2xl font-black text-white italic">R$ {(viewingTrip.paymentVolta || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">A Receber</p>
                          <p className="text-2xl font-black text-sky-400 italic">R$ {(viewingTrip.balanceVolta || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/30 rounded-[2rem] border border-slate-800 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <h4 className="text-[9px] font-black text-slate-600 uppercase mb-2">Frete Bruto</h4>
                      <p className="font-black text-white">R$ {(viewingTrip.freteSeco || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-slate-600 uppercase mb-2">Diárias</h4>
                      <p className="font-black text-slate-300">R$ {(viewingTrip.diarias || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-slate-600 uppercase mb-2">Combustível</h4>
                      <p className="font-black text-slate-300">R$ {(viewingTrip.combustivel || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-slate-600 uppercase mb-2">Total Pendente</h4>
                      <p className="font-black text-emerald-500 text-xl italic">R$ {((viewingTrip.balanceIda || 0) + (viewingTrip.balanceVolta || 0)).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/20 rounded-[2rem] border border-slate-800 p-8 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                            <FileText className="w-4 h-4 text-white" /> Observações Operacionais
                        </h4>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed italic">
                            {viewingTrip.observations || "Nenhuma observação registrada."}
                        </p>
                    </div>
                    <div className="bg-rose-500/5 rounded-[2rem] border border-rose-500/10 p-8 space-y-4">
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 italic">
                            <Building2 className="w-4 h-4 text-rose-500" /> Nota p/ Gerenciador de Frotas
                        </h4>
                        <p className="text-sm text-slate-300 font-bold leading-relaxed">
                            {viewingTrip.fleetManagerNote || "Nenhuma nota para o gerenciador."}
                        </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-800 flex justify-end gap-4">
                <button 
                  onClick={() => { setEditingTrip(viewingTrip); setViewingTrip(null); }}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-xs uppercase tracking-widest"
                >
                  <CreditCard className="w-5 h-5" /> Ajustar Financeiro
                </button>
                <button 
                  onClick={() => setViewingTrip(null)}
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl flex items-center transition-all text-xs uppercase tracking-widest"
                >
                  Fechar Dossiê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-lg p-10 shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic line-clamp-1">Editar Financeiro</h3>
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Placa: {vehicles.find(v => v.id === editingTrip.vehicleId)?.plate}</p>
              </div>
              <button 
                onClick={() => setEditingTrip(null)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pagamento Ida</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input 
                      type="number" 
                      value={editingTrip.paymentIda || ''} 
                      onChange={e => setEditingTrip({...editingTrip, paymentIda: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-white font-black focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Saldo Ida</label>
                  <input 
                    type="number" 
                    value={editingTrip.balanceIda || ''} 
                    onChange={e => setEditingTrip({...editingTrip, balanceIda: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-emerald-500 font-black focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pagamento Volta</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <input 
                      type="number" 
                      value={editingTrip.paymentVolta || ''} 
                      onChange={e => setEditingTrip({...editingTrip, paymentVolta: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-4 text-white font-black focus:border-sky-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Saldo Volta</label>
                  <input 
                    type="number" 
                    value={editingTrip.balanceVolta || ''} 
                    onChange={e => setEditingTrip({...editingTrip, balanceVolta: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sky-400 font-black focus:border-sky-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleQuickSave}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest text-xs"
              >
                {showSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {showSaved ? 'Dados Atualizados!' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OngoingTrips;
