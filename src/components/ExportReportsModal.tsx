import React, { useState } from 'react';
import {
  FileDown,
  Stethoscope,
  DollarSign,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  Printer,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { Animal, ClinicalRecord, FinancialTransaction } from '../types';
import {
  exportClinicalHistoryPDF,
  exportFinancialReportPDF,
  exportAnimalCompleteDossierPDF,
} from '../lib/pdfExport';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  clinicalRecords: ClinicalRecord[];
  financials: FinancialTransaction[];
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  animals,
  clinicalRecords,
  financials,
}) => {
  if (!isOpen) return null;

  const [activeReportTab, setActiveReportTab] = useState<'clinical' | 'financial' | 'individual'>('clinical');

  // Clinical Filters
  const [selectedAnimalForClinical, setSelectedAnimalForClinical] = useState<string>('TODOS');
  const [selectedVetFilter, setSelectedVetFilter] = useState<string>('TODOS');
  const [selectedClinicalType, setSelectedClinicalType] = useState<string>('TODOS');

  // Financial Filters
  const [financialTypeFilter, setFinancialTypeFilter] = useState<'TODOS' | 'Ingreso' | 'Egreso'>('TODOS');
  const [financialCatFilter, setFinancialCatFilter] = useState<string>('TODOS');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');

  // Individual Animal Dossier
  const [selectedDossierAnimalId, setSelectedDossierAnimalId] = useState<string>(animals[0]?.id || '');

  // Handlers
  const handleExportClinical = () => {
    exportClinicalHistoryPDF(clinicalRecords, animals, {
      animalId: selectedAnimalForClinical,
      veterinarianFilter: selectedVetFilter,
      typeFilter: selectedClinicalType,
    });
  };

  const handleExportFinancial = () => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (dateRangeFilter === 'THIS_MONTH') {
      const now = new Date();
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (dateRangeFilter === 'THIS_YEAR') {
      const now = new Date();
      startDate = `${now.getFullYear()}-01-01`;
    }

    exportFinancialReportPDF(financials, animals, {
      typeFilter: financialTypeFilter,
      categoryFilter: financialCatFilter,
      startDate,
      endDate,
    });
  };

  const handleExportIndividualDossier = () => {
    const animal = animals.find((a) => a.id === selectedDossierAnimalId);
    if (!animal) return;
    exportAnimalCompleteDossierPDF(animal, clinicalRecords, financials);
  };

  // Distinct Vets
  const veterinariansList = Array.from(new Set(clinicalRecords.map((r) => r.veterinarian))).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
            <FileDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Exportación Oficial PDF
              </span>
              <span className="text-xs text-slate-400">Veterinaria & Contabilidad</span>
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">Centro de Informes & Expedientes en PDF</h3>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveReportTab('clinical')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeReportTab === 'clinical'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-300" />
            <span>1. Historial Clínico</span>
          </button>

          <button
            onClick={() => setActiveReportTab('financial')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeReportTab === 'financial'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-sky-300" />
            <span>2. Reporte Contable</span>
          </button>

          <button
            onClick={() => setActiveReportTab('individual')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeReportTab === 'individual'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-violet-300" />
            <span>3. Dossier Bovino 360°</span>
          </button>
        </div>

        {/* Body content based on selected tab */}
        <div className="py-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: HISTORIAL CLÍNICO VETERINARIO */}
          {activeReportTab === 'clinical' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <h4 className="font-bold text-white text-sm mb-1">Certificado Oficial para Médicos Veterinarios & ICA</h4>
                  <p>
                    Genera el expediente de vacunas obligatorias (Fiebre Aftosa, Brucelosis, Carbón), desparasitaciones, tratamientos antibióticos con tiempo de retiro y firmas oficiales.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Filtrar por Animal Específico</label>
                  <select
                    value={selectedAnimalForClinical}
                    onChange={(e) => setSelectedAnimalForClinical(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="TODOS">Todos los Animales del Hato ({animals.length} cabezas)</option>
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        #{a.id} - {a.name || 'Sin nombre'} ({a.breed} • {a.corralName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Médico Veterinario</label>
                  <select
                    value={selectedVetFilter}
                    onChange={(e) => setSelectedVetFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="TODOS">Todos los Profesionales</option>
                    {veterinariansList.map((vet) => (
                      <option key={vet} value={vet}>
                        {vet}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo de Intervención</label>
                  <select
                    value={selectedClinicalType}
                    onChange={(e) => setSelectedClinicalType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="TODOS">Todas las Intervenciones</option>
                    <option value="Vacuna">Solo Vacunas & Biológicos</option>
                    <option value="Desparasitante">Solo Desparasitaciones</option>
                    <option value="Tratamiento">Tratamientos Terapéuticos</option>
                    <option value="Cirugía">Intervenciones Quirúrgicas</option>
                    <option value="Examen">Palpación / Ecografía</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400">Total Registros a Exportar:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {clinicalRecords.length} atenciones registradas
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportClinical}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
                >
                  <FileDown className="w-5 h-5" />
                  <span>Descargar Expediente Clínico en PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTE FINANCIERO & CONTABLE */}
          {activeReportTab === 'financial' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <h4 className="font-bold text-white text-sm mb-1">Libro Mayor y Balance para Contadores Públicos & Bancos</h4>
                  <p>
                    Genera el informe de ingresos por venta de ganado y leche, egresos operacionales (alimento, nómina, medicina y obras), margen neto y desglose por rubro contable.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tipo de Movimiento</label>
                  <select
                    value={financialTypeFilter}
                    onChange={(e) => setFinancialTypeFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="TODOS">Balance Completo (Ingresos + Gastos)</option>
                    <option value="Ingreso">Solo Ingresos (+)</option>
                    <option value="Egreso">Solo Gastos Operativos (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Categoría Contable</label>
                  <select
                    value={financialCatFilter}
                    onChange={(e) => setFinancialCatFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="TODOS">Todas las Categorías</option>
                    <option value="Venta Ganado">Venta de Ganado en Pie</option>
                    <option value="Venta Leche">Venta de Leche y Lácteos</option>
                    <option value="Alimento">Alimento y Forrajes</option>
                    <option value="Medicamentos">Medicamentos y Veterinaria</option>
                    <option value="Salarios">Salarios y Nómina</option>
                    <option value="Mantenimiento">Mantenimiento de Finca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Periodo Contable</label>
                  <select
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    <option value="ALL">Todo el Historial Contable</option>
                    <option value="THIS_MONTH">Mes en Curso</option>
                    <option value="THIS_YEAR">Año Calendario Actual (2026)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400">Total Transacciones Contables:</span>
                  <span className="text-xl font-black text-sky-400 font-mono">
                    {financials.length} movimientos ($
                    {financials.reduce((acc, t) => acc + (t.type === 'Ingreso' ? t.amountUSD : -t.amountUSD), 0).toFixed(2)}{' '}
                    netos)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportFinancial}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 cursor-pointer transition-all"
                >
                  <FileDown className="w-5 h-5" />
                  <span>Descargar Reporte Contable en PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DOSSIER INDIVIDUAL 360° */}
          {activeReportTab === 'individual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/30 flex items-start gap-3">
                <FileText className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <h4 className="font-bold text-white text-sm mb-1">Ficha Integral 360° (Historial Médico + Costos del Animal)</h4>
                  <p>
                    Exporta la ficha técnica completa de un animal individual, integrando su pedigree genético, historial de pesajes y GDP, tratamientos veterinarios y balance financiero específico.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Seleccionar Ejemplar Bovino</label>
                  <select
                    value={selectedDossierAnimalId}
                    onChange={(e) => setSelectedDossierAnimalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        ARETE #{a.id} - {a.name || 'Sin nombre'} ({a.breed} • {a.purpose} • {a.currentWeightKg} Kg)
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentAnimal = animals.find((a) => a.id === selectedDossierAnimalId);
                  if (!currentAnimal) return null;
                  const medCount = clinicalRecords.filter((r) => r.animalId === currentAnimal.id).length;
                  const txCount = financials.filter((t) => t.animalId === currentAnimal.id).length;

                  return (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Arete</span>
                        <span className="text-lg font-black text-white font-mono">#{currentAnimal.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Peso Actual</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{currentAnimal.currentWeightKg} Kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Atenciones</span>
                        <span className="text-lg font-black text-cyan-400 font-mono">{medCount} eventos</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Transacciones</span>
                        <span className="text-lg font-black text-amber-400 font-mono">{txCount} reg.</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportIndividualDossier}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-950/50 cursor-pointer transition-all"
                >
                  <FileDown className="w-5 h-5" />
                  <span>Descargar Dossier Individual en PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Compatible con lectores de PDF, Adobe Acrobat e impresión en papel A4</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
