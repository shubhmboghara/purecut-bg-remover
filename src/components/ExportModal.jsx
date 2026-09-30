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
      quality: quality / 100
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
        quality: 1.0
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
        className="bg-studio-900/95 backdrop-blur-2xl border border-studio-borderHighlight rounded-3xl max-w-lg w-full overflow-hidden shadow-studio flex flex-col select-none animate-shimmer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-studio-border flex items-center justify-between bg-studio-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
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
                  className={`p-3 rounded-2xl border flex flex-col text-left transition relative ${
                    format === fmt.id
                      ? 'border-brand-500 bg-brand-500/15 shadow-glow'
                      : 'border-studio-border bg-studio-850/60 hover:bg-studio-800'
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
            <div className="p-3.5 rounded-2xl bg-studio-950 border border-studio-border">
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

          {/* Technical Export Metadata */}
          <div className="p-3 bg-studio-950/70 rounded-2xl border border-studio-border flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-400" />
              Full Resolution Output:
            </span>
            <span className="font-bold text-white font-mono">
              {mainCanvas ? `${mainCanvas.width} × ${mainCanvas.height} px` : 'Auto'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-studio-950/90 border-t border-studio-border flex items-center justify-end gap-3">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            {copied ? <Check className="w-4 h-4 text-accent-emerald" /> : <ClipboardCheck className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple hover:from-brand-600 hover:to-accent-purple text-xs font-bold text-white shadow-glow transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
