
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
    const [driverCommissionPct, setDriverCommissionPct] = useState(profile.config?.percMotFrete || 12);
    const [loadWeight, setLoadWeight] = useState(30);
    const [distance, setDistance] = useState(0);
    const [tolls, setTolls] = useState(0);
    const [axles, setAxles] = useState(2);
    const [isChemical, setIsChemical] = useState(false);
    const [isLS, setIsLS] = useState(false);
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [applyDepreciation, setApplyDepreciation] = useState(profile.config?.calculateDepreciation ?? true);
    const [offeredFreight, setOfferedFreight] = useState(0);
    const [calculationCount, setCalculationCount] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Efeito para carregar limite de uso e preferências persistentes
    React.useEffect(() => {
        const usageData = localStorage.getItem(`freight_usage_${new Date().toDateString()}`);
        if (usageData) setCalculationCount(parseInt(usageData));

        const savedCommission = localStorage.getItem('freight_driver_commission');
        if (savedCommission) setDriverCommissionPct(Number(savedCommission));
    }, []);

    // Salvar comissão sempre que mudar
    React.useEffect(() => {
        localStorage.setItem('freight_driver_commission', driverCommissionPct.toString());
    }, [driverCommissionPct]);

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    const calculateRoute = async () => {
        if (!origin || !destination) {
            alert('Por favor, insira origem e destino.');
            return;
        }

        if (calculationCount >= 20) {
            alert('Limite diário de cálculos atingido (20/dia). Tente amanhã para proteger sua cota gratuita.');
            return;
        }

        setIsAnalyzing(true);
        // Chave oficial do sistema Ribeirx (OpenRouteService)
        const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY || "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExMWY4MTQ2MjMzZDQ0YTZhNjcwY2U3NDdlMmZhMGY1IiwiaCI6Im11cm11cjY0In0=";

        if (!apiKey || apiKey === 'undefined' || !apiKey.startsWith('ey')) {
            alert('Erro: Chave da API não configurada corretamente no sistema.');
            setIsAnalyzing(false);
            return;
        }

        try {
            // 1. Geocoding
            const geocode = async (text: string) => {
                const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(text)}&boundary.country=BR&size=1`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    return data.features[0].geometry.coordinates; // [lon, lat]
                }
                return null;
            };

            const originPoint = await geocode(origin);
            if (!originPoint) {
                alert(`Origem não encontrada: "${origin}".`);
                setIsAnalyzing(false);
                return;
            }

            const destPoint = await geocode(destination);
            if (!destPoint) {
                alert(`Destino não encontrado: "${destination}".`);
                setIsAnalyzing(false);
                return;
            }

            // 2. Routing
            const tryRoute = async (profile: string) => {
                const url = `https://api.openrouteservice.org/v2/directions/${profile}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': apiKey
                    },
                    body: JSON.stringify({
                        coordinates: [originPoint, destPoint]
                    })
                });
                return { status: res.status, data: await res.json() };
            };

            let { status, data } = await tryRoute('driving-hgv');

            if (status !== 200) {
                console.warn('HGV falhou, tentando Carro...');
                const fallback = await tryRoute('driving-car');
                status = fallback.status;
                data = fallback.data;
            }

            if (status === 200) {
                let distKm = 0;

                if (data.features && data.features.length > 0) {
                    distKm = Math.round(data.features[0].properties.summary.distance / 1000);
                } else if (data.routes && data.routes.length > 0) {
                    distKm = Math.round(data.routes[0].summary.distance / 1000);
                }

                if (distKm > 0) {
                    setDistance(distKm);

                    // 3. Toll Estimation (Ajustada para realidade Fernán Dias/Dutra)
                    const plazas = distKm / 60;
                    const pricePerPlaza = axles * 9.20;
                    setTolls(Math.round(plazas * pricePerPlaza));

                    // Atualizar limite de uso
                    const updatedCount = calculationCount + 1;
                    setCalculationCount(updatedCount);
                    localStorage.setItem(`freight_usage_${new Date().toDateString()}`, updatedCount.toString());
                    return;
                }
            }

            const errorDetail = data.error?.message || "Não foi possível extrair a distância da rota.";
            alert(`A API de mapas não conseguiu traçar esta rota: ${errorDetail}`);
        } catch (error) {
            console.error('Erro de conexão:', error);
            alert('Falha crítica de conexão. Verifique se você está online.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const results = useMemo(() => {
        if (!distance || distance <= 0) return null;

        // --- CALIBRAÇÃO LOGÍSTICA REAL (Matriz Ribeirx 2024 - Média Brasil) ---
        // Definimos parâmetros técnicos baseados no número de eixos como fallback
        const defaultConfig = {
            2: { consumption: 6.2, tireWear: 0.28, maintenance: 0.22 }, // 3/4 ou VUC
            3: { consumption: 4.0, tireWear: 0.48, maintenance: 0.38 }, // Toco/Truck
            4: { consumption: 3.1, tireWear: 0.72, maintenance: 0.58 }, // Bitruck
            6: { consumption: 2.2, tireWear: 1.18, maintenance: 0.95 }, // Carreta LS
            9: { consumption: 1.7, tireWear: 1.88, maintenance: 1.38 }, // Rodotrem
        };

        const config = defaultConfig[axles as keyof typeof defaultConfig] || defaultConfig[6];

        // Detecção Inteligente por Modelo (Mercedes, Volvo, Scania, etc)
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        let technicalParams = { ...config };

        if (vehicle) {
            const fullName = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.name}`.toLowerCase();

            // Refinamento por modelos específicos (Média Real Brasil)
            if (fullName.includes('actros') || fullName.includes('fh 540') || fullName.includes('scania r')) {
                technicalParams = { consumption: 2.3, tireWear: 1.12, maintenance: 0.88 };
            } else if (fullName.includes('axor') || fullName.includes('fh 460') || fullName.includes('vm 330')) {
                technicalParams = { consumption: 2.5, tireWear: 1.05, maintenance: 0.78 };
            } else if (fullName.includes('constellation') || fullName.includes('vm 270')) {
                technicalParams = { consumption: 3.2, tireWear: 0.78, maintenance: 0.62 };
            } else if (fullName.includes('atego') || fullName.includes('accelo')) {
                technicalParams = { consumption: 5.5, tireWear: 0.35, maintenance: 0.28 };
            } else if (fullName.includes('delivery')) {
                technicalParams = { consumption: 7.2, tireWear: 0.22, maintenance: 0.18 };
            }
        }

        const calcDistance = isRoundTrip ? distance * 2 : distance;
        const calcTolls = isRoundTrip ? tolls * 2 : tolls;

        const baseDieselCost = (calcDistance / technicalParams.consumption) * dieselPrice;
        const chemicalAditional = isChemical ? 1.20 : 1.0; // +20% para carga química
        const lsAditional = isLS ? 1.15 : 1.0; // +15% para carga LS (Escolta/Seguro)
        const totalAditional = chemicalAditional * lsAditional;

        // Custos por KM (Pneus + Manutenção Preventiva)
        const tireWearTotal = calcDistance * technicalParams.tireWear;
        const maintenanceTotal = calcDistance * technicalParams.maintenance;

        // Outros custos (Seguro Carga, Aditamentos, Impostos base ~8%)
        const operationalFees = (baseDieselCost + calcTolls) * 0.08;

        const driverCommission = driverCommissionPct / 100;
        const fixedOperationalCosts = baseDieselCost + calcTolls +
            (applyDepreciation ? (tireWearTotal + maintenanceTotal) : 0) +
            operationalFees;

        // Reverse Math para Margem de Lucro LÍQUIDA
        const suggestedFreight = (fixedOperationalCosts / (1 - (profitMargin / 100) - driverCommission)) * totalAditional;

        // Comparação com o Frete Ofertado
        const realProfitWithOffer = offeredFreight > 0
            ? (offeredFreight - fixedOperationalCosts - (offeredFreight * driverCommission))
            : (suggestedFreight - fixedOperationalCosts - (suggestedFreight * driverCommission));

        const profitPercentage = offeredFreight > 0
            ? (realProfitWithOffer / offeredFreight) * 100
            : profitMargin;

        let status: 'excellent' | 'acceptable' | 'warning' | 'danger' = 'excellent';
        if (profitPercentage >= profitMargin) status = 'excellent';
        else if (profitPercentage > 5) status = 'acceptable';
        else if (profitPercentage > 0) status = 'warning';
        else status = 'danger';

        // Ribeirx AI - Sistema de Dicas Especialistas
        const aiAnalysis = () => {
            const tips = [];
            if (profitPercentage < 5) tips.push("⚠️ Risco Crítico: Este frete mal cobre o diesel e a manutenção. Só aceite se for para voltar vazio.");
            if (profitPercentage >= profitMargin) tips.push("🚀 Excelente Negócio: O valor cobre todos os custos invisíveis e sobra lucro real.");
            if (isChemical && profitPercentage < 20) tips.push("⚠️ Alerta Químico: O risco de carga perigosa exige uma margem maior (min. 20%).");
            if (isLS && profitPercentage < 15) tips.push("🛡️ Alerta LS: Carga monitorada exige atenção redobrada aos custos de seguro e tempo de parada.");
            if (technicalParams.consumption < 2.0) tips.push("⛽ Consumo Elevado: Verifique se a rota possui muitas serras ou se o veículo está com excesso de peso.");
            if (isRoundTrip) tips.push("🔄 Ciclo Completo: Análise considerando ida e volta (percurso total).");
            if (!applyDepreciation) tips.push("⚠️ Análise Simplificada: Pneus e manutenção não estão sendo abatidos do lucro líquido.");

            return tips.length > 0 ? tips : ["✅ Operação dentro dos padrões de normalidade da frota."];
        };

        return {
            dieselCost: baseDieselCost,
            operationalCosts: fixedOperationalCosts,
            suggestedFreight,
            netProfit: realProfitWithOffer,
            tolls: calcTolls,
            tireWear: tireWearTotal,
            maintenance: maintenanceTotal,
            commission: (offeredFreight > 0 ? offeredFreight : suggestedFreight) * driverCommission,
            profitPercentage,
            status,
            aiTips: aiAnalysis()
        };
    }, [distance, dieselPrice, profitMargin, driverCommissionPct, tolls, axles, isChemical, isLS, isRoundTrip, applyDepreciation, offeredFreight]);

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

                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer" onClick={() => setIsRoundTrip(!isRoundTrip)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRoundTrip ? 'bg-sky-500/20 text-sky-500' : 'bg-slate-900 text-slate-600'}`}>
                                            <Share2 className="w-5 h-5 rotate-90" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Bate e Volta (Ida e Volta)</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">Dobra os custos (diesel, pedágio...)</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${isRoundTrip ? 'bg-sky-500' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRoundTrip ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer" onClick={() => setApplyDepreciation(!applyDepreciation)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${applyDepreciation ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-900 text-slate-600'}`}>
                                            <TrendingUp className="w-5 h-5 transition-transform group-hover:scale-110" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Abater Pneu/Manut.</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">{applyDepreciation ? 'Custos invisíveis ativados' : 'Ignorando depreciação'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${applyDepreciation ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${applyDepreciation ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer" onClick={() => setIsChemical(!isChemical)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isChemical ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-900 text-slate-600'}`}>
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Carga Química / Perigosa</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">+20% de Adicional</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${isChemical ? 'bg-amber-500' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isChemical ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer" onClick={() => setIsLS(!isLS)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLS ? 'bg-sky-500/20 text-sky-500' : 'bg-slate-900 text-slate-600'}`}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Carga LS / Monitorada</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase">+15% de Adicional</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${isLS ? 'bg-sky-500' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLS ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Valor Ofertado pela Transportadora (R$)</label>
                                            <span className="text-[9px] font-black text-sky-400 uppercase">Input Manual</span>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Ex: 7250"
                                            value={offeredFreight || ''}
                                            onChange={(e) => setOfferedFreight(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-sky-500 outline-none transition-all placeholder:text-slate-700"
                                        />
                                        <p className="text-[9px] text-slate-600 font-medium ml-2 uppercase">Compare a oferta com seus custos reais</p>
                                    </div>
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Comissão Mot. (%)</label>
                                        <input
                                            type="number"
                                            value={driverCommissionPct}
                                            onChange={(e) => setDriverCommissionPct(Number(e.target.value))}
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
                                    <div className="relative z-10 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-950/60 uppercase tracking-widest">Valor do Frete Sugerido</p>
                                            <h2 className="text-5xl font-black text-white tracking-tighter">R$ {results.suggestedFreight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-950/50 uppercase mb-1">Lucro Líquido Real</p>
                                                <p className="text-xl font-black text-white">
                                                    R$ {(results.suggestedFreight - results.operationalCosts - (results.suggestedFreight * (driverCommissionPct / 100))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-950/50 uppercase mb-1">Preço por KM</p>
                                                <p className="text-xl font-black text-white">
                                                    R$ {(results.suggestedFreight / (isRoundTrip ? distance * 2 : distance)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <div className="px-3 py-1 bg-white/20 rounded-full flex items-center gap-1.5">
                                                <TrendingUp className="w-3 h-3 text-white" />
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest">+{profitMargin}% Margem</span>
                                            </div>
                                            {isRoundTrip && (
                                                <div className="px-3 py-1 bg-emerald-900/30 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                                                    🔄 Ida e Volta ({distance * 2}km)
                                                </div>
                                            )}
                                            {(isChemical || isLS) && (
                                                <div className="px-3 py-1 bg-amber-400/20 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                                                    ⚠️ Com Adicionais
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-center relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resultado Líquido Estimado</p>
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${results.status === 'excellent' ? 'bg-emerald-500/10 text-emerald-500' :
                                            results.status === 'acceptable' ? 'bg-sky-500/10 text-sky-500' :
                                                results.status === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-rose-500/10 text-rose-500'
                                            }`}>
                                            R$
                                        </span>
                                    </div>
                                    <h2 className={`text-4xl font-black tracking-tighter ${results.status === 'excellent' ? 'text-emerald-500' :
                                        results.status === 'acceptable' ? 'text-sky-500' :
                                            results.status === 'warning' ? 'text-amber-500' :
                                                'text-rose-500'
                                        }`}>
                                        R$ {results.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-[10px] text-slate-400 font-bold italic">Sobram limpos no seu bolso.</p>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${results.status === 'excellent' ? 'bg-emerald-500/20 text-emerald-500' :
                                            results.status === 'acceptable' ? 'bg-sky-500/20 text-sky-500' :
                                                results.status === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                                                    'bg-rose-500/20 text-rose-500'
                                            }`}>
                                            {results.status === 'excellent' ? 'Ótima Oferta' :
                                                results.status === 'acceptable' ? 'Aceitável' :
                                                    results.status === 'warning' ? 'Atenção' : 'Evite (Prejuízo)'}
                                        </span>
                                    </div>

                                    {/* Barra de Viabilidade Visual */}
                                    <div className="mt-6 flex items-center gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-1000 ${i === 1 && (results.status === 'danger' || results.status === 'warning' || results.status === 'acceptable' || results.status === 'excellent') ? (results.status === 'danger' ? 'bg-rose-500 shadow-lg shadow-rose-500/40' : 'bg-slate-700') :
                                                    i === 2 && (results.status === 'warning' || results.status === 'acceptable' || results.status === 'excellent') ? (results.status === 'warning' ? 'bg-amber-500 shadow-lg shadow-amber-500/40' : 'bg-slate-700') :
                                                        i === 3 && (results.status === 'acceptable' || results.status === 'excellent') ? (results.status === 'acceptable' ? 'bg-sky-500 shadow-lg shadow-sky-500/40' : 'bg-slate-700') :
                                                            i === 4 && (results.status === 'excellent') ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-slate-800'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Ribeirx AI Insight Box */}
                                    <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Análise de IA Ribeirx</span>
                                        </div>
                                        {results.aiTips.map((tip, idx) => (
                                            <p key={idx} className="text-[10px] text-white font-medium leading-relaxed">• {tip}</p>
                                        ))}
                                    </div>
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

                            </div>

                            {/* Detalhamento Visual de Custos (Onde o dinheiro vai?) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in slide-in-from-bottom duration-1000">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">Radiografia do Frete</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Para onde vai cada real do valor total?</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-emerald-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Seu Lucro</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-sky-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Custos Diretos</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-amber-500/50" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Custos Invisíveis</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* Gráfico de Barras Empilhadas */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Estrutura do Frete {offeredFreight > 0 ? 'Ofertado' : 'Sugerido'}</span>
                                            <span className="text-white">R$ {(offeredFreight > 0 ? offeredFreight : results.suggestedFreight).toLocaleString()}</span>
                                        </div>
                                        <div className="h-10 w-full bg-slate-950 rounded-2xl overflow-hidden flex p-1 border border-slate-800/50">
                                            {/* Diesel */}
                                            <div
                                                className="h-full bg-sky-500 rounded-l-xl transition-all duration-1000 hover:brightness-110 relative group"
                                                style={{ width: `${(results.dieselCost / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }}
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    Diesel: {Math.round((results.dieselCost / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%
                                                </div>
                                            </div>
                                            {/* Pedágio */}
                                            <div
                                                className="h-full bg-rose-500 border-l border-slate-950 transition-all duration-1000 hover:brightness-110 relative group"
                                                style={{ width: `${(results.tolls / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }}
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    Pedágio: {Math.round((results.tolls / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%
                                                </div>
                                            </div>
                                            {/* Comissão */}
                                            <div
                                                className="h-full bg-amber-500 border-l border-slate-950 transition-all duration-1000 hover:brightness-110 relative group"
                                                style={{ width: `${(results.commission / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }}
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    Comissão: {Math.round((results.commission / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%
                                                </div>
                                            </div>
                                            {/* Manuf/Pneus (Invisíveis) */}
                                            <div
                                                className="h-full bg-slate-700 border-l border-slate-950 transition-all duration-1000 hover:brightness-110 relative group"
                                                style={{ width: `${((results.tireWear + results.maintenance) / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }}
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    Invisíveis (Pneu/Manut): {Math.round(((results.tireWear + results.maintenance) / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%
                                                </div>
                                            </div>
                                            {/* Lucro Líquido */}
                                            <div
                                                className={`h-full border-l border-slate-950 transition-all duration-1000 hover:brightness-110 relative group rounded-r-xl ${results.netProfit > 0 ? 'bg-emerald-500' : 'bg-rose-900'}`}
                                                style={{ width: `${Math.max(2, (results.netProfit / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%` }}
                                            >
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-black">
                                                    LUCRO REAL: R$ {results.netProfit.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista de Engolidores de Dinheiro */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all group">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Câmbio de Diesel</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-white">R$ {results.dieselCost.toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-sky-400">{Math.round((results.dieselCost / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%</span>
                                            </div>
                                            <div className="mt-2 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-sky-500" style={{ width: `${(results.dieselCost / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Mão de Obra ({driverCommissionPct}%)</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-white">R$ {results.commission.toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-amber-500">{Math.round((results.commission / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%</span>
                                            </div>
                                            <div className="mt-2 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: `${(results.commission / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-emerald-500/30 transition-all">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Custos de "Ferro" (Pneu/Mnt)</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-white">R$ {(results.tireWear + results.maintenance).toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-slate-400">{Math.round(((results.tireWear + results.maintenance) / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%</span>
                                            </div>
                                            <div className="mt-2 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-600" style={{ width: `${((results.tireWear + results.maintenance) / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-pulse">
                                            <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Liquidez (Bolso)</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-emerald-400">R$ {results.netProfit.toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-emerald-500">{Math.round((results.netProfit / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100)}%</span>
                                            </div>
                                            <div className="mt-2 h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${results.netProfit > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(results.netProfit / (offeredFreight > 0 ? offeredFreight : results.suggestedFreight)) * 100}%` }} />
                                            </div>
                                        </div>
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
