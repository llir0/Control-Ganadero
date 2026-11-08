import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Animal, ClinicalRecord, FinancialTransaction } from '../types';

/**
 * Professional PDF Export Utility for Cattle Management
 * Generates official Clinical & Veterinary Dossiers and Financial/Accounting Reports.
 */

const RANCH_INFO = {
  name: 'HACIENDA EL MIRADOR',
  subtitle: 'CONTROL GANADERO PRO - SISTEMA DE GESTIÓN ZOOTÉCNICA',
  regNumber: 'RGN-ICA-98420-2026',
  location: 'Sector Valle Verde, Km 14 Vía Rural',
  country: 'Colombia / Ganadería Sostenible',
  contact: 'Tel: +57 (310) 840-2911 | admon@elmirador.agro',
  owner: 'Jahir Janchez (Propietario / Administrador)',
};

/**
 * Adds official institutional header to the PDF page
 */
function addInstitutionalHeader(
  doc: jsPDF,
  title: string,
  docTypeBadge: string,
  accentColor: [number, number, number] = [5, 150, 105] // Emerald green
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Bar
  doc.setFillColor(...accentColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 5, pageWidth, 26, 'F');

  // Ranch Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(RANCH_INFO.name, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`${RANCH_INFO.subtitle} | Registro Ganadero: ${RANCH_INFO.regNumber}`, 14, 20);
  doc.text(`Ubicación: ${RANCH_INFO.location} • ${RANCH_INFO.contact}`, 14, 25);

  // Document Type Pill (Right side)
  doc.setFillColor(...accentColor);
  doc.roundedRect(pageWidth - 75, 10, 61, 15, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(docTypeBadge, pageWidth - 44.5, 19.5, { align: 'center' });

  // Document Subject Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 39);

  // Sub metadata line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const nowStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Fecha y Hora de Emisión: ${nowStr} | Responsable: ${RANCH_INFO.owner}`, 14, 44);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 47, pageWidth - 14, 47);
}

/**
 * Adds official signatures and verification footer
 */
function addDocumentFooter(
  doc: jsPDF,
  role1: string = 'Médico Veterinario Zootecnista (M.V.Z.)',
  role2: string = 'Propietario / Administrador General'
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Signature Block (Y: ~255mm on A4)
  const signY = pageHeight - 34;

  // Signature 1
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(25, signY, 85, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('FIRMA Y SELLO PROFESIONAL', 55, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(role1, 55, signY + 8, { align: 'center' });
  doc.text('Matrícula / C.P. No. ________________', 55, signY + 12, { align: 'center' });

  // Signature 2
  doc.line(pageWidth - 85, signY, pageWidth - 25, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('FIRMA RESPONSABLE DE FINCA', pageWidth - 55, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(role2, pageWidth - 55, signY + 8, { align: 'center' });
  doc.text(RANCH_INFO.owner, pageWidth - 55, signY + 12, { align: 'center' });

  // Page Numbers in All Pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento oficial de control interno y auditoría • ${RANCH_INFO.name} • Página ${i} de ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
}

/**
 * EXPORT 1: HISTORIAL CLÍNICO Y SANITARIO VETERINARIO (PDF)
 */
export function exportClinicalHistoryPDF(
  records: ClinicalRecord[],
  animals: Animal[],
  options?: {
    animalId?: string;
    veterinarianFilter?: string;
    typeFilter?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Filter records if needed
  let filtered = [...records];
  let singleAnimal: Animal | undefined;

  if (options?.animalId && options.animalId !== 'TODOS') {
    filtered = filtered.filter((r) => r.animalId === options.animalId);
    singleAnimal = animals.find((a) => a.id === options.animalId);
  }
  if (options?.veterinarianFilter && options.veterinarianFilter !== 'TODOS') {
    filtered = filtered.filter((r) => r.veterinarian.toLowerCase().includes(options.veterinarianFilter!.toLowerCase()));
  }
  if (options?.typeFilter && options.typeFilter !== 'TODOS') {
    filtered = filtered.filter((r) => r.type === options.typeFilter);
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const docTitle = singleAnimal
    ? `HISTORIAL CLÍNICO VETERINARIO - EJEMPLAR #${singleAnimal.id} (${singleAnimal.name || 'Sin Nombre'})`
    : 'EXPEDIENTE CLÍNICO & SANITARIO GENERAL DEL HATO';

  addInstitutionalHeader(doc, docTitle, 'USO VETERINARIO & ICA', [5, 150, 105]);

  let currentY = 52;

  // Single animal specific header profile if applicable
  if (singleAnimal) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Arete / Identificación: #${singleAnimal.id}`, 18, currentY + 6);
    doc.text(`Raza: ${singleAnimal.breed}`, 80, currentY + 6);
    doc.text(`Sexo: ${singleAnimal.sex === 'M' ? 'Macho' : 'Hembra'} | Propósito: ${singleAnimal.purpose}`, 140, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Peso Actual: ${singleAnimal.currentWeightKg} Kg`, 18, currentY + 12);
    doc.text(`Ubicación: ${singleAnimal.corralName}`, 80, currentY + 12);
    doc.text(`Fecha Nacimiento: ${singleAnimal.birthDate}`, 140, currentY + 12);

    const withdrawalText = singleAnimal.withdrawalUntilDate
      ? `RETIRO SANITARIO ACTIVO HASTA: ${singleAnimal.withdrawalUntilDate} (${singleAnimal.withdrawalReason || 'Tratamiento'})`
      : 'Estatus Sanitario: Libre de Retiro / Apto para Consumo';

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(singleAnimal.withdrawalUntilDate ? 220 : 16, singleAnimal.withdrawalUntilDate ? 38 : 185, singleAnimal.withdrawalUntilDate ? 38 : 129);
    doc.text(withdrawalText, 18, currentY + 18);

    currentY += 28;
  } else {
    // KPI summary banner for whole herd
    const totalInterventions = filtered.length;
    const totalCostUSD = filtered.reduce((sum, r) => sum + (r.cost || 0), 0);
    const vaccinesCount = filtered.filter((r) => r.type === 'Vacuna').length;
    const treatmentsCount = filtered.filter((r) => r.type === 'Tratamiento').length;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Intervenciones: ${totalInterventions}`, 20, currentY + 7);
    doc.text(`Vacunaciones: ${vaccinesCount}`, 70, currentY + 7);
    doc.text(`Tratamientos Médicos: ${treatmentsCount}`, 120, currentY + 7);
    doc.text(`Inversión Sanitaria Total: $${totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 20, currentY + 12);

    currentY += 20;
  }

  // Clinical Table with autoTable
  const tableData = filtered.map((rec) => {
    const animalObj = animals.find((a) => a.id === rec.animalId);
    return [
      rec.date,
      `#${rec.animalId} ${animalObj?.name ? `(${animalObj.name})` : ''}`,
      rec.type,
      rec.description || 'Sin notas',
      rec.medication,
      rec.veterinarian,
      rec.nextDueDate || 'N/A',
      rec.cost ? `$${rec.cost.toFixed(2)}` : '$0.00',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha', 'Animal / Tag', 'Tipo', 'Diagnóstico / Motivo', 'Medicamento / Dosis', 'Veterinario', 'Próx. Cita', 'Costo']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 25 },
      2: { cellWidth: 22 },
      3: { cellWidth: 42 },
      4: { cellWidth: 32 },
      5: { cellWidth: 24 },
      6: { cellWidth: 16 },
      7: { cellWidth: 15, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Avoid overlapping with footer
    },
  });

  addDocumentFooter(doc, 'Médico Veterinario Zootecnista (M.V.Z.)', 'Administrador General de Finca');

  // Trigger download
  const filename = singleAnimal
    ? `Historial_Clinico_Animal_${singleAnimal.id}_${new Date().toISOString().slice(0, 10)}.pdf`
    : `Expediente_Clinico_Veterinario_Finca_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}

/**
 * EXPORT 2: LIBRO FINANCIERO Y CONTABLE GANADERO (PDF)
 */
export function exportFinancialReportPDF(
  transactions: FinancialTransaction[],
  animals: Animal[],
  options?: {
    startDate?: string;
    endDate?: string;
    categoryFilter?: string;
    typeFilter?: 'Ingreso' | 'Egreso' | 'TODOS';
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Filter transactions
  let filtered = [...transactions];

  if (options?.startDate) {
    filtered = filtered.filter((t) => t.date >= options.startDate!);
  }
  if (options?.endDate) {
    filtered = filtered.filter((t) => t.date <= options.endDate!);
  }
  if (options?.categoryFilter && options.categoryFilter !== 'TODOS') {
    filtered = filtered.filter((t) => t.category === options.categoryFilter);
  }
  if (options?.typeFilter && options.typeFilter !== 'TODOS') {
    filtered = filtered.filter((t) => t.type === options.typeFilter);
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate Metrics
  const totalIngresos = filtered
    .filter((t) => t.type === 'Ingreso')
    .reduce((sum, t) => sum + t.amountUSD, 0);

  const totalEgresos = filtered
    .filter((t) => t.type === 'Egreso')
    .reduce((sum, t) => sum + t.amountUSD, 0);

  const balanceNeto = totalIngresos - totalEgresos;
  const margenPct = totalIngresos > 0 ? Math.round((balanceNeto / totalIngresos) * 100) : 0;

  addInstitutionalHeader(doc, 'REPORTE FINANCIERO & BALANCE OPERATIVO GANADERO', 'CONTABILIDAD & FINANZAS', [2, 132, 199]); // Cyan/Sky blue

  let currentY = 52;

  // Executive Financial KPI Summary Cards
  const colWidth = (pageWidth - 28 - 6) / 3;

  // Card 1: Ingresos
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(14, currentY, colWidth, 18, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, currentY, colWidth, 18, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL INGRESOS (+)', 18, currentY + 5.5);
  doc.setFontSize(11);
  doc.text(`$${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18, currentY + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Venta de ganado, carne y leche', 18, currentY + 15.5);

  // Card 2: Egresos
  const x2 = 14 + colWidth + 3;
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(x2, currentY, colWidth, 18, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(x2, currentY, colWidth, 18, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL GASTOS OPERATIVOS (-)', x2 + 4, currentY + 5.5);
  doc.setFontSize(11);
  doc.text(`$${totalEgresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, x2 + 4, currentY + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Insumos, nómina, medicina y mant.', x2 + 4, currentY + 15.5);

  // Card 3: Margen Neto
  const x3 = x2 + colWidth + 3;
  const isPositive = balanceNeto >= 0;
  doc.setFillColor(isPositive ? 238 : 254, isPositive ? 242 : 242, isPositive ? 255 : 242);
  doc.roundedRect(x3, currentY, colWidth, 18, 2, 2, 'F');
  doc.setDrawColor(isPositive ? 199 : 254, isPositive ? 210 : 202, isPositive ? 254 : 202);
  doc.roundedRect(x3, currentY, colWidth, 18, 2, 2, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(isPositive ? 30 : 153, isPositive ? 58 : 27, isPositive ? 138 : 27);
  doc.text('FLUJO DE CAJA NETO', x3 + 4, currentY + 5.5);
  doc.setFontSize(11);
  doc.text(`${balanceNeto >= 0 ? '+' : ''}$${balanceNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, x3 + 4, currentY + 12);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Margen Operativo: ${margenPct}%`, x3 + 4, currentY + 15.5);

  currentY += 23;

  // Breakdown by Category Sub-Table
  const categoriesList = ['Venta Ganado', 'Venta Leche', 'Alimento', 'Medicamentos', 'Salarios', 'Mantenimiento'];
  const catSummary = categoriesList.map((cat) => {
    const sum = filtered.filter((t) => t.category === cat).reduce((acc, t) => acc + t.amountUSD, 0);
    const count = filtered.filter((t) => t.category === cat).length;
    return { cat, sum, count };
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Desglose Resumido por Rubro Contable:', 14, currentY);
  currentY += 3;

  const catTableRows = catSummary.map((c) => [
    c.cat,
    ['Venta Ganado', 'Venta Leche'].includes(c.cat) ? 'Ingreso (+)' : 'Egreso / Costo (-)',
    `${c.count} operaciones`,
    `$${c.sum.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`,
    totalIngresos > 0 && ['Venta Ganado', 'Venta Leche'].includes(c.cat)
      ? `${Math.round((c.sum / totalIngresos) * 100)}% de Ingresos`
      : totalEgresos > 0
      ? `${Math.round((c.sum / totalEgresos) * 100)}% de Gastos`
      : '0%',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Rubro / Categoría', 'Naturaleza', 'Transacciones', 'Monto Total ($)', 'Participación']],
    body: catTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 37, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // Transactions Detailed Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Detalle Individual de Movimientos Contables:', 14, currentY);
  currentY += 3;

  const txTableRows = filtered.map((tx) => [
    tx.date,
    tx.type,
    tx.category,
    tx.description,
    tx.animalId ? `#${tx.animalId}` : tx.batchNumber ? `Lote: ${tx.batchNumber}` : 'General Finca',
    `${tx.type === 'Ingreso' ? '+' : '-'}$${tx.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Fecha', 'Tipo', 'Categoría', 'Concepto / Descripción', 'Animal / Lote', 'Monto (USD)']],
    body: txTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [2, 132, 199], // sky-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 62 },
      4: { cellWidth: 28 },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  addDocumentFooter(doc, 'Contador Público Titulado (T.P.) / Revisor Fiscal', 'Propietario / Representante Legal');

  const filename = `Reporte_Contable_Financiero_Ganadero_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * EXPORT 3: DOSSIER INTEGRAL BOVINO (HISTORIAL CLÍNICO + FINANCIERO INDIVIDUAL)
 */
export function exportAnimalCompleteDossierPDF(
  animal: Animal,
  clinicalRecords: ClinicalRecord[],
  transactions: FinancialTransaction[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  addInstitutionalHeader(
    doc,
    `DOSSIER INTEGRAL TÉCNICO & FINANCIERO - ARETE #${animal.id}`,
    'FICHA TÉCNICA 360°',
    [124, 58, 237] // Violet
  );

  let currentY = 52;

  // Animal Profile Block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Identificación: ARETE #${animal.id} • ${animal.name || 'Sin Nombre'}`, 18, currentY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Raza: ${animal.breed} | Sexo: ${animal.sex === 'M' ? 'Macho' : 'Hembra'} | Propósito: ${animal.purpose}`, 18, currentY + 12);
  doc.text(`Fecha Nacimiento: ${animal.birthDate} | Hierro / Marca: ${animal.ironBrand || 'Sin herrar'}`, 18, currentY + 17);
  doc.text(`Ubicación: ${animal.corralName} | Encargado: ${animal.assignedWorkerName || 'N/A'}`, 18, currentY + 22);

  // Lineage & Weight
  doc.text(`Padre (Sire): ${animal.fatherId || 'N/R'} | Madre (Dam): ${animal.motherId || 'N/R'}`, 120, currentY + 12);
  doc.text(`Peso Actual: ${animal.currentWeightKg} Kg | GDP: ${animal.lastAdgGramsPerDay || 0} g/día`, 120, currentY + 17);
  doc.text(`Estado Reproductivo: ${animal.reproductiveStatus || 'Normal'}`, 120, currentY + 22);

  currentY += 35;

  // Filter clinical records for this animal
  const animalClinical = clinicalRecords.filter((r) => r.animalId === animal.id);
  const totalMedCost = animalClinical.reduce((acc, c) => acc + (c.cost || 0), 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Historial Clínico y Tratamientos Veterinarios (${animalClinical.length} atenciones - Inversión: $${totalMedCost.toFixed(2)} USD):`, 14, currentY);
  currentY += 3;

  if (animalClinical.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Fecha', 'Tipo', 'Tratamiento / Diagnóstico', 'Medicamento', 'Veterinario', 'Costo']],
      body: animalClinical.map((r) => [r.date, r.type, r.description, r.medication, r.veterinarian, `$${(r.cost || 0).toFixed(2)}`]),
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], fontSize: 7 },
      bodyStyles: { fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 24 },
        2: { cellWidth: 60 },
        3: { cellWidth: 38 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registran intervenciones médicas o patologías para este ejemplar.', 18, currentY + 4);
    currentY += 10;
  }

  // Filter financial transactions linked to this animal
  const animalTx = transactions.filter((t) => t.animalId === animal.id);
  const animalIngresos = animalTx.filter((t) => t.type === 'Ingreso').reduce((sum, t) => sum + t.amountUSD, 0);
  const animalEgresos = animalTx.filter((t) => t.type === 'Egreso').reduce((sum, t) => sum + t.amountUSD, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Movimientos Contables y Transacciones Directas (Ingresos: $${animalIngresos.toFixed(2)} | Gastos: $${animalEgresos.toFixed(2)}):`, 14, currentY);
  currentY += 3;

  if (animalTx.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto (USD)']],
      body: animalTx.map((t) => [t.date, t.type, t.category, t.description, `$${t.amountUSD.toFixed(2)}`]),
      theme: 'striped',
      headStyles: { fillColor: [2, 132, 199], fontSize: 7 },
      bodyStyles: { fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 70 },
        4: { cellWidth: 27, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sin transacciones de venta o egresos directos asociados a este arete específico.', 18, currentY + 4);
  }

  addDocumentFooter(doc, 'Médico Veterinario Inspector', 'Contador / Administrador de Finca');

  doc.save(`Dossier_Integral_Bovino_${animal.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export Projections at 3, 6, and 12 Months and Optimal Sale Calendar PDF
 */
export function exportWeightProjectionsPDF(
  projections: import('./projections').AnimalWeightProjection[],
  summary: import('./projections').ProjectionsSummary,
  prices: import('../types').MarketPriceConfig
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  addInstitutionalHeader(
    doc,
    'INFORME PREDICTIVO DE CRECIMIENTO, VALORIZACIÓN Y FECHAS ÓPTIMAS DE VENTA',
    'PROYECCIÓN ZOOTÉCNICA',
    [180, 83, 9] // Amber-700
  );

  let currentY = 50;

  // Executive Summary KPI Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN EJECUTIVO DE CRECIMIENTO Y PLUSVALÍA ESTIMADA:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const colWidth = (pageWidth - 36) / 4;
  // Col 1: Actual
  doc.text(`Inventario Evaluado: ${summary.totalAnimals} cabezas`, 18, currentY + 12);
  doc.text(`Biomasa Actual: ${summary.currentTotalKg.toLocaleString()} Kg`, 18, currentY + 17);
  doc.text(`Valor Comercial Hoy: $${Math.round(summary.currentTotalValueUSD).toLocaleString()} USD`, 18, currentY + 22);

  // Col 2: 3m
  doc.text(`Horizonte 3 Meses (+90 días):`, 18 + colWidth, currentY + 12);
  doc.text(`Peso Est.: ${summary.total3mKg.toLocaleString()} Kg (+${summary.total3mKg - summary.currentTotalKg} Kg)`, 18 + colWidth, currentY + 17);
  doc.setTextColor(5, 150, 105);
  doc.text(`Valor: $${Math.round(summary.total3mValueUSD).toLocaleString()} (+$${Math.round(summary.total3mGainUSD).toLocaleString()})`, 18 + colWidth, currentY + 22);
  doc.setTextColor(71, 85, 105);

  // Col 3: 6m
  doc.text(`Horizonte 6 Meses (+180 días):`, 18 + colWidth * 2, currentY + 12);
  doc.text(`Peso Est.: ${summary.total6mKg.toLocaleString()} Kg (+${summary.total6mKg - summary.currentTotalKg} Kg)`, 18 + colWidth * 2, currentY + 17);
  doc.setTextColor(5, 150, 105);
  doc.text(`Valor: $${Math.round(summary.total6mValueUSD).toLocaleString()} (+$${Math.round(summary.total6mGainUSD).toLocaleString()})`, 18 + colWidth * 2, currentY + 22);
  doc.setTextColor(71, 85, 105);

  // Col 4: 12m
  doc.text(`Horizonte 12 Meses (+365 días):`, 18 + colWidth * 3, currentY + 12);
  doc.text(`Peso Est.: ${summary.total12mKg.toLocaleString()} Kg (+${summary.total12mKg - summary.currentTotalKg} Kg)`, 18 + colWidth * 3, currentY + 17);
  doc.setTextColor(5, 150, 105);
  doc.text(`Valor: $${Math.round(summary.total12mValueUSD).toLocaleString()} (+$${Math.round(summary.total12mGainUSD).toLocaleString()})`, 18 + colWidth * 3, currentY + 22);
  doc.setTextColor(71, 85, 105);

  currentY += 28;

  // Cohort Planning Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `PLANIFICACIÓN DE SALIDA AL MERCADO: [Inmediata: ${summary.readyNowCount} cabezas | Corto Plazo (1-3m): ${summary.readyIn3mCount} | Mediano Plazo (4-6m): ${summary.readyIn6mCount} | Levante (>6m): ${summary.longTermCount}]`,
    14,
    currentY
  );
  currentY += 4;

  // Table of projections
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Arete',
        'Nombre / Raza',
        'Propósito',
        'Peso Act.',
        'GDP Hist.',
        'Proy. 3 Meses',
        'Proy. 6 Meses',
        'Proy. 12 Meses',
        'Meta',
        'Días',
        'Fecha Óptima',
        'Estado / Ventana',
      ],
    ],
    body: projections.map((p) => [
      `#${p.animal.id}`,
      `${p.animal.name || 'Sin nombre'} (${p.animal.breed})`,
      p.animal.purpose,
      `${p.currentWeightKg} Kg`,
      `+${p.historicalAdgGrams} g/d`,
      `${p.weight3mKg} Kg ($${p.value3mUSD})`,
      `${p.weight6mKg} Kg ($${p.value6mUSD})`,
      `${p.weight12mKg} Kg ($${p.value12mUSD})`,
      `${p.targetWeightKg} Kg`,
      p.daysToTarget === 0 ? 'LISTO' : `${p.daysToTarget}d`,
      p.optimalDateFormatted,
      p.saleWindowLabel,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5 },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 38 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
      8: { cellWidth: 16, halign: 'right' },
      9: { cellWidth: 14, halign: 'center' },
      10: { cellWidth: 22, halign: 'center' },
      11: { cellWidth: 31 },
    },
    margin: { left: 14, right: 14 },
  });

  addDocumentFooter(doc, 'Médico Veterinario Zootecnista', 'Gerente Comercial Ganadero');

  doc.save(`Proyecciones_Peso_Venta_Optima_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates an official Commercial Cattle Sale & Liquidation Invoice PDF
 */
export interface SaleBatchInvoiceData {
  buyerName: string;
  invoiceNumber: string;
  paymentMethod: string;
  destination?: string;
  notes?: string;
  saleDate: string;
  pricePerKgUSD: number;
  discountPercentage?: number; // merma
  animals: Animal[];
  totalKg: number;
  totalUSD: number;
}

export function exportSalesInvoicePDF(saleData: SaleBatchInvoiceData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  addInstitutionalHeader(
    doc,
    `ACTA DE LIQUIDACIÓN Y VENTA DE GANADO EN PIE • #${saleData.invoiceNumber}`,
    'VENTA COMERCIAL',
    [245, 158, 11] // Amber
  );

  let currentY = 52;

  // Buyer & Commercial Transaction Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DE LA TRANSACCIÓN COMERCIAL', 18, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const colW = (pageWidth - 36) / 3;
  // Col 1
  doc.text(`Comprador / Destino: ${saleData.buyerName}`, 18, currentY + 11);
  doc.text(`No. Acta / Factura: ${saleData.invoiceNumber}`, 18, currentY + 16.5);
  doc.text(`Fecha de Venta: ${saleData.saleDate}`, 18, currentY + 22);

  // Col 2
  doc.text(`Forma de Pago: ${saleData.paymentMethod}`, 18 + colW, currentY + 11);
  doc.text(`Destino: ${saleData.destination || 'Frigorífico / Subasta'}`, 18 + colW, currentY + 16.5);
  doc.text(`Precio Base Negociado: $${saleData.pricePerKgUSD.toFixed(2)} USD/Kg`, 18 + colW, currentY + 22);

  // Col 3: Totals highlight
  const totalArrobas = Math.round((saleData.totalKg / 25) * 10) / 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`Total Lote: ${saleData.animals.length} Cabezas`, 18 + colW * 2, currentY + 11);
  doc.text(`Peso Báscula: ${saleData.totalKg.toLocaleString()} Kg (~${totalArrobas} @)`, 18 + colW * 2, currentY + 16.5);
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(9.5);
  doc.text(`TOTAL NETO: $${Math.round(saleData.totalUSD).toLocaleString()} USD`, 18 + colW * 2, currentY + 23);

  currentY += 34;

  // Table of Cattle in Batch
  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'No.',
        'Arete / Tag',
        'Nombre del Animal',
        'Raza',
        'Sexo',
        'Propósito',
        'Hierro',
        'Peso en Pie',
        'Precio / Kg',
        'Subtotal USD',
      ],
    ],
    body: saleData.animals.map((a, idx) => {
      const priceKg = saleData.pricePerKgUSD;
      const subtotal = Math.round(a.currentWeightKg * priceKg);
      return [
        (idx + 1).toString(),
        `#${a.id}`,
        a.name || 'Sin nombre',
        a.breed,
        a.sex === 'M' ? 'Macho' : 'Hembra',
        a.purpose,
        a.ironBrand || 'N/A',
        `${a.currentWeightKg} Kg`,
        `$${priceKg.toFixed(2)}`,
        `$${subtotal.toLocaleString()}`,
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: 26 },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 18 },
      6: { cellWidth: 16 },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 18, halign: 'right' },
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 60;

  // Signatures
  addDocumentFooter(doc, 'Firma y Cédula del Comprador', 'Gerente Comercial / Administrador de Finca');

  doc.save(`Acta_Liquidacion_Venta_${saleData.invoiceNumber}_${saleData.saleDate}.pdf`);
}


