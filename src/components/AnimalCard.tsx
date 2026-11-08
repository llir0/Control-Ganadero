import React from 'react';
import { motion } from 'motion/react';
import {
  QrCode,
  FileText,
  AlertTriangle,
  Scale,
  Calendar,
  User,
  Activity,
  CheckCircle2,
  XCircle,
  Tag,
  Stethoscope,
  Edit2,
  TrendingUp,
  Heart,
  Droplets,
  ShieldAlert,
  Eye,
  Award,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Animal } from '../types';
import { calculateAge, checkWithdrawalStatus } from '../lib/storage';

interface AnimalCardProps {
  animal: Animal;
  onOpenDetail: (animal: Animal) => void;
  onOpenQR: (animal: Animal) => void;
  onAddMedicalRecord: (animal: Animal) => void;
  onEdit?: (animal: Animal) => void;
  onOpenMangaForAnimal?: (animal: Animal) => void;
  onOpenBCS?: (animal: Animal) => void;
  onOpenPassport?: (animal: Animal) => void;
  onOpenMapForPaddock?: (paddockId: string) => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  onOpenDetail,
  onOpenQR,
  onAddMedicalRecord,
  onEdit,
  onOpenMangaForAnimal,
  onOpenBCS,
  onOpenPassport,
  onOpenMapForPaddock,
}) => {
  const age = calculateAge(animal.birthDate);

  const getPurposeBadgeColor = (purpose: string) => {
    switch (purpose) {
      case 'CRIA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CEBA':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'LECHE':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'REPRODUCTOR':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative bg-slate-900/90 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-950/30 ${
        animal.status === 'ACT'
          ? 'border-slate-800 hover:border-emerald-500/50'
          : 'border-slate-800/60 opacity-80 bg-slate-950/80'
      }`}
    >
      {/* Top Photo Banner (if available) */}
      {animal.photoUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-slate-950">
          <img
            src={animal.photoUrl}
            alt={animal.name || `Animal ${animal.id}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
          {/* Quick Tag Badge Over Image */}
          <div className="absolute top-3 left-3 flex items-center space-x-1.5">
            <div className="px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 flex items-center space-x-1.5 shadow-lg">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-black text-white font-mono">TAG #{animal.id}</span>
            </div>
            {animal.ironBrand && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md text-amber-300 border border-slate-700 font-bold shadow-lg">
                Hierro {animal.ironBrand}
              </span>
            )}
          </div>
          {/* Status Badge Over Image */}
          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border backdrop-blur-md shadow-md flex items-center gap-1 ${
                animal.status === 'ACT'
                  ? 'bg-emerald-950/85 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-950/85 text-rose-400 border-rose-500/40'
              }`}
            >
              {animal.status === 'ACT' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACT
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-400" /> IAC
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Top Banner & Tags */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-start justify-between gap-2">
          {/* Tag Number & Name */}
          <div className="flex items-center space-x-2.5">
            {!animal.photoUrl && (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex flex-col items-center justify-center shadow-inner group-hover:border-emerald-500/40 transition-colors">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">NO.</span>
                <span className="text-base font-extrabold text-white font-mono leading-none">{animal.id}</span>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  {animal.name || `Animal Tag #${animal.id}`}
                </h3>
                {animal.sex === 'M' ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold" title="Macho">
                    ♂ M
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold" title="Hembra">
                    ♀ F
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <span>{animal.breed}</span>
                {!animal.photoUrl && animal.ironBrand && (
                  <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Hierro: {animal.ironBrand}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status & Purpose Badges */}
          <div className="flex flex-col items-end gap-1">
            {!animal.photoUrl && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  animal.status === 'ACT'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {animal.status === 'ACT' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACT
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-400" /> IAC
                  </>
                )}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPurposeBadgeColor(animal.purpose)}`}>
                {animal.purpose}
              </span>
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(animal);
                  }}
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors border border-slate-700/60 cursor-pointer"
                  title="Editar Ficha"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Herdwatch: Active Withdrawal Alert Banner */}
        {(() => {
          const wInfo = checkWithdrawalStatus(animal.withdrawalUntilDate);
          if (wInfo.isWithdrawn) {
            return (
              <div className="mt-2.5 p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] flex items-center justify-between gap-1.5 font-medium animate-pulse">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  ⛔ Retiro Sanitario Activo
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-800">
                  {wInfo.daysRemaining}d restantes
                </span>
              </div>
            );
          }
          return null;
        })()}

        {/* Warning Callout if present */}
        {animal.warningNote && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-1.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{animal.warningNote}</span>
          </div>
        )}
      </div>

      {/* Body Stats */}
      <div className="p-4 space-y-3 text-xs text-slate-300">
        <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Edad Calculada</span>
            <span className="font-semibold text-slate-200">
              {age.years}a {age.months}m {age.days}d
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Peso Actual</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              {animal.currentWeightKg} Kg
            </span>
          </div>
        </div>

        {/* Jetbov GDP & CattleMax Reproduction Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {animal.lastAdgGramsPerDay !== undefined && (
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                animal.lastAdgGramsPerDay >= 800
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : animal.lastAdgGramsPerDay >= 400
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
              title="Ganancia Diaria de Peso (Jetbov)"
            >
              <TrendingUp className="w-3 h-3" />
              {animal.lastAdgGramsPerDay > 0 ? `+${animal.lastAdgGramsPerDay}` : animal.lastAdgGramsPerDay} g/d
            </span>
          )}

          {animal.reproductiveStatus && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                animal.reproductiveStatus === 'Preñada'
                  ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                  : animal.reproductiveStatus === 'En Celo'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Heart className="w-3 h-3 text-pink-400" />
              {animal.reproductiveStatus}
            </span>
          )}

          {animal.dailyMilkYieldLiters !== undefined && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-400" />
              {animal.dailyMilkYieldLiters} L/d
            </span>
          )}

          {animal.bodyConditionScore !== undefined && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
              BCS {animal.bodyConditionScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* Corral, Potrero & Worker */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="truncate max-w-[160px]">
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Ubicación / Potrero</span>
            <span className="text-slate-300 font-medium truncate block">{animal.corralName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMapForPaddock?.(animal.paddockId || 'pad-1');
              }}
              className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 hover:underline text-left truncate cursor-pointer"
              title="Ver potrero en mapa D3"
            >
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{animal.paddockName || 'Potrero El Roble'}</span>
            </button>
          </div>
          <div className="text-right truncate max-w-[130px]">
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Responsable</span>
            <span className="text-slate-300 font-medium truncate block flex items-center justify-end gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {animal.assignedWorkerName || 'No asignado'}
            </span>
          </div>
        </div>

        {/* Quick Connected Workflows Row */}
        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-800/50 text-[10px]">
          {onOpenMangaForAnimal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMangaForAnimal(animal);
              }}
              className="py-1 px-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-emerald-300 border border-emerald-500/20 font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Pesar inmediatamente en báscula"
            >
              <Scale className="w-2.5 h-2.5 text-emerald-400" />
              <span>Báscula</span>
            </button>
          )}

          {onOpenBCS && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBCS(animal);
              }}
              className="py-1 px-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-purple-300 border border-purple-500/20 font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Evaluar condición corporal (BCS)"
            >
              <Eye className="w-2.5 h-2.5 text-purple-400" />
              <span>BCS</span>
            </button>
          )}

          {onOpenPassport && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPassport(animal);
              }}
              className="py-1 px-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-amber-300 border border-amber-500/20 font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Ver pasaporte de trazabilidad HerdX"
            >
              <Award className="w-2.5 h-2.5 text-amber-400" />
              <span>HerdX</span>
            </button>
          )}
        </div>

        {/* Pedigree Sires hint */}
        {(animal.fatherId || animal.motherId) && (
          <div className="text-[10px] text-slate-400 bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-800 flex justify-between">
            <span>Padre: <strong className="text-slate-200">{animal.fatherId || 'Desc.'}</strong></span>
            <span>Madre: <strong className="text-slate-200">{animal.motherId || 'Desc.'}</strong></span>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => onOpenDetail(animal)}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all border border-slate-700/80 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Historial</span>
        </button>

        <button
          onClick={() => onOpenQR(animal)}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold transition-all border border-emerald-500/20 cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Ver QR</span>
        </button>

        <button
          onClick={() => onAddMedicalRecord(animal)}
          className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold transition-all border border-emerald-500/30 cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Atención</span>
        </button>
      </div>
    </motion.div>
  );
};
