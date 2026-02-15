import React, { useState, useEffect, useRef } from 'react';
import {
    MapPin,
    Navigation,
    Gauge,
    Clock,
    AlertTriangle,
    TrendingUp,
    Radio,
    RefreshCw,
    Maximize2,
    Filter,
    Download,
    Play,
    Pause,
    ExternalLink
} from 'lucide-react';
import { Vehicle, Trip, VehicleLocation, GPSAlert } from '../types';

interface GPSTrackingProps {
    vehicles: Vehicle[];
    trips: Trip[];
    locations: VehicleLocation[];
    alerts: GPSAlert[];
    onRefresh: () => void;
}

const GPSTracking: React.FC<GPSTrackingProps> = ({ vehicles, trips, locations, alerts, onRefresh }) => {
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 }); // São Paulo default
    const [zoom, setZoom] = useState(12);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showAlerts, setShowAlerts] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'all' | 'moving' | 'stopped'>('all');
    const mapRef = useRef<HTMLDivElement>(null);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            onRefresh();
        }, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, onRefresh]);

    // Get latest location for each vehicle
    const getLatestLocation = (vehicleId: string): VehicleLocation | null => {
        const vehicleLocations = locations
            .filter(loc => loc.vehicleId === vehicleId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return vehicleLocations[0] || null;
    };

    // Check if vehicle is moving
    const isMoving = (location: VehicleLocation | null): boolean => {
        if (!location) return false;
        return location.speed > 5; // Moving if speed > 5 km/h
    };

    // Get time since last update
    const getTimeSinceUpdate = (timestamp: string): string => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h atrás`;
        return `${Math.floor(diffHours / 24)}d atrás`;
    };

    // Filter vehicles by status
    const filteredVehicles = vehicles.filter(vehicle => {
        const location = getLatestLocation(vehicle.id);
        if (filterStatus === 'all') return true;
        if (filterStatus === 'moving') return isMoving(location);
        if (filterStatus === 'stopped') return location && !isMoving(location);
        return true;
    });

    // Get active trip for vehicle
    const getActiveTrip = (vehicleId: string): Trip | null => {
        return trips.find(t => t.vehicleId === vehicleId && t.status !== 'Pago') || null;
    };

    // Get unresolved alerts
    const unresolvedAlerts = alerts.filter(a => !a.resolved);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Rastreamento GPS</h2>
                    <p className="text-slate-400 text-sm mt-1">Monitoramento em tempo real da frota</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold ${autoRefresh
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                    >
                        {autoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        Auto-Refresh
                    </button>
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-sky-500/20"
                    >
                        <RefreshCw className="w-4 h-4" /> Atualizar
                    </button>
                </div>
            </div>

            {/* Alerts Banner */}
            {unresolvedAlerts.length > 0 && showAlerts && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white mb-2">
                                    {unresolvedAlerts.length} Alerta{unresolvedAlerts.length > 1 ? 's' : ''} Ativo{unresolvedAlerts.length > 1 ? 's' : ''}
                                </h3>
                                <div className="space-y-2">
                                    {unresolvedAlerts.slice(0, 3).map(alert => {
                                        const vehicle = vehicles.find(v => v.id === alert.vehicleId);
                                        return (
                                            <div key={alert.id} className="flex items-center gap-3 text-sm">
                                                <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[9px] font-black text-slate-400 uppercase">
                                                    {vehicle?.plate || 'N/A'}
                                                </span>
                                                <span className="text-slate-300">{alert.message}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAlerts(false)}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Radio className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Em Movimento</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {vehicles.filter(v => isMoving(getLatestLocation(v.id))).length}
                    </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Parados</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {vehicles.filter(v => {
                            const loc = getLatestLocation(v.id);
                            return loc && !isMoving(loc);
                        }).length}
                    </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-sky-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Viagens Ativas</span>
                    </div>
                    <p className="text-3xl font-black text-white">
                        {trips.filter(t => t.status !== 'Pago').length}
                    </p>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                        </div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Alertas</span>
                    </div>
                    <p className="text-3xl font-black text-white">{unresolvedAlerts.length}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-1">
                {(['all', 'moving', 'stopped'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {status === 'all' ? 'Todos' : status === 'moving' ? 'Em Movimento' : 'Parados'}
                    </button>
                ))}
            </div>

            {/* Map Placeholder + Vehicle List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white">Mapa em Tempo Real</h3>
                        <button className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div
                        ref={mapRef}
                        className="w-full h-[500px] bg-slate-950 rounded-2xl border border-slate-700 relative overflow-hidden shadow-2xl"
                    >
                        {selectedVehicle ? (() => {
                            const location = getLatestLocation(selectedVehicle);
                            if (!location) return (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 backdrop-blur-sm">
                                    <MapPin className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="font-bold">Sem dados de localização para este veículo</p>
                                </div>
                            );

                            // Calculate bounding box for the iframe
                            const delta = 0.005;
                            const bbox = `${location.longitude - delta},${location.latitude - delta},${location.longitude + delta},${location.latitude + delta}`;

                            return (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    className="border-0 filter grayscale invert contrast-125 opacity-80"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                                ></iframe>
                            );
                        })() : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                                <MapPin className="w-16 h-16 mb-4 text-emerald-500/20 animate-bounce" />
                                <div className="text-center">
                                    <p className="text-white font-black text-xl mb-2">Selecione um Veículo</p>
                                    <p className="text-slate-500 text-sm max-w-xs">
                                        Clique em um veículo na lista para visualizar sua localização exata no mapa tático.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vehicle List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-white">Veículos ({filteredVehicles.length})</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredVehicles.map(vehicle => {
                            const location = getLatestLocation(vehicle.id);
                            const trip = getActiveTrip(vehicle.id);
                            const moving = isMoving(location);

                            return (
                                <div
                                    key={vehicle.id}
                                    onClick={() => setSelectedVehicle(vehicle.id)}
                                    className={`bg-slate-900/50 border rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-900 ${selectedVehicle === vehicle.id
                                        ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                                        : 'border-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${moving ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                <Navigation className={`w-5 h-5 ${moving ? 'animate-pulse' : ''}`} />
                                            </div>
                                            <div>
                                                <p className="font-black text-white text-sm">{vehicle.plate}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{vehicle.name}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${moving
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-slate-700 text-slate-400'
                                            }`}>
                                            {moving ? 'Movimento' : 'Parado'}
                                        </div>
                                    </div>

                                    {location && (
                                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                                                    <span className="text-slate-400">Velocidade:</span>
                                                    <span className="text-white font-bold">{location.speed.toFixed(0)} km/h</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                                                    <span className="text-white font-bold">{getTimeSinceUpdate(location.timestamp)}</span>
                                                </div>
                                            </div>

                                            {trip && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-slate-400">Destino:</span>
                                                    <span className="text-white font-bold truncate">{trip.destination}</span>
                                                </div>
                                            )}

                                            <a
                                                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black uppercase text-slate-300 hover:bg-slate-700 hover:text-white transition-all mt-2"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Ver no Google Maps
                                            </a>
                                        </div>
                                    )}

                                    {!location && (
                                        <p className="text-xs text-slate-500 italic">Sem dados de localização</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GPSTracking;
