import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Grid, MapPin, Plus, Edit2, Trash2, X, CheckCircle2, User, ShieldAlert, Heart, Milk, Flame, Scale, Syringe, Compass } from 'lucide-react';
import { Corral, Animal, Worker } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';

interface CorralsViewProps {
  corrals: Corral[];
  animals: Animal[];
  workers?: Worker[];
  onSaveCorral?: (corral: Corral) => void;
  onDeleteCorral?: (corralId: string) => void;
  onOpenDetail?: (animal: Animal) => void;
  onOpenMangaWithCorral?: (corralId: string) => void;
  onOpenBatchTreatmentWithCorral?: (corralId: string) => void;
  onOpenMapForPaddock?: (paddockId: string) => void;
}

const PURPOSE_OPTIONS: SelectOption[] = [
  {
    value: 'Engorda Ceba',
    label: 'Engorda Ceba',
    description: 'Finalización y ganancia de peso',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    badge: 'Ceba',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'Ordeño',
    label: 'Ordeño y Lechería',
    description: 'Manejo diario de vacas en producción',
    icon: <Milk className="w-4 h-4 text-cyan-400" />,
    badge: 'Leche',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'Maternidad',
    label: 'Maternidad y Preparto',
    description: 'Atención especial a pariciones y recién nacidos',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    badge: 'Cría',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    value: 'Cuarentena',
    label: 'Cuarentena y Sanidad',
    description: 'Aislamiento de animales bajo tratamiento',
    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    badge: 'Aislamiento',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'Pastoreo',
    label: 'Potrero de Pastoreo',
    description: 'Rotación intensiva de pasturas',
    icon: <Grid className="w-4 h-4 text-emerald-400" />,
    badge: 'Pradera',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
];

export const CorralsView: React.FC<CorralsViewProps> = ({
  corrals,
  animals,
  workers = [],
  onSaveCorral,
  onDeleteCorral,
  onOpenDetail,
  onOpenMangaWithCorral,
  onOpenBatchTreatmentWithCorral,
  onOpenMapForPaddock,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCorral, setEditingCorral] = useState<Corral | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [purpose, setPurpose] = useState<Corral['purpose']>('Engorda Ceba');
  const [location, setLocation] = useState('Sector Norte');
  const [assignedWorkerName, setAssignedWorkerName] = useState('Pedro Ramírez');

  const workerOptions: SelectOption[] = workers.map((w) => ({
    value: w.name,
    label: w.name,
    description: `${w.role} • Turno ${w.shift}`,
    icon: <User className="w-4 h-4 text-emerald-400" />,
    badge: w.role,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }));

  const openAddModal = () => {
    setEditingCorral(null);
    setName('');
    setCode(`COR-00${corrals.length + 1}`);
    setCapacity('25');
    setPurpose('Engorda Ceba');
    setLocation('Sector Norte');
    setAssignedWorkerName(workers[0]?.name || 'Pedro Ramírez');
    setShowModal(true);
  };

  const openEditModal = (corral: Corral) => {
    setEditingCorral(corral);
    setName(corral.name);
    setCode(corral.code);
    setCapacity(corral.capacity.toString());
    setPurpose(corral.purpose);
    setLocation(corral.location);
    setAssignedWorkerName(corral.assignedWorkerName);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !onSaveCorral) return;

    const parsedCap = parseInt(capacity, 10) || 20;

    const corralToSave: Corral = {
      id: editingCorral ? editingCorral.id : `corral-${Date.now()}`,
      name,
      code: code || `COR-${Math.floor(Math.random() * 900 + 100)}`,
      capacity: parsedCap,
      currentCount: editingCorral ? editingCorral.currentCount : 0,
      purpose,
      location,
      assignedWorkerName,
    };

    onSaveCorral(corralToSave);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Grid className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Corrales, Potreros y Capacidad de Aforo</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distribución espacial del hato por grupo de producción, capacidad máxima y aforo actual.
          </p>
        </div>

        {onSaveCorral && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Corral / Potrero</span>
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {corrals.map((corral) => {
          const corralAnimals = animals.filter(
            (a) => a.corralId === corral.id || a.corralName === corral.name
          );
          const occupancyPercentage = Math.min(
            100,
            Math.round((corralAnimals.length / corral.capacity) * 100)
          );

          return (
            <motion.div
              key={corral.id}
              whileHover={{ y: -2 }}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {corral.code}
                    </span>
                    <h3 className="font-extrabold text-base text-white">{corral.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {corral.location}
                  </p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                    {corral.purpose}
                  </span>
                  {onSaveCorral && (
                    <button
                      onClick={() => openEditModal(corral)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      title="Editar Corral"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  )}
                  {onDeleteCorral && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el corral ${corral.name}?`)) {
                          onDeleteCorral(corral.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-all"
                      title="Eliminar Corral"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Ocupación / Aforo</span>
                  <span className="text-emerald-400 font-mono">
                    {corralAnimals.length} / {corral.capacity} Cabezas ({occupancyPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      occupancyPercentage > 90
                        ? 'bg-rose-500'
                        : occupancyPercentage > 75
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>

              {/* Responsible & Animals preview */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Encargado de Corral:</span>
                  <strong className="text-slate-200">{corral.assignedWorkerName}</strong>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Ganado Asignado a este Corral:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
                    {corralAnimals.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">Sin ganado asignado</span>
                    ) : (
                      corralAnimals.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => onOpenDetail?.(a)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-all"
                          title={`Ver ficha completa de #${a.id}`}
                        >
                          #{a.id} ({a.sex === 'M' ? '♂' : '♀'} {a.purpose})
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Workflow Action Buttons for this Corral */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                  {onOpenMangaWithCorral && (
                    <button
                      type="button"
                      onClick={() => onOpenMangaWithCorral(corral.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Llevar lote de este corral a la báscula de manga"
                    >
                      <Scale className="w-3 h-3 text-emerald-400" />
                      <span>Pesar en Manga</span>
                    </button>
                  )}

                  {onOpenBatchTreatmentWithCorral && (
                    <button
                      type="button"
                      onClick={() => onOpenBatchTreatmentWithCorral(corral.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Aplicar tratamiento sanitario masivo a este corral"
                    >
                      <Syringe className="w-3 h-3 text-amber-400" />
                      <span>Tratamiento</span>
                    </button>
                  )}

                  {onOpenMapForPaddock && (
                    <button
                      type="button"
                      onClick={() => onOpenMapForPaddock('pad-1')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      title="Ver potreros en mapa D3"
                    >
                      <Compass className="w-3 h-3 text-cyan-400" />
                      <span>Mapa D3</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add / Edit Corral Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 space-y-5 shadow-2xl shadow-black/80"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {editingCorral ? 'Editar Corral / Potrero' : 'Registrar Nuevo Corral o Potrero'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Configuración de división de potreros y aforo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Nombre del Corral / Potrero *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Corral E - Maternidad"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Código Identificador
                    </label>
                    <input
                      type="text"
                      placeholder="COR-005"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Capacidad (Cabezas) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="25"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <CustomSelect
                    label="Propósito / Uso"
                    value={purpose}
                    onChange={(val) => setPurpose(val as any)}
                    options={PURPOSE_OPTIONS}
                  />

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Ubicación / Sector
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Sector Norte"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {workerOptions.length > 0 ? (
                  <CustomSelect
                    label="Encargado Responsable"
                    value={assignedWorkerName}
                    onChange={(val) => setAssignedWorkerName(val)}
                    options={workerOptions}
                  />
                ) : (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Encargado Responsable
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del encargado"
                      value={assignedWorkerName}
                      onChange={(e) => setAssignedWorkerName(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Corral</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
