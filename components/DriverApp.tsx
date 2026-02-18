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
    FileCheck,
    Truck,
    ShieldCheck,
    Maximize2,
    Truck as TruckIcon,
    Package
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

    // GPS Tracking Logic
    useEffect(() => {
        let watchId: number;
        if (isTracking && driver.accessToken) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, speed, heading } = position.coords;
                    updateDriverLocation(latitude, longitude, speed, heading, position.coords.accuracy);
                },
                (error) => console.error("GPS Error:", error),
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );

            // Get immediate location to avoid lag
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, speed, heading } = position.coords;
                    updateDriverLocation(latitude, longitude, speed, heading, position.coords.accuracy);
                },
                (error) => console.error("Initial GPS Error:", error),
                { enableHighAccuracy: true }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isTracking, driver.accessToken]);

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
            // 1. Retrieve sync token from props or fallback to storage
            const token = driver.accessToken || (localStorage.getItem('driver_session') ? JSON.parse(localStorage.getItem('driver_session') || '{}').token : null);

            if (!token) {
                alert("Sessão inválida. Por favor, saia e entre novamente.");
                throw new Error("Sessão inválida");
            }

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentTrip.id}/${type}_${Date.now()}.${fileExt}`;

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
                    {currentTrip ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Viagem Ativa</p>
                            </div>
                            <p className="text-2xl font-black text-white leading-tight mb-2">{currentTrip.destination}</p>
                            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                <span>Saída: {new Date(currentTrip.departureDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center">
                            <p className="text-indigo-200 text-sm font-medium">Nenhuma viagem iniciada.</p>
                            <p className="text-xs text-indigo-300/60 mt-1">Aguarde instruções do gestor.</p>
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
                    {currentTrip && !currentTrip.returnDate && (
                        <div className="col-span-2">
                            {(!currentTrip.departureDate || new Date(currentTrip.departureDate) > new Date()) ? (
                                <button
                                    onClick={startTrip}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-[2rem] p-6 shadow-lg shadow-emerald-500/20 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    <PlayCircle className="w-10 h-10 text-white mx-auto mb-3" />
                                    <p className="text-white font-black text-lg tracking-wide">INICIAR VIAGEM</p>
                                    <p className="text-emerald-100/80 text-xs font-medium mt-1">Ativar GPS e Status</p>
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

    // DOCUMENTS VIEW (NEW)
    const DocumentsView = () => (
        <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-white">Documentos Digitais</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">Mantenha seus documentos pessoais e do veículo sempre acessíveis.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
                <div className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        <span className="font-black text-slate-500">CNH</span>
                    </div>
                    <div>
                        <p className="font-bold text-white text-lg">Carteira de Habilitação</p>
                        <p className="text-sm text-slate-400">Categoria: <span className="text-emerald-400 font-bold">{driver.cnhCategory || 'B'}</span></p>
                        <p className="text-xs text-slate-500 mt-1">{driver.cnh || 'Não informado'}</p>
                    </div>
                </div>
                <div className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        <TruckIcon className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-lg">Dados do Veículo</p>
                        {currentTrip ? (
                            <>
                                <p className="text-sm text-slate-400">Placa Vinculada</p>
                                <p className="text-emerald-400 font-bold font-mono mt-1 text-lg">---</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Nenhum veículo em uso no momento.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-700 text-center">
                <p className="text-slate-500 text-sm">Para atualizar seus documentos, entre em contato com o suporte ou gestor.</p>
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
