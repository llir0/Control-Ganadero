import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wheat,
  AlertTriangle,
  Plus,
  RefreshCcw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  DollarSign,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { FeedItem } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { SegmentedPicker, SegmentOption } from './ui/SegmentedPicker';

interface FeedInventoryViewProps {
  feedItems: FeedItem[];
  onSaveFeedItem: (item: FeedItem) => void;
  onDeleteFeedItem?: (itemId: string) => void;
  onRegisterExpense?: (amountUSD: number, description: string) => void;
}

const CATEGORY_OPTIONS: SelectOption[] = [
  {
    value: 'Concentrado',
    label: 'Concentrado Balanceado',
    description: 'Alta densidad energética y proteica',
    icon: <Package className="w-4 h-4 text-amber-400" />,
    badge: 'Nutrición',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'Pasto de Corte',
    label: 'Pasto de Corte / Fresco',
    description: 'Forraje picado para comederos',
    icon: <Wheat className="w-4 h-4 text-emerald-400" />,
    badge: 'Forraje',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'Sales Minerales',
    label: 'Sales Minerales & Vitaminas',
    description: 'Macro y microminerales esenciales',
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    badge: 'Minerales',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'Pacas Heno',
    label: 'Pacas de Heno / Forraje Seco',
    description: 'Fibra efectiva para rumiantes',
    icon: <Layers className="w-4 h-4 text-yellow-400" />,
    badge: 'Heno',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  {
    value: 'Ensilaje',
    label: 'Ensilaje de Maíz / Sorgo',
    description: 'Fermentación anaeróbica conservada',
    icon: <Wheat className="w-4 h-4 text-lime-400" />,
    badge: 'Silo',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  },
  {
    value: 'Suplemento',
    label: 'Suplemento Proteico / Melaza',
    description: 'Corrección estacional de dieta',
    icon: <Package className="w-4 h-4 text-orange-400" />,
    badge: 'Suplemento',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
];

const UNIT_OPTIONS: SegmentOption<FeedItem['unit']>[] = [
  { value: 'Kg', label: 'Kilogramos (Kg)' },
  { value: 'Sacos', label: 'Sacos' },
  { value: 'Pacas', label: 'Pacas' },
  { value: 'Libras', label: 'Lbs' },
];

export const FeedInventoryView: React.FC<FeedInventoryViewProps> = ({
  feedItems,
  onSaveFeedItem,
  onDeleteFeedItem,
  onRegisterExpense,
}) => {
  const [selectedRestockItem, setSelectedRestockItem] = useState<FeedItem | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [registerInFinances, setRegisterInFinances] = useState(true);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FeedItem['category']>('Concentrado');
  const [currentStockKg, setCurrentStockKg] = useState('500');
  const [unit, setUnit] = useState<FeedItem['unit']>('Kg');
  const [minThresholdKg, setMinThresholdKg] = useState('100');
  const [dailyUsageKg, setDailyUsageKg] = useState('25');
  const [costPerUnitUSD, setCostPerUnitUSD] = useState('0.85');
  const [supplier, setSupplier] = useState('Agroinsumos del Sureste');

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Concentrado');
    setCurrentStockKg('500');
    setUnit('Kg');
    setMinThresholdKg('100');
    setDailyUsageKg('25');
    setCostPerUnitUSD('0.85');
    setSupplier('Agroinsumos del Sureste');
    setShowItemModal(true);
  };

  const openEditModal = (item: FeedItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setCurrentStockKg(item.currentStockKg.toString());
    setUnit(item.unit);
    setMinThresholdKg(item.minThresholdKg.toString());
    setDailyUsageKg(item.dailyUsageKg.toString());
    setCostPerUnitUSD(item.costPerUnitUSD.toString());
    setSupplier(item.supplier);
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const itemToSave: FeedItem = {
      id: editingItem ? editingItem.id : `feed-${Date.now()}`,
      name,
      category,
      currentStockKg: parseFloat(currentStockKg) || 0,
      unit,
      minThresholdKg: parseFloat(minThresholdKg) || 50,
      dailyUsageKg: parseFloat(dailyUsageKg) || 10,
      costPerUnitUSD: parseFloat(costPerUnitUSD) || 1.0,
      supplier: supplier || 'Proveedor Local',
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    onSaveFeedItem(itemToSave);
    setShowItemModal(false);
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockItem || !restockAmount) return;

    const amount = parseFloat(restockAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updated: FeedItem = {
      ...selectedRestockItem,
      currentStockKg: selectedRestockItem.currentStockKg + amount,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    onSaveFeedItem(updated);

    // Auto-record financial expense if selected
    if (registerInFinances && onRegisterExpense) {
      const estimatedCost = Math.round(amount * (selectedRestockItem.costPerUnitUSD || 0.85));
      if (estimatedCost > 0) {
        onRegisterExpense(
          estimatedCost,
          `Compra / Reabastecimiento de ${amount} ${selectedRestockItem.unit} de ${selectedRestockItem.name} (${selectedRestockItem.supplier})`
        );
      }
    }

    setSelectedRestockItem(null);
    setRestockAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wheat className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white">Control de Alimentos y Suministros</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de inventario de forrajes, concentrados, sales minerales, días de reserva y reabastecimiento.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 shrink-0 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Insumo / Alimento</span>
        </motion.button>
      </div>

      {/* Grid of feed items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feedItems.map((item) => {
          const isLowStock = item.currentStockKg <= item.minThresholdKg;
          const daysRemaining =
            item.dailyUsageKg > 0 ? Math.floor(item.currentStockKg / item.dailyUsageKg) : 999;

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              className={`bg-slate-900/90 rounded-2xl border p-5 space-y-4 shadow-xl transition-all ${
                isLowStock ? 'border-amber-500/50 bg-slate-900/95' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.category}
                  </span>
                  <h3 className="font-extrabold text-base text-white mt-1.5">{item.name}</h3>
                </div>

                <div className="flex items-center space-x-1">
                  {isLowStock && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> STOCK BAJO
                    </span>
                  )}
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Editar Insumo"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  {onDeleteFeedItem && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar insumo ${item.name}?`)) {
                          onDeleteFeedItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-all"
                      title="Eliminar Insumo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stock stats */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock Disponible</span>
                  <span className={`text-lg font-black font-mono ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {item.currentStockKg} {item.unit}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Días de Reserva</span>
                  <span className="text-lg font-black text-slate-200 font-mono">
                    ~{daysRemaining} días
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                <div className="flex justify-between">
                  <span>Uso Diario Estimado:</span>
                  <strong className="text-slate-200">{item.dailyUsageKg} {item.unit}/día</strong>
                </div>
                <div className="flex justify-between">
                  <span>Umbral Mínimo Alerta:</span>
                  <strong className="text-slate-200">{item.minThresholdKg} {item.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Costo Unitario:</span>
                  <strong className="text-emerald-400">${item.costPerUnitUSD} / {item.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <strong className="text-slate-300">{item.supplier}</strong>
                </div>
              </div>

              <button
                onClick={() => setSelectedRestockItem(item)}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-md active:scale-98"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reabastecer Inventario</span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Add / Edit Feed Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 space-y-5 shadow-2xl shadow-black/80"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Wheat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      {editingItem ? 'Editar Insumo / Alimento' : 'Agregar Nuevo Insumo a Inventario'}
                    </h3>
                    <p className="text-[11px] text-slate-400">Gestión de forrajes, concentrados y suplementación</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Nombre del Insumo / Alimento *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Sal Mineral 12% Fósforo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm transition-all"
                    required
                  />
                </div>

                <CustomSelect
                  label="Categoría de Insumo"
                  value={category}
                  onChange={(val) => setCategory(val as any)}
                  options={CATEGORY_OPTIONS}
                />

                <SegmentedPicker
                  label="Unidad de Medida"
                  value={unit}
                  onChange={(val) => setUnit(val)}
                  options={UNIT_OPTIONS}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Stock Inicial / Actual ({unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="500"
                      value={currentStockKg}
                      onChange={(e) => setCurrentStockKg(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Consumo Diario Estimado ({unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="25"
                      value={dailyUsageKg}
                      onChange={(e) => setDailyUsageKg(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Umbral Mínimo de Alerta ({unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="100"
                      value={minThresholdKg}
                      onChange={(e) => setMinThresholdKg(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Costo Unitario ($ USD por {unit})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.85"
                      value={costPerUnitUSD}
                      onChange={(e) => setCostPerUnitUSD(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Proveedor Habitual
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Agroinsumos del Sureste"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-950/60 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Insumo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {selectedRestockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 space-y-5 shadow-2xl shadow-black/80"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <RefreshCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Reabastecer Insumo</h3>
                    <p className="text-[11px] text-slate-400">{selectedRestockItem.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRestockItem(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Stock actual en bodega:</span>
                <strong className="text-emerald-400 font-mono text-sm">
                  {selectedRestockItem.currentStockKg} {selectedRestockItem.unit}
                </strong>
              </div>

              <form onSubmit={handleRestock} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Cantidad a Ingresar ({selectedRestockItem.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej: 500"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono text-lg font-black focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    required
                    autoFocus
                  />
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerInFinances}
                    onChange={(e) => setRegisterInFinances(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-[11px]">
                    <span className="font-semibold text-white block">
                      Registrar egreso contable en Finanzas
                    </span>
                    <span className="text-slate-400">
                      Gasto estimado: ~${Math.round((parseFloat(restockAmount) || 0) * (selectedRestockItem.costPerUnitUSD || 0.85))} USD en {selectedRestockItem.name}
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRestockItem(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Ingreso</span>
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

