import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cpu, 
  Cloud, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Zap,
  Info,
  RotateCcw
} from 'lucide-react';
import { getAiConfig, saveAiConfig, DEFAULT_AI_CONFIG } from '../services/aiConfig';

export default function AiEngineModal({ isOpen, onClose, onSaveSuccess }) {
  const [config, setConfig] = useState(getAiConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setConfig(getAiConfig());
      setTestStatus(null);
      setTestMessage('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    saveAiConfig(config);
    if (onSaveSuccess) onSaveSuccess(config);
    onClose();
  };

  const handleTestRemoveBgKey = async () => {
    if (!config.removeBgApiKey || !config.removeBgApiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an API key first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Checking API key with Remove.bg servers...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 2, 2);

      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const formData = new FormData();
      formData.append('image_file', blob, 'test.png');
      formData.append('size', 'preview');

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': config.removeBgApiKey.trim()
        },
        body: formData
      });

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Connected! Your Remove.bg API key is verified and active.');
      } else {
        let errTitle = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.errors && errData.errors.length > 0) {
            errTitle = errData.errors[0].title || errTitle;
          }
        } catch {}
        setTestStatus('error');
        setTestMessage(`Remove.bg Error: ${errTitle}`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(`Connection error: ${err.message}. Please check your internet or CORS.`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="ai-engine-title"
      className="p-4 bg-transparent outline-none"
    >
      <div 
        className="w-full max-w-2xl bg-studio-900/95 backdrop-blur-2xl border border-studio-borderHighlight rounded-3xl pedestal-3d overflow-hidden flex flex-col max-h-[92vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-studio-border flex items-center justify-between bg-studio-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-600 to-accent-purple flex items-center justify-center text-white shadow-glow border-t border-white/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-engine-title" className="font-display font-bold text-base md:text-lg text-white flex items-center gap-2">
                <span>AI Neural Engine Architecture</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                  DUAL-ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose how your background removal AI runs: In-Browser WASM or Remove.bg Cloud API.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI configuration dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 custom-scrollbar">
          
          {/* Tech Breakdown Banner */}
          <div className="p-4 rounded-2xl bg-studio-950/70 border border-studio-border flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>How Remove.bg Works & Why It Works So Well</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed text-pretty">
              Remove.bg uses <strong>Deep Nested U-Nets (IS-Net / U-2-Net)</strong> to perform 
              <strong> Dichotomous Image Segmentation</strong>. Instead of basic cutoff lines, it calculates 
              sub-pixel <strong>Alpha Matting</strong> for hair strands and applies 
              <strong> Color Decontamination</strong> to remove background color spill.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                <p className="text-slate-400 font-semibold">1. Detection</p>
                <p className="text-white font-medium">Saliency SOD</p>
              </div>
              <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                <p className="text-slate-400 font-semibold">2. Matting</p>
                <p className="text-white font-medium">Alpha Transition</p>
              </div>
              <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                <p className="text-slate-400 font-semibold">3. Edge Detail</p>
                <p className="text-white font-medium">Hair Strand & Fur</p>
              </div>
              <div className="p-2 rounded-xl bg-studio-900 border border-studio-border/60">
                <p className="text-slate-400 font-semibold">4. Color Defringe</p>
                <p className="text-white font-medium">Anti-Spill Filter</p>
              </div>
            </div>
          </div>

          {/* Engine Selector */}
          <div>
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
              Select Primary AI Engine
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Local In-Browser Neural AI */}
              <div
                onClick={() => setConfig({ ...config, engine: 'local' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  config.engine === 'local'
                    ? 'border-brand-500 bg-brand-500/15 shadow-glow'
                    : 'border-studio-border bg-studio-950/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      <Zap className="w-4 h-4 text-amber-400" />
                      In-Browser Neural AI
                    </span>
                    {config.engine === 'local' && (
                      <CheckCircle2 className="w-4 h-4 text-brand-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    Powered by <strong>IS-Net (U-2-Net architecture)</strong> via WebAssembly & WebGPU.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    100% Free Forever
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                    100% Private (No Upload)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                    Zero API Keys Needed
                  </span>
                </div>
              </div>

              {/* Option 2: Remove.bg Official Cloud API */}
              <div
                onClick={() => setConfig({ ...config, engine: 'removebg' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  config.engine === 'removebg'
                    ? 'border-purple-500 bg-purple-500/15 shadow-glow-purple'
                    : 'border-studio-border bg-studio-950/60 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 font-bold text-white text-sm">
                      <Cloud className="w-4 h-4 text-purple-400" />
                      Remove.bg Official Cloud
                    </span>
                    {config.engine === 'removebg' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    Direct integration with <strong>remove.bg official servers</strong> for 100% exact parity.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    Requires API Key
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-800 text-slate-300 font-semibold">
                    Remove.bg Servers
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    Auto-Fallback to Local
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remove.bg API Key Configuration */}
          {config.engine === 'removebg' && (
            <div className="p-4 rounded-2xl bg-studio-950 border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  Your Remove.bg API Key
                </label>
                <a
                  href="https://www.remove.bg/dashboard#api-key"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1 font-semibold transition"
                >
                  <span>Get Free Key (50 credits/mo)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  required
                  placeholder="Paste your remove.bg API key here..."
                  value={config.removeBgApiKey || ''}
                  onChange={(e) => setConfig({ ...config, removeBgApiKey: e.target.value })}
                  className="flex-1 px-3 py-2 bg-studio-900 border border-studio-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-3 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs text-slate-300 transition"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={handleTestRemoveBgKey}
                  disabled={testStatus === 'testing' || !config.removeBgApiKey}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Verify'}
                </button>
              </div>

              {testMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    testStatus === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}
                >
                  {testStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Local Neural Model Quality */}
          {config.engine === 'local' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Local Neural Model Precision
                </label>
                <span className="text-[11px] text-brand-300 font-medium">
                  Default: HD Full Precision
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, quality: 'medium' })}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    config.quality === 'medium'
                      ? 'border-brand-500 bg-brand-500/15 text-white shadow-glow'
                      : 'border-studio-border bg-studio-950/60 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="font-bold text-xs text-white">HD Full Precision (IS-Net Medium)</p>
                      {config.quality === 'medium' && (
                        <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Highest detail for hair strands and fine edges (Recommended & Default).
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                      DEFAULT
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                      Max Quality
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, quality: 'small' })}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    config.quality === 'small'
                      ? 'border-brand-500 bg-brand-500/15 text-white shadow-glow'
                      : 'border-studio-border bg-studio-950/60 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className="font-bold text-xs text-white">Ultra-Fast (IS-Net Small Quantized)</p>
                      {config.quality === 'small' && (
                        <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Loads 3x faster, ideal for older laptops and mobile phones.
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      Fastest
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Color Decontamination & Edge Defringing */}
          <div className="p-4 rounded-2xl bg-studio-950 border border-studio-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  Color Decontamination & Edge Defringing
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Eliminate background color halos (e.g. green or white spill) around subject edges.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.edgeDecontaminate}
                  onChange={(e) => setConfig({ ...config, edgeDecontaminate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-studio-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>

            {config.edgeDecontaminate && (
              <div className="pt-2 border-t border-studio-border/60">
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Edge Defringe Smoothness</span>
                  <span className="text-brand-400 font-bold">{config.edgeFeather} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={config.edgeFeather}
                  onChange={(e) => setConfig({ ...config, edgeFeather: parseInt(e.target.value, 10) })}
                  className="w-full"
                />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-studio-border bg-studio-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Settings stored safely in local browser storage</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfig({ ...DEFAULT_AI_CONFIG })}
              className="px-3 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5"
              title="Reset all settings to recommended defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl btn-3d-secondary text-xs font-semibold text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl btn-3d text-xs font-bold text-white shadow-glow"
            >
              Save & Apply Settings
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
