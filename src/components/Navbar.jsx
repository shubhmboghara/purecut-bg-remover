import React from 'react';
import { 
  Wand2, 
  RotateCcw, 
  RotateCw, 
  RefreshCw, 
  UploadCloud, 
  Download,
  Layers,
  Sparkles,
  Sliders,
  Cpu,
  Cloud,
  Box
} from 'lucide-react';
import { transitionView } from '../utils/viewTransition';

export default function Navbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onNewImage,
  onExport,
  hasImage,
  appMode = 'single',
  onSwitchMode,
  batchCount = 0,
  batchCompletedCount = 0,
  aiConfig,
  onOpenAiEngine
}) {
  const handleModeSwitch = (mode) => {
    if (mode === appMode) return;
    transitionView(() => {
      onSwitchMode(mode);
    });
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-studio-900/90 backdrop-blur-2xl border-b border-studio-borderHighlight flex items-center justify-between z-40 select-none shadow-md">
      {/* Left: Brand with 3D Holographic Crest */}
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-600 to-accent-purple p-0.5 shadow-glow transition transform group-hover:scale-105 group-hover:rotate-3">
            <div className="w-full h-full rounded-[14px] bg-studio-950 flex items-center justify-center text-white">
              <Box className="w-5 h-5 text-brand-300" />
            </div>
          </div>
          <div className="absolute -inset-1.5 rounded-2xl bg-brand-500/25 blur-md -z-10 group-hover:bg-brand-500/40 transition"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>PureCut</span>
              <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-500/30 to-accent-purple/30 text-brand-300 font-extrabold border border-brand-500/40 shadow-glow">
                3D STUDIO
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
            Spatial AI Background Remover & Lighting Lab
          </p>
        </div>
      </div>

      {/* Center: 3D Recessed Mode Switcher */}
      <div 
        role="tablist"
        aria-label="Studio Mode"
        className="flex items-center p-1 bg-studio-950 rounded-2xl border border-studio-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
      >
        <button
          role="tab"
          aria-selected={appMode === 'single'}
          onClick={() => handleModeSwitch('single')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            appMode === 'single'
              ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-glow btn-3d'
              : 'text-slate-400 hover:text-white hover:bg-studio-900/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Single Studio</span>
        </button>

        <button
          role="tab"
          aria-selected={appMode === 'batch'}
          onClick={() => handleModeSwitch('batch')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            appMode === 'batch'
              ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-glow btn-3d'
              : 'text-slate-400 hover:text-white hover:bg-studio-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Studio</span>
          {batchCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-400/25 text-brand-300 text-[10px] font-bold border border-brand-400/40">
              {batchCompletedCount > 0 ? `${batchCompletedCount}/${batchCount}` : batchCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: 3D Tactile Action Buttons */}
      <div className="flex items-center gap-2">
        {appMode === 'single' && (
          <>
            {/* History controls */}
            <div className="flex items-center gap-1 bg-studio-950 p-1 rounded-2xl border border-studio-border shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last action"
                title="Undo (Ctrl+Z / ⌘Z)"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-25 disabled:pointer-events-none transition keycap-3d"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo action"
                title="Redo (Ctrl+Y / ⌘Y)"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-25 disabled:pointer-events-none transition keycap-3d"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-5 bg-studio-border mx-1 hidden md:block"></div>

            {hasImage && (
              <button
                onClick={onReset}
                title="Reset adjustments to default"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-bold text-slate-300 hover:text-white transition keycap-3d"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}

            {/* AI Engine Status Pill */}
            <button
              onClick={onOpenAiEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-bold text-slate-200 transition keycap-3d"
              title="Configure AI Engine"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald shadow-[0_0_8px_#10b981] animate-pulse"></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-accent-purple" />
                  <span className="hidden lg:inline text-purple-300">Remove.bg</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="hidden lg:inline text-brand-300">Neural WASM</span>
                </>
              )}
            </button>

            {/* New Image Button */}
            <button
              onClick={onNewImage}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-bold text-slate-200 hover:text-white transition keycap-3d"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">New Image</span>
            </button>

            {/* 3D Primary Export HD Button */}
            <button
              onClick={onExport}
              disabled={!hasImage}
              title="Export High-Definition Image (Ctrl+E / ⌘E)"
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple text-xs font-extrabold text-white tracking-wide uppercase btn-3d disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HD</span>
            </button>
          </>
        )}

        {appMode === 'batch' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAiEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-bold text-slate-200 transition keycap-3d"
              title="Configure AI Engine"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald shadow-[0_0_8px_#10b981] animate-pulse"></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-accent-purple" />
                  <span className="text-purple-300">Remove.bg</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-brand-300">Neural WASM</span>
                </>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-950 border border-studio-border text-xs text-slate-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-bold">3D Batch Engine Ready</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
