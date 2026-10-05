import React from 'react';
import { Image as ImageIcon, Square, Smartphone, Tablet, Monitor, Crop } from 'lucide-react';

const RATIOS = [
  { id: 'original', title: 'Original', desc: 'Auto native', icon: ImageIcon },
  { id: '1:1', title: '1 : 1', desc: 'Square / Avatar', icon: Square },
  { id: '4:5', title: '4 : 5', desc: 'Portrait Post', icon: Tablet },
  { id: '9:16', title: '9 : 16', desc: 'Story / Reels / TikTok', icon: Smartphone },
  { id: '16:9', title: '16 : 9', desc: 'YouTube / Banner', icon: Monitor }
];

export default function CanvasSizePanel({ aspectRatio, onSelectRatio, originalDimensions }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto text-slate-200 custom-scrollbar panel-container">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center">
            <Crop className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold font-display text-white text-balance">Canvas Aspect Ratio</h3>
        </div>
        <p className="text-xs text-slate-400 text-pretty">
          Export in optimal formats for Instagram, TikTok, YouTube, and web banners.
        </p>
      </div>

      <div 
        role="radiogroup"
        aria-label="Canvas aspect ratios"
        className="grid grid-cols-2 gap-3"
      >
        {RATIOS.map((r) => {
          const Icon = r.icon;
          const isActive = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelectRatio(r.id)}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-150 transform ${
                isActive
                  ? 'border-brand-400 bg-gradient-to-b from-brand-500/25 to-brand-600/20 text-white shadow-[0_4px_12px_rgba(59,130,246,0.35),0_3px_0_theme(colors.brand.700)] -translate-y-0.5'
                  : 'border-studio-border bg-studio-950 text-slate-400 shadow-[0_3px_0_rgba(0,0,0,0.5)] hover:border-slate-600 hover:text-white hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-colors ${
                isActive ? 'bg-brand-500/30 text-brand-300' : 'bg-studio-900 text-slate-400'
              }`}>

                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">{r.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {r.id === 'original' && originalDimensions 
                  ? `${originalDimensions.width} × ${originalDimensions.height}` 
                  : r.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
