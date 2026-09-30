import React from 'react';
import { Image as ImageIcon, Square, Smartphone, Tablet, Monitor } from 'lucide-react';

const RATIOS = [
  { id: 'original', title: 'Original', desc: 'Auto native', icon: ImageIcon },
  { id: '1:1', title: '1 : 1', desc: 'Instagram / Avatar', icon: Square },
  { id: '4:5', title: '4 : 5', desc: 'Portrait Post', icon: Tablet },
  { id: '9:16', title: '9 : 16', desc: 'Story / Reels / TikTok', icon: Smartphone },
  { id: '16:9', title: '16 : 9', desc: 'YouTube / Banner', icon: Monitor }
];

export default function CanvasSizePanel({ aspectRatio, onSelectRatio, originalDimensions }) {
  return (
    <div className="p-5 flex flex-col gap-5 select-none overflow-y-auto">
      <div>
        <h3 className="text-base font-bold font-display text-white">Canvas Aspect Ratio</h3>
        <p className="text-xs text-slate-400 mt-1">Export in optimal sizes for social media and web.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {RATIOS.map((r) => {
          const Icon = r.icon;
          const isActive = aspectRatio === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRatio(r.id)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-center ${
                isActive
                  ? 'border-brand-500 bg-brand-500/10 text-white shadow-glow'
                  : 'border-studio-border bg-studio-800 text-slate-400 hover:bg-studio-700 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 text-brand-500 mb-1" />
              <span className="text-xs font-bold">{r.title}</span>
              <span className="text-[10px] text-slate-400">
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
