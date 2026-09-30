import React from 'react';
import { RotateCcw, Sliders } from 'lucide-react';

export default function AdjustPanel({ filters, onChangeFilters, onResetFilters }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Lighting & Color</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Harmonize cutout lighting, contrast, and warmth with your backdrop.
        </p>
      </div>

      {/* Brightness */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Brightness</span>
          <span className="text-brand-400 font-bold">{filters.brightness}%</span>
        </div>
        <input
          type="range"
          min="40"
          max="180"
          value={filters.brightness}
          onChange={(e) => onChangeFilters({ ...filters, brightness: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Contrast */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Contrast</span>
          <span className="text-brand-400 font-bold">{filters.contrast}%</span>
        </div>
        <input
          type="range"
          min="40"
          max="180"
          value={filters.contrast}
          onChange={(e) => onChangeFilters({ ...filters, contrast: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Saturation */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Color Saturation</span>
          <span className="text-brand-400 font-bold">{filters.saturation}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="200"
          value={filters.saturation}
          onChange={(e) => onChangeFilters({ ...filters, saturation: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Warmth / Temperature */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Temperature / Warmth</span>
          <span className="text-brand-400 font-bold">{filters.warmth}</span>
        </div>
        <input
          type="range"
          min="-50"
          max="50"
          value={filters.warmth}
          onChange={(e) => onChangeFilters({ ...filters, warmth: parseInt(e.target.value, 10) })}
        />
      </div>

      <button
        onClick={onResetFilters}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl btn-3d-secondary text-xs font-bold text-slate-200 hover:text-white transition mt-1"
      >
        <RotateCcw className="w-4 h-4 text-brand-400" />
        <span>Reset Adjustments</span>
      </button>
    </div>
  );
}
