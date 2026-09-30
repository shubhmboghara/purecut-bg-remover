import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

export default function BeforeAfterSlider({ originalSrc, isActive }) {
  const [splitPos, setSplitPos] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPos(pct);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Original Image clipped to left split */}
      <img
        src={originalSrc}
        alt="Original Reference"
        className="w-full h-full object-cover absolute inset-0"
        style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
      />

      {/* Draggable Divider Handle */}
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ left: `${splitPos}%` }}
        className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-brand-400 via-white to-brand-400 cursor-ew-resize pointer-events-auto shadow-[0_0_14px_rgba(59,130,246,0.9)] flex items-center justify-center -translate-x-1/2"
      >
        {/* Floating before / after dimensional badges */}
        <div className="absolute top-5 -translate-x-12 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/20 text-[10px] font-extrabold tracking-wider text-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.6)] pointer-events-none select-none">
          BEFORE
        </div>
        <div className="absolute top-5 translate-x-12 px-2.5 py-1 rounded-full bg-brand-600/85 backdrop-blur-md border border-brand-300/40 text-[10px] font-extrabold tracking-wider text-white shadow-[0_4px_10px_rgba(59,130,246,0.4)] pointer-events-none select-none">
          AFTER
        </div>

        {/* 3D Tactile Orb Disc */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white to-slate-200 text-slate-900 shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,1)] border border-white flex items-center justify-center text-xs active:scale-90 transition-transform">
          <ArrowLeftRight className="w-4 h-4 text-brand-600" />
        </div>
      </div>
    </div>
  );
}
