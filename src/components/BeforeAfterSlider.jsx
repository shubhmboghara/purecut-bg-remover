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
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPos(pct);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
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
        style={{ left: `${splitPos}%` }}
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize pointer-events-auto shadow-[0_0_10px_rgba(0,0,0,0.6)] flex items-center justify-center -translate-x-1/2"
      >
        <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center text-xs">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
