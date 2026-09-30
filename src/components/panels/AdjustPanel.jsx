import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function AdjustPanel({ filters, onChangeFilters, onResetFilters }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto">
      <div>
        <h3 className="text-base font-bold font-display text-white">Lighting & Color</h3>
        <p className="text-xs text-slate-400 mt-1">Blend the subject seamlessly with your background.</p>
      </div>

      {/* Brightness */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Brightness</span>
          <span className="text-brand-500">{filters.brightness}%</span>
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
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Contrast</span>
          <span className="text-brand-500">{filters.contrast}%</span>
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
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Color Saturation</span>
          <span className="text-brand-500">{filters.saturation}%</span>
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
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Temperature / Warmth</span>
          <span className="text-brand-500">{filters.warmth}</span>
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
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition mt-2"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset Adjustments</span>
      </button>
    </div>
  );
}
