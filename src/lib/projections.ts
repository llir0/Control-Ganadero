import { Animal, MarketPriceConfig } from '../types';

export interface AnimalWeightProjection {
  animal: Animal;
  historicalAdgKgDay: number; // in kg/day, e.g. 0.950
  historicalAdgGrams: number; // in g/day, e.g. 950
  historicalDataPoints: number;
  hasRealHistory: boolean;
  currentWeightKg: number;
  currentValueUSD: number;

  // 3 Months (90 days)
  weight3mKg: number;
  gain3mKg: number;
  value3mUSD: number;
  valueGain3mUSD: number;

  // 6 Months (180 days)
  weight6mKg: number;
  gain6mKg: number;
  value6mUSD: number;
  valueGain6mUSD: number;

  // 12 Months (365 days)
  weight12mKg: number;
  gain12mKg: number;
  value12mUSD: number;
  valueGain12mUSD: number;

  // Optimal Sale Planning
  targetWeightKg: number;
  kgToTarget: number;
  daysToTarget: number;
  optimalDate: string; // ISO date string YYYY-MM-DD
  optimalDateFormatted: string; // e.g. "15 Nov 2026"
  saleWindow: 'INMEDIATA' | 'CORTO_PLAZO' | 'MEDIANO_PLAZO' | 'LARGO_PLAZO';
  saleWindowLabel: string;
  saleWindowBadgeColor: string;
  recommendation: string;
}

export interface ProjectionsSummary {
  totalAnimals: number;
  currentTotalKg: number;
  currentTotalValueUSD: number;

  // 3m totals
  total3mKg: number;
  total3mValueUSD: number;
  total3mGainUSD: number;

  // 6m totals
  total6mKg: number;
  total6mValueUSD: number;
  total6mGainUSD: number;

  // 12m totals
  total12mKg: number;
  total12mValueUSD: number;
  total12mGainUSD: number;

  // Cohorts count
  readyNowCount: number;
  readyIn3mCount: number;
  readyIn6mCount: number;
  longTermCount: number;

  avgAdgGrams: number;
}

/**
 * Calculates historical Average Daily Gain (ADG / GDP) for an animal based on weightHistory
 */
export function calculateAnimalAdg(animal: Animal): {
  adgKgDay: number;
  hasRealHistory: boolean;
  pointsCount: number;
} {
  const history = [...(animal.weightHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const t0 = new Date(first.date).getTime();
    const tN = new Date(last.date).getTime();
    const days = Math.max(1, Math.round((tN - t0) / (1000 * 60 * 60 * 24)));
    const kgDiff = last.weightKg - first.weightKg;

    if (days >= 14 && kgDiff > 0) {
      const calculated = kgDiff / days;
      // Clamp between 0.35 and 1.85 kg/day to avoid abnormal outliers
      const clamped = Math.min(1.85, Math.max(0.35, calculated));
      return {
        adgKgDay: Math.round(clamped * 1000) / 1000,
        hasRealHistory: true,
        pointsCount: history.length,
      };
    }
  }

  // Fallback 1: check lastAdgGramsPerDay recorded in chute
  if (animal.lastAdgGramsPerDay && animal.lastAdgGramsPerDay > 0) {
    const fromGrams = animal.lastAdgGramsPerDay / 1000;
    return {
      adgKgDay: Math.min(1.85, Math.max(0.35, fromGrams)),
      hasRealHistory: true,
      pointsCount: history.length,
    };
  }

  // Fallback 2: lifetime average if birthdate is known
  if (animal.birthDate) {
    const bDate = new Date(animal.birthDate).getTime();
    const days = Math.max(30, Math.round((Date.now() - bDate) / (1000 * 60 * 60 * 24)));
    const kgDiff = animal.currentWeightKg - (animal.initialWeightKg || 35);
    if (days > 60 && kgDiff > 0) {
      const lifetimeAdg = kgDiff / days;
      return {
        adgKgDay: Math.min(1.85, Math.max(0.35, Math.round(lifetimeAdg * 1000) / 1000)),
        hasRealHistory: false,
        pointsCount: history.length,
      };
    }
  }

  // Fallback 3: Standard zootechnical benchmarks by purpose
  let benchmark = 0.85; // Ceba standard
  if (animal.purpose === 'CEBA') benchmark = 0.95;
  else if (animal.purpose === 'CRIA') benchmark = 0.65;
  else if (animal.purpose === 'LECHE') benchmark = 0.45;
  else if (animal.purpose === 'REPRODUCTOR') benchmark = 0.75;

  return {
    adgKgDay: benchmark,
    hasRealHistory: false,
    pointsCount: history.length,
  };
}

/**
 * Gets market unit price USD/Kg for an animal based on purpose and weight
 */
export function getAnimalUnitPriceUSD(animal: Animal, prices: MarketPriceConfig): number {
  if (animal.purpose === 'CEBA') {
    return prices.fatteningBullKgUSD;
  }
  if (animal.purpose === 'CRIA') {
    return animal.currentWeightKg < 220 ? prices.calfWeanedKgUSD : prices.breedingCowKgUSD;
  }
  if (animal.purpose === 'LECHE') {
    return prices.dairyCowKgUSD;
  }
  if (animal.purpose === 'REPRODUCTOR') {
    return Math.round(prices.fatteningBullKgUSD * 1.3 * 100) / 100;
  }
  return prices.fatteningBullKgUSD;
}

/**
 * Computes individual projection at 3, 6, and 12 months with optimal sale dates
 */
export function calculateAnimalProjection(
  animal: Animal,
  prices: MarketPriceConfig,
  adgMultiplier: number = 1.0
): AnimalWeightProjection {
  const { adgKgDay, hasRealHistory, pointsCount } = calculateAnimalAdg(animal);
  const effectiveAdg = Math.round(adgKgDay * adgMultiplier * 1000) / 1000;
  const unitPrice = getAnimalUnitPriceUSD(animal, prices);

  const currentW = animal.currentWeightKg;
  const currentVal = Math.round(currentW * unitPrice);

  // Projections: 3m (90d), 6m (180d), 12m (365d)
  const weight3mKg = Math.round(currentW + effectiveAdg * 90);
  const gain3mKg = weight3mKg - currentW;
  const value3mUSD = Math.round(weight3mKg * unitPrice);
  const valueGain3mUSD = value3mUSD - currentVal;

  const weight6mKg = Math.round(currentW + effectiveAdg * 180);
  const gain6mKg = weight6mKg - currentW;
  const value6mUSD = Math.round(weight6mKg * unitPrice);
  const valueGain6mUSD = value6mUSD - currentVal;

  const weight12mKg = Math.round(currentW + effectiveAdg * 365);
  const gain12mKg = weight12mKg - currentW;
  const value12mUSD = Math.round(weight12mKg * unitPrice);
  const valueGain12mUSD = value12mUSD - currentVal;

  // Target commercial finish weight
  let targetW = animal.targetWeightKg;
  if (!targetW || targetW <= 0) {
    if (animal.purpose === 'CEBA') targetW = 520;
    else if (animal.purpose === 'CRIA') targetW = 420;
    else if (animal.purpose === 'LECHE') targetW = 550;
    else if (animal.purpose === 'REPRODUCTOR') targetW = 750;
    else targetW = 500;
  }

  // Days to target
  let daysToTarget = 0;
  let saleWindow: AnimalWeightProjection['saleWindow'] = 'INMEDIATA';
  let saleWindowLabel = '¡Listo para Venta Inmediata!';
  let saleWindowBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let recommendation = 'Peso óptimo alcanzado. Venta sugerida en el próximo lote comercial.';

  if (currentW >= targetW) {
    daysToTarget = 0;
    saleWindow = 'INMEDIATA';
    saleWindowLabel = '¡Listo para Venta!';
    saleWindowBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    recommendation = `Cumplió peso meta (${targetW} Kg). Programar salida comercial para maximizar eficiencia de conversión alimenticia.`;
  } else {
    const kgNeeded = targetW - currentW;
    daysToTarget = Math.max(1, Math.round(kgNeeded / effectiveAdg));

    if (daysToTarget <= 90) {
      saleWindow = 'CORTO_PLAZO';
      saleWindowLabel = `Salida en ~${Math.round(daysToTarget / 30)} Mes(es)`;
      saleWindowBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recommendation = `Alcanzará ${targetW} Kg en ~${daysToTarget} días. Intensificar ración final para programar venta en trimestre próximo.`;
    } else if (daysToTarget <= 180) {
      saleWindow = 'MEDIANO_PLAZO';
      saleWindowLabel = `Salida en ~${Math.round(daysToTarget / 30)} Meses`;
      saleWindowBadgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      recommendation = `Fase de desarrollo activo. Salida estimada en ~${Math.round(daysToTarget / 30)} meses con rotación forrajera.`;
    } else {
      saleWindow = 'LARGO_PLAZO';
      saleWindowLabel = 'Crecimiento / Levante (>6m)';
      saleWindowBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      recommendation = `Ejemplar en crecimiento. Mantener en pastoreo de levante con suplementación mineral.`;
    }
  }

  const optimalDateObj = new Date(Date.now() + daysToTarget * 86400000);
  const optimalDate = optimalDateObj.toISOString().split('T')[0];
  const optimalDateFormatted = optimalDateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    animal,
    historicalAdgKgDay: effectiveAdg,
    historicalAdgGrams: Math.round(effectiveAdg * 1000),
    historicalDataPoints: pointsCount,
    hasRealHistory,
    currentWeightKg: currentW,
    currentValueUSD: currentVal,
    weight3mKg,
    gain3mKg,
    value3mUSD,
    valueGain3mUSD,
    weight6mKg,
    gain6mKg,
    value6mUSD,
    valueGain6mUSD,
    weight12mKg,
    gain12mKg,
    value12mUSD,
    valueGain12mUSD,
    targetWeightKg: targetW,
    kgToTarget: Math.max(0, targetW - currentW),
    daysToTarget,
    optimalDate,
    optimalDateFormatted,
    saleWindow,
    saleWindowLabel,
    saleWindowBadgeColor,
    recommendation,
  };
}

/**
 * Computes projections and aggregated summaries for a list of animals
 */
export function calculateHerdProjections(
  animals: Animal[],
  prices: MarketPriceConfig,
  adgMultiplier: number = 1.0
): {
  projections: AnimalWeightProjection[];
  summary: ProjectionsSummary;
} {
  const active = animals.filter((a) => a.status === 'ACT');
  const projections = active.map((a) => calculateAnimalProjection(a, prices, adgMultiplier));

  let currentTotalKg = 0;
  let currentTotalValueUSD = 0;
  let total3mKg = 0;
  let total3mValueUSD = 0;
  let total6mKg = 0;
  let total6mValueUSD = 0;
  let total12mKg = 0;
  let total12mValueUSD = 0;

  let readyNowCount = 0;
  let readyIn3mCount = 0;
  let readyIn6mCount = 0;
  let longTermCount = 0;
  let sumAdg = 0;

  projections.forEach((p) => {
    currentTotalKg += p.currentWeightKg;
    currentTotalValueUSD += p.currentValueUSD;
    total3mKg += p.weight3mKg;
    total3mValueUSD += p.value3mUSD;
    total6mKg += p.weight6mKg;
    total6mValueUSD += p.value6mUSD;
    total12mKg += p.weight12mKg;
    total12mValueUSD += p.value12mUSD;

    sumAdg += p.historicalAdgGrams;

    if (p.saleWindow === 'INMEDIATA') readyNowCount++;
    else if (p.saleWindow === 'CORTO_PLAZO') readyIn3mCount++;
    else if (p.saleWindow === 'MEDIANO_PLAZO') readyIn6mCount++;
    else longTermCount++;
  });

  const summary: ProjectionsSummary = {
    totalAnimals: projections.length,
    currentTotalKg,
    currentTotalValueUSD,
    total3mKg,
    total3mValueUSD,
    total3mGainUSD: total3mValueUSD - currentTotalValueUSD,
    total6mKg,
    total6mValueUSD,
    total6mGainUSD: total6mValueUSD - currentTotalValueUSD,
    total12mKg,
    total12mValueUSD,
    total12mGainUSD: total12mValueUSD - currentTotalValueUSD,
    readyNowCount,
    readyIn3mCount,
    readyIn6mCount,
    longTermCount,
    avgAdgGrams: projections.length > 0 ? Math.round(sumAdg / projections.length) : 0,
  };

  return { projections, summary };
}
