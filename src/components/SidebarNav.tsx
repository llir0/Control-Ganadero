import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Tag,
  Users,
  Grid,
  Wheat,
  DollarSign,
  ClipboardList,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Heart,
  Compass,
  TrendingUp,
  Map,
  ShoppingBag,
} from 'lucide-react';

export type TabType =
  | 'animals'
  | 'farm-map'
  | 'manga'
  | 'reproduction'
  | 'pastures'
  | 'valuation'
  | 'sales'
  | 'workers'
  | 'corrals'
  | 'feed'
  | 'finances'
  | 'audit';

interface SidebarNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeAnimalsCount: number;
  lowStockItemsCount: number;
  pendingTasksCount: number;
  readyForSaleCount?: number;
  smartAlertsCount?: number;
  onOpenSmartAlerts?: () => void;
  onAddNewAnimal: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  activeAnimalsCount,
  lowStockItemsCount,
  pendingTasksCount,
  readyForSaleCount = 0,
  smartAlertsCount = 0,
  onOpenSmartAlerts,
  onAddNewAnimal,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpandedManual, setIsExpandedManual] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
        setIsExpandedManual(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    {
      id: 'animals' as TabType,
      label: 'Ganado & Hato',
      icon: Tag,
      badge: smartAlertsCount > 0 ? `${activeAnimalsCount} (${smartAlertsCount} ⚠️)` : activeAnimalsCount,
      badgeColor: smartAlertsCount > 0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'farm-map' as TabType,
      label: 'Mapa de la Finca (D3)',
      icon: Map,
      badge: 'D3 Geo',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'pastures' as TabType,
      label: 'Potreros & Pasturas',
      icon: Compass,
      badge: 'Farmbrite',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    },
    {
      id: 'manga' as TabType,
      label: 'Manga & Báscula Rápida',
      icon: Scale,
      badge: 'Jetbov',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'reproduction' as TabType,
      label: 'Reproducción & Pedigree',
      icon: Heart,
      badge: 'CattleMax',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'valuation' as TabType,
      label: 'Valuación Comercial',
      icon: TrendingUp,
      badge: 'Patrimonio',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'sales' as TabType,
      label: 'Ventas de Ganado',
      icon: ShoppingBag,
      badge: readyForSaleCount > 0 ? `${readyForSaleCount} Listos` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'workers' as TabType,
      label: 'Trabajadores & Encargados',
      icon: Users,
    },
    {
      id: 'corrals' as TabType,
      label: 'Corrales & Aforo',
      icon: Grid,
    },
    {
      id: 'feed' as TabType,
      label: 'Alimentos e Inventario',
      icon: Wheat,
      badge: lowStockItemsCount > 0 ? `${lowStockItemsCount} Bajo` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'finances' as TabType,
      label: 'Finanzas & Libro Mayor',
      icon: DollarSign,
    },
    {
      id: 'audit' as TabType,
      label: 'Auditoría & Bitácora',
      icon: ClipboardList,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} Pend` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
  ];

  const activeTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabObj.icon;

  const showCompactMobile = isScrolled && !isExpandedManual;

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-2 sm:p-3 shadow-xl transition-all duration-300">
      {/* Mobile Scrolled Compact View */}
      {showCompactMobile && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden flex items-center justify-between gap-2"
        >
          <button
            onClick={() => setIsExpandedManual(true)}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-800/90 text-white text-xs font-bold border border-slate-700/80 flex-1 min-w-0 hover:bg-slate-700/80 transition-all text-left"
          >
            <ActiveIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{activeTabObj.label}</span>
            {activeTabObj.badge !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${activeTabObj.badgeColor}`}
              >
                {activeTabObj.badge}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-auto" />
          </button>

          <button
            onClick={onAddNewAnimal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shrink-0 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-100" />
            <span>+ Animal</span>
          </button>
        </motion.div>
      )}

      {/* Full View (always on desktop, or mobile when expanded/at top) */}
      <div className={showCompactMobile ? 'hidden md:block' : 'block'}>
        {/* Quick Action Button & Mobile Minimizer Header */}
        <div className="mb-3 px-1 flex items-center justify-between gap-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddNewAnimal}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/40 text-xs transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Registrar Nuevo Animal</span>
          </motion.button>

          {/* Minimize toggle button on mobile when scrolled */}
          {isScrolled && (
            <button
              onClick={() => setIsExpandedManual(false)}
              className="md:hidden p-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 shrink-0"
              title="Minimizar menú"
            >
              <ChevronUp className="w-4 h-4 text-emerald-400" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-1.5 md:gap-1 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsExpandedManual(false);
                }}
                className={`relative flex items-center justify-between px-2.5 sm:px-3 py-2.5 rounded-xl text-xs font-medium transition-all w-full text-left ${
                  isActive
                    ? 'text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {/* Animated selection background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 via-slate-800 to-slate-800 border border-emerald-500/30 rounded-xl z-0"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative z-10 flex items-center space-x-2 min-w-0 pr-1">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Smart Alerts Widget */}
        {smartAlertsCount > 0 && onOpenSmartAlerts && (
          <button
            type="button"
            onClick={onOpenSmartAlerts}
            className="mt-3 w-full p-2.5 rounded-xl bg-gradient-to-r from-rose-950/70 to-slate-900 border border-rose-500/40 text-left hover:border-rose-400/80 hover:from-rose-900/60 transition-all cursor-pointer group shadow-md shadow-rose-950/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-[11px] font-bold text-rose-300 group-hover:text-rose-200">
                  Alertas Sanitarias
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-mono font-bold border border-rose-500/40">
                {smartAlertsCount}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 group-hover:text-slate-300">
              Vacunas y retiros pendientes
            </p>
          </button>
        )}
      </div>
    </nav>
  );
};
