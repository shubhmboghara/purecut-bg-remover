import React from 'react';
import { 
  Maximize2, 
  FlipHorizontal, 
  FlipVertical, 
  Crosshair, 
  Move 
} from 'lucide-react';

export default function TransformPanel({
  transform,
  onChangeTransform,
  onCenter,
  onFit
}) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto">
      <div>
        <h3 className="text-base font-bold font-display text-white">Subject Transform</h3>
        <p className="text-xs text-slate-400 mt-1">Scale, rotate, align and position the cutout.</p>
      </div>

      {/* Scale */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Scale (Zoom)</span>
          <span className="text-brand-500">{Math.round((transform.scale || 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="250"
          value={Math.round((transform.scale || 1) * 100)}
          onChange={(e) => onChangeTransform({ ...transform, scale: parseInt(e.target.value, 10) / 100 })}
        />
      </div>

      {/* Rotation */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
          <span>Rotation</span>
          <span className="text-brand-500">{transform.rotation || 0}°</span>
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
        <label className="text-xs font-semibold text-slate-300 block mb-2">Align & Flip</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onCenter}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            <Crosshair className="w-4 h-4 text-brand-500" />
            <span>Center</span>
          </button>

          <button
            onClick={onFit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            <Maximize2 className="w-4 h-4 text-brand-500" />
            <span>Fit Canvas</span>
          </button>

          <button
            onClick={() => onChangeTransform({ ...transform, flipH: (transform.flipH || 1) * -1 })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>Flip H</span>
          </button>

          <button
            onClick={() => onChangeTransform({ ...transform, flipV: (transform.flipV || 1) * -1 })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-200 border border-studio-border transition"
          >
            <FlipVertical className="w-4 h-4" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* Drag Tip */}
      <div className="p-3.5 rounded-xl bg-studio-800 border border-studio-border text-xs text-slate-400 flex items-center gap-2.5">
        <Move className="w-4 h-4 text-brand-500 shrink-0" />
        <span>You can also click and drag directly on the canvas viewport to move the subject.</span>
      </div>
    </div>
  );
}
