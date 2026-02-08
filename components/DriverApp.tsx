import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Camera,
    PlayCircle,
    StopCircle,
    FileText,
    Wallet,
    Clock,
    Navigation,
    Upload,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Fuel,
    Receipt,
    Package,
    LogOut
} from 'lucide-react';
import { Trip, Driver, TripProof, VehicleLocation } from '../types';
import { supabase } from '../services/supabase';

interface DriverAppProps {
    driver: Driver;
    currentTrip: Trip | null;
    onLogout: () => void;
}

type DriverView = 'home' | 'gps' | 'proofs' | 'history' | 'earnings';

const DriverApp: React.FC<DriverAppProps> = ({ driver, currentTrip, onLogout }) => {
    const [currentView, setCurrentView] = useState<DriverView>('home');
    const [isTracking, setIsTracking] = useState(false);
    const [lastLocation, setLastLocation] = useState<VehicleLocation | null>(null);
    const [proofs, setProofs] = useState<TripProof[]>([]);
    const [uploading, setUploading] = useState(false);
    const [earnings, setEarnings] = useState({ pending: 0, paid: 0, total: 0 });

    // GPS Tracking Logic
    useEffect(() => {
        let watchId: number;
        if (isTracking && driver.accessToken) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed, heading } = position.coords;

                    // Visual feedback
                    setLastLocation({
                        id: 'local',
                        vehicleId: 'local',
                        timestamp: new Date().toISOString(),
                        latitude,
                        longitude,
                        speed: speed || 0,
                        heading: heading || 0
                    });

                    // Send to backend via RPC
                    supabase.rpc('update_location', {
                        p_driver_token: driver.accessToken,
                        p_lat: latitude,
                        p_long: longitude,
                        p_speed: speed || 0,
                        p_heading: heading || 0
                    }).then(({ error }) => {
                        if (error) console.error("GPS Sync Error:", error);
                    });
                },
                (error) => console.error("GPS Error:", error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isTracking, driver.accessToken]);

    // Load proofs
    useEffect(() => {
        if (currentTrip) {
            loadProofs();
        }
    }, [currentTrip]);

    const loadProofs = async () => {
        if (!currentTrip) return;
        const { data } = await supabase
            .from('trip_proofs')
            .select('*')
            .eq('trip_id', currentTrip.id)
            .order('uploaded_at', { ascending: false });
        if (data) setProofs(data);
    };

    const handleFileUpload = async (file: File, type: TripProof['type']) => {
        if (!currentTrip) return;

        setUploading(true);
        try {
            // 1. Retrieve session token
            const sessionStr = localStorage.getItem('driver_session');
            if (!sessionStr) throw new Error("Sessão inválida");
            const { token } = JSON.parse(sessionStr);

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTrip.id}/${type}_${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('trip-proofs')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Storage Error:", uploadError);
                throw new Error("Falha no upload do arquivo. Verifique permissões.");
            }

            // 3. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('trip-proofs')
                .getPublicUrl(fileName);

            // 4. Save proof record via Secure RPC
            const { error: rpcError } = await supabase.rpc('submit_trip_proof', {
                p_driver_token: token,
                p_trip_id: currentTrip.id,
                p_type: type,
                p_file_url: publicUrl,
                p_file_name: file.name,
                p_file_size: file.size,
                p_description: `Upload via Driver App - ${type}`,
                p_amount: 0
            });

            if (rpcError) throw rpcError;

            await loadProofs();
            alert('Comprovante enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar comprovante:', error);
            alert('Erro ao enviar comprovante. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const startTrip = async () => {
        if (!currentTrip || !driver.accessToken) return;

        const { error } = await supabase.rpc('driver_start_trip', {
            p_driver_token: driver.accessToken,
            p_trip_id: currentTrip.id
        });

        if (!error) {
            alert('Viagem iniciada com sucesso! O rastreamento GPS foi ativado.');
            setIsTracking(true);
            window.location.reload(); // Refresh to update UI state
        } else {
            alert('Erro ao iniciar viagem: ' + error.message);
        }
    };

    const endTrip = async () => {
        if (!currentTrip || !driver.accessToken) return;

        const { error } = await supabase.rpc('driver_end_trip', {
            p_driver_token: driver.accessToken,
            p_trip_id: currentTrip.id
        });

        if (!error) {
            alert('Viagem finalizada com sucesso!');
            setIsTracking(false);
            window.location.reload();
        } else {
            alert('Erro ao finalizar: ' + error.message);
        }
    };

    // HOME VIEW
    const HomeView = () => (
        <div className="space-y-4">
            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-sky-500 rounded-3xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">👋</span>
                    </div>
                    <div>
                        <p className="text-sm opacity-90">Bem-vindo,</p>
                        <h2 className="text-2xl font-black">{driver.name.split(' ')[0]}</h2>
                    </div>
                </div>

                {currentTrip ? (
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 space-y-2">
                        <p className="text-xs uppercase font-bold opacity-75">Viagem Ativa</p>
                        <p className="text-xl font-black">{currentTrip.destination}</p>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Iniciada em {new Date(currentTrip.departureDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
                        <p className="text-sm opacity-75">Nenhuma viagem ativa no momento</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                {currentTrip && !currentTrip.returnDate && (
                    <>
                        {/* Show Start Trip if not started (no departure date or future date) */}
                        {(!currentTrip.departureDate || new Date(currentTrip.departureDate) > new Date()) ? (
                            <button
                                onClick={startTrip}
                                className="bg-emerald-500 hover:bg-emerald-600 rounded-2xl p-4 text-white transition-all shadow-lg shadow-emerald-500/20 col-span-2"
                            >
                                <PlayCircle className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-bold">INICIAR VIAGEM</p>
                            </button>
                        ) : (
                            <button
                                onClick={endTrip}
                                className="bg-rose-500 hover:bg-rose-600 rounded-2xl p-4 text-white transition-all shadow-lg shadow-rose-500/20 col-span-2"
                            >
                                <StopCircle className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-bold">FINALIZAR VIAGEM</p>
                            </button>
                        )}
                    </>
                )}

                <button
                    onClick={() => setCurrentView('gps')}
                    className="bg-sky-500 hover:bg-sky-600 rounded-2xl p-4 text-white transition-all"
                >
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-bold">GPS</p>
                </button>

                <button
                    onClick={() => setCurrentView('proofs')}
                    className="bg-purple-500 hover:bg-purple-600 rounded-2xl p-4 text-white transition-all"
                >
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-bold">Comprovantes</p>
                </button>

                <button
                    onClick={() => setCurrentView('earnings')}
                    className="bg-emerald-500 hover:bg-emerald-600 rounded-2xl p-4 text-white transition-all"
                >
                    <Wallet className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm font-bold">Ganhos</p>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-emerald-400">{proofs.filter(p => p.approved).length}</p>
                    <p className="text-xs text-slate-400 mt-1">Aprovados</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">{proofs.filter(p => !p.approved).length}</p>
                    <p className="text-xs text-slate-400 mt-1">Pendentes</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-sky-400">{proofs.length}</p>
                    <p className="text-xs text-slate-400 mt-1">Total</p>
                </div>
            </div>
        </div>
    );

    // GPS VIEW
    const GPSView = () => (
        <div className="space-y-4">
            <div className="bg-slate-800 rounded-3xl p-6">
                <div className="text-center mb-6">
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${isTracking ? 'bg-emerald-500/20 animate-pulse' : 'bg-slate-700'
                        }`}>
                        <Navigation className={`w-12 h-12 ${isTracking ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <p className="text-xl font-black mb-2">
                        {isTracking ? '🟢 Rastreamento Ativo' : '🔴 Rastreamento Pausado'}
                    </p>
                    {lastLocation && (
                        <p className="text-sm text-slate-400">
                            Última atualização: {new Date(lastLocation.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${isTracking
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                >
                    {isTracking ? 'Pausar Rastreamento' : 'Iniciar Rastreamento'}
                </button>

                <div className="mt-6 text-xs text-slate-500 space-y-1">
                    <p>• Mantenha o app aberto durante a viagem</p>
                    <p>• Localização enviada automaticamente</p>
                    <p>• Economize bateria com modo "Não perturbar"</p>
                </div>
            </div>
        </div>
    );

    // PROOFS VIEW
    const ProofsView = () => (
        <div className="space-y-4">
            <div className="bg-slate-800 rounded-3xl p-6">
                <h3 className="text-lg font-black mb-4">Enviar Comprovante</h3>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { type: 'cte' as const, label: 'CT-e', icon: FileText, color: 'emerald' },
                        { type: 'nfe' as const, label: 'NF-e', icon: Receipt, color: 'sky' },
                        { type: 'fuel' as const, label: 'Combustível', icon: Fuel, color: 'amber' },
                        { type: 'delivery' as const, label: 'Entrega', icon: Package, color: 'purple' },
                    ].map(({ type, label, icon: Icon, color }) => (
                        <label
                            key={type}
                            className={`bg-${color}-500/10 border border-${color}-500/20 rounded-2xl p-4 cursor-pointer hover:bg-${color}-500/20 transition-all`}
                        >
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, type);
                                }}
                                disabled={uploading || !currentTrip}
                            />
                            <Icon className={`w-8 h-8 text-${color}-400 mx-auto mb-2`} />
                            <p className="text-sm font-bold text-center">{label}</p>
                        </label>
                    ))}
                </div>

                {uploading && (
                    <div className="mt-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 text-center">
                        <p className="text-sm text-sky-400">Enviando...</p>
                    </div>
                )}
            </div>

            {/* Proofs List */}
            <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-400 uppercase">Comprovantes Enviados</h3>
                {proofs.length === 0 ? (
                    <div className="bg-slate-800 rounded-2xl p-6 text-center">
                        <p className="text-slate-500 text-sm">Nenhum comprovante enviado ainda</p>
                    </div>
                ) : (
                    proofs.map((proof) => (
                        <div key={proof.id} className="bg-slate-800 rounded-2xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${proof.approved ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                        }`}>
                                        {proof.approved ? (
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-amber-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{proof.type.toUpperCase()}</p>
                                        <p className="text-xs text-slate-400">{proof.fileName}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {new Date(proof.uploadedAt).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${proof.approved
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    {proof.approved ? 'Aprovado' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // EARNINGS VIEW
    const EarningsView = () => (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500 to-sky-500 rounded-3xl p-6 text-white">
                <p className="text-sm opacity-75 mb-2">Saldo a Receber</p>
                <p className="text-4xl font-black mb-4">R$ {earnings.pending.toLocaleString('pt-BR')}</p>
                <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Atualizado agora</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400 mb-2">Total Pago</p>
                    <p className="text-2xl font-black text-emerald-400">R$ {earnings.paid.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4">
                    <p className="text-xs text-slate-400 mb-2">Total Geral</p>
                    <p className="text-2xl font-black text-white">R$ {earnings.total.toLocaleString('pt-BR')}</p>
                </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
                <p className="text-sm font-bold mb-3">Informações de Pagamento</p>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Chave PIX:</span>
                        <span className="font-mono">{driver.pixKey || 'Não cadastrado'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">CPF:</span>
                        <span className="font-mono">{driver.cpf}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black">Ribeirx Driver v2</h1>
                        <p className="text-xs text-slate-400">{driver.name}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {currentView === 'home' && <HomeView />}
                {currentView === 'gps' && <GPSView />}
                {currentView === 'proofs' && <ProofsView />}
                {currentView === 'earnings' && <EarningsView />}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2">
                <div className="grid grid-cols-4 gap-1">
                    {[
                        { view: 'home' as const, icon: MapPin, label: 'Início' },
                        { view: 'gps' as const, icon: Navigation, label: 'GPS' },
                        { view: 'proofs' as const, icon: Camera, label: 'Docs' },
                        { view: 'earnings' as const, icon: Wallet, label: 'Ganhos' },
                    ].map(({ view, icon: Icon, label }) => (
                        <button
                            key={view}
                            onClick={() => setCurrentView(view)}
                            className={`py-3 rounded-xl transition-all ${currentView === view
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5 mx-auto mb-1" />
                            <p className="text-xs font-bold">{label}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DriverApp;
