import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2, Trash2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

const PALETTE = [
  '#ffffff', '#f8fafc', '#0f172a', '#000000',
  '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#ffedd5'
];

const GRADIENTS = [
  { name: 'Deep Purple', val: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset Glow', val: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean Breeze', val: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Neon Mint', val: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Warm Sunrise', val: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Studio Moody', val: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' }
];

const PHOTOS = [
  {
    name: 'Modern Office',
    url: '/backgrounds/office.jpg'
  },
  {
    name: 'Luxury Interior',
    url: '/backgrounds/interior.jpg'
  },
  {
    name: 'Forest Sunshine',
    url: '/backgrounds/forest.jpg'
  },
  {
    name: 'City Bokeh',
    url: '/backgrounds/city.jpg'
  }
];

export default function BackgroundPanel({ background, onChangeBackground }) {
  const fileInputRef = useRef(null);

  const handleCustomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          onChangeBackground({
            ...background,
            type: 'custom',
            customImage: img,
            customPreviewUrl: evt.target.result
          });
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Replace Background</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Choose solid colors, curated studio gradients, realistic scenes, or upload custom backdrops.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-studio-950/80 rounded-2xl border border-studio-border shadow-inner">
        {[
          { id: 'transparent', label: 'Transparent' },
          { id: 'color', label: 'Solid' },
          { id: 'gradient', label: 'Gradient' },
          { id: 'photos', label: 'Scenes' },
          { id: 'blur', label: 'Bokeh' },
          { id: 'custom', label: 'Upload' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChangeBackground({ ...background, type: cat.id })}
            className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-150 text-center ${
              background.type === cat.id
                ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_3px_0_theme(colors.brand.700),0_6px_12px_rgba(59,130,246,0.3)] -translate-y-0.5 border-t border-white/25'
                : 'text-slate-400 hover:text-white hover:bg-studio-800/60 active:translate-y-0.5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Transparent View */}
      {background.type === 'transparent' && (
        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-slate-300 flex items-start gap-3 shadow-inner">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-pretty">
            Transparent PNG alpha cutout is active. Ideal for logos, e-commerce product catalogs, stickers, and design assets.
          </p>
        </div>
      )}

      {/* Solid Color View */}
      {background.type === 'color' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Color Selector
            </label>
            <div className="flex items-center gap-3 p-2.5 bg-studio-950 rounded-2xl border border-studio-border shadow-inner">
              <input
                type="color"
                value={background.color || '#ffffff'}
                onChange={(e) => onChangeBackground({ ...background, color: e.target.value })}
                className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-white uppercase font-bold tracking-wider">
                {background.color || '#ffffff'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Studio Palette
            </label>
            <div className="grid grid-cols-6 gap-2.5">
              {PALETTE.map((c) => {
                const isSelected = background.color === c;
                return (
                  <button
                    key={c}
                    onClick={() => onChangeBackground({ ...background, color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-full aspect-square rounded-xl border transition-all duration-150 transform flex items-center justify-center ${
                      isSelected
                        ? 'border-brand-400 ring-2 ring-brand-500/50 shadow-[0_4px_12px_rgba(59,130,246,0.45),0_2px_0_rgba(0,0,0,0.6)] -translate-y-1'
                        : 'border-white/10 shadow-[0_3px_0_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
                    }`}
                  >
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${c === '#ffffff' || c === '#f8fafc' ? 'text-slate-900' : 'text-white'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gradients View */}
      {background.type === 'gradient' && (
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Curated Studio Gradients
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                onClick={() => onChangeBackground({ ...background, gradient: g.val })}
                style={{ background: g.val }}
                className={`h-20 rounded-2xl border flex items-end p-2.5 transition-all duration-150 transform relative overflow-hidden group shadow-[0_4px_12px_rgba(0,0,0,0.35),0_2px_0_rgba(0,0,0,0.5)] ${
                  background.gradient === g.val 
                    ? 'border-white ring-2 ring-brand-400/60 -translate-y-1 shadow-[0_8px_20px_rgba(0,0,0,0.5)]' 
                    : 'border-white/10 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/10 pointer-events-none" />
                <span className="text-[11px] font-bold text-white drop-shadow-md relative z-10">
                  {g.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Studio Photos View */}
      {background.type === 'photos' && (
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Realistic Scenes
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {PHOTOS.map((p) => (
              <button
                key={p.name}
                onClick={() => onChangeBackground({ ...background, photoUrl: p.url, cachedPhoto: null })}
                className={`relative h-24 rounded-2xl overflow-hidden border transition-all duration-150 group shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_0_rgba(0,0,0,0.6)] ${
                  background.photoUrl === p.url 
                    ? 'border-brand-500 ring-2 ring-brand-500/40 -translate-y-1 shadow-glow' 
                    : 'border-white/10 hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                <img
                  src={p.url}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-[11px] font-bold text-white truncate">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bokeh Blur View */}
      {background.type === 'blur' && (
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">DSLR Aperture Bokeh Blur</span>
            <span className="text-xs font-bold text-brand-400">{background.blurRadius || 16}px</span>
          </div>
          <p className="text-xs text-slate-400 text-pretty">
            Blurs original backdrop to achieve cinematic portrait depth of field.
          </p>
          <input
            type="range"
            min="2"
            max="50"
            value={background.blurRadius || 16}
            onChange={(e) => onChangeBackground({ ...background, blurRadius: parseInt(e.target.value, 10) })}
          />
        </div>
      )}

      {/* Custom Image Upload */}
      {background.type === 'custom' && (
        <div className="flex flex-col gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-studio-border hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-studio-950 hover:bg-brand-500/5 transition"
          >
            <UploadCloud className="w-8 h-8 text-brand-400" />
            <span className="text-xs font-semibold text-slate-200">Upload background photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
          </div>

          {background.customPreviewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-studio-border">
              <img src={background.customPreviewUrl} alt="Custom Background" className="w-full h-32 object-cover" />
              <button
                onClick={() => onChangeBackground({ ...background, customImage: null, customPreviewUrl: null, type: 'transparent' })}
                className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs transition shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
