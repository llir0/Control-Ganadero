import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Scan,
  Camera,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Upload,
  SwitchCamera,
  RefreshCw,
  Plus,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { Animal } from '../types';

interface QRScannerModalProps {
  animals: Animal[];
  onSelectAnimal: (animal: Animal) => void;
  onClose: () => void;
  onAddNewAnimalWithId?: (tagId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  animals,
  onSelectAnimal,
  onClose,
  onAddNewAnimalWithId,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanningStatus, setScanningStatus] = useState<string>('Iniciando cámara...');
  const [scanResult, setScanResult] = useState<{ found: boolean; tagId: string; animal?: Animal } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play pleasant acoustic beep on successful QR scan
  const playSuccessBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Helper to extract animal ID from QR payload
  const parseAnimalIdFromQR = (rawText: string): string => {
    const trimmed = rawText.trim();
    // Case: URL like https://controlganaderopro.app/animal/17 or /animal/17
    const urlMatch = trimmed.match(/\/animal\/([a-zA-Z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    // Case: TAG #17 or TAG-17 or #17
    const tagMatch = trimmed.match(/(?:TAG|ARETE|NO\.?)\s*#?([a-zA-Z0-9_-]+)/i);
    if (tagMatch && tagMatch[1]) {
      return tagMatch[1];
    }
    // Case: #17
    if (trimmed.startsWith('#')) {
      return trimmed.slice(1);
    }
    return trimmed;
  };

  const processDecodedCode = (decodedString: string) => {
    const parsedId = parseAnimalIdFromQR(decodedString);
    if (!parsedId) return;

    playSuccessBeep();
    const found = animals.find(
      (a) => a.id.toLowerCase() === parsedId.toLowerCase()
    );

    if (found) {
      setScanResult({ found: true, tagId: parsedId, animal: found });
      setScanningStatus(`¡Arete #${parsedId} detectado con éxito!`);
      setTimeout(() => {
        onSelectAnimal(found);
        onClose();
      }, 700);
    } else {
      setScanResult({ found: false, tagId: parsedId });
      setErrorMessage(`El código detectado "${parsedId}" no coincide con ningún bovino en el hato actual.`);
    }
  };

  // Start device camera
  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    setScanningStatus('Solicitando acceso a cámara...');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador no soporta acceso directo a cámara');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setScanningStatus('Escaneando en tiempo real...');
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Puedes subir una foto del código o buscar por número.');
      } else {
        setCameraError('Cámara no disponible en este dispositivo. Usa la opción de subir foto o búsqueda manual.');
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Continuous frame analysis loop with jsQR
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            processDecodedCode(code.data);
            return; // stop loop upon successful decode
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  };

  // Handle uploading or snapping a photo of QR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningStatus('Analizando imagen de arete...');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            processDecodedCode(code.data);
          } else {
            setErrorMessage('No se detectó un código QR legible en la imagen. Intenta con mayor iluminación o enfoque.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const parsedId = parseAnimalIdFromQR(manualCode);
    const found = animals.find(
      (a) => a.id.toLowerCase() === parsedId.toLowerCase()
    );

    if (found) {
      playSuccessBeep();
      onSelectAnimal(found);
      onClose();
    } else {
      setErrorMessage(`No se encontró ningún bovino registrado con el arete Tag #${parsedId}`);
    }
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 space-y-4 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Escáner Óptico de Aretes QR
              </h3>
              <p className="text-[11px] text-slate-400">
                Trazabilidad y apertura instantánea de ficha zootécnica
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for photo upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Scanner Viewport */}
        <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl border-2 border-emerald-500/40 overflow-hidden shadow-inner flex items-center justify-center shrink-0">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Viewfinder Overlay Targeting Box */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  {/* Target Corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                  {/* Animated laser line */}
                  <motion.div
                    animate={{ y: [-90, 90, -90] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]"
                  />
                </div>
              </div>

              {/* Controls bar over camera */}
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Cambiar Cámara"
                  className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white border border-slate-700 shadow-lg"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{scanningStatus}</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-700 flex items-center space-x-1.5 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subir Foto</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {cameraError || 'La cámara está inactiva o requiere autorización.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subir Foto / Archivo</span>
                </button>
              </div>
            </div>
          )}

          {/* Scan Success Green Splash */}
          <AnimatePresence>
            {scanResult?.found && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-2 z-20"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-base font-extrabold text-white">¡Arete Identificado!</h4>
                <p className="text-sm font-mono text-emerald-300 font-bold">
                  Tag #{scanResult.tagId} - {scanResult.animal?.name || scanResult.animal?.breed}
                </p>
                <span className="text-xs text-slate-400">Abriendo ficha completa...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error / Not found banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {scanResult && !scanResult.found && onAddNewAnimalWithId && (
                <button
                  type="button"
                  onClick={() => {
                    onAddNewAnimalWithId(scanResult.tagId);
                    onClose();
                  }}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar nuevo ejemplar con Tag #{scanResult.tagId}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Manual Code Search */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5 shrink-0">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Búsqueda Rápida por Número de Arete
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ej: 17, 12, 9, 15, 14..."
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 flex items-center space-x-1.5"
            >
              <span>Abrir Ficha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Demo Animals Tag Buttons */}
        <div className="pt-2 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Aretes del Hato (Acceso Rápido):
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {animals.length} registrados
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto no-scrollbar">
            {animals.slice(0, 6).map((animal) => (
              <button
                key={animal.id}
                type="button"
                onClick={() => {
                  playSuccessBeep();
                  onSelectAnimal(animal);
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="truncate">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-black text-white group-hover:text-emerald-400 font-mono">
                      TAG #{animal.id}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 font-semibold">
                      {animal.sex}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">
                    {animal.breed}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
