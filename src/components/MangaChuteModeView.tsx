import React, { useState, useMemo } from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Syringe,
  AlertTriangle,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  Eye,
  Award,
  FileDown,
  MapPin,
  ArrowRightLeft,
  Heart,
} from 'lucide-react';
import { Animal, Corral, PasturePaddock } from '../types';
import {
  performFastWeighing,
  calculateADGGramsPerDay,
  checkWithdrawalStatus,
  getStoredPastures,
} from '../lib/storage';
import { exportClinicalHistoryPDF } from '../lib/pdfExport';

interface MangaChuteModeViewProps {
  animals: Animal[];
  corrals: Corral[];
  onRefreshData: () => void;
  onOpenDetail: (animal: Animal) => void;
  onOpenBatchTreatment: () => void;
  onOpenBCS?: (animal: Animal) => void;
  onOpenPassport?: (animal: Animal) => void;
  onOpenMapAtPaddock?: (paddockId: string) => void;
  initialCorralId?: string;
  initialPaddockId?: string;
}

export const MangaChuteModeView: React.FC<MangaChuteModeViewProps> = ({
  animals,
  corrals,
  onRefreshData,
  onOpenDetail,
  onOpenBatchTreatment,
  onOpenBCS,
  onOpenPassport,
  onOpenMapAtPaddock,
  initialCorralId,
  initialPaddockId,
}) => {
  const pastures = useMemo<PasturePaddock[]>(() => getStoredPastures(), [animals]);
  const [selectedCorralId, setSelectedCorralId] = useState<string>(initialCorralId || 'all');
  const [selectedPaddockId, setSelectedPaddockId] = useState<string>(initialPaddockId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Weighing inputs
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [applyVaccine, setApplyVaccine] = useState(false);
  const [vaccineName, setVaccineName] = useState('Complejo Vitamínico ADE');
  const [applyDewormer, setApplyDewormer] = useState(false);
  const [dewormerName, setDewormerName] = useState('Ivermectina 3.15% (28d retiro)');
  const [targetCorralId, setTargetCorralId] = useState<string>('');
  const [targetPaddockId, setTargetPaddockId] = useState<string>('');
  const [inChuteBCS, setInChuteBCS] = useState<number | null>(null);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);

  // Filtered animals list
  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      if (a.status !== 'ACT') return false;
      const matchesCorral = selectedCorralId === 'all' || a.corralId === selectedCorralId;
      const matchesPaddock = selectedPaddockId === 'all' || a.paddockId === selectedPaddockId;
      const matchesSearch =
        !searchQuery.trim() ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.name && a.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        a.breed.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCorral && matchesPaddock && matchesSearch;
    });
  }, [animals, selectedCorralId, selectedPaddockId, searchQuery]);

  const currentAnimal: Animal | undefined = filteredAnimals[currentIndex];

  // Set default in-chute BCS whenever current animal changes
  React.useEffect(() => {
    if (currentAnimal?.bodyConditionScore) {
      setInChuteBCS(currentAnimal.bodyConditionScore);
    } else {
      setInChuteBCS(null);
    }
  }, [currentAnimal?.id]);

  // Weight prediction / GDP preview
  const weightCalc = useMemo(() => {
    if (!currentAnimal) return null;
    const prevWeight = currentAnimal.currentWeightKg;
    const lastWeightObj = currentAnimal.weightHistory[currentAnimal.weightHistory.length - 1];
    const prevDate = lastWeightObj?.date || currentAnimal.birthDate;

    const enteredWeight = parseFloat(newWeightInput);
    if (!enteredWeight || isNaN(enteredWeight)) {
      return {
        prevWeight,
        prevDate,
        diffKg: 0,
        adgGrams: currentAnimal.lastAdgGramsPerDay || 0,
        isValid: false,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const { adgGrams, days, totalGainKg } = calculateADGGramsPerDay(
      prevWeight,
      prevDate,
      enteredWeight,
      todayStr
    );

    return {
      prevWeight,
      prevDate,
      diffKg: totalGainKg,
      adgGrams,
      days,
      isValid: true,
    };
  }, [currentAnimal, newWeightInput]);

  // Handle saving and next animal
  const handleSaveAndNext = () => {
    if (!currentAnimal) return;
    const enteredWeight = parseFloat(newWeightInput);
    if (!enteredWeight || isNaN(enteredWeight) || enteredWeight <= 0) {
      alert('Por favor introduce un peso válido en Kilogramos.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const destCorral = corrals.find((c) => c.id === targetCorralId);
    const destPaddock = pastures.find((p) => p.id === targetPaddockId);

    const { adgGrams } = performFastWeighing(
      currentAnimal.id,
      enteredWeight,
      todayStr,
      'Operador Báscula Manga',
      {
        vaccine: applyVaccine ? { name: vaccineName, cost: 12 } : undefined,
        dewormer: applyDewormer ? { name: dewormerName, cost: 15, withdrawalDays: 28 } : undefined,
        destinationCorral: destCorral ? { id: destCorral.id, name: destCorral.name } : undefined,
        destinationPaddock: destPaddock ? { id: destPaddock.id, name: destPaddock.name } : undefined,
        bodyConditionScore: inChuteBCS !== null ? inChuteBCS : undefined,
      }
    );

    const actionsText: string[] = [`${enteredWeight} Kg (${adgGrams >= 0 ? '+' : ''}${adgGrams} g/d)`];
    if (applyVaccine) actionsText.push(`Vacuna: ${vaccineName}`);
    if (applyDewormer) actionsText.push(`Desparasitante: 28d retiro`);
    if (destCorral) actionsText.push(`Apartado a ${destCorral.name}`);
    if (destPaddock) actionsText.push(`Potrero ${destPaddock.name}`);

    setLastSavedMessage(
      `✅ Animal #${currentAnimal.id} registrado: ${actionsText.join(' • ')}`
    );

    onRefreshData();
    setNewWeightInput('');
    setApplyVaccine(false);
    setApplyDewormer(false);
    setTargetCorralId('');
    setTargetPaddockId('');

    // Auto advance to next animal
    if (currentIndex < filteredAnimals.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    setTimeout(() => {
      setLastSavedMessage(null);
    }, 4500);
  };

  const handleNextAnimal = () => {
    if (currentIndex < filteredAnimals.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setNewWeightInput('');
    }
  };

  const handlePrevAnimal = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setNewWeightInput('');
    }
  };

  // Withdrawal status of current animal
  const withdrawalInfo = currentAnimal ? checkWithdrawalStatus(currentAnimal.withdrawalUntilDate) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Explanation */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Jetbov & Herdwatch Chute Operations
              </span>
              <span className="text-xs text-slate-400">Modo Pesaje y Manejo Integral en Manga</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Báscula, Sanidad y Apartado Continuo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Pesaje ágil a pie de manga con cálculo en tiempo real de{' '}
              <strong className="text-emerald-300 font-semibold">Ganancia Diaria (GDP)</strong>, registro de sanidad, condición corporal (BCS) y clasificación automática a corrales o potreros.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenBatchTreatment}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <Syringe className="w-4 h-4 text-amber-400" />
              Tratamiento Colectivo por Lote
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Corral filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Corral:</span>
            <select
              value={selectedCorralId}
              onChange={(e) => {
                setSelectedCorralId(e.target.value);
                setCurrentIndex(0);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Todos los Corrales</option>
              {corrals.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Pasture Paddock filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Potrero (Mapa):</span>
            <select
              value={selectedPaddockId}
              onChange={(e) => {
                setSelectedPaddockId(e.target.value);
                setCurrentIndex(0);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Todos los Potreros</option>
              {pastures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar Tag #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Carousel / Stepper buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-xs font-mono font-bold text-slate-400">
            {filteredAnimals.length > 0 ? currentIndex + 1 : 0} de {filteredAnimals.length} en Manga
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevAnimal}
              disabled={currentIndex <= 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
              title="Animal Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextAnimal}
              disabled={currentIndex >= filteredAnimals.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer"
              title="Siguiente Animal"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Success notification banner */}
      {lastSavedMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{lastSavedMessage}</span>
          <span className="text-[10px] text-emerald-400 uppercase font-mono">Actualizado</span>
        </div>
      )}

      {/* Active Chute Animal Station */}
      {currentAnimal ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Animal Identity, Status & Connected Workflows */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/40 flex flex-col items-center justify-center font-mono shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400">TAG</span>
                    <span className="text-xl font-black text-white">{currentAnimal.id}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {currentAnimal.name || `Animal #${currentAnimal.id}`}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                        {currentAnimal.sex === 'M' ? '♂ Macho' : '♀ Hembra'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentAnimal.breed} • {currentAnimal.purpose}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700">
                  {currentAnimal.corralName}
                </span>
              </div>

              {/* Location & Paddock Mapping Badge */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Potrero actual: <strong className="text-slate-200">{currentAnimal.paddockName || 'Potrero 1 - Roble'}</strong>
                </span>
                {onOpenMapAtPaddock && (
                  <button
                    onClick={() => onOpenMapAtPaddock(currentAnimal.paddockId || 'pad-1')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    Ver en Mapa D3 →
                  </button>
                )}
              </div>

              {/* Withdrawal Warning */}
              {withdrawalInfo?.isWithdrawn && (
                <div className="mt-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>ALERTA DE RETIRO SANITARIO</span>
                  </div>
                  <span>
                    Restricción por {currentAnimal.withdrawalReason || 'tratamiento'}. Quedan{' '}
                    <strong>{withdrawalInfo.daysRemaining} días</strong> hasta el{' '}
                    {currentAnimal.withdrawalUntilDate}. No comercializar leche ni carne.
                  </span>
                </div>
              )}

              {/* Historical Weight Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Último Peso Registrado</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-white">{currentAnimal.currentWeightKg}</span>
                    <span className="text-xs text-slate-400 font-semibold">Kg</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {currentAnimal.weightHistory[currentAnimal.weightHistory.length - 1]?.date || 'Al nacer'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peso Objetivo / Meta</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-emerald-400">
                      {currentAnimal.targetWeightKg || Math.round(currentAnimal.currentWeightKg * 1.15)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">Kg</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Faltan ~{Math.max(0, (currentAnimal.targetWeightKg || Math.round(currentAnimal.currentWeightKg * 1.15)) - currentAnimal.currentWeightKg)} Kg
                  </span>
                </div>
              </div>

              {/* Previous ADG */}
              {currentAnimal.lastAdgGramsPerDay !== undefined && (
                <div className="mt-3 flex items-center justify-between text-xs px-3 py-2 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-400">Última GDP registrada:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      currentAnimal.lastAdgGramsPerDay >= 800
                        ? 'text-emerald-400'
                        : currentAnimal.lastAdgGramsPerDay >= 400
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currentAnimal.lastAdgGramsPerDay >= 0 ? '+' : ''}
                    {currentAnimal.lastAdgGramsPerDay} g/día
                  </span>
                </div>
              )}

              {/* Connected Action Buttons Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                {onOpenBCS && (
                  <button
                    onClick={() => onOpenBCS(currentAnimal)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-purple-500/20 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>CattleEye BCS</span>
                  </button>
                )}

                {onOpenPassport && (
                  <button
                    onClick={() => onOpenPassport(currentAnimal)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-amber-500/20 transition-all cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pasaporte HerdX</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    exportClinicalHistoryPDF([], [currentAnimal], {
                      animalId: currentAnimal.id,
                    })
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-cyan-500/20 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dossier PDF</span>
                </button>

                <button
                  onClick={() => onOpenDetail(currentAnimal)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ficha Completa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Scale Entry, Live Jetbov Calculation, In-Chute Sanity & Sorting */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-base">Lectura Actual de Báscula</h4>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Hoy: {new Date().toLocaleDateString('es-MX')}
                </span>
              </div>

              {/* Big Weighing Input Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ingresar Peso de la Báscula (Kilogramos)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    autoFocus
                    placeholder="Ej. 655"
                    value={newWeightInput}
                    onChange={(e) => setNewWeightInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveAndNext();
                      }
                    }}
                    className="w-full bg-slate-950 border-2 border-emerald-500/60 rounded-2xl px-5 py-3 text-3xl sm:text-4xl font-black text-white focus:outline-none focus:border-emerald-400 shadow-inner font-mono text-center tracking-wider"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    KG
                  </span>
                </div>
              </div>

              {/* Real-time GDP calculation preview (Jetbov engine) */}
              {weightCalc?.isValid && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Análisis Zootécnico Inmediato (Jetbov GDP)
                    </span>
                    <span className="text-xs text-slate-400">
                      En {weightCalc.days} días desde último pesaje
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Ganancia Total</span>
                      <span
                        className={`text-base font-bold ${
                          weightCalc.diffKg >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {weightCalc.diffKg >= 0 ? `+${weightCalc.diffKg}` : weightCalc.diffKg} Kg
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">GDP (Gramos/Día)</span>
                      <span
                        className={`text-base font-black font-mono flex items-center justify-center gap-1 ${
                          weightCalc.adgGrams >= 800
                            ? 'text-emerald-400'
                            : weightCalc.adgGrams >= 500
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {weightCalc.adgGrams >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {weightCalc.adgGrams > 0 ? `+${weightCalc.adgGrams}` : weightCalc.adgGrams} g
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Evaluación</span>
                      <span
                        className={`text-xs font-bold block mt-0.5 ${
                          weightCalc.adgGrams >= 900
                            ? 'text-emerald-400'
                            : weightCalc.adgGrams >= 600
                            ? 'text-emerald-300'
                            : weightCalc.adgGrams >= 300
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {weightCalc.adgGrams >= 900
                          ? '🌟 Excelente'
                          : weightCalc.adgGrams >= 600
                          ? '✅ Muy Bueno'
                          : weightCalc.adgGrams >= 300
                          ? '⚠️ Regular'
                          : '⛔ Pérdida'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Chute BCS Quick Evaluation */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    Condición Corporal en Manga (BCS 1-5):
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    {inChuteBCS !== null ? `BCS ${inChuteBCS.toFixed(1)}` : 'Sin asignar'}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[2.0, 2.5, 3.0, 3.5, 4.0, 4.5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setInChuteBCS(score)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        inChuteBCS === score
                          ? 'bg-purple-600 text-white border-purple-400 shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-purple-500'
                      }`}
                    >
                      {score.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* In-Chute Simultaneous Treatments (Herdwatch style) */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Tratamientos Sanitarios Simultáneos:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                      <input
                        type="checkbox"
                        checked={applyVaccine}
                        onChange={(e) => setApplyVaccine(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Aplicar Vacuna / Vitamina</span>
                    </label>
                    {applyVaccine && (
                      <input
                        type="text"
                        value={vaccineName}
                        onChange={(e) => setVaccineName(e.target.value)}
                        placeholder="Nombre de vacuna"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    )}
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-200">
                      <input
                        type="checkbox"
                        checked={applyDewormer}
                        onChange={(e) => setApplyDewormer(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Aplicar Desparasitante</span>
                    </label>
                    {applyDewormer && (
                      <input
                        type="text"
                        value={dewormerName}
                        onChange={(e) => setDewormerName(e.target.value)}
                        placeholder="Nombre desparasitante"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Sorting Gate / Apartado (Destino de Corral o Potrero) */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
                  Puerta de Apartado y Clasificación (Destino):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Mover a Corral:</label>
                    <select
                      value={targetCorralId}
                      onChange={(e) => setTargetCorralId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">Mantener corral actual ({currentAnimal.corralName})</option>
                      {corrals.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Mover a Potrero:</label>
                    <select
                      value={targetPaddockId}
                      onChange={(e) => setTargetPaddockId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">Mantener potrero actual ({currentAnimal.paddockName || 'Sin asignar'})</option>
                      {pastures.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleSaveAndNext}
                disabled={!newWeightInput}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Check className="w-5 h-5" />
                Guardar Peso, Tratamiento y Avanzar (Enter)
              </button>

              <button
                onClick={handleNextAnimal}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                Saltar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">No hay animales seleccionados para la manga</h4>
          <p className="text-xs text-slate-400 mt-1">
            Modifica los filtros de corral o la búsqueda para cargar animales en la báscula.
          </p>
        </div>
      )}
    </div>
  );
};
