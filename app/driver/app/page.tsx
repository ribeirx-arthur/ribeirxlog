'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DriverApp from '@/components/DriverApp';
import { supabase } from '@/services/supabase';
import { Driver, Trip } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DriverAppPage() {
    const router = useRouter();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDriverData();
    }, []);

    const loadDriverData = async () => {
        try {
            const sessionStr = localStorage.getItem('driver_session');
            if (!sessionStr) {
                router.push('/driver/login');
                return;
            }

            const { token } = JSON.parse(sessionStr);

            // Load driver using RPC (security definer)
            const { data: driverData, error: driverError } = await supabase
                .rpc('get_driver_profile', { p_driver_token: token })
                .single(); // Expecting one driver

            if (driverError || !driverData) {
                console.error('Error loading driver:', driverError);
                localStorage.removeItem('driver_session');
                router.push('/driver/login');
                return;
            }

            // Load current trip using RPC (security definer)
            const { data: tripData, error: tripError } = await supabase
                .rpc('get_active_driver_trip', { p_driver_token: token })
                .maybeSingle();

            if (tripError) {
                console.error('Error loading trip:', tripError);
                // Don't block, maybe just no trip
            }

            setDriver(driverData as unknown as Driver);
            // Map RPC result to Trip type if needed, but assuming structure matches
            setCurrentTrip(tripData ? (tripData as unknown as Trip) : null);

        } catch (error) {
            console.error('Error loading driver data:', error);
            router.push('/driver/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('driver_session');
        router.push('/driver/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                    </div>
                    <p className="text-white font-bold">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!driver) {
        return null;
    }

    return (
        <DriverApp
            driver={driver}
            currentTrip={currentTrip}
            onLogout={handleLogout}
        />
    );
}
