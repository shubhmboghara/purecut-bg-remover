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
      <div className="flex items-center justify-between p-4 bg-studio-950 rounded-2xl border border-studio-border">
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
          <div className="w-9 h-5 bg-studio-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className={`flex flex-col gap-4 transition-all duration-200 ${shadow.enabled ? 'opacity-100' : 'opacity-35 pointer-events-none'}`}>
        {/* Softness / Blur */}
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
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
