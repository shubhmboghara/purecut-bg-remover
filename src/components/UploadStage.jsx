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

const STATS = [
  { num: '100%', label: 'Native Res' },
  { num: '<2s', label: 'Processing' },
  { num: '10K+', label: 'Batch Files' },
  { num: '0KB', label: 'Upload' }
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
      if (onSelectBatch) onSelectBatch(files);
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
    if (files.length > 0 && onSelectBatch) onSelectBatch(files);
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 md:p-10 select-none overflow-y-auto relative custom-scrollbar">
      {/* Deep ambient glow mesh */}
      <div className="ambient-glow bg-brand-500/25 w-[900px] h-[900px] -top-40 -left-40 animate-[pulse-subtle_5s_ease-in-out_infinite]"></div>
      <div className="ambient-glow bg-accent-purple/18 w-[800px] h-[800px] top-1/4 -right-40"></div>
      <div className="ambient-glow bg-accent-cyan/10 w-[600px] h-[600px] bottom-0 left-1/3"></div>

      {/* Main container */}
      <div className="max-w-5xl w-full flex flex-col items-center z-10 my-auto py-8">

        {/* Premium animated border badge */}
        <div className="animated-border-wrap inline-flex rounded-full mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-xl"
            style={{
              background: 'color-mix(in oklch, oklch(0.09 0.025 260) 88%, transparent)',
              border: '1px solid color-mix(in oklch, white 15%, transparent)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{boxShadow: '0 0 8px #34d399'}}></span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[11px] font-bold text-white tracking-wide">100% In-Browser · Zero Upload · Sub-Pixel Edge Matting</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
          </div>
        </div>

        {/* Hero headings — cinematic scale */}
        <h2
          className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tight text-center text-balance mb-5"
          style={{ lineHeight: '1.04' }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(180deg, #ffffff 55%, oklch(0.65 0.01 260) 100%)' }}
          >
            Remove Any Background
          </span>
          <br />
          <span className="hero-gradient-text">
            In Seconds, Not Minutes.
          </span>
        </h2>

        <p className="text-sm md:text-base text-slate-400 text-center max-w-xl text-pretty mb-10 leading-relaxed">
          Professional AI cutouts with sub-pixel alpha matting, 3D spatial shadows, and real-time WebGL visualization — 100% in-browser, zero upload.
        </p>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-8 md:gap-14 mb-12 w-full">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-display font-black text-2xl md:text-3xl text-white stat-glow">{stat.num}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              </div>
              {i < STATS.length - 1 && (
                <div className="hidden sm:block w-px h-8" style={{background: 'linear-gradient(180deg, transparent, color-mix(in oklch, white 15%, transparent), transparent)'}}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Two-column showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center mb-12">
          
          {/* Column 1: Upload dropzone */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <Interactive3DCard maxTilt={5} className="w-full">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`card-float w-full p-8 md:p-10 rounded-3xl backdrop-blur-2xl border-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group ${
                  isDragOver
                    ? 'border-brand-500 scale-[1.01] shadow-glow'
                    : 'border-studio-borderHighlight hover:border-brand-500/50'
                }`}
                style={{
                  background: isDragOver
                    ? 'color-mix(in oklch, oklch(0.65 0.28 278) 8%, oklch(0.13 0.03 260))'
                    : 'color-mix(in oklch, oklch(0.13 0.03 260) 85%, transparent)',
                  boxShadow: isDragOver
                    ? '0 0 60px -15px oklch(0.65 0.28 278 / 0.6)'
                    : '0 30px 60px -15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)'
                }}
              >
                {/* Top specular highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                {/* Bottom glow line */}
                <div className="absolute bottom-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>

                {/* Upload icon orb */}
                <div className="relative mb-6 group-hover:scale-110 transition duration-400">
                  <div className="w-24 h-24 rounded-3xl p-0.5 shadow-glow" style={{background: 'linear-gradient(135deg, oklch(0.65 0.28 278), oklch(0.72 0.28 308))'}}>
                    <div className="w-full h-full rounded-[22px] flex items-center justify-center" style={{background: 'oklch(0.09 0.025 260)'}}>
                      <UploadCloud className="w-10 h-10 text-brand-300" />
                    </div>
                  </div>
                  <div className="absolute -inset-3 rounded-3xl border border-brand-500/20 animate-ping" style={{animationDuration: '3s'}}></div>
                  <div className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-300" style={{background: 'oklch(0.65 0.28 278 / 0.15)', filter: 'blur(12px)'}}></div>
                </div>

                <h3 className="font-display font-black text-2xl text-white mb-2 text-balance">Drop your image here</h3>
                <p className="text-xs text-slate-500 mb-7 max-w-md text-pretty leading-relaxed">
                  PNG, JPG, WebP, AVIF up to 25MB. Drop 1 photo for fine creative editing, or drop{' '}
                  <strong className="text-brand-300">1,000 to 2,000+ files</strong>{' '}for instant batch processing.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 mb-5 w-full">
                  <button
                    onClick={() => singleFileInputRef.current?.click()}
                    className="flex-1 min-w-[180px] px-6 py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase text-white btn-3d"
                    style={{ background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.62 0.28 308))' }}
                  >
                    Select Photo
                  </button>
                  <input ref={singleFileInputRef} type="file" accept="image/*" aria-label="Upload single image" className="hidden" onChange={handleSingleFileChange} />

                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase text-slate-200 btn-3d-secondary"
                    style={{
                      background: 'oklch(0.13 0.03 260)',
                      border: '1px solid color-mix(in oklch, white 15%, transparent)'
                    }}
                  >
                    <Layers className="w-4 h-4 text-brand-400" />
                    <span>Batch 1,000+ Files</span>
                  </button>
                  <input ref={batchFileInputRef} type="file" accept="image/*" multiple aria-label="Upload batch images" className="hidden" onChange={handleBatchFileChange} />
                </div>

                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-300 transition py-1"
                >
                  <FolderPlus className="w-4 h-4 text-accent-purple" />
                  <span>Or select an entire folder</span>
                </button>
                <input ref={folderInputRef} type="file" webkitdirectory="true" multiple aria-label="Upload entire image folder" className="hidden" onChange={handleBatchFileChange} />
              </div>
            </Interactive3DCard>
          </div>

          {/* Column 2: Three.js / Spatial tab */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full">
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-300 font-display">Interactive 3D Engine</span>
              </div>
              <div
                role="tablist"
                aria-label="3D engine view selection"
                className="flex rounded-xl p-1"
                style={{
                  background: 'oklch(0.07 0.02 260)',
                  border: '1px solid color-mix(in oklch, white 8%, transparent)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)'
                }}
              >
                <button
                  role="tab"
                  aria-selected={hero3DTab === 'three'}
                  onClick={() => setHero3DTab('three')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    hero3DTab === 'three' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={hero3DTab === 'three' ? {background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.60 0.28 308))', boxShadow: '0 2px 12px oklch(0.65 0.28 278 / 0.45)'} : {}}
                >
                  Three.js WebGL
                </button>
                <button
                  role="tab"
                  aria-selected={hero3DTab === 'layers'}
                  onClick={() => setHero3DTab('layers')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                    hero3DTab === 'layers' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={hero3DTab === 'layers' ? {background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.60 0.28 308))', boxShadow: '0 2px 12px oklch(0.65 0.28 278 / 0.45)'} : {}}
                >
                  Spatial Exploder
                </button>
              </div>
            </div>

            {hero3DTab === 'three' ? (
              <div
                className="w-full h-80 rounded-3xl overflow-hidden relative group shadow-2xl"
                style={{
                  background: 'oklch(0.09 0.025 260)',
                  border: '1px solid color-mix(in oklch, white 14%, transparent)',
                  boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 50px -15px oklch(0.65 0.28 278 / 0.15)'
                }}
              >
                <ThreeHeroScene />
                <div
                  className="absolute bottom-3 inset-x-3 px-3 py-1.5 rounded-xl flex items-center justify-between pointer-events-none text-[11px]"
                  style={{background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)'}}
                >
                  <span className="text-slate-300 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    Three.js WebGL
                  </span>
                  <span className="text-brand-300 font-semibold">Click &amp; drag to spin</span>
                </div>
              </div>
            ) : (
              <SpatialLayerDemo />
            )}
          </div>
        </div>

        {/* Sample images */}
        <div className="flex flex-col items-center gap-4 w-full mb-12">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px" style={{background: 'linear-gradient(90deg, transparent, color-mix(in oklch, white 12%, transparent))'}}></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>Try a sample</span>
            </div>
            <div className="flex-1 h-px" style={{background: 'linear-gradient(270deg, transparent, color-mix(in oklch, white 12%, transparent))'}}></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full">
            {SAMPLES.map((s) => (
              <Interactive3DCard key={s.type} maxTilt={8} className="w-full">
                <button
                  onClick={() => onSelectImage(s.full)}
                  className="card-float w-full p-3 rounded-2xl border text-left group flex items-center gap-3.5"
                  style={{
                    background: 'color-mix(in oklch, oklch(0.13 0.03 260) 80%, transparent)',
                    border: '1px solid color-mix(in oklch, white 9%, transparent)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 checkerboard-bg shadow-inner">
                    <img src={s.thumb} alt={s.label} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition flex items-center gap-1.5">
                      <span>{s.label}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">{s.tag}</span>
                  </div>
                </button>
              </Interactive3DCard>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div
          className="w-full h-px mb-8"
          style={{background: 'linear-gradient(90deg, transparent, color-mix(in oklch, white 10%, transparent) 20%, color-mix(in oklch, white 10%, transparent) 80%, transparent)'}}
        ></div>

        {/* 3D Bento capability tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full text-left">
          {[
            { icon: ShieldCheck, color: 'emerald', title: '100% In-Browser Privacy', desc: 'Zero cloud upload. Your photos never leave your device.' },
            { icon: Sparkles, color: 'amber', title: '100% Native Resolution', desc: 'Zero downscaling loss. Exact original camera megapixel fidelity.' },
            { icon: Sliders, color: 'purple', title: 'Sub-Pixel Edge Matting', desc: 'Closed-form despill, hair strand feathering & halo shaving.' },
            { icon: Layers, color: 'cyan', title: '10,000+ Extreme Batch', desc: 'Direct-to-Disk auto-save with near-zero RAM consumption.' }
          ].map(({ icon: Icon, color, title, desc }) => (
            <Interactive3DCard key={title} maxTilt={5}>
              <div
                className="card-float p-4 rounded-2xl backdrop-blur-md flex flex-col gap-2.5 h-full"
                style={{
                  background: 'color-mix(in oklch, oklch(0.13 0.03 260) 75%, transparent)',
                  border: '1px solid color-mix(in oklch, white 9%, transparent)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
                }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center`}
                  style={{
                    background: color === 'emerald' ? 'oklch(0.75 0.19 155 / 0.12)' : color === 'amber' ? 'oklch(0.78 0.18 75 / 0.12)' : color === 'purple' ? 'oklch(0.72 0.28 308 / 0.12)' : 'oklch(0.82 0.18 195 / 0.12)',
                    border: `1px solid ${color === 'emerald' ? 'oklch(0.75 0.19 155 / 0.3)' : color === 'amber' ? 'oklch(0.78 0.18 75 / 0.3)' : color === 'purple' ? 'oklch(0.72 0.28 308 / 0.3)' : 'oklch(0.82 0.18 195 / 0.3)'}`,
                    color: color === 'emerald' ? 'oklch(0.75 0.19 155)' : color === 'amber' ? 'oklch(0.78 0.18 75)' : color === 'purple' ? 'oklch(0.72 0.28 308)' : 'oklch(0.82 0.18 195)'
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">{title}</span>
                <span className="text-[11px] text-slate-500 text-pretty leading-relaxed">{desc}</span>
              </div>
            </Interactive3DCard>
          ))}
        </div>

      </div>
    </div>
  );
}
