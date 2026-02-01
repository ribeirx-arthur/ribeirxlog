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
        totalKmAccumulated: 154200,
        lastMaintenanceKm: 150000
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
        cnhCategory: 'E',
        cnhValidity: '2025-12-31',
        status: 'Ativo'
    });

    // 3. Create a dummy shipper
    const shipperId = uuidv4();
    await supabase.from('shippers').insert({
        id: shipperId,
        user_id: userId,
        name: 'Logística Transparente SA',
        cnpj: '00.000.000/0001-00',
        avgPaymentDays: 15
    });

    // 4. Create some dummy trips
    const tripId = uuidv4();
    await supabase.from('trips').insert({
        id: tripId,
        user_id: userId,
        origin: 'Santos/SP',
        destination: 'Cuiabá/MT',
        vehicleId: vehicleId,
        driverId: driverId,
        shipperId: shipperId,
        departureDate: '2024-01-10',
        returnDate: '2024-01-15',
        receiptDate: '2024-01-20',
        freteSeco: 8500,
        diarias: 500,
        adiantamento: 2000,
        combustivel: 3200,
        litersDiesel: 550,
        outrasDespesas: 150,
        status: 'Pago',
        totalKm: 1200
    });

    return true;
};
