import React, { useState, useEffect, useRef } from 'react';
import { X, ClipboardCheck, Download, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateExportBlob } from '../utils/canvasRenderer';

export default function ExportModal({
  isOpen,
  onClose,
  bgCanvas,
  shadowCanvas,
  mainCanvas,
  onShowToast
}) {
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(95);
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0); // 1.0 (100% Native) or 2.0 (200% Ultra HD)
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Sync native <dialog> state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Render composite image preview onto internal preview canvas
  useEffect(() => {
    if (!isOpen || !mainCanvas || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = mainCanvas.width;
    canvas.height = mainCanvas.height;
    const ctx = canvas.getContext('2d');

    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    if (shadowCanvas) ctx.drawImage(shadowCanvas, 0, 0);
    ctx.drawImage(mainCanvas, 0, 0);
  }, [isOpen, bgCanvas, shadowCanvas, mainCanvas]);

  const handleDownload = async () => {
    const blob = await generateExportBlob({
      bgCanvas,
      shadowCanvas,
      mainCanvas,
      format,
      quality: quality / 100,
      scale: scaleMultiplier
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purecut-studio-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
    a.click();
    URL.revokeObjectURL(url);

    // Joyful celebratory confetti!
    confetti({
      particleCount: 85,
      spread: 65,
      origin: { y: 0.7 }
    });

    onShowToast(`Downloaded HD cutout (.${format.toUpperCase()})`);
    onClose();
  };

  const handleCopyClipboard = async () => {
    try {
      const blob = await generateExportBlob({
        bgCanvas,
        shadowCanvas,
        mainCanvas,
        format: 'png',
        quality: 1.0,
        scale: scaleMultiplier
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Copied high-resolution image to clipboard!');
    } catch (err) {
      console.warn('Clipboard failed:', err);
      onShowToast('Clipboard unavailable in this browser. Use Download instead.', true);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="export-modal-title"
      className="p-4 bg-transparent outline-none"
    >
      <div 
        className="bg-studio-900/95 backdrop-blur-2xl border border-studio-borderHighlight rounded-3xl max-w-lg w-full overflow-hidden pedestal-3d flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-studio-border flex items-center justify-between bg-studio-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="export-modal-title" className="font-display font-bold text-base text-white">
                Export High-Resolution Image
              </h3>
              <p className="text-[11px] text-slate-400">Lossless export with custom format & quality</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Live Preview Box */}
          <div className="w-full h-48 rounded-2xl border border-studio-border checkerboard-bg flex items-center justify-center overflow-hidden shadow-inner relative group">
            <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-white/10">
              {mainCanvas ? `${mainCanvas.width} × ${mainCanvas.height} px` : 'Auto'}
            </div>
          </div>

          {/* Format Selection Cards */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'png', label: 'PNG', badge: 'Lossless', desc: 'Transparent alpha cutout' },
                { id: 'jpeg', label: 'JPG', badge: 'Compact', desc: 'Lightweight web photo' },
                { id: 'webp', label: 'WebP', badge: 'Next-Gen', desc: 'Modern small file size' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`p-3 rounded-2xl border flex flex-col text-left transition-all duration-150 relative ${
                    format === fmt.id
                      ? 'border-brand-400 bg-gradient-to-b from-brand-500/25 to-brand-600/15 shadow-[0_4px_12px_rgba(59,130,246,0.35),0_3px_0_theme(colors.brand.700)] -translate-y-0.5'
                      : 'border-studio-border bg-studio-850/60 shadow-[0_2px_0_rgba(0,0,0,0.5)] hover:bg-studio-800 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white">{fmt.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      format === fmt.id ? 'bg-brand-500 text-white' : 'bg-studio-800 text-slate-400'
                    }`}>
                      {fmt.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPG) */}
          {format === 'jpeg' && (
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-border shadow-inner">
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                <span>JPEG Compression Quality</span>
                <span className="text-brand-400 font-bold">{quality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              />
            </div>
          )}

          {/* Output Resolution & Resident Quality Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Output Resolution
              </label>
              <span className="text-[10px] font-bold text-accent-emerald flex items-center gap-1">
                <Check className="w-3 h-3" />
                100% Resident Guarantee
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScaleMultiplier(1.0)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  scaleMultiplier === 1.0
                    ? 'border-brand-400 bg-brand-500/15 shadow-glow -translate-y-0.5'
                    : 'border-studio-border bg-studio-850/60 hover:bg-studio-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-white">1x Native (100%)</span>
                  {scaleMultiplier === 1.0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500 text-white font-bold">
                      Lossless
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  100% exact original photo resolution
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScaleMultiplier(2.0)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  scaleMultiplier === 2.0
                    ? 'border-purple-400 bg-purple-500/15 shadow-glow-purple -translate-y-0.5'
                    : 'border-studio-border bg-studio-850/60 hover:bg-studio-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-white">2x Ultra-HD (200%)</span>
                  {scaleMultiplier === 2.0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500 text-white font-bold">
                      Super-Res
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Crisp 4K/8K super-sampled for large prints
                </span>
              </button>
            </div>
          </div>

          {/* Technical Export Metadata */}
          <div className="p-3 bg-studio-950/70 rounded-2xl border border-studio-border flex justify-between items-center text-xs shadow-inner">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
              100% Resident Output:
            </span>
            <span className="font-bold text-white font-mono">
              {mainCanvas
                ? `${Math.round(mainCanvas.width * scaleMultiplier)} × ${Math.round(mainCanvas.height * scaleMultiplier)} px • ${(((mainCanvas.width * scaleMultiplier) * (mainCanvas.height * scaleMultiplier)) / 1000000).toFixed(1)} MP`
                : 'Auto'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-studio-950/90 border-t border-studio-border flex items-center justify-end gap-3">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-3d-secondary text-xs font-semibold text-slate-200 transition"
          >
            {copied ? <Check className="w-4 h-4 text-accent-emerald" /> : <ClipboardCheck className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-3d text-xs font-bold text-white shadow-glow"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
