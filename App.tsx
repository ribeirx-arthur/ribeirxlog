
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Trips from './components/Trips';
import Performance from './components/Performance';
import SettingsView from './components/Settings';
import SubscriptionView from './components/SubscriptionView';
import NewTrip from './components/NewTrip';
import FleetHealth from './components/FleetHealth';
import Setup from './components/Setup';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Paywall from './components/Paywall';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Settings as SettingsIcon, LayoutDashboard, Truck, PlusCircle, CheckCircle2, AlertTriangle, Menu, X, Users, TrendingUp, ShieldAlert, CreditCard, RefreshCcw, Share2 } from 'lucide-react';
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
import { WHATSAPP_NUMBER } from './pricing';

const APP_VERSION = '1.0.4';

const App: React.FC = () => {
  useEffect(() => {
    const lastVersion = localStorage.getItem('app_version');
    if (lastVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      // Force reload from server bypassing cache
      window.location.reload();
    }
  }, []);
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
  const [loadingData, setLoadingData] = useState(true); // NEW
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPlanIntent, setPendingPlanIntent] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // FETCH DATA FROM SUPABASE
  useEffect(() => {
    if (session) {
      const loadData = async () => {
        const userId = session.user.id;

        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileData) {
          setProfile({
            ...profileData,
            companyName: profileData.company_name,
            logoUrl: profileData.logo_url,
            signatureUrl: profileData.signature_url,
          } as any);
        } else {
          // If no profile exists, create one from INITIAL_PROFILE
          await supabase.from('profiles').insert({
            id: userId,
            name: session.user.user_metadata?.name || '',
            email: session.user.email,
            company_name: '',
            config: INITIAL_PROFILE.config
          });
        }

        // Fetch Others
        const { data: vData } = await supabase.from('vehicles').select('*').eq('user_id', userId);
        const { data: dData } = await supabase.from('drivers').select('*').eq('user_id', userId);
        const { data: sData } = await supabase.from('shippers').select('*').eq('user_id', userId);
        const { data: tData } = await supabase.from('trips').select('*').eq('user_id', userId).order('departure_date', { ascending: false });
        const { data: mData } = await supabase.from('maintenance_records').select('*').eq('user_id', userId);

        if (vData) setVehicles(vData.map(v => ({ ...v, totalKmAccumulated: Number(v.total_km_accumulated), lastMaintenanceKm: Number(v.last_maintenance_km), societySplitFactor: v.society_split_factor })));
        if (dData) setDrivers(dData.map(d => ({ ...d, cnhCategory: d.cnh_category, cnhValidity: d.cnh_validity, pixKey: d.pix_key })));
        if (sData) setShippers(sData.map(s => ({ ...s, avgPaymentDays: s.avg_payment_days })));
        if (tData) setTrips(tData.map(t => ({
          ...t,
          vehicleId: t.vehicle_id,
          driverId: t.driver_id,
          shipperId: t.shipper_id,
          departureDate: t.departure_date,
          returnDate: t.return_date,
          receiptDate: t.receipt_date,
          freteSeco: Number(t.frete_seco),
          diarias: Number(t.diarias),
          adiantamento: Number(t.adiantamento),
          combustivel: Number(t.combustivel),
          litersDiesel: Number(t.liters_diesel),
          outrasDespesas: Number(t.outras_despesas),
          totalKm: Number(t.total_km)
        })));
        if (mData) setMaintenances(mData.map(m => ({ ...m, vehicleId: m.vehicle_id, kmAtMaintenance: Number(m.km_at_maintenance), totalCost: Number(m.total_cost) })));

        if (pendingPlanIntent) {
          setActiveTab('subscription');
        } else if (!profileData.company_name || !profileData.email) {
          setActiveTab('settings');
        }
        setLoadingData(false);
      };
      loadData();
    }
  }, [session]);

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

const handleSaveTrip = async (newTrip: Trip) => {
  if (!session) {
    showToast('Sessão expirada. Entre novamente.', 'error');
    return;
  }

  showToast('Salvando viagem...', 'info');

  try {
    const { data: savedTrip, error } = await supabase.from('trips').insert({
      origin: newTrip.origin,
      destination: newTrip.destination,
      vehicle_id: newTrip.vehicleId,
      driver_id: newTrip.driverId,
      shipper_id: newTrip.shipperId,
      departure_date: newTrip.departureDate || null,
      return_date: newTrip.returnDate || null,
      receipt_date: newTrip.receiptDate || null,
      frete_seco: Number(newTrip.freteSeco),
      diarias: Number(newTrip.diarias),
      adiantamento: Number(newTrip.adiantamento),
      combustivel: Number(newTrip.combustivel),
      liters_diesel: Number(newTrip.litersDiesel),
      outras_despesas: Number(newTrip.outrasDespesas),
      status: newTrip.status,
      total_km: Number(newTrip.totalKm),
      user_id: session.user.id
    }).select().single();

    if (error) throw error;

    if (savedTrip) {
      const formattedTrip = {
        ...savedTrip,
        vehicleId: savedTrip.vehicle_id,
        driverId: savedTrip.driver_id,
        shipperId: savedTrip.shipper_id,
        departureDate: savedTrip.departure_date,
        returnDate: savedTrip.return_date,
        receiptDate: savedTrip.receipt_date,
        freteSeco: Number(savedTrip.frete_seco),
        diarias: Number(savedTrip.diarias),
        adiantamento: Number(savedTrip.adiantamento),
        combustivel: Number(savedTrip.combustivel),
        litersDiesel: Number(savedTrip.liters_diesel),
        outrasDespesas: Number(savedTrip.outras_despesas),
        totalKm: Number(savedTrip.total_km)
      };

      setTrips([formattedTrip, ...trips]);

      // Update vehicle KM in Supabase
      const vehicle = vehicles.find(v => v.id === newTrip.vehicleId);
      if (vehicle) {
        const newKm = (vehicle.totalKmAccumulated || 0) + (newTrip.totalKm || 0);
        await supabase.from('vehicles').update({ total_km_accumulated: newKm }).eq('id', newTrip.vehicleId);
        setVehicles(prev => prev.map(v => v.id === newTrip.vehicleId ? { ...v, totalKmAccumulated: newKm } : v));
      }

      showToast('Viagem salva com sucesso!', 'success');
      setActiveTab('trips');
    }
  } catch (err: any) {
    console.error("Error saving trip:", err);
    showToast(`Erro ao salvar viagem: ${err.message}`, 'error');
  }
};

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

const handleLandingPurchase = (plan: string) => {
  const message = encodeURIComponent(`Olá Arthur! Estou na Landing Page e tenho interesse no plano ${plan}. Como faço para prosseguir com o pagamento?`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  setPendingPlanIntent(plan);
  setShowAuth(true);
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

const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
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
    case 'setup': return <Setup vehicles={vehicles} drivers={drivers} shippers={shippers} onUpdateVehicles={handleUpdateVehicles} onUpdateDrivers={handleUpdateDrivers} onUpdateShippers={handleUpdateShippers} />;
    case 'new-trip': return <NewTrip vehicles={vehicles} drivers={drivers} shippers={shippers} onSave={handleSaveTrip} profile={profile} />;
    case 'settings': return (
      <SettingsView
        profile={profile} setProfile={handleUpdateProfile}
        trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} maintenances={maintenances}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />
    );
    case 'subscription': return <SubscriptionView profile={profile} initialPlanIntent={pendingPlanIntent} onClearIntent={() => setPendingPlanIntent(null)} />;
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
  );
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
      onRefresh={() => {
        localStorage.removeItem('app_version');
        window.location.reload();
      }}
    />
    <main className="md:ml-64 p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-24 md:pb-8">{renderContent()}</div>
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
            { id: 'performance', label: 'Estatísticas & BI', icon: TrendingUp },
            { id: 'maintenance', label: 'Manutenção', icon: ShieldAlert },
            { id: 'setup', label: 'Cadastros Base', icon: Users },
            { id: 'subscription', label: 'Minha Assinatura', icon: CreditCard },
            { id: 'settings', label: 'Perfis & Opções', icon: SettingsIcon },
          ].map((item) => {
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
);
};

export default App;
