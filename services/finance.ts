
import { Trip, Vehicle, Driver, UserProfile, FinancialResults } from '../types';

export const calculateTripFinance = (
  trip: Trip,
  vehicle: Vehicle,
  driver: Driver,
  profile: UserProfile
): FinancialResults => {
  const { freteSeco, diarias, adiantamento, combustivel, outrasDespesas } = trip;
  
  // Commission logic
  const percFrete = driver.customCommission?.frete ?? profile.config.percMotFrete;
  const percDiaria = driver.customCommission?.diaria ?? profile.config.percMotDiaria;

  const totalBruto = freteSeco + diarias;
  const comissaoMotorista = (freteSeco * (percFrete / 100)) + (diarias * (percDiaria / 100));
  const saldoAReceber = totalBruto - adiantamento;
  
  const lucroLiquidoReal = totalBruto - (comissaoMotorista + combustivel + outrasDespesas);
  
  let lucroSociety = lucroLiquidoReal;
  if (vehicle.type === 'Sociedade') {
    lucroSociety = lucroLiquidoReal * (vehicle.societySplitFactor / 100);
  }

  return {
    totalBruto,
    comissaoMotorista,
    saldoAReceber,
    lucroLiquidoReal,
    lucroSociety
  };
};
