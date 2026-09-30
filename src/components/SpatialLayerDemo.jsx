import React, { useState } from 'react';
import { Layers, Sparkles, Wand2, Eye, ShieldCheck } from 'lucide-react';

/**
 * SpatialLayerDemo: 3D Holographic Layer Separation Showcase
 * Visually decomposes a photo into 3 floating planes in physical 3D space:
 * 1. Background Plane (Recessed in depth)
 * 2. Neural Saliency Matrix (Hovering in mid-depth)
 * 3. Cutout Subject (Elevated foreground with cast shadow)
 */
export default function SpatialLayerDemo() {
  const [isHovered, setIsHovered] = useState(false);
  const [activeLayer, setActiveLayer] = useState('all'); // 'all' | 'subject' | 'mask' | 'bg'

  return (
    <div 
      className="relative w-full max-w-lg aspect-[16/11] rounded-3xl bg-studio-950/80 border border-studio-borderHighlight p-6 flex flex-col justify-between overflow-hidden shadow-3d-card group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: '1200px' }}
    >
      {/* Ambient background glow */}
      <div className="ambient-glow bg-brand-500/20 w-72 h-72 -top-12 -left-12"></div>
      <div className="ambient-glow bg-accent-purple/20 w-72 h-72 -bottom-12 -right-12"></div>

      {/* Top Header Label */}
      <div className="relative z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center text-white shadow-glow">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>3D Spatial Neural Separation</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
                LIVE
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Hover to expand 3D holographic layers</p>
          </div>
        </div>

        {/* Interactive Layer Filter Chips */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-studio-900 border border-studio-border text-[10px]">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${activeLayer === 'all' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            3D Stack
          </button>
          <button
            onClick={() => setActiveLayer('subject')}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${activeLayer === 'subject' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Subject
          </button>
          <button
            onClick={() => setActiveLayer('mask')}
            className={`px-2 py-0.5 rounded-lg font-bold transition ${activeLayer === 'mask' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Mask
          </button>
        </div>
      </div>

      {/* 3D Isometric Viewport */}
      <div className="relative flex-1 flex items-center justify-center my-2 preserve-3d">
        <div
          className="relative w-64 h-44 preserve-3d transition-all duration-700 ease-out"
          style={{
            transform: isHovered
              ? 'rotateX(52deg) rotateZ(-32deg) translateY(-8px)'
              : 'rotateX(38deg) rotateZ(-22deg) translateY(0px)'
          }}
        >
          {/* Layer 1 (Bottom): Original Scene / Background */}
          {(activeLayer === 'all' || activeLayer === 'bg') && (
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-white/20 bg-studio-900 shadow-2xl transition-all duration-700 ease-out"
              style={{
                transform: isHovered ? 'translateZ(-40px)' : 'translateZ(0px)',
                opacity: activeLayer === 'all' ? 0.75 : 1
              }}
            >
              <img
                src="/samples/portrait.jpg"
                alt="Original Background Layer"
                className="w-full h-full object-cover filter brightness-75 contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-[10px] font-mono text-slate-300 font-bold bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  PLANE 01: Original Backdrop
                </span>
              </div>
            </div>
          )}

          {/* Layer 2 (Middle): AI Neural Segmentation Grid */}
          {(activeLayer === 'all' || activeLayer === 'mask') && (
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-cyan-400/50 bg-cyan-950/20 backdrop-blur-xs transition-all duration-700 ease-out shadow-[0_0_30px_rgba(6,182,212,0.35)]"
              style={{
                transform: isHovered ? 'translateZ(25px)' : 'translateZ(12px)',
                opacity: 0.85
              }}
            >
              {/* Animated scanning grid matrix */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle, #06b6d4 1.5px, transparent 1.5px)',
                  backgroundSize: '12px 12px'
                }}
              />
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent top-1/2 -translate-y-1/2 animate-[pulse_1.5s_infinite]"></div>
              
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-400/40 shadow-glow">
                  ⚡ PLANE 02: Alpha SOD Mask
                </span>
              </div>
            </div>
          )}

          {/* Layer 3 (Top): Isolated Cutout Foreground Subject */}
          {(activeLayer === 'all' || activeLayer === 'subject') && (
            <div
              className="absolute inset-0 rounded-2xl overflow-hidden border border-brand-400/60 transition-all duration-700 ease-out flex items-center justify-center"
              style={{
                transform: isHovered ? 'translateZ(80px)' : 'translateZ(28px)',
                filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.9))'
              }}
            >
              <div className="w-full h-full checkerboard-bg relative rounded-2xl overflow-hidden">
                <img
                  src="/samples/portrait.jpg"
                  alt="Subject Cutout"
                  className="w-full h-full object-cover"
                  style={{
                    clipPath: 'polygon(15% 10%, 85% 10%, 88% 90%, 12% 90%)'
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-500/90 text-white text-[9px] font-bold shadow-glow flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>PLANE 03: Precision Cutout</span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Spatial Indicators */}
          {isHovered && (
            <div
              className="absolute -right-8 -top-8 px-2.5 py-1 rounded-xl bg-studio-900/90 border border-brand-500/40 text-brand-300 text-[10px] font-bold shadow-2xl transition-all duration-500"
              style={{ transform: 'translateZ(110px)' }}
            >
              Sub-Pixel Precision: 99.8%
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="relative z-30 pt-3 border-t border-studio-border/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Wand2 className="w-3.5 h-3.5 text-brand-400" />
          <span>Interactive 3D Dimensional Spatial Stack</span>
        </span>
        <span className="font-mono text-emerald-400 font-semibold">
          Hardware Accelerated
        </span>
      </div>
    </div>
  );
}
