import React, { useState } from 'react';
import {
    CircleDot,
    Layers,
    Settings,
    Plus,
    AlertTriangle,
    RotateCw,
    Trash2,
    Disc
} from 'lucide-react';
import { Tire, Vehicle, TirePosition } from '../types';

interface TireManagementProps {
    vehicles: Vehicle[];
}

const TireManagement: React.FC<TireManagementProps> = ({ vehicles }) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTire, setNewTire] = useState<Partial<Tire>>({
        brand: '',
        model: '',
        size: '295/80R22.5',
        status: 'new',
        location: 'stock',
        cost: 0
    });

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Gestão de Pneus</h2>
                    <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Controle de Vida Útil e Rodízio</p>
                </div>

                <div className="flex items-center gap-4">
                    {!selectedVehicle ? (
                        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="text-xs font-black text-slate-400 uppercase">Selecione um veículo</span>
                        </div>
                    ) : (
                        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black rounded-xl transition-all flex items-center gap-2 uppercase text-xs tracking-widest">
                            <Plus className="w-4 h-4" /> Novo Pneu
                        </button>
                    )}
                </div>
            </header>

            {/* SELETOR DE VEÍCULO */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {vehicles.map(vehicle => (
                    <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicleId(vehicle.id)}
                        className={`flex-shrink-0 px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 min-w-[200px] ${selectedVehicleId === vehicle.id
                            ? 'bg-slate-800 border-sky-500 text-white shadow-xl shadow-sky-500/10'
                            : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedVehicleId === vehicle.id ? 'bg-sky-500 text-white' : 'bg-slate-900'}`}>
                            <Layers className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Placa</p>
                            <p className="text-lg font-black tracking-tighter">{vehicle.plate}</p>
                        </div>
                    </button>
                ))}
            </div>

            {selectedVehicle ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* MAPA VISUAL DO CAMINHÃO */}
                    <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Disc className="w-64 h-64" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-12 py-10">
                            {/* TRUCK FRONT AXLE */}
                            <div className="relative w-64 h-24 bg-slate-950/50 rounded-lg border border-slate-800 flex justify-between items-center px-4">
                                <TireSlot position="fl" label="Dianteiro Esq" />
                                <div className="h-full w-32 border-x border-slate-800/50 mx-4 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-slate-700 uppercase rotate-90 tracking-[0.3em]">Eixo Direcional</span>
                                </div>
                                <TireSlot position="fr" label="Dianteiro Dir" />
                            </div>

                            {/* TRUCK DRIVE AXLES */}
                            <div className="space-y-4">
                                <div className="relative w-64 h-24 bg-slate-950/50 rounded-lg border border-slate-800 flex justify-between items-center px-4">
                                    <div className="flex gap-2">
                                        <TireSlot position="dl1o" label="Tração 1 Esq Ext" />
                                        <TireSlot position="dl1i" label="Tração 1 Esq Int" />
                                    </div>
                                    <div className="h-full w-8 border-x border-slate-800/50 mx-2"></div>
                                    <div className="flex gap-2">
                                        <TireSlot position="dr1i" label="Tração 1 Dir Int" />
                                        <TireSlot position="dr1o" label="Tração 1 Dir Ext" />
                                    </div>
                                </div>

                                <div className="relative w-64 h-24 bg-slate-950/50 rounded-lg border border-slate-800 flex justify-between items-center px-4">
                                    <div className="flex gap-2">
                                        <TireSlot position="dl2o" label="Tração 2 Esq Ext" />
                                        <TireSlot position="dl2i" label="Tração 2 Esq Int" />
                                    </div>
                                    <div className="h-full w-8 border-x border-slate-800/50 mx-2"></div>
                                    <div className="flex gap-2">
                                        <TireSlot position="dr2i" label="Tração 2 Dir Int" />
                                        <TireSlot position="dr2o" label="Tração 2 Dir Ext" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* INFO SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter mb-6">
                                <CircleDot className="text-sky-500" /> Detalhes
                            </h3>
                            <div className="space-y-4 text-center py-10">
                                <p className="text-slate-500 font-medium text-sm">Selecione um pneu no mapa para ver detalhes, desgaste e histórico.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-[3rem] border-dashed">
                    <Layers className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">Nenhum Veículo Selecionado</h3>
                    <p className="text-slate-600 mt-2">Escolha uma placa acima para gerenciar os pneus.</p>
                </div>
            )}

            {/* MODAL DE CADASTRO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Cadastrar Pneu</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Marca (ex: Michelin)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500" value={newTire.brand} onChange={e => setNewTire({ ...newTire, brand: e.target.value })} />
                            <input type="text" placeholder="Modelo (ex: X Multi Z)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500" value={newTire.model} onChange={e => setNewTire({ ...newTire, model: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Medida" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500" value={newTire.size} onChange={e => setNewTire({ ...newTire, size: e.target.value })} />
                                <input type="number" placeholder="Custo (R$)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500" value={newTire.cost} onChange={e => setNewTire({ ...newTire, cost: Number(e.target.value) })} />
                            </div>
                            <input type="text" placeholder="Nº Série / Fogo" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold outline-none focus:border-emerald-500" value={newTire.serialNumber} onChange={e => setNewTire({ ...newTire, serialNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="py-4 bg-slate-800 text-slate-400 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-slate-700">Cancelar</button>
                            <button onClick={() => { alert('Funcionalidade de salvar será implementada na próxima etapa!'); setIsModalOpen(false); }} className="py-4 bg-emerald-500 text-emerald-950 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-emerald-400">Salvar Pneu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TireSlot = ({ position, label, tire }: { position: string, label: string, tire?: Tire }) => (
    <div className="group relative">
        <div className={`w-8 h-12 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all border-2 ${tire ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 text-center text-[7px] font-black uppercase text-slate-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 pointer-events-none z-20 bg-black px-2 py-1 rounded">
            {label}
        </span>
    </div>
);

export default TireManagement;
