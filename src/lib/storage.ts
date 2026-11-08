import {
  Animal,
  Worker,
  Corral,
  FeedItem,
  AuditLog,
  FinancialTransaction,
  ClinicalRecord,
  AnimalTask,
  TaskStatus,
  PasturePaddock,
  ReproductiveEvent,
  MarketPriceConfig,
} from '../types';
import {
  INITIAL_ANIMALS,
  INITIAL_WORKERS,
  INITIAL_CORRALS,
  INITIAL_FEED_ITEMS,
  INITIAL_CLINICAL_RECORDS,
  INITIAL_TASKS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FINANCIAL_TRANSACTIONS,
  INITIAL_PASTURE_PADDOCKS,
  INITIAL_REPRODUCTIVE_EVENTS,
  DEFAULT_MARKET_PRICES,
} from '../data/initialData';

const KEYS = {
  ANIMALS: 'cg_animals_v1',
  WORKERS: 'cg_workers_v1',
  CORRALS: 'cg_corrals_v1',
  FEED: 'cg_feed_v1',
  CLINICAL: 'cg_clinical_v1',
  TASKS: 'cg_tasks_v1',
  AUDIT: 'cg_audit_v1',
  FINANCES: 'cg_finances_v1',
  ACTIVE_USER: 'cg_active_user_v1',
  PASTURES: 'cg_pastures_v1',
  REPRODUCTION: 'cg_reproduction_v1',
  MARKET_PRICES: 'cg_market_prices_v1',
};

export function calculateAge(birthDateStr: string): { years: number; months: number; days: number } {
  if (!birthDateStr) return { years: 0, months: 0, days: 0 };
  const birth = new Date(birthDateStr);
  const now = new Date();

  if (isNaN(birth.getTime())) return { years: 0, months: 0, days: 0 };

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) };
}

// Storage Accessors
export function getStoredAnimals(): Animal[] {
  try {
    const data = localStorage.getItem(KEYS.ANIMALS);
    if (!data) {
      localStorage.setItem(KEYS.ANIMALS, JSON.stringify(INITIAL_ANIMALS));
      return INITIAL_ANIMALS;
    }
    const parsed: Animal[] = JSON.parse(data);
    // Enrich with initial default photos if missing
    let modified = false;
    const enriched = parsed.map((a) => {
      if (!a.photoUrl) {
        const init = INITIAL_ANIMALS.find((ia) => ia.id === a.id);
        if (init?.photoUrl) {
          modified = true;
          return { ...a, photoUrl: init.photoUrl };
        }
      }
      return a;
    });
    if (modified) {
      localStorage.setItem(KEYS.ANIMALS, JSON.stringify(enriched));
    }
    return enriched;
  } catch {
    return INITIAL_ANIMALS;
  }
}

export function saveStoredAnimal(animal: Animal, workerName: string = 'Administrador'): Animal[] {
  const list = getStoredAnimals();
  const existingIdx = list.findIndex((a) => a.id === animal.id);
  let updatedList: Animal[];

  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = { ...animal, updatedAt: new Date().toISOString() };
    addAuditLog('Modificación', 'Ganado', `Se actualizaron los datos del animal Tag #${animal.id}`, workerName);
  } else {
    const newAnimal = { ...animal, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    updatedList = [newAnimal, ...list];
    addAuditLog('Nuevo Registro', 'Ganado', `Se registró nuevo animal Tag #${animal.id} (${animal.breed})`, workerName);
  }

  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedList));
  return updatedList;
}

export function deleteStoredAnimal(animalId: string, workerName: string = 'Administrador'): Animal[] {
  const list = getStoredAnimals();
  const updatedList = list.filter((a) => a.id !== animalId);
  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedList));
  addAuditLog('Eliminación', 'Ganado', `Se eliminó el animal Tag #${animalId}`, workerName);
  return updatedList;
}

export function getStoredWorkers(): Worker[] {
  try {
    const data = localStorage.getItem(KEYS.WORKERS);
    if (!data) {
      localStorage.setItem(KEYS.WORKERS, JSON.stringify(INITIAL_WORKERS));
      return INITIAL_WORKERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_WORKERS;
  }
}

export function saveStoredWorker(worker: Worker, adminName: string = 'Administrador'): Worker[] {
  const list = getStoredWorkers();
  const idx = list.findIndex((w) => w.id === worker.id);
  let updated: Worker[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = worker;
    addAuditLog('Actualización Personal', 'Trabajador', `Se actualizaron los datos de ${worker.name}`, adminName);
  } else {
    updated = [...list, worker];
    addAuditLog('Nuevo Personal', 'Trabajador', `Se registró al trabajador ${worker.name} (${worker.role})`, adminName);
  }
  localStorage.setItem(KEYS.WORKERS, JSON.stringify(updated));
  return updated;
}

export function deleteStoredWorker(workerId: string, adminName: string = 'Administrador'): Worker[] {
  const list = getStoredWorkers();
  const target = list.find((w) => w.id === workerId);
  const updated = list.filter((w) => w.id !== workerId);
  localStorage.setItem(KEYS.WORKERS, JSON.stringify(updated));
  if (target) {
    addAuditLog('Baja Personal', 'Trabajador', `Se dio de baja a ${target.name}`, adminName);
  }
  return updated;
}

export function getStoredCorrals(): Corral[] {
  try {
    const data = localStorage.getItem(KEYS.CORRALS);
    if (!data) {
      localStorage.setItem(KEYS.CORRALS, JSON.stringify(INITIAL_CORRALS));
      return INITIAL_CORRALS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_CORRALS;
  }
}

export function saveStoredCorral(corral: Corral, adminName: string = 'Administrador'): Corral[] {
  const list = getStoredCorrals();
  const idx = list.findIndex((c) => c.id === corral.id);
  let updated: Corral[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = corral;
    addAuditLog('Modificación Corral', 'Corral', `Se modificó información de ${corral.name} (${corral.code})`, adminName);
  } else {
    updated = [...list, corral];
    addAuditLog('Nuevo Corral', 'Corral', `Se creó el corral/potrero ${corral.name} (${corral.code}) con aforo de ${corral.capacity}`, adminName);
  }
  localStorage.setItem(KEYS.CORRALS, JSON.stringify(updated));
  return updated;
}

export function deleteStoredCorral(corralId: string, adminName: string = 'Administrador'): Corral[] {
  const list = getStoredCorrals();
  const target = list.find((c) => c.id === corralId);
  const updated = list.filter((c) => c.id !== corralId);
  localStorage.setItem(KEYS.CORRALS, JSON.stringify(updated));
  if (target) {
    addAuditLog('Eliminación Corral', 'Corral', `Se eliminó el corral ${target.name}`, adminName);
  }
  return updated;
}

export function getStoredFeedItems(): FeedItem[] {
  try {
    const data = localStorage.getItem(KEYS.FEED);
    if (!data) {
      localStorage.setItem(KEYS.FEED, JSON.stringify(INITIAL_FEED_ITEMS));
      return INITIAL_FEED_ITEMS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_FEED_ITEMS;
  }
}

export function saveStoredFeedItem(item: FeedItem, workerName: string = 'Administrador'): FeedItem[] {
  const list = getStoredFeedItems();
  const idx = list.findIndex((f) => f.id === item.id);
  let updated: FeedItem[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = item;
    addAuditLog('Actualización Inventario', 'Inventario', `Actualizado stock de ${item.name} (${item.currentStockKg} ${item.unit})`, workerName);
  } else {
    updated = [...list, item];
    addAuditLog('Nuevo Insumo', 'Inventario', `Se registró insumo ${item.name}`, workerName);
  }
  localStorage.setItem(KEYS.FEED, JSON.stringify(updated));
  return updated;
}

export function deleteStoredFeedItem(itemId: string, workerName: string = 'Administrador'): FeedItem[] {
  const list = getStoredFeedItems();
  const target = list.find((f) => f.id === itemId);
  const updated = list.filter((f) => f.id !== itemId);
  localStorage.setItem(KEYS.FEED, JSON.stringify(updated));
  if (target) {
    addAuditLog('Eliminación Insumo', 'Inventario', `Se eliminó insumo ${target.name}`, workerName);
  }
  return updated;
}

export function getStoredClinicalRecords(animalId?: string): ClinicalRecord[] {
  try {
    const data = localStorage.getItem(KEYS.CLINICAL);
    const records: ClinicalRecord[] = data ? JSON.parse(data) : INITIAL_CLINICAL_RECORDS;
    if (animalId) {
      return records.filter((r) => r.animalId === animalId);
    }
    return records;
  } catch {
    return INITIAL_CLINICAL_RECORDS;
  }
}

export function addClinicalRecord(record: Omit<ClinicalRecord, 'id'>, workerName: string = 'Dr. Danilo C.'): ClinicalRecord[] {
  const list = getStoredClinicalRecords();
  const newRecord: ClinicalRecord = {
    ...record,
    id: `c-${Date.now()}`,
  };
  const updated = [newRecord, ...list];
  localStorage.setItem(KEYS.CLINICAL, JSON.stringify(updated));
  addAuditLog('Atención Médica', 'Salud', `Tratamiento ${record.type} (${record.medication}) en animal #${record.animalId}`, workerName);

  // Auto-sync with financial ledger if cost is provided
  if (record.cost && record.cost > 0) {
    addFinancialTransaction(
      {
        date: record.date || new Date().toISOString().split('T')[0],
        type: 'Egreso',
        category: 'Medicamentos',
        description: `Tratamiento ${record.type} (${record.medication}) para animal #${record.animalId}`,
        amountUSD: record.cost,
      },
      workerName
    );
  }

  return updated;
}

export function getStoredTasks(animalId?: string): AnimalTask[] {
  try {
    const data = localStorage.getItem(KEYS.TASKS);
    const tasks: AnimalTask[] = data ? JSON.parse(data) : INITIAL_TASKS;
    if (animalId) {
      return tasks.filter((t) => t.animalId === animalId);
    }
    return tasks;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTask(task: AnimalTask, workerName: string = 'Administrador'): AnimalTask[] {
  const list = getStoredTasks();
  const idx = list.findIndex((t) => t.id === task.id);
  let updated: AnimalTask[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = task;
  } else {
    updated = [task, ...list];
  }
  localStorage.setItem(KEYS.TASKS, JSON.stringify(updated));
  addAuditLog('Tarea Programada', 'Ganado', `Agendada tarea "${task.title}" para el animal #${task.animalId}`, workerName);
  return updated;
}

export function toggleTaskStatus(taskId: string): AnimalTask[] {
  const list = getStoredTasks();
  const updated = list.map((t) => {
    if (t.id === taskId) {
      const nextStatus: TaskStatus = t.status === 'completado' ? 'pendiente' : 'completado';
      addAuditLog('Estado de Tarea', 'Ganado', `Tarea "${t.title}" cambiada a ${nextStatus}`, 'Usuario');
      return { ...t, status: nextStatus };
    }
    return t;
  });
  localStorage.setItem(KEYS.TASKS, JSON.stringify(updated));
  return updated;
}

export function getStoredAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(KEYS.AUDIT);
    if (!data) {
      localStorage.setItem(KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLog(
  action: string,
  category: AuditLog['category'],
  details: string,
  workerName: string = 'Sistema'
) {
  const logs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    workerName,
    action,
    category,
    details,
  };
  const updated = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(KEYS.AUDIT, JSON.stringify(updated));
  return updated;
}

export function getStoredFinancials(): FinancialTransaction[] {
  try {
    const data = localStorage.getItem(KEYS.FINANCES);
    if (!data) {
      localStorage.setItem(KEYS.FINANCES, JSON.stringify(INITIAL_FINANCIAL_TRANSACTIONS));
      return INITIAL_FINANCIAL_TRANSACTIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_FINANCIAL_TRANSACTIONS;
  }
}

export function addFinancialTransaction(transaction: Omit<FinancialTransaction, 'id'>, workerName: string = 'Administrador'): FinancialTransaction[] {
  const list = getStoredFinancials();
  const newFin: FinancialTransaction = {
    ...transaction,
    id: `fin-${Date.now()}`,
  };
  const updated = [newFin, ...list];
  localStorage.setItem(KEYS.FINANCES, JSON.stringify(updated));
  addAuditLog('Movimiento Financiero', 'Finanzas', `${transaction.type}: $${transaction.amountUSD} - ${transaction.description}`, workerName);
  return updated;
}

export function deleteFinancialTransaction(transactionId: string, workerName: string = 'Administrador'): FinancialTransaction[] {
  const list = getStoredFinancials();
  const target = list.find((t) => t.id === transactionId);
  const updated = list.filter((t) => t.id !== transactionId);
  localStorage.setItem(KEYS.FINANCES, JSON.stringify(updated));
  if (target) {
    addAuditLog('Eliminación Transacción', 'Finanzas', `Se eliminó movimiento: ${target.description} ($${target.amountUSD})`, workerName);
  }
  return updated;
}

// --- ZOOTECNIC & LIVESTOCK ALGORITHMS (Jetbov, CattleMax, Herdwatch, Farmbrite, CattleEye) ---

/**
 * Calculates Average Daily Gain (ADG / GDP) in grams/day between two weighing dates.
 */
export function calculateADGGramsPerDay(
  weight1: number,
  date1: string,
  weight2: number,
  date2: string
): { adgGrams: number; days: number; totalGainKg: number } {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  const totalGainKg = weight2 - weight1;
  const adgGrams = Math.round((totalGainKg / days) * 1000);
  return { adgGrams, days, totalGainKg };
}

/**
 * Calculates expected bovine calving date (~283 days gestation) from service/AI date.
 */
export function calculateExpectedCalvingDate(serviceDateStr: string): string {
  if (!serviceDateStr) return '';
  const date = new Date(serviceDateStr);
  date.setDate(date.getDate() + 283);
  return date.toISOString().split('T')[0];
}

/**
 * Check if animal is under active meat/milk withdrawal restriction (Herdwatch).
 */
export function checkWithdrawalStatus(withdrawalUntilDate?: string): {
  isWithdrawn: boolean;
  daysRemaining: number;
} {
  if (!withdrawalUntilDate) return { isWithdrawn: false, daysRemaining: 0 };
  const target = new Date(withdrawalUntilDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    isWithdrawn: days >= 0,
    daysRemaining: Math.max(0, days),
  };
}

/**
 * CattleEye & Crevat formula for biometric weight estimation from heart girth and body length.
 * Peso (Kg) = (Perímetro Torácico en metros² × Largo Corporal en metros) × 87.5
 */
export function estimateWeightZoomentric(heartGirthCm: number, bodyLengthCm?: number): number {
  if (!heartGirthCm || heartGirthCm < 50) return 0;
  const girthM = heartGirthCm / 100;
  if (bodyLengthCm && bodyLengthCm > 50) {
    const lengthM = bodyLengthCm / 100;
    // Crevat formula
    return Math.round(Math.pow(girthM, 2) * lengthM * 87.5);
  }
  // Formula barimétrica estándar solo perímetro torácico
  // Peso = (PT cm ^ 3) / 10838 (aprox cebú/bovino carne)
  return Math.round(Math.pow(heartGirthCm, 3) / 11400);
}

// --- PASTURE PADDOCKS STORAGE (Farmbrite / GanaderiAPP & D3 Interactive Map) ---
export function getStoredPastures(): PasturePaddock[] {
  try {
    const data = localStorage.getItem(KEYS.PASTURES);
    if (!data) {
      localStorage.setItem(KEYS.PASTURES, JSON.stringify(INITIAL_PASTURE_PADDOCKS));
      return INITIAL_PASTURE_PADDOCKS;
    }
    const parsed: PasturePaddock[] = JSON.parse(data);
    // If old cache had only 4 paddocks or missing polygonPoints, merge with initial rich dataset
    if (parsed.length < INITIAL_PASTURE_PADDOCKS.length || !parsed[0]?.polygonPoints) {
      const merged = INITIAL_PASTURE_PADDOCKS.map((initPad) => {
        const found = parsed.find((p) => p.id === initPad.id);
        if (found) {
          return {
            ...initPad,
            ...found,
            polygonPoints: found.polygonPoints || initPad.polygonPoints,
            centerPoint: found.centerPoint || initPad.centerPoint,
            waterPoint: found.waterPoint || initPad.waterPoint,
            gatePoint: found.gatePoint || initPad.gatePoint,
            treePoints: found.treePoints || initPad.treePoints,
          };
        }
        return initPad;
      });
      localStorage.setItem(KEYS.PASTURES, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_PASTURE_PADDOCKS;
  }
}

export function saveStoredPasture(pasture: PasturePaddock, workerName: string = 'Administrador'): PasturePaddock[] {
  const list = getStoredPastures();
  const idx = list.findIndex((p) => p.id === pasture.id);
  let updated: PasturePaddock[];
  if (idx >= 0) {
    updated = [...list];
    updated[idx] = pasture;
    addAuditLog('Actualización Potrero', 'Potreros', `Se actualizó el potrero ${pasture.name} (${pasture.status})`, workerName);
  } else {
    updated = [...list, pasture];
    addAuditLog('Nuevo Potrero', 'Potreros', `Se registró nuevo potrero ${pasture.name} (${pasture.areaHectares} Ha)`, workerName);
  }
  localStorage.setItem(KEYS.PASTURES, JSON.stringify(updated));
  return updated;
}

export function rotatePastureBatch(
  fromPaddockId: string,
  toPaddockId: string,
  batchName: string,
  workerName: string = 'Administrador'
): { updatedPastures: PasturePaddock[]; updatedAnimals: Animal[] } {
  const list = getStoredPastures();
  const targetPaddock = list.find((p) => p.id === toPaddockId);
  const fromPaddock = list.find((p) => p.id === fromPaddockId);

  const updatedPastures = list.map((p) => {
    if (p.id === fromPaddockId) {
      return {
        ...p,
        status: 'En Descanso' as const,
        currentOccupantBatch: undefined,
        currentRestDays: 1,
        daysInGrazing: 0,
      };
    }
    if (p.id === toPaddockId) {
      return {
        ...p,
        status: 'Ocupado' as const,
        currentOccupantBatch: batchName,
        entryDate: new Date().toISOString().split('T')[0],
        daysInGrazing: 1,
        currentRestDays: 0,
      };
    }
    return p;
  });
  localStorage.setItem(KEYS.PASTURES, JSON.stringify(updatedPastures));

  // Sync all affected animals in the hato
  const animals = getStoredAnimals();
  let movedCount = 0;
  const updatedAnimals = animals.map((a) => {
    const belongsToFromPaddock =
      a.paddockId === fromPaddockId ||
      (!a.paddockId &&
        fromPaddock?.currentOccupantBatch &&
        a.batchNumber &&
        fromPaddock.currentOccupantBatch.toLowerCase().includes(a.batchNumber.toLowerCase()));

    if (belongsToFromPaddock && targetPaddock) {
      movedCount++;
      return {
        ...a,
        paddockId: toPaddockId,
        paddockName: targetPaddock.name,
        updatedAt: new Date().toISOString(),
      };
    }
    return a;
  });

  if (movedCount > 0) {
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedAnimals));
  }

  addAuditLog(
    'Rotación de Pasturas',
    'Potreros',
    `Lote "${batchName}" (${movedCount} animales) rotado de ${fromPaddock?.name || fromPaddockId} a ${targetPaddock?.name || toPaddockId}.`,
    workerName
  );
  return { updatedPastures, updatedAnimals };
}

// --- REPRODUCTIVE EVENTS STORAGE (CattleMax / Control Ganadero) ---
export function getStoredReproductiveEvents(animalId?: string): ReproductiveEvent[] {
  try {
    const data = localStorage.getItem(KEYS.REPRODUCTION);
    const list: ReproductiveEvent[] = data ? JSON.parse(data) : INITIAL_REPRODUCTIVE_EVENTS;
    if (animalId) {
      return list.filter((r) => r.animalId === animalId);
    }
    return list;
  } catch {
    return INITIAL_REPRODUCTIVE_EVENTS;
  }
}

export function addReproductiveEvent(
  event: Omit<ReproductiveEvent, 'id'>,
  workerName: string = 'Dr. Danilo C. Ramírez'
): { events: ReproductiveEvent[]; updatedAnimals: Animal[] } {
  const list = getStoredReproductiveEvents();
  const newEvent: ReproductiveEvent = {
    ...event,
    id: `rep-${Date.now()}`,
  };
  const updatedEvents = [newEvent, ...list];
  localStorage.setItem(KEYS.REPRODUCTION, JSON.stringify(updatedEvents));

  // Actualizar también el estado reproductivo del animal
  const animals = getStoredAnimals();
  const animalIdx = animals.findIndex((a) => a.id === event.animalId);
  let updatedAnimals = animals;

  if (animalIdx >= 0) {
    const target = { ...animals[animalIdx] };
    if (event.type === 'Celo Detectado') {
      target.reproductiveStatus = 'En Celo';
    } else if (event.type === 'Inseminación Artificial' || event.type === 'Monta Natural') {
      target.reproductiveStatus = 'Servida';
      target.lastServiceDate = event.date;
      target.serviceBullTagOrName = event.sireTagOrName;
      target.inseminatorWorkerName = event.technicianName;
      target.expectedCalvingDate = calculateExpectedCalvingDate(event.date);
    } else if (event.type === 'Diagnóstico Palpación' || event.type === 'Diagnóstico Ecografía') {
      if (event.pregnancyResult === 'Positiva') {
        target.reproductiveStatus = 'Preñada';
      } else if (event.pregnancyResult === 'Negativa') {
        target.reproductiveStatus = 'Vacia';
      }
    } else if (event.type === 'Parto') {
      target.reproductiveStatus = 'Lactancia';
      target.lastCalvingDate = event.date;
      target.totalCalvingsCount = (target.totalCalvingsCount || 0) + 1;
      target.expectedCalvingDate = undefined;
    } else if (event.type === 'Secado') {
      target.reproductiveStatus = 'Seca';
    }

    updatedAnimals = [...animals];
    updatedAnimals[animalIdx] = target;
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedAnimals));
  }

  addAuditLog(
    'Evento Reproductivo',
    'Reproducción',
    `${event.type} registrado para animal #${event.animalId}: ${event.details}`,
    workerName
  );

  return { events: updatedEvents, updatedAnimals };
}

// --- MARKET PRICE VALUATION (Livestocked / Jetbov) ---
export function getStoredMarketPrices(): MarketPriceConfig {
  try {
    const data = localStorage.getItem(KEYS.MARKET_PRICES);
    if (!data) {
      localStorage.setItem(KEYS.MARKET_PRICES, JSON.stringify(DEFAULT_MARKET_PRICES));
      return DEFAULT_MARKET_PRICES;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_MARKET_PRICES;
  }
}

export function saveStoredMarketPrices(prices: MarketPriceConfig): MarketPriceConfig {
  localStorage.setItem(KEYS.MARKET_PRICES, JSON.stringify(prices));
  addAuditLog('Actualización Precios', 'Finanzas', 'Precios de referencia de mercado en pie actualizados', 'Administrador');
  return prices;
}

export interface ChuteWeighingOptions {
  vaccine?: { name: string; cost?: number };
  dewormer?: { name: string; cost?: number; withdrawalDays?: number };
  destinationCorral?: { id: string; name: string };
  destinationPaddock?: { id: string; name: string };
  bodyConditionScore?: number;
}

// --- FAST WEIGHING AT CHUTE / MANGA (Jetbov & Herdwatch Chute Mode) ---
export function performFastWeighing(
  animalId: string,
  newWeightKg: number,
  date: string = new Date().toISOString().split('T')[0],
  workerName: string = 'Administrador',
  options?: ChuteWeighingOptions
): { updatedAnimal: Animal | null; adgGrams: number } {
  const animals = getStoredAnimals();
  const idx = animals.findIndex((a) => a.id === animalId);
  if (idx < 0) return { updatedAnimal: null, adgGrams: 0 };

  const current = animals[idx];
  const lastWeightRecord = current.weightHistory[current.weightHistory.length - 1];
  let calculatedAdg = 0;

  if (lastWeightRecord) {
    const result = calculateADGGramsPerDay(lastWeightRecord.weightKg, lastWeightRecord.date, newWeightKg, date);
    calculatedAdg = result.adgGrams;
  }

  const updatedHistory = [...current.weightHistory, { date, weightKg: newWeightKg }];
  let withdrawalDate = current.withdrawalUntilDate;
  let withdrawalReason = current.withdrawalReason;

  // Apply dewormer withdrawal if specified
  if (options?.dewormer?.withdrawalDays && options.dewormer.withdrawalDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + options.dewormer.withdrawalDays);
    withdrawalDate = d.toISOString().split('T')[0];
    withdrawalReason = `${options.dewormer.name} (Desparasitante en Manga)`;
  }

  const updatedAnimal: Animal = {
    ...current,
    currentWeightKg: newWeightKg,
    lastAdgGramsPerDay: calculatedAdg,
    weightHistory: updatedHistory,
    withdrawalUntilDate: withdrawalDate,
    withdrawalReason: withdrawalReason,
    corralId: options?.destinationCorral?.id || current.corralId,
    corralName: options?.destinationCorral?.name || current.corralName,
    paddockId: options?.destinationPaddock?.id || current.paddockId,
    paddockName: options?.destinationPaddock?.name || current.paddockName,
    bodyConditionScore: options?.bodyConditionScore !== undefined ? options.bodyConditionScore : current.bodyConditionScore,
    updatedAt: new Date().toISOString(),
  };

  animals[idx] = updatedAnimal;
  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(animals));

  // Save clinical records if treatments were administered in chute
  if (options?.vaccine?.name) {
    addClinicalRecord({
      animalId,
      date,
      type: 'Vacuna',
      description: `Aplicación en manga de pesaje: ${options.vaccine.name}`,
      medication: options.vaccine.name,
      veterinarian: workerName,
      cost: options.vaccine.cost || 12,
    });
  }

  if (options?.dewormer?.name) {
    addClinicalRecord({
      animalId,
      date,
      type: 'Desparasitante',
      description: `Desparasitante aplicado en manga: ${options.dewormer.name}`,
      medication: options.dewormer.name,
      veterinarian: workerName,
      cost: options.dewormer.cost || 15,
    });
  }

  addAuditLog(
    'Pesaje en Báscula Manga',
    'Manga',
    `Animal #${animalId}: Nuevo peso ${newWeightKg} Kg. GDP: ${calculatedAdg > 0 ? '+' : ''}${calculatedAdg} g/día.${
      options?.destinationCorral ? ` Apartado a ${options.destinationCorral.name}.` : ''
    }${options?.destinationPaddock ? ` Potrero: ${options.destinationPaddock.name}.` : ''}`,
    workerName
  );

  return { updatedAnimal, adgGrams: calculatedAdg };
}

// --- BIRTH / CALF REGISTRATION FLOW (CattleMax & Control Ganadero) ---
export function registerCalfFromBirth(
  motherId: string,
  calfData: {
    tagId?: string;
    sex: 'M' | 'F';
    birthWeightKg: number;
    birthDate: string;
    fatherId?: string;
    breed?: string;
    notes?: string;
  },
  workerName: string = 'Administrador'
): { calf: Animal; updatedMother: Animal } {
  const animals = getStoredAnimals();
  const mother = animals.find((a) => a.id === motherId);
  const motherBreed = mother?.breed || 'Brahman Blanco';
  const motherCorralId = mother?.corralId || 'c-3';
  const motherCorralName = mother?.corralName || 'Corral Maternidad';

  // Generate tag ID if not provided
  let newTag = calfData.tagId?.trim();
  if (!newTag) {
    const existingIds = animals.map((a) => parseInt(a.id, 10)).filter((n) => !isNaN(n));
    const nextMax = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 101;
    newTag = String(nextMax);
  }

  const newCalf: Animal = {
    id: newTag,
    name: `Cría de #${motherId}`,
    breed: calfData.breed || motherBreed,
    sex: calfData.sex,
    birthDate: calfData.birthDate,
    status: 'ACT',
    purpose: 'CRIA',
    initialWeightKg: calfData.birthWeightKg,
    currentWeightKg: calfData.birthWeightKg,
    targetWeightKg: calfData.sex === 'M' ? 520 : 450,
    corralId: motherCorralId,
    corralName: motherCorralName,
    paddockId: mother?.paddockId,
    paddockName: mother?.paddockName,
    motherId: motherId,
    fatherId: calfData.fatherId || mother?.serviceBullTagOrName,
    purchased: false,
    calvingDifficulty: 0,
    bodyConditionScore: 3.5,
    weightHistory: [{ date: calfData.birthDate, weightKg: calfData.birthWeightKg }],
    warningNote: calfData.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Update mother
  const updatedMother: Animal = mother
    ? {
        ...mother,
        reproductiveStatus: 'Lactancia',
        lastCalvingDate: calfData.birthDate,
        totalCalvingsCount: (mother.totalCalvingsCount || 0) + 1,
        expectedCalvingDate: undefined,
        updatedAt: new Date().toISOString(),
      }
    : (newCalf as any);

  // Save in animals
  const updatedAnimals = mother
    ? animals.map((a) => (a.id === motherId ? updatedMother : a)).concat(newCalf)
    : animals.concat(newCalf);

  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedAnimals));

  // Add reproductive event
  addReproductiveEvent({
    animalId: motherId,
    date: calfData.birthDate,
    type: 'Parto',
    details: `Parto exitoso de ${calfData.sex === 'M' ? 'Macho' : 'Hembra'} (Tag #${newTag}, ${calfData.birthWeightKg} Kg). Padre: ${calfData.fatherId || 'Desc.'}`,
    sireTagOrName: calfData.fatherId,
    technicianName: workerName,
  });

  addAuditLog(
    'Nacimiento / Registro de Cría',
    'Ganado',
    `Nuevo ternero Tag #${newTag} (${calfData.sex}, ${calfData.birthWeightKg} Kg) registrado como hijo de #${motherId}.`,
    workerName
  );

  return { calf: newCalf, updatedMother };
}

// --- MASSIVE BATCH TREATMENTS (iRancho Campo) ---
export function performBatchTreatment(
  animalIds: string[],
  treatment: {
    type: 'Vacuna' | 'Desparasitante' | 'Tratamiento' | 'Examen';
    medication: string;
    description: string;
    costPerHead: number;
    withdrawalDays?: number;
    withdrawalType?: 'Carne' | 'Leche' | 'Ambas';
    nextDueDate?: string;
  },
  workerName: string = 'Dr. Danilo C. Ramírez'
): { updatedAnimals: Animal[]; recordsCount: number } {
  const today = new Date().toISOString().split('T')[0];
  const clinicalRecords = getStoredClinicalRecords();
  const animals = getStoredAnimals();

  let withdrawalDate: string | undefined = undefined;
  if (treatment.withdrawalDays && treatment.withdrawalDays > 0) {
    const d = new Date();
    d.setDate(d.getDate() + treatment.withdrawalDays);
    withdrawalDate = d.toISOString().split('T')[0];
  }

  const newRecords: ClinicalRecord[] = [];
  const updatedAnimals = animals.map((a) => {
    if (animalIds.includes(a.id)) {
      newRecords.push({
        id: `c-batch-${Date.now()}-${a.id}`,
        animalId: a.id,
        date: today,
        type: treatment.type,
        medication: treatment.medication,
        description: treatment.description,
        veterinarian: workerName,
        cost: treatment.costPerHead,
        nextDueDate: treatment.nextDueDate,
      });

      return {
        ...a,
        withdrawalUntilDate: withdrawalDate || a.withdrawalUntilDate,
        withdrawalReason: withdrawalDate ? `${treatment.medication} (${treatment.description})` : a.withdrawalReason,
        withdrawalType: withdrawalDate ? treatment.withdrawalType || 'Ambas' : a.withdrawalType,
        updatedAt: new Date().toISOString(),
      };
    }
    return a;
  });

  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updatedAnimals));
  localStorage.setItem(KEYS.CLINICAL, JSON.stringify([...newRecords, ...clinicalRecords]));

  // Registrar egreso financiero del tratamiento por lote
  const totalCost = treatment.costPerHead * animalIds.length;
  if (totalCost > 0) {
    addFinancialTransaction(
      {
        date: today,
        type: 'Egreso',
        category: 'Medicamentos',
        description: `Tratamiento colectivo (${treatment.medication}) para ${animalIds.length} animales`,
        amountUSD: totalCost,
      },
      workerName
    );
  }

  addAuditLog(
    'Tratamiento Colectivo por Lote',
    'Salud',
    `Aplicación masiva de ${treatment.medication} a ${animalIds.length} cabezas. ${withdrawalDate ? `Período de retiro fijado hasta ${withdrawalDate}.` : ''}`,
    workerName
  );

  return { updatedAnimals, recordsCount: newRecords.length };
}

export function resetToDefaults() {
  localStorage.clear();
  localStorage.setItem(KEYS.ANIMALS, JSON.stringify(INITIAL_ANIMALS));
  localStorage.setItem(KEYS.WORKERS, JSON.stringify(INITIAL_WORKERS));
  localStorage.setItem(KEYS.CORRALS, JSON.stringify(INITIAL_CORRALS));
  localStorage.setItem(KEYS.FEED, JSON.stringify(INITIAL_FEED_ITEMS));
  localStorage.setItem(KEYS.CLINICAL, JSON.stringify(INITIAL_CLINICAL_RECORDS));
  localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
  localStorage.setItem(KEYS.FINANCES, JSON.stringify(INITIAL_FINANCIAL_TRANSACTIONS));
  localStorage.setItem(KEYS.PASTURES, JSON.stringify(INITIAL_PASTURE_PADDOCKS));
  localStorage.setItem(KEYS.REPRODUCTION, JSON.stringify(INITIAL_REPRODUCTIVE_EVENTS));
  localStorage.setItem(KEYS.MARKET_PRICES, JSON.stringify(DEFAULT_MARKET_PRICES));
}
