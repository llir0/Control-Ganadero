import React, { useRef } from 'react';
import {
  ShieldCheck,
  QrCode,
  Printer,
  X,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Animal, ClinicalRecord } from '../types';
import { checkWithdrawalStatus, getStoredClinicalRecords } from '../lib/storage';

interface HerdXPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
}

export const HerdXPassportModal: React.FC<HerdXPassportModalProps> = ({
  isOpen,
  onClose,
  animal,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !animal) return null;

  const clinicalHistory = getStoredClinicalRecords(animal.id);
  const withdrawalInfo = checkWithdrawalStatus(animal.withdrawalUntilDate);

  const verificationUrl = `${window.location.origin}?verifyTag=${animal.id}&hash=${Date.now()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Actions */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              HerdX Certified
            </span>
            <span className="text-xs text-slate-400">Pasaporte Digital de Trazabilidad e Inocuidad</span>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Imprimir Certificado
          </button>
        </div>

        {/* Official Printable Passport Document Sheet */}
        <div
          ref={printRef}
          className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border-4 border-emerald-800/80 font-sans print:m-0 print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-emerald-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-800" />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase">
                  Pasaporte de Trazabilidad Bovina
                </h2>
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                CERTIFICACIÓN ZOOSANITARIA DE ORIGEN & INOCUIDAD AGROPECUARIA
              </p>
              <span className="text-[10px] text-slate-500 font-mono block">
                Folio Registro: HX-{animal.id.padStart(6, '0')}-2026 • Finca Control Ganadero Pro
              </span>
            </div>

            <div className="text-center p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <QRCodeSVG value={verificationUrl} size={70} level="H" />
              <span className="text-[8px] font-mono text-slate-500 block mt-1">VERIFICAR QR</span>
            </div>
          </div>

          {/* Core Identification Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">No. Arete / TAG</span>
              <span className="text-lg font-black text-emerald-900 font-mono">#{animal.id}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Nombre / Registro</span>
              <span className="text-xs font-bold text-slate-800 block">{animal.name || `Tag #${animal.id}`}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Raza & Sexo</span>
              <span className="text-xs font-bold text-slate-800 block">
                {animal.breed} ({animal.sex === 'M' ? 'Macho' : 'Hembra'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Hierro de Finca</span>
              <span className="text-xs font-black text-amber-800 font-mono">{animal.ironBrand || 'TG'}</span>
            </div>
          </div>

          {/* Biological & Origin Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3 border-b border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Fecha Nacimiento</span>
              <span className="font-semibold text-slate-800">{animal.birthDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Peso Actual Registrado</span>
              <span className="font-bold text-slate-900 font-mono">{animal.currentWeightKg} Kg</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Propósito Zootécnico</span>
              <span className="font-semibold text-slate-800">{animal.purpose}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Padre Registrado</span>
              <span className="font-semibold text-slate-800">{animal.fatherId || 'Semental Certificado'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Madre Registrada</span>
              <span className="font-semibold text-slate-800">{animal.motherId || 'Matriz de Cría'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Procedencia</span>
              <span className="font-semibold text-slate-800">{animal.purchaseLocation || 'Nacido en Finca'}</span>
            </div>
          </div>

          {/* Health & Withdrawal Status Verification (Inocuidad Alimentaria) */}
          <div className="py-4 border-b border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
              Estado Sanitario & Tiempos de Retiro (Norma Oficial)
            </span>

            {withdrawalInfo.isWithdrawn ? (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <strong className="block font-bold">RESTRICCIÓN ACTIVA - NO APTO PARA CONSUMO INMEDIATO</strong>
                  <span>
                    El animal se encuentra en tiempo de carencia por {animal.withdrawalReason}. Retiro vence:{' '}
                    <strong>{animal.withdrawalUntilDate}</strong> ({withdrawalInfo.daysRemaining} días restantes).
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block font-bold">CERTIFICADO INOCUO - LIBRE DE RETIROS SANITARIOS</strong>
                  <span>
                    No registra tratamientos con antibióticos o químicos activos en período de carencia. Apto para transporte, ordeño comercial o beneficio.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Vaccines & Medical History table */}
          <div className="py-3">
            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">
              Registro Oficial de Vacunación e Inmunización
            </span>

            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[9px] font-bold">
                <tr>
                  <th className="py-1 px-2">Fecha</th>
                  <th className="py-1 px-2">Tipo</th>
                  <th className="py-1 px-2">Biológico / Producto</th>
                  <th className="py-1 px-2">Veterinario Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clinicalHistory.slice(0, 4).map((rec) => (
                  <tr key={rec.id}>
                    <td className="py-1 px-2 font-mono">{rec.date}</td>
                    <td className="py-1 px-2 font-semibold">{rec.type}</td>
                    <td className="py-1 px-2">{rec.medication}</td>
                    <td className="py-1 px-2">{rec.veterinarian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Seals */}
          <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 font-bold text-emerald-900">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Hato Libre de Brucelosis & Tuberculosis</span>
              </div>
              <span className="font-mono">Certificado SAGARPA/ICA No. 89441-2026</span>
            </div>

            <div className="text-right">
              <span className="font-semibold block text-slate-700">Firma Médico Veterinario Zootecnista</span>
              <span className="font-mono text-[9px]">Dr. Danilo C. Ramírez • Céd. Prof. 8401923</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
