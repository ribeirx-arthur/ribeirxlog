'use client';

import { useEffect, useState } from 'react';
import DriverManagement from '@/components/DriverManagement';
import { supabase } from '@/services/supabase';
import { Driver } from '@/types';
import { Loader2 } from 'lucide-react';

export default function MotoristasPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([loadDrivers(), loadVehicles()]).finally(() => setLoading(false));
    }, []);

    const loadVehicles = async () => {
        const { data } = await supabase.from('vehicles').select('*');
        if (data) setVehicles(data);
    };

    const loadDrivers = async () => {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) {
                setDrivers(data.map((d: any) => ({
                    ...d,
                    cnhCategory: d.cnh_category,
                    cnhValidity: d.cnh_validity,
                    pixKey: d.pix_key,
                    photoUrl: d.photo_url,
                    customCommission: d.custom_commission,
                    vehicleId: d.vehicle_id
                })));
            }
        } catch (error) {
            console.error('Erro ao carregar motoristas:', error);
        } finally {
            // Loading set in useEffect
        }
    };

    const handleAddDriver = async (driver: Partial<Driver>) => {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .insert([driver])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setDrivers([...drivers, data]);
                alert('Motorista adicionado com sucesso!');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao adicionar motorista');
        }
    };

    const handleUpdateDriver = async (driver: Driver) => {
        // Logic to update driver state if needed
        loadDrivers();
    };


    const handleDeleteDriver = async (id: string) => {
        if (!confirm('Excluir este motorista?')) return;
        const { error } = await supabase.from('drivers').delete().eq('id', id);
        if (!error) {
            setDrivers(prev => prev.filter(d => d.id !== id));
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-950 items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-slate-950 min-h-screen p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-black text-white mb-2">Gestão de Motoristas</h1>
                <p className="text-slate-400 mb-8">Controle de acesso, monitoramento e geração de links.</p>

                <DriverManagement
                    drivers={drivers}
                    vehicles={vehicles}
                    onAddDriver={handleAddDriver}
                    onUpdateDriver={handleUpdateDriver}
                    onDeleteDriver={handleDeleteDriver}
                />
            </div>
        </div>
    );
}
