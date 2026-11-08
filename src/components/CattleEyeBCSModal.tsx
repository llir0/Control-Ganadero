import React, { useState } from 'react';
import {
  Eye,
  Activity,
  CheckCircle2,
  Sparkles,
  Scale,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Animal } from '../types';
import { estimateWeightZoomentric, saveStoredAnimal } from '../lib/storage';

interface CattleEyeBCSModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onRefreshData: () => void;
}

export const CattleEyeBCSModal: React.FC<CattleEyeBCSModalProps> = ({
  isOpen,
  onClose,
  animal,
  onRefreshData,
}) => {
  const [bcsScore, setBcsScore] = useState<number>(animal?.bodyConditionScore || 3.0);
  const [heartGirthCm, setHeartGirthCm] = useState<number>(animal?.chestGirthCm || 205);
  const [bodyLengthCm, setBodyLengthCm] = useState<number>(animal?.bodyLengthCm || 155);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !animal) return null;

  // Real-time Crevat formula estimation
  const estimatedWeightKg = estimateWeightZoomentric(heartGirthCm, bodyLengthCm);

  // Body condition score descriptions
  const getBcsInfo = (score: number) => {
    if (score < 2.0) {
      return {
        label: 'Emaciada / Muy Flaca (BCS 1.0 - 1.75)',
        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        desc: 'Huesos de la cadera, costillas y espina dorsal muy prominentes. Sin grasa subcutánea visible.',
        advice: '⚠️ Urgente: Suministrar concentrado de alta energía, pasto de corte y revisión de parásitos o hemoparásitos.',
      };
    }
    if (score < 3.0) {
      return {
        label: 'Moderada / Delgada (BCS 2.0 - 2.75)',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        desc: 'Costillas ligeramente visibles. Apófisis transversas palpables pero suaves.',
        advice: 'Requiere suplementación con sales mineralizadas con fósforo y forraje de mejor calidad.',
      };
    }
    if (score <= 3.75) {
      return {
        label: 'Óptima / Ideal (BCS 3.0 - 3.75)',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        desc: 'Estructura armónica. Costillas cubiertas con fina capa de grasa. Condición ideal para monta, parto o ceba.',
        advice: '🌟 Excelente condición nutricional y productiva. Mantener plan de pastoreo actual.',
      };
    }
    if (score <= 4.5) {
      return {
        label: 'Con Sobrepeso (BCS 4.0 - 4.5)',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        desc: 'Depósitos de grasa en la base de la cola y pecho. Huesos no visibles.',
        advice: 'Animal listo para venta o faena. En vacas lecheras o cría, evitar exceso para prevenir distocias.',
      };
    }
    return {
      label: 'Obesa (BCS > 4.5)',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      desc: 'Abundante grasa en ubres y cuartos traseros. Riesgo de problemas metabólicos.',
      advice: 'Reducir ración de concentrado energético y fomentar pastoreo en potreros amplios.',
    };
  };

  const bcsInfo = getBcsInfo(bcsScore);

  const handleSaveBiometrics = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAnimal: Animal = {
      ...animal,
      bodyConditionScore: bcsScore,
      chestGirthCm: heartGirthCm,
      bodyLengthCm: bodyLengthCm,
    };

    saveStoredAnimal(updatedAnimal, 'CattleEye AI Assistant');
    onRefreshData();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            CattleEye & Zoométrica AI
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1">
          Condición Corporal (BCS) & Estimador de Peso
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Animal Tag #{animal.id} ({animal.name || animal.breed})
        </p>

        {savedSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-bold text-white">Datos Biométricos Actualizados</h4>
            <p className="text-xs text-slate-400">Condición Corporal y Medidas guardadas en la ficha.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveBiometrics} className="space-y-6">
            {/* BCS Slider & Assessment */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">
                  Puntaje de Condición Corporal (BCS 1.0 - 5.0)
                </span>
                <span className="text-xl font-black text-white font-mono">{bcsScore.toFixed(2)}</span>
              </div>

              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.25"
                value={bcsScore}
                onChange={(e) => setBcsScore(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 px-1 font-mono">
                <span>1.0 Emaciada</span>
                <span>2.0 Delgada</span>
                <span>3.0 Óptima</span>
                <span>4.0 Grasa</span>
                <span>5.0 Obesa</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${bcsInfo.badgeColor}`}>
                  {bcsInfo.label}
                </span>
                <p className="text-xs text-slate-300">{bcsInfo.desc}</p>
                <p className="text-xs text-cyan-300/90 font-medium pt-1">{bcsInfo.advice}</p>
              </div>
            </div>

            {/* Crevat / Barimetric Heart Girth Estimator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase">
                  Estimación de Peso por Cinta Zoométrica (Fórmula de Crevat)
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Perímetro Torácico (cm)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="280"
                    value={heartGirthCm}
                    onChange={(e) => setHeartGirthCm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">Alrededor del corazón</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Largo Corporal (cm)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="220"
                    value={bodyLengthCm}
                    onChange={(e) => setBodyLengthCm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-500">De hombro a isquion</span>
                </div>
              </div>

              {/* Calculated preview */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Peso Estimado en Vivo
                  </span>
                  <span className="text-xs text-slate-300">
                    Peso actual en báscula: <strong>{animal.currentWeightKg} Kg</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    ~{estimatedWeightKg} KG
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 text-white text-xs font-bold cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Guardar Condición & Medidas
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
