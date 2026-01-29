
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Trips from './components/Trips';
import Performance from './components/Performance';
import SettingsView from './components/Settings';
import NewTrip from './components/NewTrip';
import FleetHealth from './components/FleetHealth';
import Setup from './components/Setup';
import Auth from './components/Auth';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Settings as SettingsIcon, LayoutDashboard, Truck, PlusCircle } from 'lucide-react';
import {
  UserProfile,
  Vehicle,
  Driver,
  Shipper,
  Trip,
  TabType,
  AppNotification,
  MaintenanceRecord,
  MaintenanceThresholds
} from './types';
import {
  INITIAL_PROFILE
} from './constants';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  // Force Settings if profile is incomplete (First Visit) 
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (profile.name && profile.companyName) ? 'dashboard' : 'settings';
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);


  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // THEME HANDLER
  useEffect(() => {
    if (profile.config.theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    }
  }, [profile.config.theme]);

  // MONITOR DE NOTIFICAÇÕES INTELIGENTES
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      const newNotifications: AppNotification[] = [];

      // 1. Alertas de Inadimplência Configuráveis
      trips.forEach(trip => {
        if (trip.status !== 'Pago') {
          const [y, m, d] = trip.returnDate.split('-').map(Number);
          const returnDate = new Date(y, m - 1, d);
          const diffDays = Math.ceil(Math.abs(now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays >= (profile.config.paymentAlertDays || 10)) {
            newNotifications.push({
              id: `delay-${trip.id}`,
              type: 'payment_delay',
              title: 'Recebimento Crítico',
              message: `Viagem para ${trip.destination} excedeu o limite de ${profile.config.paymentAlertDays} dias.`,
              date: now.toISOString(),
              read: false,
              tripId: trip.id
            });
          }

          // 2. Alertas de Dados Incompletos
          if (profile.config.notifyIncompleteData) {
            if (trip.totalKm <= 0 || trip.combustivel <= 0) {
              newNotifications.push({
                id: `inc-${trip.id}`,
                type: 'incomplete',
                title: 'Dados Incompletos',
                message: `Lançamento para ${trip.destination} está sem KM ou Combustível.`,
                date: now.toISOString(),
                read: false
              });
            }
          }
        }
      });

      // 3. Alertas de Manutenção Preventiva
      if (profile.config.notifyMaintenance) {
        vehicles.forEach(v => {
          const kmSinceLast = v.totalKmAccumulated - v.lastMaintenanceKm;
          const threshold = v.thresholds?.oilChangeKm || 10000;
          if (kmSinceLast >= (threshold * 0.9)) {
            newNotifications.push({
              id: `maint-${v.id}`,
              type: 'maintenance',
              title: 'Manutenção Perto',
              message: `Veículo ${v.plate} atingiu 90% do ciclo de óleo.`,
              date: now.toISOString(),
              read: false
            });
          }
        });
      }

      setNotifications(newNotifications);
    };
    checkAlerts();
  }, [trips, vehicles, profile.config]);

  const handleSaveTrip = (newTrip: Trip) => {
    setTrips([newTrip, ...trips]);
    setVehicles(prev => prev.map(v =>
      v.id === newTrip.vehicleId
        ? { ...v, totalKmAccumulated: v.totalKmAccumulated + newTrip.totalKm }
        : v
    ));
    setActiveTab('trips');
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    const oldTrip = trips.find(t => t.id === updatedTrip.id);
    if (oldTrip && oldTrip.totalKm !== updatedTrip.totalKm) {
      const kmDiff = updatedTrip.totalKm - (oldTrip.totalKm || 0);
      setVehicles(prev => prev.map(v =>
        v.id === updatedTrip.vehicleId
          ? { ...v, totalKmAccumulated: v.totalKmAccumulated + kmDiff }
          : v
      ));
    }
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleSaveMaintenance = (record: MaintenanceRecord) => {
    setMaintenances([record, ...maintenances]);
    setVehicles(prev => prev.map(v =>
      v.id === record.vehicleId
        ? { ...v, lastMaintenanceKm: record.kmAtMaintenance }
        : v
    ));
  };

  const handleUpdateMaintenance = (record: MaintenanceRecord) => {
    setMaintenances(prev => prev.map(m => m.id === record.id ? record : m));
  };

  const handleUpdateVehicleThresholds = (vehicleId: string, thresholds: MaintenanceThresholds) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, thresholds } : v));
  };

  const handleImportData = (data: any) => {
    setProfile(data.profile);
    setTrips(data.trips);
    setVehicles(data.vehicles);
    setDrivers(data.drivers);
    setShippers(data.shippers);
    setMaintenances(data.maintenances || []);
  };

  const handleResetData = () => {
    setTrips([]);
    setVehicles([]);
    setDrivers([]);
    setShippers([]);
    setMaintenances([]);
    setProfile(INITIAL_PROFILE);
    alert("Sistema resetado com sucesso.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
      case 'trips': return <Trips trips={trips} setTrips={setTrips} onUpdateTrip={handleUpdateTrip} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
      case 'performance': return <Performance trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} maintenances={maintenances} />;
      case 'maintenance': return (
        <FleetHealth
          vehicles={vehicles}
          maintenances={maintenances}
          onAddMaintenance={handleSaveMaintenance}
          onUpdateMaintenance={handleUpdateMaintenance}
          onUpdateVehicleThresholds={handleUpdateVehicleThresholds}
        />
      );
      case 'setup': return <Setup vehicles={vehicles} drivers={drivers} shippers={shippers} onUpdateVehicles={setVehicles} onUpdateDrivers={setDrivers} onUpdateShippers={setShippers} />;
      case 'new-trip': return <NewTrip vehicles={vehicles} drivers={drivers} shippers={shippers} onSave={handleSaveTrip} profile={profile} />;
      case 'settings': return (
        <SettingsView
          profile={profile} setProfile={setProfile}
          trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} maintenances={maintenances}
          onImportData={handleImportData}
          onResetData={handleResetData}
        />
      );
      default: return null;
    }
  };

  if (loadingSession) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">Carregando...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      <Header
        profile={profile}
        notifications={notifications}
        onReadNotification={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />
      <main className="md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto pb-24 md:pb-8">{renderContent()}</div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-emerald-500' : 'text-slate-500'}><LayoutDashboard /></button>
        <button onClick={() => setActiveTab('trips')} className={activeTab === 'trips' ? 'text-emerald-500' : 'text-slate-500'}><Truck /></button>
        <button onClick={() => setActiveTab('new-trip')} className={activeTab === 'new-trip' ? 'text-sky-500' : 'text-slate-500'}><PlusCircle /></button>
      </div>
    </div>
  );
};

export default App;
