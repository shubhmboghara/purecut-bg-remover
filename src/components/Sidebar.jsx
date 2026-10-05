import { 
  Home,
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

export default function Sidebar({ activeTab, onSelectTab, onGoHome }) {

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
      className="w-20 navbar-glass border-r border-white/8 flex flex-col items-center py-4 gap-2.5 z-30 select-none shrink-0 shadow-2xl relative"
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
            className={`w-[66px] h-[64px] rounded-2xl flex flex-col items-center justify-center gap-1.5 px-1 transition-all duration-200 relative group keycap-3d ${
              isActive 
                ? 'text-white font-extrabold shadow-glow' 
                : 'text-slate-400 hover:text-white font-medium hover:bg-white/5'
            }`}
            style={
              isActive
                ? {
                    background: 'linear-gradient(135deg, oklch(0.55 0.28 278 / 0.35), oklch(0.60 0.28 308 / 0.25))',
                    border: '1px solid oklch(0.65 0.28 278 / 0.65)',
                    boxShadow: '0 4px 20px -2px oklch(0.65 0.28 278 / 0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                  }
                : {
                    background: 'oklch(0.09 0.025 260 / 0.7)',
                    border: '1px solid color-mix(in oklch, white 8%, transparent)'
                  }
            }
          >
            {/* Luminous Active Lateral Indicator */}
            {isActive && (
              <span 
                className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full"
                style={{
                  background: 'linear-gradient(180deg, oklch(0.65 0.28 278), oklch(0.72 0.28 308))',
                  boxShadow: '0 0 12px oklch(0.65 0.28 278)'
                }}
              ></span>
            )}
            <Icon 
              className="w-5 h-5 shrink-0 transition transform group-hover:scale-115 group-hover:rotate-3" 
              style={isActive ? { color: 'oklch(0.80 0.16 275)' } : {}}
            />
            <span className="text-[10px] leading-tight tracking-tight text-center truncate max-w-full font-bold">
              {tab.label}
            </span>
            <span 
              className="absolute top-1 right-1.5 text-[8px] font-mono opacity-0 group-hover:opacity-80 transition"
              style={{ color: 'oklch(0.80 0.16 275)' }}
            >
              {tab.shortcut}
            </span>
          </button>
        );
      })}

      {/* Return to Home Showcase */}
      <div className="mt-auto pt-2 border-t border-white/8 w-full flex justify-center">
        <button
          onClick={onGoHome}
          title="Return to Home Showcase (Upload, 3D Demo, Samples)"
          aria-label="Return to home page"
          className="w-[66px] h-[54px] rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white font-medium hover:bg-white/5 transition-all keycap-3d"
          style={{
            background: 'oklch(0.09 0.025 260 / 0.7)',
            border: '1px solid color-mix(in oklch, white 8%, transparent)'
          }}
        >
          <Home className="w-4 h-4 text-brand-400" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
      </div>
    </aside>
  );
}

