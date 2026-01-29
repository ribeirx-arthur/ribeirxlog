
export interface UserProfile {
  name: string;
  email: string;
  companyName: string;
  logoUrl?: string;
  signatureUrl?: string;
  phone?: string;
  config: {
    percMotFrete: number;
    percMotDiaria: number;
    autoSplitSociety: boolean;
    showMileage: boolean;
    // Novas flags de Notificação
    paymentAlertDays: number;
    notifyIncompleteData: boolean;
    notifyMaintenance: boolean;
    showTips: boolean;
    theme?: 'light' | 'dark';
  };
}

export enum VehiclePropertyType {
  PROPRIO = 'Próprio',
  SOCIEDADE = 'Sociedade'
}

export interface MaintenanceThresholds {
  oilChangeKm: number;
  tireChangeKm: number;
  brakeCheckKm: number;
  engineRevKm: number;
}

export interface Vehicle {
  id: string;
  plate: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  renavam?: string;
  type: VehiclePropertyType;
  societySplitFactor: number;
  totalKmAccumulated: number;
  lastMaintenanceKm: number;
  photoUrl?: string;
  thresholds?: MaintenanceThresholds;
}

export type MaintenanceType = 'Preventiva' | 'Corretiva' | 'Preditiva';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  kmAtMaintenance: number;
  type: MaintenanceType;
  description: string;
  totalCost: number;
  provider?: string;
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  pixKey?: string;
  cnh: string;
  cnhCategory: string;
  cnhValidity: string;
  status: 'Ativo' | 'Inativo';
  photoUrl?: string;
  customCommission?: {
    frete: number;
    diaria: number;
  };
}

export interface Shipper {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  avgPaymentDays: number;
  logoUrl?: string;
}

export type PaymentStatus = 'Pendente' | 'Parcial' | 'Pago';

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  shipperId: string;
  departureDate: string;
  returnDate: string;
  receiptDate: string;
  freteSeco: number;
  diarias: number;
  adiantamento: number;
  combustivel: number;
  litersDiesel: number;
  outrasDespesas: number;
  status: PaymentStatus;
  totalKm: number;
}

export interface AppNotification {
  id: string;
  type: 'payment_delay' | 'system' | 'maintenance' | 'incomplete';
  title: string;
  message: string;
  date: string;
  read: boolean;
  tripId?: string;
}

export interface FinancialResults {
  totalBruto: number;
  comissaoMotorista: number;
  saldoAReceber: number;
  lucroLiquidoReal: number;
  lucroSociety: number;
}

export type TabType = 'dashboard' | 'trips' | 'performance' | 'settings' | 'setup' | 'maintenance' | 'new-trip';
