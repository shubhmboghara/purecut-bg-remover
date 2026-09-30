import React from 'react';
import { SunMedium } from 'lucide-react';

export default function ShadowPanel({ shadow, onChangeShadow }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto">
      <div>
        <h3 className="text-base font-bold font-display text-white">Studio Shadows</h3>
        <p className="text-xs text-slate-400 mt-1">Cast photorealistic drop and contact shadows.</p>
      </div>

      {/* Enable Toggle Switch */}
      <div className="flex items-center justify-between p-3.5 bg-studio-800 rounded-xl border border-studio-border">
        <div className="flex items-center gap-2.5">
          <SunMedium className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-semibold text-white">Enable Drop Shadow</span>
        </div>
        <input
          type="checkbox"
          checked={shadow.enabled}
          onChange={(e) => onChangeShadow({ ...shadow, enabled: e.target.checked })}
          className="w-4 h-4 accent-brand-500 cursor-pointer"
        />
      </div>

      <div className={`flex flex-col gap-4 transition ${shadow.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        {/* Blur */}
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Shadow Softness / Blur</span>
            <span className="text-brand-500">{shadow.blur}px</span>
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
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Shadow Opacity</span>
            <span className="text-brand-500">{Math.round(shadow.opacity * 100)}%</span>
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
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Offset Y (Height)</span>
            <span className="text-brand-500">{shadow.offsetY}px</span>
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
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
            <span>Offset X (Light Angle)</span>
            <span className="text-brand-500">{shadow.offsetX}px</span>
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
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Shadow Color Tint</label>
          <div className="flex items-center gap-3 p-2 bg-studio-800 rounded-lg border border-studio-border">
            <input
              type="color"
              value={shadow.color || '#000000'}
              onChange={(e) => onChangeShadow({ ...shadow, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            />
            <span className="font-mono text-xs text-slate-200 uppercase">{shadow.color || '#000000'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
