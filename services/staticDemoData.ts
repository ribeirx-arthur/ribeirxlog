
export const STATIC_DEMO_PROFILE = {
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Carlos Oliveira (Demonstração)',
    email: 'demo@rbxlog.com',
    companyName: 'Oliveira Transportes & Logística',
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
        userRole: 'transportadora',
        theme: 'dark'
    }
};

export const STATIC_DEMO_VEHICLES = [
    {
        id: 'v-demo-1',
        plate: 'RBX-2026',
        name: 'Scania R500 V8',
        brand: 'Scania',
        model: 'R500',
        year: 2024,
        type: 'Próprio',
        totalKmAccumulated: 145000,
        lastMaintenanceKm: 140000,
        anttNumber: '123456789',
        anttValidity: '2026-12-31',
        tacografoValidity: '2025-06-15',
        licensingValidity: '2025-10-20',
        thresholds: {
            oilChangeKm: 15000,
            tireChangeKm: 50000,
            brakeCheckKm: 20000,
            engineRevKm: 150000
        }
    }
];

export const STATIC_DEMO_DRIVERS = [
    {
        id: 'd-demo-1',
        name: 'Ricardo Souza',
        cpf: '123.456.789-00',
        phone: '(11) 91234-5678',
        cnh: '987654321',
        cnhCategory: 'E',
        cnhValidity: '2027-01-01',
        status: 'Ativo',
        hasAppAccess: true
    }
];

export const STATIC_DEMO_SHIPPERS = [
    {
        id: 's-demo-1',
        name: 'AgroBrasil Commodities',
        cnpj: '11.222.333/0001-44',
        avgPaymentDays: 10
    },
    {
        id: 's-demo-2',
        name: 'Logística Transparente S.A.',
        cnpj: '22.333.444/0001-55',
        avgPaymentDays: 15
    }
];

export const STATIC_DEMO_TRIPS = [
    {
        id: 't-1',
        origin: 'Rondonópolis/MT',
        destination: 'Santos/SP',
        freteSeco: 14500,
        departureDate: '2025-02-10',
        status: 'Pago',
        totalKm: 1550,
        combustivel: 4200,
        diarias: 600,
        adiantamento: 3000,
        litersDiesel: 650,
        outrasDespesas: 200,
        transitStatus: 'Finalizado',
        vehicleId: 'v-demo-1',
        driverId: 'd-demo-1',
        shipperId: 's-demo-1'
    },
    {
        id: 't-2',
        origin: 'Santos/SP',
        destination: 'Uberlândia/MG',
        freteSeco: 8800,
        departureDate: '2025-02-15',
        status: 'Pago',
        totalKm: 600,
        combustivel: 1800,
        diarias: 400,
        adiantamento: 2000,
        litersDiesel: 250,
        outrasDespesas: 100,
        transitStatus: 'Finalizado',
        vehicleId: 'v-demo-1',
        driverId: 'd-demo-1',
        shipperId: 's-demo-2'
    },
    {
        id: 't-3',
        origin: 'Castro/PR',
        destination: 'Paranaguá/PR',
        freteSeco: 3200,
        departureDate: '2025-02-20',
        status: 'Pago',
        totalKm: 200,
        combustivel: 700,
        diarias: 200,
        adiantamento: 500,
        litersDiesel: 100,
        outrasDespesas: 50,
        transitStatus: 'Finalizado',
        vehicleId: 'v-demo-1',
        driverId: 'd-demo-1',
        shipperId: 's-demo-1'
    },
    {
        id: 't-4',
        origin: 'Sorriso/MT',
        destination: 'Miritituba/PA',
        freteSeco: 19500,
        departureDate: '2025-03-01',
        status: 'Pendente',
        totalKm: 1400,
        combustivel: 5500,
        diarias: 800,
        adiantamento: 4000,
        litersDiesel: 800,
        outrasDespesas: 300,
        transitStatus: 'Em Trânsito',
        vehicleId: 'v-demo-1',
        driverId: 'd-demo-1',
        shipperId: 's-demo-1'
    }
];

export const STATIC_DEMO_NOTIFICATIONS = [
    {
        id: 'n-1',
        type: 'maintenance',
        title: 'Manutenção Perto do Vencimento',
        message: 'A revisão do Scania R500 (RBX-2026) está vencendo em 500km.',
        date: new Date().toISOString(),
        read: false
    },
    {
        id: 'n-2',
        type: 'system',
        title: 'Bem-vindo ao Modo Demo',
        message: 'Explore todas as funcionalidades do RBX Log agora mesmo!',
        date: new Date().toISOString(),
        read: false
    }
];
