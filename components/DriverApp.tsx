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
    LogOut,
    Truck,
    ShieldCheck,
    Maximize2,
    Truck as TruckIcon,
    Package,
    Disc,
    Gauge,
    Pause,
    Radio,
    FileCheck
} from 'lucide-react';
import { Trip, Driver, TripProof, VehicleLocation } from '../types';
import { supabase } from '../services/supabase';

interface DriverAppProps {
    driver: Driver;
    currentTrip: Trip | null;
    onLogout: () => void;
}

type DriverView = 'home' | 'gps' | 'proofs' | 'documents' | 'earnings';

const DriverApp: React.FC<DriverAppProps> = ({ driver, currentTrip, onLogout }) => {
    const [currentView, setCurrentView] = useState<DriverView>('home');
    const [isTracking, setIsTracking] = useState(false);
    const [lastLocation, setLastLocation] = useState<VehicleLocation | null>(null);
    const [proofs, setProofs] = useState<TripProof[]>([]);
    const [uploading, setUploading] = useState(false);
    const [earnings, setEarnings] = useState({ pending: 0, paid: 0, total: 0 });
    const [isDemoMode, setIsDemoMode] = useState(false);

    const [tripStats, setTripStats] = useState({ duration: '0h 0m', avgSpeed: 0, totalKm: 0 });
    const [checklist, setChecklist] = useState({
        pneus: false,
        oleo: false,
        luzes: false,
        freios: false,
        documentos: false
    });

    // Mock Trip for Demo Mode
    const demoTrip: Trip = {
        id: 'demo-123',
        driverId: driver.id,
        vehicleId: driver.vehicleId || 'demo-vehicle',
        origin: 'São Paulo, SP',
        destination: 'Rio de Janeiro, RJ',
        departureDate: new Date().toISOString(),
        status: 'Pendente',
        shipperId: 'demo-shipper',
        freteSeco: 5000,
        diarias: 0,
        adiantamento: 0,
        combustivel: 0,
        litersDiesel: 0,
        outrasDespesas: 0,
        totalKm: 0
    };

    const activeTrip = currentTrip || (isDemoMode ? demoTrip : null);

    // GPS Tracking Logic
    useEffect(() => {
        let watchId: number;
        let statsInterval: NodeJS.Timeout;

        if (isTracking && driver.accessToken) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed, heading } = position.coords;
                    updateDriverLocation(latitude, longitude, speed, heading, position.coords.accuracy);
                },
                (error) => console.error("GPS Error:", error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );

            // Update trip duration stats
            statsInterval = setInterval(() => {
                if (activeTrip?.departureDate) {
                    const start = new Date(activeTrip.departureDate).getTime();
                    const now = new Date().getTime();
                    const diff = Math.max(0, now - start);
                    const hours = Math.floor(diff / 3600000);
                    const mins = Math.floor((diff % 3600000) / 60000);
                    setTripStats(prev => ({ ...prev, duration: `${hours}h ${mins}m` }));
                }
            }, 60000);
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (statsInterval) clearInterval(statsInterval);
        };
    }, [isTracking, driver.accessToken, activeTrip]);

    const updateDriverLocation = (latitude: number, longitude: number, speed: number | null, heading: number | null, accuracy: number) => {
        if (!driver.accessToken) return;

        // Visual feedback
        setLastLocation({
            id: 'local',
            vehicleId: 'local',
            timestamp: new Date().toISOString(),
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0
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
    };

    // Load proofs
    useEffect(() => {
        if (activeTrip) {
            loadProofs();
        }
    }, [activeTrip]);

    const loadProofs = async () => {
        if (!activeTrip || activeTrip.id === 'demo-123') return;
        const { data } = await supabase
            .from('trip_proofs')
            .select('*')
            .eq('trip_id', activeTrip.id)
            .order('uploaded_at', { ascending: false });
        if (data) setProofs(data);
    };

    const handleFileUpload = async (file: File, type: TripProof['type']) => {
        if (!activeTrip) return;

        if (activeTrip.id === 'demo-123') {
            setUploading(true);
            setTimeout(() => {
                setUploading(false);
                setProofs(prev => [{
                    id: Math.random().toString(),
                    tripId: 'demo-123',
                    type,
                    fileUrl: '#',
                    fileName: file.name,
                    fileSize: file.size,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'driver',
                    approved: false
                } as TripProof, ...prev]);
                alert('Modo Demo: Comprovante simulado com sucesso!');
            }, 1000);
            return;
        }
        try {
            // 1. Retrieve sync token from props or fallback to storage
            const token = driver.accessToken || (localStorage.getItem('driver_session') ? JSON.parse(localStorage.getItem('driver_session') || '{}').token : null);

            if (!token) {
                alert("Sessão inválida. Por favor, saia e entre novamente.");
                throw new Error("Sessão inválida");
            }

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${activeTrip.id}/${type}_${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('trip-proofs')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

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
                p_trip_id: activeTrip.id,
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
        if (!activeTrip || !driver.accessToken) return;

        const { error } = await supabase.rpc('driver_start_trip', {
            p_driver_token: driver.accessToken,
            p_trip_id: activeTrip.id
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
        if (!activeTrip || !driver.accessToken) return;

        const { error } = await supabase.rpc('driver_end_trip', {
            p_driver_token: driver.accessToken,
            p_trip_id: activeTrip.id
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 font-medium mb-1">Olá, Motorista</p>
                        <h2 className="text-3xl font-black text-white tracking-tight">{driver.name.split(' ')[0]}</h2>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                        <Truck className="w-7 h-7 text-white" />
                    </div>
                </div>

                {driver.vehiclePlate && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black text-white uppercase tracking-wider">
                            {driver.vehiclePlate}
                        </span>
                        <span className="text-white/80 text-xs font-bold">
                            {driver.vehicleName}
                        </span>
                    </div>
                )}

                <div className="mt-8 relative z-10">
                    {activeTrip ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Viagem Ativa {isDemoMode && '(DEMO)'}</p>
                            </div>
                            <p className="text-2xl font-black text-white leading-tight mb-2">{activeTrip.destination}</p>
                            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                <span>Saída: {new Date(activeTrip.departureDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center space-y-4">
                            <div>
                                <p className="text-indigo-200 text-sm font-medium">Nenhuma viagem iniciada.</p>
                                <p className="text-xs text-indigo-300/60 mt-1">Aguarde instruções do gestor.</p>
                            </div>

                            <button
                                onClick={() => setIsDemoMode(true)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                🧪 Ativar Modo de Teste
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-emerald-500" /> Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {activeTrip && !activeTrip.returnDate && (
                        <div className="col-span-2">
                            {(!activeTrip.departureDate || new Date(activeTrip.departureDate) > new Date()) || isDemoMode ? (
                                <button
                                    onClick={isDemoMode ? () => setIsTracking(!isTracking) : startTrip}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-[2rem] p-6 shadow-lg shadow-emerald-500/20 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    <PlayCircle className="w-10 h-10 text-white mx-auto mb-3" />
                                    <p className="text-white font-black text-lg tracking-wide">{isTracking ? 'RODANDO GPS...' : 'INICIAR VIAGEM'}</p>
                                    <p className="text-emerald-100/80 text-xs font-medium mt-1">{isDemoMode ? 'Simulando no navegador' : 'Ativar GPS e Status'}</p>
                                </button>
                            ) : (
                                <button
                                    onClick={endTrip}
                                    className="w-full bg-rose-500 hover:bg-rose-400 active:scale-95 transition-all rounded-[2rem] p-6 shadow-lg shadow-rose-500/20 group"
                                >
                                    <StopCircle className="w-10 h-10 text-white mx-auto mb-3" />
                                    <p className="text-white font-black text-lg tracking-wide">FINALIZAR VIAGEM</p>
                                    <p className="text-rose-100/80 text-xs font-medium mt-1">Concluir transporte</p>
                                </button>
                            )}
                        </div>
                    )}

                    <button onClick={() => setCurrentView('gps')} className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800 transition-all rounded-3xl p-5 flex flex-col items-center justify-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                            <MapPin className="w-6 h-6 text-sky-400" />
                        </div>
                        <span className="font-bold text-slate-300">Mapa</span>
                    </button>

                    <button onClick={() => setCurrentView('proofs')} className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 transition-all rounded-3xl p-5 flex flex-col items-center justify-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <Upload className="w-6 h-6 text-purple-400" />
                        </div>
                        <span className="font-bold text-slate-300">Notas</span>
                    </button>

                    <button onClick={() => setCurrentView('documents')} className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 transition-all rounded-3xl p-5 flex flex-col items-center justify-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <ShieldCheck className="w-6 h-6 text-amber-400" />
                        </div>
                        <span className="font-bold text-slate-300">Docs</span>
                    </button>

                    <button onClick={() => setCurrentView('earnings')} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all rounded-3xl p-5 flex flex-col items-center justify-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                            <Wallet className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="font-bold text-slate-300">Carteira</span>
                    </button>
                </div>
            </div>

            {/* Status Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Resumo de Atividades</h4>
                <div className="flex items-center justify-between">
                    <div className="text-center">
                        <p className="text-2xl font-black text-emerald-500">{proofs.length}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Comprovantes</p>
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-sky-500">{isTracking ? 'ON' : 'OFF'}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Rastreio</p>
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-amber-500">R$ {earnings.pending}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Pendente</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // GPS VIEW
    const GPSView = () => (
        <div className="space-y-4 animate-in slide-in-from-right duration-500">
            {/* Real-time Stats Dashboard */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-2 text-sky-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Tempo Total</span>
                    </div>
                    <p className="text-xl font-black text-white">{tripStats.duration}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                        {isTracking ? 'EM MOVIMENTO' : 'PARADO'}
                    </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <Gauge className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Velocidade</span>
                    </div>
                    <p className="text-xl font-black text-white">{lastLocation?.speed ? lastLocation.speed.toFixed(0) : '0'} <span className="text-xs text-slate-500">km/h</span></p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">ATUAL</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                <div className="text-center mb-6">
                    <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-6 relative ${isTracking ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                        }`}>
                        {isTracking && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping"></div>
                                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-pulse delay-75"></div>
                            </>
                        )}
                        <Navigation className={`w-12 h-12 ${isTracking ? 'text-emerald-400' : 'text-slate-500'} transition-all ${isTracking ? 'scale-110' : ''}`} />
                    </div>
                    <p className="text-2xl font-black text-white mb-2">
                        {isTracking ? 'GPS Ativado' : 'GPS Desligado'}
                    </p>
                    <p className="text-sm text-slate-400 font-medium px-4">
                        {isTracking
                            ? 'Seu sinal está sendo enviado em tempo real para a central.'
                            : 'Clique no botão abaixo para iniciar o envio da sua posição.'}
                    </p>
                </div>

                <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl flex items-center justify-center gap-3 ${isTracking
                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                        }`}
                >
                    {isTracking ? <Pause className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    {isTracking ? 'PAUSAR RASTREIO' : 'ATIVAR RASTREIO'}
                </button>

                <div className="mt-8 bg-slate-900/50 rounded-2xl p-4 border border-slate-700/30">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Protocolo de Viagem</h5>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-300">Conexão Estável</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-300">Modo de Alta Precisão</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-slate-300">Bateria: Recomendado carregar</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // PROOFS VIEW
    const ProofsView = () => (
        <div className="space-y-4">
            <div className="bg-slate-800 rounded-3xl p-6 text-left">
                <h3 className="text-lg font-black mb-1">Enviar Comprovante</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">Os arquivos serão vinculados à sua viagem atual.</p>

                {!activeTrip && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-200 font-bold leading-tight uppercase">
                            NENHUMA VIAGEM ATIVA ENCONTRADA.<br />
                            <span className="opacity-60 lowercase font-medium">Você precisa de uma viagem ativa para enviar documentos.</span>
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { type: 'cte' as const, label: 'CT-e', icon: FileText, color: '#10b981' },
                        { type: 'nfe' as const, label: 'NF-e', icon: Receipt, color: '#0ea5e9' },
                        { type: 'fuel' as const, label: 'Combustível', icon: Fuel, color: '#f59e0b' },
                        { type: 'delivery' as const, label: 'Entrega', icon: Package, color: '#a855f7' },
                    ].map(({ type, label, icon: Icon, color }) => (
                        <div key={type} className="relative h-32">
                            <input
                                id={`file-${type}`}
                                type="file"
                                accept="image/*,application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, type);
                                }}
                                disabled={uploading || !activeTrip}
                            />
                            <div
                                style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
                                className={`absolute inset-0 flex flex-col items-center justify-center border-2 rounded-[2rem] transition-all hover:bg-opacity-20 active:scale-95 ${uploading || !activeTrip ? 'opacity-40 grayscale' : ''}`}
                            >
                                <Icon style={{ color: color }} className="w-8 h-8 mb-2" />
                                <p className="text-xs font-black text-white">{label}</p>
                                <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase">Clique</p>
                            </div>
                        </div>
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Histórico Recente</h3>
                {proofs.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center">
                        <p className="text-slate-600 text-sm italic">Nenhum comprovante enviado nesta viagem.</p>
                    </div>
                ) : (
                    proofs.map((proof) => (
                        <div key={proof.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${proof.approved ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                        {proof.approved ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <Clock className="w-6 h-6 text-amber-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-white">{proof.type.toUpperCase()}</p>
                                        <p className="text-xs text-slate-500 font-mono truncate max-w-[150px]">{proof.fileName}</p>
                                        <p className="text-[10px] text-slate-600 font-bold mt-1">
                                            {new Date(proof.uploadedAt).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${proof.approved
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    {proof.approved ? 'Aprovado' : 'Pend.'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // DOCUMENTS VIEW (NEW)
    const DocumentsView = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Safety Hub Header */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black leading-tight">Central de Segurança</h3>
                        <p className="text-amber-100 text-sm font-medium">Compliance e Checklists</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-black/20 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase opacity-60">Segurança</p>
                        <p className="text-lg font-black italic">100% OK</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase opacity-60">Status CNH</p>
                        <p className="text-lg font-black italic">VÁLIDA</p>
                    </div>
                </div>
            </div>

            {/* Checklist Diário */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-black text-white">Checklist de Viagem</h4>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black tracking-widest uppercase">Obrigatório</span>
                </div>

                <div className="space-y-3">
                    {[
                        { id: 'pneus', label: 'Calibragem dos Pneus', icon: Disc },
                        { id: 'oleo', label: 'Nível de Óleo e Fluídos', icon: Fuel },
                        { id: 'luzes', label: 'Faróis e Lanternas', icon: Radio },
                        { id: 'freios', label: 'Sistema de Frenagem', icon: ShieldCheck },
                        { id: 'documentos', label: 'Documentação do Veículo', icon: FileCheck },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof checklist] }))}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${checklist[item.id as keyof typeof checklist]
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </div>
                            {checklist[item.id as keyof typeof checklist] ? (
                                <CheckCircle className="w-5 h-5 fill-emerald-500 text-slate-900" />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-700"></div>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    disabled={!Object.values(checklist).every(v => v)}
                    className={`w-full mt-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${Object.values(checklist).every(v => v)
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-600'
                        }`}
                >
                    {Object.values(checklist).every(v => v) ? 'Checklist Finalizado' : 'Aguardando Verificação'}
                </button>
            </div>

            {/* Ficha Digital */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="bg-slate-800/50 p-4 border-b border-slate-800 font-black text-xs text-slate-400 uppercase tracking-widest">
                    Meus Dados
                </div>
                <div className="divide-y divide-slate-800">
                    <div className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                            <span className="font-black text-slate-500">CNH</span>
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg">Carteira {driver.cnhCategory || 'B'}</p>
                            <p className="text-sm text-slate-400 font-mono">{driver.cnh || '---'}</p>
                        </div>
                    </div>
                </div>
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
                {currentView === 'documents' && <DocumentsView />}
                {currentView === 'earnings' && <EarningsView />}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 p-4 pb-6 z-50">
                <div className="flex justify-around items-center max-w-md mx-auto bg-slate-900/50 rounded-2xl p-2 border border-slate-800/50 shadow-xl">
                    {[
                        { view: 'home' as const, icon: MapPin, label: 'Início' }, // Changed Icon just for visual variance or keep
                        { view: 'gps' as const, icon: Navigation, label: 'GPS' },
                        { view: 'proofs' as const, icon: Camera, label: 'Notas' },
                        { view: 'documents' as const, icon: ShieldCheck, label: 'Docs' },
                        { view: 'earnings' as const, icon: Wallet, label: 'Conta' },
                    ].map(({ view, icon: Icon, label }) => (
                        <button
                            key={view}
                            onClick={() => setCurrentView(view)}
                            className={`p-3 rounded-xl transition-all relative ${currentView === view
                                ? 'text-emerald-400 bg-emerald-400/10'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${currentView === view ? 'scale-110' : ''} transition-transform`} />
                            {currentView === view && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DriverApp;
