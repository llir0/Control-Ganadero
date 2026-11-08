import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Save,
  Tag,
  AlertTriangle,
  Heart,
  Flame,
  Milk,
  Crown,
  MapPin,
  User,
  ShieldCheck,
  Calendar,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Check,
} from 'lucide-react';
import { Animal, Corral, Worker } from '../types';
import { CATTLE_PHOTO_PRESETS } from '../data/initialData';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { SegmentedPicker, SegmentOption } from './ui/SegmentedPicker';

interface AddEditAnimalModalProps {
  initialAnimal?: Animal | null;
  corrals: Corral[];
  workers: Worker[];
  existingAnimals: Animal[];
  onSave: (animal: Animal) => void;
  onClose: () => void;
}

const PURPOSE_OPTIONS: SelectOption[] = [
  {
    value: 'CRIA',
    label: 'CRÍA',
    description: 'Reproducción y cría de becerros',
    icon: <Heart className="w-4 h-4 text-rose-400" />,
    badge: 'Cría',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
  },
  {
    value: 'CEBA',
    label: 'CEBA',
    description: 'Engorda intensiva para carne',
    icon: <Flame className="w-4 h-4 text-amber-400" />,
    badge: 'Engorda',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  },
  {
    value: 'LECHE',
    label: 'LECHE',
    description: 'Producción láctea y ordeño diario',
    icon: <Milk className="w-4 h-4 text-cyan-400" />,
    badge: 'Lácteo',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  },
  {
    value: 'REPRODUCTOR',
    label: 'REPRODUCTOR',
    description: 'Semental o toro reproductor élite',
    icon: <Crown className="w-4 h-4 text-purple-400" />,
    badge: 'Semental',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  },
];

const STATUS_OPTIONS: SegmentOption<Animal['status']>[] = [
  {
    value: 'ACT',
    label: 'ACTIVO EN FINCA',
    icon: <ShieldCheck className="w-4 h-4" />,
    activeColor: 'emerald',
  },
  {
    value: 'IAC',
    label: 'INACTIVO / VENTA / BAJA',
    icon: <AlertTriangle className="w-4 h-4" />,
    activeColor: 'rose',
  },
];

const SEX_OPTIONS: SegmentOption<Animal['sex']>[] = [
  {
    value: 'F',
    label: 'Hembra (♀)',
    activeColor: 'rose',
  },
  {
    value: 'M',
    label: 'Macho (♂)',
    activeColor: 'blue',
  },
];

export const AddEditAnimalModal: React.FC<AddEditAnimalModalProps> = ({
  initialAnimal,
  corrals,
  workers,
  existingAnimals,
  onSave,
  onClose,
}) => {
  const [tagId, setTagId] = useState(initialAnimal?.id || '');
  const [name, setName] = useState(initialAnimal?.name || '');
  const [status, setStatus] = useState<Animal['status']>(initialAnimal?.status || 'ACT');
  const [sex, setSex] = useState<Animal['sex']>(initialAnimal?.sex || 'F');
  const [purpose, setPurpose] = useState<Animal['purpose']>(initialAnimal?.purpose || 'CRIA');
  const [breed, setBreed] = useState(initialAnimal?.breed || 'Brahman Blanco');
  const [birthDate, setBirthDate] = useState(initialAnimal?.birthDate || '2024-01-01');
  const [corralId, setCorralId] = useState(initialAnimal?.corralId || corrals[0]?.id || 'corral-1');
  const [ironBrand, setIronBrand] = useState(initialAnimal?.ironBrand || 'TG');
  const [purchased, setPurchased] = useState(initialAnimal?.purchased || false);
  const [purchaseLocation, setPurchaseLocation] = useState(initialAnimal?.purchaseLocation || '');
  const [purchaseCost, setPurchaseCost] = useState(initialAnimal?.purchaseCost?.toString() || '');
  const [calvingDifficulty, setCalvingDifficulty] = useState(initialAnimal?.calvingDifficulty?.toString() || '0');
  const [fatherId, setFatherId] = useState(initialAnimal?.fatherId || '');
  const [motherId, setMotherId] = useState(initialAnimal?.motherId || '');
  const [initialWeight, setInitialWeight] = useState(initialAnimal?.initialWeightKg?.toString() || '200');
  const [currentWeight, setCurrentWeight] = useState(initialAnimal?.currentWeightKg?.toString() || '450');
  const [warningNote, setWarningNote] = useState(initialAnimal?.warningNote || '');
  const [assignedWorkerId, setAssignedWorkerId] = useState(initialAnimal?.assignedWorkerId || workers[0]?.id || 'w-1');
  const [photoUrl, setPhotoUrl] = useState<string>(initialAnimal?.photoUrl || '');
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setPhotoUrl(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const corralOptions: SelectOption[] = corrals.map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    description: `${c.location} • Propósito: ${c.purpose}`,
    icon: <MapPin className="w-4 h-4 text-emerald-400" />,
    badge: `${c.capacity} cab`,
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
  }));

  const workerOptions: SelectOption[] = workers.map((w) => ({
    value: w.id,
    label: w.name,
    description: `${w.role} • Turno ${w.shift}`,
    icon: <User className="w-4 h-4 text-emerald-400" />,
    badge: w.role,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagId) return;

    const selectedCorral = corrals.find((c) => c.id === corralId);
    const selectedWorker = workers.find((w) => w.id === assignedWorkerId);

    const updatedAnimal: Animal = {
      id: tagId.trim(),
      name: name.trim() || undefined,
      status,
      sex,
      purpose,
      breed,
      birthDate,
      corralId,
      corralName: selectedCorral ? selectedCorral.name : 'Corral Principal',
      ironBrand: ironBrand.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      purchased,
      purchaseLocation: purchased ? purchaseLocation : undefined,
      purchaseCost: purchased && purchaseCost ? parseFloat(purchaseCost) : undefined,
      calvingDifficulty: parseInt(calvingDifficulty, 10) || 0,
      fatherId: fatherId || undefined,
      motherId: motherId || undefined,
      initialWeightKg: parseFloat(initialWeight) || 100,
      currentWeightKg: parseFloat(currentWeight) || 300,
      weightHistory: initialAnimal?.weightHistory || [
        { date: new Date().toISOString().split('T')[0], weightKg: parseFloat(currentWeight) || 300 },
      ],
      warningNote: warningNote.trim() || undefined,
      assignedWorkerId,
      assignedWorkerName: selectedWorker ? selectedWorker.name : 'Vaquero Principal',
      createdAt: initialAnimal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedAnimal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 space-y-4 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {initialAnimal ? `Editar Animal Arete #${initialAnimal.id}` : 'Registrar Nuevo Animal'}
              </h3>
              <p className="text-[11px] text-slate-400">Ficha técnica y zootécnica de bovino</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar">
          {/* Estatus Segmented */}
          <SegmentedPicker
            label="Estado del Ejemplar"
            value={status}
            onChange={(val) => setStatus(val)}
            options={STATUS_OPTIONS}
          />

          {/* Fotografía del Bovino */}
          <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  Fotografía del Ejemplar
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetGallery(!showPresetGallery)}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{showPresetGallery ? 'Ocultar Catálogo' : 'Galería de Razas'}</span>
              </button>
            </div>

            {/* Hidden native file input for camera/gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 aspect-video max-h-48 w-full flex items-center justify-center">
                <img
                  src={photoUrl}
                  alt="Foto del animal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all flex items-end justify-between p-3">
                  <div className="flex items-center space-x-1.5 text-white text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Foto Asignada</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-md transition-all"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1 shadow-md transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white flex flex-col items-center justify-center space-y-1 transition-all group cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs">Subir o Tomar Foto</span>
                  <span className="text-[10px] text-slate-500">Cámara o Galería del Celular</span>
                </button>

                <div className="w-full sm:w-1/2 space-y-2">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="O pegar URL de imagen web..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPresetGallery(true)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seleccionar foto representativa</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presets Gallery Collapsible */}
            {showPresetGallery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-slate-800/80"
              >
                <p className="text-[10px] font-semibold text-slate-400 mb-2">
                  Fotos de razas bovinas pre-configuradas (clic para seleccionar):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATTLE_PHOTO_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setPhotoUrl(preset.url);
                        setShowPresetGallery(false);
                      }}
                      className={`relative group rounded-xl overflow-hidden border p-1 text-left transition-all ${
                        photoUrl === preset.url
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-16 object-cover rounded-lg mb-1"
                      />
                      <p className="text-[10px] font-bold text-slate-200 truncate group-hover:text-emerald-400">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* General Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Número de Arete (NO. ANIMAL) *
              </label>
              <input
                type="text"
                placeholder="Ej: 18, 502, 104"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                readOnly={!!initialAnimal}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Nombre / Alias Opcional
              </label>
              <input
                type="text"
                placeholder="Ej: La Suiza, Mariposa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SegmentedPicker
              label="Sexo"
              value={sex}
              onChange={(val) => setSex(val)}
              options={SEX_OPTIONS}
            />

            <CustomSelect
              label="Propósito Zootécnico"
              value={purpose}
              onChange={(val) => setPurpose(val as any)}
              options={PURPOSE_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Raza
              </label>
              <input
                type="text"
                placeholder="Ej: Brahman Blanco, Gyr, Suizo"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Marca de Hierro
              </label>
              <input
                type="text"
                placeholder="Ej: TG, JAG, MELI"
                value={ironBrand}
                onChange={(e) => setIronBrand(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect
              label="Corral / Potrero"
              value={corralId}
              onChange={(val) => setCorralId(val)}
              options={corralOptions}
            />

            <CustomSelect
              label="Encargado Asignado"
              value={assignedWorkerId}
              onChange={(val) => setAssignedWorkerId(val)}
              options={workerOptions}
            />
          </div>

          {/* Pedigree Sires */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Genealogía y Padres
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Padre (Sire Tag / Nombre)</label>
                <input
                  type="text"
                  placeholder="Ej: 6 - Toro Blanco de Cría"
                  value={fatherId}
                  onChange={(e) => setFatherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Madre (Dam Tag / Nombre)</label>
                <input
                  type="text"
                  placeholder="Ej: 12 - Vaca Chocolate Suiza"
                  value={motherId}
                  onChange={(e) => setMotherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Weights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Peso Inicial (Kg)
              </label>
              <input
                type="number"
                value={initialWeight}
                onChange={(e) => setInitialWeight(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Peso Actual (Kg)
              </label>
              <input
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Special Warning Note */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
              Nota de Advertencia Especial (Si aplica)
            </label>
            <input
              type="text"
              placeholder="Ej: ⚠️ Cuidado: Vaca agresiva con el ordeñador / Matriz resentida"
              value={warningNote}
              onChange={(e) => setWarningNote(e.target.value)}
              className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-amber-500/40 text-amber-200 placeholder-amber-500/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{initialAnimal ? 'Guardar Cambios' : 'Registrar Animal'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

