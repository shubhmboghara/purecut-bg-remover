import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  FolderPlus, 
  Layers, 
  Image as ImageIcon,
  ArrowRight,
  Sliders,
  CheckCircle2
} from 'lucide-react';

const SAMPLES = [
  {
    type: 'portrait',
    label: 'Portrait Photo',
    tag: 'Fine Hair & Fur',
    thumb: '/samples/portrait.jpg',
    full: '/samples/portrait.jpg'
  },
  {
    type: 'product',
    label: 'E-Commerce Product',
    tag: 'Crisp Geometric Edges',
    thumb: '/samples/product.jpg',
    full: '/samples/product.jpg'
  },
  {
    type: 'car',
    label: 'Automobile',
    tag: 'Shadow & Reflections',
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
      const reader = new FileReader();
      reader.onload = (evt) => onSelectImage(evt.target.result);
      reader.readAsDataURL(files[0]);
    } else {
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
    <div className="w-full h-full flex flex-col items-center justify-start p-6 md:p-10 select-none overflow-y-auto relative custom-scrollbar">
      {/* Ambient Radial Mesh Lighting */}
      <div className="ambient-glow bg-brand-500/20 w-[550px] h-[550px] -top-32 -left-32"></div>
      <div className="ambient-glow bg-accent-purple/20 w-[600px] h-[600px] top-1/4 -right-32"></div>
      <div className="ambient-glow bg-accent-cyan/15 w-[500px] h-[500px] -bottom-32 left-1/3"></div>

      {/* Main Container */}
      <div className="max-w-4xl w-full flex flex-col items-center z-10 my-auto py-6">
        
        {/* Top Feature Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-studio-850/80 border border-studio-borderHighlight backdrop-blur-md mb-6 shadow-sm hover:border-brand-500/50 transition">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-xs font-semibold text-slate-200">
            Next-Gen Neural AI Engine
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-500"></span>
          <span className="text-[11px] text-accent-emerald font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
            100% In-Browser Private
          </span>
        </div>

        {/* Hero Headings */}
        <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-center text-balance mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            Professional AI Background Remover
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-purple-400 to-accent-purple">
            with Pixel-Perfect Precision
          </span>
        </h2>

        <p className="text-sm md:text-base text-slate-400 text-center max-w-xl text-pretty mb-8 leading-relaxed font-normal">
          Remove backgrounds instantly in full high-definition. Edit with custom studio lighting, realistic shadows, aperture blur, and smart magic wand retouching.
        </p>

        {/* Interactive Dropzone Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-2xl p-8 md:p-10 rounded-3xl bg-studio-900/80 backdrop-blur-2xl border-2 transition-all duration-300 flex flex-col items-center text-center shadow-studio relative overflow-hidden group ${
            isDragOver
              ? 'border-brand-500 bg-brand-500/10 scale-[1.01] shadow-glow'
              : 'border-studio-border hover:border-studio-borderHighlight hover:bg-studio-900/90'
          }`}
        >
          {/* Subtle Corner Gradient Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Central AI Wand Icon Orb */}
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 via-studio-800 to-accent-purple/20 border border-white/10 flex items-center justify-center text-brand-400 shadow-glow transition transform group-hover:scale-110 duration-300">
              <UploadCloud className="w-10 h-10 text-brand-400" />
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-brand-500/10 blur-md -z-10 group-hover:bg-brand-500/20 transition"></div>
          </div>

          <h3 className="font-display font-bold text-xl text-white mb-2">
            Drag & drop your photos here
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-md text-pretty">
            Supports PNG, JPG, WebP, AVIF up to 25MB. Drop 1 photo for fine creative editing, or drop <strong className="text-brand-300">1,000 to 2,000+ files</strong> for instant streaming batch processing.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-6 w-full max-w-lg">
            {/* Single Photo Upload */}
            <button
              onClick={() => singleFileInputRef.current?.click()}
              className="flex-1 min-w-[210px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple hover:from-brand-600 hover:to-accent-purple text-white font-bold text-xs tracking-wide shadow-glow transition transform hover:-translate-y-0.5 active:translate-y-0"
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

            {/* Batch Upload (1,000+ files) */}
            <button
              onClick={() => batchFileInputRef.current?.click()}
              className="flex-1 min-w-[210px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-studio-800/90 hover:bg-studio-700/90 border border-studio-border text-slate-100 font-bold text-xs tracking-wide transition transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
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
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-brand-300 transition py-1"
          >
            <FolderPlus className="w-4 h-4 text-accent-purple" />
            <span>Or select an entire folder of photos to batch process</span>
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

        {/* Interactive Sample Showcase */}
        <div className="flex flex-col items-center gap-3 mt-8 w-full max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Or test immediately with sample images</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {SAMPLES.map((s) => (
              <button
                key={s.type}
                onClick={() => onSelectImage(s.full)}
                className="p-2.5 rounded-2xl bg-studio-900/60 hover:bg-studio-850/90 border border-studio-border hover:border-brand-500/50 transition-all flex items-center gap-3 text-left group transform hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 checkerboard-bg">
                  <img
                    src={s.thumb}
                    alt={s.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition">
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {s.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bento Trust & Capability Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-studio-900/50 border border-studio-border backdrop-blur-md flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">100% In-Browser Privacy</span>
            <span className="text-[11px] text-slate-400 text-pretty">
              Zero cloud upload. Your photos never leave your device.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-studio-900/50 border border-studio-border backdrop-blur-md flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">WASM & WebGPU</span>
            <span className="text-[11px] text-slate-400 text-pretty">
              Hardware-accelerated neural networks with SIMD speed.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-studio-900/50 border border-studio-border backdrop-blur-md flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">Creative Studio Suite</span>
            <span className="text-[11px] text-slate-400 text-pretty">
              Add studio lighting, drop shadows, bokeh blur & color defringe.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-studio-900/50 border border-studio-border backdrop-blur-md flex flex-col gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">2,000+ Batch Queue</span>
            <span className="text-[11px] text-slate-400 text-pretty">
              Non-blocking memory worker with one-click bulk ZIP export.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
