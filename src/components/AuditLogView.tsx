import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, ShieldCheck, Search, Filter, Clock, UserCheck } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.workerName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'TODAS' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Auditoría, Bitácora y Trazabilidad de Empleados</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historial inmutable de cambios, atenciones médicas, movimientos de inventario y acciones por empleado.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por empleado, detalle o acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['TODAS', 'Ganado', 'Salud', 'Inventario', 'Finanzas', 'Trabajador'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/80">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay registros de auditoría que coincidan con el filtro.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {log.category}
                    </span>
                    <span className="font-extrabold text-white">{log.action}</span>
                  </div>
                  <p className="text-slate-300 font-medium">{log.details}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    Ejecutado por: <strong className="text-slate-300">{log.workerName}</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
