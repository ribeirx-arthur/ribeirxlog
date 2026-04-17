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
const Intelligence = React.lazy(() => import('../components/StrategicIntelligence'));
const FreightCalculator = React.lazy(() => import('../components/FreightCalculator'));
const GPSTracking = React.lazy(() => import('../components/GPSTracking'));
const AdminPanel = React.lazy(() => import('../components/AdminPanel'));
import DriverManagement from '../components/DriverManagement';
const ProofGallery = React.lazy(() => import('../components/ProofGallery'));
const HelpCenter = React.lazy(() => import('../components/HelpCenter'));
const OngoingTrips = React.lazy(() => import('../components/OngoingTrips'));
const Bank = React.lazy(() => import('../components/Bank'));
import { OnboardingModal } from '../components/OnboardingModal';
const TutorialSidebar = React.lazy(() => import('../components/TutorialSidebar'));

import LandingPage from '../components/LandingPage';
import AssetCompliance from '../components/AssetCompliance';
import Paywall from '../components/Paywall';
import { supabase, createClerkSupabaseClient } from '../services/supabase';
import { Settings as SettingsIcon, LayoutDashboard, Truck, PlusCircle, CheckCircle2, AlertTriangle, Menu, X, Users, TrendingUp, ShieldAlert, CreditCard, RefreshCcw, Share2, Disc, Brain, ShieldCheck, Lock, Gauge, ArrowRightLeft, BookOpen } from 'lucide-react';
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
    MaintenanceThresholds,
    VehicleLocation,
    GPSAlert
} from '../types';
import {
    INITIAL_PROFILE
} from '../constants';
import { WHATSAPP_NUMBER } from '../pricing';

const APP_VERSION = '1.7.1-VINCULO-V2';

import { AppModeProvider } from '../contexts/AppModeContext';
import { generateMockData } from '../services/demoData';
import {
    STATIC_DEMO_PROFILE,
    STATIC_DEMO_VEHICLES,
    STATIC_DEMO_DRIVERS,
    STATIC_DEMO_SHIPPERS,
    STATIC_DEMO_TRIPS,
    STATIC_DEMO_NOTIFICATIONS
} from '../services/staticDemoData';

const INITIAL_THRESHOLDS: MaintenanceThresholds = {
    oilChangeKm: 10000,
    tireChangeKm: 40000,
    brakeCheckKm: 15000,
    engineRevKm: 100000
};

export default function Home() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut, getToken } = useAuth();
    const [isDemo, setIsDemo] = useState(false);
    const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

    const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [pendingPlanIntent, setPendingPlanIntent] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [authenticatedClient, setAuthenticatedClient] = useState<any>(supabase);

    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isProfileIncomplete = isSignedIn && (!profile.name || !profile.phone || !profile.config.onboardingCompleted);

    useEffect(() => {
        if (isProfileIncomplete && mounted) {
            setShowOnboardingModal(true);
        }
    }, [isProfileIncomplete, mounted]);

    // State Declarations
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [buggies, setBuggies] = useState<Buggy[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [shippers, setShippers] = useState<Shipper[]>([]);
    const [tires, setTires] = useState<Tire[]>([]);
    const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
    const [locations, setLocations] = useState<VehicleLocation[]>([]);
    const [gpsAlerts, setGpsAlerts] = useState<GPSAlert[]>([]);

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
        if ((isSignedIn && user?.id) || isDemo) {
            setLoadingData(true);
            const fetchData = async () => {
                const targetUserId = isDemo ? DEMO_USER_ID : user?.id;
                try {
                    let token = null;
                    if (!isDemo) {
                        try {
                            token = await getToken({ template: 'supabase' });
                        } catch (e) {
                            console.warn("Clerk Supabase Token Error: Verifique se o template 'supabase' foi criado no painel do Clerk.");
                        }
                    }
                    const client = token ? createClerkSupabaseClient(token) : supabase;
                    setAuthenticatedClient(client);

                    if (isDemo) {
                        setProfile(STATIC_DEMO_PROFILE as any);
                        setVehicles(STATIC_DEMO_VEHICLES as any);
                        setDrivers(STATIC_DEMO_DRIVERS as any);
                        setShippers(STATIC_DEMO_SHIPPERS as any);
                        setTrips(STATIC_DEMO_TRIPS as any);
                        setNotifications(STATIC_DEMO_NOTIFICATIONS as any);
                        setLoadingData(false);
                        setActiveTab('dashboard');
                        return;
                    }

                    console.log("[DEBUG] Fetching profile for User ID:", targetUserId);
                    const { data: profileData, error: profileError } = await client.from('profiles').select('*').eq('id', targetUserId).single();
                    console.log("[DEBUG] Profile Data:", profileData);

                    if (profileData) {
                        let parsedConfig = INITIAL_PROFILE.config;
                        if (profileData.config) {
                            parsedConfig = typeof profileData.config === 'string' ? JSON.parse(profileData.config) : profileData.config;
                        }
                        // Merge with defaults to ensure new fields are always present
                        const mergedConfig = { ...INITIAL_PROFILE.config, ...parsedConfig };
                        setProfile({
                            ...profileData,
                            email: profileData.email || (isDemo ? 'demo@rbxlog.com' : user?.primaryEmailAddress?.emailAddress) || '',
                            companyName: profileData.company_name,
                            logoUrl: profileData.logo_url,
                            signatureUrl: profileData.signature_url,
                            cpfCnpj: profileData.cpf_cnpj,
                            plan_type: profileData.plan_type,
                            payment_status: profileData.payment_status,
                            trial_ends_at: profileData.trial_ends_at,
                            subscription_expires_at: profileData.subscription_expires_at,
                            config: mergedConfig
                        } as any);

                        // Se o onboarding já foi completado, abrimos no dashboard
                        if (mergedConfig.onboardingCompleted) {
                            setActiveTab('dashboard');
                        }
                    } else if (profileError?.code === 'PGRST116') {
                        // New User - Create Profile
                        setActiveTab('setup');
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
                        try {
                            console.log(`[DEBUG] Loading table: ${table} for User ID: ${targetUserId}`);
                            let query = client.from(table).select('*');

                            const tablesWithUserId = [
                                'trips', 'vehicles', 'drivers', 'shippers',
                                'buggies', 'tires', 'maintenance_records', 'profiles',
                                'vehicle_locations', 'gps_alerts'
                            ];

                            if (tablesWithUserId.includes(table)) {
                                query = query.eq('user_id', targetUserId);
                            }

                            const { data, error } = await query;
                            if (error) throw error;
                            
                            if (data) {
                                setter(mapper ? data.map(mapper) : data);
                            }

                        } catch (err) {
                            console.error(`[DEBUG] Error loading ${table}:`, err);
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
                            totalKm: Number(t.total_km),
                            transitStatus: t.transit_status,
                            checklistCompleted: t.checklist_completed,
                            observations: t.observations,
                            paymentIda: Number(t.payment_ida || 0),
                            paymentVolta: Number(t.payment_volta || 0),
                            balanceIda: Number(t.balance_ida || 0),
                            balanceVolta: Number(t.balance_volta || 0),
                            driverCommissionPct: t.driver_commission_pct ? Number(t.driver_commission_pct) : undefined,
                            driverDiariaPct: t.driver_diaria_pct ? Number(t.driver_diaria_pct) : undefined
                        })),
                        loadTable('vehicles', setVehicles, (v: any) => ({
                            ...v,
                            totalKmAccumulated: Number(v.total_km_accumulated),
                            lastMaintenanceKm: Number(v.last_maintenance_km),
                            lastOilChangeKm: Number(v.last_oil_change_km || v.last_maintenance_km || 0),
                            lastTireChangeKm: Number(v.last_tire_change_km || 0),
                            lastBrakeCheckKm: Number(v.last_brake_check_km || v.last_maintenance_km || 0),
                            lastEngineRevKm: Number(v.last_engine_rev_km || 0),
                            thresholds: v.thresholds || INITIAL_THRESHOLDS,
                            societySplitFactor: Number(v.society_split_factor),
                            photoUrl: v.photo_url,
                            anttNumber: v.antt_number,
                            anttValidity: v.antt_validity,
                            tacografoValidity: v.tacografo_validity,
                            licensingValidity: v.licensing_validity,
                            insuranceValidity: v.insurance_validity,
                            insurancePolicy: v.insurance_policy
                        })),
                        loadTable('drivers', setDrivers, (d: any) => ({
                            ...d,
                            cnhCategory: d.cnh_category,
                            cnhValidity: d.cnh_validity,
                            pixKey: d.pix_key,
                            photoUrl: d.photo_url,
                            customCommission: d.custom_commission,
                            vehicleId: d.vehicle_id,
                            moppValidity: d.mopp_validity,
                            examValidity: d.exam_validity
                        })),
                        loadTable('shippers', setShippers, (s: any) => ({
                            ...s,
                            cnpj: s.cnpj,
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
                        loadTable('maintenance_records', setMaintenances, (m: any) => ({
                            ...m,
                            vehicleId: m.vehicle_id,
                            kmAtMaintenance: Number(m.km_at_maintenance),
                            totalCost: Number(m.total_cost || 0)
                        })),
                        loadTable('vehicle_locations', setLocations, (l: any) => ({
                            ...l,
                            vehicleId: l.vehicle_id || trips.find(t => t.id === l.trip_id)?.vehicleId || '',
                            timestamp: l.timestamp
                        })),
                        loadTable('gps_alerts', setGpsAlerts, (a: any) => ({
                            vehicleId: a.vehicle_id,
                            resolved: !!a.resolved
                        }))
                    ]);
                } catch (error) {
                    console.error('Error loading data', error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isSignedIn, user?.id, refreshTrigger, isDemo]); // Added isDemo to dependency array

    // Real-time GPS Tracking updates
    useEffect(() => {
        if (!user || !isSignedIn || isDemo) return; // Do not subscribe to real-time updates in demo mode

        const channel = supabase
            .channel('gps-live-updates')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'vehicle_locations' },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newLoc = payload.new as any;
                        setLocations(prev => {
                            const exists = prev.find(l => l.id === newLoc.id);
                            const updatedLoc = {
                                ...newLoc,
                                vehicleId: newLoc.vehicle_id || trips.find(t => t.id === newLoc.trip_id)?.vehicleId || ''
                            };
                            if (exists) {
                                return prev.map(l => l.id === newLoc.id ? updatedLoc : l);
                            }
                            return [updatedLoc, ...prev];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, isSignedIn, trips, isDemo]); // Added isDemo to dependency array

    const handleLandingPurchase = (plan: string) => {
        setPendingPlanIntent(plan);
        setShowAuth(true);
    };

    const handleSaveTrip = async (newTrip: Trip) => {
        if (!user && !isDemo) return;
        showToast('Salvando viagem...', 'info');
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            const { data, error } = await client.from('trips').insert({
                user_id: userId,
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
                total_km: Number(newTrip.totalKm || 0),
                transit_status: newTrip.transitStatus || 'Agendado',
                checklist_completed: newTrip.checklistCompleted || false,
                observations: newTrip.observations || '',
                payment_ida: Number(newTrip.paymentIda || 0),
                payment_volta: Number(newTrip.paymentVolta || 0),
                balance_ida: Number(newTrip.balanceIda || 0),
                balance_volta: Number(newTrip.balanceVolta || 0),
                driver_commission_pct: Number(newTrip.driverCommissionPct ?? (drivers.find(d => d.id === newTrip.driverId)?.customCommission?.frete ?? profile.config.percMotFrete)),
                driver_diaria_pct: Number(newTrip.driverDiariaPct ?? (drivers.find(d => d.id === newTrip.driverId)?.customCommission?.diaria ?? profile.config.percMotDiaria))
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
                    totalKm: Number(data.total_km || 0),
                    transitStatus: data.transit_status,
                    checklistCompleted: data.checklist_completed,
                    observations: data.observations,
                    paymentIda: Number(data.payment_ida || 0),
                    paymentVolta: Number(data.payment_volta || 0),
                    balanceIda: Number(data.balance_ida || 0),
                    balanceVolta: Number(data.balance_volta || 0)
                }, ...prev]);
                showToast('Viagem salva!', 'success');
                setActiveTab('trips');
            }
        } catch (err: any) {
            showToast(`Erro: ${err.message}`, 'error');
        }
    };

    const handleUpdateTrip = async (updatedTrip: Trip) => {
        if (!user && !isDemo) return;
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
                total_km: Number(updatedTrip.totalKm),
                transit_status: updatedTrip.transitStatus,
                checklist_completed: updatedTrip.checklistCompleted,
                observations: updatedTrip.observations || '',
                payment_ida: Number(updatedTrip.paymentIda || 0),
                payment_volta: Number(updatedTrip.paymentVolta || 0),
                balance_ida: Number(updatedTrip.balanceIda || 0),
                balance_volta: Number(updatedTrip.balanceVolta || 0),
                driver_commission_pct: Number(updatedTrip.driverCommissionPct ?? (drivers.find(d => d.id === updatedTrip.driverId)?.customCommission?.frete ?? profile.config.percMotFrete)),
                driver_diaria_pct: Number(updatedTrip.driverDiariaPct ?? (drivers.find(d => d.id === updatedTrip.driverId)?.customCommission?.diaria ?? profile.config.percMotDiaria))
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
        if (!user && !isDemo) return;
        showToast('Populando dados de teste...', 'info');
        try {
            const userId = isDemo ? DEMO_USER_ID : user?.id;
            const success = await generateMockData(userId);
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
        if (!user && !isDemo) return;
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
        if (!user && !isDemo) return;
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
        if (!user && !isDemo) return;
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

    const handleAddDriver = async (newDriver: Partial<Driver>) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            const dbDriver = {
                user_id: userId,
                name: newDriver.name,
                cpf: newDriver.cpf,
                phone: newDriver.phone,
                cnh: newDriver.cnh,
                cnh_category: newDriver.cnhCategory,
                cnh_validity: newDriver.cnhValidity,
                status: newDriver.status,
                photo_url: newDriver.photoUrl,
                vehicle_id: newDriver.vehicleId,
                mopp_validity: newDriver.moppValidity,
                exam_validity: newDriver.examValidity
            };

            // Use RPC to bypass RLS issues on insert
            const { data, error } = await client.rpc('create_driver', { driver_data: dbDriver });

            if (error) throw error;

            // RPC returns single object, not array
            const driverData = data;

            const createdDriver: Driver = {
                ...driverData,
                cnhCategory: driverData.cnh_category,
                photoUrl: driverData.photo_url,
                hasAppAccess: driverData.has_app_access,
                accessToken: driverData.access_token,
                lastLogin: driverData.last_login,
                vehicleId: driverData.vehicle_id,
                moppValidity: driverData.mopp_validity,
                examValidity: driverData.exam_validity
            };
            setDrivers(prev => [...prev, createdDriver]);
            showToast('Motorista adicionado com sucesso!', 'success');
        } catch (e: any) {
            console.error('Error adding driver:', e);
            showToast(`Erro ao adicionar motorista: ${e.message}`, 'error');
        }
    };

    const handleUpdateDriver = async (updatedDriver: Driver) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('drivers').update({
                name: updatedDriver.name,
                cpf: updatedDriver.cpf,
                phone: updatedDriver.phone,
                cnh: updatedDriver.cnh,
                cnh_category: updatedDriver.cnhCategory,
                cnh_validity: updatedDriver.cnhValidity,
                pix_key: updatedDriver.pixKey,
                status: updatedDriver.status,
                has_app_access: updatedDriver.hasAppAccess,
                access_token: updatedDriver.accessToken,
                vehicle_id: updatedDriver.vehicleId,
                mopp_validity: updatedDriver.moppValidity,
                exam_validity: updatedDriver.examValidity
            }).eq('id', updatedDriver.id);

            if (error) throw error;

            setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
            showToast('Motorista atualizado!', 'success');
        } catch (err: any) {
            showToast(`Erro ao atualizar: ${err.message}`, 'error');
        }
    };

    const handleDeleteShipper = async (shipperId: string) => {
        if (!user && !isDemo) return;
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
        if (!user && !isDemo) return;
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
        if (!user && !isDemo) return;
        const token = await getToken({ template: 'supabase' });
        const client = token ? createClerkSupabaseClient(token) : supabase;
        const userId = isDemo ? DEMO_USER_ID : user?.id;

        const { data: saved, error } = await client.from('maintenance_records').insert({
            vehicle_id: record.vehicleId,
            date: record.date,
            km_at_maintenance: record.kmAtMaintenance,
            type: record.type,
            description: record.description,
            total_cost: record.totalCost,
            provider: record.provider,
            user_id: userId
        }).select().single();

        if (error) {
            showToast('Erro ao salvar manutenção', 'error');
            return;
        }

        const formatted = { ...saved, vehicleId: saved.vehicle_id, kmAtMaintenance: Number(saved.km_at_maintenance), totalCost: Number(saved.total_cost) };
        setMaintenances([formatted, ...maintenances]);

        // Atualizar o odômetro e status do veículo
        await client.from('vehicles').update({
            last_maintenance_km: record.kmAtMaintenance,
            last_oil_change_km: record.description.toLowerCase().includes('óleo') ? record.kmAtMaintenance : undefined,
            last_brake_check_km: record.description.toLowerCase().includes('freio') ? record.kmAtMaintenance : undefined,
        }).eq('id', record.vehicleId);

        setVehicles(prev => prev.map(v => v.id === record.vehicleId ? {
            ...v,
            lastMaintenanceKm: record.kmAtMaintenance,
            lastOilChangeKm: record.description.toLowerCase().includes('óleo') ? record.kmAtMaintenance : v.lastOilChangeKm,
            lastBrakeCheckKm: record.description.toLowerCase().includes('freio') ? record.kmAtMaintenance : v.lastBrakeCheckKm,
        } : v));
        showToast('Manutenção salva!', 'success');
    };

    const handleUpdateMaintenance = async (record: MaintenanceRecord) => {
        if (!user && !isDemo) return;
        const token = await getToken({ template: 'supabase' });
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { error } = await client.from('maintenance_records').update({
            vehicle_id: record.vehicleId,
            date: record.date,
            km_at_maintenance: record.kmAtMaintenance,
            type: record.type,
            description: record.description,
            total_cost: record.totalCost,
            provider: record.provider
        }).eq('id', record.id);

        if (error) {
            showToast('Erro ao atualizar manutenção', 'error');
            return;
        }

        setMaintenances(prev => prev.map(m => m.id === record.id ? record : m));
        showToast('Manutenção atualizada!', 'success');
    };

    // ─── SYSTEM ALERTS (CNH) ───
    useEffect(() => {
        if (!drivers.length) return;

        const checkAlerts = () => {
            const today = new Date();
            const newAlerts: AppNotification[] = [];

            drivers.forEach(d => {
                if (d.cnhValidity) {
                    const validityDate = new Date(d.cnhValidity);
                    const diffTime = validityDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 0) {
                        newAlerts.push({
                            id: `cnh-expired-${d.id}`,
                            title: `🚨 CNH VENCIDA: ${d.name.split(' ')[0]}`,
                            message: `CNH de ${d.name} venceu em ${validityDate.toLocaleDateString()}.`,
                            date: new Date().toISOString(),
                            read: false,
                            type: 'system'
                        });
                    } else if (diffDays <= 30) {
                        newAlerts.push({
                            id: `cnh-warning-${d.id}`,
                            title: `⚠️ Renovar CNH: ${d.name.split(' ')[0]}`,
                            message: `Vence em ${diffDays} dias (${validityDate.toLocaleDateString()}).`,
                            date: new Date().toISOString(),
                            read: false,
                            type: 'system'
                        });
                    }
                }
            });

            if (newAlerts.length > 0) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const unique = newAlerts.filter(a => !existingIds.has(a.id));
                    return unique.length ? [...unique, ...prev] : prev;
                });
            }
        };
        checkAlerts();
    }, [drivers]);

    const handleDeleteMaintenance = async (id: string) => {
        if (!user && !isDemo) return;
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;

        const token = await getToken({ template: 'supabase' });
        const client = token ? createClerkSupabaseClient(token) : supabase;

        const { error } = await client.from('maintenance_records').delete().eq('id', id);

        if (error) {
            showToast('Erro ao excluir manutenção', 'error');
            return;
        }

        setMaintenances(prev => prev.filter(m => m.id !== id));
        showToast('Registro removido!', 'success');
    };

    const handleUpdateVehicleThresholds = async (vehicleId: string, thresholds: MaintenanceThresholds) => {
        if (!user && !isDemo) return;
        console.log("[MAINT] Force-updating thresholds for vehicle:", vehicleId, thresholds);
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;

            const { error } = await client.from('vehicles').update({
                thresholds: {
                    oilChangeKm: Number(thresholds.oilChangeKm),
                    tireChangeKm: Number(thresholds.tireChangeKm),
                    brakeCheckKm: Number(thresholds.brakeCheckKm),
                    engineRevKm: Number(thresholds.engineRevKm)
                }
            }).eq('id', vehicleId);

            if (error) {
                console.error("[MAINT] Supabase error updating thresholds:", error);
                throw error;
            }

            setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, thresholds } : v));
            showToast('Metas de manutenção atualizadas!', 'success');
        } catch (err: any) {
            console.error("[MAINT] Catch error updating thresholds:", err);
            showToast(`Erro ao atualizar metas: ${err.message}`, 'error');
        }
    };

    const handleResetVehicleComponent = async (vehicleId: string, component: 'oil' | 'tire' | 'brake' | 'engine') => {
        if (!user && !isDemo) return;
        console.log("[MAINT] Force-resetting health for component:", component, "on vehicle:", vehicleId);
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle) return;

            const currentKm = vehicle.totalKmAccumulated;
            const updateField = {
                oil: 'last_oil_change_km',
                tire: 'last_tire_change_km',
                brake: 'last_brake_check_km',
                engine: 'last_engine_rev_km'
            }[component];

            const { error } = await client.from('vehicles').update({ [updateField]: currentKm }).eq('id', vehicleId);

            if (error) {
                console.error("[MAINT] Supabase error resetting component:", error);
                throw error;
            }

            setVehicles(prev => prev.map(v => v.id === vehicleId ? {
                ...v,
                [component === 'oil' ? 'lastOilChangeKm' : component === 'tire' ? 'lastTireChangeKm' : component === 'brake' ? 'lastBrakeCheckKm' : 'lastEngineRevKm']: currentKm
            } : v));

            showToast('Saúde do componente resetada para 100%!', 'success');
        } catch (err: any) {
            console.error("[MAINT] Catch error resetting component health:", err);
            showToast(`Erro ao resetar saúde: ${err.message}`, 'error');
        }
    };
    const handleAddVehicle = async (v: Partial<Vehicle>) => {
        if (!user && !isDemo) return;

        // PLAN LIMIT CHECK
        const plan = profile?.plan_type || 'none';
        const isLimited = plan === 'piloto' || plan === 'none';
        if (isLimited && vehicles.length >= 1 && !isDemo) { // Allow unlimited in demo
            showToast('Limite de veículos atingido no plano Piloto. Faça upgrade para cadastrar mais!', 'error');
            return; // Block creation
        }

        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            const dbV = {
                user_id: userId,
                plate: v.plate?.toUpperCase(), name: v.name, brand: v.brand, model: v.model, year: v.year,
                type: v.type, society_split_factor: v.societySplitFactor,
                total_km_accumulated: v.totalKmAccumulated || 0,
                photo_url: v.photoUrl,
                antt_number: v.anttNumber,
                antt_validity: v.anttValidity,
                tacografo_validity: v.tacografoValidity,
                licensing_validity: v.licensingValidity,
                insurance_validity: v.insuranceValidity,
                insurance_policy: v.insurancePolicy
            };
            const { data, error } = await client.from('vehicles').insert(dbV).select().single();
            if (error) throw error;
            const newV = {
                ...data,
                totalKmAccumulated: Number(data.total_km_accumulated),
                lastMaintenanceKm: Number(data.last_maintenance_km),
                societySplitFactor: Number(data.society_split_factor),
                photoUrl: data.photo_url,
                anttNumber: data.antt_number,
                anttValidity: data.antt_validity,
                tacografoValidity: data.tacografo_validity,
                licensingValidity: data.licensing_validity,
                insuranceValidity: data.insurance_validity,
                insurancePolicy: data.insurance_policy,
                thresholds: INITIAL_THRESHOLDS
            };
            setVehicles(prev => [...prev, newV]);
            showToast('Veículo adicionado!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleUpdateVehicle = async (v: Vehicle) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const { error } = await client.from('vehicles').update({
                plate: v.plate.toUpperCase(), name: v.name, brand: v.brand, model: v.model, year: v.year,
                type: v.type, society_split_factor: v.societySplitFactor,
                photo_url: v.photoUrl,
                antt_number: v.anttNumber,
                antt_validity: v.anttValidity,
                tacografo_validity: v.tacografoValidity,
                licensing_validity: v.licensingValidity,
                insurance_validity: v.insuranceValidity,
                insurance_policy: v.insurancePolicy
            }).eq('id', v.id);
            if (error) throw error;
            setVehicles(prev => prev.map(item => item.id === v.id ? v : item));
            showToast('Veículo atualizado!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleAddShipper = async (s: Partial<Shipper>) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            const dbS = {
                user_id: userId,
                name: s.name, cnpj: s.cnpj, avg_payment_days: s.avgPaymentDays,
                email: s.email, phone: s.phone, logo_url: s.logoUrl
            };
            const { data, error } = await client.from('shippers').insert(dbS).select().single();
            if (error) throw error;
            const newS = { ...data, cnpj: data.cnpj, avgPaymentDays: data.avg_payment_days, logoUrl: data.logo_url };
            setShippers(prev => [...prev, newS]);
            showToast('Transportadora adicionada!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleUpdateShipper = async (s: Shipper) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const { error } = await client.from('shippers').update({
                name: s.name, cnpj: s.cnpj, avg_payment_days: s.avgPaymentDays,
                email: s.email, phone: s.phone, logo_url: s.logoUrl
            }).eq('id', s.id);
            if (error) throw error;
            setShippers(prev => prev.map(item => item.id === s.id ? s : item));
            showToast('Transportadora atualizada!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleAddBuggy = async (b: Partial<Buggy>) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            const dbB = {
                user_id: userId,
                plate: b.plate?.toUpperCase(), brand: b.brand, model: b.model, axles: b.axles, tire_type: b.tireType
            };
            const { data, error } = await client.from('buggies').insert(dbB).select().single();
            if (error) throw error;
            const newB = { ...data, tireType: data.tire_type };
            setBuggies(prev => [...prev, newB]);
            showToast('Implemento adicionado!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleUpdateBuggy = async (b: Buggy) => {
        if (!user && !isDemo) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const { error } = await client.from('buggies').update({
                plate: b.plate.toUpperCase(), brand: b.brand, model: b.model, axles: b.axles, tire_type: b.tireType
            }).eq('id', b.id);
            if (error) throw error;
            setBuggies(prev => prev.map(item => item.id === b.id ? b : item));
            showToast('Implemento atualizado!', 'success');
        } catch (e: any) { showToast(`Erro: ${e.message}`, 'error'); }
    };

    const handleUpdateProfile = async (newProfile: UserProfile) => {
        setProfile(newProfile);
        if (user || isDemo) {
            const token = await getToken({ template: 'supabase' });
            const client = token ? createClerkSupabaseClient(token) : supabase;
            const userId = isDemo ? DEMO_USER_ID : user?.id;

            await client.from('profiles').upsert({
                id: userId,
                name: newProfile.name,
                email: isDemo ? 'demo@rbxlog.com' : user?.primaryEmailAddress?.emailAddress,
                company_name: newProfile.companyName,
                logo_url: newProfile.logoUrl,
                signature_url: newProfile.signatureUrl,
                phone: newProfile.phone,
                cpf_cnpj: newProfile.cpfCnpj,
                config: newProfile.config,
                payment_status: newProfile.payment_status,
                plan_type: newProfile.plan_type,
                updated_at: new Date().toISOString()
            });
        }
    };

    const renderContent = () => {
        const userEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() || '';
        const adminEmails = [
            'arthur@ribeirxlog.com',
            'arthur.ribeirx@gmail.com',
            'arthur.riberix@gmail.com',
            'arthurpsantos01@gmail.com',
            'arthur_ribeiro09@outlook.com'
        ];
        const isAdmin = adminEmails.includes(userEmail) ||
            userEmail.endsWith('@ribeirxlog.com') ||
            user?.username?.toLowerCase().includes('ribeirxlog') ||
            (profile.name?.toLowerCase().includes('ribeirxlog'));

        // Verifica se é free (não pagou e não é admin e não é demo)
        const isFreeUser = profile?.payment_status !== 'paid' && !isAdmin && !isDemo;

        switch (activeTab) {
            case 'dashboard': return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} onPopulateDemo={handlePopulateDemoData} setActiveTab={setActiveTab} />;
            case 'drivers':
                if (isFreeUser) {
                    return <Paywall title="Gestão de Motoristas" plan="Piloto" price="R$ 49,90" features={['Cadastro Completo', 'Controle de CNH', 'Comissões Automáticas']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Carregando Motoristas...</div>}>
                        <DriverManagement
                            drivers={drivers}
                            vehicles={vehicles}
                            onAddDriver={handleAddDriver}
                            onUpdateDriver={handleUpdateDriver}
                            onDeleteDriver={handleDeleteDriver}
                        />
                    </Suspense>
                );
            case 'trips':
                if (isFreeUser) {
                    return <Paywall title="Gestão de Viagens" plan="Piloto" price="R$ 49,90" features={['Registro de Viagens', 'Cálculo de Lucro Real', 'Histórico Completos']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return <Trips trips={trips} setTrips={setTrips} onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} />;
            case 'ongoing-trips':
                // Aba exclusiva PRO
                const isPro = ['gestor_pro', 'frota_elite', 'lifetime', 'anual'].includes(profile.plan_type || '');
                if (!isPro && !isAdmin) {
                    return <Paywall title="Viagens em Andamento" plan="Gestor Pro" price="R$ 89,90" features={['Monitoramento de Recebíveis', 'Controle Ida & Volta', 'Visão Estratégica Ativa']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Carregando Monitoramento...</div>}>
                        <OngoingTrips 
                            trips={trips} 
                            vehicles={vehicles} 
                            drivers={drivers} 
                            profile={profile} 
                            onEditTrip={handleUpdateTrip}
                        />
                    </Suspense>
                );
            case 'bank':
                if (!['gestor_pro', 'frota_elite', 'lifetime', 'anual'].includes(profile.plan_type || '') && !isAdmin) {
                    return <Paywall title="Extrato Bancário" plan="Gestor Pro" price="R$ 149,90" features={['Extrato Consolidado', 'Controle de Entradas', 'Fluxo de Caixa']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Carregando Banco...</div>}>
                        <Bank 
                            trips={trips} 
                            vehicles={vehicles} 
                            drivers={drivers} 
                            shippers={shippers}
                            profile={profile} 
                        />
                    </Suspense>
                );
            case 'setup':
                if (isFreeUser) {
                    return <Paywall title="Cadastro de Frota" plan="Piloto" price="R$ 49,90" features={['Cadastro de Veículos', 'Embarcadores', 'Unidades de Carga']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Setup
                        vehicles={vehicles}
                        drivers={drivers}
                        shippers={shippers}
                        buggies={buggies}

                        onAddVehicle={handleAddVehicle}
                        onUpdateVehicle={handleUpdateVehicle}
                        onDeleteVehicle={handleDeleteVehicle}

                        onAddDriver={handleAddDriver}
                        onUpdateDriver={handleUpdateDriver}
                        onDeleteDriver={handleDeleteDriver}

                        onAddShipper={handleAddShipper}
                        onUpdateShipper={handleUpdateShipper}
                        onDeleteShipper={handleDeleteShipper}

                        onAddBuggy={handleAddBuggy}
                        onUpdateBuggy={handleUpdateBuggy}
                        onDeleteBuggy={handleDeleteBuggy}
                        profile={profile}
                    />

                );
            case 'maintenance':
                if (isFreeUser) {
                    return <Paywall title="Manutenção da Frota" plan="Gestor Pro" price="R$ 89,90" features={['Controle de Revisões', 'Alertas de Troca', 'Histórico de Manutenções']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Carregando...</div>}>
                        <FleetHealth
                            vehicles={vehicles}
                            maintenances={maintenances}
                            onAddMaintenance={handleSaveMaintenance}
                            onUpdateMaintenance={handleUpdateMaintenance}
                            onDeleteMaintenance={handleDeleteMaintenance}
                            onUpdateVehicleThresholds={handleUpdateVehicleThresholds}
                            onResetComponent={handleResetVehicleComponent}
                            profile={profile}
                        />
                    </Suspense>
                );

            case 'new-trip':
                if (isFreeUser) {
                    return <Paywall title="Nova Viagem" plan="Piloto" price="R$ 49,90" features={['Registro de Viagens', 'Cálculo Automático de Lucro', 'Controle de Despesas']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return <NewTrip vehicles={vehicles} drivers={drivers} shippers={shippers} onSave={handleSaveTrip} profile={profile} trips={trips} />;
            case 'settings': return <Settings profile={profile} setProfile={handleUpdateProfile} trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} maintenances={maintenances} onImportData={() => { }} onResetData={() => { }} />;
            case 'performance':
                if (isFreeUser) {
                    return <Paywall title="Business Intelligence (BI)" plan="Gestor Pro" price="R$ 89,90" features={['Gráficos de Lucro Bruto', 'Análise de Margem por KM', 'Performance por Motorista']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Carregando BI...</div>}>
                        <Performance trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} maintenances={maintenances} />
                    </Suspense>
                );
            case 'intelligence':
                if (isFreeUser) {
                    return <Paywall title="Inteligência de Dados" plan="Gestor Pro" price="R$ 89,90" features={['Previsão de Gastos', 'Alertas de Ineficiência', 'Otimização de Rotas']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Iniciando Inteligência Estratégica...</div>}>
                        <Intelligence trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} maintenances={maintenances} tires={tires} buggies={buggies} />
                    </Suspense>
                );
            case 'freight-calculator':
                if (isFreeUser) {
                    return <Paywall title="Calculadora de Frete" plan="Piloto" price="R$ 49,90" features={['Cálculo de Custos', 'Margem de Lucro', 'Estimativa de Diesel']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return <FreightCalculator vehicles={vehicles} profile={profile} />;
            case 'gps-tracking':
                if (isFreeUser) {
                    return <Paywall title="Rastreamento em Tempo Real" plan="Gestor Pro" price="R$ 89,90" features={['Localização Exata', 'Alertas de Velocidade', 'Cerca Virtual']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return (
                    <Suspense fallback={<div>Iniciando satélites...</div>}>
                        <GPSTracking
                            vehicles={vehicles}
                            trips={trips}
                            drivers={drivers}
                            locations={locations}
                            alerts={gpsAlerts}
                            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                        />
                    </Suspense>
                );
            case 'proof-gallery': return (
                <Suspense fallback={<div>Carregando galeria...</div>}>
                    <ProofGallery
                        trips={trips}
                        vehicles={vehicles}
                        drivers={drivers}
                    />
                </Suspense>
            );
            case 'tires':
                if (isFreeUser) {
                    return <Paywall title="Controle de Pneus" plan="Gestor Pro" price="R$ 89,90" features={['Gestão de Vidas', 'Custo por KM de Pneu', 'Alertas de Rodízio']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return <TireManagement vehicles={vehicles} buggies={buggies} tires={tires} onUpdateTires={(newTires) => setTires(newTires)} />;
            case 'subscription': return <Subscription profile={profile} initialPlanIntent={pendingPlanIntent} onClearIntent={() => setPendingPlanIntent(null)} />;
            case 'help': return (
                <Suspense fallback={<div>Carregando ajuda...</div>}>
                    <HelpCenter />
                </Suspense>
            );
            case 'compliance':
                if (isFreeUser) {
                    return <Paywall title="Compliance & Documentos" plan="Gestor Pro" price="R$ 89,90" features={['Gestão de CNH/ANTT', 'Validade de Seguros', 'Alertas de Vencimento']} onUpgrade={() => setActiveTab('subscription')} />;
                }
                return <AssetCompliance vehicles={vehicles} drivers={drivers} />;
            case 'admin':
                if (!isAdmin) return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} onPopulateDemo={handlePopulateDemoData} setActiveTab={setActiveTab} />;
                return <AdminPanel profile={profile} supabaseClient={authenticatedClient} />;
            default: return <Dashboard trips={trips} vehicles={vehicles} drivers={drivers} shippers={shippers} profile={profile} setActiveTab={setActiveTab} />;
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

    if (!isSignedIn && !isDemo) {
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
        return (
            <LandingPage
                onGetStarted={() => setShowAuth(true)}
                onPurchase={handleLandingPurchase}
                onDemo={() => setIsDemo(true)}
            />
        );
    }

    // ─── FINAL RENDER ───

    const handleOnboardingComplete = async (updatedData: Partial<UserProfile>) => {
        const newProfile = { ...profile, ...updatedData };
        setProfile(newProfile);
        setShowOnboardingModal(false);
        
        if (!isDemo && user) {
            try {
                const dbPayload: any = {
                    name: updatedData.name,
                    phone: updatedData.phone,
                    config: updatedData.config
                };
                if (updatedData.companyName) dbPayload.company_name = updatedData.companyName;

                const { error } = await authenticatedClient
                    .from('profiles')
                    .update(dbPayload)
                    .eq('id', user.id);
                
                if (error) throw error;
                showToast('Perfil configurado com sucesso!', 'success');
            } catch (e) {
                console.error("Error saving onboarding:", e);
                showToast('Erro ao salvar perfil, mas você pode continuar.', 'error');
            }
        }
    };

    return (
        <AppModeProvider profile={profile}>
            <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden ${!mounted ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
                
                <OnboardingModal 
                    isOpen={showOnboardingModal} 
                    onComplete={handleOnboardingComplete}
                    profile={profile}
                />

                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    profile={profile}
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    appVersion={APP_VERSION}
                    isDemo={isDemo}
                    isCollapsed={isSidebarCollapsed}
                    setIsCollapsed={setIsSidebarCollapsed}
                />
                <Header
                    profile={profile}
                    notifications={notifications}
                    onReadNotification={() => { }}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                    isMobileMenuOpen={isMobileMenuOpen}
                    isDemo={isDemo}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    onOpenTutorial={() => setShowTutorial(true)}
                    isSidebarCollapsed={isSidebarCollapsed}
                />
                <main className={`transition-all duration-500 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} p-4 md:p-8`}>
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

                {/* Tutorial Sidebar */}
                <Suspense fallback={null}>
                    <TutorialSidebar
                        isOpen={showTutorial}
                        onClose={() => setShowTutorial(false)}
                        setActiveTab={setActiveTab}
                        tutorialMode={(profile.config as any).tutorialMode || 'simple'}
                    />
                </Suspense>

                {/* Floating Help Button */}
                {!showTutorial && (
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="fixed bottom-6 right-6 z-[185] w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all active:scale-95 hover:scale-110 group"
                        title="Central de Ajuda"
                    >
                        <BookOpen className="w-5 h-5" />
                    </button>
                )}
            </div>
        </AppModeProvider>
    );
}
