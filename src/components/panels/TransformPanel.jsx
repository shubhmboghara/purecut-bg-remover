import React from 'react';
import { 
  Maximize2, 
  FlipHorizontal, 
  FlipVertical, 
  Crosshair, 
  Move,
  RotateCw
} from 'lucide-react';

export default function TransformPanel({
  transform,
  onChangeTransform,
  onCenter,
  onFit
}) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <Move className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Subject Transform</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Scale, rotate, align, and position the cutout with precision.
        </p>
      </div>

      {/* Scale Slider */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Scale (Zoom)</span>
          <span className="text-brand-400 font-bold">{Math.round((transform.scale || 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="250"
          value={Math.round((transform.scale || 1) * 100)}
          onChange={(e) => onChangeTransform({ ...transform, scale: parseInt(e.target.value, 10) / 100 })}
        />
      </div>

      {/* Rotation Slider */}
      <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border">
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Rotation Angle</span>
          <span className="text-brand-400 font-bold">{transform.rotation || 0}°</span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          value={transform.rotation || 0}
          onChange={(e) => onChangeTransform({ ...transform, rotation: parseInt(e.target.value, 10) })}
        />
      </div>

      {/* Quick Alignments */}
      <div>
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Align & Flip
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCenter}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-studio-950 hover:bg-studio-850 text-xs font-bold text-slate-200 hover:text-white border border-studio-border transition"
          >
            <Crosshair className="w-4 h-4 text-brand-400" />
            <span>Center</span>
          </button>

          <button
            onClick={onFit}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-studio-950 hover:bg-studio-850 text-xs font-bold text-slate-200 hover:text-white border border-studio-border transition"
          >
            <Maximize2 className="w-4 h-4 text-brand-400" />
            <span>Fit Canvas</span>
          </button>

          <button
            onClick={() => onChangeTransform({ ...transform, flipH: (transform.flipH || 1) * -1 })}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-studio-950 hover:bg-studio-850 text-xs font-bold text-slate-200 hover:text-white border border-studio-border transition"
          >
            <FlipHorizontal className="w-4 h-4 text-accent-cyan" />
            <span>Flip Horizontal</span>
          </button>

          <button
            onClick={() => onChangeTransform({ ...transform, flipV: (transform.flipV || 1) * -1 })}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-studio-950 hover:bg-studio-850 text-xs font-bold text-slate-200 hover:text-white border border-studio-border transition"
          >
            <FlipVertical className="w-4 h-4 text-accent-purple" />
            <span>Flip Vertical</span>
          </button>
        </div>
      </div>

      {/* Drag Tip */}
      <div className="p-4 rounded-2xl bg-studio-950/70 border border-studio-border text-xs text-slate-400 flex items-center gap-3">
        <Move className="w-4 h-4 text-brand-400 shrink-0" />
        <span className="text-pretty">Click and drag directly on the canvas viewport anytime to reposition the cutout.</span>
      </div>
    </div>
  );
}
