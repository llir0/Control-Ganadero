import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  DollarSign,
  Scale,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Building2,
  FileDown,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Truck,
  TrendingUp,
  CreditCard,
  FileText,
  BadgeCheck,
  ChevronRight,
  Info,
  Sliders,
} from 'lucide-react';
import { Animal, MarketPriceConfig } from '../types';
import {
  getStoredMarketPrices,
  addFinancialTransaction,
  saveStoredAnimal,
  addAuditLog,
} from '../lib/storage';
import { exportSalesInvoicePDF, SaleBatchInvoiceData } from '../lib/pdfExport';

interface CommercialSalesViewProps {
  animals: Animal[];
  onRefreshData: () => void;
  onOpenDetail: (animal: Animal) => void;
  onNavigateToValuation?: () => void;
  onOpenExportReports?: () => void;
}

export const CommercialSalesView: React.FC<CommercialSalesViewProps> = ({
  animals,
  onRefreshData,
  onOpenDetail,
  onNavigateToValuation,
  onOpenExportReports,
}) => {
  const [activeTab, setActiveTab] = useState<'nueva-venta' | 'historial'>('nueva-venta');
  const [prices] = useState<MarketPriceConfig>(getStoredMarketPrices());

  // Filter & Search in Animal Selection for Sale
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<string>('TODOS');
  const [readyOnlyFilter, setReadyOnlyFilter] = useState(false);

  // Selected Animals Basket for Sale
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [basePricePerKg, setBasePricePerKg] = useState<number>(prices.fatteningBullKgUSD || 2.15);
  const [shrinkageDiscountPercent, setShrinkageDiscountPercent] = useState<number>(0); // 0% to 5% transport merma
  const [buyerName, setBuyerName] = useState('Carnes y Ganados del Valle');
  const [invoiceNumber, setInvoiceNumber] = useState(`VTA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [paymentMethod, setPaymentMethod] = useState<'Transferencia Bancaria' | 'Efectivo' | 'Cheque' | 'Crédito a 30 días'>('Transferencia Bancaria');
  const [destination, setDestination] = useState('Frigorífico Metropolitano / Central de Carnes');
  const [saleNotes, setSaleNotes] = useState('Venta de lote comercial en pie con peso verificado en báscula.');

  // Confirmation Modal & Feedback State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSaleReceipt, setLastSaleReceipt] = useState<SaleBatchInvoiceData | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // History tab filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // 1. Animals pool
  const activeAnimals = useMemo(() => {
    return animals.filter((a) => a.status === 'ACT');
  }, [animals]);

  const soldAnimals = useMemo(() => {
    return animals.filter(
      (a) => a.status === 'IAC' && (a.disposalCause === 'Vendido' || Boolean(a.saleDate))
    );
  }, [animals]);

  // Animals ready for sale (Ceba >= target weight or >= 500kg)
  const readyForSaleAnimals = useMemo(() => {
    return activeAnimals.filter((a) => {
      if (a.purpose === 'CEBA' && a.currentWeightKg >= (a.targetWeightKg || 500)) return true;
      if (a.currentWeightKg >= 520) return true;
      return false;
    });
  }, [activeAnimals]);

  // 2. Filtered list for "Nueva Venta"
  const availableAnimalsForSale = useMemo(() => {
    return activeAnimals.filter((a) => {
      if (readyOnlyFilter) {
        const isReady =
          (a.purpose === 'CEBA' && a.currentWeightKg >= (a.targetWeightKg || 500)) ||
          a.currentWeightKg >= 520;
        if (!isReady) return false;
      }

      if (purposeFilter !== 'TODOS' && a.purpose !== purposeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTag = a.id.toLowerCase().includes(q);
        const matchesName = a.name?.toLowerCase().includes(q) || false;
        const matchesBreed = a.breed.toLowerCase().includes(q);
        const matchesCorral = a.corralName.toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesBreed && !matchesCorral) return false;
      }

      return true;
    });
  }, [activeAnimals, readyOnlyFilter, purposeFilter, searchQuery]);

  // 3. Selected Batch Calculations
  const selectedBatch = useMemo(() => {
    const list = activeAnimals.filter((a) => selectedAnimalIds.includes(a.id));
    const totalKg = list.reduce((acc, a) => acc + a.currentWeightKg, 0);
    const totalArrobas = Math.round((totalKg / 25) * 10) / 10;
    const avgWeightKg = list.length > 0 ? Math.round(totalKg / list.length) : 0;

    const grossUSD = totalKg * basePricePerKg;
    const discountUSD = grossUSD * (shrinkageDiscountPercent / 100);
    const netUSD = grossUSD - discountUSD;

    return {
      list,
      count: list.length,
      totalKg,
      totalArrobas,
      avgWeightKg,
      grossUSD,
      discountUSD,
      netUSD,
    };
  }, [activeAnimals, selectedAnimalIds, basePricePerKg, shrinkageDiscountPercent]);

  // 4. Lifetime Sales Metrics
  const lifetimeSalesMetrics = useMemo(() => {
    const totalRevenueUSD = soldAnimals.reduce((acc, a) => acc + (a.saleValueUSD || 0), 0);
    const totalKgSold = soldAnimals.reduce((acc, a) => acc + a.currentWeightKg, 0);
    const avgPricePerKg = totalKgSold > 0 ? totalRevenueUSD / totalKgSold : 0;
    const avgRevenuePerHead = soldAnimals.length > 0 ? totalRevenueUSD / soldAnimals.length : 0;

    return {
      totalCount: soldAnimals.length,
      totalRevenueUSD,
      totalKgSold,
      avgPricePerKg,
      avgRevenuePerHead,
    };
  }, [soldAnimals]);

  // Toggle Selection
  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimalIds((prev) =>
      prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId]
    );
  };

  const handleSelectAllReady = () => {
    const readyIds = readyForSaleAnimals.map((a) => a.id);
    setSelectedAnimalIds(Array.from(new Set([...selectedAnimalIds, ...readyIds])));
  };

  const handleClearSelection = () => {
    setSelectedAnimalIds([]);
  };

  // Execute Sale Transaction
  const handleExecuteSale = () => {
    if (selectedBatch.count === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Record income transaction in Financial Ledger
    addFinancialTransaction(
      {
        date: todayStr,
        type: 'Ingreso',
        category: 'Venta Ganado',
        description: `Venta comercial de ${selectedBatch.count} cabezas a ${buyerName} (Factura #${invoiceNumber}, ${selectedBatch.totalKg} Kg en pie a $${basePricePerKg.toFixed(2)}/Kg)`,
        amountUSD: Math.round(selectedBatch.netUSD),
      },
      'Gerente Comercial de Ventas'
    );

    // 2. Update each sold animal to IAC status
    selectedBatch.list.forEach((animal) => {
      const animalGrossVal = animal.currentWeightKg * basePricePerKg;
      const animalNetVal = Math.round(animalGrossVal * (1 - shrinkageDiscountPercent / 100));

      saveStoredAnimal(
        {
          ...animal,
          status: 'IAC',
          saleDate: todayStr,
          saleValueUSD: animalNetVal,
          disposalCause: 'Vendido',
          generalNotes: `${animal.generalNotes || ''}\n[Venta ${todayStr}]: Vendido a ${buyerName} bajo factura #${invoiceNumber} a $${basePricePerKg.toFixed(2)}/Kg.`.trim(),
        },
        'Gerente Comercial de Ventas'
      );
    });

    // 3. Log Audit
    addAuditLog(
      'Venta de Ganado',
      'Ganado',
      `Liquidación de lote de ${selectedBatch.count} animales por $${Math.round(selectedBatch.netUSD).toLocaleString()} USD a ${buyerName} (Acta #${invoiceNumber}).`,
      'Gerente Comercial'
    );

    // 4. Prepare receipt data for PDF export
    const receiptData: SaleBatchInvoiceData = {
      buyerName,
      invoiceNumber,
      paymentMethod,
      destination,
      notes: saleNotes,
      saleDate: todayStr,
      pricePerKgUSD: basePricePerKg,
      discountPercentage: shrinkageDiscountPercent,
      animals: selectedBatch.list,
      totalKg: selectedBatch.totalKg,
      totalUSD: selectedBatch.netUSD,
    };

    setLastSaleReceipt(receiptData);
    setSuccessToast(
      `🎉 ¡Venta completada con éxito! Se acreditaron $${Math.round(selectedBatch.netUSD).toLocaleString()} USD en finanzas y se dieron de baja ${selectedBatch.count} animales.`
    );

    // Reset selection and close modal
    setSelectedAnimalIds([]);
    setShowConfirmModal(false);
    onRefreshData();

    // Auto-generate next invoice number
    setInvoiceNumber(`VTA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  };

  // Revert a sold animal (Restore to ACT)
  const handleRevertSoldAnimal = (animal: Animal) => {
    if (
      !confirm(
        `¿Deseas revertir la venta del animal #${animal.id} (${animal.name || 'Sin nombre'}) y reincorporarlo al hato activo?`
      )
    ) {
      return;
    }

    saveStoredAnimal(
      {
        ...animal,
        status: 'ACT',
        saleDate: undefined,
        saleValueUSD: undefined,
        disposalCause: undefined,
      },
      'Administrador'
    );

    addAuditLog(
      'Reversión de Venta',
      'Ganado',
      `Se canceló la venta del animal #${animal.id} y fue reintegrado al hato activo.`,
      'Administrador'
    );

    onRefreshData();
    setSuccessToast(`Animal #${animal.id} reincorporado exitosamente al hato activo.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                Módulo Oficial de Ventas & Liquidación
              </span>
              <span className="text-xs text-slate-400">Comercialización Ganadera en Pie</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Gestión Comercial & Venta de Ganado
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Selecciona lotes de ganado para beneficio o subasta, liquida peso en báscula, genera actas oficiales de venta y actualiza automáticamente el libro contable de la finca.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToValuation && (
              <button
                type="button"
                onClick={onNavigateToValuation}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                title="Consultar tasación zootécnica y proyecciones a 3, 6 y 12 meses"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Ver Valuación Zootécnica</span>
              </button>
            )}

            {onOpenExportReports && (
              <button
                type="button"
                onClick={onOpenExportReports}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Libro Contable</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('nueva-venta')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'nueva-venta'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Nueva Liquidación & Venta de Lote</span>
            {selectedBatch.count > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white text-emerald-950 font-mono text-[10px] font-bold">
                {selectedBatch.count} sel.
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historial de Ventas & Facturación</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-300 font-mono text-[10px]">
              {soldAnimals.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner with Download PDF */}
      {successToast && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl text-emerald-200 text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in flex-wrap shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>

          <div className="flex items-center gap-2">
            {lastSaleReceipt && (
              <button
                type="button"
                onClick={() => exportSalesInvoicePDF(lastSaleReceipt)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Acta Oficial PDF</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Lifetime Sales */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Ingresos Históricos por Ventas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ${Math.round(lifetimeSalesMetrics.totalRevenueUSD).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-bold">USD</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Registrados en finanzas
          </span>
        </div>

        {/* Total Animals Sold */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cabezas Vendidas (Total)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {lifetimeSalesMetrics.totalCount}
            </span>
            <span className="text-xs text-slate-400 font-bold">Animales</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {lifetimeSalesMetrics.totalKgSold.toLocaleString()} Kg comercializados
          </span>
        </div>

        {/* Animals Ready for Market */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Listos para Beneficio / Salida
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {readyForSaleAnimals.length}
            </span>
            <span className="text-xs text-slate-400 font-bold">Cabezas</span>
          </div>
          <span className="text-[10px] text-amber-300/80 block">
            Peso comercial &gt; 500 Kg
          </span>
        </div>

        {/* Average Price per Kg */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Precio Promedio en Pie
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-teal-400 font-mono">
              ${basePricePerKg.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-bold">USD / Kg</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            Referencia Macho Ceba
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: NUEVA LIQUIDACIÓN & VENTA DE LOTE                   */}
      {/* ========================================================= */}
      {activeTab === 'nueva-venta' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cattle Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    Selección de Ganado en Pie para Venta
                  </h3>
                  <p className="text-xs text-slate-400">
                    Marca los animales que formarán parte del lote comercial a despachar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllReady}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Selecciona automáticamente todos los animales que ya alcanzaron el peso objetivo de venta"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>+ Listos ({readyForSaleAnimals.length})</span>
                  </button>

                  {selectedAnimalIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por arete, nombre, corral..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setReadyOnlyFilter(!readyOnlyFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      readyOnlyFilter
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⭐ Solo Listos (&gt;500 Kg)
                  </button>

                  {['TODOS', 'CEBA', 'CRIA', 'LECHE'].map((purp) => (
                    <button
                      key={purp}
                      type="button"
                      onClick={() => setPurposeFilter(purp)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        purposeFilter === purp
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {purp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animals Table */}
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 sticky top-0 z-10 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
                      <th className="py-2.5 px-3">Animal / Arete</th>
                      <th className="py-2.5 px-3">Propósito & Raza</th>
                      <th className="py-2.5 px-3 text-right">Peso en Pie</th>
                      <th className="py-2.5 px-3 text-right">Valor Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {availableAnimalsForSale.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No se encontraron animales activos con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      availableAnimalsForSale.map((animal) => {
                        const isSelected = selectedAnimalIds.includes(animal.id);
                        const isReady =
                          (animal.purpose === 'CEBA' && animal.currentWeightKg >= (animal.targetWeightKg || 500)) ||
                          animal.currentWeightKg >= 520;
                        const estValueUSD = Math.round(animal.currentWeightKg * basePricePerKg);

                        return (
                          <tr
                            key={animal.id}
                            onClick={() => toggleAnimalSelection(animal.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-950/40 text-white font-medium'
                                : 'hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by row onClick
                                className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-amber-400 font-mono">#{animal.id}</span>
                                <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                                  {animal.name || 'Sin nombre'}
                                </span>
                                {isReady && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                    Listo
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {animal.corralName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                                  animal.purpose === 'CEBA'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : animal.purpose === 'CRIA'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {animal.purpose}
                              </span>
                              <span className="text-[10px] text-slate-400">{animal.breed}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-white block">{animal.currentWeightKg} Kg</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ~{Math.round((animal.currentWeightKg / 25) * 10) / 10} @
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-emerald-400 font-mono block">
                                ${estValueUSD.toLocaleString()}
                              </span>
                              <span className="text-[9px] text-slate-500">USD</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  Mostrando {availableAnimalsForSale.length} de {activeAnimals.length} animales activos
                </span>
                <span className="font-semibold text-emerald-400">
                  {selectedAnimalIds.length} cabezas seleccionadas
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Liquidation Basket & Buyer Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-24">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Liquidación de Lote</h3>
                    <span className="text-xs text-slate-400">Canasta de Venta Comercial</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {selectedBatch.count} Cabezas
                </span>
              </div>

              {/* Price & Commercial Parameters */}
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Condiciones Comerciales de Venta
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Precio Negociado ($/Kg)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0.5"
                        value={basePricePerKg}
                        onChange={(e) => setBasePricePerKg(Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white font-mono font-bold focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Merma / Descuento (%)
                    </label>
                    <select
                      value={shrinkageDiscountPercent}
                      onChange={(e) => setShrinkageDiscountPercent(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-emerald-500"
                    >
                      <option value={0}>0% (Sin Merma)</option>
                      <option value={1}>1% (Transporte corto)</option>
                      <option value={2}>2% (Transporte medio)</option>
                      <option value={3}>3% (Báscula en destino)</option>
                      <option value={5}>5% (Desbaste reglamentario)</option>
                    </select>
                  </div>
                </div>

                {/* Quick price presets */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                  <span className="text-slate-500">Precios rápidos:</span>
                  {[2.05, 2.15, 2.25, 2.35, 2.50].map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setBasePricePerKg(pr)}
                      className={`px-2 py-0.5 rounded font-mono ${
                        basePricePerKg === pr
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      ${pr.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Batch Totals Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Peso Total en Pie:</span>
                  <span className="text-white font-bold font-mono">
                    {selectedBatch.totalKg.toLocaleString()} Kg (~{selectedBatch.totalArrobas} @)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Peso Promedio por Cabeza:</span>
                  <span className="text-white font-bold font-mono">
                    {selectedBatch.avgWeightKg} Kg / animal
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Bruto:</span>
                  <span className="text-white font-mono">
                    ${Math.round(selectedBatch.grossUSD).toLocaleString()} USD
                  </span>
                </div>
                {shrinkageDiscountPercent > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Descuento Merma ({shrinkageDiscountPercent}%):</span>
                    <span className="font-mono">
                      -${Math.round(selectedBatch.discountUSD).toLocaleString()} USD
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between">
                  <span className="font-bold text-white text-sm">TOTAL LIQUIDACIÓN NETA:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400 font-mono block">
                      ${Math.round(selectedBatch.netUSD).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">USD</span>
                  </div>
                </div>
              </div>

              {/* Buyer & Transaction Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Comprador / Frigorífico / Subasta
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ej. Frigorífico Guadalupe, Carnes del Valle"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      No. Acta / Factura
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Forma de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-emerald-500"
                    >
                      <option value="Transferencia Bancaria">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Crédito a 30 días">Crédito 30d</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Destino / Centro de Faenado
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej. Frigorífico Metropolitano / Central de Carnes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={selectedBatch.count === 0}
                  onClick={() => setShowConfirmModal(true)}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                    selectedBatch.count === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  <BadgeCheck className="w-5 h-5" />
                  <span>
                    {selectedBatch.count === 0
                      ? 'Selecciona animales para liquidar'
                      : `Confirmar Venta de ${selectedBatch.count} Cabezas • $${Math.round(selectedBatch.netUSD).toLocaleString()} USD`}
                  </span>
                </button>

                {selectedBatch.count > 0 && (
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Al confirmar, los animales pasarán a estado Vendido (IAC) y se creará el ingreso financiero automáticamente.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: HISTORIAL DE VENTAS & FACTURACIÓN                  */}
      {/* ========================================================= */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Historial de Animales Liquidados & Ventas Realizadas
                </h3>
                <p className="text-xs text-slate-400">
                  Registro histórico de cabezas comercializadas, valores de liquidación y trazabilidad contable.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Buscar en historial por arete..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Sold Animals Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Fecha de Venta</th>
                    <th className="py-2.5 px-3">Arete / Animal</th>
                    <th className="py-2.5 px-3">Raza & Sexo</th>
                    <th className="py-2.5 px-3">Propósito</th>
                    <th className="py-2.5 px-3 text-right">Peso en Venta</th>
                    <th className="py-2.5 px-3 text-right">Valor Venta (USD)</th>
                    <th className="py-2.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {soldAnimals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                        <p className="text-sm font-semibold text-slate-400">Aún no hay ventas registradas.</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Ve a la pestaña "Nueva Liquidación" para seleccionar animales y ejecutar tu primera venta.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    soldAnimals
                      .filter((a) => {
                        if (!historySearchQuery.trim()) return true;
                        const q = historySearchQuery.toLowerCase();
                        return (
                          a.id.toLowerCase().includes(q) ||
                          (a.name && a.name.toLowerCase().includes(q)) ||
                          a.breed.toLowerCase().includes(q)
                        );
                      })
                      .map((animal) => (
                        <tr key={animal.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {animal.saleDate || animal.updatedAt.slice(0, 10)}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => onOpenDetail(animal)}
                              className="text-left group cursor-pointer"
                            >
                              <span className="font-bold text-amber-400 font-mono block group-hover:text-amber-300">
                                TAG #{animal.id}
                              </span>
                              <span className="text-slate-200 font-semibold block text-[11px]">
                                {animal.name || 'Sin nombre'}
                              </span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-white block">{animal.breed}</span>
                            <span className="text-[10px] text-slate-500">
                              {animal.sex === 'M' ? 'Macho ♂' : 'Hembra ♀'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {animal.purpose}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-white block">{animal.currentWeightKg} Kg</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ~{Math.round((animal.currentWeightKg / 25) * 10) / 10} @
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-emerald-400 font-mono block text-sm">
                              ${(animal.saleValueUSD || Math.round(animal.currentWeightKg * prices.fatteningBullKgUSD)).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">USD</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRevertSoldAnimal(animal)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                              title="Revertir venta si se liquidó por error"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revertir</span>
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL                                        */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <BadgeCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Confirmar Liquidación de Venta</h3>
                    <p className="text-xs text-slate-400">Verifica los datos antes de emitir la transacción</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Comprador:</span>
                  <span className="text-white font-bold">{buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Factura / Acta No.:</span>
                  <span className="text-amber-400 font-mono font-bold">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forma de Pago:</span>
                  <span className="text-slate-200">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cantidad de Animales:</span>
                  <span className="text-white font-bold">{selectedBatch.count} Cabezas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Biomasa en Báscula:</span>
                  <span className="text-white font-mono font-bold">
                    {selectedBatch.totalKg.toLocaleString()} Kg (~{selectedBatch.totalArrobas} @)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Precio Base:</span>
                  <span className="text-teal-400 font-mono font-bold">${basePricePerKg.toFixed(2)} USD/Kg</span>
                </div>
                {shrinkageDiscountPercent > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Merma aplicada:</span>
                    <span>{shrinkageDiscountPercent}%</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between text-sm">
                  <span className="font-bold text-white">TOTAL A INGRESAR:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ${Math.round(selectedBatch.netUSD).toLocaleString()} USD
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
                ⚠️ <strong>Aviso Importante:</strong> Esta acción dará de baja los {selectedBatch.count} animales del hato activo pasándolos al archivo histórico de vendidos (IAC) y sumará automáticamente el ingreso al Libro Financiero de la hacienda.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSale}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar & Emitir Venta</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
