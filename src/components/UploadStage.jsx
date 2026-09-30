import React, { useRef, useState } from 'react';
import { UploadCloud, ShieldCheck, Zap, Sparkles, FolderPlus, Layers } from 'lucide-react';

const SAMPLES = [
  {
    type: 'portrait',
    label: 'Portrait',
    thumb: '/samples/portrait.jpg',
    full: '/samples/portrait.jpg'
  },
  {
    type: 'product',
    label: 'Product Shoe',
    thumb: '/samples/product.jpg',
    full: '/samples/product.jpg'
  },
  {
    type: 'car',
    label: 'Automobile',
    thumb: '/samples/car.jpg',
    full: '/samples/car.jpg'
  }
];

export default function UploadStage({ onSelectImage, onSelectBatch }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const singleFileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );

    if (files.length === 0) return;

    if (files.length === 1) {
      // Single image mode
      const reader = new FileReader();
      reader.onload = (evt) => onSelectImage(evt.target.result);
      reader.readAsDataURL(files[0]);
    } else {
      // High-volume batch mode (handles 100 to 2,000+ files safely without freezing)
      if (onSelectBatch) {
        onSelectBatch(files);
      }
    }
  };

  const handleSingleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => onSelectImage(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBatchFileChange = (e) => {
    const files = Array.from(e.target.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0 && onSelectBatch) {
      onSelectBatch(files);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 select-none overflow-y-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`max-w-2xl w-full p-8 md:p-10 rounded-3xl bg-studio-900 border-2 border-dashed transition-all flex flex-col items-center text-center shadow-studio ${
          isDragOver
            ? 'border-brand-500 bg-brand-500/5 scale-[1.01]'
            : 'border-studio-border hover:border-slate-600'
        }`}
      >
        {/* Glow Icon */}
        <div className="w-20 h-20 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 mb-5 shadow-glow animate-pulse">
          <UploadCloud className="w-10 h-10" />
        </div>

        <h2 className="font-display font-bold text-2xl text-white mb-2">
          Drop your image to remove background
        </h2>
        <p className="text-xs text-slate-400 mb-6 max-w-md">
          Supports PNG, JPG, WebP, AVIF up to 25MB. Drop a single image for fine studio editing, or drop <strong className="text-brand-400">1,000 to 2,000+ images</strong> at once with zero freezing.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 w-full max-w-lg">
          {/* Single Image */}
          <button
            onClick={() => singleFileInputRef.current?.click()}
            className="flex-1 min-w-[200px] px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-semibold text-xs shadow-glow transition transform hover:-translate-y-0.5"
          >
            Select Single Photo
          </button>
          <input
            ref={singleFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSingleFileChange}
          />

          {/* Batch 1000-2000 images */}
          <button
            onClick={() => batchFileInputRef.current?.click()}
            className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-border text-slate-100 font-semibold text-xs transition transform hover:-translate-y-0.5"
          >
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Batch Upload (1,000+ Files)</span>
          </button>
          <input
            ref={batchFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBatchFileChange}
          />
        </div>

        {/* Upload Folder Option */}
        <div className="mb-6">
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Or click here to select an entire folder of photos</span>
          </button>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory="true"
            multiple
            className="hidden"
            onChange={handleBatchFileChange}
          />
        </div>

        {/* Sample chips */}
        <div className="flex flex-col items-center gap-2.5 mb-8">
          <span className="text-xs text-slate-400 font-medium">Or test instantly with a sample:</span>
          <div className="flex flex-wrap justify-center gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.type}
                onClick={() => onSelectImage(s.full)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-studio-800 hover:bg-studio-700 border border-studio-border text-xs font-semibold text-slate-200 transition transform hover:-translate-y-0.5"
              >
                <img src={s.thumb} alt={s.label} className="w-5 h-5 rounded-full object-cover" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-6 border-t border-studio-border w-full text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-850">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% Private (No Cloud Upload)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-850">
            <Zap className="w-3.5 h-3.5 text-brand-500" />
            Zero-Freeze Batch Engine (2,000+ Safe)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-studio-850">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Unlimited Free Exports
          </span>
        </div>
      </div>
    </div>
  );
}
