
import { Vehicle, Driver, Shipper, Trip, UserProfile, VehiclePropertyType, MaintenanceRecord } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: '',
  email: '',
  companyName: '',
  config: {
    percMotFrete: 10,
    percMotDiaria: 30,
    autoSplitSociety: true,
    showMileage: true,
    paymentAlertDays: 7,
    notifyIncompleteData: true,
    notifyMaintenance: true,
    showTips: true,
    enableMaintenance: true,
    enableBI: true,
    enableFreightCalculator: true,
    appMode: 'simple'
  }
};
