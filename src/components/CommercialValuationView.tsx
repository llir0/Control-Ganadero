import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Scale,
  Award,
  Layers,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  Check,
  FileDown,
  Calendar,
  Clock,
  Sparkles,
  Filter,
  Search,
  ArrowRight,
  Info,
  Zap,
  BarChart3,
  LineChart as LineChartIcon,
  Tag,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Animal, MarketPriceConfig } from '../types';
import {
  getStoredMarketPrices,
  saveStoredMarketPrices,
  addFinancialTransaction,
  saveStoredAnimal,
} from '../lib/storage';
import {
  calculateHerdProjections,
  AnimalWeightProjection,
} from '../lib/projections';
import { exportWeightProjectionsPDF } from '../lib/pdfExport';

interface CommercialValuationViewProps {
  animals: Animal[];
  onRefreshData: () => void;
  onOpenDetail: (animal: Animal) => void;
  onOpenExportReports?: () => void;
  onNavigateToSales?: () => void;
}

export const CommercialValuationView: React.FC<CommercialValuationViewProps> = ({
  animals,
  onRefreshData,
  onOpenDetail,
  onOpenExportReports,
  onNavigateToSales,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasacion' | 'proyecciones'>('proyecciones');
  const [prices, setPrices] = useState<MarketPriceConfig>(getStoredMarketPrices());
  const [isEditingPrices, setIsEditingPrices] = useState(false);

  // Projection interactive controls
  const [selectedHorizon, setSelectedHorizon] = useState<'all' | '3m' | '6m' | '12m'>('all');
  const [projectionPurposeFilter, setProjectionPurposeFilter] = useState<string>('TODOS');
  const [projectionWindowFilter, setProjectionWindowFilter] = useState<string>('TODOS');
  const [projectionSearchQuery, setProjectionSearchQuery] = useState('');
  const [gdpSimulationMultiplier, setGdpSimulationMultiplier] = useState<number>(1.0); // 1.0 = 100%, 1.15 = +15%, 0.85 = -15%
  const [chartMode, setChartMode] = useState<'growth' | 'value'>('growth');

  // Active cattle
  const activeAnimals = useMemo(() => {
    return animals.filter((a) => a.status === 'ACT');
  }, [animals]);

  // Breakdown by categories for current valuation
  const categories = useMemo(() => {
    const cebaBulls = activeAnimals.filter((a) => a.purpose === 'CEBA' && a.sex === 'M');
    const breedingCows = activeAnimals.filter((a) => a.purpose === 'CRIA' && a.sex === 'F');
    const dairyCows = activeAnimals.filter((a) => a.purpose === 'LECHE');
    const calves = activeAnimals.filter((a) => a.currentWeightKg < 220);
    const reproBulls = activeAnimals.filter((a) => a.purpose === 'REPRODUCTOR');

    const calcTotal = (list: Animal[], pricePerKg: number) => {
      const totalKg = list.reduce((acc, a) => acc + a.currentWeightKg, 0);
      const totalUSD = totalKg * pricePerKg;
      return { count: list.length, totalKg, totalUSD };
    };

    return {
      ceba: { ...calcTotal(cebaBulls, prices.fatteningBullKgUSD), list: cebaBulls, priceKg: prices.fatteningBullKgUSD },
      cria: { ...calcTotal(breedingCows, prices.breedingCowKgUSD), list: breedingCows, priceKg: prices.breedingCowKgUSD },
      leche: { ...calcTotal(dairyCows, prices.dairyCowKgUSD), list: dairyCows, priceKg: prices.dairyCowKgUSD },
      terneros: { ...calcTotal(calves, prices.calfWeanedKgUSD), list: calves, priceKg: prices.calfWeanedKgUSD },
      reproductores: {
        ...calcTotal(reproBulls, prices.fatteningBullKgUSD * 1.3),
        list: reproBulls,
        priceKg: prices.fatteningBullKgUSD * 1.3,
      },
    };
  }, [activeAnimals, prices]);

  // Grand Totals for current valuation
  const grandTotalKg = activeAnimals.reduce((acc, a) => acc + a.currentWeightKg, 0);
  const grandTotalArrobas = Math.round((grandTotalKg / 25) * 10) / 10;
  const grandTotalValuationUSD =
    categories.ceba.totalUSD +
    categories.cria.totalUSD +
    categories.leche.totalUSD +
    categories.terneros.totalUSD +
    categories.reproductores.totalUSD;

  // Ready for market animals
  const readyForSaleAnimals = useMemo(() => {
    return activeAnimals.filter((a) => {
      if (a.purpose === 'CEBA' && a.currentWeightKg >= (a.targetWeightKg || 500)) return true;
      if (a.purpose === 'CEBA' && a.currentWeightKg >= 520) return true;
      return false;
    });
  }, [activeAnimals]);

  // Calculate full projections at 3, 6, and 12 months
  const { projections, summary: projectionsSummary } = useMemo(() => {
    return calculateHerdProjections(activeAnimals, prices, gdpSimulationMultiplier);
  }, [activeAnimals, prices, gdpSimulationMultiplier]);

  // Filtered projections based on UI filters
  const filteredProjections = useMemo(() => {
    return projections.filter((p) => {
      // Purpose filter
      if (projectionPurposeFilter !== 'TODOS' && p.animal.purpose !== projectionPurposeFilter) {
        return false;
      }
      // Sale window filter
      if (projectionWindowFilter !== 'TODOS' && p.saleWindow !== projectionWindowFilter) {
        return false;
      }
      // Search query
      if (projectionSearchQuery.trim()) {
        const q = projectionSearchQuery.toLowerCase();
        const matchesId = p.animal.id.toLowerCase().includes(q);
        const matchesName = p.animal.name?.toLowerCase().includes(q) || false;
        const matchesBreed = p.animal.breed.toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesBreed) return false;
      }
      return true;
    });
  }, [projections, projectionPurposeFilter, projectionWindowFilter, projectionSearchQuery]);

  // Chart data for weight growth trajectory
  const growthChartData = useMemo(() => {
    // Take top fattening and rearing animals to visualize realistic growth curves
    const sample = projections
      .filter((p) => p.animal.purpose === 'CEBA' || p.animal.purpose === 'CRIA')
      .slice(0, 5);

    return [
      {
        horizon: 'Hoy (Actual)',
        promedioHato: Math.round(
          projections.reduce((sum, p) => sum + p.currentWeightKg, 0) / (projections.length || 1)
        ),
        metaComercial: 520,
        ...sample.reduce((acc, p) => ({ ...acc, [`TAG #${p.animal.id}`]: p.currentWeightKg }), {}),
      },
      {
        horizon: '+3 Meses (90d)',
        promedioHato: Math.round(
          projections.reduce((sum, p) => sum + p.weight3mKg, 0) / (projections.length || 1)
        ),
        metaComercial: 520,
        ...sample.reduce((acc, p) => ({ ...acc, [`TAG #${p.animal.id}`]: p.weight3mKg }), {}),
      },
      {
        horizon: '+6 Meses (180d)',
        promedioHato: Math.round(
          projections.reduce((sum, p) => sum + p.weight6mKg, 0) / (projections.length || 1)
        ),
        metaComercial: 520,
        ...sample.reduce((acc, p) => ({ ...acc, [`TAG #${p.animal.id}`]: p.weight6mKg }), {}),
      },
      {
        horizon: '+12 Meses (365d)',
        promedioHato: Math.round(
          projections.reduce((sum, p) => sum + p.weight12mKg, 0) / (projections.length || 1)
        ),
        metaComercial: 520,
        ...sample.reduce((acc, p) => ({ ...acc, [`TAG #${p.animal.id}`]: p.weight12mKg }), {}),
      },
    ];
  }, [projections]);

  // Chart data for commercial value progression
  const valueChartData = useMemo(() => {
    return [
      {
        etapa: 'Hoy (Actual)',
        valorUSD: Math.round(projectionsSummary.currentTotalValueUSD),
        gananciaUSD: 0,
        biomasaKg: projectionsSummary.currentTotalKg,
      },
      {
        etapa: '+3 Meses',
        valorUSD: Math.round(projectionsSummary.total3mValueUSD),
        gananciaUSD: Math.round(projectionsSummary.total3mGainUSD),
        biomasaKg: projectionsSummary.total3mKg,
      },
      {
        etapa: '+6 Meses',
        valorUSD: Math.round(projectionsSummary.total6mValueUSD),
        gananciaUSD: Math.round(projectionsSummary.total6mGainUSD),
        biomasaKg: projectionsSummary.total6mKg,
      },
      {
        etapa: '+12 Meses',
        valorUSD: Math.round(projectionsSummary.total12mValueUSD),
        gananciaUSD: Math.round(projectionsSummary.total12mGainUSD),
        biomasaKg: projectionsSummary.total12mKg,
      },
    ];
  }, [projectionsSummary]);

  // Handle price update
  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredMarketPrices(prices);
    setIsEditingPrices(false);
  };

  // Helper to navigate to sales module for optimal cohort
  const handleSelectCohortForSale = (_windowType: AnimalWeightProjection['saleWindow']) => {
    if (onNavigateToSales) {
      onNavigateToSales();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Livestocked & Jetbov Valuation
              </span>
              <span className="text-xs text-slate-400">Tasación Comercial y Simulación Predictiva</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Valuación del Hato & Proyecciones de Crecimiento
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Modelado zootécnico de ganancia diaria de peso (GDP), estimación patrimonial a 3, 6 y 12 meses y planificación de fechas óptimas de venta en pie.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportWeightProjectionsPDF(projections, projectionsSummary, prices)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              title="Descargar Informe Oficial de Proyecciones a 3, 6 y 12 Meses en PDF"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>Exportar Proyecciones PDF</span>
            </button>

            {onNavigateToSales && (
              <button
                type="button"
                onClick={onNavigateToSales}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                title="Ir al módulo especializado de ventas para liquidar lotes comerciales"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Módulo de Ventas →</span>
              </button>
            )}

            {onOpenExportReports && (
              <button
                type="button"
                onClick={onOpenExportReports}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Libro Financiero</span>
              </button>
            )}

            <button
              onClick={() => setIsEditingPrices(!isEditingPrices)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>{isEditingPrices ? 'Cerrar Precios' : 'Precios Mercado'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Proyecciones vs Tasación Patrimonial */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('proyecciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'proyecciones'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Proyección de Peso & Crecimiento (3, 6 y 12 Meses)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-950/40 text-[10px] font-mono">
              {activeAnimals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tasacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'tasacion'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tasación Patrimonial Actual del Hato</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-200 text-[10px] font-mono">
              ${Math.round(grandTotalValuationUSD).toLocaleString()} USD
            </span>
          </button>
        </div>
      </div>

      {/* Market Prices Editor Drawer */}
      {isEditingPrices && (
        <form onSubmit={handleSavePrices} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Precios de Referencia en Subasta / Mercado Ganadero (USD / Kg en pie)
            </h3>
            <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer">
              Guardar Precios
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Macho Ceba ($/Kg)</label>
              <input
                type="number"
                step="0.05"
                value={prices.fatteningBullKgUSD}
                onChange={(e) => setPrices({ ...prices, fatteningBullKgUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Vaca Cría ($/Kg)</label>
              <input
                type="number"
                step="0.05"
                value={prices.breedingCowKgUSD}
                onChange={(e) => setPrices({ ...prices, breedingCowKgUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Vaca Leche ($/Kg)</label>
              <input
                type="number"
                step="0.05"
                value={prices.dairyCowKgUSD}
                onChange={(e) => setPrices({ ...prices, dairyCowKgUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Ternero Desteto ($/Kg)</label>
              <input
                type="number"
                step="0.05"
                value={prices.calfWeanedKgUSD}
                onChange={(e) => setPrices({ ...prices, calfWeanedKgUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Vaca Descarte ($/Kg)</label>
              <input
                type="number"
                step="0.05"
                value={prices.cullCowKgUSD}
                onChange={(e) => setPrices({ ...prices, cullCowKgUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Litro Leche ($/L)</label>
              <input
                type="number"
                step="0.01"
                value={prices.milkLiterUSD}
                onChange={(e) => setPrices({ ...prices, milkLiterUSD: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: PROYECCIONES A 3, 6 Y 12 MESES (FEATURE COMPLETA) */}
      {/* ======================================================== */}
      {activeSubTab === 'proyecciones' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive KPI Projections Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Valor Actual */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
                <span>Valoración Hoy</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">Día 0</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-white font-mono">
                  ${Math.round(projectionsSummary.currentTotalValueUSD).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-400">USD</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>Biomasa: <strong className="text-slate-200">{projectionsSummary.currentTotalKg.toLocaleString()} Kg</strong></span>
                <span>GDP Promedio: <strong className="text-emerald-400 font-mono">+{projectionsSummary.avgAdgGrams} g/d</strong></span>
              </div>
            </div>

            {/* Card 2: Proyección 3 Meses */}
            <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  A 3 Meses (+90d)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                  +{(projectionsSummary.total3mKg - projectionsSummary.currentTotalKg).toLocaleString()} Kg
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  ${Math.round(projectionsSummary.total3mValueUSD).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-400/80">USD</span>
              </div>
              <div className="mt-3 pt-2 border-t border-amber-500/20 text-xs flex justify-between items-center">
                <span className="text-slate-400">Ganancia Estimada:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +${Math.round(projectionsSummary.total3mGainUSD).toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Card 3: Proyección 6 Meses */}
            <div className="bg-gradient-to-br from-slate-900 to-cyan-950/20 border border-cyan-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  A 6 Meses (+180d)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  +{(projectionsSummary.total6mKg - projectionsSummary.currentTotalKg).toLocaleString()} Kg
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-cyan-400 font-mono">
                  ${Math.round(projectionsSummary.total6mValueUSD).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-cyan-400/80">USD</span>
              </div>
              <div className="mt-3 pt-2 border-t border-cyan-500/20 text-xs flex justify-between items-center">
                <span className="text-slate-400">Ganancia Estimada:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +${Math.round(projectionsSummary.total6mGainUSD).toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Card 4: Proyección 12 Meses */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  A 12 Meses (+365d)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  +{(projectionsSummary.total12mKg - projectionsSummary.currentTotalKg).toLocaleString()} Kg
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  ${Math.round(projectionsSummary.total12mValueUSD).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-400/80">USD</span>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-500/20 text-xs flex justify-between items-center">
                <span className="text-slate-400">Ganancia Estimada:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +${Math.round(projectionsSummary.total12mGainUSD).toLocaleString()} USD
                </span>
              </div>
            </div>
          </div>

          {/* Planned Sale Cohorts (Ventanas de Venta Planificadas) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Ventanas Óptimas de Venta Planificadas según Curva de Crecimiento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identifica las fechas calendario recomendadas para comercializar cada cohorte antes de que el costo de mantenimiento supere la ganancia diaria.
                </p>
              </div>

              {/* Simulation Scenario Multiplier Selector */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                <span className="text-[11px] text-slate-400 font-semibold pl-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Escenario GDP:
                </span>
                {[
                  { value: 0.85, label: '-15% (Sequía)', title: 'Época seca o escasez de pasturas' },
                  { value: 1.0, label: 'Base Real (100%)', title: 'GDP calculada de pesajes históricos' },
                  { value: 1.15, label: '+15% (Suplemento)', title: 'Dieta intensiva con ensilaje y grano' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    title={s.title}
                    onClick={() => setGdpSimulationMultiplier(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      gdpSimulationMultiplier === s.value
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Interactive Cohort Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Cohort 1: Inmediata */}
              <div
                onClick={() =>
                  setProjectionWindowFilter(projectionWindowFilter === 'INMEDIATA' ? 'TODOS' : 'INMEDIATA')
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  projectionWindowFilter === 'INMEDIATA'
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/70 border-emerald-500/30 hover:border-emerald-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Venta Inmediata
                  </span>
                  <span className="text-xl font-black text-white font-mono">{projectionsSummary.readyNowCount}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Mes 0-1 (Peso Meta Alcanzado)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Animales listos (&gt;500 Kg). Venta sugerida para evitar pérdida de conversión alimenticia.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCohortForSale('INMEDIATA');
                  }}
                  className="mt-3 w-full py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Cargar a Factura de Venta →
                </button>
              </div>

              {/* Cohort 2: Corto Plazo */}
              <div
                onClick={() =>
                  setProjectionWindowFilter(projectionWindowFilter === 'CORTO_PLAZO' ? 'TODOS' : 'CORTO_PLAZO')
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  projectionWindowFilter === 'CORTO_PLAZO'
                    ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-slate-950/70 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    Corto Plazo (1-3m)
                  </span>
                  <span className="text-xl font-black text-white font-mono">{projectionsSummary.readyIn3mCount}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Próximos 90 Días</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Alcanzarán peso de beneficio en el próximo trimestre. Programar comprador o subasta.
                </p>
                <div className="mt-3 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  Salida en los próximos 90d
                </div>
              </div>

              {/* Cohort 3: Mediano Plazo */}
              <div
                onClick={() =>
                  setProjectionWindowFilter(projectionWindowFilter === 'MEDIANO_PLAZO' ? 'TODOS' : 'MEDIANO_PLAZO')
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  projectionWindowFilter === 'MEDIANO_PLAZO'
                    ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/20'
                    : 'bg-slate-950/70 border-cyan-500/30 hover:border-cyan-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                    Mediano Plazo (4-6m)
                  </span>
                  <span className="text-xl font-black text-white font-mono">{projectionsSummary.readyIn6mCount}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Semestre 2 (180 Días)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Fase activa de engorda ceba. Mantener en potreros de rotación intensiva con alta biomasa.
                </p>
                <div className="mt-3 text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Planificar salida en 4-6 meses
                </div>
              </div>

              {/* Cohort 4: Largo Plazo */}
              <div
                onClick={() =>
                  setProjectionWindowFilter(projectionWindowFilter === 'LARGO_PLAZO' ? 'TODOS' : 'LARGO_PLAZO')
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  projectionWindowFilter === 'LARGO_PLAZO'
                    ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-950/70 border-indigo-500/30 hover:border-indigo-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    Levante / Terneros (&gt;6m)
                  </span>
                  <span className="text-xl font-black text-white font-mono">{projectionsSummary.longTermCount}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-2">Horizontes a 12 Meses</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Cría, terneros destetados y vientres. Base productiva para la próxima temporada.
                </p>
                <div className="mt-3 text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  Crecimiento y maduración a 1 año
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart Section: Curvas de Peso vs Valorización */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  {chartMode === 'growth' ? (
                    <LineChartIcon className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                  )}
                  {chartMode === 'growth'
                    ? 'Trayectoria Predictiva de Ganancia de Peso (Kg en Pie)'
                    : 'Evolución del Valor Comercial y Plusvalía Patrimonial ($ USD)'}
                </h3>
                <span className="text-xs text-slate-400">
                  {chartMode === 'growth'
                    ? 'Curva comparativa de peso actual vs proyecciones a 3, 6 y 12 meses respecto al peso meta comercial de 520 Kg'
                    : 'Valor acumulado en USD a cada horizonte temporal basado en cotizaciones de subasta'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setChartMode('growth')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === 'growth'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Curva de Peso (Kg)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('value')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartMode === 'value'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Valor Monetario ($)
                </button>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'growth' ? (
                  <LineChart data={growthChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={['dataMin - 40', 'dataMax + 40']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <ReferenceLine
                      y={520}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Peso Meta Comercial (520 Kg)', fill: '#f59e0b', fontSize: 10, position: 'top' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="promedioHato"
                      name="Promedio General del Hato"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#10b981' }}
                    />
                    {Object.keys(growthChartData[0] || {})
                      .filter((k) => k.startsWith('TAG #'))
                      .map((key, idx) => {
                        const colors = ['#38bdf8', '#a855f7', '#fb7185', '#34d399', '#fbbf24'];
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[idx % colors.length]}
                            strokeWidth={1.5}
                            strokeDasharray="5 5"
                            dot={{ r: 3 }}
                          />
                        );
                      })}
                  </LineChart>
                ) : (
                  <BarChart data={valueChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="etapa" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="valorUSD" name="Valor del Hato ($ USD)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gananciaUSD" name="Plusvalía Acumulada ($ USD)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Projections Table with Search, Filter & Optimal Dates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Proyecciones Individuales & Planificador de Salidas Óptimas
                </h3>
                <span className="text-xs text-slate-400">
                  Mostrando {filteredProjections.length} de {projections.length} animales evaluados
                </span>
              </div>

              {/* Filter controls row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por arete, nombre..."
                    value={projectionSearchQuery}
                    onChange={(e) => setProjectionSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 w-48"
                  />
                </div>

                {/* Purpose Filter */}
                <select
                  value={projectionPurposeFilter}
                  onChange={(e) => setProjectionPurposeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="TODOS">Todos los Propósitos</option>
                  <option value="CEBA">Ceba / Engorda</option>
                  <option value="CRIA">Cría</option>
                  <option value="LECHE">Leche</option>
                  <option value="REPRODUCTOR">Reproductores</option>
                </select>

                {/* Horizon Columns Focus */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: '3m', label: '3 Meses' },
                    { id: '6m', label: '6 Meses' },
                    { id: '12m', label: '12 Meses' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setSelectedHorizon(h.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedHorizon === h.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Animal / Arete</th>
                    <th className="py-2.5 px-3">Propósito</th>
                    <th className="py-2.5 px-3 text-right">Peso Actual</th>
                    <th className="py-2.5 px-3 text-right">GDP Histórica</th>
                    {(selectedHorizon === 'all' || selectedHorizon === '3m') && (
                      <th className="py-2.5 px-3 text-right bg-amber-950/20 text-amber-300">
                        A 3 Meses (+90d)
                      </th>
                    )}
                    {(selectedHorizon === 'all' || selectedHorizon === '6m') && (
                      <th className="py-2.5 px-3 text-right bg-cyan-950/20 text-cyan-300">
                        A 6 Meses (+180d)
                      </th>
                    )}
                    {(selectedHorizon === 'all' || selectedHorizon === '12m') && (
                      <th className="py-2.5 px-3 text-right bg-emerald-950/20 text-emerald-300">
                        A 12 Meses (+365d)
                      </th>
                    )}
                    <th className="py-2.5 px-3 text-right">Meta Com.</th>
                    <th className="py-2.5 px-3 text-center">Fecha Óptima de Venta</th>
                    <th className="py-2.5 px-3">Estado / Planificación</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredProjections.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 italic font-sans text-xs">
                        No se encontraron animales que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredProjections.map((p) => {
                      const isReady = p.saleWindow === 'INMEDIATA';

                      return (
                        <tr
                          key={p.animal.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isReady ? 'bg-emerald-950/15' : ''
                          }`}
                        >
                          {/* Animal */}
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => onOpenDetail(p.animal)}
                              className="text-left group cursor-pointer"
                            >
                              <span className="font-bold text-white group-hover:text-emerald-300 font-sans block text-xs">
                                {p.animal.name || `Animal #${p.animal.id}`}
                              </span>
                              <span className="text-[10px] text-amber-400 font-bold block">TAG #{p.animal.id}</span>
                              <span className="text-[10px] text-slate-400 font-sans block">{p.animal.breed}</span>
                            </button>
                          </td>

                          {/* Purpose */}
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                p.animal.purpose === 'CEBA'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : p.animal.purpose === 'CRIA'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : p.animal.purpose === 'LECHE'
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-purple-500/20 text-purple-300'
                              }`}
                            >
                              {p.animal.purpose}
                            </span>
                          </td>

                          {/* Peso Actual */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-white block text-xs">{p.currentWeightKg} Kg</span>
                            <span className="text-[10px] text-slate-400 block">${p.currentValueUSD} USD</span>
                          </td>

                          {/* GDP */}
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`font-bold text-xs block ${
                                p.historicalAdgGrams >= 900
                                  ? 'text-emerald-400'
                                  : p.historicalAdgGrams >= 650
                                  ? 'text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            >
                              +{p.historicalAdgGrams} g/d
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans block">
                              {p.hasRealHistory ? `${p.historicalDataPoints} pesajes` : 'Benchmark'}
                            </span>
                          </td>

                          {/* Proyección 3m */}
                          {(selectedHorizon === 'all' || selectedHorizon === '3m') && (
                            <td className="py-2.5 px-3 text-right bg-amber-950/10">
                              <span className="font-bold text-amber-300 block text-xs">{p.weight3mKg} Kg</span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                ${p.value3mUSD} (<strong className="text-emerald-400">+${p.valueGain3mUSD}</strong>)
                              </span>
                            </td>
                          )}

                          {/* Proyección 6m */}
                          {(selectedHorizon === 'all' || selectedHorizon === '6m') && (
                            <td className="py-2.5 px-3 text-right bg-cyan-950/10">
                              <span className="font-bold text-cyan-300 block text-xs">{p.weight6mKg} Kg</span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                ${p.value6mUSD} (<strong className="text-emerald-400">+${p.valueGain6mUSD}</strong>)
                              </span>
                            </td>
                          )}

                          {/* Proyección 12m */}
                          {(selectedHorizon === 'all' || selectedHorizon === '12m') && (
                            <td className="py-2.5 px-3 text-right bg-emerald-950/10">
                              <span className="font-bold text-emerald-300 block text-xs">{p.weight12mKg} Kg</span>
                              <span className="text-[10px] text-slate-400 block font-sans">
                                ${p.value12mUSD} (<strong className="text-emerald-400">+${p.valueGain12mUSD}</strong>)
                              </span>
                            </td>
                          )}

                          {/* Meta */}
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-slate-200 block text-xs">{p.targetWeightKg} Kg</span>
                            <span className="text-[10px] text-slate-400 font-sans block">
                              {p.kgToTarget === 0 ? 'Cumplido' : `Faltan ${p.kgToTarget}k`}
                            </span>
                          </td>

                          {/* Fecha Óptima de Venta */}
                          <td className="py-2.5 px-3 text-center font-sans">
                            <div className="font-bold text-white text-xs">{p.optimalDateFormatted}</div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                p.daysToTarget === 0
                                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                  : p.daysToTarget <= 90
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.daysToTarget === 0 ? '¡HOY LISTO!' : `en ~${p.daysToTarget} días`}
                            </span>
                          </td>

                          {/* Estado / Ventana */}
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border block w-fit ${p.saleWindowBadgeColor}`}
                            >
                              {p.saleWindowLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                              {p.recommendation}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-2.5 px-3 text-center font-sans">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenDetail(p.animal)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all cursor-pointer"
                                title="Ver Ficha Completa del Animal"
                              >
                                Ficha
                              </button>

                              {onNavigateToSales && p.isReadyForSale && (
                                <button
                                  type="button"
                                  onClick={onNavigateToSales}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                                  title="Ir al módulo de ventas para liquidar este animal"
                                >
                                  <span>Vender →</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: TASACIÓN ACTUAL & LIQUIDACIÓN DE VENTA */}
      {/* ======================================================== */}
      {activeSubTab === 'tasacion' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Big Valuation Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Valor Comercial del Hato
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                  ${Math.round(grandTotalValuationUSD).toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-400">USD</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Basado en {activeAnimals.length} cabezas activas
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Biomasa Total en Pie
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                  {grandTotalKg.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-400">KG</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-1 font-mono">
                ~{grandTotalArrobas} Arrobas (@ = 25 Kg)
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Animales Listos para Venta
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  {readyForSaleAnimals.length}
                </span>
                <span className="text-sm font-bold text-slate-400">cabezas</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Cumplieron peso meta de ceba (&gt;500 Kg)
              </span>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Precio Medio Promedio
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-teal-400 font-mono">
                  ${(grandTotalValuationUSD / (grandTotalKg || 1)).toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-400">/ Kg</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Ponderado según categorías
              </span>
            </div>
          </div>

          {/* Category Breakdown & Market Valuation */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Desglose Patrimonial por Categorías Zootécnicas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Ceba */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">Macho Ceba</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    ${prices.fatteningBullKgUSD}/Kg
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  ${Math.round(categories.ceba.totalUSD).toLocaleString()} <span className="text-xs text-slate-400">USD</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{categories.ceba.count} cabezas</span>
                  <span>{categories.ceba.totalKg.toLocaleString()} Kg</span>
                </div>
              </div>

              {/* Cria */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">Vacas Cría</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    ${prices.breedingCowKgUSD}/Kg
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  ${Math.round(categories.cria.totalUSD).toLocaleString()} <span className="text-xs text-slate-400">USD</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{categories.cria.count} cabezas</span>
                  <span>{categories.cria.totalKg.toLocaleString()} Kg</span>
                </div>
              </div>

              {/* Leche */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">Vacas Lecheras</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    ${prices.dairyCowKgUSD}/Kg
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  ${Math.round(categories.leche.totalUSD).toLocaleString()} <span className="text-xs text-slate-400">USD</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{categories.leche.count} cabezas</span>
                  <span>{categories.leche.totalKg.toLocaleString()} Kg</span>
                </div>
              </div>

              {/* Terneros */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Terneros Desteto</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    ${prices.calfWeanedKgUSD}/Kg
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  ${Math.round(categories.terneros.totalUSD).toLocaleString()} <span className="text-xs text-slate-400">USD</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{categories.terneros.count} cabezas</span>
                  <span>{categories.terneros.totalKg.toLocaleString()} Kg</span>
                </div>
              </div>

              {/* Reproductores */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">Sementales</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Genético
                  </span>
                </div>
                <div className="text-xl font-black text-white font-mono">
                  ${Math.round(categories.reproductores.totalUSD).toLocaleString()} <span className="text-xs text-slate-400">USD</span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>{categories.reproductores.count} cabezas</span>
                  <span>{categories.reproductores.totalKg.toLocaleString()} Kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Animals Ready for Market Card with Direct Link to Sales */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Ganado que Alcanzó Peso Óptimo Comercial
                </h3>
                <span className="text-xs text-slate-400">
                  Animales listos para beneficio, subasta o salida de la finca (&gt;500 Kg o meta cumplida)
                </span>
              </div>

              {onNavigateToSales && (
                <button
                  type="button"
                  onClick={onNavigateToSales}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ir a Liquidar en Módulo de Ventas ({readyForSaleAnimals.length}) →</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Arete / Tag</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Raza</th>
                    <th className="py-2.5 px-3">Propósito</th>
                    <th className="py-2.5 px-3 text-right">Peso Actual</th>
                    <th className="py-2.5 px-3 text-right">Valor Tasado (USD)</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {readyForSaleAnimals.map((animal) => {
                    const estValue = Math.round(animal.currentWeightKg * prices.fatteningBullKgUSD);
                    return (
                      <tr key={animal.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          TAG #{animal.id}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {animal.name || 'Sin nombre'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{animal.breed}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {animal.purpose}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-white">
                          {animal.currentWeightKg} Kg
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-400">
                          ${estValue.toLocaleString()} USD
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(animal)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Ver Ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
