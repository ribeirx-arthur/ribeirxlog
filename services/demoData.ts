import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const generateMockData = async (userId: string) => {
    // 1. Create a dummy vehicle
    const vehicleId = uuidv4();
    await supabase.from('vehicles').insert({
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

    // 2. Create a dummy driver
    const driverId = uuidv4();
    await supabase.from('drivers').insert({
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

    // 3. Create a dummy shipper
    const shipperId = uuidv4();
    await supabase.from('shippers').insert({
        id: shipperId,
        user_id: userId,
        name: 'Logística Transparente SA',
        customer_name: 'Logística Transparente SA', // Fallback for some older schemas
        cnpj: '00.000.000/0001-00',
        avg_payment_days: 15
    });

    // 4. Create some dummy trips
    const tripId = uuidv4();
    await supabase.from('trips').insert({
        id: tripId,
        user_id: userId,
        origin: 'Santos/SP',
        destination: 'Cuiabá/MT',
        vehicle_id: vehicleId,
        driver_id: driverId,
        shipper_id: shipperId,
        departure_date: '2024-01-10',
        return_date: '2024-01-15',
        receipt_date: '2024-01-20',
        frete_seco: 8500,
        diarias: 500,
        adiantamento: 2000,
        combustivel: 3200,
        liters_diesel: 550,
        outras_despesas: 150,
        status: 'Pago',
        total_km: 1200
    });

    return true;
};
