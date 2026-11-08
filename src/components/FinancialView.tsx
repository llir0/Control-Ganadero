import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Milk,
  Beef,
  Wheat,
  Stethoscope,
  Users,
  Wrench,
  X,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { FinancialTransaction, Animal } from '../types';
import { CustomSelect, SelectOption } from './ui/CustomSelect';
import { SegmentedPicker, SegmentOption } from './ui/SegmentedPicker';
import { exportFinancialReportPDF } from '../lib/pdfExport';

interface FinancialViewProps {
  financials: FinancialTransaction[];
  animals: Animal[];
  onAddTransaction: (t: Omit<FinancialTransaction, 'id'>) => void;
  onDeleteTransaction?: (id: string) => void;
}

const CATEGORY_OPTIONS: SelectOption[] = [
  {
    value: 'Venta Ganado',
    label: 'Venta de Ganado',
    description: 'Ingresos por venta de novillos, vacas o toretes',
    icon: <Beef className="w-4 h-4" />,
    badge: 'Ingreso Principal',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    value: 'Venta Leche',
    label: 'Venta de Leche',
    description: 'Ingresos por ordeño diario y venta de lácteos',
    icon: <Milk className="w-4 h-4" />,
    badge: 'Recurrente',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    value: 'Alimento',
    label: 'Alimento y Forraje',
    description: 'Pastos de corte, concentrados, sales minerales',
    icon: <Wheat className="w-4 h-4" />,
    badge: 'Insumo',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    value: 'Medicamentos',
    label: 'Medicamentos y Veterinaria',
    description: 'Vacunas, desparasitantes, chequeos zootécnicos',
    icon: <Stethoscope className="w-4 h-4" />,
    badge: 'Sanidad',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    value: 'Salarios',
    label: 'Salarios y Nómina',
    description: 'Pagos a vaqueros, capataz y jornales',
    icon: <Users className="w-4 h-4" />,
    badge: 'Personal',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    value: 'Mantenimiento',
    label: 'Mantenimiento de Finca',
    description: 'Cercas, mangas, corrales, maquinaria e infraestructura',
    icon: <Wrench className="w-4 h-4" />,
    badge: 'Operación',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
  },
];

const TYPE_OPTIONS: SegmentOption<FinancialTransaction['type']>[] = [
  {
    value: 'Ingreso',
    label: 'Ingreso (+ USD)',
    icon: <ArrowUpRight className="w-4 h-4" />,
    activeColor: 'emerald',
  },
  {
    value: 'Egreso',
    label: 'Egreso (- USD)',
    icon: <ArrowDownRight className="w-4 h-4" />,
    activeColor: 'rose',
  },
];

export const FinancialView: React.FC<FinancialViewProps> = ({
  financials,
  animals,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<FinancialTransaction['type']>('Ingreso');
  const [category, setCategory] = useState<FinancialTransaction['category']>('Venta Ganado');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Calculate totals
  const totalIncome = financials
    .filter((f) => f.type === 'Ingreso')
    .reduce((acc, f) => acc + f.amountUSD, 0);

  const totalExpense = financials
    .filter((f) => f.type === 'Egreso')
    .reduce((acc, f) => acc + f.amountUSD, 0);

  const netBalance = totalIncome - totalExpense;

  // Active herd valuation estimate based on PDF metrics (~$1,100/head average for active cattle)
  const activeCount = animals.filter((a) => a.status === 'ACT').length;
  const estimatedHerdValue = activeCount * 1150;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      amountUSD: parseFloat(amount) || 0,
    });

    setDescription('');
    setAmount('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Control Financiero y Ventas de Finca</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Métricas contables, valor del hato activo, ingresos por venta de ganado/leche y egresos de operación.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => exportFinancialReportPDF(financials, animals)}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer"
            title="Descargar Libro Mayor y Reporte Contable en PDF"
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span>Exportar Contabilidad (PDF)</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Transacción</span>
          </motion.button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Ingresos</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">${totalIncome.toLocaleString()}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Egresos</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">${totalExpense.toLocaleString()}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Balance Neto</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-2xl font-black font-mono ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${netBalance.toLocaleString()}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Estimado del Hato</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">${estimatedHerdValue.toLocaleString()}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">({activeCount} cabezas activas en inventario)</p>
        </div>
      </div>

      {/* Transactions List Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Libro Mayor de Transacciones Financieras
          </h3>
          <span className="text-xs text-slate-400 font-mono">{financials.length} Registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Descripción</th>
                <th className="p-3.5 text-right">Monto ($ USD)</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {financials.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400">{f.date}</td>
                  <td className="p-3.5">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        f.type === 'Ingreso'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {f.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-200">{f.category}</td>
                  <td className="p-3.5 text-slate-300">{f.description}</td>
                  <td
                    className={`p-3.5 text-right font-mono font-bold text-sm ${
                      f.type === 'Ingreso' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {f.type === 'Ingreso' ? '+' : '-'}${f.amountUSD.toFixed(2)}
                  </td>
                  <td className="p-3.5 text-center">
                    {onDeleteTransaction && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar transacción "${f.description}"?`)) {
                            onDeleteTransaction(f.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-all"
                        title="Eliminar Transacción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
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
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Nueva Transacción Financiera</h3>
                    <p className="text-[11px] text-slate-400">Registra un flujo de caja en el libro contable</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                {/* Tipo de Movimiento Segmented */}
                <SegmentedPicker
                  label="Tipo de Movimiento"
                  value={type}
                  onChange={(val) => setType(val)}
                  options={TYPE_OPTIONS}
                />

                {/* Categoría Custom Select */}
                <CustomSelect
                  label="Categoría Contable"
                  value={category}
                  onChange={(val) => setCategory(val as any)}
                  options={CATEGORY_OPTIONS}
                />

                {/* Descripción Input */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Descripción del Movimiento
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Venta de novillos lote ceba #001"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm transition-all"
                    required
                  />
                </div>

                {/* Monto en USD Input */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Monto en $ USD
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold text-sm">
                      $
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="1250.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full min-h-[44px] pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono text-base font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/60 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Movimiento</span>
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

