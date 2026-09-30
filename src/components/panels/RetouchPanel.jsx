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
  ShieldAlert, 
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
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white">Cutout & Retouch Studio</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Eliminate stubborn backgrounds, shadow residue, and edge halos with smart tools.
        </p>
      </div>

      {/* 4 Tool Selectors */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Select Retouch Tool
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-studio-800/80 rounded-xl border border-studio-border">
          {/* Magic Wand */}
          <button
            type="button"
            onClick={() => onChangeTool('wand')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'wand'
                ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-glow'
                : 'text-slate-300 hover:text-white hover:bg-studio-700/60'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Magic Wand</span>
          </button>

          {/* Lasso Cutout */}
          <button
            type="button"
            onClick={() => onChangeTool('lasso')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'lasso'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow'
                : 'text-slate-300 hover:text-white hover:bg-studio-700/60'
            }`}
          >
            <Lasso className="w-3.5 h-3.5" />
            <span>Lasso Cut</span>
          </button>

          {/* Erase Brush */}
          <button
            type="button"
            onClick={() => onChangeTool('erase')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'erase'
                ? 'bg-red-500 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-studio-700/60'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Erase Brush</span>
          </button>

          {/* Restore Brush */}
          <button
            type="button"
            onClick={() => onChangeTool('restore')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'restore'
                ? 'bg-emerald-500 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-studio-700/60'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </div>
      </div>

      {/* Active Tool Specific Settings */}
      {activeTool === 'wand' && (
        <div className="p-3.5 rounded-xl bg-studio-950 border border-brand-500/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-brand-400" />
              Magic Wand Settings
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
              CLICK TO PURGE
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Click anywhere on remaining background (like asphalt under cars or corners) to instantly vaporize that color.
          </p>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Color Tolerance</span>
              <span className="text-brand-400 font-bold">{wand.tolerance}</span>
            </div>
            <input
              type="range"
              min="5"
              max="90"
              value={wand.tolerance}
              onChange={(e) => onChangeWand({ ...wand, tolerance: parseInt(e.target.value, 10) })}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Precise (5)</span>
              <span>Aggressive (90)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-studio-border/60">
            <span className="text-xs text-slate-300">Contiguous Area Only</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={wand.contiguous}
                onChange={(e) => onChangeWand({ ...wand, contiguous: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-studio-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>
        </div>
      )}

      {activeTool === 'lasso' && (
        <div className="p-3.5 rounded-xl bg-studio-950 border border-purple-500/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Lasso className="w-3.5 h-3.5 text-purple-400" />
              Lasso Cutout Settings
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
              FREEHAND LOOP
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Drag on the canvas to draw a loop around any stubborn background chunk. Releasing the mouse immediately cuts it out.
          </p>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Edge Softness (Feather)</span>
              <span className="text-purple-400 font-bold">{lasso.feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={lasso.feather}
              onChange={(e) => onChangeLasso({ ...lasso, feather: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {(activeTool === 'erase' || activeTool === 'restore') && (
        <div className="space-y-4 animate-fade-in">
          {/* Brush Radius */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
              <span>Brush Radius</span>
              <span className={activeTool === 'erase' ? 'text-red-400' : 'text-emerald-400'}>
                {brush.size}px
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="150"
              value={brush.size}
              onChange={(e) => onChangeBrush({ ...brush, size: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>

          {/* Brush Feather */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-semibold">
              <span>Edge Softness</span>
              <span className={activeTool === 'erase' ? 'text-red-400' : 'text-emerald-400'}>
                {brush.feather}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brush.feather}
              onChange={(e) => onChangeBrush({ ...brush, feather: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* AI Sensitivity & Edge Refinement Accordion */}
      <div className="rounded-xl bg-studio-950 border border-studio-border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRefineAccordion(!showRefineAccordion)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-studio-900 transition"
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
          <div className="p-3.5 pt-0 space-y-4 border-t border-studio-border/50 text-xs">
            {/* Background Cutoff Threshold */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
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
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>Gentle / Keep Hair (5%)</span>
                <span>Aggressive Cutoff (95%)</span>
              </div>
            </div>

            {/* Edge Choke / Halo Shaver */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Edge Choke (Shave Halos)</span>
                <span className="text-purple-400 font-bold">
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
                className="w-full"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Contracts edge inwards to completely delete white outline halos around subjects.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* One-Click Smart Actions */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          One-Click Smart Fixes
        </label>

        {/* Purge Floor Shadows */}
        <button
          type="button"
          onClick={onPurgeFloorShadows}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-800 hover:bg-studio-700/80 border border-studio-border text-xs text-white transition group"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span className="font-medium">Purge Lingering Floor Shadows</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-studio-900 text-slate-400 font-semibold">
            Auto
          </span>
        </button>

        {/* Clean Stray Islands */}
        <button
          type="button"
          onClick={onCleanStrayIslands}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-800 hover:bg-studio-700/80 border border-studio-border text-xs text-white transition group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="font-medium">Clean Floating Islands & Specks</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-studio-900 text-slate-400 font-semibold">
            Auto
          </span>
        </button>

        {/* Defringe Edges */}
        <button
          type="button"
          onClick={onDefringeEdges}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-800 hover:bg-studio-700/80 border border-studio-border text-xs text-white transition group"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">Decontaminate & Defringe Color</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-studio-900 text-slate-400 font-semibold">
            Anti-Spill
          </span>
        </button>

        {/* Invert Mask */}
        <button
          type="button"
          onClick={onInvertMask}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-studio-800 hover:bg-studio-700/80 border border-studio-border text-xs text-white transition group"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="font-medium">Invert Subject / Background</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-studio-900 text-slate-400 font-semibold">
            Swap
          </span>
        </button>
      </div>

      {/* Reset to Raw AI Cutout */}
      <button
        type="button"
        onClick={onResetMask}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-semibold text-slate-300 hover:text-white border border-studio-border transition"
      >
        <RotateCcw className="w-4 h-4 text-brand-400" />
        <span>Revert to Pristine AI Cutout</span>
      </button>
    </div>
  );
}
