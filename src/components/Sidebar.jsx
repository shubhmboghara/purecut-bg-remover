import React from 'react';
import { 
  Image as ImageIcon, 
  Wand2, 
  Move, 
  SunMedium, 
  Sliders, 
  Crop 
} from 'lucide-react';

const TABS = [
  { id: 'background', label: 'Background', icon: ImageIcon },
  { id: 'retouch', label: 'Cutout & Fix', icon: Wand2 },
  { id: 'transform', label: 'Transform', icon: Move },
  { id: 'shadow', label: 'Shadows', icon: SunMedium },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'canvas', label: 'Canvas', icon: Crop }
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-20 bg-studio-900 border-r border-studio-border flex flex-col items-center py-3 gap-2.5 z-30 select-none shrink-0">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            title={tab.label}
            aria-label={tab.label}
            className={`w-[68px] h-[60px] rounded-xl flex flex-col items-center justify-center gap-1.5 px-1 transition-all ${
              isActive 
                ? 'bg-brand-500/15 border border-brand-500 text-brand-500 font-semibold shadow-sm' 
                : 'border border-transparent text-slate-400 hover:bg-studio-800 hover:text-slate-200 font-medium'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10.5px] leading-tight tracking-tight text-center truncate max-w-full">
              {tab.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
