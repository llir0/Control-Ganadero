import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Syringe,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight,
  Scale,
  Stethoscope,
  Baby,
  FileDown,
  X,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import { Animal, ClinicalRecord, AnimalTask } from '../types';
import {
  detectSmartAlerts,
  SmartAlert,
  snoozeSmartAlert,
  completeVaccinationAlert,
  AlertCategory,
} from '../lib/smartAlerts';

interface SmartAlertsDashboardPanelProps {
  animals: Animal[];
  clinicalRecords: ClinicalRecord[];
  tasks: AnimalTask[];
  onRefreshData: () => void;
  onOpenAnimalDetail: (animal: Animal) => void;
  onOpenMangaForAnimal: (animal: Animal) => void;
  onFilterAlertedAnimals?: (animalIds: string[]) => void;
  isFilterActive?: boolean;
}

export const SmartAlertsDashboardPanel: React.FC<SmartAlertsDashboardPanelProps> = ({
  animals,
  clinicalRecords,
  tasks,
  onRefreshData,
  onOpenAnimalDetail,
  onOpenMangaForAnimal,
  onFilterAlertedAnimals,
  isFilterActive = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'ALL'>('ALL');
  const [successActionMsg, setSuccessActionMsg] = useState<string | null>(null);

  // Compute live smart alerts
  const { alerts, stats } = useMemo(() => {
    return detectSmartAlerts(animals, clinicalRecords, tasks);
  }, [animals, clinicalRecords, tasks]);

  // Filter alerts by selected category
  const filteredAlerts = useMemo(() => {
    if (selectedCategory === 'ALL') return alerts;
    return alerts.filter((a) => a.category === selectedCategory);
  }, [alerts, selectedCategory]);

  // Handle Quick Complete Booster
  const handleQuickComplete = (alert: SmartAlert) => {
    completeVaccinationAlert(alert, 'Dr. Danilo C. Ramírez');
    setSuccessActionMsg(`✓ Revacunación registrada para #${alert.animalTag} (${alert.medicationName || 'Vacuna'}). Próximo refuerzo programado a 6 meses.`);
    onRefreshData();
    setTimeout(() => setSuccessActionMsg(null), 5000);
  };

  // Handle Snooze / Reprogramar
  const handleSnooze = (alert: SmartAlert) => {
    snoozeSmartAlert(alert, 15);
    setSuccessActionMsg(`⏱ Alerta de #${alert.animalTag} reprogramada por +15 días.`);
    onRefreshData();
    setTimeout(() => setSuccessActionMsg(null), 5000);
  };

  // Handle toggle filter in the animal grid
  const handleToggleFilterHato = () => {
    if (!onFilterAlertedAnimals) return;
    if (isFilterActive) {
      onFilterAlertedAnimals([]);
    } else {
      const alertedIds = Array.from(new Set(alerts.map((a) => a.animalId)));
      onFilterAlertedAnimals(alertedIds);
    }
  };

  // If no alerts, return a clean healthy status badge
  if (alerts.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Hato al Día • Sin Alertas Sanitarias Pendientes</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                100% Óptimo
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Todos los protocolos de vacunación, desparasitación y retiros sanitarios se encuentran vigentes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            {stats.criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse border-2 border-slate-900">
                {stats.criticalCount}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>Alertas Inteligentes & Sanidad Animal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  {stats.totalAlerts} Activas
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Monitoreo continuo de vacunación, retiros sanitarios, tareas clínicas y fechas de parto.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          {onFilterAlertedAnimals && (
            <button
              type="button"
              onClick={handleToggleFilterHato}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isFilterActive
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30'
              }`}
              title="Filtrar la vista principal del hato para mostrar solo los animales con alerta"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isFilterActive ? 'Quitar Filtro Hato' : 'Ver Solo Afectados'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title={isCollapsed ? 'Expandir panel de alertas' : 'Colapsar panel'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successActionMsg && (
        <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-500/40 text-xs text-emerald-200 font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successActionMsg}</span>
          </div>
          <button onClick={() => setSuccessActionMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-4"
          >
            {/* KPI Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div
                onClick={() => setSelectedCategory(selectedCategory === 'VACUNA' ? 'ALL' : 'VACUNA')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'VACUNA'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-semibold">Vacunas & Dosis</span>
                </div>
                <span className="font-mono font-bold text-rose-400">
                  {stats.vaccinesOverdueCount + stats.vaccinesUpcomingCount}
                </span>
              </div>

              <div
                onClick={() =>
                  setSelectedCategory(selectedCategory === 'RETIRO_SANITARIO' ? 'ALL' : 'RETIRO_SANITARIO')
                }
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'RETIRO_SANITARIO'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-semibold">Retiro Sanitario</span>
                </div>
                <span className="font-mono font-bold text-amber-400">{stats.activeWithdrawalsCount}</span>
              </div>

              <div
                onClick={() =>
                  setSelectedCategory(selectedCategory === 'REPRODUCCION' ? 'ALL' : 'REPRODUCCION')
                }
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'REPRODUCCION'
                    ? 'bg-pink-950/60 border-pink-500 text-pink-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-400" />
                  <span className="text-[11px] font-semibold">Partos & Secado</span>
                </div>
                <span className="font-mono font-bold text-pink-400">{stats.calvingsUpcomingCount}</span>
              </div>

              <div
                onClick={() => setSelectedCategory(selectedCategory === 'TAREA_VET' ? 'ALL' : 'TAREA_VET')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedCategory === 'TAREA_VET'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-400" />
                  <span className="text-[11px] font-semibold">Tareas Clínicas</span>
                </div>
                <span className="font-mono font-bold text-blue-400">{stats.tasksOverdueCount}</span>
              </div>
            </div>

            {/* List of Smart Alerts Cards */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {filteredAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic">
                  No hay alertas en esta categoría específica.
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const targetAnimal = animals.find((a) => a.id === alert.animalId);
                  const isCritical = alert.severity === 'CRITICAL';
                  const isWarning = alert.severity === 'WARNING';

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCritical
                          ? 'bg-slate-950/90 border-rose-500/40 hover:border-rose-500/80 shadow-md shadow-rose-950/20'
                          : isWarning
                          ? 'bg-slate-950/80 border-amber-500/40 hover:border-amber-500/80'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left Info Column */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Animal Tag Pill */}
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-bold text-xs border border-slate-700">
                              TAG #{alert.animalTag}
                            </span>

                            <span className="font-bold text-xs text-slate-200">
                              {alert.animalName} ({alert.animalBreed})
                            </span>

                            <span className="text-[11px] text-slate-400">
                              • {alert.animalCorralName}
                            </span>

                            {/* Urgency Badge */}
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                alert.isOverdue
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : alert.daysDiff === 0
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                  : alert.daysDiff <= 7
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {alert.isOverdue
                                ? `Vencida (-${Math.abs(alert.daysDiff)}d)`
                                : alert.daysDiff === 0
                                ? 'VENCE HOY'
                                : `en ${alert.daysDiff} días`}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{alert.title}</span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>

                        {/* Right Quick Actions Bar */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                          {/* Manga Quick Application */}
                          {targetAnimal && (
                            <button
                              type="button"
                              onClick={() => onOpenMangaForAnimal(targetAnimal)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Pesar y aplicar tratamiento simultáneo en la manga"
                            >
                              <Scale className="w-3 h-3 text-emerald-400" />
                              <span>Aplicar en Manga</span>
                            </button>
                          )}

                          {/* Quick 1-Click Complete Booster */}
                          {(alert.category === 'VACUNA' || alert.category === 'DESPARASITANTE') && (
                            <button
                              type="button"
                              onClick={() => handleQuickComplete(alert)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title="Registrar dosis aplicada y programar refuerzo a 6 meses"
                            >
                              <Check className="w-3 h-3 text-teal-400" />
                              <span>Registrar Aplicada</span>
                            </button>
                          )}

                          {/* Snooze +15 Days */}
                          {(alert.clinicalRecordId || alert.taskId) && (
                            <button
                              type="button"
                              onClick={() => handleSnooze(alert)}
                              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition-all cursor-pointer"
                              title="Posponer / reprogramar por 15 días"
                            >
                              <span>+15d</span>
                            </button>
                          )}

                          {/* View Clinical Record Detail */}
                          {targetAnimal && (
                            <button
                              type="button"
                              onClick={() => onOpenAnimalDetail(targetAnimal)}
                              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title="Ver ficha técnica completa del animal"
                            >
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>Ficha</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
