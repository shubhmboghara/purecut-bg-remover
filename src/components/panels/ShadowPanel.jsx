import React from 'react';
import { SunMedium } from 'lucide-react';

export default function ShadowPanel({ shadow, onChangeShadow }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <SunMedium className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Studio Shadows</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Cast photorealistic ground contact and ambient drop shadows.
        </p>
      </div>

      {/* Enable Toggle Switch */}
      <div className="flex items-center justify-between p-4 bg-studio-950 rounded-2xl border border-studio-border shadow-inner">
        <div className="flex items-center gap-2.5">
          <SunMedium className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-bold text-white">Enable Drop Shadow</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={shadow.enabled}
            onChange={(e) => onChangeShadow({ ...shadow, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-studio-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500 shadow-inner"></div>
        </label>
      </div>

      <div className={`flex flex-col gap-4 transition-all duration-200 ${shadow.enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
        {/* 3D Miniature Lighting Stage Preview */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border flex flex-col items-center justify-center overflow-hidden relative shadow-inner">
          <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
            <span>3D SPATIAL LIGHT STAGE</span>
            <span className="font-mono text-brand-400">Angle: {shadow.offsetX}px / Y: {shadow.offsetY}px</span>
          </div>

          <div 
            className="w-full h-32 relative flex items-center justify-center rounded-xl bg-gradient-to-b from-slate-900 to-studio-950 border border-white/5"
            style={{ perspective: '500px' }}
          >
            {/* 3D Ground plane grid */}
            <div 
              className="absolute inset-x-4 bottom-2 h-20 rounded-xl border border-white/10"
              style={{
                transform: 'rotateX(65deg)',
                backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
              }}
            >
              {/* Dynamic Cast Shadow on 3D floor */}
              <div 
                className="absolute w-16 h-8 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                style={{
                  transform: `translate(${shadow.offsetX * 0.4}px, ${shadow.offsetY * 0.3}px) scale(${1 + shadow.offsetY * 0.005})`,
                  backgroundColor: shadow.color || '#000000',
                  opacity: shadow.opacity,
                  filter: `blur(${Math.max(2, shadow.blur * 0.35)}px)`
                }}
              />
            </div>

            {/* Elevated 3D Floating Sphere */}
            <div 
              className="w-12 h-12 rounded-full relative z-10 -translate-y-3 transition-transform duration-150"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.6)'
              }}
            >
              {/* Specular highlight */}
              <div className="absolute top-1.5 left-2 w-3.5 h-2 rounded-full bg-white/60 blur-[0.5px] transform -rotate-12" />
            </div>
          </div>

          {/* Quick 3D Shadow Presets */}
          <div className="grid grid-cols-4 gap-1.5 w-full mt-3">
            {[
              { label: 'Contact', x: 0, y: 15, blur: 12, op: 0.75 },
              { label: 'Float 3D', x: 8, y: 38, blur: 32, op: 0.55 },
              { label: 'Side Cast', x: 42, y: 25, blur: 24, op: 0.65 },
              { label: 'Ambient', x: 0, y: 12, blur: 50, op: 0.4 }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChangeShadow({
                  ...shadow,
                  offsetX: preset.x,
                  offsetY: preset.y,
                  blur: preset.blur,
                  opacity: preset.op
                })}
                className="py-1.5 px-1 rounded-xl bg-studio-900 border border-studio-border text-[10px] font-bold text-slate-300 hover:text-white hover:border-brand-500/50 hover:bg-studio-850 active:translate-y-0.5 transition-all text-center shadow-[0_2px_0_rgba(0,0,0,0.4)]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Softness / Blur */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border shadow-inner">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Shadow Softness (Blur)</span>
            <span className="text-brand-400 font-bold">{shadow.blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            value={shadow.blur}
            onChange={(e) => onChangeShadow({ ...shadow, blur: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Opacity */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Shadow Opacity</span>
            <span className="text-brand-400 font-bold">{Math.round(shadow.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(shadow.opacity * 100)}
            onChange={(e) => onChangeShadow({ ...shadow, opacity: parseInt(e.target.value, 10) / 100 })}
          />
        </div>

        {/* Offset Y */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Height Offset (Y)</span>
            <span className="text-brand-400 font-bold">{shadow.offsetY}px</span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            value={shadow.offsetY}
            onChange={(e) => onChangeShadow({ ...shadow, offsetY: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Offset X */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Light Angle (Offset X)</span>
            <span className="text-brand-400 font-bold">{shadow.offsetX}px</span>
          </div>
          <input
            type="range"
            min="-80"
            max="80"
            value={shadow.offsetX}
            onChange={(e) => onChangeShadow({ ...shadow, offsetX: parseInt(e.target.value, 10) })}
          />
        </div>

        {/* Shadow Color Tint */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Shadow Color Tint
          </label>
          <div className="flex items-center gap-3 p-2 bg-studio-900 rounded-xl border border-studio-border">
            <input
              type="color"
              value={shadow.color || '#000000'}
              onChange={(e) => onChangeShadow({ ...shadow, color: e.target.value })}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <span className="font-mono text-xs text-white uppercase font-bold tracking-wider">
              {shadow.color || '#000000'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
