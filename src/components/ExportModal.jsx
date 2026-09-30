import React, { useState, useEffect, useRef } from 'react';
import { X, ClipboardCheck, Download, Check, Sparkles } from 'lucide-react';
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
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !mainCanvas || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = mainCanvas.width;
    canvas.height = mainCanvas.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(shadowCanvas, 0, 0);
    ctx.drawImage(mainCanvas, 0, 0);
  }, [isOpen, bgCanvas, shadowCanvas, mainCanvas]);

  if (!isOpen) return null;

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

    // Fire joyful celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    onShowToast(`Downloaded high-resolution .${format.toUpperCase()}`);
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
      onShowToast('Copied high-res image to clipboard!');
    } catch (err) {
      console.warn('Clipboard failed:', err);
      onShowToast('Clipboard unavailable. Use Download button instead.', true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-studio-900 border border-studio-border rounded-2xl max-w-lg w-full overflow-hidden shadow-studio flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="font-display font-bold text-base text-white">Export High-Resolution Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Preview Box */}
          <div className="w-full h-44 rounded-xl border border-studio-border checkerboard-bg flex items-center justify-center overflow-hidden">
            <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
          </div>

          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'png', label: 'PNG', desc: 'Lossless & Transparent' },
                { id: 'jpeg', label: 'JPG', desc: 'Lightweight for Web' },
                { id: 'webp', label: 'WebP', desc: 'Modern High Quality' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`p-3 rounded-xl border flex flex-col text-left transition ${
                    format === fmt.id
                      ? 'border-brand-500 bg-brand-500/10 shadow-glow'
                      : 'border-studio-border bg-studio-800 hover:bg-studio-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{fmt.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPG) */}
          {format === 'jpeg' && (
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                <span>JPEG Quality</span>
                <span className="text-brand-500">{quality}%</span>
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

          {/* Resolution stats */}
          <div className="p-3 bg-studio-850 rounded-xl border border-studio-border flex justify-between items-center text-xs">
            <span className="text-slate-400">Export Resolution:</span>
            <span className="font-semibold text-slate-200">
              {mainCanvas ? `${mainCanvas.width} × ${mainCanvas.height} px` : 'Auto'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-studio-850 border-t border-studio-border flex items-center justify-end gap-3">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardCheck className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-xs font-semibold text-white shadow-glow transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
