import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Animal,
  Worker,
  Corral,
  FeedItem,
  AuditLog,
  FinancialTransaction,
  ClinicalRecord,
  AnimalTask,
} from '../types';
import {
  getStoredAnimals,
  saveStoredAnimal,
  deleteStoredAnimal,
  getStoredWorkers,
  saveStoredWorker,
  deleteStoredWorker,
  getStoredCorrals,
  saveStoredCorral,
  deleteStoredCorral,
  getStoredFeedItems,
  saveStoredFeedItem,
  deleteStoredFeedItem,
  getStoredClinicalRecords,
  getStoredTasks,
  getStoredAuditLogs,
  getStoredFinancials,
  addFinancialTransaction,
  deleteFinancialTransaction,
  resetToDefaults,
} from '../lib/storage';
import { detectSmartAlerts, SmartAlert } from '../lib/smartAlerts';

export function useLivestockData() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [corrals, setCorrals] = useState<Corral[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [tasks, setTasks] = useState<AnimalTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financials, setFinancials] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAllData = useCallback(() => {
    setAnimals(getStoredAnimals());
    setWorkers(getStoredWorkers());
    setCorrals(getStoredCorrals());
    setFeedItems(getStoredFeedItems());
    setClinicalRecords(getStoredClinicalRecords());
    setTasks(getStoredTasks());
    setAuditLogs(getStoredAuditLogs());
    setFinancials(getStoredFinancials());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Detected Sanitary Alerts
  const { alerts: smartAlerts, stats: alertStats } = useMemo(() => {
    return detectSmartAlerts(animals, clinicalRecords, tasks);
  }, [animals, clinicalRecords, tasks]);

  // Animal CRUD Operations
  const handleSaveAnimal = useCallback(
    (animal: Animal, operatorName: string = 'Jahir Janchez (Propietario)') => {
      const updated = saveStoredAnimal(animal, operatorName);
      setAnimals(updated);
      setAuditLogs(getStoredAuditLogs());
      return updated;
    },
    []
  );

  const handleDeleteAnimal = useCallback(
    (animalId: string, operatorName: string = 'Jahir Janchez (Propietario)') => {
      const updated = deleteStoredAnimal(animalId, operatorName);
      setAnimals(updated);
      setAuditLogs(getStoredAuditLogs());
      return updated;
    },
    []
  );

  // Worker CRUD Operations
  const handleSaveWorker = useCallback((worker: Worker) => {
    const updated = saveStoredWorker(worker);
    setWorkers(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  const handleDeleteWorker = useCallback((workerId: string) => {
    const updated = deleteStoredWorker(workerId);
    setWorkers(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  // Corral CRUD Operations
  const handleSaveCorral = useCallback((corral: Corral) => {
    const updated = saveStoredCorral(corral);
    setCorrals(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  const handleDeleteCorral = useCallback((corralId: string) => {
    const updated = deleteStoredCorral(corralId);
    setCorrals(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  // Feed Item CRUD Operations
  const handleSaveFeedItem = useCallback((feedItem: FeedItem) => {
    const updated = saveStoredFeedItem(feedItem);
    setFeedItems(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  const handleDeleteFeedItem = useCallback((feedItemId: string) => {
    const updated = deleteStoredFeedItem(feedItemId);
    setFeedItems(updated);
    setAuditLogs(getStoredAuditLogs());
  }, []);

  // Financial Transaction Operations
  const handleAddTransaction = useCallback(
    (transaction: Omit<FinancialTransaction, 'id'>, registeredBy: string = 'Jahir Janchez') => {
      const updated = addFinancialTransaction(transaction, registeredBy);
      setFinancials(updated);
      setAuditLogs(getStoredAuditLogs());
      return updated;
    },
    []
  );

  const handleDeleteTransaction = useCallback((transactionId: string) => {
    const updated = deleteFinancialTransaction(transactionId);
    setFinancials(updated);
    setAuditLogs(getStoredAuditLogs());
    return updated;
  }, []);

  // Reset to default dataset
  const handleResetDefaults = useCallback(() => {
    if (confirm('¿Deseas restaurar la base de datos de la hacienda a sus valores iniciales?')) {
      resetToDefaults();
      refreshAllData();
    }
  }, [refreshAllData]);

  // Derived KPI Metrics
  const metrics = useMemo(() => {
    const active = animals.filter((a) => a.status === 'ACT');
    const ceba = active.filter((a) => a.purpose === 'CEBA');
    const leche = active.filter((a) => a.purpose === 'LECHE');
    const readyForSale = active.filter(
      (a) => (a.purpose === 'CEBA' && a.currentWeightKg >= 500) || a.currentWeightKg >= 520
    );
    const lowStockFeed = feedItems.filter((f) => f.currentStockKg <= f.minThresholdKg);
    const pendingTasks = tasks.filter((t) => t.status !== 'completado');

    return {
      activeCount: active.length,
      cebaCount: ceba.length,
      lecheCount: leche.length,
      readyForSaleCount: readyForSale.length,
      lowStockFeedCount: lowStockFeed.length,
      pendingTasksCount: pendingTasks.length,
    };
  }, [animals, feedItems, tasks]);

  return {
    animals,
    workers,
    corrals,
    feedItems,
    clinicalRecords,
    tasks,
    auditLogs,
    financials,
    smartAlerts,
    alertStats,
    metrics,
    isLoading,
    refreshAllData,
    saveAnimal: handleSaveAnimal,
    deleteAnimal: handleDeleteAnimal,
    saveWorker: handleSaveWorker,
    deleteWorker: handleDeleteWorker,
    saveCorral: handleSaveCorral,
    deleteCorral: handleDeleteCorral,
    saveFeedItem: handleSaveFeedItem,
    deleteFeedItem: handleDeleteFeedItem,
    addTransaction: handleAddTransaction,
    deleteTransaction: handleDeleteTransaction,
    resetDefaults: handleResetDefaults,
  };
}
