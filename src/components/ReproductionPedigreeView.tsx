import React, { useState, useMemo } from 'react';
import {
  Heart,
  Baby,
  Calendar,
  Sparkles,
  GitFork,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Filter,
} from 'lucide-react';
import { Animal, ReproductiveEvent } from '../types';
import {
  getStoredReproductiveEvents,
  addReproductiveEvent,
  calculateExpectedCalvingDate,
  registerCalfFromBirth,
} from '../lib/storage';

interface ReproductionPedigreeViewProps {
  animals: Animal[];
  onRefreshData: () => void;
  onOpenDetail: (animal: Animal) => void;
}

export const ReproductionPedigreeView: React.FC<ReproductionPedigreeViewProps> = ({
  animals,
  onRefreshData,
  onOpenDetail,
}) => {
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'pedigree' | 'events'>('dashboard');
  const [selectedAnimalForPedigreeId, setSelectedAnimalForPedigreeId] = useState<string>('17');
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);

  // New Event Form State
  const [formAnimalId, setFormAnimalId] = useState('');
  const [formType, setFormType] = useState<ReproductiveEvent['type']>('Inseminación Artificial');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDetails, setFormDetails] = useState('');
  const [formSire, setFormSire] = useState('');
  const [formTechnician, setFormTechnician] = useState('Dr. Danilo C. Ramírez');
  const [formPregnancyResult, setFormPregnancyResult] = useState<'Positiva' | 'Negativa' | 'Dudosa'>('Positiva');
  const [formNotes, setFormNotes] = useState('');
  const [calfSex, setCalfSex] = useState<'M' | 'F'>('M');
  const [calfWeight, setCalfWeight] = useState<number>(34);
  const [calfTag, setCalfTag] = useState('');

  const reproductiveEvents = useMemo(() => getStoredReproductiveEvents(), [animals]);

  // Female breeding herd
  const females = useMemo(() => {
    return animals.filter((a) => a.sex === 'F' && a.status === 'ACT');
  }, [animals]);

  // Stats
  const pregnantCount = females.filter((f) => f.reproductiveStatus === 'Preñada').length;
  const inHeatCount = females.filter((f) => f.reproductiveStatus === 'En Celo' || f.reproductiveStatus === 'Servida').length;
  const lactatingCount = females.filter((f) => f.reproductiveStatus === 'Lactancia' || f.purpose === 'LECHE').length;
  const pregnancyRate = females.length > 0 ? Math.round((pregnantCount / females.length) * 100) : 0;

  // Upcoming calvings (next 60 days)
  const upcomingCalvings = useMemo(() => {
    const today = new Date();
    return females
      .filter((f) => f.expectedCalvingDate)
      .map((f) => {
        const calvDate = new Date(f.expectedCalvingDate!);
        const diffDays = Math.ceil((calvDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          animal: f,
          daysLeft: diffDays,
          date: f.expectedCalvingDate!,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [females]);

  // Selected animal for Pedigree
  const pedigreeAnimal = useMemo(() => {
    return animals.find((a) => a.id === selectedAnimalForPedigreeId) || animals[0];
  }, [animals, selectedAnimalForPedigreeId]);

  // Handle Event Submit
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAnimalId) {
      alert('Seleccione un animal');
      return;
    }

    if (formType === 'Parto') {
      registerCalfFromBirth(
        formAnimalId,
        {
          tagId: calfTag.trim() || undefined,
          sex: calfSex,
          birthWeightKg: calfWeight || 34,
          birthDate: formDate,
          fatherId: formSire || undefined,
        },
        formTechnician
      );
    } else {
      addReproductiveEvent({
        animalId: formAnimalId,
        date: formDate,
        type: formType,
        details: formDetails || `${formType} - Registro veterinario`,
        sireTagOrName: formSire || undefined,
        technicianName: formTechnician,
        pregnancyResult: formType.includes('Diagnóstico') ? formPregnancyResult : undefined,
        notes: formNotes || undefined,
      });
    }

    onRefreshData();
    setIsNewEventModalOpen(false);
    // Reset form
    setFormDetails('');
    setFormSire('');
    setFormNotes('');
    setCalfTag('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                CattleMax & Control Ganadero
              </span>
              <span className="text-xs text-slate-400">Fertilidad, Gestación y Genealogía</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Módulo Reproductivo & Pedigree
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Control de servicios, inseminaciones, diagnóstico de preñez con cálculo de fecha esperada de parto (283 días) y árbol genealógico de 3 generaciones.
            </p>
          </div>

          <button
            onClick={() => {
              if (females.length > 0) setFormAnimalId(females[0].id);
              setIsNewEventModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar Evento Reproductivo
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSelectedTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            selectedTab === 'dashboard'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Baby className="w-4 h-4" />
          Tablero de Fertilidad & Partos
        </button>

        <button
          onClick={() => setSelectedTab('pedigree')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            selectedTab === 'pedigree'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <GitFork className="w-4 h-4" />
          Árbol Genealógico / Pedigree
        </button>

        <button
          onClick={() => setSelectedTab('events')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            selectedTab === 'events'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Historial de Montas & Palpaciones ({reproductiveEvents.length})
        </button>
      </div>

      {/* TAB 1: DASHBOARD DE FERTILIDAD */}
      {selectedTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Hembras Reproductoras</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-white">{females.length}</span>
                <span className="text-xs text-slate-500">vientres activos</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">Gestaciones Confirmadas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{pregnantCount}</span>
                <span className="text-xs text-emerald-400/80 font-bold font-mono">({pregnancyRate}% tasa)</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">En Celo / Servidas Recientes</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-pink-400">{inHeatCount}</span>
                <span className="text-xs text-slate-500">pend. confirmación</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-xs text-slate-400 block font-medium">En Lactancia / Ordeño</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400">{lactatingCount}</span>
                <span className="text-xs text-slate-500">madres activas</span>
              </div>
            </div>
          </div>

          {/* Upcoming Calvings & Female Herd List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Próximos Partos (CattleMax style countdown) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Baby className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-white text-base">Próximos Partos Programados</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  {upcomingCalvings.length}
                </span>
              </div>

              {upcomingCalvings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingCalvings.map(({ animal, daysLeft, date }) => (
                    <div
                      key={animal.id}
                      onClick={() => onOpenDetail(animal)}
                      className="p-3.5 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                          {animal.photoUrl ? (
                            <img src={animal.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                              #{animal.id}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {animal.name || `Vaca #${animal.id}`}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                              #{animal.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            Parto previsto: {date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-mono px-2 py-1 rounded-lg ${
                            daysLeft <= 15
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : daysLeft <= 45
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {daysLeft > 0 ? `Faltan ${daysLeft}d` : 'Fecha cumplida'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No hay fechas de parto registradas en las hembras actualmente.
                </div>
              )}
            </div>

            {/* Hembras Reproductoras Table */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Estado Reproductivo del Hato</h3>
                <span className="text-xs text-slate-400">{females.length} hembras activas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Vaca / Tag</th>
                      <th className="py-2.5 px-3">Raza</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Último Servicio</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {females.map((vaca) => (
                      <tr key={vaca.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block">{vaca.name || `Tag #${vaca.id}`}</span>
                          <span className="text-[10px] text-amber-400 font-mono">TAG: {vaca.id}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{vaca.breed}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              vaca.reproductiveStatus === 'Preñada'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : vaca.reproductiveStatus === 'En Celo'
                                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                                : vaca.reproductiveStatus === 'Servida'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : vaca.reproductiveStatus === 'Lactancia'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {vaca.reproductiveStatus || 'Vacia'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {vaca.lastServiceDate || 'Sin registro'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenDetail(vaca)}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline text-[11px]"
                          >
                            Ver Ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PEDIGREE / ARBOL GENEALÓGICO (CattleMax style) */}
      {selectedTab === 'pedigree' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">Explorador de Árbol Genealógico</h3>
                <span className="text-xs text-slate-400">Linaje y ancestros de 3 generaciones</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400">Animal:</span>
              <select
                value={selectedAnimalForPedigreeId}
                onChange={(e) => setSelectedAnimalForPedigreeId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-64"
              >
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    Tag #{a.id} - {a.name || a.breed} ({a.sex === 'M' ? 'Macho' : 'Hembra'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Pedigree Chart (3 Generations Tree) */}
          {pedigreeAnimal && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
              <div className="min-w-[760px] grid grid-cols-3 gap-6 relative">
                {/* Generation 1: Subject Animal */}
                <div className="flex flex-col justify-center">
                  <div className="p-4 bg-gradient-to-br from-emerald-950/60 to-slate-950 border-2 border-emerald-500/50 rounded-2xl shadow-xl relative">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                      Individuo Evaluado
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0">
                        {pedigreeAnimal.photoUrl ? (
                          <img src={pedigreeAnimal.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-slate-400">
                            #{pedigreeAnimal.id}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-base font-bold text-white block">
                          {pedigreeAnimal.name || `Tag #${pedigreeAnimal.id}`}
                        </span>
                        <span className="text-xs font-mono text-amber-300 block">TAG #{pedigreeAnimal.id}</span>
                        <span className="text-[11px] text-slate-400 block">{pedigreeAnimal.breed}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                      <span>Hierro: {pedigreeAnimal.ironBrand || 'N/A'}</span>
                      <span>Peso: {pedigreeAnimal.currentWeightKg} Kg</span>
                    </div>
                  </div>
                </div>

                {/* Generation 2: Sire & Dam (Padres) */}
                <div className="flex flex-col justify-around gap-6">
                  {/* Sire (Padre) */}
                  {(() => {
                    const sireAnimal = animals.find((a) => a.id === pedigreeAnimal.fatherId);
                    return (
                      <div className="p-3.5 bg-slate-950 border border-blue-500/40 rounded-xl relative shadow-md">
                        <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">
                          Padre (Toro Semental) ♂
                        </span>
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{pedigreeAnimal.fatherId ? `Tag / Toro #${pedigreeAnimal.fatherId}` : 'No Registrado'}</span>
                          {sireAnimal && (
                            <button
                              type="button"
                              onClick={() => onOpenDetail(sireAnimal)}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                            >
                              Ver Ficha →
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {sireAnimal ? `${sireAnimal.name || sireAnimal.breed} (${sireAnimal.currentWeightKg} Kg)` : (pedigreeAnimal.originNotes || 'Linaje Paterno')}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Dam (Madre) */}
                  {(() => {
                    const damAnimal = animals.find((a) => a.id === pedigreeAnimal.motherId);
                    return (
                      <div className="p-3.5 bg-slate-950 border border-pink-500/40 rounded-xl relative shadow-md">
                        <span className="text-[10px] uppercase font-bold text-pink-400 block mb-1">
                          Madre (Vaca Matriz) ♀
                        </span>
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span>{pedigreeAnimal.motherId ? `Tag / Vaca #${pedigreeAnimal.motherId}` : 'No Registrado'}</span>
                          {damAnimal && (
                            <button
                              type="button"
                              onClick={() => onOpenDetail(damAnimal)}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                            >
                              Ver Ficha →
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {damAnimal ? `${damAnimal.name || damAnimal.breed} (${damAnimal.purpose})` : 'Linaje Materno'}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Generation 3: Grandparents (Abuelos) */}
                <div className="flex flex-col justify-between gap-4">
                  {/* Paternal Grandfather */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <span className="text-[9px] uppercase font-semibold text-blue-300 block">Abuelo Paterno ♂</span>
                    <span className="font-bold text-white block truncate">
                      {pedigreeAnimal.paternalGrandfather || 'Semental Registrado #1'}
                    </span>
                  </div>

                  {/* Paternal Grandmother */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <span className="text-[9px] uppercase font-semibold text-pink-300 block">Abuela Paterna ♀</span>
                    <span className="font-bold text-white block truncate">
                      {pedigreeAnimal.paternalGrandmother || 'Vaca Matriz #08'}
                    </span>
                  </div>

                  {/* Maternal Grandfather */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <span className="text-[9px] uppercase font-semibold text-blue-300 block">Abuelo Materno ♂</span>
                    <span className="font-bold text-white block truncate">
                      {pedigreeAnimal.maternalGrandfather || 'Toro Campeón #02'}
                    </span>
                  </div>

                  {/* Maternal Grandmother */}
                  <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs">
                    <span className="text-[9px] uppercase font-semibold text-pink-300 block">Abuela Materna ♀</span>
                    <span className="font-bold text-white block truncate">
                      {pedigreeAnimal.maternalGrandmother || 'Matriarca Leche #05'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EVENTOS REPRODUCTIVOS HISTORIAL */}
      {selectedTab === 'events' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Bitácora de Servicios, Inseminaciones y Palpaciones</h3>
            <span className="text-xs text-slate-400">{reproductiveEvents.length} eventos históricos</span>
          </div>

          <div className="divide-y divide-slate-800">
            {reproductiveEvents.map((ev) => (
              <div key={ev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {ev.type}
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      Vaca #{ev.animalId}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {ev.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">{ev.details}</p>
                  {ev.notes && <p className="text-[11px] text-slate-400 italic">Nota: {ev.notes}</p>}
                </div>

                <div className="text-right shrink-0 text-xs text-slate-400">
                  <span className="block text-slate-300 font-medium">Técnico: {ev.technicianName || 'Dr. Danilo'}</span>
                  {ev.sireTagOrName && (
                    <span className="block text-amber-300 font-mono">Toro: {ev.sireTagOrName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nuevo Evento Reproductivo */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-400" />
              Nuevo Evento Reproductivo
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hembra / Vaca</label>
                <select
                  value={formAnimalId}
                  onChange={(e) => setFormAnimalId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  required
                >
                  {females.map((f) => (
                    <option key={f.id} value={f.id}>
                      Tag #{f.id} - {f.name || f.breed}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Evento</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    <option value="Inseminación Artificial">Inseminación Artificial (IA)</option>
                    <option value="Monta Natural">Monta Natural</option>
                    <option value="Celo Detectado">Celo Detectado</option>
                    <option value="Diagnóstico Palpación">Diagnóstico Palpación</option>
                    <option value="Diagnóstico Ecografía">Diagnóstico Ecografía</option>
                    <option value="Parto">Parto Registrado</option>
                    <option value="Secado">Secado Programado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                    required
                  />
                </div>
              </div>

              {(formType === 'Inseminación Artificial' || formType === 'Monta Natural') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Toro / Pajuela Utilizada</label>
                  <input
                    type="text"
                    placeholder="Ej. Pajuela Toro Brahman Campeón #17"
                    value={formSire}
                    onChange={(e) => setFormSire(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Se calculará automáticamente la fecha probable de parto a 283 días.
                  </span>
                </div>
              )}

              {formType.includes('Diagnóstico') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Resultado del Diagnóstico</label>
                  <select
                    value={formPregnancyResult}
                    onChange={(e) => setFormPregnancyResult(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    <option value="Positiva">Positiva (Preñada)</option>
                    <option value="Negativa">Negativa (Vacía)</option>
                    <option value="Dudosa">Dudosa / Repetir en 15 días</option>
                  </select>
                </div>
              )}

              {formType === 'Parto' && (
                <div className="p-3.5 bg-pink-950/40 border border-pink-500/40 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300">
                    <Baby className="w-4 h-4 text-pink-400" />
                    <span>Registro Inmediato del Ternero / Cría en el Hato</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Se creará automáticamente la ficha del nuevo ternero con genealogía enlazada, corral de maternidad y arete oficial.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Sexo</label>
                      <select
                        value={calfSex}
                        onChange={(e) => setCalfSex(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                      >
                        <option value="M">Macho (♂)</option>
                        <option value="F">Hembra (♀)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Peso Nacimiento (Kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={calfWeight}
                        onChange={(e) => setCalfWeight(parseFloat(e.target.value) || 30)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Arete Tag # (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Automático"
                        value={calfTag}
                        onChange={(e) => setCalfTag(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detalles de la Intervención</label>
                <input
                  type="text"
                  placeholder="Ej. Inseminación a tiempo fijo con protocolo de sincronización"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Veterinario / Inseminador</label>
                <input
                  type="text"
                  value={formTechnician}
                  onChange={(e) => setFormTechnician(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white text-xs font-bold cursor-pointer shadow-lg"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
