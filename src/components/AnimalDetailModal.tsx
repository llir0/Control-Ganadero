import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  Stethoscope,
  Calendar,
  Scale,
  QrCode,
  AlertTriangle,
  Tag,
  Clock,
  Plus,
  Check,
  CheckCircle2,
  TrendingUp,
  Activity,
  Edit2,
  Printer,
  Trash2,
  Camera,
  Upload,
  Download,
  Copy,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Heart,
  Eye,
  Droplets,
  GitFork,
  Award,
  FileDown,
  Compass,
  MapPin,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Animal, ClinicalRecord, AnimalTask, Worker } from '../types';
import {
  calculateAge,
  addClinicalRecord,
  saveTask,
  toggleTaskStatus,
  checkWithdrawalStatus,
  estimateWeightZoomentric,
  getStoredReproductiveEvents,
} from '../lib/storage';
import { CATTLE_PHOTO_PRESETS } from '../data/initialData';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { exportClinicalHistoryPDF } from '../lib/pdfExport';

interface AnimalDetailModalProps {
  animal: Animal | null;
  clinicalRecords: ClinicalRecord[];
  tasks: AnimalTask[];
  workers: Worker[];
  onClose: () => void;
  onUpdateAnimal: (updated: Animal) => void;
  onRefreshData: () => void;
  onEditAnimal?: (animal: Animal) => void;
  onDeleteAnimal?: (animalId: string) => void;
  onOpenMangaForAnimal?: (animal: Animal) => void;
  onOpenBCS?: (animal: Animal) => void;
  onOpenPassport?: (animal: Animal) => void;
  onOpenMapForPaddock?: (paddockId: string) => void;
  onOpenReproduction?: (animal: Animal) => void;
  allAnimals?: Animal[];
  onSelectAnimal?: (animal: Animal) => void;
}

export const AnimalDetailModal: React.FC<AnimalDetailModalProps> = ({
  animal,
  clinicalRecords,
  tasks,
  workers,
  onClose,
  onUpdateAnimal,
  onRefreshData,
  onEditAnimal,
  onDeleteAnimal,
  onOpenMangaForAnimal,
  onOpenBCS,
  onOpenPassport,
  onOpenMapForPaddock,
  onOpenReproduction,
  allAnimals = [],
  onSelectAnimal,
}) => {
  if (!animal) return null;

  const sireAnimal = allAnimals.find((a) => a.id === animal.fatherId);
  const damAnimal = allAnimals.find((a) => a.id === animal.motherId);

  const [activeTab, setActiveTab] = useState<
    'general' | 'clinical' | 'tasks' | 'weights' | 'reproduction' | 'biometrics' | 'passport' | 'qr'
  >('general');

  // New Clinical Record form state
  const [showAddClinical, setShowAddClinical] = useState(false);
  const [medType, setMedType] = useState<ClinicalRecord['type']>('Vacuna');
  const [medDescription, setMedDescription] = useState('');
  const [medName, setMedName] = useState('');
  const [medVet, setMedVet] = useState('Dr. Danilo C.');
  const [medNextDate, setMedNextDate] = useState('');
  const [medCost, setMedCost] = useState('');

  // New Task form state
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<AnimalTask['type']>('Baño');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskWorkerId, setTaskWorkerId] = useState(workers[0]?.id || 'w-1');
  const [taskPriority, setTaskPriority] = useState<AnimalTask['priority']>('media');

  // New Weight Record form state
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0]);

  // Warning note editing state
  const [isEditingWarning, setIsEditingWarning] = useState(false);
  const [warningInput, setWarningInput] = useState(animal.warningNote || '');

  // Photo change state
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // QR Print & Copy state
  const [qrCopied, setQrCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const qrSvgRef = useRef<HTMLDivElement>(null);

  const age = calculateAge(animal.birthDate);
  const qrUrl = `https://controlganaderopro.app/animal/${animal.id}`;

  const handleSaveWarning = () => {
    const updated = { ...animal, warningNote: warningInput.trim() || undefined };
    onUpdateAnimal(updated);
    setIsEditingWarning(false);
  };

  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 900;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          onUpdateAnimal({ ...animal, photoUrl: compressed });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onUpdateAnimal({ ...animal, photoUrl: undefined });
  };

  const handleSelectPresetPhoto = (url: string) => {
    onUpdateAnimal({ ...animal, photoUrl: url });
    setShowPresetGallery(false);
  };

  const handleCreateClinicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medDescription || !medName) return;

    addClinicalRecord({
      animalId: animal.id,
      date: new Date().toISOString().split('T')[0],
      type: medType,
      description: medDescription,
      medication: medName,
      veterinarian: medVet,
      nextDueDate: medNextDate || undefined,
      cost: medCost ? parseFloat(medCost) : undefined,
    });

    setMedDescription('');
    setMedName('');
    setMedNextDate('');
    setMedCost('');
    setShowAddClinical(false);
    onRefreshData();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;

    const assignedWorker = workers.find((w) => w.id === taskWorkerId);

    saveTask({
      id: `task-${Date.now()}`,
      animalId: animal.id,
      title: taskTitle,
      type: taskType,
      dueDate: taskDueDate,
      assignedWorkerId: taskWorkerId,
      assignedWorkerName: assignedWorker ? assignedWorker.name : 'Vaquero',
      priority: taskPriority,
      status: 'pendiente',
    });

    setTaskTitle('');
    setTaskDueDate('');
    setShowAddTask(false);
    onRefreshData();
  };

  const handleToggleTask = (taskId: string) => {
    toggleTaskStatus(taskId);
    onRefreshData();
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(newWeightInput);
    if (isNaN(w) || w <= 0) return;

    const currentHistory = animal.weightHistory || [];
    const updatedHistory = [...currentHistory, { date: newWeightDate, weightKg: w }].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const updated: Animal = {
      ...animal,
      currentWeightKg: w,
      weightHistory: updatedHistory,
    };

    onUpdateAnimal(updated);
    setNewWeightInput('');
    setShowAddWeight(false);
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Arete Tag #${animal.id} - Finca Santa Gertrudis</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; padding: 30px; }
              .tag { width: 360px; background: #facc15; border: 4px solid #ca8a04; border-radius: 24px; padding: 20px; text-align: center; }
              .qr-box { background: #fff; padding: 12px; border-radius: 12px; display: inline-block; margin: 12px 0; }
              .num { font-size: 40px; font-weight: 900; margin: 6px 0; }
            </style>
          </head>
          <body>
            <div class="tag">
              <div style="font-weight:900; font-size:12px; letter-spacing:1px;">FINCA SANTA GERTRUDIS</div>
              <div class="qr-box">${qrSvgRef.current ? qrSvgRef.current.innerHTML : ''}</div>
              <div style="font-size:11px; font-weight:bold;">ARETE OFICIAL TAG</div>
              <div class="num">#${animal.id}</div>
              <div style="font-size:11px; font-weight:bold; border-top:1px solid rgba(0,0,0,0.2); padding-top:6px;">
                Raza: ${animal.breed} | Hierro: ${animal.ironBrand || 'N/A'} | Sexo: ${animal.sex}
              </div>
            </div>
            <script>window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const handleDownloadQRPNG = () => {
    setIsExportingPng(true);
    try {
      const svg = qrSvgRef.current?.querySelector('svg');
      if (!svg) {
        setIsExportingPng(false);
        return;
      }
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const qrImg = new Image();
      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 740;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(0, 0, 600, 740);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(140, 140, 320, 320, 20);
          ctx.fill();

          ctx.drawImage(qrImg, 160, 160, 280, 280);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FINCA SANTA GERTRUDIS', 300, 90);

          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('ARETE OFICIAL / TAG ID', 300, 510);

          ctx.font = '900 68px sans-serif';
          ctx.fillText(`#${animal.id}`, 300, 580);

          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(`Raza: ${animal.breed} | Hierro: ${animal.ironBrand || 'N/A'} | Sexo: ${animal.sex}`, 300, 640);

          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `Arete_TAG_${animal.id}.png`;
          link.href = dataUrl;
          link.click();
        }
        URL.revokeObjectURL(blobURL);
        setIsExportingPng(false);
      };
      qrImg.src = blobURL;
    } catch {
      setIsExportingPng(false);
    }
  };

  const handleCopyQRUrl = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    });
  };

  const clinicalTypeOptions: SelectOption[] = [
    { value: 'Vacuna', label: 'Vacunación / Biológico', badge: 'Inmunización' },
    { value: 'Tratamiento', label: 'Tratamiento Médico', badge: 'Terapéutico' },
    { value: 'Arete', label: 'Aretado / Identificación', badge: 'Trazabilidad' },
    { value: 'Examen', label: 'Palpación / Ecografía', badge: 'Diagnóstico' },
    { value: 'Cirugía', label: 'Intervención Quirúrgica', badge: 'Cirugía' },
    { value: 'Desparasitación', label: 'Desparasitante', badge: 'Control Parasitario' },
  ];

  const taskTypeOptions: SelectOption[] = [
    { value: 'Baño', label: 'Baño Garrapaticida / Aspersión', badge: 'Higiene' },
    { value: 'Pesaje', label: 'Pesaje Mensual de Control', badge: 'Zootecnia' },
    { value: 'Veterinario', label: 'Revisión Médica Zootécnica', badge: 'Salud' },
    { value: 'Alimentación Especial', label: 'Alimentación Especial / Minerales', badge: 'Nutrición' },
    { value: 'Vacunación', label: 'Vacunación Programada', badge: 'Calendario' },
    { value: 'Herrado', label: 'Herrado / Marca a Fuego', badge: 'Identificación' },
    { value: 'Palpación', label: 'Chequeo de Gestación', badge: 'Reproducción' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col"
      >
        {/* Hidden Input for Quick Photo Change */}
        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleQuickPhotoUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-emerald-500/40 flex flex-col items-center justify-center shadow-lg font-mono">
              <span className="text-[9px] font-bold text-slate-400">TAG #</span>
              <span className="text-lg font-extrabold text-white">{animal.id}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {animal.name || `Bovino Tag #${animal.id}`}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    animal.status === 'ACT'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {animal.status === 'ACT' ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Raza: <strong className="text-slate-200">{animal.breed}</strong></span>
                <span>•</span>
                <span>Hierro: <strong className="text-amber-400 font-mono">{animal.ironBrand || 'SIN HERRAR'}</strong></span>
                <span>•</span>
                <span>Propósito: <strong className="text-emerald-400">{animal.purpose}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEditAnimal && (
              <button
                onClick={() => onEditAnimal(animal)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Editar datos de este animal"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}

            {onDeleteAnimal && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all cursor-pointer"
                title="Eliminar animal del registro"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert Bar */}
        {showDeleteConfirm && (
          <div className="p-3 bg-rose-950/90 border-b border-rose-800 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>¿Confirmas eliminar permanentemente el ejemplar Tag #{animal.id} del hato?</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteAnimal?.(animal.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Herdwatch: Active Withdrawal Alert Banner */}
        {(() => {
          const wInfo = checkWithdrawalStatus(animal.withdrawalUntilDate);
          if (wInfo.isWithdrawn) {
            return (
              <div className="p-3 bg-rose-950 border-b border-rose-800 text-xs text-rose-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                  <span>
                    <strong>⛔ ALERTA DE RETIRO SANITARIO ACTIVO:</strong> Restricción por{' '}
                    {animal.withdrawalReason || 'tratamiento médico'}. Vence el {animal.withdrawalUntilDate} ({wInfo.daysRemaining} días restantes). Prohibido ordeño o sacrificio.
                  </span>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Connected Cross-Feature Quick Bar */}
        <div className="px-4 py-2 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Flujo Conectado:
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenMangaForAnimal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMangaForAnimal(animal);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Pesar este animal en la báscula de manga"
              >
                <Scale className="w-3 h-3 text-emerald-400" />
                <span>Báscula Manga</span>
              </button>
            )}

            {onOpenMapForPaddock && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMapForPaddock(animal.paddockId || 'pad-1');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Ver potrero del animal en el mapa interactivo D3"
              >
                <Compass className="w-3 h-3 text-teal-400" />
                <span>Ver en Mapa</span>
              </button>
            )}

            {onOpenBCS && (
              <button
                type="button"
                onClick={() => onOpenBCS(animal)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Evaluar condición corporal con CattleEye"
              >
                <Eye className="w-3 h-3 text-purple-400" />
                <span>CattleEye BCS</span>
              </button>
            )}

            {onOpenPassport && (
              <button
                type="button"
                onClick={() => onOpenPassport(animal)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Ver pasaporte oficial de trazabilidad HerdX"
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span>Pasaporte HerdX</span>
              </button>
            )}

            {onOpenReproduction && (animal.sex === 'F' || animal.purpose === 'REPRODUCTOR' || animal.purpose === 'CRIA') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReproduction(animal);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-500/30 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Abrir módulo de reproducción y fertilidad"
              >
                <Heart className="w-3 h-3 text-pink-400" />
                <span>Reproducción</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                exportClinicalHistoryPDF(clinicalRecords, [animal], {
                  animalId: animal.id,
                })
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Descargar Ficha Técnica y Certificado Clínico en PDF"
            >
              <FileDown className="w-3 h-3 text-emerald-400" />
              <span>Dossier PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto no-scrollbar px-4 pt-2 shrink-0">
          {[
            { id: 'general', label: 'General & Foto', icon: FileText },
            { id: 'clinical', label: 'Historial Clínico', icon: Stethoscope, count: clinicalRecords.length },
            { id: 'tasks', label: 'Pendientes', icon: Calendar, count: tasks.filter((t) => t.status !== 'completado').length },
            { id: 'weights', label: 'Curva & Pesos', icon: Scale },
            { id: 'reproduction', label: 'Reproducción & Linaje', icon: Heart },
            { id: 'biometrics', label: 'BCS & Zoométrica', icon: Eye },
            { id: 'passport', label: 'Pasaporte HerdX', icon: Award },
            { id: 'qr', label: 'Arete QR', icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center space-x-2 px-3.5 py-2.5 text-xs font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: GENERAL & GENEALOGY & PHOTO */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Photo Showcase Section */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:w-56 h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center group">
                  {animal.photoUrl ? (
                    <img
                      src={animal.photoUrl}
                      alt={animal.name || `Animal ${animal.id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                      <Camera className="w-8 h-8 mb-1.5 text-slate-600" />
                      <span className="text-xs font-semibold">Sin Fotografía</span>
                      <span className="text-[10px] text-slate-600">Sube una foto del animal</span>
                    </div>
                  )}

                  {animal.photoUrl && (
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 p-2">
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center space-x-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Cambiar</span>
                      </button>
                      <button
                        onClick={handleRemovePhoto}
                        className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 text-xs w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Identificación Visual del Ejemplar</span>
                    </span>
                    <button
                      onClick={() => setShowPresetGallery(!showPresetGallery)}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{showPresetGallery ? 'Ocultar Galería' : 'Catálogo de Razas'}</span>
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Toma o sube una fotografía del animal con su arete oficial para inspecciones zootécnicas, trazabilidad y control de inventario.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir o Tomar Foto</span>
                    </button>
                    {animal.photoUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Quitar Foto
                      </button>
                    )}
                  </div>

                  {showPresetGallery && (
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-[10px] text-slate-400 mb-1.5 font-bold">Seleccionar foto representativa de raza:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {CATTLE_PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => handleSelectPresetPhoto(preset.url)}
                            className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left transition-all group"
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-12 object-cover rounded mb-1" />
                            <span className="text-[9px] font-bold text-slate-300 truncate block group-hover:text-emerald-400">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning note bar */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    Notas de Seguridad y Advertencia
                  </span>
                  {!isEditingWarning ? (
                    <button
                      onClick={() => setIsEditingWarning(true)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveWarning}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                  )}
                </div>

                {!isEditingWarning ? (
                  <p className="text-slate-300">
                    {animal.warningNote || 'Sin advertencias específicas asociadas a este animal.'}
                  </p>
                ) : (
                  <textarea
                    value={warningInput}
                    onChange={(e) => setWarningInput(e.target.value)}
                    placeholder="Ejemplo: Cuidado, vaca agresiva con vaqueros durante ordeño..."
                    className="w-full mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    rows={2}
                  />
                )}
              </div>

              {/* Exact Age Table Columns */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Edad del Animal (Desglose en Días, Meses y Años)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Días</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{age.days}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Meses</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{age.months}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Años</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{age.years}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nacimiento</span>
                    <span className="text-xs font-semibold text-slate-200 mt-1 block">{animal.birthDate || 'N/D'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sexo</span>
                    <span className="text-xs font-bold text-slate-200 mt-1 block">
                      {animal.sex === 'M' ? 'Macho (M)' : 'Hembra (F)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Marca Hierro</span>
                    <span className="text-xs font-mono font-bold text-amber-400 mt-1 block">{animal.ironBrand || 'SIN HERRAR'}</span>
                  </div>
                </div>
              </div>

              {/* Origin & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    Detalles de Procedencia del Animal
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">¿Comprado en otra finca?</span>
                      <strong className={animal.purchased ? 'text-amber-400' : 'text-slate-200'}>
                        {animal.purchased ? 'SÍ' : 'NO (Nacido en Finca)'}
                      </strong>
                    </div>
                    {animal.purchased && animal.purchaseLocation && (
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400">Lugar / Finca de Origen:</span>
                        <strong className="text-slate-200">{animal.purchaseLocation}</strong>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Dificultad de Parto:</span>
                      <strong className="text-slate-200">
                        {animal.calvingDifficulty === 0 ? '0 (Parto Normal)' : `${animal.calvingDifficulty} (Asistido)`}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Ubicación Actual:</span>
                      <strong className="text-emerald-400">{animal.corralName}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Encargado Asignado:</span>
                      <strong className="text-slate-200">{animal.assignedWorkerName || 'Sin asignar'}</strong>
                    </div>
                  </div>
                </div>

                {/* Parent Pedigree */}
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Genealogía y Línea de Sangre
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Padre (Semental / Sire)</span>
                        <span className="font-bold text-white text-sm font-mono">{animal.fatherId || 'No Registrado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sireAnimal && onSelectAnimal && (
                          <button
                            type="button"
                            onClick={() => onSelectAnimal(sireAnimal)}
                            className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-bold border border-blue-500/30 cursor-pointer transition-all"
                            title={`Ver ficha completa del padre #${sireAnimal.id}`}
                          >
                            Ver Ficha →
                          </button>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">♂ Padre</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Madre (Vaca Matriz / Dam)</span>
                        <span className="font-bold text-white text-sm font-mono">{animal.motherId || 'No Registrada'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {damAnimal && onSelectAnimal && (
                          <button
                            type="button"
                            onClick={() => onSelectAnimal(damAnimal)}
                            className="px-2 py-0.5 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[10px] font-bold border border-pink-500/30 cursor-pointer transition-all"
                            title={`Ver ficha completa de la madre #${damAnimal.id}`}
                          >
                            Ver Ficha →
                          </button>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">♀ Madre</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: CLINICAL RECORDS */}
          {activeTab === 'clinical' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Historial de Intervenciones Médicas & Sanidad
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registro de vacunas, tratamientos y recetas del Dr. Danilo y veterinarios
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportClinicalHistoryPDF(clinicalRecords, [animal], {
                        animalId: animal.id,
                      })
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow transition-all cursor-pointer"
                    title="Descargar Certificado e Historial Clínico en PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar Historial (PDF)</span>
                  </button>
                  <button
                    onClick={() => setShowAddClinical(!showAddClinical)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Atención</span>
                  </button>
                </div>
              </div>

              {/* Form to add medical record */}
              <AnimatePresence>
                {showAddClinical && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateClinicalRecord}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CustomSelect
                        label="Tipo de Intervención"
                        value={medType}
                        onChange={(val) => setMedType(val as any)}
                        options={clinicalTypeOptions}
                      />
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Medicamento o Producto Aplicado *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: YODA CALCIO, Ivermectina 1%"
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Descripción o Diagnóstico Clínico *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Vacunación periódica de complejo vitamínico y desparasitante"
                        value={medDescription}
                        onChange={(e) => setMedDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Veterinario Responsable
                        </label>
                        <input
                          type="text"
                          value={medVet}
                          onChange={(e) => setMedVet(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Próxima Dosis / Refuerzo
                        </label>
                        <input
                          type="date"
                          value={medNextDate}
                          onChange={(e) => setMedNextDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Costo ($ USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="35.00"
                          value={medCost}
                          onChange={(e) => setMedCost(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddClinical(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Guardar Ficha Médica
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Records Timeline List */}
              {clinicalRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-xs text-slate-400">Sin atenciones médicas registradas</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Usa el botón superior para agregar vacunas o chequeos</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clinicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                            {record.type}
                          </span>
                          <span className="text-slate-400 text-[11px]">{record.date}</span>
                        </div>
                        <p className="font-bold text-white text-sm">{record.medication}</p>
                        <p className="text-slate-300 text-xs">{record.description}</p>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                          <span>Médico: <strong>{record.veterinarian}</strong></span>
                          {record.nextDueDate && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">
                                Próxima Dosis: {record.nextDueDate}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {record.cost && (
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Costo</span>
                          <span className="text-sm font-mono font-bold text-emerald-400">
                            ${record.cost.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: TASKS & AGENDA */}
          {activeTab === 'tasks' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Agenda Operativa & Baños Garrapaticidas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tareas asignadas a vaqueros y capataces para este ejemplar
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTask(!showAddTask)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Tarea</span>
                </button>
              </div>

              {/* Add Task Form */}
              <AnimatePresence>
                {showAddTask && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateTask}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
                  >
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Título de la Tarea o Pendiente *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Llevar a baño aspersor con amitraz"
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CustomSelect
                        label="Tipo de Tarea"
                        value={taskType}
                        onChange={(val) => setTaskType(val as any)}
                        options={taskTypeOptions}
                      />
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Fecha Programada *
                        </label>
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                          required
                        />
                      </div>
                      <CustomSelect
                        label="Encargado Asignado"
                        value={taskWorkerId}
                        onChange={(val) => setTaskWorkerId(val)}
                        options={workers.map((w) => ({ value: w.id, label: w.name, badge: w.role }))}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddTask(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Agendar Tarea
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Tasks List */}
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-semibold text-xs text-slate-400">Sin tareas pendientes para este bovino</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            t.status === 'completado'
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-900 border-slate-700 text-transparent hover:border-slate-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <div>
                          <p
                            className={`font-bold ${
                              t.status === 'completado' ? 'line-through text-slate-500' : 'text-white'
                            }`}
                          >
                            {t.title}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Tipo: <strong>{t.type}</strong></span>
                            <span>•</span>
                            <span>Encargado: <strong>{t.assignedWorkerName}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: WEIGHTS & GROWTH */}
          {activeTab === 'weights' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Peso Inicial</span>
                  <span className="text-xl font-bold text-slate-200 mt-1 block">{animal.initialWeightKg} Kg</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Peso Actual</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{animal.currentWeightKg} Kg</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Objetivo / Terminado</span>
                  <span className="text-xl font-bold text-slate-200 mt-1 block">{animal.targetWeightKg || 'N/A'} Kg</span>
                </div>
              </div>

              {/* Add New Weight Button & Inline Form */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Evolución Histórica del Peso (Curva de Crecimiento)
                </h3>
                <button
                  onClick={() => setShowAddWeight(!showAddWeight)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Pesaje</span>
                </button>
              </div>

              <AnimatePresence>
                {showAddWeight && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddWeight}
                    className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Nuevo Peso (Kg) *
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder="Ej: 520"
                          value={newWeightInput}
                          onChange={(e) => setNewWeightInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Fecha de Pesaje *
                        </label>
                        <input
                          type="date"
                          value={newWeightDate}
                          onChange={(e) => setNewWeightDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddWeight(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Guardar Pesaje
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Weight chart */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={
                        animal.weightHistory && animal.weightHistory.length > 0
                          ? animal.weightHistory
                          : [{ date: 'Inicio', weightKg: animal.initialWeightKg }, { date: 'Actual', weightKg: animal.currentWeightKg }]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 20', 'dataMax + 20']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      />
                      <Line type="monotone" dataKey="weightKg" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: REPRODUCCIÓN & GENEALOGÍA (CattleMax & Control Ganadero) */}
          {activeTab === 'reproduction' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Reproduction Status Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <h4 className="font-bold text-white text-sm">Estado Reproductivo & Fertilidad</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {animal.reproductiveStatus || 'Sin Asignar'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Último Servicio</span>
                    <span className="font-semibold text-slate-200">{animal.lastServiceDate || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Toro / Pajuela</span>
                    <span className="font-semibold text-amber-300 font-mono truncate block">
                      {animal.serviceBullTagOrName || 'Monta Natural'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Parto Previsto (283d)</span>
                    <span className="font-bold text-emerald-400 font-mono block">
                      {animal.expectedCalvingDate || 'No gestante'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Partos Totales</span>
                    <span className="font-semibold text-slate-200">{animal.totalCalvingsCount || 0} partos</span>
                  </div>
                </div>

                {animal.expectedCalvingDate && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                    <span>
                      📅 <strong>Gestación Activa:</strong> Fecha estimada de parto {animal.expectedCalvingDate}. Programar secado 60 días antes.
                    </span>
                  </div>
                )}
              </div>

              {/* Pedigree Tree (3 Generations) */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <GitFork className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">Árbol Genealógico / Pedigree (3 Generaciones)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Rama Paterna */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-blue-500/30 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">Línea Paterna ♂</span>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Padre: {animal.fatherId || 'Semental #1'}</span>
                      {sireAnimal && onSelectAnimal && (
                        <button
                          type="button"
                          onClick={() => onSelectAnimal(sireAnimal)}
                          className="text-[10px] text-blue-300 hover:text-blue-200 underline font-bold cursor-pointer"
                        >
                          Ver Ficha →
                        </button>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div>Abuelo Paterno: <strong className="text-slate-300">{animal.paternalGrandfather || 'Toro Pardo Suizo #1'}</strong></div>
                      <div>Abuela Paterna: <strong className="text-slate-300">{animal.paternalGrandmother || 'Vaca Matriz #08'}</strong></div>
                    </div>
                  </div>

                  {/* Rama Materna */}
                  <div className="p-4 bg-slate-900 rounded-xl border border-pink-500/30 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-pink-400 block">Línea Materna ♀</span>
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Madre: {animal.motherId || 'Vaca #2'}</span>
                      {damAnimal && onSelectAnimal && (
                        <button
                          type="button"
                          onClick={() => onSelectAnimal(damAnimal)}
                          className="text-[10px] text-pink-300 hover:text-pink-200 underline font-bold cursor-pointer"
                        >
                          Ver Ficha →
                        </button>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div>Abuelo Materno: <strong className="text-slate-300">{animal.maternalGrandfather || 'Semental Brahman #01'}</strong></div>
                      <div>Abuela Materna: <strong className="text-slate-300">{animal.maternalGrandmother || 'Matriarca Leche #05'}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: BIOMÉTRICA & BCS (CattleEye) */}
          {activeTab === 'biometrics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <h4 className="font-bold text-white text-sm">Puntuación de Condición Corporal (BCS 1.0 - 5.0)</h4>
                  </div>
                  <span className="text-lg font-black text-cyan-300 font-mono">
                    BCS {animal.bodyConditionScore?.toFixed(2) || '3.00'}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  La Condición Corporal (BCS) evalúa la reserva energética y grasa subcutánea. Este animal se encuentra en rango{' '}
                  <strong className="text-cyan-400 font-bold">
                    {(animal.bodyConditionScore || 3) >= 3.0 ? 'Óptimo para producción' : 'Moderado'}
                  </strong>.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Perímetro Torácico</span>
                    <span className="text-base font-bold text-white font-mono">{animal.chestGirthCm || 205} cm</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Largo Corporal</span>
                    <span className="text-base font-bold text-white font-mono">{animal.bodyLengthCm || 155} cm</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Peso Zoométrico Est.</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      ~{estimateWeightZoomentric(animal.chestGirthCm || 205, animal.bodyLengthCm || 155)} Kg
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: PASAPORTE HERDX */}
          {activeTab === 'passport' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="p-6 bg-white text-slate-950 rounded-2xl border-4 border-emerald-800 space-y-4 shadow-xl">
                <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-800" />
                      <h4 className="font-black text-lg text-emerald-950 uppercase">Certificado HerdX de Trazabilidad</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                      TAG #{animal.id} • Predio Libre de Aftosa y Brucelosis
                    </span>
                  </div>
                  <div className="p-1 bg-slate-100 rounded-lg">
                    <QRCodeSVG value={qrUrl} size={65} level="H" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Raza</span>
                    <span className="font-bold text-slate-900">{animal.breed}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Hierro</span>
                    <span className="font-bold text-amber-800 font-mono">{animal.ironBrand || 'TG'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Peso Actual</span>
                    <span className="font-bold text-emerald-800 font-mono">{animal.currentWeightKg} Kg</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    <strong>Inocuidad Garantizada:</strong> Historial sanitario validado sin residuos antibióticos en período de carencia.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: QR CODE & PRINT */}
          {activeTab === 'qr' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4"
            >
              <div
                ref={qrSvgRef}
                className="p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-400"
              >
                <QRCodeSVG
                  value={qrUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div>
                <p className="text-base font-black text-white">ARETE OFICIAL TAG #{animal.id}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escanee este código desde la app o cualquier teléfono móvil para abrir la hoja de vida zootécnica
                </p>
                <p className="text-[11px] font-mono text-emerald-400 mt-1">{qrUrl}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrintQR}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Arete</span>
                </button>

                <button
                  onClick={handleDownloadQRPNG}
                  disabled={isExportingPng}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-950/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPng ? 'Generando...' : 'Descargar PNG'}</span>
                </button>

                <button
                  onClick={handleCopyQRUrl}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  {qrCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
