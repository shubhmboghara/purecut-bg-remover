import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  FolderPlus, 
  Layers, 
  ArrowRight,
  Sliders,
  CheckCircle2,
  Box
} from 'lucide-react';
import Interactive3DCard from './Interactive3DCard';
import SpatialLayerDemo from './SpatialLayerDemo';
import ThreeHeroScene from './ThreeHeroScene';

const SAMPLES = [
  {
    type: 'portrait',
    label: 'Portrait Photo',
    tag: 'Sub-Pixel Hair Strands',
    thumb: '/samples/portrait.jpg',
    full: '/samples/portrait.jpg'
  },
  {
    type: 'product',
    label: 'E-Commerce Product',
    tag: 'Crisp Solid Geometry',
    thumb: '/samples/product.jpg',
    full: '/samples/product.jpg'
  },
  {
    type: 'car',
    label: 'Automobile',
    tag: 'Ground Shadow Isolation',
    thumb: '/samples/car.jpg',
    full: '/samples/car.jpg'
  }
];

export default function UploadStage({ onSelectImage, onSelectBatch }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hero3DTab, setHero3DTab] = useState('three');
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
      {/* 3D Ambient Radiant Mesh Glows */}
      <div className="ambient-glow bg-brand-500/25 w-[650px] h-[650px] -top-32 -left-32 animate-[pulse-subtle_4s_infinite]"></div>
      <div className="ambient-glow bg-accent-purple/20 w-[700px] h-[700px] top-1/3 -right-36"></div>
      <div className="ambient-glow bg-accent-cyan/15 w-[550px] h-[550px] -bottom-32 left-1/4"></div>

      {/* Main Container */}
      <div className="max-w-5xl w-full flex flex-col items-center z-10 my-auto py-6">
        
        {/* Top 3D Floating Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-studio-900/85 border border-studio-borderHighlight backdrop-blur-xl mb-6 shadow-glow transition transform hover:scale-105">
          <Box className="w-4 h-4 text-brand-400 animate-spin-slow" />
          <span className="text-xs font-bold text-white tracking-wide">
            3D Spatial AI Studio v2.0
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
          <span className="text-[11px] text-accent-emerald font-bold tracking-wide">
            100% In-Browser Private
          </span>
        </div>

        {/* Hero Headings with 3D Depth Lighting */}
        <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl tracking-tight text-center text-balance mb-4 leading-none">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 drop-shadow-sm">
            Dimensional AI Photo Studio
          </span>
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-accent-purple to-accent-cyan">
            Cutout, Lighting & 3D Shadows
          </span>
        </h2>

        <p className="text-sm md:text-base text-slate-300 text-center max-w-2xl text-pretty mb-10 leading-relaxed font-normal">
          Remove backgrounds with sub-pixel alpha matting. Craft realistic ground shadows, aperture blur, and surgical edge defringing with hardware-accelerated WebGPU & WASM.
        </p>

        {/* Two-Column 3D Showcase: Interactive Dropzone + Spatial Layer Exploder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center mb-10">
          
          {/* Column 1: 3D Interactive Dropzone (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <Interactive3DCard maxTilt={6} className="w-full">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`w-full p-8 md:p-10 rounded-3xl bg-studio-900/85 backdrop-blur-2xl border-2 transition-all duration-300 flex flex-col items-center text-center shadow-3d-card relative overflow-hidden group ${
                  isDragOver
                    ? 'border-brand-500 bg-brand-500/15 scale-[1.01] shadow-glow'
                    : 'border-studio-borderHighlight hover:border-brand-500/60'
                }`}
              >
                {/* 3D Specular Top Bevel Highlight */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                {/* 3D Floating Icon Orb */}
                <div className="relative mb-5 transform group-hover:scale-110 transition duration-300">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-purple p-0.5 shadow-glow">
                    <div className="w-full h-full rounded-[14px] bg-studio-950 flex items-center justify-center text-brand-300">
                      <UploadCloud className="w-9 h-9" />
                    </div>
                  </div>
                  <div className="absolute -inset-2 rounded-2xl bg-brand-500/30 blur-lg -z-10 group-hover:bg-brand-500/50 transition"></div>
                </div>

                <h3 className="font-display font-black text-2xl text-white mb-2 text-balance">
                  Drop your image here
                </h3>
                <p className="text-xs text-slate-400 mb-6 max-w-md text-pretty">
                  Supports PNG, JPG, WebP, AVIF up to 25MB. Drop 1 photo for fine creative editing, or drop <strong className="text-brand-300">1,000 to 2,000+ files</strong> for instant streaming batch processing.
                </p>

                {/* 3D Tactile Push Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 mb-5 w-full">
                  {/* Single Photo Upload (3D Primary Button) */}
                  <button
                    onClick={() => singleFileInputRef.current?.click()}
                    className="flex-1 min-w-[200px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple text-white font-bold text-xs tracking-wider uppercase btn-3d"
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

                  {/* Batch Upload (3D Secondary Button) */}
                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-studio-800 border border-studio-borderHighlight text-slate-100 font-bold text-xs tracking-wider uppercase btn-3d-secondary"
                  >
                    <Layers className="w-4 h-4 text-brand-400" />
                    <span>Batch (1,000+ Files)</span>
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

                {/* Folder Upload Option */}
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-brand-300 transition py-1"
                >
                  <FolderPlus className="w-4 h-4 text-accent-purple" />
                  <span>Or select an entire folder of photos</span>
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
            </Interactive3DCard>
          </div>

          {/* Column 2: Real-Time Three.js WebGL Core & Spatial Exploder */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full">
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-300 font-display">Interactive 3D Engine</span>
              </div>
              <div className="flex rounded-xl bg-studio-950 p-1 border border-studio-border shadow-inner">
                <button
                  onClick={() => setHero3DTab('three')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    hero3DTab === 'three'
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Three.js WebGL
                </button>
                <button
                  onClick={() => setHero3DTab('layers')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    hero3DTab === 'layers'
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Spatial Exploder
                </button>
              </div>
            </div>

            {hero3DTab === 'three' ? (
              <div className="w-full h-80 rounded-3xl pedestal-3d bg-studio-900/90 border border-studio-borderHighlight overflow-hidden relative group shadow-2xl">
                <ThreeHeroScene />
                <div className="absolute bottom-3 inset-x-3 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 flex items-center justify-between pointer-events-none text-[11px]">
                  <span className="text-slate-300 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    Three.js WebGL
                  </span>
                  <span className="text-brand-300 font-semibold">Click & drag to spin 3D core</span>
                </div>
              </div>
            ) : (
              <SpatialLayerDemo />
            )}
          </div>
        </div>

        {/* Interactive 3D Sample Showcase */}
        <div className="flex flex-col items-center gap-3 w-full mb-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Instant 3D Demo Samples</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
            {SAMPLES.map((s) => (
              <Interactive3DCard key={s.type} maxTilt={8} className="w-full">
                <button
                  onClick={() => onSelectImage(s.full)}
                  className="w-full p-3 rounded-2xl bg-studio-900/80 hover:bg-studio-850 border border-studio-border hover:border-brand-500/60 transition-all flex items-center gap-3.5 text-left group shadow-lg"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 checkerboard-bg shadow-inner">
                    <img
                      src={s.thumb}
                      alt={s.label}
                      className="w-full h-full object-cover group-hover:scale-115 transition duration-500"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition flex items-center gap-1.5">
                      <span>{s.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {s.tag}
                    </span>
                  </div>
                </button>
              </Interactive3DCard>
            ))}
          </div>
        </div>

        {/* 3D Bento Capability Pedestals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full text-left">
          <Interactive3DCard maxTilt={5}>
            <div className="p-4 rounded-2xl bg-studio-900/70 border border-studio-border backdrop-blur-md flex flex-col gap-2 shadow-lg h-full">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-glow-emerald">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">100% In-Browser Privacy</span>
              <span className="text-[11px] text-slate-400 text-pretty">
                Zero cloud upload. Your photos never touch external servers.
              </span>
            </div>
          </Interactive3DCard>

          <Interactive3DCard maxTilt={5}>
            <div className="p-4 rounded-2xl bg-studio-900/70 border border-studio-border backdrop-blur-md flex flex-col gap-2 shadow-lg h-full">
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">WASM & WebGPU</span>
              <span className="text-[11px] text-slate-400 text-pretty">
                Hardware-accelerated neural networks with SIMD speed.
              </span>
            </div>
          </Interactive3DCard>

          <Interactive3DCard maxTilt={5}>
            <div className="p-4 rounded-2xl bg-studio-900/70 border border-studio-border backdrop-blur-md flex flex-col gap-2 shadow-lg h-full">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-accent-purple flex items-center justify-center shadow-glow-purple">
                <Sliders className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">3D Studio Suite</span>
              <span className="text-[11px] text-slate-400 text-pretty">
                Cast photorealistic ground shadows, bokeh blur & color defringe.
              </span>
            </div>
          </Interactive3DCard>

          <Interactive3DCard maxTilt={5}>
            <div className="p-4 rounded-2xl bg-studio-900/70 border border-studio-border backdrop-blur-md flex flex-col gap-2 shadow-lg h-full">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-accent-cyan flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">2,000+ Batch Queue</span>
              <span className="text-[11px] text-slate-400 text-pretty">
                Streaming memory pooling with instant bulk ZIP export.
              </span>
            </div>
          </Interactive3DCard>
        </div>

      </div>
    </div>
  );
}
