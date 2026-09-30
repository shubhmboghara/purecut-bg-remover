import React from 'react';
import { 
  Image as ImageIcon, 
  Wand2, 
  Move, 
  SunMedium, 
  Sliders, 
  Crop 
} from 'lucide-react';
import { transitionView } from '../utils/viewTransition';

const TABS = [
  { id: 'background', label: 'Background', shortcut: '1', icon: ImageIcon },
  { id: 'retouch', label: 'Cutout & Fix', shortcut: '2', icon: Wand2 },
  { id: 'transform', label: 'Transform', shortcut: '3', icon: Move },
  { id: 'shadow', label: 'Shadows', shortcut: '4', icon: SunMedium },
  { id: 'adjust', label: 'Adjust', shortcut: '5', icon: Sliders },
  { id: 'canvas', label: 'Canvas', shortcut: '6', icon: Crop }
];

export default function Sidebar({ activeTab, onSelectTab }) {
  const handleTabClick = (tabId) => {
    if (tabId === activeTab) return;
    transitionView(() => {
      onSelectTab(tabId);
    });
  };

  return (
    <aside 
      role="tablist"
      aria-label="Studio Tools"
      className="w-20 bg-studio-900/90 backdrop-blur-2xl border-r border-studio-borderHighlight flex flex-col items-center py-4 gap-2.5 z-30 select-none shrink-0 shadow-lg"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabClick(tab.id)}
            title={`${tab.label} (Press ${tab.shortcut})`}
            aria-label={`${tab.label} tool tab`}
            className={`w-[68px] h-[64px] rounded-2xl flex flex-col items-center justify-center gap-1.5 px-1 transition-all duration-200 relative group keycap-3d ${
              isActive 
                ? 'bg-gradient-to-b from-brand-500/25 via-studio-800 to-accent-purple/20 border border-brand-500/80 text-brand-300 font-extrabold shadow-glow' 
                : 'bg-studio-950/60 border border-studio-border/60 text-slate-400 hover:bg-studio-850 hover:text-white font-medium'
            }`}
          >
            {/* Luminous Active Lateral Indicator */}
            {isActive && (
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-purple shadow-glow"></span>
            )}
            <Icon className="w-5 h-5 shrink-0 transition transform group-hover:scale-115 group-hover:rotate-3" />
            <span className="text-[10px] leading-tight tracking-tight text-center truncate max-w-full font-bold">
              {tab.label}
            </span>
            <span className="absolute top-1 right-1.5 text-[8px] font-mono opacity-0 group-hover:opacity-70 transition text-brand-300">
              {tab.shortcut}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
