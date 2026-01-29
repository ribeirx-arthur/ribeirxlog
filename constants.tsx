
import { Vehicle, Driver, Shipper, Trip, UserProfile, VehiclePropertyType, MaintenanceRecord } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: 'Sophia Martinez',
  email: 'hey.sophia@evohus.com',
  companyName: 'Ribeirx Logística',
  config: {
    percMotFrete: 15,
    percMotDiaria: 50,
    autoSplitSociety: true,
    showMileage: true,
    paymentAlertDays: 10,
    notifyIncompleteData: true,
    notifyMaintenance: true,
    showTips: true
  }
};

export const MOCK_VEHICLES: Vehicle[] = [
  { 
    id: '1', 
    plate: 'RIB-1234', 
    name: 'R450 Highline', 
    brand: 'Scania',
    model: 'R450',
    year: 2022,
    type: VehiclePropertyType.PROPRIO, 
    societySplitFactor: 100,
    totalKmAccumulated: 45200,
    lastMaintenanceKm: 42000,
    thresholds: { oilChangeKm: 10000, tireChangeKm: 40000, brakeCheckKm: 15000, engineRevKm: 100000 }
  },
  { 
    id: '2', 
    plate: 'SOC-5678', 
    name: 'FH 540 Globetrotter', 
    brand: 'Volvo',
    model: 'FH 540',
    year: 2023,
    type: VehiclePropertyType.SOCIEDADE, 
    societySplitFactor: 50,
    totalKmAccumulated: 12400,
    lastMaintenanceKm: 10000,
    thresholds: { oilChangeKm: 10000, tireChangeKm: 40000, brakeCheckKm: 15000, engineRevKm: 100000 }
  },
];

export const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'm1',
    vehicleId: '1',
    date: '2023-11-05',
    kmAtMaintenance: 42000,
    type: 'Preventiva',
    description: 'Troca de óleo, filtros de ar e combustível. Revisão de freios dianteiros.',
    totalCost: 2450.00,
    provider: 'Scania Ribeirão'
  }
];

export const MOCK_DRIVERS: Driver[] = [
  { 
    id: '1', 
    name: 'João Silva', 
    cpf: '123.456.789-00', 
    phone: '(16) 99999-9999', 
    pixKey: 'joao.silva@email.com',
    cnh: '12345678', 
    cnhCategory: 'E', 
    cnhValidity: '2025-12-31',
    status: 'Ativo'
  },
];

export const MOCK_SHIPPERS: Shipper[] = [
  { 
    id: '1', 
    name: 'Ambev Logística', 
    cnpj: '00.000.000/0001-91', 
    email: 'financeiro@ambev.com.br',
    phone: '(11) 4004-0000',
    avgPaymentDays: 15 
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: '101',
    origin: 'Ribeirão Preto - SP',
    destination: 'São Paulo - SP',
    vehicleId: '1',
    driverId: '1',
    shipperId: '1',
    departureDate: '2023-10-01',
    returnDate: '2023-10-05',
    receiptDate: '2023-10-20',
    freteSeco: 5000,
    diarias: 400,
    adiantamento: 1500,
    combustivel: 1800,
    litersDiesel: 320,
    outrasDespesas: 200,
    status: 'Pago',
    totalKm: 620
  }
];
