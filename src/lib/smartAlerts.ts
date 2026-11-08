import { Animal, ClinicalRecord, AnimalTask } from '../types';
import {
  getStoredAnimals,
  getStoredClinicalRecords,
  getStoredTasks,
  addClinicalRecord,
  saveTask,
  saveStoredAnimal,
} from './storage';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertCategory =
  | 'VACUNA'
  | 'DESPARASITANTE'
  | 'RETIRO_SANITARIO'
  | 'REPRODUCCION'
  | 'TAREA_VET'
  | 'PESO_ANOMALIA';

export interface SmartAlert {
  id: string;
  animalId: string;
  animalName: string;
  animalTag: string;
  animalBreed: string;
  animalCorralName: string;
  animalPaddockName?: string;
  animalSex: 'M' | 'F';
  animalPurpose: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  dueDate: string; // ISO date string YYYY-MM-DD
  daysDiff: number; // < 0 means overdue, 0 means today, > 0 means due in future
  isOverdue: boolean;
  medicationName?: string;
  veterinarianOrWorker?: string;
  clinicalRecordId?: string;
  taskId?: string;
  sourceType: 'clinical' | 'withdrawal' | 'reproduction' | 'task' | 'weight';
}

export interface SmartAlertsStats {
  totalAlerts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  vaccinesOverdueCount: number;
  vaccinesUpcomingCount: number;
  activeWithdrawalsCount: number;
  calvingsUpcomingCount: number;
  tasksOverdueCount: number;
}

/**
 * Normalizes date comparison to current local time (midnight comparison)
 */
function getDaysDifference(dateStr: string, referenceDate: Date = new Date()): number {
  const target = new Date(dateStr);
  const ref = new Date(referenceDate);

  // Normalize hours
  target.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Scans animals, clinical records, and tasks to detect all smart health and veterinary alerts
 */
export function detectSmartAlerts(
  animals: Animal[] = getStoredAnimals(),
  clinicalRecords: ClinicalRecord[] = getStoredClinicalRecords(),
  tasks: AnimalTask[] = getStoredTasks()
): {
  alerts: SmartAlert[];
  stats: SmartAlertsStats;
} {
  const alerts: SmartAlert[] = [];
  const today = new Date();
  const animalMap = new Map<string, Animal>();
  animals.forEach((a) => animalMap.set(a.id, a));

  // 1. MONITOR CLINICAL RECORDS (Vaccinations, Dewormers, Health Exams)
  clinicalRecords.forEach((record) => {
    if (!record.nextDueDate) return;

    const animal = animalMap.get(record.animalId);
    if (!animal || animal.status !== 'ACT') return;

    const daysDiff = getDaysDifference(record.nextDueDate, today);
    const isOverdue = daysDiff < 0;
    const isDueToday = daysDiff === 0;
    const isUpcoming = daysDiff > 0 && daysDiff <= 21; // Alert up to 21 days in advance

    if (isOverdue || isDueToday || isUpcoming) {
      const isVaccine =
        record.type === 'Vacuna' ||
        record.medication?.toLowerCase().includes('vacuna') ||
        record.description?.toLowerCase().includes('vacun');
      const isDewormer =
        record.type === 'Desparasitante' ||
        record.medication?.toLowerCase().includes('desparasit') ||
        record.description?.toLowerCase().includes('desparasit');

      let category: AlertCategory = 'VACUNA';
      if (isDewormer) category = 'DESPARASITANTE';
      else if (record.type === 'Examen') category = 'TAREA_VET';

      let severity: AlertSeverity = 'INFO';
      let title = '';
      let description = '';

      if (isOverdue) {
        severity = 'CRITICAL';
        const absDays = Math.abs(daysDiff);
        title = `🔴 Refuerzo Vencido: ${record.medication || record.type}`;
        description = `El animal requiere revacunación urgente de ${record.medication || record.description}. Venció hace ${absDays} día(s) (${record.nextDueDate}).`;
      } else if (isDueToday) {
        severity = 'CRITICAL';
        title = `⚠️ Revacunación Programada para HOY: ${record.medication || record.type}`;
        description = `Fecha de vencimiento alcanzada hoy. Aplicar dosis de refuerzo de ${record.medication}.`;
      } else {
        severity = daysDiff <= 7 ? 'WARNING' : 'INFO';
        title = `📅 Próxima Revacunación: ${record.medication || record.type}`;
        description = `Programada en ${daysDiff} día(s) (${record.nextDueDate}). Veterinario a cargo: ${record.veterinarian || 'Dr. Danilo'}.`;
      }

      alerts.push({
        id: `alert-clin-${record.id}`,
        animalId: animal.id,
        animalName: animal.name || `Animal #${animal.id}`,
        animalTag: animal.id,
        animalBreed: animal.breed,
        animalCorralName: animal.corralName,
        animalPaddockName: animal.paddockName,
        animalSex: animal.sex,
        animalPurpose: animal.purpose,
        category,
        severity,
        title,
        description,
        dueDate: record.nextDueDate,
        daysDiff,
        isOverdue,
        medicationName: record.medication,
        veterinarianOrWorker: record.veterinarian,
        clinicalRecordId: record.id,
        sourceType: 'clinical',
      });
    }
  });

  // 2. MONITOR ACTIVE WITHDRAWAL PERIODS (Retiro Sanitario - Inocuidad)
  animals
    .filter((a) => a.status === 'ACT' && a.withdrawalUntilDate)
    .forEach((animal) => {
      const daysDiff = getDaysDifference(animal.withdrawalUntilDate!, today);
      if (daysDiff >= 0) {
        // Active withdrawal
        alerts.push({
          id: `alert-with-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name || `Animal #${animal.id}`,
          animalTag: animal.id,
          animalBreed: animal.breed,
          animalCorralName: animal.corralName,
          animalPaddockName: animal.paddockName,
          animalSex: animal.sex,
          animalPurpose: animal.purpose,
          category: 'RETIRO_SANITARIO',
          severity: 'CRITICAL',
          title: `⛔ Retiro Sanitario Activo (${daysDiff} días restantes)`,
          description: `Restricción por ${animal.withdrawalReason || 'tratamiento médico'}. Vence el ${animal.withdrawalUntilDate}. Prohibido ordeño o sacrificio.`,
          dueDate: animal.withdrawalUntilDate!,
          daysDiff,
          isOverdue: false,
          medicationName: animal.withdrawalReason,
          sourceType: 'withdrawal',
        });
      }
    });

  // 3. MONITOR REPRODUCTIVE EVENTS (Upcoming Calvings & Dry-off / Secado)
  animals
    .filter((a) => a.status === 'ACT' && a.expectedCalvingDate)
    .forEach((animal) => {
      const daysDiff = getDaysDifference(animal.expectedCalvingDate!, today);
      // If calving is within next 60 days
      if (daysDiff >= -5 && daysDiff <= 60) {
        let severity: AlertSeverity = 'INFO';
        let title = '';
        let description = '';

        if (daysDiff <= 0) {
          severity = 'CRITICAL';
          title = `🍼 Parto Inminente / Vencido: #${animal.id}`;
          description = `Fecha estimada de parto alcanzada (${animal.expectedCalvingDate}). Supervisar en corral de maternidad.`;
        } else if (daysDiff <= 15) {
          severity = 'WARNING';
          title = `🤰 Parto en ~${daysDiff} días: #${animal.id}`;
          description = `Trasladar de inmediato a corral de maternidad para atención preparto.`;
        } else {
          severity = 'INFO';
          title = `🥛 Protocolo de Secado: #${animal.id} (Parto en ${daysDiff}d)`;
          description = `Suspender ordeño 60 días antes del parto (${animal.expectedCalvingDate}) para recuperación de ubre.`;
        }

        alerts.push({
          id: `alert-calv-${animal.id}`,
          animalId: animal.id,
          animalName: animal.name || `Animal #${animal.id}`,
          animalTag: animal.id,
          animalBreed: animal.breed,
          animalCorralName: animal.corralName,
          animalPaddockName: animal.paddockName,
          animalSex: animal.sex,
          animalPurpose: animal.purpose,
          category: 'REPRODUCCION',
          severity,
          title,
          description,
          dueDate: animal.expectedCalvingDate!,
          daysDiff,
          isOverdue: daysDiff < 0,
          sourceType: 'reproduction',
        });
      }
    });

  // 4. MONITOR SANITARY & VET TASKS
  tasks
    .filter((t) => t.status !== 'completado')
    .forEach((task) => {
      const animal = animalMap.get(task.animalId);
      if (!animal || animal.status !== 'ACT') return;

      const daysDiff = getDaysDifference(task.dueDate, today);
      const isOverdue = daysDiff < 0;

      // Only alert if overdue or due in next 7 days
      if (isOverdue || daysDiff <= 7) {
        alerts.push({
          id: `alert-task-${task.id}`,
          animalId: animal.id,
          animalName: animal.name || `Animal #${animal.id}`,
          animalTag: animal.id,
          animalBreed: animal.breed,
          animalCorralName: animal.corralName,
          animalPaddockName: animal.paddockName,
          animalSex: animal.sex,
          animalPurpose: animal.purpose,
          category: 'TAREA_VET',
          severity: isOverdue || task.priority === 'alta' ? 'WARNING' : 'INFO',
          title: `📋 Tarea: ${task.title}`,
          description: `Tipo: ${task.type}. Asignado a: ${task.assignedWorkerName}. ${
            isOverdue ? `Atrasada por ${Math.abs(daysDiff)} día(s)` : `Vence en ${daysDiff} día(s)`
          }.`,
          dueDate: task.dueDate,
          daysDiff,
          isOverdue,
          veterinarianOrWorker: task.assignedWorkerName,
          taskId: task.id,
          sourceType: 'task',
        });
      }
    });

  // Sort alerts: CRITICAL first, then by daysDiff ascending (most urgent first)
  alerts.sort((a, b) => {
    const sevOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    return a.daysDiff - b.daysDiff;
  });

  // Calculate statistics
  const stats: SmartAlertsStats = {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
    warningCount: alerts.filter((a) => a.severity === 'WARNING').length,
    infoCount: alerts.filter((a) => a.severity === 'INFO').length,
    vaccinesOverdueCount: alerts.filter((a) => a.category === 'VACUNA' && a.isOverdue).length,
    vaccinesUpcomingCount: alerts.filter((a) => a.category === 'VACUNA' && !a.isOverdue).length,
    activeWithdrawalsCount: alerts.filter((a) => a.category === 'RETIRO_SANITARIO').length,
    calvingsUpcomingCount: alerts.filter((a) => a.category === 'REPRODUCCION').length,
    tasksOverdueCount: alerts.filter((a) => a.category === 'TAREA_VET' && a.isOverdue).length,
  };

  return { alerts, stats };
}

/**
 * Reschedule/Snooze an alert by adding days to nextDueDate or task
 */
export function snoozeSmartAlert(alert: SmartAlert, daysToAdd: number = 15): void {
  const newDate = new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];

  if (alert.clinicalRecordId) {
    const records = getStoredClinicalRecords();
    const updated = records.map((r) => {
      if (r.id === alert.clinicalRecordId) {
        return { ...r, nextDueDate: newDate };
      }
      return r;
    });
    localStorage.setItem('control_ganadero_clinical_records', JSON.stringify(updated));
  } else if (alert.taskId) {
    const tasks = getStoredTasks();
    const updated = tasks.map((t) => {
      if (t.id === alert.taskId) {
        return { ...t, dueDate: newDate };
      }
      return t;
    });
    localStorage.setItem('control_ganadero_tasks', JSON.stringify(updated));
  }
}

/**
 * Mark vaccination or treatment as administered, updating clinical history
 */
export function completeVaccinationAlert(
  alert: SmartAlert,
  workerName: string = 'Dr. Danilo C. Ramírez'
): void {
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDueDateStr = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]; // Next booster in 6 months

  addClinicalRecord(
    {
      animalId: alert.animalId,
      date: todayStr,
      type: alert.category === 'DESPARASITANTE' ? 'Desparasitante' : 'Vacuna',
      description: `Refuerzo sanitario aplicado por alerta inteligente: ${alert.medicationName || alert.title}`,
      medication: alert.medicationName || 'Vacuna Multivalente',
      veterinarian: workerName,
      nextDueDate: nextDueDateStr,
      cost: 15,
    },
    workerName
  );

  // If there was an old record, clear its nextDueDate to prevent double-alerting
  if (alert.clinicalRecordId) {
    const records = getStoredClinicalRecords();
    const updated = records.map((r) => {
      if (r.id === alert.clinicalRecordId) {
        return { ...r, nextDueDate: undefined };
      }
      return r;
    });
    localStorage.setItem('control_ganadero_clinical_records', JSON.stringify(updated));
  }
}
