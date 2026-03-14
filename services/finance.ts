
import { Trip, Vehicle, Driver, UserProfile, FinancialResults } from '../types';

export const calculateTripFinance = (
  trip: Trip,
  vehicle: Vehicle,
  driver: Driver,
  profile: UserProfile
): FinancialResults => {
  const { freteSeco, diarias, adiantamento, combustivel, outrasDespesas } = trip;

  // Commission logic
  const isAutonomo = profile.config.userRole === 'autonomo';
  const percFrete = driver.customCommission?.frete ?? profile.config.percMotFrete;
  const percDiaria = driver.customCommission?.diaria ?? profile.config.percMotDiaria;

  const totalBruto = freteSeco + diarias;
  const comissaoMotorista = isAutonomo ? 0 : (freteSeco * (percFrete / 100)) + (diarias * (percDiaria / 100));

  // Saldo a Receber da Transportadora: valor bruto menos o que já foi recebido (Ida, Volta ou Adiantamento legado)
  const totalRecebido = (trip.paymentIda || 0) + (trip.paymentVolta || 0) + (trip.adiantamento || 0);
  const saldoAReceber = trip.status === 'Pago' ? 0 : Math.max(0, totalBruto - totalRecebido);

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

  // Saldo do Adiantamento (Controla se o adiantamento cobriu as despesas da viagem)
  const saldoAdiantamento = adiantamento - (combustivel + outrasDespesas);

  return {
    totalBruto,
    comissaoMotorista,
    saldoAReceber,
    lucroLiquidoReal,
    lucroSociety,
    saldoAdiantamento
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
