import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Animal } from './types';
import { useLivestockData } from './hooks/useLivestockData';

import {
  Navbar,
  SidebarNav,
  TabType,
  AnimalCard,
  AnimalDetailModal,
  QRModal,
  QRScannerModal,
  AddEditAnimalModal,
  WorkersView,
  CorralsView,
  FeedInventoryView,
  FinancialView,
  AuditLogView,
  MangaChuteModeView,
  ReproductionPedigreeView,
  PastureRotationView,
  CommercialValuationView,
  CommercialSalesView,
  BatchTreatmentModal,
  CattleEyeBCSModal,
  HerdXPassportModal,
  FarmMapD3View,
  ExportReportsModal,
  SmartAlertsDashboardPanel,
  SmartAlertsModal,
} from './components';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('animals');
  const [searchQuery, setSearchQuery] = useState('');
  const [purposeFilter, setPurposeFilter] = useState<string>('TODOS');
  const [alertedAnimalsFilter, setAlertedAnimalsFilter] = useState<string[]>([]);

  // Modals and dialog state
  const [selectedDetailAnimal, setSelectedDetailAnimal] = useState<Animal | null>(null);
  const [selectedQRAnimal, setSelectedQRAnimal] = useState<Animal | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addAnimalModalOpen, setAddAnimalModalOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [batchTreatmentModalOpen, setBatchTreatmentModalOpen] = useState(false);
  const [selectedBCSAnimal, setSelectedBCSAnimal] = useState<Animal | null>(null);
  const [selectedPassportAnimal, setSelectedPassportAnimal] = useState<Animal | null>(null);
  const [exportReportsModalOpen, setExportReportsModalOpen] = useState(false);
  const [smartAlertsModalOpen, setSmartAlertsModalOpen] = useState(false);
  const [mangaCorralFilter, setMangaCorralFilter] = useState<string>('all');
  const [mangaPaddockFilter, setMangaPaddockFilter] = useState<string>('all');

  // Business state & logic from centralized livestock hook
  const {
    animals,
    workers,
    corrals,
    feedItems,
    clinicalRecords,
    tasks,
    auditLogs,
    financials,
    smartAlerts,
    metrics,
    refreshAllData,
    saveAnimal,
    deleteAnimal,
    saveWorker,
    deleteWorker,
    saveCorral,
    deleteCorral,
    saveFeedItem,
    deleteFeedItem,
    addTransaction,
    deleteTransaction,
    resetDefaults,
  } = useLivestockData();

  const handleOpenMangaForAnimal = useCallback((animal: Animal) => {
    setSelectedDetailAnimal(null);
    setMangaPaddockFilter(animal.paddockId || 'all');
    setMangaCorralFilter(animal.corralId || 'all');
    setActiveTab('manga');
  }, []);

  const handleSaveAnimal = useCallback(
    (animal: Animal) => {
      saveAnimal(animal);
      setAddAnimalModalOpen(false);
      setEditingAnimal(null);
      if (selectedDetailAnimal?.id === animal.id) {
        setSelectedDetailAnimal(animal);
      }
    },
    [saveAnimal, selectedDetailAnimal]
  );

  const handleDeleteAnimal = useCallback(
    (animalId: string) => {
      deleteAnimal(animalId);
      if (selectedDetailAnimal?.id === animalId) {
        setSelectedDetailAnimal(null);
      }
    },
    [deleteAnimal, selectedDetailAnimal]
  );

  // Filtered animals with multi-criteria support
  const filteredAnimals = useMemo(() => {
    return animals.filter((animal) => {
      if (alertedAnimalsFilter.length > 0 && !alertedAnimalsFilter.includes(animal.id)) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        animal.id.toLowerCase().includes(query) ||
        (animal.name && animal.name.toLowerCase().includes(query)) ||
        animal.breed.toLowerCase().includes(query) ||
        (animal.ironBrand && animal.ironBrand.toLowerCase().includes(query)) ||
        animal.corralName.toLowerCase().includes(query);

      let matchesFilter = true;
      if (purposeFilter === 'ACT') matchesFilter = animal.status === 'ACT';
      else if (purposeFilter === 'IAC') matchesFilter = animal.status === 'IAC';
      else if (purposeFilter === 'CRIA') matchesFilter = animal.purpose === 'CRIA';
      else if (purposeFilter === 'CEBA') matchesFilter = animal.purpose === 'CEBA';
      else if (purposeFilter === 'LECHE') matchesFilter = animal.purpose === 'LECHE';
      else if (purposeFilter === 'REPRODUCTOR') matchesFilter = animal.purpose === 'REPRODUCTOR';

      return matchesSearch && matchesFilter;
    });
  }, [animals, alertedAnimalsFilter, searchQuery, purposeFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      {/* Main Navigation Header */}
      <Navbar
        onOpenScanner={() => setScannerOpen(true)}
        onResetData={resetDefaults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingTasksCount={metrics.pendingTasksCount}
        smartAlertsCount={smartAlerts.length}
        onOpenMangaMode={() => setActiveTab('manga')}
        onOpenBatchTreatment={() => setBatchTreatmentModalOpen(true)}
        onOpenExportReports={() => setExportReportsModalOpen(true)}
        onOpenSmartAlerts={() => setSmartAlertsModalOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className="md:col-span-3 lg:col-span-3 sticky top-16 md:top-20 z-30 transition-all duration-300">
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeAnimalsCount={metrics.activeCount}
            lowStockItemsCount={metrics.lowStockFeedCount}
            pendingTasksCount={metrics.pendingTasksCount}
            readyForSaleCount={metrics.readyForSaleCount}
            smartAlertsCount={smartAlerts.length}
            onOpenSmartAlerts={() => setSmartAlertsModalOpen(true)}
            onAddNewAnimal={() => {
              setEditingAnimal(null);
              setAddAnimalModalOpen(true);
            }}
          />
        </div>

        {/* Main Content Area */}
        <main className="md:col-span-9 lg:col-span-9 space-y-6">
          {/* TAB: LIVESTOCK CONTROL */}
          {activeTab === 'animals' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Summary KPIs Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Hato Activo en Finca
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-400 font-mono">{metrics.activeCount}</span>
                    <span className="text-xs text-slate-400 font-bold">Cabezas</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ganado en Ceba
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-blue-400 font-mono">{metrics.cebaCount}</span>
                    <span className="text-xs text-slate-400 font-bold">Engorda</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Producción Láctea
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-cyan-400 font-mono">{metrics.lecheCount}</span>
                    <span className="text-xs text-slate-400 font-bold">Vacas Ordeño</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Atenciones Pendientes
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-400 font-mono">{metrics.pendingTasksCount}</span>
                    <span className="text-xs text-slate-400 font-bold">Tareas</span>
                  </div>
                </div>
              </div>

              {/* Sanitary & Smart Alerts Dashboard Panel */}
              <SmartAlertsDashboardPanel
                animals={animals}
                clinicalRecords={clinicalRecords}
                tasks={tasks}
                onRefreshData={refreshAllData}
                onOpenAnimalDetail={(animal) => setSelectedDetailAnimal(animal)}
                onOpenMangaForAnimal={handleOpenMangaForAnimal}
                onFilterAlertedAnimals={(ids) => setAlertedAnimalsFilter(ids)}
                isFilterActive={alertedAnimalsFilter.length > 0}
              />

              {/* Purpose & Category Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {[
                    { id: 'TODOS', label: 'Todos los Animales' },
                    { id: 'ACT', label: 'Activos (ACT)' },
                    { id: 'IAC', label: 'Inactivos / Vendidos (IAC)' },
                    { id: 'CRIA', label: 'Cría' },
                    { id: 'CEBA', label: 'Engorda Ceba' },
                    { id: 'LECHE', label: 'Leche' },
                    { id: 'REPRODUCTOR', label: 'Sementales' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setPurposeFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        purposeFilter === filter.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400 font-mono font-medium px-2">
                  Mostrando {filteredAnimals.length} de {animals.length}
                </span>
              </div>

              {/* Active Alerts Filter Indicator */}
              {alertedAnimalsFilter.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <div className="flex items-center space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-semibold">
                      Filtrando {filteredAnimals.length} animal(es) con alertas sanitarias o tareas prioritarias
                    </span>
                  </div>
                  <button
                    onClick={() => setAlertedAnimalsFilter([])}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-colors cursor-pointer"
                  >
                    Mostrar Todo el Hato
                  </button>
                </div>
              )}

              {/* Animal Cards Grid */}
              {filteredAnimals.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
                  <p className="text-sm font-semibold text-slate-300">No se encontraron animales registrados.</p>
                  <button
                    onClick={() => {
                      setEditingAnimal(null);
                      setAddAnimalModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    Registrar Primer Animal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAnimals.map((animal) => (
                    <AnimalCard
                      key={animal.id}
                      animal={animal}
                      onOpenDetail={(a) => setSelectedDetailAnimal(a)}
                      onOpenQR={(a) => setSelectedQRAnimal(a)}
                      onAddMedicalRecord={(a) => setSelectedDetailAnimal(a)}
                      onEdit={(a) => {
                        setEditingAnimal(a);
                        setAddAnimalModalOpen(true);
                      }}
                      onOpenMangaForAnimal={(a) => {
                        setMangaPaddockFilter(a.paddockId || 'all');
                        setMangaCorralFilter(a.corralId || 'all');
                        setActiveTab('manga');
                      }}
                      onOpenBCS={(a) => setSelectedBCSAnimal(a)}
                      onOpenPassport={(a) => setSelectedPassportAnimal(a)}
                      onOpenMapForPaddock={() => setActiveTab('farm-map')}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: MAPA INTERACTIVO DE LA FINCA D3 */}
          {activeTab === 'farm-map' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <FarmMapD3View
                animals={animals}
                onRefreshData={refreshAllData}
                onOpenAnimalDetail={(a) => setSelectedDetailAnimal(a)}
                onOpenMangaForPaddock={(paddockId) => {
                  setMangaPaddockFilter(paddockId);
                  setMangaCorralFilter('all');
                  setActiveTab('manga');
                }}
                onOpenBatchTreatmentForPaddock={() => setBatchTreatmentModalOpen(true)}
                onOpenValuation={() => setActiveTab('valuation')}
                onOpenExportReports={() => setExportReportsModalOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB: MANGA & BÁSCULA RÁPIDA */}
          {activeTab === 'manga' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <MangaChuteModeView
                animals={animals}
                corrals={corrals}
                onRefreshData={refreshAllData}
                onOpenDetail={(a) => setSelectedDetailAnimal(a)}
                onOpenBatchTreatment={() => setBatchTreatmentModalOpen(true)}
                onOpenBCS={(a) => setSelectedBCSAnimal(a)}
                onOpenPassport={(a) => setSelectedPassportAnimal(a)}
                onOpenMapAtPaddock={() => setActiveTab('farm-map')}
                initialPaddockId={mangaPaddockFilter}
                initialCorralId={mangaCorralFilter}
              />
            </motion.div>
          )}

          {/* TAB: REPRODUCCIÓN & GENEALOGÍA */}
          {activeTab === 'reproduction' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ReproductionPedigreeView
                animals={animals}
                onRefreshData={refreshAllData}
                onOpenDetail={(a) => setSelectedDetailAnimal(a)}
              />
            </motion.div>
          )}

          {/* TAB: ROTACIÓN DE POTREROS */}
          {activeTab === 'pastures' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <PastureRotationView
                animals={animals}
                onRefreshData={refreshAllData}
                onOpenAnimalDetail={(a) => setSelectedDetailAnimal(a)}
                onOpenMangaForPaddock={(paddockId) => {
                  setMangaPaddockFilter(paddockId);
                  setMangaCorralFilter('all');
                  setActiveTab('manga');
                }}
                onOpenBatchTreatment={() => setBatchTreatmentModalOpen(true)}
                onOpenMap={() => setActiveTab('farm-map')}
              />
            </motion.div>
          )}

          {/* TAB: VALUACIÓN COMERCIAL & PROYECCIÓN DE PESOS */}
          {activeTab === 'valuation' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CommercialValuationView
                animals={animals}
                onRefreshData={refreshAllData}
                onOpenDetail={(a) => setSelectedDetailAnimal(a)}
                onOpenExportReports={() => setExportReportsModalOpen(true)}
                onNavigateToSales={() => setActiveTab('sales')}
              />
            </motion.div>
          )}

          {/* TAB: MÓDULO DE VENTAS & LIQUIDACIÓN */}
          {activeTab === 'sales' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CommercialSalesView
                animals={animals}
                onRefreshData={refreshAllData}
                onOpenDetail={(a) => setSelectedDetailAnimal(a)}
                onNavigateToValuation={() => setActiveTab('valuation')}
                onOpenExportReports={() => setExportReportsModalOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB: PERSONAL & TRABAJADORES */}
          {activeTab === 'workers' && (
            <WorkersView
              workers={workers}
              corrals={corrals}
              animals={animals}
              onSaveWorker={saveWorker}
              onDeleteWorker={deleteWorker}
            />
          )}

          {/* TAB: CORRALES & GALPONES */}
          {activeTab === 'corrals' && (
            <CorralsView
              corrals={corrals}
              animals={animals}
              workers={workers}
              onSaveCorral={saveCorral}
              onDeleteCorral={deleteCorral}
              onOpenDetail={(a) => setSelectedDetailAnimal(a)}
              onOpenMangaWithCorral={(corralId) => {
                setMangaCorralFilter(corralId);
                setMangaPaddockFilter('all');
                setActiveTab('manga');
              }}
              onOpenBatchTreatmentWithCorral={() => setBatchTreatmentModalOpen(true)}
              onOpenMapForPaddock={() => setActiveTab('farm-map')}
            />
          )}

          {/* TAB: INVENTARIO DE ALIMENTO */}
          {activeTab === 'feed' && (
            <FeedInventoryView
              feedItems={feedItems}
              onSaveFeedItem={saveFeedItem}
              onDeleteFeedItem={deleteFeedItem}
              onRegisterExpense={(amount, desc) => {
                addTransaction(
                  {
                    date: new Date().toISOString().split('T')[0],
                    type: 'Egreso',
                    category: 'Alimento',
                    description: desc,
                    amountUSD: amount,
                  },
                  'Administrador'
                );
              }}
            />
          )}

          {/* TAB: FINANZAS & CONTABILIDAD */}
          {activeTab === 'finances' && (
            <FinancialView
              financials={financials}
              animals={animals}
              onAddTransaction={(t) => addTransaction(t, 'Jahir Janchez')}
              onDeleteTransaction={(tId) => deleteTransaction(tId)}
            />
          )}

          {/* TAB: AUDITORÍA DE CAMPO */}
          {activeTab === 'audit' && <AuditLogView logs={auditLogs} />}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <p>© 2026 Control Ganadero Pro • Trazabilidad por Aretes QR, Sanidad & Gestión Pecuaria</p>
      </footer>

      {/* Modals & Dialog Overlays */}
      <AnimatePresence>
        {selectedDetailAnimal && (
          <AnimalDetailModal
            animal={selectedDetailAnimal}
            clinicalRecords={clinicalRecords.filter((c) => c.animalId === selectedDetailAnimal.id)}
            tasks={tasks.filter((t) => t.animalId === selectedDetailAnimal.id)}
            workers={workers}
            onClose={() => setSelectedDetailAnimal(null)}
            onUpdateAnimal={handleSaveAnimal}
            onRefreshData={refreshAllData}
            onEditAnimal={(a) => {
              setEditingAnimal(a);
              setAddAnimalModalOpen(true);
              setSelectedDetailAnimal(null);
            }}
            onDeleteAnimal={handleDeleteAnimal}
            onOpenMangaForAnimal={handleOpenMangaForAnimal}
            onOpenBCS={(a) => setSelectedBCSAnimal(a)}
            onOpenPassport={(a) => setSelectedPassportAnimal(a)}
            onOpenMapForPaddock={() => {
              setSelectedDetailAnimal(null);
              setActiveTab('farm-map');
            }}
            onOpenReproduction={() => {
              setSelectedDetailAnimal(null);
              setActiveTab('reproduction');
            }}
            allAnimals={animals}
            onSelectAnimal={(a) => setSelectedDetailAnimal(a)}
          />
        )}

        {selectedQRAnimal && (
          <QRModal animal={selectedQRAnimal} onClose={() => setSelectedQRAnimal(null)} />
        )}

        {scannerOpen && (
          <QRScannerModal
            animals={animals}
            onSelectAnimal={(a) => setSelectedDetailAnimal(a)}
            onClose={() => setScannerOpen(false)}
            onAddNewAnimalWithId={(tagId) => {
              setEditingAnimal({
                id: tagId,
                name: '',
                breed: 'Brahman Blanco',
                sex: 'M',
                birthDate: new Date().toISOString().split('T')[0],
                status: 'ACT',
                purpose: 'CEBA',
                initialWeightKg: 220,
                currentWeightKg: 220,
                corralId: corrals[0]?.id || 'corral-1',
                corralName: corrals[0]?.name || 'Corral A',
                purchased: false,
                calvingDifficulty: 0,
                weightHistory: [{ date: new Date().toISOString().split('T')[0], weightKg: 220 }],
              } as Animal);
              setAddAnimalModalOpen(true);
            }}
          />
        )}

        {addAnimalModalOpen && (
          <AddEditAnimalModal
            initialAnimal={editingAnimal}
            corrals={corrals}
            workers={workers}
            existingAnimals={animals}
            onSave={handleSaveAnimal}
            onClose={() => {
              setAddAnimalModalOpen(false);
              setEditingAnimal(null);
            }}
          />
        )}

        {batchTreatmentModalOpen && (
          <BatchTreatmentModal
            isOpen={batchTreatmentModalOpen}
            onClose={() => setBatchTreatmentModalOpen(false)}
            animals={animals}
            corrals={corrals}
            onRefreshData={refreshAllData}
          />
        )}

        {selectedBCSAnimal && (
          <CattleEyeBCSModal
            isOpen={Boolean(selectedBCSAnimal)}
            animal={selectedBCSAnimal}
            onClose={() => setSelectedBCSAnimal(null)}
            onRefreshData={refreshAllData}
          />
        )}

        {selectedPassportAnimal && (
          <HerdXPassportModal
            isOpen={Boolean(selectedPassportAnimal)}
            animal={selectedPassportAnimal}
            onClose={() => setSelectedPassportAnimal(null)}
          />
        )}

        {exportReportsModalOpen && (
          <ExportReportsModal
            isOpen={exportReportsModalOpen}
            onClose={() => setExportReportsModalOpen(false)}
            animals={animals}
            clinicalRecords={clinicalRecords}
            financials={financials}
          />
        )}

        {smartAlertsModalOpen && (
          <SmartAlertsModal
            isOpen={smartAlertsModalOpen}
            onClose={() => setSmartAlertsModalOpen(false)}
            animals={animals}
            clinicalRecords={clinicalRecords}
            tasks={tasks}
            onRefreshData={refreshAllData}
            onOpenAnimalDetail={(a) => setSelectedDetailAnimal(a)}
            onOpenMangaForAnimal={handleOpenMangaForAnimal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
