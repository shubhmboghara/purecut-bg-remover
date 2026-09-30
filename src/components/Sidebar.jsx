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
      className="w-20 bg-studio-900/90 backdrop-blur-xl border-r border-studio-border flex flex-col items-center py-3 gap-2 z-30 select-none shrink-0"
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
            className={`w-[70px] h-[62px] rounded-2xl flex flex-col items-center justify-center gap-1.5 px-1 transition-all duration-200 relative group ${
              isActive 
                ? 'bg-gradient-to-b from-brand-500/20 to-accent-purple/10 border border-brand-500/80 text-brand-400 font-bold shadow-glow' 
                : 'border border-transparent text-slate-400 hover:bg-studio-800/80 hover:text-slate-200 font-medium'
            }`}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-purple shadow-glow"></span>
            )}
            <Icon className="w-5 h-5 shrink-0 transition transform group-hover:scale-110" />
            <span className="text-[10px] leading-tight tracking-tight text-center truncate max-w-full">
              {tab.label}
            </span>
            <span className="absolute top-1 right-1.5 text-[8px] font-mono opacity-0 group-hover:opacity-60 transition text-slate-400">
              {tab.shortcut}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
