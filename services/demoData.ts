import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const generateMockData = async (userId: string) => {
    try {
        // 1. Create a dummy vehicle
        const vehicleId = uuidv4();
        const { error: vErr } = await supabase.from('vehicles').insert({
            id: vehicleId,
            user_id: userId,
            plate: 'DEMO-1234',
            name: 'Caminhão Estrela',
            brand: 'Scania',
            model: 'R450',
            year: 2022,
            type: 'Próprio',
            total_km_accumulated: 154200,
            last_maintenance_km: 150000
        });
        if (vErr) console.error("Demo Vehicle creation fail:", vErr);

        // 2. Create a dummy driver
        const driverId = uuidv4();
        const { error: dErr } = await supabase.from('drivers').insert({
            id: driverId,
            user_id: userId,
            name: 'João do Exemplo',
            cpf: '000.000.000-00',
            phone: '(11) 99999-9999',
            cnh: '123456789',
            cnh_category: 'E',
            cnh_validity: '2025-12-31',
            status: 'Ativo'
        });
        if (dErr) console.error("Demo Driver creation fail:", dErr);

        // 3. Create a dummy shipper
        const shipperId = uuidv4();
        const { error: sErr } = await supabase.from('shippers').insert({
            id: shipperId,
            user_id: userId,
            name: 'Logística Transparente SA',
            customer_name: 'Logística Transparente SA',
            cnpj: '00.000.000/0001-00',
            avg_payment_days: 15
        });
        if (sErr) console.error("Demo Shipper creation fail:", sErr);

        // 4. Create some diverse dummy trips
        const now = new Date();
        const getRelDate = (daysAgo: number) => {
            const d = new Date();
            d.setDate(now.getDate() - daysAgo);
            return d.toISOString().split('T')[0];
        };

        const tripData = [
            { origin: 'Santos/SP', destination: 'Cuiabá/MT', frete: 8500, date: getRelDate(2), diesel: 3200 },
            { origin: 'Paranaguá/PR', destination: 'Rio Verde/GO', frete: 7200, date: getRelDate(5), diesel: 2800 },
            { origin: 'Rondonópolis/MT', destination: 'Santos/SP', frete: 9800, date: getRelDate(12), diesel: 3800 },
            { origin: 'Sorriso/MT', destination: 'Miritituba/PA', frete: 6500, date: getRelDate(18), diesel: 2500 },
            { origin: 'Uberlândia/MG', destination: 'Vitória/ES', frete: 5400, date: getRelDate(25), diesel: 2100 },
            { origin: 'Dourados/MS', destination: 'Paranaguá/PR', frete: 8100, date: getRelDate(40), diesel: 3000 },
        ];

        for (const trip of tripData) {
            const { error: tErr } = await supabase.from('trips').insert({
                id: uuidv4(),
                user_id: userId,
                origin: trip.origin,
                destination: trip.destination,
                vehicle_id: vehicleId,
                driver_id: driverId,
                shipper_id: shipperId,
                departure_date: trip.date,
                return_date: trip.date,
                receipt_date: trip.date,
                frete_seco: trip.frete,
                diarias: 500,
                adiantamento: 2000,
                combustivel: trip.diesel,
                liters_diesel: 550,
                outras_despesas: 150,
                status: 'Pago',
                total_km: 1200
            });
            if (tErr) console.error("Demo Trip creation fail:", tErr);
        }

        return true;
    } catch (err) {
        console.error("Critical Demo generation error:", err);
        return false;
    }
};
