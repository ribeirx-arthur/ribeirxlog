
export interface UserProfile {
  id?: string;
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
    enableMaintenance: boolean;
    enableBI: boolean;
    enableFreightCalculator: boolean;
    appMode: 'simple' | 'intermediate' | 'advanced' | 'custom';
    enabledFeatures?: string[];
  };
  plan_type?: 'none' | 'mensal' | 'anual' | 'lifetime';
  payment_status?: 'unpaid' | 'paid' | 'trial' | 'preview';
  trial_ends_at?: string;
  subscription_expires_at?: string;
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
  lastOilChangeKm?: number;
  lastTireChangeKm?: number;
  lastBrakeCheckKm?: number;
  lastEngineRevKm?: number;
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
  cnhPhotoUrl?: string;
  customCommission?: {
    frete: number;
    diaria: number;
  };
  // Access control
  hasAppAccess: boolean;
  accessToken?: string;
  lastLogin?: string;
  email?: string;
  password?: string; // Hashed
  vehicleId?: string;
  vehicleName?: string;
  vehiclePlate?: string;
}

export interface TripProof {
  id: string;
  tripId: string;
  type: 'cte' | 'nfe' | 'receipt' | 'fuel' | 'toll' | 'expense' | 'delivery' | 'loading';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: 'driver' | 'manager';
  uploadedAt: string;
  description?: string;
  amount?: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export type UserRole = 'owner' | 'manager' | 'driver';

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
  returnDate?: string;
  receiptDate?: string;
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


export interface Tire {
  id: string;
  brand: string;
  model: string;
  size: string;
  serialNumber?: string;
  status: 'new' | 'good' | 'warning' | 'critical' | 'disposed';
  location: 'stock' | 'vehicle' | 'buggy';
  vehicleId?: string;
  buggyId?: string;
  position?: string;
  currentKm: number;
  installDate?: string;
  cost: number;
}

export interface Buggy {
  id: string;
  plate: string;
  brand: string;
  model: string;
  axles: number;
  tireType: 'single' | 'dual';
}

export interface TireMaintenance {
  id: string;
  tireId: string;
  date: string;
  type: 'rotation' | 'repair' | 'retread' | 'install';
  cost: number;
  description: string;
  kmAtMaintenance: number;
}

export type TirePosition = 'fl' | 'fr' | 'dl1o' | 'dl1i' | 'dr1i' | 'dr1o' | 'dl2o' | 'dl2i' | 'dr2i' | 'dr2o' | string;

export interface VehicleLocation {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees (0-360)
  accuracy: number; // meters
  timestamp: string;
  tripId?: string;
  address?: string; // reverse geocoding
  altitude?: number;
  batteryLevel?: number;
}

export interface GPSAlert {
  id: string;
  vehicleId: string;
  type: 'speed_limit' | 'geofence_exit' | 'stop_too_long' | 'route_deviation' | 'offline';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: { lat: number; lng: number }; // for circle
  radius?: number; // meters, for circle
  coordinates?: Array<{ lat: number; lng: number }>; // for polygon
  alertOnEntry: boolean;
  alertOnExit: boolean;
  active: boolean;
}

export type TabType = 'dashboard' | 'trips' | 'performance' | 'settings' | 'setup' | 'maintenance' | 'new-trip' | 'subscription' | 'tires' | 'buggies' | 'intelligence' | 'admin' | 'freight-calculator' | 'gps-tracking' | 'drivers' | 'proof-gallery';
