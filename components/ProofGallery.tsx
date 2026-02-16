import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TripProof, Trip, Vehicle, Driver } from '../types';
import {
    FileText,
    Download,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    ExternalLink,
    Eye,
    Truck,
    User,
    Calendar,
    AlertCircle
} from 'lucide-react';

interface ProofGalleryProps {
    trips: Trip[];
    vehicles: Vehicle[];
    drivers: Driver[];
}

const ProofGallery: React.FC<ProofGalleryProps> = ({ trips, vehicles, drivers }) => {
    const [proofs, setProofs] = useState<TripProof[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        fetchProofs();
    }, []);

    const fetchProofs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('trip_proofs')
            .select('*')
            .order('uploaded_at', { ascending: false });

        if (data) setProofs(data);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        const { error } = await supabase
            .from('trip_proofs')
            .update({ approved: true, approved_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            setProofs(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
        }
    };

    const filteredProofs = proofs.filter(p => {
        const trip = trips.find(t => t.id === p.tripId);
        const vehicle = vehicles.find(v => v.id === trip?.vehicleId);
        const driver = drivers.find(d => d.id === trip?.driverId);

        const searchMatches =
            (p.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (vehicle?.plate || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const typeMatches = filterType === 'all' || p.type === filterType;

        return searchMatches && typeMatches;
    });

    const getProofTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'cte': 'CT-e',
            'nfe': 'NF-e',
            'receipt': 'Recibo',
            'fuel': 'Combustível',
            'toll': 'Pedágio',
            'expense': 'Despesa',
            'delivery': 'Entrega',
            'loading': 'Carga'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Centro de Documentos</h2>
                    <p className="text-slate-400 text-sm mt-1">Veja e aprove todos os comprovantes enviados pelos motoristas</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por placa, motorista ou arquivo..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:border-emerald-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 text-white text-sm focus:border-emerald-500 outline-none"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="all">Todos os tipos</option>
                    <option value="cte">CT-e</option>
                    <option value="nfe">NF-e</option>
                    <option value="fuel">Combustível</option>
                    <option value="delivery">Comprovante de Entrega</option>
                    <option value="expense">Outras Despesas</option>
                </select>
                <div className="flex items-center gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-xs font-black text-slate-500 uppercase">Total:</span>
                    <span className="text-emerald-500 font-bold">{filteredProofs.length} arquivos</span>
                </div>
            </div>

            {loading ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-20 flex flex-col items-center justify-center space-y-4">
                    <Clock className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold">Carregando documentos...</p>
                </div>
            ) : filteredProofs.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-20 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                        <FileText className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-white font-black text-xl">Nenhum documento encontrado</p>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Tente ajustar seus filtros ou aguarde os motoristas enviarem novos arquivos.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProofs.map(proof => {
                        const trip = trips.find(t => t.id === proof.tripId);
                        const vehicle = vehicles.find(v => v.id === trip?.vehicleId);
                        const driver = drivers.find(d => d.id === trip?.driverId);

                        return (
                            <div key={proof.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-emerald-500/50 transition-all group shadow-xl">
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-2xl ${proof.approved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-400">
                                                {getProofTypeLabel(proof.type)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-white font-bold leading-tight truncate" title={proof.fileName}>
                                            {proof.fileName}
                                        </h3>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Truck className="w-3 h-3" />
                                                <span className="font-bold text-slate-200">{vehicle?.plate || '---'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <User className="w-3 h-3" />
                                                <span className="truncate">{driver?.name.split(' ')[0] || '---'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(proof.uploadedAt).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <AlertCircle className={`w-3 h-3 ${proof.approved ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                <span>{proof.approved ? 'Aprovado' : 'Pendente'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                                        <a
                                            href={proof.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Eye className="w-3 h-3" /> Visualizar
                                        </a>
                                        {!proof.approved && (
                                            <button
                                                onClick={() => handleApprove(proof.id)}
                                                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Aprovar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProofGallery;
