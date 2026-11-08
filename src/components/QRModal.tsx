import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Printer,
  QrCode,
  Download,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Animal } from '../types';

interface QRModalProps {
  animal: Animal | null;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ animal, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  if (!animal) return null;

  const qrUrl = `https://controlganaderopro.app/animal/${animal.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    // Open a dedicated clean print window to isolate the tag from the dark application UI
    const printWindow = window.open('', '_blank', 'width=700,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Arete Oficial - Tag #${animal.id}</title>
            <style>
              @page {
                size: auto;
                margin: 15mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background-color: #ffffff;
                color: #000000;
              }
              .tag-card {
                width: 380px;
                background: #facc15;
                border: 4px solid #ca8a04;
                border-radius: 28px;
                padding: 24px;
                text-align: center;
                box-shadow: none;
                position: relative;
              }
              .hole {
                width: 22px;
                height: 22px;
                background: #ffffff;
                border: 3px solid #ca8a04;
                border-radius: 50%;
                margin: 0 auto 12px auto;
              }
              .farm-title {
                font-size: 13px;
                font-weight: 900;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                border-bottom: 2px solid rgba(0,0,0,0.25);
                padding-bottom: 6px;
                margin-bottom: 14px;
              }
              .qr-box {
                background: #ffffff;
                padding: 14px;
                border-radius: 16px;
                display: inline-block;
                border: 2px solid #000000;
              }
              .tag-num-title {
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 1.2px;
                text-transform: uppercase;
                margin-top: 12px;
              }
              .tag-num {
                font-size: 42px;
                font-weight: 900;
                letter-spacing: -1px;
                line-height: 1;
                margin: 4px 0 8px 0;
              }
              .meta-box {
                border-top: 2px solid rgba(0,0,0,0.25);
                padding-top: 8px;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                font-weight: 800;
              }
              .instructions {
                margin-top: 16px;
                font-size: 10px;
                color: #555555;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="tag-card">
              <div class="hole"></div>
              <div class="farm-title">FINCA SANTA GERTRUDIS</div>
              <div class="qr-box">
                ${svgContainerRef.current ? svgContainerRef.current.innerHTML : ''}
              </div>
              <div class="tag-num-title">ARETE OFICIAL / TAG ID</div>
              <div class="tag-num">#${animal.id}</div>
              <div class="meta-box">
                <span>Raza: ${animal.breed}</span>
                <span>Hierro: ${animal.ironBrand || 'N/A'}</span>
                <span>Sexo: ${animal.sex}</span>
              </div>
            </div>
            <p class="instructions">Control Ganadero Pro • Trazabilidad Bovina Certificada</p>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      // Fallback if popup blocked
      window.print();
    }
  };

  const handleDownloadPNG = () => {
    setIsExporting(true);

    try {
      // Find the SVG element in the modal
      const svg = svgContainerRef.current?.querySelector('svg');
      if (!svg) {
        setIsExporting(false);
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const qrImg = new Image();
      qrImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 740;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsExporting(false);
          return;
        }

        // Background / Tag shape (Ear tag polygon)
        ctx.fillStyle = '#facc15'; // Amber yellow tag
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 8;

        // Draw rounded tag shape
        const r = 32;
        const x = 20, y = 20, w = 560, h = 700;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ear tag hole cutout circle at top
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(300, 60, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Farm Header
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FINCA SANTA GERTRUDIS', 300, 115);

        // Divider
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 130);
        ctx.lineTo(540, 130);
        ctx.stroke();

        // White container for QR
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(140, 150, 320, 320, 24);
        ctx.fill();
        ctx.stroke();

        // Draw QR code
        ctx.drawImage(qrImg, 160, 170, 280, 280);

        // Tag number title
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('ARETE OFICIAL / TAG ID', 300, 515);

        // Large Tag Number
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 68px sans-serif';
        ctx.fillText(`#${animal.id}`, 300, 585);

        // Metadata divider
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 615);
        ctx.lineTo(540, 615);
        ctx.stroke();

        // Metadata footer
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Raza: ${animal.breed}`, 65, 655);
        ctx.textAlign = 'center';
        ctx.fillText(`Hierro: ${animal.ironBrand || 'N/A'}`, 300, 655);
        ctx.textAlign = 'right';
        ctx.fillText(`Sexo: ${animal.sex}`, 535, 655);

        // Convert to download link
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Arete_Ganado_TAG_${animal.id}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobURL);
        setIsExporting(false);
      };
      qrImg.src = blobURL;
    } catch (err) {
      console.error('Error generating PNG:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-100 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Arete Trazable QR
              </h3>
              <p className="text-[11px] text-slate-400">
                Impresión y credencial oficial de trazabilidad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Arete Tag Layout Printable Card */}
        <div
          id="printable-tag"
          className="bg-gradient-to-b from-amber-400 via-amber-400 to-amber-500 text-slate-950 p-5 sm:p-6 rounded-3xl border-4 border-amber-300 shadow-2xl text-center space-y-3.5 font-mono relative overflow-hidden"
        >
          {/* Tag Hole Cutout */}
          <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-500 mx-auto shadow-inner" />

          <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase border-b-2 border-slate-900/20 pb-2">
            <span>FINCA SANTA GERTRUDIS</span>
            <ShieldCheck className="w-4 h-4 text-slate-950" />
          </div>

          <div
            ref={svgContainerRef}
            className="bg-white p-3 rounded-2xl inline-block shadow-inner border-2 border-slate-950/10"
          >
            <QRCodeSVG
              value={qrUrl}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">
              NÚMERO DE ARETE / NO. ANIMAL
            </span>
            <span className="text-4xl font-black text-slate-950 tracking-tighter">
              #{animal.id}
            </span>
            {animal.name && (
              <span className="text-xs font-bold text-slate-800 block mt-0.5">
                "{animal.name}"
              </span>
            )}
          </div>

          <div className="text-[10px] font-bold uppercase text-slate-900 pt-2 border-t border-slate-900/20 flex justify-between px-2">
            <span>Raza: {animal.breed}</span>
            <span>Hierro: {animal.ironBrand || 'N/A'}</span>
            <span>Sexo: {animal.sex}</span>
          </div>
        </div>

        {/* Action Buttons: Print, Download, Copy Link */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Arete</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generando...' : 'Descargar PNG'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Enlace QR Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar Enlace de Consulta ({qrUrl})</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
