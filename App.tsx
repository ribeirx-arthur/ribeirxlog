
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
  const [loadingData, setLoadingData] = useState(true); // NEW
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPlanIntent, setPendingPlanIntent] = useState<string | null>(null); // NEW

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

  const handleSaveTrip = async (newTrip: Trip) => {
    const { data: savedTrip, error } = await supabase.from('trips').insert({
      origin: newTrip.origin,
      destination: newTrip.destination,
      vehicle_id: newTrip.vehicleId,
      driver_id: newTrip.driverId,
      shipper_id: newTrip.shipperId,
      departure_date: newTrip.departureDate,
      return_date: newTrip.returnDate,
      receipt_date: newTrip.receiptDate,
      frete_seco: newTrip.freteSeco,
      diarias: newTrip.diarias,
      adiantamento: newTrip.adiantamento,
      combustivel: newTrip.combustivel,
      liters_diesel: newTrip.litersDiesel,
      outras_despesas: newTrip.outrasDespesas,
      status: newTrip.status,
      total_km: newTrip.totalKm,
      user_id: session?.user.id
    }).select().single();

    if (error) {
      console.error("Error saving trip:", error);
      return;
    }

    const formattedTrip = { ...savedTrip, vehicleId: savedTrip.vehicle_id, driverId: savedTrip.driver_id, shipperId: savedTrip.shipper_id, departureDate: savedTrip.departure_date, returnDate: savedTrip.return_date, receiptDate: savedTrip.receipt_date, freteSeco: Number(savedTrip.frete_seco), diarias: Number(savedTrip.diarias), adiantamento: Number(savedTrip.adiantamento), combustivel: Number(savedTrip.combustivel), litersDiesel: Number(savedTrip.liters_diesel), outrasDespesas: Number(savedTrip.outras_despesas), totalKm: Number(savedTrip.total_km) };

    setTrips([formattedTrip, ...trips]);

    // Update vehicle KM in Supabase
    const vehicle = vehicles.find(v => v.id === newTrip.vehicleId);
    if (vehicle) {
      const newKm = vehicle.totalKmAccumulated + newTrip.totalKm;
      await supabase.from('vehicles').update({ total_km_accumulated: newKm }).eq('id', newTrip.vehicleId);
      setVehicles(prev => prev.map(v => v.id === newTrip.vehicleId ? { ...v, totalKmAccumulated: newKm } : v));
    }

    setActiveTab('trips');
  };

  const handleUpdateTrip = async (updatedTrip: Trip) => {
    await supabase.from('trips').update({
      origin: updatedTrip.origin,
      destination: updatedTrip.destination,
      vehicle_id: updatedTrip.vehicleId,
      driver_id: updatedTrip.driverId,
      shipper_id: updatedTrip.shipperId,
      departure_date: updatedTrip.departureDate,
      return_date: updatedTrip.returnDate,
      receipt_date: updatedTrip.receiptDate,
      frete_seco: updatedTrip.freteSeco,
      diarias: updatedTrip.diarias,
      adiantamento: updatedTrip.adiantamento,
      combustivel: updatedTrip.combustivel,
      liters_diesel: updatedTrip.litersDiesel,
      outras_despesas: updatedTrip.outrasDespesas,
      status: updatedTrip.status,
      total_km: updatedTrip.totalKm
    }).eq('id', updatedTrip.id);

    const oldTrip = trips.find(t => t.id === updatedTrip.id);
    if (oldTrip && oldTrip.totalKm !== updatedTrip.totalKm) {
      const kmDiff = updatedTrip.totalKm - (oldTrip.totalKm || 0);
      const vehicle = vehicles.find(v => v.id === updatedTrip.vehicleId);
      if (vehicle) {
        const newKm = vehicle.totalKmAccumulated + kmDiff;
        await supabase.from('vehicles').update({ total_km_accumulated: newKm }).eq('id', updatedTrip.vehicleId);
        setVehicles(prev => prev.map(v => v.id === updatedTrip.vehicleId ? { ...v, totalKmAccumulated: newKm } : v));
      }
    }
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
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

  const handleUpdateVehicles = async (updatedVehicles: Vehicle[]) => {
    if (loadingData) return;

    setVehicles(currentVehicles => {
      const deleted = currentVehicles.filter(v => v.id.length > 20 && !updatedVehicles.find(uv => uv.id === v.id));
      deleted.forEach(async v => await supabase.from('vehicles').delete().eq('id', v.id));
      return updatedVehicles;
    });

    const finalVehicles: Vehicle[] = [];
    for (const v of updatedVehicles) {
      if (v.id.length <= 20) { // New item (local ID)
        const { data } = await supabase.from('vehicles').upsert({
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
        }).select().single();

        if (data) {
          finalVehicles.push({ ...data, totalKmAccumulated: Number(data.total_km_accumulated), lastMaintenanceKm: Number(data.last_maintenance_km), societySplitFactor: data.society_split_factor });
        } else {
          finalVehicles.push(v);
        }
      } else { // Existing item
        await supabase.from('vehicles').update({
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
        }).eq('id', v.id);
        finalVehicles.push(v);
      }
    }
    setVehicles(finalVehicles);
  };

  const handleUpdateDrivers = async (updatedDrivers: Driver[]) => {
    if (loadingData) return;

    setDrivers(currentDrivers => {
      const deleted = currentDrivers.filter(d => d.id.length > 20 && !updatedDrivers.find(ud => ud.id === d.id));
      deleted.forEach(async d => await supabase.from('drivers').delete().eq('id', d.id));
      return updatedDrivers;
    });

    const finalDrivers: Driver[] = [];
    for (const d of updatedDrivers) {
      if (d.id.length <= 20) {
        const { data } = await supabase.from('drivers').upsert({
          user_id: session?.user.id,
          name: d.name,
          cpf: d.cpf,
          phone: d.phone,
          pix_key: d.pixKey,
          cnh: d.cnh,
          cnh_category: d.cnhCategory,
          cnh_validity: d.cnhValidity,
          status: d.status,
          photo_url: d.photoUrl
        }).select().single();

        if (data) {
          finalDrivers.push({ ...data, cnhCategory: data.cnh_category, cnhValidity: data.cnh_validity, pixKey: data.pix_key });
        } else {
          finalDrivers.push(d);
        }
      } else {
        await supabase.from('drivers').update({
          name: d.name,
          cpf: d.cpf,
          phone: d.phone,
          pix_key: d.pixKey,
          cnh: d.cnh,
          cnh_category: d.cnhCategory,
          cnh_validity: d.cnhValidity,
          status: d.status,
          photo_url: d.photoUrl
        }).eq('id', d.id);
        finalDrivers.push(d);
      }
    }
    setDrivers(finalDrivers);
  };

  const handleUpdateShippers = async (updatedShippers: Shipper[]) => {
    if (loadingData) return;

    setShippers(currentShippers => {
      const deleted = currentShippers.filter(s => s.id.length > 20 && !updatedShippers.find(us => us.id === s.id));
      deleted.forEach(async s => await supabase.from('shippers').delete().eq('id', s.id));
      return updatedShippers;
    });

    const finalShippers: Shipper[] = [];
    for (const s of updatedShippers) {
      if (s.id.length <= 20) {
        const { data } = await supabase.from('shippers').upsert({
          user_id: session?.user.id,
          name: s.name,
          cnpj: s.cnpj,
          email: s.email,
          phone: s.phone,
          avg_payment_days: s.avgPaymentDays,
          logo_url: s.logoUrl
        }).select().single();

        if (data) {
          finalShippers.push({ ...data, avgPaymentDays: data.avg_payment_days });
        } else {
          finalShippers.push(s);
        }
      } else {
        await supabase.from('shippers').update({
          name: s.name,
          cnpj: s.cnpj,
          email: s.email,
          phone: s.phone,
          avg_payment_days: s.avgPaymentDays,
          logo_url: s.logoUrl
        }).eq('id', s.id);
        finalShippers.push(s);
      }
    }
    setShippers(finalShippers);
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
