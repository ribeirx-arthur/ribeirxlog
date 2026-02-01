
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Trips from './components/Trips';
const Performance = React.lazy(() => import('./components/Performance'));
const Settings = React.lazy(() => import('./components/Settings'));
const Subscription = React.lazy(() => import('./components/SubscriptionView'));
const NewTrip = React.lazy(() => import('./components/NewTrip'));
const FleetHealth = React.lazy(() => import('./components/FleetHealth'));
const Setup = React.lazy(() => import('./components/Setup'));
const TireManagement = React.lazy(() => import('./components/TireManagement'));
const StrategicIntelligence = React.lazy(() => import('./components/StrategicIntelligence'));
const Maintenance = React.lazy(() => import('./components/Maintenance'));

import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Paywall from './components/Paywall';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Settings as SettingsIcon, LayoutDashboard, Truck, PlusCircle, CheckCircle2, AlertTriangle, Menu, X, Users, TrendingUp, ShieldAlert, CreditCard, RefreshCcw, Share2, Disc, Brain } from 'lucide-react';
import {
  UserProfile,
  Vehicle,
  Buggy,
  Driver,
  Shipper,
  Tire,
  Trip,
  TabType,
  AppNotification,
  MaintenanceRecord,
  MaintenanceThresholds
} from './types';
import {
  INITIAL_PROFILE
} from './constants';
import { WHATSAPP_NUMBER } from './pricing';

const APP_VERSION = '1.3.0';

import { AppModeProvider } from './contexts/AppModeContext';

// ... existing imports ...

const App: React.FC = () => {
  useEffect(() => {
    const lastVersion = localStorage.getItem('app_version');
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      // Force reload from server bypassing cache
      window.location.reload();
    }
  }, []);
  // MOCK PROFILE FOR DEV - This would come from auth/db
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Arthur Ribeiro',
    email: 'arthur@ribeirxlog.com',
    companyName: 'Ribeirx Transportes',
    config: {
      percMotFrete: 10,
      percMotDiaria: 100,
      autoSplitSociety: true,
      showMileage: true,
      paymentAlertDays: 2,
      notifyIncompleteData: true,
      notifyMaintenance: true,
      showTips: true,
      enableMaintenance: true,
      enableBI: true,
      appMode: 'advanced', // Default mode
      enabledFeatures: []
    }
  });

  // Force Settings if profile is incomplete (First Visit) 
  const [activeTab, setActiveTab] = useState<TabType>('setup');

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

  // State Declarations
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [buggies, setBuggies] = useState<Buggy[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);

  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPlanIntent, setPendingPlanIntent] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // MONITOR DE NOTIFICAÇÕES INTELIGENTES
  useEffect(() => {
    if (!trips.length && !vehicles.length) return; // Skip if data not loaded

    const checkAlerts = () => {
      const now = new Date();
      const newNotifications: AppNotification[] = [];

      // 1. Alertas de Inadimplência Configuráveis
      trips.forEach(trip => {
        if (trip.status !== 'Pago' && trip.returnDate) {
          try {
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
          } catch (e) {
            console.error("Error processing alert for trip:", trip.id, e);
          }
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

      // 4. Validação de Documentos (CNH)
      if (profile.config.appMode !== 'simple') {
        drivers.forEach(d => {
          if (d.cnhValidity) {
            const [y, m, day] = d.cnhValidity.split('-').map(Number);
            const validityDate = new Date(y, m - 1, day);
            const diffTime = validityDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              newNotifications.push({
                id: `cnh-exp-${d.id}`,
                type: 'system',
                title: 'CNH Vencida',
                message: `A CNH do motorista ${d.name} venceu em ${validityDate.toLocaleDateString()}!`,
                date: now.toISOString(),
                read: false
              });
            } else if (diffDays <= 30) {
              newNotifications.push({
                id: `cnh-warn-${d.id}`,
                type: 'system',
                title: 'CNH Vencendo',
                message: `A CNH do motorista ${d.name} vence em ${diffDays} dias.`,
                date: now.toISOString(),
                read: false
              });
            }
          }
        });
      }

      setNotifications(newNotifications);
    };
    checkAlerts();
  }, [trips, vehicles, drivers, profile.config]); // Added drivers to dependency array as it is used

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auth & Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      setLoadingData(true);
      const fetchData = async () => {
        try {
          // 1. Load Profile (Safe Parsing)
          try {
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profileData) {
              let parsedConfig = profile.config;
              try {
                if (typeof profileData.config === 'string') {
                  parsedConfig = JSON.parse(profileData.config);
                } else if (profileData.config) {
                  parsedConfig = profileData.config;
                }
              } catch (e) {
                console.error("Error parsing profile config:", e);
              }

              setProfile(prev => ({
                ...prev,
                name: profileData.name,
                email: profileData.email,
                companyName: profileData.company_name,
                logoUrl: profileData.logo_url,
                signatureUrl: profileData.signature_url,
                phone: profileData.phone,
                config: parsedConfig
              }));
            }
          } catch (err) {
            console.error("Error loading profile:", err);
          }

          // 2. Load Records (Independent Fetches with Mapping)
          const loadTable = async (table: string, setter: (data: any) => void, mapper?: (item: any) => any) => {
            try {
              const { data, error } = await supabase.from(table).select('*').eq('user_id', session.user.id);
              if (error) throw error;
              if (data) {
                const mappedData = mapper ? data.map(mapper) : data;
                setter(mappedData);
              }
            } catch (e) {
              console.error(`Error loading ${table}:`, e);
            }
          };

          await Promise.all([
            loadTable('trips', setTrips, (t) => ({
              ...t,
              vehicleId: t.vehicle_id,
              driverId: t.driver_id,
              shipperId: t.shipper_id,
              departureDate: t.departure_date,
              returnDate: t.return_date,
              receiptDate: t.receipt_date,
              freteSeco: Number(t.frete_seco || 0),
              litersDiesel: Number(t.liters_diesel || 0),
              outrasDespesas: Number(t.outras_despesas || 0),
              totalKm: Number(t.total_km || 0),
              diarias: Number(t.diarias || 0),
              adiantamento: Number(t.adiantamento || 0),
              combustivel: Number(t.combustivel || 0)
            })),
            loadTable('vehicles', setVehicles, (v) => ({
              ...v,
              societySplitFactor: v.society_split_factor,
              totalKmAccumulated: v.total_km_accumulated,
              lastMaintenanceKm: v.last_maintenance_km,
              photoUrl: v.photo_url
            })),
            loadTable('drivers', setDrivers, (d) => ({
              ...d,
              pixKey: d.pix_key,
              cnhCategory: d.cnh_category,
              cnhValidity: d.cnh_validity,
              photoUrl: d.photo_url,
              customCommission: d.custom_commission
            })),
            loadTable('shippers', setShippers, (s) => ({
              ...s,
              avgPaymentDays: s.avg_payment_days,
              logoUrl: s.logo_url
            })),
            loadTable('buggies', setBuggies, (b) => ({
              ...b,
              tireType: b.tire_type
            })),
            loadTable('tires', setTires, (t) => ({
              ...t,
              serialNumber: t.serial_number,
              vehicleId: t.vehicle_id,
              buggyId: t.buggy_id,
              currentKm: Number(t.current_km),
              cost: Number(t.cost),
              installDate: t.install_date
            })),
            loadTable('maintenance_records', setMaintenances)
          ]);

        } catch (error) {
          console.error('Critical error in data loader', error);
          showToast('Erro crítico ao carregar dados', 'error');
        } finally {
          setLoadingData(false);
        }
      };

      fetchData();
    }
  }, [session]);
  const handleLandingPurchase = (plan: string) => {
    const message = encodeURIComponent(`Olá Arthur! Estou na Landing Page e tenho interesse no plano ${plan}. Como faço para prosseguir com o pagamento?`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    setPendingPlanIntent(plan);
    setShowAuth(true);
  };

  const handleSaveTrip = async (newTrip: Trip) => {
    // ...
  };

  // ... (other handlers) ...

  if (loadingSession || (session && loadingData)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Sincronizando Dados...</p>
      </div>
    );
  }

  if (!session) {
    if (showAuth) {
      return (
        <div className="relative">
          <button
            onClick={() => setShowAuth(false)}
            className="fixed top-6 left-6 z-50 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all"
          >
            ← Voltar para Início
          </button>
          <Auth />
        </div>
      );
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} onPurchase={handleLandingPurchase} />;
  }







  const handleUpdateTrip = async (updatedTrip: Trip) => {
    if (!session) return;
    showToast('Atualizando viagem...', 'info');

    try {
      const { error } = await supabase.from('trips').update({
        origin: updatedTrip.origin,
        destination: updatedTrip.destination,
        vehicle_id: updatedTrip.vehicleId,
        driver_id: updatedTrip.driverId,
        shipper_id: updatedTrip.shipperId,
        departure_date: updatedTrip.departureDate || null,
        return_date: updatedTrip.returnDate || null,
        receipt_date: updatedTrip.receiptDate || null,
        frete_seco: Number(updatedTrip.freteSeco),
        diarias: Number(updatedTrip.diarias),
        adiantamento: Number(updatedTrip.adiantamento),
        combustivel: Number(updatedTrip.combustivel),
        liters_diesel: Number(updatedTrip.litersDiesel),
        outras_despesas: Number(updatedTrip.outrasDespesas),
        status: updatedTrip.status,
        total_km: Number(updatedTrip.totalKm)
      }).eq('id', updatedTrip.id);

      if (error) throw error;

      const oldTrip = trips.find(t => t.id === updatedTrip.id);
      if (oldTrip && oldTrip.totalKm !== updatedTrip.totalKm) {
        const kmDiff = (updatedTrip.totalKm || 0) - (oldTrip.totalKm || 0);
        const vehicle = vehicles.find(v => v.id === updatedTrip.vehicleId);
        if (vehicle) {
          const newKm = (vehicle.totalKmAccumulated || 0) + kmDiff;
          await supabase.from('vehicles').update({ total_km_accumulated: newKm }).eq('id', updatedTrip.vehicleId);
          setVehicles(prev => prev.map(v => v.id === updatedTrip.vehicleId ? { ...v, totalKmAccumulated: newKm } : v));
        }
      }
      setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
      showToast('Viagem atualizada!', 'success');
    } catch (err: any) {
      console.error("Error updating trip:", err);
      showToast(`Erro ao atualizar: ${err.message}`, 'error');
    }
  };

  const handleSaveMaintenance = async (record: MaintenanceRecord) => {
    const { data: saved, error } = await supabase.from('maintenance_records').insert({
      vehicle_id: record.vehicleId,
      date: record.date,
      km_at_maintenance: record.kmAtMaintenance,
      type: record.type,
      description: record.description,
      total_cost: record.totalCost,
      provider: record.provider,
      user_id: session?.user.id
    }).select().single();

    if (error) {
      console.error("Error saving maintenance:", error);
      return;
    }

    const formatted = { ...saved, vehicleId: saved.vehicle_id, kmAtMaintenance: Number(saved.km_at_maintenance), totalCost: Number(saved.total_cost) };
    setMaintenances([formatted, ...maintenances]);

    // Update vehicle km in Supabase
    await supabase.from('vehicles').update({ last_maintenance_km: record.kmAtMaintenance }).eq('id', record.vehicleId);
    setVehicles(prev => prev.map(v => v.id === record.vehicleId ? { ...v, lastMaintenanceKm: record.kmAtMaintenance } : v));
  };

  const handleUpdateMaintenance = async (record: MaintenanceRecord) => {
    await supabase.from('maintenance_records').update({
      vehicle_id: record.vehicleId,
      date: record.date,
      km_at_maintenance: record.kmAtMaintenance,
      type: record.type,
      description: record.description,
      total_cost: record.totalCost,
      provider: record.provider
    }).eq('id', record.id);

    setMaintenances(prev => prev.map(m => m.id === record.id ? record : m));
  };

  const handleUpdateVehicleThresholds = (vehicleId: string, thresholds: MaintenanceThresholds) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, thresholds } : v));
  };



  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (session) {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        name: newProfile.name,
        email: newProfile.email,
        company_name: newProfile.companyName,
        logo_url: newProfile.logoUrl,
        signature_url: newProfile.signatureUrl,
        phone: newProfile.phone,
        config: newProfile.config,
        updated_at: new Date().toISOString()
      });
    }
  };

  const handleUpdateVehicles = async (updatedVehicles: Vehicle[]) => {
    if (loadingData) return;
    showToast('Salvando veículos...', 'info');

    const vehiclesToDelete = vehicles.filter(v => v.id.length > 20 && !updatedVehicles.find(uv => uv.id === v.id));
    for (const v of vehiclesToDelete) {
      try {
        await supabase.from('vehicles').delete().eq('id', v.id);
      } catch (err) {
        console.error('Error deleting vehicle:', err);
      }
    }

    const finalVehicles: Vehicle[] = [];
    for (const v of updatedVehicles) {
      const dbPayload = {
        user_id: session?.user.id,
        plate: v.plate,
        name: v.name,
        brand: v.brand,
        model: v.model,
        year: v.year,
        type: v.type,
        society_split_factor: v.societySplitFactor,
        total_km_accumulated: v.totalKmAccumulated,
        last_maintenance_km: v.lastMaintenanceKm,
        photo_url: v.photoUrl,
        thresholds: v.thresholds
      };

      try {
        const isExisting = v.id && v.id.length > 20 && v.id.includes('-');
        if (!isExisting) {
          const { data, error } = await supabase.from('vehicles').insert(dbPayload).select().single();
          if (error) throw error;
          if (data) {
            finalVehicles.push({
              ...data,
              totalKmAccumulated: Number(data.total_km_accumulated),
              lastMaintenanceKm: Number(data.last_maintenance_km),
              societySplitFactor: data.society_split_factor
            });
          }
        } else {
          const { error } = await supabase.from('vehicles').update(dbPayload).eq('id', v.id);
          if (error) throw error;
          finalVehicles.push(v);
        }
      } catch (err: any) {
        console.error('Persistence error for vehicle:', v.plate, err);
        showToast(`Erro ao salvar veículo ${v.plate}: ${err.message}`, 'error');
        finalVehicles.push(v);
      }
    }
    setVehicles(finalVehicles);
    showToast('Veículos atualizados!');
  };

  const handleUpdateDrivers = async (updatedDrivers: Driver[]) => {
    if (loadingData) return;
    showToast('Salvando motoristas...', 'info');

    const driversToDelete = drivers.filter(d => d.id.length > 20 && !updatedDrivers.find(ud => ud.id === d.id));
    for (const d of driversToDelete) {
      try {
        await supabase.from('drivers').delete().eq('id', d.id);
      } catch (err) {
        console.error('Error deleting driver:', err);
      }
    }

    const finalDrivers: Driver[] = [];
    for (const d of updatedDrivers) {
      const dbPayload = {
        user_id: session?.user.id,
        name: d.name || '',
        cpf: d.cpf || '',
        phone: d.phone || '',
        pix_key: d.pixKey || '',
        cnh: d.cnh || '',
        cnh_category: d.cnhCategory || '',
        cnh_validity: d.cnhValidity || null,
        status: d.status || 'Ativo',
        photo_url: d.photoUrl || '',
        custom_commission: d.customCommission || null
      };

      try {
        const isExisting = d.id && d.id.length > 20 && d.id.includes('-');
        if (!isExisting) {
          const { data, error } = await supabase.from('drivers').insert(dbPayload).select().single();
          if (error) throw error;
          if (data) {
            finalDrivers.push({
              ...data,
              cnhCategory: data.cnh_category,
              cnhValidity: data.cnh_validity,
              pixKey: data.pix_key,
              photoUrl: data.photo_url,
              customCommission: data.custom_commission
            });
          }
        } else {
          const { error } = await supabase.from('drivers').update(dbPayload).eq('id', d.id);
          if (error) throw error;
          finalDrivers.push(d);
        }
      } catch (err: any) {
        console.error('Persistence error for driver:', d.name, err);
        showToast(`Erro ao salvar ${d.name || 'motorista'}: ${err.message}`, 'error');
        finalDrivers.push(d);
      }
    }
    setDrivers(finalDrivers);
    showToast('Motoristas atualizados!');
  };

  const handleUpdateShippers = async (updatedShippers: Shipper[]) => {
    if (loadingData) return;
    showToast('Salvando tomadores...', 'info');

    const shippersToDelete = shippers.filter(s => s.id.length > 20 && !updatedShippers.find(us => us.id === s.id));
    for (const s of shippersToDelete) {
      try {
        await supabase.from('shippers').delete().eq('id', s.id);
      } catch (err) {
        console.error('Error deleting shipper:', err);
      }
    }

    const finalShippers: Shipper[] = [];
    for (const s of updatedShippers) {
      const dbPayload = {
        user_id: session?.user.id,
        name: s.name,
        cnpj_cpf: s.cnpj,
        email: s.email,
        phone: s.phone,
        avg_payment_days: s.avgPaymentDays,
        logo_url: s.logoUrl
      };

      try {
        const isExisting = s.id && s.id.length > 20 && s.id.includes('-');
        if (!isExisting) {
          const { data, error } = await supabase.from('shippers').insert(dbPayload).select().single();
          if (error) throw error;
          if (data) {
            finalShippers.push({
              ...data,
              cnpj: data.cnpj_cpf,
              avgPaymentDays: data.avg_payment_days,
              logoUrl: data.logo_url
            });
          }
        } else {
          const { error } = await supabase.from('shippers').update(dbPayload).eq('id', s.id);
          if (error) throw error;
          finalShippers.push(s);
        }
      } catch (err: any) {
        console.error('Persistence error for shipper:', s.name, err);
        showToast(`Erro ao salvar ${s.name}: ${err.message}`, 'error');
        finalShippers.push(s);
      }
    }
    setShippers(finalShippers);
    showToast('Tomadores atualizados!');
  };

  const handleUpdateBuggies = async (updatedBuggies: Buggy[]) => {
    if (loadingData) return;
    showToast('Salvando implementos...', 'info');

    const buggiesToDelete = buggies.filter(b => b.id.length > 20 && !updatedBuggies.find(ub => ub.id === b.id));
    for (const b of buggiesToDelete) {
      await supabase.from('buggies').delete().eq('id', b.id);
    }

    const finalBuggies: Buggy[] = [];
    for (const b of updatedBuggies) {
      const dbPayload = {
        user_id: session?.user.id,
        plate: b.plate,
        brand: b.brand,
        model: b.model,
        axles: b.axles,
        tire_type: b.tireType
      };

      try {
        const isExisting = b.id && b.id.length > 20 && b.id.includes('-');
        if (!isExisting) {
          const { data, error } = await supabase.from('buggies').insert(dbPayload).select().single();
          if (error) throw error;
          if (data) finalBuggies.push({ ...data, tireType: data.tire_type });
        } else {
          const { error } = await supabase.from('buggies').update(dbPayload).eq('id', b.id);
          if (error) throw error;
          finalBuggies.push(b);
        }
      } catch (err: any) {
        console.error('Persistence error for buggy:', b.plate, err);
        showToast(`Erro ao salvar carreta ${b.plate}: ${err.message}`, 'error');
        finalBuggies.push(b);
      }
    }
    setBuggies(finalBuggies);
    showToast('Implementos atualizados!');
  };

  const handleUpdateTires = async (updatedTires: Tire[]) => {
    if (loadingData) return;

    const finalTires: Tire[] = [];
    for (const t of updatedTires) {
      const dbPayload = {
        user_id: session?.user.id,
        vehicle_id: t.vehicleId,
        buggy_id: t.buggyId,
        serial_number: t.serialNumber,
        brand: t.brand,
        model: t.model,
        size: t.size,
        status: t.status,
        location: t.location,
        position: t.position,
        current_km: t.currentKm,
        cost: t.cost,
        install_date: t.installDate
      };

      try {
        const isExisting = t.id && t.id.length > 20 && t.id.includes('-');
        if (!isExisting) {
          const { data, error } = await supabase.from('tires').insert(dbPayload).select().single();
          if (error) throw error;
          if (data) finalTires.push({
            ...data,
            serialNumber: data.serial_number,
            vehicleId: data.vehicle_id,
            buggyId: data.buggy_id,
            currentKm: Number(data.current_km),
            cost: Number(data.cost),
            installDate: data.install_date
          });
        } else {
          const { error } = await supabase.from('tires').update(dbPayload).eq('id', t.id);
          if (error) throw error;
          finalTires.push(t);
        }
      } catch (err: any) {
        console.error('Persistence error for tire:', t.serialNumber, err);
        finalTires.push(t);
      }
    }
    setTires(finalTires);
  };

  const handleImportData = (data: any) => {
    setProfile(data.profile);
    setTrips(data.trips);
    setVehicles(data.vehicles);
    setDrivers(data.drivers);
    setShippers(data.shippers);
    setMaintenances(data.maintenances || []);
  };

  const handleVerifyPayment = async () => {
    if (!session) return;

    // SIMULAÇÃO: No mundo real, isso seria feito via Webhook do Mercado Pago/Stripe
    const { error } = await supabase
      .from('profiles')
      .update({
        payment_status: 'paid',
        plan_type: 'mensal' // Assume mensal por padrão na simulação
      })
      .eq('id', session.user.id);

    if (error) {
      alert("Erro ao verificar pagamento: " + error.message);
    } else {
      setProfile(prev => ({ ...prev, payment_status: 'paid', plan_type: 'mensal' }));
      alert("Pagamento Identificado! Seu acesso foi liberado. Bem-vindo ao Ribeirx Log!");
    }
  };

  const handleRefreshProfile = async () => {
    if (!session) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      setProfile({
        ...profileData,
        companyName: profileData.company_name,
        logoUrl: profileData.logo_url,
        signatureUrl: profileData.signature_url,
      } as any);

      if (profileData.payment_status === 'paid') {
        alert("Acesso Liberado! Aproveite o sistema.");
      } else {
        alert("Ainda não identificamos o pagamento. Se já pagou, aguarde alguns instantes.");
      }
    }
  };

  const handleResetData = async () => {
    if (window.confirm("Tem certeza que deseja apagar TODOS os seus dados?")) {
      await supabase.from('trips').delete().eq('user_id', session?.user.id);
      await supabase.from('vehicles').delete().eq('user_id', session?.user.id);
      await supabase.from('drivers').delete().eq('user_id', session?.user.id);
      await supabase.from('shippers').delete().eq('user_id', session?.user.id);
      await supabase.from('maintenance_records').delete().eq('user_id', session?.user.id);

      setTrips([]);
      setVehicles([]);
      setDrivers([]);
      setShippers([]);
      setMaintenances([]);
      setProfile(INITIAL_PROFILE);
      alert("Sistema resetado com sucesso.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
      case 'trips': return <Trips trips={trips} setTrips={setTrips} onUpdateTrip={handleUpdateTrip} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
      case 'performance':
        if (profile.config.enableBI === false) return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
        return <Performance trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} maintenances={maintenances} />;
      case 'tires':
        return <TireManagement vehicles={vehicles} buggies={buggies} tires={tires} onUpdateTires={handleUpdateTires} />;
      case 'maintenance':
        if (profile.config.enableMaintenance === false) return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
        return (
          <FleetHealth
            vehicles={vehicles}
            maintenances={maintenances}
            onAddMaintenance={handleSaveMaintenance}
            onUpdateMaintenance={handleUpdateMaintenance}
            onUpdateVehicleThresholds={handleUpdateVehicleThresholds}
          />
        );
      case 'setup': return (
        <Setup
          vehicles={vehicles}
          drivers={drivers}
          shippers={shippers}
          buggies={buggies}
          onUpdateVehicles={handleUpdateVehicles}
          onUpdateDrivers={handleUpdateDrivers}
          onUpdateShippers={handleUpdateShippers}
          onUpdateBuggies={handleUpdateBuggies}
        />
      );
      case 'intelligence': return (
        <StrategicIntelligence
          trips={trips}
          vehicles={vehicles}
          drivers={drivers}
          shippers={shippers}
          profile={profile}
          maintenances={maintenances}
          tires={tires}
          buggies={buggies}
        />
      );
      case 'new-trip': return <NewTrip vehicles={vehicles} drivers={drivers} shippers={shippers} onSave={handleSaveTrip} profile={profile} trips={trips} />;
      case 'settings':
        return (
          <Settings
            profile={profile}
            setProfile={handleUpdateProfile}
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            shippers={shippers}
            maintenances={maintenances}
            onImportData={(data) => {
              if (data.profile) setProfile(data.profile);
              if (data.trips) setTrips(data.trips);
              if (data.vehicles) setVehicles(data.vehicles);
              if (data.drivers) setDrivers(data.drivers);
              if (data.shippers) setShippers(data.shippers);
              if (data.maintenances) setMaintenances(data.maintenances);
            }}
            onResetData={() => {
              if (confirm("TEM CERTEZA?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          />
        );
      case 'tires':
        return <TireManagement vehicles={vehicles} />;
      case 'subscription': return <Subscription profile={profile} initialPlanIntent={pendingPlanIntent} onClearIntent={() => setPendingPlanIntent(null)} />;
      default: return null;
    }
  };

  if (loadingSession || (session && loadingData)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Sincronizando Dados...</p>
      </div>
    );
  }

  if (!session) {
    if (showAuth) {
      return (
        <div className="relative">
          <button
            onClick={() => setShowAuth(false)}
            className="fixed top-6 left-6 z-50 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all"
          >
            ← Voltar para Início
          </button>
          <Auth />
        </div>
      );
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} onPurchase={handleLandingPurchase} />;
  }

  // GATE DE PAGAMENTO - Somente para abas operacionais
  const isOperationalTab = !['subscription', 'settings'].includes(activeTab);
  if (profile.payment_status !== 'paid' && isOperationalTab) {
    return (
      <AppModeProvider profile={profile}>
        <div className="min-h-screen bg-slate-950 text-slate-200">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
          <Header
            profile={profile}
            notifications={notifications}
            onReadNotification={() => { }}
            setActiveTab={setActiveTab}
            activeTab={activeTab}
            onRefresh={() => {
              localStorage.removeItem('app_version');
              window.location.reload();
            }}
          />
          <main className="md:ml-64 p-4 md:p-8">
            <div className="max-w-7xl mx-auto pb-24 md:pb-8">
              <Paywall
                profile={profile}
                onRefreshProfile={handleRefreshProfile}
                onSignOut={() => supabase.auth.signOut()}
              />
            </div>
          </main>
        </div>
      </AppModeProvider>
    );
  }

  return (
    <AppModeProvider profile={profile}>
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
        <Header
          profile={profile}
          notifications={notifications}
          onReadNotification={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          onRefresh={() => {
            localStorage.removeItem('app_version');
            window.location.reload();
          }}
        />
        <main className="md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-24 md:pb-8">
            <Suspense fallback={
              <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Carregando Módulo...</p>
              </div>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/5 px-6 py-4 flex justify-between items-center z-[150] shadow-2xl">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-emerald-500 scale-110' : 'text-slate-500'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Início</span>
          </button>
          <button
            onClick={() => { setActiveTab('trips'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'trips' ? 'text-emerald-500 scale-110' : 'text-slate-500'}`}
          >
            <Truck className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Viagens</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center gap-1 transition-all ${isMobileMenuOpen ? 'text-emerald-500 scale-110' : 'text-slate-500'}`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6 border-2 border-slate-700 rounded-lg p-0.5" />}
            <span className="text-[10px] font-black uppercase tracking-tighter">Menu</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[140] bg-slate-950/95 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 md:hidden pt-28 pb-36 px-6 overflow-y-auto">
            <div className="flex items-center gap-3 mb-12 px-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck className="text-slate-950 w-7 h-7" />
              </div>
              <div>
                <span className="font-black text-2xl tracking-tight text-white uppercase italic block leading-none">RIBEIRX<span className="text-emerald-500">LOG</span></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Controle de Frota v2.0</span>
              </div>
            </div>

            <nav className="grid grid-cols-1 gap-3">
              {[
                { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
                { id: 'trips', label: 'Minhas Viagens', icon: Truck },
                { id: 'new-trip', label: 'Novo Lançamento', icon: PlusCircle, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20 shadow-lg shadow-sky-500/5' },
                { id: 'performance', label: 'Estatísticas & BI', icon: TrendingUp, hidden: profile.config.enableBI === false },
                { id: 'maintenance', label: 'Manutenção', icon: ShieldAlert, hidden: profile.config.enableMaintenance === false },
                { id: 'tires', label: 'Gestão de Pneus', icon: Disc, hidden: profile.config.enableMaintenance === false },
                { id: 'intelligence', label: 'Inteligência', icon: Brain },
                { id: 'setup', label: 'Cadastros Base', icon: Users },
                { id: 'subscription', label: 'Minha Assinatura', icon: CreditCard },
                { id: 'settings', label: 'Perfis & Opções', icon: SettingsIcon },
              ].filter(item => !item.hidden).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isLocked = profile.payment_status !== 'paid' && !['subscription', 'settings'].includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-5 rounded-[2.5rem] transition-all border ${isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-xl shadow-emerald-500/5'
                      : item.bg ? `${item.bg} text-white` : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800'
                      } ${isLocked ? 'opacity-50 grayscale select-none' : ''}`}
                  >
                    <div className="flex items-center gap-5">
                      <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                      <span className={`font-black text-sm uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                    </div>
                    {isLocked ? (
                      <ShieldAlert className="w-5 h-5 text-amber-500/50" />
                    ) : (
                      isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Ribeirx Log ERP',
                      text: 'Conheça o Ribeirx Log, o sistema que está transformando minha gestão de frota!',
                      url: window.location.origin
                    }).catch(() => { });
                  } else {
                    window.open(`https://wa.me/?text=Conheça o Ribeirx Log, o sistema que está transformando minha gestão de frota! Veja aqui: ${window.location.origin}`, '_blank');
                  }
                }}
                className="w-full mt-3 flex items-center gap-5 p-5 rounded-[2.5rem] bg-emerald-500 text-slate-950 transition-all hover:bg-emerald-400 font-black shadow-lg shadow-emerald-500/20"
              >
                <Share2 className="w-6 h-6" />
                <span className="text-sm uppercase tracking-widest">Indicar Amigos</span>
              </button>

              <button
                onClick={() => { supabase.auth.signOut(); setIsMobileMenuOpen(false); }}
                className="w-full mt-6 flex items-center gap-5 p-5 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
              >
                <X className="w-6 h-6" />
                <span className="font-black text-sm uppercase tracking-widest">Sair do Sistema</span>
              </button>

              <div className="mt-10 p-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Versão do Sistema: <span className="text-emerald-500">v{APP_VERSION}</span></p>
                <button
                  onClick={() => {
                    localStorage.removeItem('app_version');
                    window.location.href = window.location.origin + '?v=' + Date.now();
                  }}
                  className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                >
                  <RefreshCcw className="w-3 h-3" /> Forçar Atualização
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Toast Notification System */}
        {toast && (
          <div className="fixed bottom-24 md:bottom-8 right-8 z-[200] animate-in slide-in-from-right-10 duration-300">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-500 text-emerald-950' :
              toast.type === 'error' ? 'bg-rose-500 text-white' :
                'bg-sky-500 text-white'
              }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'info' && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span className="font-black text-xs uppercase tracking-widest">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </AppModeProvider>
  );
};

export default App;
