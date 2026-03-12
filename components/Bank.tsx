
import React, { useMemo } from 'react';
import { 
  Landmark, 
  ArrowDownCircle, 
  Search, 
  ArrowUpCircle, 
  Calendar, 
  Building2, 
  BadgeCheck,
  Filter,
  Download,
  Receipt
} from 'lucide-react';
import { Trip, Vehicle, Driver, Shipper, UserProfile } from '../types';

interface BankProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  shippers: Shipper[];
  profile: UserProfile;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const Bank: React.FC<BankProps> = ({ trips, vehicles, drivers, shippers, profile }) => {
  
  const transactions = useMemo(() => {
    const list: any[] = [];

    trips.forEach(trip => {
      const shipper = shippers.find(s => s.id === trip.shipperId);
      const vehicle = vehicles.find(v => v.id === trip.vehicleId);

      // 1. Entrada de Adiantamento (se existir)
      if (trip.adiantamento > 0) {
        list.push({
          id: `adv-${trip.id}`,
          tripId: trip.id,
          date: trip.departureDate, // Data do adiantamento geralmente é na saída
          type: 'Adiantamento',
          client: shipper?.name || 'Cliente Particular',
          amount: trip.adiantamento,
          status: 'Recebido',
          plate: vehicle?.plate || '---'
        });
      }

      // 2. Pagamento de Ida (se estiver pago / status geral Pago)
      if (trip.status === 'Pago' || trip.status === 'Parcial') {
          if (trip.paymentIda && trip.paymentIda > 0) {
              list.push({
                  id: `pay-ida-${trip.id}`,
                  tripId: trip.id,
                  date: trip.receiptDate || trip.departureDate,
                  type: 'Pagamento Ida',
                  client: shipper?.name || 'Cliente Particular',
                  amount: trip.paymentIda,
                  status: 'Recebido',
                  plate: vehicle?.plate || '---'
              });
          }
           if (trip.paymentVolta && trip.paymentVolta > 0) {
              list.push({
                  id: `pay-volta-${trip.id}`,
                  tripId: trip.id,
                  date: trip.receiptDate || trip.departureDate,
                  type: 'Pagamento Volta',
                  client: shipper?.name || 'Cliente Particular',
                  amount: trip.paymentVolta,
                  status: 'Recebido',
                  plate: vehicle?.plate || '---'
              });
          }
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [trips, shippers, vehicles]);

  const totalRevenue = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">
                <Landmark className="w-6 h-6" />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
               Central <span className="text-emerald-500 underline decoration-emerald-500/30">Bancária</span>
             </h2>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Extrato Consolidado de Entradas
          </p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-10 shadow-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo Total Recebido</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter italic">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-px h-12 bg-slate-800 relative z-10" />
          <div className="space-y-1 relative z-10">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Movimentações</p>
            <p className="text-3xl font-black text-white tracking-tighter italic">{transactions.length}</p>
          </div>
        </div>
      </header>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, placa ou ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 shadow-xl"
          />
        </div>
        <button className="px-6 py-4 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:border-slate-700 transition-all shadow-xl">
          <Filter className="w-4 h-4" /> Filtros
        </button>
        <button className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-xl">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
           <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-3">
             <Receipt className="w-5 h-5 text-emerald-500" /> Histórico de Transações
           </h3>
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Mês Atual</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-6">Data</th>
                <th className="p-6">Tipo</th>
                <th className="p-6">Cliente / Embarcador</th>
                <th className="p-6">Referência</th>
                <th className="p-6 text-right">Valor</th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <Landmark className="w-12 h-12" />
                       <p className="font-black uppercase tracking-widest text-[10px]">Nenhuma movimentação bancária registrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, idx) => (
                  <tr key={tx.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-all group ${idx % 2 === 0 ? 'bg-slate-900/30' : ''}`}>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500">
                           <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs">{formatDate(tx.date)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                       <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                         tx.type === 'Adiantamento' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                       }`}>
                         {tx.type}
                       </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white line-clamp-1">{tx.client}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Voucher Identificado</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                       <div className="flex flex-col">
                          <span className="text-xs text-slate-400">ID: #{tx.tripId.substring(0, 8)}</span>
                          <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Placa {tx.plate}</span>
                       </div>
                    </td>
                    <td className="p-6 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-emerald-500 font-black italic">+ R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-[8px] text-slate-600 font-black uppercase">Crédito em Conta</span>
                       </div>
                    </td>
                    <td className="p-6 text-center">
                       <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <BadgeCheck className="w-3 h-3" />
                          Confirmado
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bank;
