"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useUser, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import Trips from '../components/Trips';
const Performance = React.lazy(() => import('../components/Performance'));
const Settings = React.lazy(() => import('../components/Settings'));
const Subscription = React.lazy(() => import('../components/SubscriptionView'));
const NewTrip = React.lazy(() => import('../components/NewTrip'));
const FleetHealth = React.lazy(() => import('../components/FleetHealth'));
const Setup = React.lazy(() => import('../components/Setup'));
const TireManagement = React.lazy(() => import('../components/TireManagement'));
const StrategicIntelligence = React.lazy(() => import('../components/StrategicIntelligence'));
const AdminPanel = React.lazy(() => import('../components/AdminPanel'));

import LandingPage from '../components/LandingPage';
import Paywall from '../components/Paywall';
import { supabase, createClerkSupabaseClient } from '../services/supabase';
import { Settings as SettingsIcon, LayoutDashboard, Truck, PlusCircle, CheckCircle2, AlertTriangle, Menu, X, Users, TrendingUp, ShieldAlert, CreditCard, RefreshCcw, Share2, Disc, Brain, ShieldCheck, Lock, Gauge, ArrowRightLeft } from 'lucide-react';
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
} from '../types';
import {
    INITIAL_PROFILE
} from '../constants';
import { WHATSAPP_NUMBER } from '../pricing';

const APP_VERSION = '1.7.0';

import { AppModeProvider } from '../contexts/AppModeContext';
import { generateMockData } from '../services/demoData';

export default function Home() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut, getToken } = useAuth();

    const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('setup');
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [pendingPlanIntent, setPendingPlanIntent] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [authenticatedClient, setAuthenticatedClient] = useState<any>(supabase);

    useEffect(() => {
        setMounted(true);
    }, []);

    // State Declarations
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [buggies, setBuggies] = useState<Buggy[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [shippers, setShippers] = useState<Shipper[]>([]);
    const [tires, setTires] = useState<Tire[]>([]);
    const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Sync profile email with Clerk
    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress && !profile.email) {
            setProfile(prev => ({ ...prev, email: user.primaryEmailAddress!.emailAddress }));
        }
    }, [user, profile.email]);

    // Theme Handler
    useEffect(() => {
        if (profile.config.theme === 'light') {
            document.documentElement.classList.add('light-mode');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark');
        }
    }, [profile.config.theme]);

    // Data Loading
    useEffect(() => {
        if (isSignedIn && user?.id) {
            setLoadingData(true);
            const fetchData = async () => {
                try {
                    let token = null;
                    try {
                        token = await getToken({ template: 'supabase' });
                    } catch (e) {
                        console.warn("Clerk Supabase Token Error: Verifique se o template 'supabase' foi criado no painel do Clerk.");
                    }
                    const client = token ? createClerkSupabaseClient(token) : supabase;
                    setAuthenticatedClient(client);

                    console.log("[DEBUG] Fetching profile for User ID:", user.id);
                    const { data: profileData, error: profileError } = await client.from('profiles').select('*').eq('id', user.id).single();
                    console.log("[DEBUG] Profile Data:", profileData);
                    console.log("[DEBUG] Profile Error:", profileError);

                    if (profileData) {
                        let parsedConfig = INITIAL_PROFILE.config;
                        if (profileData.config) {
                            parsedConfig = typeof profileData.config === 'string' ? JSON.parse(profileData.config) : profileData.config;
                        }
                        setProfile({
                            ...profileData,
                            companyName: profileData.company_name,
                            logoUrl: profileData.logo_url,
                            signatureUrl: profileData.signature_url,
                            config: parsedConfig
                        } as any);

                        // If profile exists and it's the first time, maybe we don't need mock data anymore 
                        // but the original logic had it for "preview" users.
                    } else if (profileError?.code === 'PGRST116') {
                        // New User - Create Profile
                        console.log("Creating new profile for:", user.id);
                        const { error: insertError } = await client.from('profiles').insert({
                            id: user.id,
                            email: user.primaryEmailAddress?.emailAddress,
                            name: user.fullName || user.username,
                            company_name: 'Minha Transportadora'
                        });
                        if (insertError) console.error("Error creating profile:", insertError);
                    }

                    const loadTable = async (table: string, setter: any, mapper?: any) => {
                        console.log(`[DEBUG] Loading table: ${table} for User ID: ${user.id}`);
                        const { data, error } = await client.from(table).select('*').eq('user_id', user.id);
                        if (error) {
                            console.error(`[DEBUG] Error loading ${table}:`, error);
                        } else if (data) {
                            console.log(`[DEBUG] Loaded ${data.length} records from ${table}`);
                            setter(mapper ? data.map(mapper) : data);
                        }
                    };

                    await Promise.all([
                        loadTable('trips', setTrips, (t: any) => ({
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
                        })),
                        loadTable('vehicles', setVehicles, (v: any) => ({
                            ...v,
                            totalKmAccumulated: Number(v.total_km_accumulated),
                            lastMaintenanceKm: Number(v.last_maintenance_km),
                            societySplitFactor: v.society_split_factor,
                            photoUrl: v.photo_url
                        })),
                        loadTable('drivers', setDrivers, (d: any) => ({
                            ...d,
                            cnhCategory: d.cnh_category,
                            cnhValidity: d.cnh_validity,
                            pixKey: d.pix_key,
                            photoUrl: d.photo_url,
                            customCommission: d.custom_commission
                        })),
                        loadTable('shippers', setShippers, (s: any) => ({
                            ...s,
                            cnpj: s.cnpj_cpf,
                            avgPaymentDays: s.avg_payment_days,
                            logoUrl: s.logo_url
                        })),
                        loadTable('buggies', setBuggies, (b: any) => ({
                            ...b,
                            tireType: b.tire_type
                        })),
                        loadTable('tires', setTires, (t: any) => ({
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
                    console.error('Error loading data', error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isSignedIn, user?.id, refreshTrigger]);

    const handleLandingPurchase = (plan: string) => {
        const message = encodeURIComponent(`Olá Arthur! Estou na Landing Page e tenho interesse no plano ${plan}. Como faço para prosseguir com o pagamento?`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        setPendingPlanIntent(plan);
        setShowAuth(true);
    };

    const handleSaveTrip = async (newTrip: Trip) => {
        if (!user) return;
        showToast('Salvando viagem...', 'info');
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { data, error } = await client.from('trips').insert({
                user_id: user.id,
                origin: newTrip.origin,
                destination: newTrip.destination,
                vehicle_id: newTrip.vehicleId === 'generic-vehicle' ? null : newTrip.vehicleId,
                driver_id: newTrip.driverId === 'generic-driver' ? null : newTrip.driverId,
                shipper_id: newTrip.shipperId === 'generic-shipper' ? null : newTrip.shipperId,
                departure_date: newTrip.departureDate || null,
                return_date: newTrip.returnDate || null,
                receipt_date: newTrip.receiptDate || null,
                frete_seco: Number(newTrip.freteSeco || 0),
                diarias: Number(newTrip.diarias || 0),
                adiantamento: Number(newTrip.adiantamento || 0),
                combustivel: Number(newTrip.combustivel || 0),
                liters_diesel: Number(newTrip.litersDiesel || 0),
                outras_despesas: Number(newTrip.outrasDespesas || 0),
                status: newTrip.status || 'Pendente',
                total_km: Number(newTrip.totalKm || 0)
            }).select().single();

            if (error) throw error;
            if (data) {
                setTrips(prev => [{
                    ...data,
                    vehicleId: data.vehicle_id,
                    driverId: data.driver_id,
                    shipperId: data.shipper_id,
                    departureDate: data.departure_date,
                    returnDate: data.return_date,
                    receiptDate: data.receipt_date,
                    freteSeco: Number(data.frete_seco || 0),
                    diarias: Number(data.diarias || 0),
                    adiantamento: Number(data.adiantamento || 0),
                    combustivel: Number(data.combustivel || 0),
                    litersDiesel: Number(data.liters_diesel || 0),
                    outrasDespesas: Number(data.outras_despesas || 0),
                    totalKm: Number(data.total_km || 0)
                }, ...prev]);
                showToast('Viagem salva!', 'success');
                setActiveTab('trips');
            }
        } catch (err: any) {
            showToast(`Erro: ${err.message}`, 'error');
        }
    };

    const handleUpdateTrip = async (updatedTrip: Trip) => {
        if (!user) return;
        showToast('Atualizando viagem...', 'info');
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('trips').update({
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
                    await client.from('vehicles').update({ total_km_accumulated: newKm }).eq('id', updatedTrip.vehicleId);
                    setVehicles(prev => prev.map(v => v.id === updatedTrip.vehicleId ? { ...v, totalKmAccumulated: newKm } : v));
                }
            }
            setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
            showToast('Viagem atualizada!', 'success');
        } catch (err: any) {
            showToast(`Erro ao atualizar: ${err.message}`, 'error');
        }
    };

    const handlePopulateDemoData = async () => {
        if (!user) return;
        showToast('Populando dados de teste...', 'info');
        try {
            const success = await generateMockData(user.id);
            if (success) {
                showToast('Interface alimentada com sucesso!', 'success');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showToast('Falha ao gerar dados.', 'error');
            }
        } catch (err) {
            showToast('Erro ao popular dados.', 'error');
        }
    };


    const handleDeleteTrip = async (tripId: string) => {
        if (!user) return;
        showToast('Excluindo viagem...', 'info');
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('trips').delete().eq('id', tripId);
            if (error) throw error;

            setTrips(prev => prev.filter(t => t.id !== tripId));
            showToast('Viagem excluída!', 'success');
        } catch (err: any) {
            showToast(`Erro ao excluir: ${err.message}`, 'error');
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('vehicles').delete().eq('id', vehicleId);
            if (error) throw error;

            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
            showToast('Veículo excluído!', 'success');
        } catch (err: any) {
            showToast(`Erro ao excluir veículo: ${err.message}`, 'error');
        }
    };

    const handleDeleteDriver = async (driverId: string) => {
        if (!user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('drivers').delete().eq('id', driverId);
            if (error) throw error;

            setDrivers(prev => prev.filter(d => d.id !== driverId));
            showToast('Motorista excluído!', 'success');
        } catch (err: any) {
            showToast(`Erro ao excluir motorista: ${err.message}`, 'error');
        }
    };

    const handleDeleteShipper = async (shipperId: string) => {
        if (!user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('shippers').delete().eq('id', shipperId);
            if (error) throw error;

            setShippers(prev => prev.filter(s => s.id !== shipperId));
            showToast('Transportadora excluída!', 'success');
        } catch (err: any) {
            showToast(`Erro ao excluir transportadora: ${err.message}`, 'error');
        }
    };

    const handleDeleteBuggy = async (buggyId: string) => {
        if (!user) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('buggies').delete().eq('id', buggyId);
            if (error) throw error;

            setBuggies(prev => prev.filter(b => b.id !== buggyId));
            showToast('Implemento excluído!', 'success');
        } catch (err: any) {
            showToast(`Erro ao excluir implemento: ${err.message}`, 'error');
        }
    };


    const handleSaveMaintenance = async (record: MaintenanceRecord) => {
        if (!user) return;
        const token = await getToken({ template: 'supabase' });
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { data: saved, error } = await client.from('maintenance_records').insert({
            vehicle_id: record.vehicleId,
            date: record.date,
            km_at_maintenance: record.kmAtMaintenance,
            type: record.type,
            description: record.description,
            total_cost: record.totalCost,
            provider: record.provider,
            user_id: user.id
        }).select().single();

        if (error) {
            showToast('Erro ao salvar manutenção', 'error');
            return;
        }

        const formatted = { ...saved, vehicleId: saved.vehicle_id, kmAtMaintenance: Number(saved.km_at_maintenance), totalCost: Number(saved.total_cost) };
        setMaintenances([formatted, ...maintenances]);

        await client.from('vehicles').update({ last_maintenance_km: record.kmAtMaintenance }).eq('id', record.vehicleId);
        setVehicles(prev => prev.map(v => v.id === record.vehicleId ? { ...v, lastMaintenanceKm: record.kmAtMaintenance } : v));
        showToast('Manutenção salva!', 'success');
    };
    const handleUpdateVehicles = () => setRefreshTrigger(prev => prev + 1);
    const handleUpdateDrivers = () => setRefreshTrigger(prev => prev + 1);
    const handleUpdateShippers = () => setRefreshTrigger(prev => prev + 1);
    const handleUpdateBuggies = () => setRefreshTrigger(prev => prev + 1);

    const handleUpdateProfile = async (newProfile: UserProfile) => {
        setProfile(newProfile);
        if (user) {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            await client.from('profiles').upsert({
                id: user.id,
                name: newProfile.name,
                email: user.primaryEmailAddress?.emailAddress,
                company_name: newProfile.companyName,
                logo_url: newProfile.logoUrl,
                signature_url: newProfile.signatureUrl,
                phone: newProfile.phone,
                config: newProfile.config,
                payment_status: newProfile.payment_status,
                plan_type: newProfile.plan_type,
                updated_at: new Date().toISOString()
            });
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} onPopulateDemo={handlePopulateDemoData} />;
            case 'trips': return <Trips trips={trips} setTrips={setTrips} onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
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
                    onDeleteVehicle={handleDeleteVehicle}
                    onDeleteDriver={handleDeleteDriver}
                    onDeleteShipper={handleDeleteShipper}
                    onDeleteBuggy={handleDeleteBuggy}
                />
            );
            case 'maintenance': return (
                <Suspense fallback={<div>Carregando...</div>}>
                    <FleetHealth vehicles={vehicles} maintenances={maintenances} onAddMaintenance={handleSaveMaintenance} onUpdateMaintenance={() => { }} onUpdateVehicleThresholds={() => { }} />
                </Suspense>
            );
            case 'new-trip': return <NewTrip vehicles={vehicles} drivers={drivers} shippers={shippers} onSave={handleSaveTrip} profile={profile} trips={trips} />;
            case 'settings': return <Settings profile={profile} setProfile={handleUpdateProfile} trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} maintenances={maintenances} onImportData={() => { }} onResetData={() => { }} />;
            case 'intelligence': return <StrategicIntelligence trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} maintenances={maintenances} tires={tires} buggies={buggies} />;
            case 'tires': return <TireManagement vehicles={vehicles} buggies={buggies} tires={tires} onUpdateTires={(newTires) => setTires(newTires)} />;
            case 'subscription': return <Subscription profile={profile} initialPlanIntent={pendingPlanIntent} onClearIntent={() => setPendingPlanIntent(null)} />;
            case 'admin':
                const isAdmin = ['arthur@ribeirxlog.com', 'arthur.ribeirx@gmail.com', 'arthurpsantos01@gmail.com', 'arthur.riberix@gmail.com', 'arthur_ribeiro09@outlook.com'].includes(user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '');
                if (!isAdmin) return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
                return <AdminPanel supabaseClient={authenticatedClient} />;
            default: return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
        }
    };

    if (!mounted || !isLoaded) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Sincronizando Clerk...</p>
            </div>
        );
    }

    if (!isSignedIn) {
        if (showAuth) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center relative p-6">
                    <button
                        onClick={() => setShowAuth(false)}
                        className="fixed top-6 left-6 z-50 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 transition-all"
                    >
                        ← Voltar para Início
                    </button>
                    <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                        {authMode === 'signin' ? (
                            <div className="space-y-4">
                                <SignIn routing="hash" signUpUrl="#signup" />
                                <p className="text-center text-xs text-slate-500">
                                    Não tem conta? <button onClick={() => setAuthMode('signup')} className="text-emerald-500 font-bold hover:underline">Cadastre-se</button>
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <SignUp routing="hash" signInUrl="#signin" />
                                <p className="text-center text-xs text-slate-500">
                                    Já tem conta? <button onClick={() => setAuthMode('signin')} className="text-emerald-500 font-bold hover:underline">Faça Login</button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return <LandingPage onGetStarted={() => setShowAuth(true)} onPurchase={handleLandingPurchase} />;
    }

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
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                />
                <main className="md:ml-64 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto pb-24 md:pb-8">
                        <Suspense fallback={<div>Carregando...</div>}>
                            {renderContent()}
                        </Suspense>
                    </div>
                </main>

                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed bottom-24 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 ${toast.type === 'success' ? 'bg-emerald-500 text-slate-950' :
                        toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white'
                        }`}>
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        <span className="font-bold text-sm tracking-tight">{toast.message}</span>
                    </div>
                )}

                {/* User Profile Hook Trigger for Logout in Sidebar would be via Clerk UserButton now */}
            </div>
        </AppModeProvider>
    );
}
