
import React, { useState, useMemo } from 'react';
import {
    ShieldCheck,
    AlertTriangle,
    FileText,
    Share2,
    Calendar,
    Clock,
    CheckCircle2,
    ExternalLink,
    Info,
    Truck,
    Download,
    MessageSquare,
    Search
} from 'lucide-react';
import { Vehicle, Driver } from '../types';

interface AssetComplianceProps {
    vehicles: Vehicle[];
    drivers: Driver[];
}

const AssetCompliance: React.FC<AssetComplianceProps> = ({ vehicles, drivers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const filteredVehicles = vehicles.filter(v =>
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const checkValidity = (dateStr?: string) => {
        if (!dateStr) return 'missing';
        const today = new Date();
        const validity = new Date(dateStr);
        const diffTime = validity.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= 30) return 'warning';
        return 'valid';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'expired': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-slate-600" />;
        }
    };

    const handleShareDocs = (vehicle: Vehicle) => {
        const driver = drivers.find(d => d.vehicleId === vehicle.id);
        const text = `*HUB DE DOCUMENTOS - RIBEIRX LOG*\n\n` +
            `🚛 *Veículo:* ${vehicle.plate} (${vehicle.name})\n` +
            `👤 *Motorista:* ${driver?.name || 'Não vinculado'}\n\n` +
            `📄 *Status de Compliance:*\n` +
            `• ANTT: ${vehicle.anttNumber || 'N/A'}\n` +
            `• Venc. ANTT: ${vehicle.anttValidity || 'N/A'}\n` +
            `• Venc. Tacógrafo: ${vehicle.tacografoValidity || 'N/A'}\n` +
            `• Venc. Licenciamento: ${vehicle.licensingValidity || 'N/A'}\n\n` +
            `🔗 *Acesso aos arquivos:* [Portal Ribeirx Log]`;

        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const stats = useMemo(() => {
        let issues = 0;
        vehicles.forEach(v => {
            if (checkValidity(v.anttValidity) !== 'valid') issues++;
            if (checkValidity(v.tacografoValidity) !== 'valid') issues++;
            if (checkValidity(v.licensingValidity) !== 'valid') issues++;
        });
        return { total: vehicles.length, issues };
    }, [vehicles]);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-32">
            {/* Header Neural */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <ShieldCheck className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Compliance Hub</h2>
                        <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase mt-3">Active Asset Protection & Document Wallet</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-3xl text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status da Frota</p>
                        <p className={`text-2xl font-black ${stats.issues === 0 ? 'text-emerald-500' : 'text-amber-500'} tracking-tighter`}>
                            {stats.issues === 0 ? 'Protegida' : `${stats.issues} Pendências`}
                        </p>
                    </div>
                </div>
            </header>

            {/* Dash Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Card Buscador */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col gap-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Search className="w-5 h-5 text-emerald-500" /> Seleção de Ativo
                    </h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar Placa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black outline-none focus:border-emerald-500/50 transition-all text-sm"
                        />
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        {filteredVehicles.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVehicleId(v.id)}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedVehicleId === v.id ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="text-left">
                                    <p className={`text-sm font-black ${selectedVehicleId === v.id ? 'text-emerald-950' : 'text-white'}`}>{v.plate}</p>
                                    <p className={`text-[10px] font-bold uppercase ${selectedVehicleId === v.id ? 'text-emerald-900' : 'text-slate-500'}`}>{v.name}</p>
                                </div>
                                <Truck className={`w-4 h-4 ${selectedVehicleId === v.id ? 'text-emerald-950' : 'text-slate-700'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detalhes de Compliance */}
                <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/80 rounded-[3.5rem] p-10 relative overflow-hidden">
                    {selectedVehicleId ? (() => {
                        const v = vehicles.find(veh => veh.id === selectedVehicleId);
                        if (!v) return null;

                        return (
                            <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">{v.plate} — Compliance Status</h3>
                                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">{v.brand} {v.model} ({v.year})</p>
                                    </div>
                                    <button
                                        onClick={() => handleShareDocs(v)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                                    >
                                        <Share2 className="w-4 h-4" /> Enviar Kit Compliance
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Lista de Documentos */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Documentação Veicular</h4>
                                        <ComplianceItem label="Registro ANTT" value={v.anttNumber || '---'} validity={v.anttValidity} status={checkValidity(v.anttValidity)} icon={FileText} />
                                        <ComplianceItem label="Aferição Tacógrafo" value="Certificado Inmetro" validity={v.tacografoValidity} status={checkValidity(v.tacografoValidity)} icon={Clock} />
                                        <ComplianceItem label="Licenciamento / CRLV-e" value={v.renavam || '---'} validity={v.licensingValidity} status={checkValidity(v.licensingValidity)} icon={Calendar} />
                                        <ComplianceItem label="Seguro Obrigatório/Carga" value={v.insurancePolicy || '---'} validity={v.insuranceValidity} status={checkValidity(v.insuranceValidity)} icon={ShieldCheck} />
                                    </div>

                                    {/* Preview Cloud */}
                                    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 border border-slate-800">
                                            <FileText className="w-12 h-12" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white uppercase tracking-tighter">Digital Wallet</h4>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Arquivos prontos para embarque</p>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <button className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-black text-slate-400 hover:text-white transition-all group">
                                                <span className="flex items-center gap-3"><FileText className="w-4 h-4 text-emerald-500" /> CRLV_DIGITAL.pdf</span>
                                                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                            <button className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-black text-slate-400 hover:text-white transition-all group">
                                                <span className="flex items-center gap-3"><FileText className="w-4 h-4 text-emerald-500" /> CERT_ANTT.pdf</span>
                                                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-start gap-6">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0"><Info className="w-6 h-6" /></div>
                                    <div>
                                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Dica Estratégica</p>
                                        <p className="text-indigo-200/60 text-sm leading-relaxed">
                                            Manter o cronotacógrafo em dia evita multas de natureza grave sob o Art. 230 do CTB. O Ribeirx Log avisará você 15 dias antes do vencimento para agendar a aferição.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 opacity-30">
                            <ShieldCheck className="w-20 h-20 text-slate-700 animate-pulse" />
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Central de Blindagem</h3>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto mt-2">
                                    Selecione um ativo ao lado para auditar a documentação legal e compartilhar certificados.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ComplianceItem = ({ label, value, validity, status, icon: Icon }: any) => {
    const getStatusText = (status: string) => {
        if (status === 'valid') return 'EM DIA';
        if (status === 'warning') return 'ATENÇÃO';
        if (status === 'expired') return 'VENCIDO';
        return 'AGUARDANDO';
    };

    const getStatusColor = (status: string) => {
        if (status === 'valid') return 'text-emerald-500';
        if (status === 'warning') return 'text-amber-500';
        if (status === 'expired') return 'text-rose-500';
        return 'text-slate-600';
    };

    return (
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-[2rem] hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform"><Icon className="w-6 h-6" /></div>
                    <div>
                        <p className="text-xs font-medium text-white">{label}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{value}</p>
                    </div>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-700" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vencimento:</span>
                    <span className={`text-[10px] font-black ${status === 'expired' ? 'text-rose-500' : 'text-white'}`}>
                        {validity ? new Date(validity).toLocaleDateString() : 'Não definido'}
                    </span>
                </div>
                <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-700 hover:text-emerald-500 transition-all shadow-inner">
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export default AssetCompliance;
