import React, { useState, useMemo } from 'react';
import {
  Compass,
  Sprout,
  Calendar,
  Layers,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Droplets,
  ShieldAlert,
  PlusCircle,
  Calculator,
  RefreshCw,
  Map,
  LayoutGrid,
  Scale,
  Syringe,
} from 'lucide-react';
import { PasturePaddock, Animal } from '../types';
import {
  getStoredPastures,
  saveStoredPasture,
  rotatePastureBatch,
} from '../lib/storage';
import { FarmMapD3View } from './FarmMapD3View';

interface PastureRotationViewProps {
  animals: Animal[];
  onRefreshData: () => void;
  onOpenAnimalDetail?: (animal: Animal) => void;
  onOpenMangaForPaddock?: (paddockId: string) => void;
  onOpenBatchTreatment?: (paddockId: string) => void;
  onOpenMap?: () => void;
}

export const PastureRotationView: React.FC<PastureRotationViewProps> = ({
  animals,
  onRefreshData,
  onOpenAnimalDetail,
  onOpenMangaForPaddock,
  onOpenBatchTreatment,
  onOpenMap,
}) => {
  const [pastures, setPastures] = useState<PasturePaddock[]>(getStoredPastures());
  const [displayView, setDisplayView] = useState<'cards' | 'map'>('cards');
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAforoCalcOpen, setIsAforoCalcOpen] = useState(false);

  // Rotation modal state
  const [sourcePaddockId, setSourcePaddockId] = useState('');
  const [targetPaddockId, setTargetPaddockId] = useState('');
  const [batchNameToMove, setBatchNameToMove] = useState('Lote Ceba 2026-01');

  // Aforo calculator interactive state
  const [aforoGramsPerM2, setAforoGramsPerM2] = useState<number>(2800); // 2.8 kg/m²
  const [aforoDryMatterPct, setAforoDryMatterPct] = useState<number>(22);
  const [aforoHectares, setAforoHectares] = useState<number>(5.0);
  const [aforoAnimalCount, setAforoAnimalCount] = useState<number>(20);
  const [aforoAvgAnimalWeightKg, setAforoAvgAnimalWeightKg] = useState<number>(500);

  // Sync pastures
  const refreshLocal = () => {
    setPastures(getStoredPastures());
    onRefreshData();
  };

  // Stats
  const totalHectares = pastures.reduce((acc, p) => acc + p.areaHectares, 0);
  const occupiedCount = pastures.filter((p) => p.status === 'Ocupado').length;
  const readyCount = pastures.filter((p) => p.status === 'Listo para Pastoreo').length;
  const restingCount = pastures.filter((p) => p.status === 'En Descanso').length;

  // Active cattle total weight in UGM (1 UGM = 450 Kg)
  const totalActiveCattleKg = animals
    .filter((a) => a.status === 'ACT')
    .reduce((acc, a) => acc + a.currentWeightKg, 0);
  const totalUgm = Math.round((totalActiveCattleKg / 450) * 10) / 10;
  const overallStockingRate = totalHectares > 0 ? (totalUgm / totalHectares).toFixed(2) : '0';

  // Interactive Aforo calculations
  const aforoTotalForageGreenKg = (aforoGramsPerM2 / 1000) * 10000 * aforoHectares;
  const aforoTotalDryMatterKg = aforoTotalForageGreenKg * (aforoDryMatterPct / 100);
  // Un bovino consume ~10% de su peso en forraje verde fresco al día
  const dailyForageIntakePerAnimalKg = aforoAvgAnimalWeightKg * 0.10;
  const totalDailyBatchIntakeKg = dailyForageIntakePerAnimalKg * aforoAnimalCount;
  // Eficiencia de pastoreo en campo (aprox 50-60% de aprovechamiento sin desperdicio)
  const usableGreenForageKg = aforoTotalForageGreenKg * 0.55;
  const estimatedDaysOfGrazing = totalDailyBatchIntakeKg > 0 ? Math.floor(usableGreenForageKg / totalDailyBatchIntakeKg) : 0;

  // Handle Rotation submit
  const handleExecuteRotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePaddockId || !targetPaddockId) {
      alert('Seleccione potrero de origen y destino');
      return;
    }
    rotatePastureBatch(sourcePaddockId, targetPaddockId, batchNameToMove, 'Capataz');
    refreshLocal();
    setIsRotationModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Farmbrite & GanaderiAPP Pastures
              </span>
              <span className="text-xs text-slate-400">Rotación de Potreros y Aforo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manejo Holístico de Pasturas & Biomasa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Monitoreo de días de ocupación vs. días de descanso óptimo (30-35 días), cálculo de carga animal en Unidades Gran Ganado (UGM/Ha) y calculadora de aforo forrajero.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setDisplayView(displayView === 'map' ? 'cards' : 'map')}
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                displayView === 'map'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {displayView === 'map' ? (
                <>
                  <LayoutGrid className="w-4 h-4 text-white" />
                  Ver Cuadrícula de Tarjetas
                </>
              ) : (
                <>
                  <Map className="w-4 h-4 text-indigo-400" />
                  Ver Mapa Interactivo D3
                </>
              )}
            </button>

            <button
              onClick={() => setIsAforoCalcOpen(!isAforoCalcOpen)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              Calculadora de Aforo (m²)
            </button>

            <button
              onClick={() => {
                const occupied = pastures.find((p) => p.status === 'Ocupado');
                const ready = pastures.find((p) => p.status === 'Listo para Pastoreo');
                if (occupied) setSourcePaddockId(occupied.id);
                if (ready) setTargetPaddockId(ready.id);
                setIsRotationModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Rotar Lote de Potrero
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">Área Total de Pastoreo</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-white">{totalHectares.toFixed(1)}</span>
            <span className="text-xs text-slate-500">Hectáreas ({pastures.length} potreros)</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">Carga Animal Finca (UGM)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{overallStockingRate}</span>
            <span className="text-xs text-emerald-400/80 font-mono font-bold">UGM / Hectárea</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Total: {totalUgm} Unidades Animales</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">Potreros Listos para Entrar</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-teal-400">{readyCount}</span>
            <span className="text-xs text-slate-500">cumplieron descanso</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 block font-medium">Potreros en Descanso</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{restingCount}</span>
            <span className="text-xs text-slate-500">recuperando biomasa</span>
          </div>
        </div>
      </div>

      {/* Interactive Aforo Calculator Drawer */}
      {isAforoCalcOpen && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                Calculadora Científica de Aforo Forrajero (Método del m²)
              </h3>
            </div>
            <button
              onClick={() => setIsAforoCalcOpen(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Aforo Verde (g/m²)
              </label>
              <input
                type="number"
                value={aforoGramsPerM2}
                onChange={(e) => setAforoGramsPerM2(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500">~{(aforoGramsPerM2 / 1000).toFixed(2)} Kg/m²</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Materia Seca (%)
              </label>
              <input
                type="number"
                value={aforoDryMatterPct}
                onChange={(e) => setAforoDryMatterPct(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500">20-25% promedio</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Hectáreas Potrero
              </label>
              <input
                type="number"
                step="0.1"
                value={aforoHectares}
                onChange={(e) => setAforoHectares(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Cabezas en el Lote
              </label>
              <input
                type="number"
                value={aforoAnimalCount}
                onChange={(e) => setAforoAnimalCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Peso Promedio (Kg)
              </label>
              <input
                type="number"
                value={aforoAvgAnimalWeightKg}
                onChange={(e) => setAforoAvgAnimalWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Result Banner */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Forraje Verde Total Potrero</span>
              <span className="text-xl font-bold text-white">
                {Math.round(aforoTotalForageGreenKg).toLocaleString()} Kg
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Consumo Diario Estimado del Lote</span>
              <span className="text-xl font-bold text-amber-400">
                {Math.round(totalDailyBatchIntakeKg).toLocaleString()} Kg/día
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block uppercase">Días Óptimos de Pastoreo</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {estimatedDaysOfGrazing} DÍAS
              </span>
              <span className="text-[10px] text-slate-400 block">antes de sobrepastorear</span>
            </div>
          </div>
        </div>
      )}

      {/* View Switch: Interactive D3 Map or Cards Grid */}
      {displayView === 'map' ? (
        <FarmMapD3View
          animals={animals}
          onRefreshData={refreshLocal}
          onOpenAnimalDetail={onOpenAnimalDetail}
        />
      ) : (
        /* Paddocks Matrix Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pastures.map((potrero) => {
            const restProgressPct = Math.min(100, Math.round((potrero.currentRestDays / potrero.targetRestDays) * 100));

            return (
              <div
                key={potrero.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all ${
                  potrero.status === 'Ocupado'
                    ? 'border-blue-500/50 shadow-blue-950/20'
                    : potrero.status === 'Listo para Pastoreo'
                    ? 'border-emerald-500/50 shadow-emerald-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">{potrero.code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        potrero.status === 'Ocupado'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : potrero.status === 'Listo para Pastoreo'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {potrero.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{potrero.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{potrero.grassType}</p>

                  {/* Status Details */}
                  {potrero.status === 'Ocupado' ? (
                    <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
                      <span className="text-[11px] font-semibold text-blue-300 block">
                        En Pastoreo: {potrero.currentOccupantBatch}
                      </span>
                      <span className="text-xs text-slate-300 block font-mono">
                        Lleva {potrero.daysInGrazing} días ocupado
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Entrada: {potrero.entryDate || 'Reciente'}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Recuperación de Pasto:</span>
                        <span className="font-bold text-white">
                          {potrero.currentRestDays} / {potrero.targetRestDays} días
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            potrero.status === 'Listo para Pastoreo'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${restProgressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Technical specs */}
                  <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="block text-[10px] text-slate-500">Superficie</span>
                      <span className="font-semibold text-slate-200">{potrero.areaHectares} Ha</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Aforo Est.</span>
                      <span className="font-semibold text-slate-200">{potrero.estimatedBiomassKgPerM2} Kg/m²</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Bebedero</span>
                      <span className="font-semibold text-slate-200 truncate block">{potrero.waterSource}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Cercado</span>
                      <span className="font-semibold text-slate-200 truncate block">{potrero.fencingType}</span>
                    </div>
                  </div>

                  {/* Animals in this Paddock */}
                  {(() => {
                    const padAnimals = animals.filter(
                      (a) => a.paddockId === potrero.id || a.paddockName === potrero.name
                    );
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>Ganado en este Potrero:</span>
                          <span className="text-emerald-400 font-mono font-black">{padAnimals.length} Cabezas</span>
                        </div>
                        {padAnimals.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                            {padAnimals.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => onOpenAnimalDetail?.(a)}
                                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer transition-all"
                                title={`Ver ficha de #${a.id}`}
                              >
                                #{a.id} ({a.currentWeightKg}kg)
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic block">Potrero desocupado</span>
                        )}

                        {/* Action Buttons for this Paddock */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60 flex-wrap">
                          {onOpenMangaForPaddock && (
                            <button
                              type="button"
                              onClick={() => onOpenMangaForPaddock(potrero.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title="Pesar lote de este potrero en manga"
                            >
                              <Scale className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Manga</span>
                            </button>
                          )}
                          {onOpenBatchTreatment && (
                            <button
                              type="button"
                              onClick={() => onOpenBatchTreatment(potrero.id)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                              title="Aplicar tratamiento sanitario masivo a este potrero"
                            >
                              <Syringe className="w-2.5 h-2.5 text-amber-400" />
                              <span>Tratamiento</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => (onOpenMap ? onOpenMap() : setDisplayView('map'))}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                            title="Ver en mapa interactivo D3"
                          >
                            <Compass className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Mapa D3</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Rotar Potrero */}
      {isRotationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
              Rotación y Traslado de Lote de Pastoreo
            </h3>

            <form onSubmit={handleExecuteRotation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Lote a Mover</label>
                <input
                  type="text"
                  value={batchNameToMove}
                  onChange={(e) => setBatchNameToMove(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Potrero Origen (Quedará en Descanso)</label>
                <select
                  value={sourcePaddockId}
                  onChange={(e) => setSourcePaddockId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                >
                  <option value="">Seleccione potrero ocupado</option>
                  {pastures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Potrero Destino (Entrará en Pastoreo)</label>
                <select
                  value={targetPaddockId}
                  onChange={(e) => setTargetPaddockId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                >
                  <option value="">Seleccione potrero destino</option>
                  {pastures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRotationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  Confirmar Rotación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
