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
  return (
    <header className="h-16 px-4 md:px-5 bg-studio-900 border-b border-studio-border flex items-center justify-between z-40 select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white shadow-glow">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg tracking-tight text-white">
              PureCut <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 text-white font-semibold">REACT AI</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Background Remover & Photo Studio</p>
        </div>
      </div>

      {/* Center: Mode Switcher */}
      <div className="flex items-center gap-1 p-1 bg-studio-950 rounded-2xl border border-studio-border">
        <button
          onClick={() => onSwitchMode('single')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            appMode === 'single'
              ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Single Studio</span>
        </button>

        <button
          onClick={() => onSwitchMode('batch')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            appMode === 'batch'
              ? 'bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Studio</span>
          {batchCount > 0 && (
            <span className="px-2 py-0.2 rounded-full bg-brand-400/20 text-brand-300 text-[10px] font-bold">
              {batchCompletedCount > 0 ? `${batchCompletedCount}/${batchCount}` : batchCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        {appMode === 'single' && (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-studio-border mx-1 hidden sm:block"></div>

            {hasImage && (
              <button
                onClick={onReset}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-800 border border-studio-border text-xs font-semibold text-slate-200 hover:bg-studio-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={onOpenAiEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 border border-studio-border text-xs font-semibold text-slate-200 transition"
              title="Configure AI Engine (In-Browser Neural IS-Net or Official Remove.bg API)"
            >
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden lg:inline text-purple-300">Remove.bg API</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="hidden lg:inline text-brand-300">IS-Net AI</span>
                </>
              )}
            </button>

            <button
              onClick={onNewImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-800 border border-studio-border text-xs font-semibold text-slate-200 hover:bg-studio-700 transition"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-500" />
              <span className="hidden sm:inline">New Image</span>
            </button>

            <button
              onClick={onExport}
              disabled={!hasImage}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-xs font-semibold text-white shadow-glow disabled:opacity-40 disabled:pointer-events-none transition"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 border border-studio-border text-xs font-semibold text-slate-200 transition"
              title="Configure AI Engine"
            >
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300">Remove.bg API</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-brand-300">IS-Net AI</span>
                </>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Batch Engine Ready</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
