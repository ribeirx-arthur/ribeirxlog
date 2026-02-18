import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Key,
    Mail,
    Phone,
    MapPin,
    CheckCircle,
    XCircle,
    Copy,
    Send,
    Eye,
    EyeOff,
    Shield,
    Activity,
    Clock,
    TrendingUp,
    AlertCircle,
    X,
    Save,
    Truck,
    Edit3,
    Trash2
} from 'lucide-react';
import { Driver, Trip, TripProof, VehicleLocation, Vehicle } from '../types';
import { supabase } from '../services/supabase';

interface DriverManagementProps {
    drivers: Driver[];
    vehicles: Vehicle[];
    onAddDriver: (driver: Partial<Driver>) => Promise<void> | void;
    onUpdateDriver: (driver: Driver) => Promise<void> | void;
    onDeleteDriver: (id: string) => Promise<void> | void;
}

const DriverManagement: React.FC<DriverManagementProps> = ({ drivers, vehicles, onAddDriver, onUpdateDriver, onDeleteDriver }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [driverStats, setDriverStats] = useState<Record<string, any>>({});

    // Add Driver Modal State
    const [isSaving, setIsSaving] = useState(false);
    const [newDriver, setNewDriver] = useState<Partial<Driver>>({
        name: '',
        cpf: '',
        phone: '',
        cnh: '',
        cnhCategory: 'E',
        status: 'Ativo'
    });

    const handleSaveDriver = async () => {
        setIsSaving(true);
        await onAddDriver(newDriver);
        setShowAddModal(false);
        setIsSaving(false);
        setNewDriver({ name: '', cpf: '', phone: '', cnh: '', status: 'Ativo', cnhCategory: 'E' });
    };

    // Load driver statistics
    useEffect(() => {
        loadDriverStats();
    }, [drivers]);

    const loadDriverStats = async () => {
        const stats: Record<string, any> = {};

        for (const driver of drivers) {
            // Get trips count
            const { count: tripsCount } = await supabase
                .from('trips')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', driver.id);

            // Get active trip
            const { data: activeTrip } = await supabase
                .from('trips')
                .select('*')
                .eq('driver_id', driver.id)
                .neq('status', 'Pago')
                .single();

            // Get last location
            const { data: lastLocation } = await supabase
                .from('vehicle_locations')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            stats[driver.id] = {
                tripsCount: tripsCount || 0,
                activeTrip,
                lastLocation,
                lastSeen: driver.lastLogin ? new Date(driver.lastLogin) : null,
            };
        }

        setDriverStats(stats);
    };

    const generateDriverAccess = async (driver: Driver) => {
        // Generate unique access token
        const accessToken = `drv_${driver.id}_${Date.now()}`;

        // Update driver with access
        const { error } = await supabase
            .from('drivers')
            .update({
                has_app_access: true,
                access_token: accessToken,
            })
            .eq('id', driver.id);

        if (!error) {
            const link = `${window.location.origin}/driver/login?token=${accessToken}`;
            setGeneratedLink(link);
            setShowAccessModal(true);
            onUpdateDriver({ ...driver, hasAppAccess: true, accessToken });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Link copiado!');
    };

    const sendAccessViaWhatsApp = (driver: Driver, link: string) => {
        const message = `Olá ${driver.name}! 👋\n\nSeu acesso ao Ribeirx Driver está pronto!\n\n🔗 Link de acesso:\n${link}\n\n📱 Instruções:\n1. Abra o link no seu celular\n2. Adicione à tela inicial\n3. Faça login com suas credenciais\n\nQualquer dúvida, estou à disposição!`;

        const whatsappUrl = `https://wa.me/55${driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const revokeAccess = async (driver: Driver) => {
        const { error } = await supabase
            .from('drivers')
            .update({
                has_app_access: false,
                access_token: null,
            })
            .eq('id', driver.id);

        if (!error) {
            onUpdateDriver({ ...driver, hasAppAccess: false, accessToken: undefined });
            alert('Acesso revogado com sucesso!');
        }
    };

    const getDriverStatus = (driver: Driver) => {
        const stats = driverStats[driver.id];
        if (!stats) return { status: 'offline', label: 'Offline', color: 'slate' };

        if (stats.activeTrip) {
            return { status: 'active', label: 'Em Viagem', color: 'emerald' };
        }

        if (stats.lastSeen) {
            const hoursSinceLastSeen = (Date.now() - stats.lastSeen.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastSeen < 1) {
                return { status: 'online', label: 'Online', color: 'sky' };
            }
        }

        return { status: 'offline', label: 'Offline', color: 'slate' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Gestão de Motoristas</h2>
                    <p className="text-slate-400 text-sm mt-1">Controle total sobre acessos e permissões</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/20"
                >
                    <UserPlus className="w-5 h-5" /> Adicionar Motorista
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Total</span>
                    </div>
                    <p className="text-3xl font-black text-white">{drivers.length}</p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                            <Activity className="w-5 h-5 text-sky-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Ativos</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {drivers.filter(d => d.status === 'Ativo').length}
                    </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Com Acesso</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {drivers.filter(d => d.hasAppAccess).length}
                    </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Em Viagem</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {Object.values(driverStats).filter((s: any) => s.activeTrip).length}
                    </p>
                </div>
            </div>

            {/* Drivers List */}
            <div className="grid grid-cols-1 gap-4">
                {drivers.map((driver) => {
                    const status = getDriverStatus(driver);
                    const stats = driverStats[driver.id] || {};

                    return (
                        <div
                            key={driver.id}
                            className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 hover:bg-slate-800/60 transition-all group"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                {/* Driver Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden">
                                            {driver.photoUrl ? (
                                                <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-black text-slate-500">
                                                    {driver.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 bg-${status.color}-500 rounded-full border-2 border-slate-800`} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-black text-white">{driver.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black bg-${status.color}-500/10 text-${status.color}-400`}>
                                                {status.label}
                                            </span>
                                            {driver.hasAppAccess && (
                                                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-400">
                                                    <Shield className="w-3 h-3 inline mr-1" />
                                                    Acesso App
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Phone className="w-4 h-4" />
                                                <span>{driver.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <MapPin className="w-4 h-4" />
                                                <span>CNH: {driver.cnh}</span>
                                            </div>
                                            {stats.lastSeen && (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Visto {stats.lastSeen.toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-3">
                                            {driver.vehicleId ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-xl text-xs font-bold text-white">
                                                    <Truck className="w-3.5 h-3.5 text-emerald-500" />
                                                    {vehicles.find(v => v.id === driver.vehicleId)?.plate || 'Veículo ñ encontrado'}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] uppercase font-black text-amber-500 tracking-wider">
                                                    Sem veículo vinculado
                                                </div>
                                            )}
                                        </div>

                                        {stats.activeTrip && (
                                            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                                <p className="text-xs text-emerald-400 font-bold mb-1">🚛 Viagem Ativa</p>
                                                <p className="text-sm text-white font-bold">{stats.activeTrip.destination}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setEditingDriver(driver)}
                                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl transition-all text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-500/20"
                                        title="Editar Motorista"
                                    >
                                        <Edit3 className="w-4 h-4" /> CONFIGURAR / EDITAR
                                    </button>

                                    {driver.hasAppAccess ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const link = `${window.location.origin}/driver/login?token=${driver.accessToken}`;
                                                    copyToClipboard(link);
                                                }}
                                                className="px-4 py-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400 hover:bg-sky-500/20 transition-all text-sm font-bold flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" /> Copiar Link
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const link = `${window.location.origin}/driver/login?token=${driver.accessToken}`;
                                                    sendAccessViaWhatsApp(driver, link);
                                                }}
                                                className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-bold flex items-center gap-2"
                                            >
                                                <Send className="w-4 h-4" /> WhatsApp
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => generateDriverAccess(driver)}
                                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                        >
                                            <Key className="w-4 h-4" /> Gerar Acesso
                                        </button>
                                    )}

                                    <button
                                        onClick={() => onDeleteDriver(driver.id)}
                                        className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 transition-all"
                                        title="Excluir Motorista"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Access Modal */}
            {showAccessModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Acesso Gerado com Sucesso!</h3>
                            <p className="text-slate-400">Envie este link para o motorista</p>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
                            <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Link de Acesso</p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-sm"
                                />
                                <button
                                    onClick={() => copyToClipboard(generatedLink)}
                                    className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAccessModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-bold"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedDriver) {
                                        sendAccessViaWhatsApp(selectedDriver, generatedLink);
                                    }
                                    setShowAccessModal(false);
                                }}
                                className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" /> Enviar via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Driver Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">Novo Motorista</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João da Silva"
                                    value={newDriver.name}
                                    onChange={e => setNewDriver({ ...newDriver, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF</label>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    value={newDriver.cpf}
                                    onChange={e => setNewDriver({ ...newDriver, cpf: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    placeholder="(11) 99999-9999"
                                    value={newDriver.phone}
                                    onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CNH</label>
                                    <input
                                        type="text"
                                        placeholder="Número CNH"
                                        value={newDriver.cnh}
                                        onChange={e => setNewDriver({ ...newDriver, cnh: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: E"
                                        value={newDriver.cnhCategory}
                                        onChange={e => setNewDriver({ ...newDriver, cnhCategory: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Caminhão Vinculado (Fixo)</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none"
                                    value={newDriver.vehicleId || ''}
                                    onChange={e => setNewDriver({ ...newDriver, vehicleId: e.target.value || undefined })}
                                >
                                    <option value="">Nenhum</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSaveDriver}
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSaving ? 'Salvando...' : <><Save className="w-5 h-5" /> Cadastrar Motorista</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Driver Modal */}
            {editingDriver && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-white">Editar Motorista</h3>
                            <button onClick={() => setEditingDriver(null)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={editingDriver.name}
                                    onChange={e => setEditingDriver({ ...editingDriver, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF</label>
                                    <input
                                        type="text"
                                        value={editingDriver.cpf}
                                        onChange={e => setEditingDriver({ ...editingDriver, cpf: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={editingDriver.phone}
                                        onChange={e => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CNH</label>
                                    <input
                                        type="text"
                                        value={editingDriver.cnh}
                                        onChange={e => setEditingDriver({ ...editingDriver, cnh: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Categoria</label>
                                    <input
                                        type="text"
                                        value={editingDriver.cnhCategory}
                                        onChange={e => setEditingDriver({ ...editingDriver, cnhCategory: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Caminhão Vinculado (Fixo)</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none appearance-none"
                                    value={editingDriver.vehicleId || ''}
                                    onChange={e => setEditingDriver({ ...editingDriver, vehicleId: e.target.value || undefined })}
                                >
                                    <option value="">Nenhum</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    await onUpdateDriver(editingDriver);
                                    setEditingDriver(null);
                                    setIsSaving(false);
                                }}
                                disabled={isSaving}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isSaving ? 'Salvando...' : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverManagement;
