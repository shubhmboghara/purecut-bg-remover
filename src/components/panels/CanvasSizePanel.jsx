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

      <div className="grid grid-cols-2 gap-2.5">
        {RATIOS.map((r) => {
          const Icon = r.icon;
          const isActive = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRatio(r.id)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                isActive
                  ? 'border-brand-500 bg-brand-500/15 text-white shadow-glow'
                  : 'border-studio-border bg-studio-950 text-slate-400 hover:bg-studio-850 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 text-brand-400 mb-0.5" />
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
