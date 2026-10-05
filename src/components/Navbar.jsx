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
  Box,
  Zap
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
    <header className="navbar-glass h-[60px] px-4 md:px-6 flex items-center justify-between z-40 select-none sticky top-0">
      {/* Left: Premium Brand */}
      <div className="flex items-center gap-3">
        <div className="animated-border-wrap w-9 h-9 rounded-xl relative cursor-pointer group" role="img" aria-label="PureCut logo">
          <div className="absolute inset-0 rounded-xl" style={{padding: '1.5px', background: 'conic-gradient(from 0deg, oklch(0.65 0.28 278), oklch(0.72 0.28 308), oklch(0.82 0.18 195), oklch(0.65 0.28 278))', animation: 'rotate-border 5s linear infinite'}}></div>
          <div className="relative w-full h-full rounded-xl flex items-center justify-center" style={{background: 'oklch(0.09 0.025 260)'}}>
            <Box style={{width:'18px', height:'18px', color: 'oklch(0.80 0.16 275)'}} />
          </div>
          <div className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300" style={{background: 'oklch(0.65 0.28 278 / 0.2)', filter: 'blur(8px)', zIndex: -1}}></div>
        </div>
        
        <div className="flex flex-col leading-none gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-sm md:text-[15px] tracking-tight text-white">
              PureCut
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full font-extrabold" style={{background: 'linear-gradient(135deg, oklch(0.65 0.28 278 / 0.18), oklch(0.72 0.28 308 / 0.18))', border: '1px solid oklch(0.65 0.28 278 / 0.35)', color: 'oklch(0.80 0.16 275)'}}>
              <Zap style={{width:'8px', height:'8px'}} />
              3D Studio
            </span>
          </div>
          <p className="text-[10px] text-slate-500 hidden md:block font-medium">Spatial AI Photo Engine</p>
        </div>
      </div>

      {/* Center: Recessed Mode Pill */}
      <div 
        role="tablist"
        aria-label="Studio Mode"
        className="flex items-center p-1 rounded-2xl"
        style={{
          background: 'oklch(0.07 0.02 260)',
          border: '1px solid color-mix(in oklch, white 9%, transparent)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {['single', 'batch'].map((mode) => (
          <button
            key={mode}
            role="tab"
            aria-selected={appMode === mode}
            onClick={() => handleModeSwitch(mode)}
            className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
              appMode === mode ? 'text-white' : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            {appMode === mode && (
              <span
                className="absolute inset-0 rounded-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.60 0.28 308))', boxShadow: '0 2px 16px oklch(0.65 0.28 278 / 0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}
              />
            )}
            {mode === 'single' ? <Sliders style={{width:'12px', height:'12px', position:'relative', zIndex:10}} /> : <Layers style={{width:'12px', height:'12px', position:'relative', zIndex:10}} />}
            <span style={{position:'relative', zIndex:10}}>{mode === 'single' ? 'Single Studio' : 'Batch Studio'}</span>
            {mode === 'batch' && batchCount > 0 && (
              <span style={{position:'relative', zIndex:10, padding:'1px 6px', borderRadius:'9999px', background:'rgba(255,255,255,0.12)', color:'white', fontSize:'9px', fontWeight:'bold'}}>
                {batchCompletedCount > 0 ? `${batchCompletedCount}/${batchCount}` : batchCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1.5">
        {appMode === 'single' && (
          <>
            <div
              className="flex items-center gap-0.5 p-1 rounded-xl"
              style={{
                background: 'oklch(0.07 0.02 260)',
                border: '1px solid color-mix(in oklch, white 8%, transparent)',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6)'
              }}
            >
              <button
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last change (Ctrl+Z)"
                title="Undo (Ctrl+Z)"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 disabled:opacity-20 disabled:pointer-events-none transition focus-visible:outline-2 focus-visible:outline-brand-400"
              >
                <RotateCcw style={{width:'15px', height:'15px'}} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo next change (Ctrl+Y)"
                title="Redo (Ctrl+Y)"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/15 disabled:opacity-20 disabled:pointer-events-none transition focus-visible:outline-2 focus-visible:outline-brand-400"
              >
                <RotateCw style={{width:'15px', height:'15px'}} />
              </button>
            </div>

            <div className="w-px h-4 mx-0.5 hidden md:block" style={{background: 'color-mix(in oklch, white 8%, transparent)'}}></div>

            <button
              onClick={onOpenAiEngine}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white transition-all duration-200"
              title="Configure AI Engine"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" style={{boxShadow: '0 0 6px #34d399'}}></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud style={{width:'14px', height:'14px', color: 'oklch(0.72 0.28 308)'}} />
                  <span className="hidden lg:inline" style={{color: 'oklch(0.80 0.28 308)'}}>Remove.bg</span>
                </>
              ) : (
                <>
                  <Cpu style={{width:'14px', height:'14px', color: 'oklch(0.72 0.16 275)'}} />
                  <span className="hidden lg:inline" style={{color: 'oklch(0.80 0.16 275)'}}>Neural WASM</span>
                </>
              )}
            </button>

            {hasImage && (
              <button
                onClick={onReset}
                title="Reset adjustments"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-500 hover:text-white transition"
              >
                <RefreshCw style={{width:'12px', height:'12px'}} />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={onNewImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-200"
              style={{
                background: 'oklch(0.13 0.03 260)',
                border: '1px solid color-mix(in oklch, white 12%, transparent)',
                color: 'oklch(0.80 0.01 260)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.4)'
              }}
            >
              <UploadCloud style={{width:'14px', height:'14px', color: 'oklch(0.72 0.16 275)'}} />
              <span className="hidden sm:inline">New Image</span>
            </button>

            <button
              onClick={onExport}
              disabled={!hasImage}
              title="Export HD (Ctrl+E)"
              className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold text-white tracking-wide uppercase overflow-hidden btn-3d disabled:opacity-35 disabled:pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, oklch(0.52 0.28 278), oklch(0.58 0.28 308))'
              }}
            >
              <Download style={{width:'14px', height:'14px', position:'relative', zIndex:10}} />
              <span style={{position:'relative', zIndex:10}}>Export HD</span>
            </button>
          </>
        )}

        {appMode === 'batch' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiEngine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-white transition"
              title="Configure AI Engine"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{boxShadow: '0 0 6px #34d399'}}></span>
              {aiConfig?.engine === 'removebg' ? (
                <>
                  <Cloud style={{width:'14px', height:'14px', color: 'oklch(0.72 0.28 308)'}} />
                  <span style={{color: 'oklch(0.80 0.28 308)'}}>Remove.bg</span>
                </>
              ) : (
                <>
                  <Cpu style={{width:'14px', height:'14px', color: 'oklch(0.72 0.16 275)'}} />
                  <span style={{color: 'oklch(0.80 0.16 275)'}}>Neural WASM</span>
                </>
              )}
            </button>
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-300"
              style={{
                background: 'oklch(0.07 0.02 260)',
                border: '1px solid color-mix(in oklch, white 9%, transparent)'
              }}
            >
              <Sparkles style={{width:'12px', height:'12px', color: 'oklch(0.72 0.16 275)'}} />
              <span>3D Batch Engine Ready</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
