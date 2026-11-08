export type AnimalStatus = 'ACT' | 'IAC';
export type AnimalSex = 'M' | 'F';
export type AnimalPurpose = 'CRIA' | 'CEBA' | 'LECHE' | 'REPRODUCTOR';
export type DisposalCause = 'Vendido' | 'Murió en la finca' | 'Descarte' | 'Transf. Finca';
export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completado';

export interface ClinicalRecord {
  id: string;
  animalId: string;
  date: string;
  type: 'Vacuna' | 'Desparasitante' | 'Tratamiento' | 'Arete' | 'Cirugía' | 'Examen';
  description: string;
  medication: string;
  veterinarian: string;
  nextDueDate?: string;
  cost?: number;
}

export interface AnimalTask {
  id: string;
  animalId: string;
  title: string;
  type: 'Baño' | 'Veterinario' | 'Vacunación' | 'Pesaje' | 'Inseminación' | 'Alimentación Especial' | 'Revisión General';
  dueDate: string;
  assignedWorkerId: string;
  assignedWorkerName: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
}

export interface WeightRecord {
  date: string;
  weightKg: number;
  notes?: string;
}

export interface Animal {
  id: string; // Ear tag / No. Animal (e.g. "17")
  status: AnimalStatus; // ACT (Activo) or IAC (Inactivo/Vendido/Murió)
  name?: string; // Optional friendly name (e.g. "Mariposa", "El Capitán")
  birthDate: string; // YYYY-MM-DD
  sex: AnimalSex;
  purpose: AnimalPurpose;
  breed: string; // e.g., "Pardo Suizo", "Brahman Blanco", "Gyr", "Angus"
  corralId: string; // e.g., "corral-1"
  corralName: string; // e.g., "Corral A - Maternidad"
  paddockId?: string; // e.g., "pad-1"
  paddockName?: string; // e.g., "Potrero El Roble"
  
  // Lineage & Origin (PDF reference)
  purchased: boolean;
  purchaseLocation?: string;
  purchaseCost?: number;
  calvingDifficulty?: number; // 0 = Normal, 1 = Asistido, 2 = Dificil
  fatherId?: string; // Tag or name of sire
  motherId?: string; // Tag or name of dam
  originNotes?: string;

  // Ceba / Weight Stats
  batchNumber?: string; // e.g., "Lote 001-2026"
  startDateCeba?: string;
  approxEndDateCeba?: string;
  initialWeightKg: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  weightHistory: WeightRecord[];

  // Sales & Disposals (PDF reference)
  saleDate?: string;
  saleValueUSD?: number;
  disposalCause?: DisposalCause;
  ironBrand?: string; // e.g., "JAG", "TG", "MELI", "SIN HERRAR"
  photoUrl?: string; // Optional image URL or Base64 data URL of the animal

  // Special Alerts & Behavior Notes
  warningNote?: string; // e.g., "⚠️ Cuidado: Vaca agresiva con el ordeñador"
  generalNotes?: string;

  // Worker assignment
  assignedWorkerId?: string;
  assignedWorkerName?: string;

  // Jetbov & GanaderiAPP: Average Daily Gain (ADG / GDP in gr/day)
  lastAdgGramsPerDay?: number;
  estimatedTargetDate?: string;

  // CattleMax & Control Ganadero: Reproduction & Pedigree
  reproductiveStatus?: 'Vacia' | 'En Celo' | 'Servida' | 'Preñada' | 'Lactancia' | 'Seca';
  lastServiceDate?: string; // Date of AI or natural breeding
  serviceBullTagOrName?: string; // Sire used for mating/insemination
  inseminatorWorkerName?: string;
  expectedCalvingDate?: string; // Gestation calculated date (283 days)
  lastCalvingDate?: string;
  totalCalvingsCount?: number;
  daysOpen?: number; // Days since last calving without pregnancy

  // Multi-generation Pedigree (CattleMax)
  paternalGrandfather?: string;
  paternalGrandmother?: string;
  maternalGrandfather?: string;
  maternalGrandmother?: string;

  // Herdwatch & Sanidad: Withdrawal Period / Tiempo de Retiro y Carencia
  withdrawalUntilDate?: string; // YYYY-MM-DD - Milk/Meat restriction
  withdrawalReason?: string; // Medication causing withdrawal
  withdrawalType?: 'Carne' | 'Leche' | 'Ambas';

  // CowManager & CattleEye: Body Condition Score (BCS 1 to 5) & Biometrics
  bodyConditionScore?: number; // 1.0 to 5.0 (e.g. 3.25)
  chestGirthCm?: number; // Zoométric heart girth for weight estimation
  bodyLengthCm?: number; // Zoométric body length

  // Control Lechero (Control Ganadero & CowManager)
  dailyMilkYieldLiters?: number;
  lactationDays?: number;
  milkRecords?: {
    date: string;
    morningLiters: number;
    afternoonLiters: number;
    fatPercentage?: number;
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface ReproductiveEvent {
  id: string;
  animalId: string;
  date: string;
  type: 'Celo Detectado' | 'Inseminación Artificial' | 'Monta Natural' | 'Diagnóstico Palpación' | 'Diagnóstico Ecografía' | 'Parto' | 'Secado' | 'Aborto';
  details: string;
  sireTagOrName?: string;
  technicianName?: string;
  pregnancyResult?: 'Positiva' | 'Negativa' | 'Dudosa';
  calvingDetails?: {
    calfSex: AnimalSex;
    calfTag?: string;
    calvingEase: 'Normal' | 'Asistido' | 'Distócico / Cesárea';
    calfStatus: 'Vivo' | 'Muerto';
  };
  notes?: string;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface PasturePaddock {
  id: string;
  name: string; // e.g. "Potrero 1 - Estrella Africana"
  code: string;
  areaHectares: number;
  grassType: string; // e.g. "Brachiaria Decumbens", "Brizantha", "Estrella", "Guinea Mombasa"
  status: 'Ocupado' | 'En Descanso' | 'Listo para Pastoreo' | 'En Mantenimiento';
  currentOccupantBatch?: string; // e.g. "Lote Ceba 1"
  entryDate?: string; // When current animals entered
  exitDate?: string;
  daysInGrazing: number; // Días que lleva ocupado
  targetRestDays: number; // Días de descanso recomendados (e.g. 35)
  currentRestDays: number; // Días que lleva descansando
  estimatedBiomassKgPerM2: number; // Aforo kg/m² (e.g. 2.5)
  dryMatterPercentage: number; // e.g. 20%
  waterSource: 'Bebedero Automático' | 'Represa' | 'Quebrada Natural' | 'Tanque Móvil';
  fencingType: 'Cerca Eléctrica' | 'Púas 4 Hilos' | 'Madera Viva';
  // D3 Farm Map Geometry & Attributes
  polygonPoints?: [number, number][]; // Polygon vertices in farm plane (e.g. [x, y])
  centerPoint?: [number, number];
  gatePoint?: [number, number];
  waterPoint?: [number, number];
  treePoints?: [number, number][];
  assignedAnimals?: string[];
}

export interface Worker {
  id: string;
  name: string;
  role: 'Capataz' | 'Vaquero' | 'Veterinario' | 'Alimentador' | 'Administrador';
  phone: string;
  avatar: string;
  shift: 'Mañana' | 'Tarde' | 'Noche' | 'Completo';
  assignedCorralIds: string[];
  assignedAnimalCount: number;
  status: 'Activo' | 'En Pausa' | 'Vacaciones';
}

export interface Corral {
  id: string;
  name: string;
  code: string;
  capacity: number;
  currentCount: number;
  purpose: 'Maternidad' | 'Engorda Ceba' | 'Ordeño' | 'Cuarentena' | 'Pastoreo';
  location: string;
  assignedWorkerName: string;
}

export interface FeedItem {
  id: string;
  name: string;
  category: 'Concentrado' | 'Pasto de Corte' | 'Sales Minerales' | 'Pacas Heno' | 'Ensilaje' | 'Suplemento';
  currentStockKg: number;
  unit: 'Kg' | 'Sacos' | 'Pacas' | 'Libras';
  minThresholdKg: number;
  dailyUsageKg: number;
  costPerUnitUSD: number;
  supplier: string;
  lastRestocked: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  workerName: string;
  action: string;
  category: 'Ganado' | 'Inventario' | 'Salud' | 'Trabajador' | 'Finanzas' | 'Corral' | 'Manga' | 'Reproducción' | 'Potreros';
  details: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso';
  category: 'Venta Ganado' | 'Venta Leche' | 'Alimento' | 'Medicamentos' | 'Salarios' | 'Mantenimiento';
  description: string;
  amountUSD: number;
  animalId?: string;
  batchNumber?: string;
}

export interface MarketPriceConfig {
  fatteningBullKgUSD: number; // Precio Kg Macho Ceba (e.g. 2.10)
  breedingCowKgUSD: number; // Precio Kg Vaca Cría (e.g. 1.85)
  dairyCowKgUSD: number; // Precio Kg Vaca Lechera (e.g. 2.20)
  calfWeanedKgUSD: number; // Precio Kg Ternero Desteto (e.g. 2.40)
  cullCowKgUSD: number; // Precio Vaca Descarte (e.g. 1.45)
  milkLiterUSD: number; // Precio Litro de Leche (e.g. 0.48)
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  farmName: string;
  email: string;
}
