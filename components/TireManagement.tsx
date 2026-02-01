import React, { useState } from 'react';
import {
    CircleDot,
    Layers,
    Plus,
    AlertTriangle,
    Trash2,
    Disc,
    Truck,
    ArrowRightLeft,
    Wrench,
    ArrowUpCircle,
    History
} from 'lucide-react';
import { Tire, Vehicle, Buggy } from '../types';

interface TireManagementProps {
    vehicles: Vehicle[];
    buggies: Buggy[];
    tires: Tire[];
    onUpdateTires: (tires: Tire[]) => void;
}

const TireManagement: React.FC<TireManagementProps> = ({ vehicles, buggies, tires, onUpdateTires }) => {
    const [viewMode, setViewMode] = useState<'vehicle' | 'buggy'>('vehicle');
    const [selectedId, setSelectedId] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<{ id: string, type: 'vehicle' | 'buggy' } | null>(null);
    const [newTire, setNewTire] = useState<Partial<Tire>>({
        brand: '',
        model: '',
        size: '295/80R22.5',
        status: 'new',
        location: 'stock',
        currentKm: 0,
        cost: 0
    });

    const activeAssets = viewMode === 'vehicle' ? vehicles : buggies;
    const selectedAsset = activeAssets.find((a: any) => a.id === selectedId);

    const assetTires = tires.filter(t =>
        viewMode === 'vehicle' ? t.vehicleId === selectedId : t.buggyId === selectedId
    );

    const stockTires = tires.filter(t => t.location === 'stock');

    const handleSaveTire = () => {
        if (!newTire.brand || !newTire.model) return;

        const tireToAdd: Tire = {
            ...newTire as Tire,
            id: Math.random().toString(36).substr(2, 9),
            location: 'stock',
            currentKm: newTire.currentKm || 0,
            cost: newTire.cost || 0
        };

        onUpdateTires([...tires, tireToAdd]);
        setIsModalOpen(false);
        setNewTire({ brand: '', model: '', size: '295/80R22.5', status: 'new', location: 'stock', currentKm: 0, cost: 0 });
    };

    const handleInstallTire = (tireId: string) => {
        if (!selectedPosition) return;

        const updatedTires = tires.map(t => {
            if (t.id === tireId) {
                return {
                    ...t,
                    location: selectedPosition.type,
                    vehicleId: selectedPosition.type === 'vehicle' ? selectedId : undefined,
                    buggyId: selectedPosition.type === 'buggy' ? selectedId : undefined,
                    position: selectedPosition.id,
                    installDate: new Date().toISOString()
                };
            }
            return t;
        });

        onUpdateTires(updatedTires);
        setSelectedPosition(null);
    };

    const handleRemoveTire = (tireId: string) => {
        const updatedTires = tires.map(t => {
            if (t.id === tireId) {
                return {
                    ...t,
                    location: 'stock' as const,
                    vehicleId: undefined,
                    buggyId: undefined,
                    position: undefined
                };
            }
            return t;
        });
        onUpdateTires(updatedTires);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Gestão de Pneus</h2>
                    <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-widest">Controle de Vida Útil e Rodízio {viewMode === 'vehicle' ? '(Caminhão)' : '(Implemento)'}</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                    <button
                        onClick={() => { setViewMode('vehicle'); setSelectedId(''); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'vehicle' ? 'bg-slate-800 text-sky-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Caminhão
                    </button>
                    <button
                        onClick={() => { setViewMode('buggy'); setSelectedId(''); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'buggy' ? 'bg-slate-800 text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Implemento
                    </button>
                </div>
            </header>

            {/* SELETOR DE ATIVOS */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {activeAssets.map((asset: any) => (
                    <button
                        key={asset.id}
                        onClick={() => setSelectedId(asset.id)}
                        className={`flex-shrink-0 px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 min-w-[200px] ${selectedId === asset.id
                            ? `bg-slate-800 border-${viewMode === 'vehicle' ? 'sky' : 'amber'}-500 text-white shadow-xl`
                            : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700'
                            }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedId === asset.id ? (viewMode === 'vehicle' ? 'bg-sky-500' : 'bg-amber-500') : 'bg-slate-900'}`}>
                            {viewMode === 'vehicle' ? <Truck className="w-5 h-5 text-white" /> : <Layers className="w-5 h-5 text-white" />}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Placa</p>
                            <p className="text-lg font-black tracking-tighter uppercase">{asset.plate}</p>
                        </div>
                    </button>
                ))}
            </div>

            {selectedAsset ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* MAPA VISUAL */}
                    <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Disc className="w-64 h-64" />
                        </div>

                        {viewMode === 'vehicle' ? (
                            <TruckMap
                                asset={selectedAsset}
                                tires={assetTires}
                                onSlotClick={(posId) => setSelectedPosition({ id: posId, type: 'vehicle' })}
                                onRemoveTire={handleRemoveTire}
                            />
                        ) : (
                            <BuggyMap
                                asset={selectedAsset}
                                tires={assetTires}
                                onSlotClick={(posId) => setSelectedPosition({ id: posId, type: 'buggy' })}
                                onRemoveTire={handleRemoveTire}
                            />
                        )}
                    </div>

                    {/* INFO SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 h-full flex flex-col">
                            <h3 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter mb-6">
                                <Plus className="text-emerald-500" /> Estoque de Pneus
                            </h3>

                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                {stockTires.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <Disc className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase">Nenhum pneu em estoque</p>
                                    </div>
                                ) : (
                                    stockTires.map(tire => (
                                        <div key={tire.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 group hover:border-emerald-500 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-white font-black text-sm">{tire.brand} {tire.model}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{tire.size} • S/N: {tire.serialNumber || '---'}</p>
                                                </div>
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                    R$ {tire.cost.toLocaleString()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleInstallTire(tire.id)}
                                                disabled={!selectedPosition}
                                                className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${selectedPosition ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-slate-900 text-slate-600'}`}
                                            >
                                                <ArrowUpCircle className="w-3 h-3" />
                                                {selectedPosition ? `Instalar em ${selectedPosition.id}` : 'Selecione uma posição'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button onClick={() => setIsModalOpen(true)} className="mt-6 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                <Plus className="w-4 h-4" /> Comprar Novo Pneu
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-[3rem] border-dashed">
                    <Disc className="w-16 h-16 text-slate-700 mx-auto mb-4 animate-spin-slow" />
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest">Nenhum {viewMode === 'vehicle' ? 'Caminhão' : 'Implemento'} Selecionado</h3>
                    <p className="text-slate-600 mt-2">Escolha uma placa acima para gerenciar os pneus.</p>
                </div>
            )}

            {/* MODAL DE CADASTRO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Novo Pneu (Entrada Estoque)</h3>
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
                            <button onClick={handleSaveTire} className="py-4 bg-emerald-500 text-emerald-950 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-emerald-400">Salvar no Estoque</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// COMPONENTES AUXILIARES PARA O MAPA
const TruckMap = ({ asset, tires, onSlotClick, onRemoveTire }: any) => (
    <div className="relative z-10 flex flex-col items-center gap-12 py-10 w-full animate-in slide-in-from-top duration-500">
        <div className="text-center">
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-4">Cabine</p>
            <div className="relative w-72 h-32 bg-slate-950/80 rounded-3xl border border-slate-800/50 flex justify-between items-center px-8 shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent"></div>
                <TireSlot position="fl" label="Dianteiro Esq" tire={tires.find((t: any) => t.position === 'fl')} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                <div className="h-20 w-32 border-x border-dashed border-slate-800/50 mx-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Eixo</span>
                    <span className="text-[9px] font-black text-sky-500/40 uppercase">Direcional</span>
                </div>
                <TireSlot position="fr" label="Dianteiro Dir" tire={tires.find((t: any) => t.position === 'fr')} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
            </div>
        </div>

        <div className="space-y-6">
            <p className="text-[10px] font-black uppercase text-center text-slate-600 tracking-[0.3em]">Tração</p>
            {[1, 2].map(axle => (
                <div key={axle} className="relative w-80 h-32 bg-slate-950/80 rounded-3xl border border-slate-800/50 flex justify-between items-center px-6 shadow-inner">
                    <div className="flex gap-2">
                        <TireSlot position={`dl${axle}o`} label={`Tração ${axle} Esq Ext`} tire={tires.find((t: any) => t.position === `dl${axle}o`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                        <TireSlot position={`dl${axle}i`} label={`Tração ${axle} Esq Int`} tire={tires.find((t: any) => t.position === `dl${axle}i`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                    </div>
                    <div className="h-16 w-12 border-x border-slate-800/50 mx-2 flex items-center justify-center">
                        <Disc className="w-4 h-4 text-slate-800" />
                    </div>
                    <div className="flex gap-2">
                        <TireSlot position={`dr${axle}i`} label={`Tração ${axle} Dir Int`} tire={tires.find((t: any) => t.position === `dr${axle}i`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                        <TireSlot position={`dr${axle}o`} label={`Tração ${axle} Dir Ext`} tire={tires.find((t: any) => t.position === `dr${axle}o`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const BuggyMap = ({ asset, tires, onSlotClick, onRemoveTire }: { asset: Buggy, tires: Tire[], onSlotClick: (id: string) => void, onRemoveTire: (id: string) => void }) => {
    const axles = Array.from({ length: asset.axles }, (_, i) => i + 1);

    return (
        <div className="relative z-10 flex flex-col items-center gap-6 py-10 w-full animate-in slide-in-from-bottom duration-500">
            <div className="w-1 h-12 bg-gradient-to-t from-slate-800 to-transparent rounded-full mb-4"></div>
            <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-4">Eixos do Implemento</p>

            <div className="space-y-4">
                {axles.map(axle => (
                    <div key={axle} className="relative w-80 h-32 bg-slate-950/80 rounded-3xl border border-slate-800/50 flex justify-between items-center px-6 shadow-inner">
                        <div className="flex gap-2">
                            <TireSlot position={`b${axle}l1`} label={`Eixo ${axle} Esq 1`} tire={tires.find((t: any) => t.position === `b${axle}l1`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                            {asset.tireType === 'dual' && <TireSlot position={`b${axle}l2`} label={`Eixo ${axle} Esq 2`} tire={tires.find((t: any) => t.position === `b${axle}l2`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />}
                        </div>
                        <div className="h-full w-20 flex flex-col items-center justify-center gap-1">
                            <div className="h-0.5 w-full bg-slate-800"></div>
                            <span className="text-[9px] font-black text-amber-500/30 uppercase tracking-widest italic">Eixo {axle}</span>
                            <div className="h-0.5 w-full bg-slate-800"></div>
                        </div>
                        <div className="flex gap-2">
                            {asset.tireType === 'dual' && <TireSlot position={`b${axle}r2`} label={`Eixo ${axle} Dir 2`} tire={tires.find((t: any) => t.position === `b${axle}r2`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />}
                            <TireSlot position={`b${axle}r1`} label={`Eixo ${axle} Dir 1`} tire={tires.find((t: any) => t.position === `b${axle}r1`)} onSlotClick={onSlotClick} onRemove={onRemoveTire} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-24 h-4 bg-slate-800/50 rounded-full mt-4 flex items-center justify-center">
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Parachoque</p>
            </div>
        </div>
    );
};

const TireSlot = ({ position, label, tire, onSlotClick, onRemove }: any) => (
    <div className="group relative">
        <div
            onClick={() => onSlotClick(position)}
            className={`w-10 h-16 rounded-lg transition-all border-2 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg
                ${tire
                    ? 'bg-slate-900 border-sky-500 shadow-sky-500/10 hover:border-sky-400'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'}
            `}
        >
            {tire ? (
                <>
                    <Disc className="w-5 h-5 text-sky-500 animate-pulse-slow" />
                    <div className="flex flex-col items-center leading-none">
                        <span className="text-[6px] font-black text-white uppercase">{tire.brand.slice(0, 3)}</span>
                        <span className="text-[5px] font-bold text-slate-500">{tire.currentKm}k km</span>
                    </div>
                </>
            ) : (
                <Plus className="w-4 h-4 text-slate-700 group-hover:text-slate-500" />
            )}
        </div>

        {tire && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(tire.id); }}
                    className="p-1 px-2 bg-rose-500 text-white rounded-md shadow-lg hover:bg-rose-400 transition-colors"
                    title="Remover pneu"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        )}

        {/* POPOVER INFO NO HOVER */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-950 border border-white/10 p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 z-50">
            <div className="space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${tire ? 'bg-sky-500/10 text-sky-400' : 'bg-slate-800 text-slate-500'}`}>
                        {tire ? 'Em uso' : 'Vazio'}
                    </span>
                </div>
                {tire ? (
                    <>
                        <p className="text-white font-black text-xs">{tire.brand} {tire.model}</p>
                        <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-400">
                            <div className="flex items-center gap-1"><History className="w-2.5 h-2.5" /> {tire.currentKm} KM</div>
                            <div className="flex items-center gap-1"><Wrench className="w-2.5 h-2.5" /> {tire.status}</div>
                        </div>
                    </>
                ) : (
                    <p className="text-[9px] text-slate-500">Clique para instalar um pneu do estoque nesta posição.</p>
                )}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-white/10 rotate-45 -mt-1.5"></div>
        </div>
    </div>
);

export default TireManagement;
