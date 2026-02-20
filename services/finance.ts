
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

  // Saldo a Receber da Transportadora: valor bruto menos o que já foi adiantado.
  // A comissão do motorista é um custo administrativo pago pelo gestor, não descontado no saldo da transportadora.
  const saldoAReceber = totalBruto - adiantamento;

  // Depreciation logic (Pneu e Manutenção)
  let depreciationCost = 0;
  if (profile.config.calculateDepreciation && trip.totalKm > 0) {
    // Estimativa RBS baseada em eixos (similar à calculadora)
    const axles = vehicle.axles || 6;
    const axleConfig = {
      2: { tireWear: 0.25, maintenance: 0.15 },
      3: { tireWear: 0.45, maintenance: 0.30 },
      4: { tireWear: 0.65, maintenance: 0.40 },
      6: { tireWear: 0.85, maintenance: 0.60 },
      9: { tireWear: 1.30, maintenance: 0.90 },
    }[axles as keyof typeof axleConfig] || { tireWear: 0.85, maintenance: 0.60 };

    // Se o usuário definiu valores personalizados no perfil, usamos eles
    const tireRate = profile.config.costPerKmTire > 0 ? profile.config.costPerKmTire : axleConfig.tireWear;
    const maintRate = profile.config.costPerKmMaintenance > 0 ? profile.config.costPerKmMaintenance : axleConfig.maintenance;

    depreciationCost = (tireRate + maintRate) * trip.totalKm;
  }

  const lucroLiquidoReal = totalBruto - (comissaoMotorista + combustivel + outrasDespesas + depreciationCost);

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

export const normalizeDestination = (dest: string): string => {
  if (!dest) return '';
  return dest
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split('-')[0] // Take only the city part
    .trim();
};
