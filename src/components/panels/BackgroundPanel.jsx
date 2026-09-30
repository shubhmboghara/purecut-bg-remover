import React, { useRef } from 'react';
import { UploadCloud, CheckCircle2, Trash2 } from 'lucide-react';

const PALETTE = [
  '#ffffff', '#f3f4f6', '#0f172a', '#000000',
  '#2563eb', '#06b6d4', '#10b981', '#f59e0b',
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
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto">
      <div>
        <h3 className="text-base font-bold font-display text-white">Replace Background</h3>
        <p className="text-xs text-slate-400 mt-1">Select solid, gradient, photo preset or upload your own.</p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'transparent', label: 'Transparent' },
          { id: 'color', label: 'Solid' },
          { id: 'gradient', label: 'Gradient' },
          { id: 'photos', label: 'Studio Photos' },
          { id: 'blur', label: 'Bokeh Blur' },
          { id: 'custom', label: 'Upload' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChangeBackground({ ...background, type: cat.id })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              background.type === cat.id
                ? 'bg-brand-500 text-white font-semibold'
                : 'bg-studio-800 text-slate-300 hover:bg-studio-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subview: Transparent */}
      {background.type === 'transparent' && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-slate-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p>Transparent PNG background is active. Perfect for e-commerce, logos, stickers, and graphics.</p>
        </div>
      )}

      {/* Subview: Solid Color */}
      {background.type === 'color' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Custom Color</label>
            <div className="flex items-center gap-3 p-2 bg-studio-800 rounded-lg border border-studio-border">
              <input
                type="color"
                value={background.color || '#ffffff'}
                onChange={(e) => onChangeBackground({ ...background, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="font-mono text-xs text-slate-200 uppercase">{background.color || '#ffffff'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Studio Palette</label>
            <div className="grid grid-cols-6 gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onChangeBackground({ ...background, color: c })}
                  style={{ backgroundColor: c }}
                  className={`w-full aspect-square rounded-lg border-2 transition transform hover:scale-105 ${
                    background.color === c ? 'border-brand-500 scale-105 shadow-glow' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subview: Gradient */}
      {background.type === 'gradient' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 mb-1">Curated Gradients</label>
          <div className="grid grid-cols-2 gap-2.5">
            {GRADIENTS.map((g) => (
              <button
                key={g.name}
                onClick={() => onChangeBackground({ ...background, gradient: g.val })}
                style={{ background: g.val }}
                className={`h-16 rounded-xl border-2 flex items-end p-2 transition transform hover:-translate-y-0.5 ${
                  background.gradient === g.val ? 'border-white shadow-glow' : 'border-transparent'
                }`}
              >
                <span className="text-[11px] font-bold text-white drop-shadow">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subview: Studio Photos */}
      {background.type === 'photos' && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 mb-1">Studio Scenes</label>
          <div className="grid grid-cols-2 gap-2.5">
            {PHOTOS.map((p) => (
              <button
                key={p.name}
                onClick={() => onChangeBackground({ ...background, photoUrl: p.url, cachedPhoto: null })}
                className={`relative h-20 rounded-xl overflow-hidden border-2 transition group ${
                  background.photoUrl === p.url ? 'border-brand-500 shadow-glow' : 'border-transparent'
                }`}
              >
                <img src={p.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                <span className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 text-[11px] font-semibold text-white">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subview: Bokeh Blur */}
      {background.type === 'blur' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-300">DSLR Aperture Bokeh Blur</label>
          <p className="text-xs text-slate-400">Blurs original photo background to create realistic portrait depth.</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Blur Radius</span>
              <span className="text-brand-500 font-semibold">{background.blurRadius || 16}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              value={background.blurRadius || 16}
              onChange={(e) => onChangeBackground({ ...background, blurRadius: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      )}

      {/* Subview: Custom Image Upload */}
      {background.type === 'custom' && (
        <div className="flex flex-col gap-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 border-2 border-dashed border-studio-border hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-studio-800/40 hover:bg-brand-500/5 transition"
          >
            <UploadCloud className="w-8 h-8 text-brand-500" />
            <span className="text-xs font-semibold text-slate-200">Click to upload background photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
          </div>

          {background.customPreviewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-studio-border">
              <img src={background.customPreviewUrl} alt="Custom Background" className="w-full h-28 object-cover" />
              <button
                onClick={() => onChangeBackground({ ...background, customImage: null, customPreviewUrl: null, type: 'transparent' })}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs transition"
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
