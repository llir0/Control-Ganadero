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
  Search,
  Filter,
  X,
  Scale,
  Eye,
  Check,
  Stethoscope,
  Baby,
  FileDown,
} from 'lucide-react';
import { Animal, ClinicalRecord, AnimalTask } from '../types';
import {
  detectSmartAlerts,
  SmartAlert,
  snoozeSmartAlert,
  completeVaccinationAlert,
  AlertCategory,
  AlertSeverity,
} from '../lib/smartAlerts';

interface SmartAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  clinicalRecords: ClinicalRecord[];
  tasks: AnimalTask[];
  onRefreshData: () => void;
  onOpenAnimalDetail: (animal: Animal) => void;
  onOpenMangaForAnimal: (animal: Animal) => void;
}

export const SmartAlertsModal: React.FC<SmartAlertsModalProps> = ({
  isOpen,
  onClose,
  animals,
  clinicalRecords,
  tasks,
  onRefreshData,
  onOpenAnimalDetail,
  onOpenMangaForAnimal,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'ALL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { alerts, stats } = useMemo(() => {
    return detectSmartAlerts(animals, clinicalRecords, tasks);
  }, [animals, clinicalRecords, tasks]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = a.animalTag.toLowerCase().includes(q);
        const matchesName = a.animalName.toLowerCase().includes(q);
        const matchesMed = a.medicationName?.toLowerCase().includes(q) || false;
        const matchesTitle = a.title.toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesMed && !matchesTitle) return false;
      }
      return true;
    });
  }, [alerts, selectedSeverity, selectedCategory, searchQuery]);

  const handleQuickComplete = (alert: SmartAlert) => {
    completeVaccinationAlert(alert, 'Dr. Danilo C. Ramírez');
    setToastMessage(`✓ Revacunación registrada para #${alert.animalTag}. Refuerzo programado a 6 meses.`);
    onRefreshData();
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSnooze = (alert: SmartAlert) => {
    snoozeSmartAlert(alert, 15);
    setToastMessage(`⏱ Alerta de #${alert.animalTag} pospuesta por +15 días.`);
    onRefreshData();
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/40">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Panel de Monitoreo Sanitario & Alertas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {stats.totalAlerts} Total
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vigilancia epidemiológica automatizada: vacunas vencidas, retiros sanitarios y tareas preventivas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast feedback */}
        {toastMessage && (
          <div className="px-5 py-2.5 bg-emerald-950 border-b border-emerald-500/40 text-xs text-emerald-200 font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter controls */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por arete, animal, medicamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'CRITICAL', label: `Críticas (${stats.criticalCount})`, color: 'text-rose-400' },
                { id: 'WARNING', label: `Próximas (${stats.warningCount})`, color: 'text-amber-400' },
                { id: 'INFO', label: `Informativas (${stats.infoCount})`, color: 'text-blue-400' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSeverity(s.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSeverity === s.id
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={s.color || ''}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Alerts List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 no-scrollbar">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs italic">
              No se encontraron alertas sanitarias para los criterios de búsqueda seleccionados.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const targetAnimal = animals.find((a) => a.id === alert.animalId);
              const isCritical = alert.severity === 'CRITICAL';
              const isWarning = alert.severity === 'WARNING';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCritical
                      ? 'bg-slate-950/90 border-rose-500/40'
                      : isWarning
                      ? 'bg-slate-950/80 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-white font-mono font-bold text-xs border border-slate-700">
                          TAG #{alert.animalTag}
                        </span>
                        <span className="font-bold text-xs text-white">
                          {alert.animalName} ({alert.animalBreed})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {alert.animalCorralName}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            alert.isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : alert.daysDiff === 0
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : alert.daysDiff <= 7
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {alert.isOverdue
                            ? `Vencida (-${Math.abs(alert.daysDiff)}d)`
                            : alert.daysDiff === 0
                            ? 'VENCE HOY'
                            : `en ${alert.daysDiff} días`}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-100">{alert.title}</div>
                      <p className="text-[11px] text-slate-400">{alert.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-2 sm:pt-0">
                      {targetAnimal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenMangaForAnimal(targetAnimal);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Pesar y aplicar tratamiento en manga de manejo"
                        >
                          <Scale className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Manga</span>
                        </button>
                      )}

                      {(alert.category === 'VACUNA' || alert.category === 'DESPARASITANTE') && (
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(alert)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          title="Registrar dosis aplicada y programar refuerzo a 6 meses"
                        >
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>Aplicar</span>
                        </button>
                      )}

                      {(alert.clinicalRecordId || alert.taskId) && (
                        <button
                          type="button"
                          onClick={() => handleSnooze(alert)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                          title="Posponer / reprogramar por 15 días"
                        >
                          <span>+15d</span>
                        </button>
                      )}

                      {targetAnimal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAnimalDetail(targetAnimal);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          title="Ver ficha técnica completa del animal"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ficha</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Control Ganadero Pro • Módulo Sanitario Automatizado</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
          >
            Cerrar Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
