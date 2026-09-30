import React, { useState } from 'react';
import { 
  Wand2, 
  Lasso, 
  Eraser, 
  Paintbrush, 
  RotateCcw, 
  Sparkles, 
  Scissors, 
  Sliders, 
  Layers, 
  Sun, 
  ChevronDown, 
  ChevronUp,
  RefreshCw
} from 'lucide-react';

export default function RetouchPanel({
  activeTool = 'erase',
  onChangeTool,
  brush,
  onChangeBrush,
  wand,
  onChangeWand,
  lasso,
  onChangeLasso,
  refine,
  onChangeRefine,
  onApplyRefine,
  onPurgeFloorShadows,
  onCleanStrayIslands,
  onDefringeEdges,
  onInvertMask,
  onResetMask
}) {
  const [showRefineAccordion, setShowRefineAccordion] = useState(true);

  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Cutout & Retouch Lab</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Surgically eliminate stubborn backgrounds, shadow residue, and color halos with smart tools.
        </p>
      </div>

      {/* 4 Tool Selectors */}
      <div>
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
          Select Retouch Tool
        </label>
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-studio-950 rounded-2xl border border-studio-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          {/* Magic Wand */}
          <button
            type="button"
            onClick={() => onChangeTool('wand')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition keycap-3d ${
              activeTool === 'wand'
                ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-glow'
                : 'bg-studio-900/60 text-slate-300 hover:text-white hover:bg-studio-850'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Magic Wand</span>
          </button>

          {/* Lasso Cutout */}
          <button
            type="button"
            onClick={() => onChangeTool('lasso')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition keycap-3d ${
              activeTool === 'lasso'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-purple'
                : 'bg-studio-900/60 text-slate-300 hover:text-white hover:bg-studio-850'
            }`}
          >
            <Lasso className="w-3.5 h-3.5" />
            <span>Lasso Cut</span>
          </button>

          {/* Erase Brush */}
          <button
            type="button"
            onClick={() => onChangeTool('erase')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition keycap-3d ${
              activeTool === 'erase'
                ? 'bg-accent-rose text-white shadow-[0_4px_12px_rgba(244,63,94,0.4)]'
                : 'bg-studio-900/60 text-slate-300 hover:text-white hover:bg-studio-850'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Erase Brush</span>
          </button>

          {/* Restore Brush */}
          <button
            type="button"
            onClick={() => onChangeTool('restore')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition keycap-3d ${
              activeTool === 'restore'
                ? 'bg-accent-emerald text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]'
                : 'bg-studio-900/60 text-slate-300 hover:text-white hover:bg-studio-850'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </div>
      </div>

      {/* Active Tool Specific Settings */}
      {activeTool === 'wand' && (
        <div className="p-4 rounded-2xl bg-studio-950 border border-brand-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-brand-400" />
              Magic Wand Settings
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              CLICK TO PURGE
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed text-pretty">
            Click anywhere on stubborn background pixels (such as asphalt or corners) to instantly vaporize that color range.
          </p>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
              <span>Color Tolerance</span>
              <span className="text-brand-400 font-bold">{wand.tolerance}</span>
            </div>
            <input
              type="range"
              min="5"
              max="90"
              value={wand.tolerance}
              onChange={(e) => onChangeWand({ ...wand, tolerance: parseInt(e.target.value, 10) })}
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Precise (5)</span>
              <span>Aggressive (90)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-studio-border/60">
            <span className="text-xs text-slate-300 font-medium">Contiguous Island Only</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={wand.contiguous}
                onChange={(e) => onChangeWand({ ...wand, contiguous: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-studio-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>
        </div>
      )}

      {activeTool === 'lasso' && (
        <div className="p-4 rounded-2xl bg-studio-950 border border-purple-500/40 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Lasso className="w-3.5 h-3.5 text-accent-purple" />
              Lasso Cutout Settings
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              FREEHAND LOOP
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed text-pretty">
            Drag on the canvas to draw a loop around any stubborn background chunk. Releasing the mouse instantly clears it out.
          </p>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
              <span>Edge Softness (Feather)</span>
              <span className="text-accent-purple font-bold">{lasso.feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={lasso.feather}
              onChange={(e) => onChangeLasso({ ...lasso, feather: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      )}

      {(activeTool === 'erase' || activeTool === 'restore') && (
        <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
              <span>Brush Radius</span>
              <span className={`font-bold ${activeTool === 'erase' ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                {brush.size}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="150"
              value={brush.size}
              onChange={(e) => onChangeBrush({ ...brush, size: parseInt(e.target.value, 10) })}
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
              <span>Edge Softness (Feather)</span>
              <span className={`font-bold ${activeTool === 'erase' ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                {brush.feather}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brush.feather}
              onChange={(e) => onChangeBrush({ ...brush, feather: parseInt(e.target.value, 10) })}
            />
          </div>
        </div>
      )}

      {/* AI Sensitivity & Edge Refinement Accordion */}
      <div className="rounded-2xl bg-studio-950 border border-studio-border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRefineAccordion(!showRefineAccordion)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-studio-900 transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white">AI Sensitivity & Halo Shaver</span>
          </div>
          {showRefineAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showRefineAccordion && (
          <div className="p-4 pt-0 space-y-4 border-t border-studio-border/50 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-semibold">
                <span>AI Cutoff Sensitivity</span>
                <span className="text-brand-400 font-bold">{refine.threshold}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={refine.threshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeRefine({ ...refine, threshold: val });
                  if (onApplyRefine) onApplyRefine({ ...refine, threshold: val });
                }}
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Gentle / Keep Hair (5%)</span>
                <span>Aggressive Cutoff (95%)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-semibold">
                <span>Edge Choke (Shave Halos)</span>
                <span className="text-accent-purple font-bold">
                  {refine.choke > 0 ? `-${refine.choke}px` : refine.choke < 0 ? `+${Math.abs(refine.choke)}px` : '0px'}
                </span>
              </div>
              <input
                type="range"
                min="-3"
                max="4"
                step="1"
                value={refine.choke}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeRefine({ ...refine, choke: val });
                  if (onApplyRefine) onApplyRefine({ ...refine, choke: val });
                }}
              />
              <p className="text-[10px] text-slate-400 mt-1.5 text-pretty">
                Contracts edge inwards to completely eliminate light outline halos around subjects.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* One-Click Smart Actions */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          One-Click Smart Fixes
        </label>

        {/* Purge Floor Shadows */}
        <button
          type="button"
          onClick={onPurgeFloorShadows}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-studio-950 hover:bg-studio-850 border border-studio-border text-xs text-white transition group keycap-3d"
        >
          <div className="flex items-center gap-2.5">
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="font-semibold">Purge Floor Shadows</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-850 text-slate-300 font-semibold border border-studio-border">
            Auto
          </span>
        </button>

        {/* Clean Stray Islands */}
        <button
          type="button"
          onClick={onCleanStrayIslands}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-studio-950 hover:bg-studio-850 border border-studio-border text-xs text-white transition group keycap-3d"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">Clean Floating Specks</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-850 text-slate-300 font-semibold border border-studio-border">
            Auto
          </span>
        </button>

        {/* Defringe Edges */}
        <button
          type="button"
          onClick={onDefringeEdges}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-studio-950 hover:bg-studio-850 border border-studio-border text-xs text-white transition group keycap-3d"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <span className="font-semibold">Decontaminate & Defringe</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-850 text-slate-300 font-semibold border border-studio-border">
            Anti-Spill
          </span>
        </button>

        {/* Invert Mask */}
        <button
          type="button"
          onClick={onInvertMask}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-studio-950 hover:bg-studio-850 border border-studio-border text-xs text-white transition group keycap-3d"
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-accent-purple" />
            <span className="font-semibold">Invert Subject & Background</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-850 text-slate-300 font-semibold border border-studio-border">
            Swap
          </span>
        </button>
      </div>

      {/* Reset to Raw AI Cutout */}
      <button
        type="button"
        onClick={onResetMask}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-studio-850 hover:bg-studio-800 text-xs font-bold text-slate-200 hover:text-white border border-studio-border transition keycap-3d"
      >
        <RotateCcw className="w-4 h-4 text-brand-400" />
        <span>Revert to Pristine AI Cutout</span>
      </button>
    </div>
  );
}
