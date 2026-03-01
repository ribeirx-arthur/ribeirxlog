
const SUPABASE_URL = 'https://smwzfhbazdjrkoywpnfd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtd3pmaGJhemRqcmtveXdwbmZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYzODM1NiwiZXhwIjoyMDg1MjE0MzU2fQ.yeLyesYmXIsG-VKFra0D0wZ2TIZkJkmEVcmKXcBh4DM';
const DEMO_FIXED_ID = '00000000-0000-0000-0000-000000000000'; // Fixed UUID for demo

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function postData(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function upsertProfile(data) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${DEMO_FIXED_ID}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
    });
}

async function populate() {
    console.log('--- Populando ID Fixo Demo ---');

    await upsertProfile({
        id: DEMO_FIXED_ID,
        name: 'Carlos Oliveira (Demonstração)',
        email: 'demo@rbxlog.com',
        company_name: 'Oliveira Transportes & Logística',
        phone: '(11) 98888-7777',
        plan_type: 'frota_elite',
        payment_status: 'paid',
        config: {
            appMode: 'advanced',
            onboardingCompleted: true,
            showTips: true,
            notifyMaintenance: true,
            calculateDepreciation: true,
            enableBI: true,
            enableFreightCalculator: true,
            userRole: 'transportadora'
        }
    });

    const vId = generateUUID();
    await postData('vehicles', {
        id: vId,
        user_id: DEMO_FIXED_ID,
        plate: 'RBX-2026',
        name: 'Scania R500 V8',
        brand: 'Scania',
        model: 'R500',
        year: 2024,
        type: 'Próprio',
        total_km_accumulated: 145000,
        last_maintenance_km: 140000,
        antt_number: '123456789',
        antt_validity: '2026-12-31',
        tacografo_validity: '2025-06-15',
        licensing_validity: '2025-10-20'
    });

    const dId = generateUUID();
    await postData('drivers', {
        id: dId,
        user_id: DEMO_FIXED_ID,
        name: 'Ricardo Souza',
        cpf: '123.456.789-00',
        phone: '(11) 91234-5678',
        cnh: '987654321',
        cnh_category: 'E',
        cnh_validity: '2027-01-01',
        status: 'Ativo',
        has_app_access: true
    });

    const sId = generateUUID();
    await postData('shippers', {
        id: sId,
        user_id: DEMO_FIXED_ID,
        name: 'AgroBrasil Commodities',
        cnpj: '11.222.333/0001-44',
        avg_payment_days: 10
    });

    const tripData = [
        { origin: 'Rondonópolis/MT', dest: 'Santos/SP', frete: 14500, date: '2025-02-10', status: 'Pago', km: 1550, diesel: 4200 },
        { origin: 'Santos/SP', dest: 'Uberlândia/MG', frete: 8800, date: '2025-02-15', status: 'Pago', km: 600, diesel: 1800 },
        { origin: 'Castro/PR', dest: 'Paranaguá/PR', frete: 3200, date: '2025-02-20', status: 'Pago', km: 200, diesel: 700 },
        { origin: 'Sorriso/MT', dest: 'Miritituba/PA', frete: 19500, date: '2025-03-01', status: 'Pendente', km: 1400, diesel: 5500 },
    ];

    for (const t of tripData) {
        await postData('trips', {
            id: generateUUID(),
            user_id: DEMO_FIXED_ID,
            origin: t.origin,
            destination: t.dest,
            vehicle_id: vId,
            driver_id: dId,
            shipper_id: sId,
            departure_date: t.date,
            frete_seco: t.frete,
            diarias: 600,
            adiantamento: 3000,
            combustivel: t.diesel,
            liters_diesel: 650,
            outras_despesas: 200,
            status: t.status,
            total_km: t.km,
            transit_status: t.status === 'Pago' ? 'Finalizado' : 'Em Trânsito'
        });
    }

    console.log('--- Demo ID 0000...0000 Populado! ---');
}

populate();
