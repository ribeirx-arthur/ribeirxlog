
import { Vehicle, Driver, Shipper, Trip, UserProfile, VehiclePropertyType, MaintenanceRecord } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: 'Administrador',
  email: 'admin@ribeirxlog.com',
  companyName: 'Minha Transportadora',
  config: {
    percMotFrete: 10,
    percMotDiaria: 30,
    autoSplitSociety: true,
    showMileage: true,
    paymentAlertDays: 7,
    notifyIncompleteData: true,
    notifyMaintenance: true,
    showTips: true
  }
};
