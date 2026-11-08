import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Scan,
  Search,
  Bell,
  User,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  Scale,
  Syringe,
  FileDown,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  onOpenScanner: () => void;
  onResetData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pendingTasksCount: number;
  smartAlertsCount?: number;
  onOpenMangaMode?: () => void;
  onOpenBatchTreatment?: () => void;
  onOpenExportReports?: () => void;
  onOpenSmartAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onResetData,
  searchQuery,
  setSearchQuery,
  pendingTasksCount,
  smartAlertsCount = 0,
  onOpenMangaMode,
  onOpenBatchTreatment,
  onOpenExportReports,
  onOpenSmartAlerts,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentUser: UserProfile = {
    id: 'u-1',
    name: 'Jahir Janchez',
    role: 'Propietario / Administrador',
    farmName: 'Finca Santa Gertrudis',
    email: 'JahirJanchez@gmail.com',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white font-bold text-xl"
            >
              🐄
            </motion.div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  Control Ganadero Pro
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {currentUser.farmName} • Sistema de Gestión e Inspección
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por arete #, raza, hierro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Actions & Utilities */}
          <div className="hidden lg:flex items-center space-x-2">
            {/* Smart Alerts Bell Button */}
            {onOpenSmartAlerts && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenSmartAlerts}
                className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                  smartAlertsCount > 0
                    ? 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Centro de Alertas Inteligentes & Sanidad"
              >
                <Bell className={`w-4 h-4 ${smartAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                <span>Alertas</span>
                {smartAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono font-bold text-[10px]">
                    {smartAlertsCount}
                  </span>
                )}
              </motion.button>
            )}

            {/* Quick QR Scan Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Escanear QR</span>
            </motion.button>

            {/* Jetbov Fast Scale Button */}
            {onOpenMangaMode && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenMangaMode}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Modo Báscula y Manga Jetbov"
              >
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>Báscula Rápida</span>
              </motion.button>
            )}

            {/* iRancho Batch Treatment Button */}
            {onOpenBatchTreatment && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenBatchTreatment}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Tratamientos Colectivos por Lote"
              >
                <Syringe className="w-4 h-4 text-amber-400" />
                <span>Tratamiento Lote</span>
              </motion.button>
            )}

            {/* Export Reports PDF Button */}
            {onOpenExportReports && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenExportReports}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Exportar Informes Clínicos y Financieros en Formato PDF"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Exportar PDF</span>
              </motion.button>
            )}

            {/* Reset Defaults button */}
            <button
              onClick={onResetData}
              title="Restablecer datos predeterminados"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700/80 border border-emerald-400/30 flex items-center justify-center font-bold text-xs text-emerald-100 shadow-sm">
                  JJ
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-3 z-50 text-slate-100"
                  >
                    <div className="p-2 border-b border-slate-700/80 mb-2">
                      <p className="font-bold text-xs text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-emerald-400 font-medium">{currentUser.role}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs px-2 py-1.5 text-slate-300 rounded-lg bg-slate-900/50">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Auditoría de Sesión
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">ACTIVO</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={onOpenScanner}
              className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
            >
              <Scan className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3"
          >
            <div className="pt-2">
              <input
                type="text"
                placeholder="Buscar por arete #, raza, hierro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onOpenSmartAlerts && (
                <button
                  onClick={() => {
                    onOpenSmartAlerts();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-semibold"
                >
                  <Bell className="w-4 h-4 text-rose-400" />
                  <span>Alertas ({smartAlertsCount})</span>
                </button>
              )}
              <button
                onClick={() => {
                  onOpenScanner();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
              >
                <Scan className="w-4 h-4" />
                <span>Escanear QR</span>
              </button>
            </div>
            {onOpenExportReports && (
              <button
                onClick={() => {
                  onOpenExportReports();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
              >
                <FileDown className="w-4 h-4 text-emerald-400" />
                <span>Exportar Informes en PDF (Clínico & Contable)</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
