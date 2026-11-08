import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Phone,
  Plus,
  UserCheck,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Stethoscope,
  Shield,
  Briefcase,
  Wheat,
  Clock,
} from 'lucide-react';
import { Worker, Corral, Animal } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { SegmentedPicker, SegmentOption } from './ui/SegmentedPicker';

interface WorkersViewProps {
  workers: Worker[];
  corrals: Corral[];
  animals: Animal[];
  onSaveWorker: (worker: Worker) => void;
  onDeleteWorker?: (workerId: string) => void;
}

const ROLE_OPTIONS: SelectOption[] = [
  {
    value: 'Capataz',
    label: 'Capataz General',
    description: 'Supervisión y control operativo de la finca',
    icon: <Shield className="w-4 h-4 text-emerald-400" />,
    badge: 'Jefatura',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'Vaquero',
    label: 'Vaquero / Manejador',
    description: 'Arreo, pastoreo y chequeo diario del ganado',
    icon: <Users className="w-4 h-4 text-cyan-400" />,
    badge: 'Campo',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'Veterinario',
    label: 'Veterinario / Zootecnista',
    description: 'Sanidad animal, vacunación y partos',
    icon: <Stethoscope className="w-4 h-4 text-rose-400" />,
    badge: 'Médico',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    value: 'Alimentador',
    label: 'Alimentador / Nutrición',
    description: 'Raciones de forraje, concentrado y sales',
    icon: <Wheat className="w-4 h-4 text-amber-400" />,
    badge: 'Nutrición',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'Administrador',
    label: 'Administrador',
    description: 'Finanzas, compras e inventario general',
    icon: <Briefcase className="w-4 h-4 text-purple-400" />,
    badge: 'Gestión',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
];

const SHIFT_OPTIONS: SegmentOption<Worker['shift']>[] = [
  { value: 'Mañana', label: 'Mañana', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'Tarde', label: 'Tarde', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'Noche', label: 'Noche', icon: <Clock className="w-3.5 h-3.5" /> },
  { value: 'Completo', label: 'Completo' },
];

const STATUS_OPTIONS: SegmentOption<Worker['status']>[] = [
  { value: 'Activo', label: 'Activo', activeColor: 'emerald' },
  { value: 'En Pausa', label: 'En Pausa', activeColor: 'amber' },
  { value: 'Vacaciones', label: 'Vacaciones', activeColor: 'blue' },
];

export const WorkersView: React.FC<WorkersViewProps> = ({
  workers,
  corrals,
  animals,
  onSaveWorker,
  onDeleteWorker,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<Worker['role']>('Vaquero');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<Worker['shift']>('Mañana');
  const [status, setStatus] = useState<Worker['status']>('Activo');

  const openAddModal = () => {
    setEditingWorker(null);
    setName('');
    setRole('Vaquero');
    setPhone('');
    setShift('Mañana');
    setStatus('Activo');
    setShowModal(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setName(worker.name);
    setRole(worker.role);
    setPhone(worker.phone);
    setShift(worker.shift);
    setStatus(worker.status);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const workerToSave: Worker = {
      id: editingWorker ? editingWorker.id : `w-${Date.now()}`,
      name,
      role,
      phone: phone || '+52 961 000 0000',
      avatar: editingWorker
        ? editingWorker.avatar
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      shift,
      assignedCorralIds: editingWorker ? editingWorker.assignedCorralIds : ['corral-1'],
      assignedAnimalCount: editingWorker ? editingWorker.assignedAnimalCount : 0,
      status,
    };

    onSaveWorker(workerToSave);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Personal y Encargados de Campo</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Asignación de responsabilidad de ganado por trabajador, turno y auditoría de labores.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Trabajador</span>
        </motion.button>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => {
          const assignedAnimals = animals.filter(
            (a) => a.assignedWorkerId === worker.id || a.assignedWorkerName?.includes(worker.name)
          );

          return (
            <motion.div
              key={worker.id}
              whileHover={{ y: -3 }}
              className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/40 shadow-inner"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-white">{worker.name}</h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {worker.role}
                        </span>
                        <span className="text-[10px] text-slate-400">{worker.shift}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(worker)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      title="Editar Trabajador"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    {onDeleteWorker && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al trabajador ${worker.name}?`)) {
                            onDeleteWorker(worker.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-all"
                        title="Eliminar Trabajador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" /> Teléfono:
                    </span>
                    <span className="font-mono text-slate-200">{worker.phone}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" /> Ganado Bajo su Cargo:
                    </span>
                    <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {assignedAnimals.length} Cabezas
                    </span>
                  </div>
                </div>

                {/* Animal List tags under this worker */}
                {assignedAnimals.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Aretes Bajo Responsabilidad:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                      {assignedAnimals.map((a) => (
                        <span
                          key={a.id}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          #{a.id} ({a.breed.split(' ')[0]})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add / Edit Worker Modal */}
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
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {editingWorker ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Ficha de personal y turnos de trabajo</p>
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
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pedro Ramírez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm transition-all"
                    required
                  />
                </div>

                <CustomSelect
                  label="Cargo / Puesto"
                  value={role}
                  onChange={(val) => setRole(val as any)}
                  options={ROLE_OPTIONS}
                />

                <SegmentedPicker
                  label="Turno Laboral"
                  value={shift}
                  onChange={(val) => setShift(val)}
                  options={SHIFT_OPTIONS}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="+52 961 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <SegmentedPicker
                    label="Estado"
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={STATUS_OPTIONS}
                  />
                </div>

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
                    <span>Guardar Empleado</span>
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

