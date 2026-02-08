import React, { useState, useEffect } from 'react';
import { MapPin, Radio, Battery, Signal, Clock, Navigation, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface DriverTrackerProps {
    vehicleId: string;
    driverId: string;
    tripId?: string;
}

const DriverTracker: React.FC<DriverTrackerProps> = ({ vehicleId, driverId, tripId }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{
        lat: number;
        lng: number;
        speed: number;
        accuracy: number;
    } | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [updateCount, setUpdateCount] = useState(0);

    // Check battery level
    useEffect(() => {
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(Math.round(battery.level * 100));
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });
            });
        }
    }, []);

    // GPS Tracking
    useEffect(() => {
        if (!isTracking) return;

        let watchId: number;
        let intervalId: NodeJS.Timeout;

        const sendLocation = async (position: GeolocationPosition) => {
            try {
                const locationData = {
                    vehicle_id: vehicleId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s to km/h
                    heading: position.coords.heading || 0,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    battery_level: batteryLevel,
                    trip_id: tripId,
                    timestamp: new Date().toISOString(),
                };

                const { error: insertError } = await supabase
                    .from('vehicle_locations')
                    .insert(locationData);

                if (insertError) throw insertError;

                setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    speed: locationData.speed,
                    accuracy: position.coords.accuracy,
                });
                setLastUpdate(new Date());
                setUpdateCount(prev => prev + 1);
                setError(null);

                // Vibrate on successful update
                if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
            } catch (err: any) {
                setError(err.message || 'Erro ao enviar localização');
                console.error('Erro GPS:', err);
            }
        };

        const startGPS = async () => {
            try {
                // Request permission
                const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

                if (permission.state === 'denied') {
                    setError('Permissão de localização negada. Ative nas configurações do navegador.');
                    setIsTracking(false);
                    return;
                }

                // Watch position
                watchId = navigator.geolocation.watchPosition(
                    sendLocation,
                    (err) => {
                        setError(`Erro GPS: ${err.message}`);
                        console.error('Geolocation error:', err);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                    }
                );

                // Also send every 30 seconds
                intervalId = setInterval(() => {
                    navigator.geolocation.getCurrentPosition(
                        sendLocation,
                        (err) => console.error('Interval GPS error:', err),
                        { enableHighAccuracy: true }
                    );
                }, 30000);

            } catch (err: any) {
                setError(err.message);
                setIsTracking(false);
            }
        };

        startGPS();

        // Cleanup
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [isTracking, vehicleId, tripId, batteryLevel]);

    // Keep screen awake
    useEffect(() => {
        if (!isTracking) return;

        let wakeLock: any = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err) {
                console.error('Wake Lock error:', err);
            }
        };

        requestWakeLock();

        return () => {
            if (wakeLock) wakeLock.release();
        };
    }, [isTracking]);

    const toggleTracking = async () => {
        if (!isTracking) {
            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
        setIsTracking(!isTracking);
    };

    const formatSpeed = (speed: number) => {
        return speed.toFixed(0);
    };

    const formatAccuracy = (accuracy: number) => {
        if (accuracy < 10) return 'Excelente';
        if (accuracy < 30) return 'Boa';
        if (accuracy < 50) return 'Regular';
        return 'Fraca';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-4 pb-8">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="text-center pt-8 pb-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                        Ribeirx Driver
                    </h1>
                    <p className="text-slate-400 text-sm">Rastreamento GPS em Tempo Real</p>
                </div>

                {/* Status Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 space-y-6 shadow-2xl">
                    {/* Main Status */}
                    <div className="text-center">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${isTracking
                            ? 'bg-emerald-500/20 shadow-lg shadow-emerald-500/50 animate-pulse'
                            : 'bg-slate-800'
                            }`}>
                            <Radio className={`w-12 h-12 ${isTracking ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </div>
                        <p className="text-2xl font-black mb-2">
                            {isTracking ? '🟢 Rastreamento Ativo' : '🔴 Rastreamento Pausado'}
                        </p>
                        {lastUpdate && (
                            <p className="text-sm text-slate-400">
                                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                            </p>
                        )}
                        {isTracking && (
                            <p className="text-xs text-emerald-400 mt-2 font-bold">
                                {updateCount} atualizações enviadas
                            </p>
                        )}
                    </div>

                    {/* Current Data */}
                    {currentLocation && isTracking && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Navigation className="w-4 h-4 text-sky-400" />
                                    <span className="text-xs text-slate-400 uppercase font-bold">Velocidade</span>
                                </div>
                                <p className="text-2xl font-black text-white">
                                    {formatSpeed(currentLocation.speed)}
                                    <span className="text-sm text-slate-400 ml-1">km/h</span>
                                </p>
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Signal className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-slate-400 uppercase font-bold">Precisão</span>
                                </div>
                                <p className="text-lg font-black text-white">
                                    {formatAccuracy(currentLocation.accuracy)}
                                </p>
                                <p className="text-xs text-slate-500">±{currentLocation.accuracy.toFixed(0)}m</p>
                            </div>

                            {batteryLevel !== null && (
                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Battery className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs text-slate-400 uppercase font-bold">Bateria</span>
                                    </div>
                                    <p className="text-2xl font-black text-white">
                                        {batteryLevel}%
                                    </p>
                                </div>
                            )}

                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-slate-400 uppercase font-bold">Tempo Ativo</span>
                                </div>
                                <p className="text-lg font-black text-white">
                                    {lastUpdate ? Math.floor((Date.now() - lastUpdate.getTime()) / 1000 / 60) : 0}min
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={toggleTracking}
                        className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-lg ${isTracking
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                            }`}
                    >
                        {isTracking ? '⏸️ Pausar Rastreamento' : '▶️ Iniciar Rastreamento'}
                    </button>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-rose-400 font-bold mb-1">Erro</p>
                                <p className="text-xs text-rose-300">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="text-xs text-slate-500 space-y-2 pt-4 border-t border-slate-700/50">
                        <p className="font-bold text-slate-400 mb-3">📱 Instruções:</p>
                        <div className="space-y-1.5">
                            <p>• Mantenha esta página aberta durante a viagem</p>
                            <p>• Localização enviada automaticamente a cada 30s</p>
                            <p>• Ative "Não perturbar" para economizar bateria</p>
                            <p>• Para melhor precisão, use GPS de alta precisão</p>
                        </div>
                    </div>

                    {/* Install Prompt */}
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4">
                        <p className="text-xs text-sky-400 font-bold mb-2">💡 Dica:</p>
                        <p className="text-xs text-slate-300">
                            Adicione este app à tela inicial do seu celular para acesso rápido!
                            <br />
                            <span className="text-slate-500">
                                (Toque no menu ⋮ e selecione "Adicionar à tela inicial")
                            </span>
                        </p>
                    </div>
                </div>

                {/* Location Preview */}
                {currentLocation && isTracking && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase mb-4">Localização Atual</h3>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Latitude:</span>
                                <span className="text-white font-mono">{currentLocation.lat.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Longitude:</span>
                                <span className="text-white font-mono">{currentLocation.lng.toFixed(6)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverTracker;
