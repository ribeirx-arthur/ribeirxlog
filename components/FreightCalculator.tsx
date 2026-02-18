
import React, { useState, useMemo } from 'react';
import {
    Calculator,
    MapPin,
    Truck,
    Fuel,
    DollarSign,
    ChevronRight,
    ArrowRight,
    ShieldCheck,
    Info,
    Download,
    Share2,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { UserProfile, Vehicle } from '../types';

interface FreightCalculatorProps {
    vehicles: Vehicle[];
    profile: UserProfile;
}

const FreightCalculator: React.FC<FreightCalculatorProps> = ({ vehicles, profile }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [dieselPrice, setDieselPrice] = useState(5.98);
    const [profitMargin, setProfitMargin] = useState(15);
    const [loadWeight, setLoadWeight] = useState(30);
    const [distance, setDistance] = useState(0);
    const [tolls, setTolls] = useState(0);
    const [axles, setAxles] = useState(2);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    const calculateRoute = async () => {
        if (!origin || !destination) {
            alert('Por favor, insira origem e destino.');
            return;
        }

        setIsAnalyzing(true);
        try {
            // 1. Geocoding (Nominatim)
            const getCoords = async (query: string) => {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`);
                const data = await res.json();
                if (data.length > 0) return { lat: data[0].lat, lon: data[0].lon };
                return null;
            };

            const originCoords = await getCoords(origin);
            const destCoords = await getCoords(destination);

            if (!originCoords || !destCoords) {
                alert('Não foi possível localizar as cidades informadas.');
                return;
            }

            // 2. Routing (OSRM)
            const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=false`);
            const routeData = await routeRes.json();

            if (routeData.routes && routeData.routes.length > 0) {
                const distKm = Math.round(routeData.routes[0].distance / 1000);
                setDistance(distKm);

                // 3. Toll Estimation (Heuristic for Brazil)
                // Avg price per axle every 60km approx R$ 7.50
                const estimatedTolls = Math.round((distKm / 60) * axles * 7.50);
                setTolls(estimatedTolls);
            }
        } catch (error) {
            console.error('Erro ao calcular rota:', error);
            alert('Erro ao conectar com o serviço de mapas.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const results = useMemo(() => {
        if (!distance || distance <= 0) return null;

        // Lógica de Complexidade Operacional
        const consumption = 2.2; // Média para um caminhão pesado carregado
        const dieselCost = (distance / consumption) * dieselPrice;

        // Custos Ocultos que profissionalizam o SaaS
        const tireWearPerKm = 0.45; // Estimativa R$ por KM
        const maintenanceProvision = 0.35; // R$ por KM
        const driverCommission = 0.12; // 12% do frete seco (estimativa)

        const operationalCosts = dieselCost + tolls + (distance * (tireWearPerKm + maintenanceProvision));

        // Reverse Math: Quanto eu preciso cobrar para ter X% de lucro LÍQUIDO?
        // Formula: Frete = Custos / (1 - Margem - Comissao)
        const suggestedFreight = operationalCosts / (1 - (profitMargin / 100) - driverCommission);
        const netProfit = suggestedFreight - operationalCosts - (suggestedFreight * driverCommission);

        return {
            dieselCost,
            operationalCosts,
            suggestedFreight,
            netProfit,
            tolls,
            tireWear: distance * tireWearPerKm,
            maintenance: distance * maintenanceProvision,
            commission: suggestedFreight * driverCommission
        };
    }, [distance, dieselPrice, profitMargin, tolls]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Calculator className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Calculadora de Frete</h1>
                            <p className="text-slate-400 font-medium italic">Simulador de precificação estratégica e lucratividade real.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                        <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">
                        <Share2 className="w-4 h-4" /> Compartilhar Cotação
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Painel de Inputs */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-500" /> Rota & Destino
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Origem</label>
                                    <input
                                        type="text"
                                        placeholder="Cidade de Partida..."
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Destino</label>
                                    <input
                                        type="text"
                                        placeholder="Cidade de Entrega..."
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>

                                <button
                                    onClick={calculateRoute}
                                    disabled={isAnalyzing}
                                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Analisando Rota...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="w-4 h-4" />
                                            Calcular Rota & Pedágios
                                        </>
                                    )}
                                </button>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Distância Calculada (Km)</label>
                                    <input
                                        type="number"
                                        value={distance}
                                        onChange={(e) => setDistance(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                    />
                                    <p className="text-[9px] text-emerald-500 font-bold ml-2 animate-pulse">
                                        ✨ Distância e pedágios calculados via Inteligência Ribeirx
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Número de Eixos</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[2, 3, 4, 6, 9].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setAxles(n)}
                                                className={`py-2 rounded-xl text-[10px] font-black transition-all ${axles === n ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-medium ml-2 uppercase">Ajuste para precisão no pedágio</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-500" /> Veículo & Carga
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                    value={selectedVehicleId}
                                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                                >
                                    <option value="">Selecione o Veículo</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Diesel (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={dieselPrice}
                                            onChange={(e) => setDieselPrice(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Margem (%)</label>
                                        <input
                                            type="number"
                                            value={profitMargin}
                                            onChange={(e) => setProfitMargin(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                <p className="text-[10px] text-emerald-400 font-medium leading-relaxed">
                                    Este simulador utiliza a **Matriz de Custos Ribeirx**, que inclui depreciação e manutenção preventiva por KM rodado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Painel de Resultados */}
                <div className="lg:col-span-8 space-y-8">
                    {results ? (
                        <div className="animate-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-500/20 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 space-y-2">
                                        <p className="text-[10px] font-black text-emerald-950/60 uppercase tracking-widest">Valor do Frete Sugerido</p>
                                        <h2 className="text-5xl font-black text-white tracking-tighter">R$ {results.suggestedFreight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                        <div className="flex items-center gap-2 pt-4">
                                            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Lucro Ideal</span>
                                            <span className="text-white/80 font-bold text-xs flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" /> +{profitMargin}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado Líquido Estimado</p>
                                        <span className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-black text-xs">
                                            R$
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-black text-emerald-500 tracking-tighter">
                                        R$ {results.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold mt-2 italic">Sobram limpos no seu bolso.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center text-sky-500">
                                            <Fuel className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Combustível</span>
                                    </div>
                                    <p className="text-xl font-black text-white">R$ {results.dieselCost.toLocaleString()}</p>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500" style={{ width: `${(results.dieselCost / results.suggestedFreight) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedágios</span>
                                    </div>
                                    <p className="text-xl font-black text-white">R$ {results.tolls.toLocaleString()}</p>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${(results.tolls / results.suggestedFreight) * 100}%` }} />
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comissão Mot.</span>
                                    </div>
                                    <p className="text-xl font-black text-white">R$ {results.commission.toLocaleString()}</p>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${(results.commission / results.suggestedFreight) * 100}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Detalhamento de Custos Invisíveis</h4>
                                    <div className="px-4 py-1.5 bg-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        O segredo da lucratividade
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-bold text-slate-300">Desgaste de Pneus (KM)</span>
                                            </div>
                                            <span className="font-black text-white">R$ {results.tireWear.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-bold text-slate-300">Provisão de Manutenção</span>
                                            </div>
                                            <span className="font-black text-white">R$ {results.maintenance.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 rounded-3xl p-6 flex items-center gap-4 border border-slate-800">
                                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white mb-1 tracking-tight">Análise de Risco Operacional</p>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium capitalize">
                                                Ao cobrar o frete sugerido, sua empresa protege a frota contra a desvalorização e garante caixa para futuras trocas de pneus e motor.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/40 border border-slate-800 border-dashed rounded-[3rem] p-12">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
                                <Calculator className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight uppercase">Pronto para o Cálculo?</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto">Insira a distância e escolha um veículo para ver a análise estratégica de rentabilidade.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FreightCalculator;
