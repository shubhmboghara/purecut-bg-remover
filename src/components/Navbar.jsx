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
  Cloud
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
    <header className="h-16 px-4 md:px-6 bg-studio-900/80 backdrop-blur-xl border-b border-studio-border flex items-center justify-between z-40 select-none transition-colors">
      {/* Left: Brand & Studio Identity */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 via-brand-600 to-accent-purple flex items-center justify-center text-white shadow-glow transition transform group-hover:scale-105">
            <Wand2 className="w-5 h-5" />
          </div>
          <div className="absolute -inset-1 rounded-xl bg-brand-500/20 blur-sm -z-10 group-hover:opacity-100 opacity-60 transition"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-base md:text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>PureCut</span>
              <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500/30 to-accent-purple/30 text-brand-300 font-bold border border-brand-500/30 shadow-sm">
                Studio AI
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
            Creative AI Background Remover & Photo Lab
          </p>
        </div>
      </div>

      {/* Center: Segmented Mode Switcher */}
      <div 
        role="tablist"
        aria-label="Studio Mode"
        className="flex items-center p-1 bg-studio-950/90 rounded-2xl border border-studio-border shadow-inner"
      >
        <button
          role="tab"
          aria-selected={appMode === 'single'}
          onClick={() => handleModeSwitch('single')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            appMode === 'single'
              ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-850/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Single Studio</span>
        </button>

        <button
          role="tab"
          aria-selected={appMode === 'batch'}
          onClick={() => handleModeSwitch('batch')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            appMode === 'batch'
              ? 'bg-gradient-to-r from-brand-500 to-accent-purple text-white shadow-glow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-studio-850/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Studio</span>
          {batchCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-400/20 text-brand-300 text-[10px] font-bold border border-brand-400/30">
              {batchCompletedCount > 0 ? `${batchCompletedCount}/${batchCount}` : batchCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {appMode === 'single' && (
          <>
            {/* History controls */}
            <div className="flex items-center gap-1 bg-studio-850/70 p-0.5 rounded-xl border border-studio-border">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last action"
                title="Undo (Ctrl+Z / ⌘Z)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo action"
                title="Redo (Ctrl+Y / ⌘Y)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-700/60 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-5 bg-studio-border mx-1 hidden md:block"></div>

            {hasImage && (
              <button
                onClick={onReset}
                title="Reset adjustments to default"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}

            {/* AI Engine Status Pill */}
            <button
              onClick={onOpenAiEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-semibold text-slate-200 transition group"
              title="Configure AI Engine (Local Neural WASM vs. Cloud API)"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-accent-purple" />
                  <span className="hidden lg:inline text-purple-300">Remove.bg Cloud</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="hidden lg:inline text-brand-300">Local Neural AI</span>
                </>
              )}
            </button>

            {/* New Image */}
            <button
              onClick={onNewImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-semibold text-slate-200 hover:text-white transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-400" />
              <span className="hidden sm:inline">New Image</span>
            </button>

            {/* Export HD */}
            <button
              onClick={onExport}
              disabled={!hasImage}
              title="Export High-Definition Image (Ctrl+E / ⌘E)"
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple hover:from-brand-600 hover:to-accent-purple text-xs font-bold text-white shadow-glow disabled:opacity-40 disabled:pointer-events-none transition transform hover:-translate-y-0.5 active:translate-y-0"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-studio-850 hover:bg-studio-800 border border-studio-border text-xs font-semibold text-slate-200 transition"
              title="Configure AI Engine"
            >
              <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-accent-purple" />
                  <span className="text-purple-300">Remove.bg Cloud</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-brand-300">Local Neural AI</span>
                </>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-950 border border-studio-border text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Batch Queue Ready</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
