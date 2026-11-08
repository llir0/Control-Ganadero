import React, { useState } from 'react';
import {
  Syringe,
  AlertTriangle,
  Layers,
  Calendar,
  CheckCircle2,
  DollarSign,
  Clock,
  X,
  Users,
} from 'lucide-react';
import { Animal, Corral } from '../types';
import { performBatchTreatment } from '../lib/storage';

interface BatchTreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  corrals: Corral[];
  onRefreshData: () => void;
}

export const BatchTreatmentModal: React.FC<BatchTreatmentModalProps> = ({
  isOpen,
  onClose,
  animals,
  corrals,
  onRefreshData,
}) => {
  const [selectedCorralId, setSelectedCorralId] = useState<string>('all');
  const [treatmentType, setTreatmentType] = useState<'Vacuna' | 'Desparasitante' | 'Tratamiento' | 'Examen'>('Vacuna');
  const [medication, setMedication] = useState('Vacuna Aftosa + Rabia (Bivalente)');
  const [description, setDescription] = useState('Campaña oficial semestral de vacunación del hato');
  const [costPerHead, setCostPerHead] = useState<number>(3.50);
  const [withdrawalDays, setWithdrawalDays] = useState<number>(0);
  const [withdrawalType, setWithdrawalType] = useState<'Carne' | 'Leche' | 'Ambas'>('Ambas');
  const [workerName, setWorkerName] = useState('Dr. Danilo C. Ramírez');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected target animals
  const targetAnimals = animals.filter((a) => {
    if (a.status !== 'ACT') return false;
    if (selectedCorralId === 'all') return true;
    return a.corralId === selectedCorralId;
  });

  const totalEstimatedCost = (costPerHead * targetAnimals.length).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAnimals.length === 0) {
      alert('No hay animales activos en la selección');
      return;
    }

    const animalIds = targetAnimals.map((a) => a.id);
    const result = performBatchTreatment(
      animalIds,
      {
        type: treatmentType,
        medication,
        description,
        costPerHead,
        withdrawalDays: withdrawalDays > 0 ? withdrawalDays : undefined,
        withdrawalType,
      },
      workerName
    );

    setSuccessMessage(
      `✅ Tratamiento colectivo aplicado con éxito a ${result.recordsCount} animales. Historial clínico y auditoría actualizados.`
    );
    onRefreshData();

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Syringe className="w-3.5 h-3.5 text-amber-400" />
            iRancho Campo & Herdwatch
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Tratamiento Colectivo por Lote / Corral</h3>
        <p className="text-xs text-slate-400 mb-5">
          Aplica vacunaciones masivas, desparasitaciones periódicas o baños garrapaticidas a un grupo entero de una sola vez con fijación estricta de tiempos de retiro y carencia.
        </p>

        {successMessage ? (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seleccionar Grupo / Corral Destino
              </label>
              <select
                value={selectedCorralId}
                onChange={(e) => setSelectedCorralId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">Todo el Ganado Activo ({animals.filter(a => a.status === 'ACT').length} cabezas)</option>
                {corrals.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({animals.filter((a) => a.corralId === c.id && a.status === 'ACT').length} cabezas)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Tratamiento</label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Vacuna">Vacunación Colectiva</option>
                  <option value="Desparasitante">Desparasitación Masiva</option>
                  <option value="Tratamiento">Tratamiento / Baño Asperción</option>
                  <option value="Examen">Revisión Sanitaria Colectiva</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Medicamento / Producto</label>
                <input
                  type="text"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción / Dosis</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            {/* Herdwatch: Withdrawal Period Alert Box */}
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Período de Retiro / Carencia Sanitaria (Herdwatch)
                </span>
                <span className="text-[10px] text-slate-400">0 días si no tiene restricción</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Días de Retiro Obligatorio</label>
                  <input
                    type="number"
                    min="0"
                    value={withdrawalDays}
                    onChange={(e) => setWithdrawalDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-rose-700/60 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Aplica en</label>
                  <select
                    value={withdrawalType}
                    onChange={(e) => setWithdrawalType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  >
                    <option value="Ambas">Ambas (Carne y Leche)</option>
                    <option value="Carne">Solo Carne (Matadero)</option>
                    <option value="Leche">Solo Leche (Ordeño)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Costo por Cabeza ($ USD)</label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={costPerHead}
                  onChange={(e) => setCostPerHead(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Veterinario / Aplicador</label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Total Cost Summary */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total para <strong className="text-white">{targetAnimals.length} cabezas</strong>:
              </span>
              <span className="text-base font-bold text-amber-400 font-mono">
                ${totalEstimatedCost} USD
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <Syringe className="w-4 h-4" />
                Aplicar a las {targetAnimals.length} Cabezas
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
