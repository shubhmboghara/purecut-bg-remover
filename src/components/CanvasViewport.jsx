import React, { useRef, useEffect, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ArrowLeftRight,
  Wand2,
  Sparkles,
  Command,
  Rotate3D
} from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import ThreeSpatialStage from './ThreeSpatialStage';

export default function CanvasViewport({
  originalImageSrc,
  originalDims,
  activeTab,
  activeTool = 'erase',
  brush,
  wand,
  lasso,
  transform,
  shadow,
  onChangeTransform,
  onBrushStroke,
  onMagicWand,
  onLassoCut,
  onPushHistory,
  canvasRefs,
  isProcessing,
  processingStatus,
  processingPct
}) {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [compareActive, setCompareActive] = useState(false);
  const [threeSpatialActive, setThreeSpatialActive] = useState(false);
  const [inspectBackdrop, setInspectBackdrop] = useState('checkerboard'); // 'checkerboard' | 'white' | 'black' | 'green'
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const isPainting = useRef(false);
  const lastPaintPos = useRef(null);

  // Viewport panning state (Space + Drag or Middle Mouse)
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Lasso state
  const isLassoing = useRef(false);
  const lassoPoints = useRef([]);

  // Auto fit on load or resize
  useEffect(() => {
    const handleFit = () => {
      if (!containerRef.current || !canvasRefs.main.current) return;
      const c = containerRef.current;
      const cw = canvasRefs.main.current.width || 800;
      const ch = canvasRefs.main.current.height || 600;

      const availW = c.clientWidth - 80;
      const availH = c.clientHeight - 80;

      const fitZoom = Math.min(availW / cw, availH / ch, 1.0);
      setZoom(fitZoom);
      setPan({ x: 0, y: 0 });
    };

    handleFit();
    window.addEventListener('resize', handleFit);
    return () => window.removeEventListener('resize', handleFit);
  }, [canvasRefs.main, originalDims]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isPanning.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Smooth mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom((z) => Math.max(0.15, Math.min(4.0, Number((z * zoomFactor).toFixed(3)))));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Pointer interactions
  const handlePointerDown = (e) => {
    if (!canvasRefs.main.current) return;

    // Viewport pan via Spacebar or Middle Mouse click
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }

    const rect = canvasRefs.main.current.getBoundingClientRect();
    const scale = rect.width / canvasRefs.main.current.width;
    const canvasX = (e.clientX - rect.left) / scale;
    const canvasY = (e.clientY - rect.top) / scale;

    if (activeTab === 'retouch') {
      if (activeTool === 'wand') {
        if (onMagicWand) onMagicWand(canvasX, canvasY);
        return;
      }

      if (activeTool === 'lasso') {
        isLassoing.current = true;
        lassoPoints.current = [{ x: canvasX, y: canvasY }];
        return;
      }

      // Default brush mode: erase or restore
      isPainting.current = true;
      lastPaintPos.current = { x: canvasX, y: canvasY };
      onBrushStroke(canvasX, canvasY);
    } else {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x || 0,
        ty: transform.y || 0
      };
    }
  };


  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!canvasRefs.main.current || !canvasRefs.cursor.current) return;
      const rect = canvasRefs.main.current.getBoundingClientRect();
      const scale = rect.width / canvasRefs.main.current.width;
      const canvasX = (e.clientX - rect.left) / scale;
      const canvasY = (e.clientY - rect.top) / scale;

      const cursorCanvas = canvasRefs.cursor.current;
      const cursorCtx = cursorCanvas.getContext('2d');
      cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

      if (activeTab === 'retouch') {
        if (activeTool === 'wand') {
          cursorCtx.save();
          cursorCtx.strokeStyle = '#a855f7';
          cursorCtx.lineWidth = 1.5;

          // Crosshair lines
          cursorCtx.beginPath();
          cursorCtx.moveTo(canvasX - 10, canvasY);
          cursorCtx.lineTo(canvasX + 10, canvasY);
          cursorCtx.moveTo(canvasX, canvasY - 10);
          cursorCtx.lineTo(canvasX, canvasY + 10);
          cursorCtx.stroke();

          // Outer ring
          cursorCtx.beginPath();
          cursorCtx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
          cursorCtx.strokeStyle = '#ec4899';
          cursorCtx.stroke();
          cursorCtx.restore();
        } else if (activeTool === 'lasso') {
          if (isLassoing.current && lassoPoints.current.length > 0) {
            cursorCtx.save();
            cursorCtx.setLineDash([5, 5]);
            cursorCtx.strokeStyle = '#c084fc';
            cursorCtx.lineWidth = 2;
            cursorCtx.beginPath();
            cursorCtx.moveTo(lassoPoints.current[0].x, lassoPoints.current[0].y);
            for (let i = 1; i < lassoPoints.current.length; i++) {
              cursorCtx.lineTo(lassoPoints.current[i].x, lassoPoints.current[i].y);
            }
            cursorCtx.lineTo(canvasX, canvasY);
            cursorCtx.stroke();
            cursorCtx.restore();
          } else {
            cursorCtx.save();
            cursorCtx.strokeStyle = '#c084fc';
            cursorCtx.lineWidth = 1.5;
            cursorCtx.beginPath();
            cursorCtx.arc(canvasX, canvasY, 5, 0, Math.PI * 2);
            cursorCtx.stroke();
            cursorCtx.restore();
          }
        } else {
          // Brush mode (Erase or Restore)
          cursorCtx.beginPath();
          cursorCtx.arc(canvasX, canvasY, brush.size * (transform.scale || 1), 0, Math.PI * 2);
          cursorCtx.strokeStyle = activeTool === 'erase' ? '#ef4444' : '#10b981';
          cursorCtx.lineWidth = 2;
          cursorCtx.stroke();
        }
      }

      if (isPanning.current) {
        setPan({
          x: panStart.current.px + (e.clientX - panStart.current.x),
          y: panStart.current.py + (e.clientY - panStart.current.y)
        });
        return;
      }

      if (isPainting.current) {
        if (lastPaintPos.current) {
          const dx = canvasX - lastPaintPos.current.x;
          const dy = canvasY - lastPaintPos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const stepSize = Math.max(3, (brush.size * (transform.scale || 1)) / 4);

          if (dist > stepSize) {
            const steps = Math.min(60, Math.floor(dist / stepSize));
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              onBrushStroke(
                lastPaintPos.current.x + dx * t,
                lastPaintPos.current.y + dy * t
              );
            }
          } else {
            onBrushStroke(canvasX, canvasY);
          }
        } else {
          onBrushStroke(canvasX, canvasY);
        }
        lastPaintPos.current = { x: canvasX, y: canvasY };
      } else if (isLassoing.current) {
        lassoPoints.current.push({ x: canvasX, y: canvasY });
      } else if (isDragging.current) {
        const deltaX = (e.clientX - dragStart.current.x) / zoom;
        const deltaY = (e.clientY - dragStart.current.y) / zoom;
        onChangeTransform({
          ...transform,
          x: dragStart.current.tx + deltaX,
          y: dragStart.current.ty + deltaY
        });
      }
    };

    const handlePointerUp = () => {
      if (isPanning.current) {
        isPanning.current = false;
      }
      if (isPainting.current) {
        isPainting.current = false;
        lastPaintPos.current = null;
        onPushHistory();
      }

      if (isLassoing.current) {
        isLassoing.current = false;
        if (lassoPoints.current.length >= 3 && onLassoCut) {
          onLassoCut(lassoPoints.current);
        }
        lassoPoints.current = [];
        if (canvasRefs.cursor.current) {
          const cCtx = canvasRefs.cursor.current.getContext('2d');
          cCtx.clearRect(0, 0, canvasRefs.cursor.current.width, canvasRefs.cursor.current.height);
        }
      }
      if (isDragging.current) {
        isDragging.current = false;
        onPushHistory();
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [
    activeTab, 
    activeTool, 
    brush, 
    wand, 
    lasso, 
    transform, 
    zoom, 
    onChangeTransform, 
    onBrushStroke, 
    onMagicWand, 
    onLassoCut, 
    onPushHistory, 
    canvasRefs
  ]);

  return (
    <section 
      ref={containerRef} 
      className="flex-1 bg-studio-950 relative flex items-center justify-center overflow-hidden select-none"
    >
      {/* Subtle Studio Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-studio-900/40 via-studio-950 to-studio-950 pointer-events-none"></div>

      {/* AI Processing 3D Scanning Radar Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-studio-950/92 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6 select-none preserve-3d">
          <div className="relative w-32 h-32 mb-6 preserve-3d" style={{ transform: 'rotateX(25deg)' }}>
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-brand-500 border-r-accent-purple animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-cyan-400/50 animate-[spin-slow_4s_linear_infinite]"></div>
            <div className="animated-border-wrap w-20 h-20 rounded-2xl absolute inset-0 m-auto flex items-center justify-center p-0.5 shadow-glow">
              <div className="w-full h-full rounded-2xl flex items-center justify-center" style={{ background: 'oklch(0.09 0.025 260)' }}>
                <Wand2 className="w-8 h-8 text-brand-300 animate-pulse drop-shadow-[0_0_8px_oklch(0.65_0.28_278)]" />
              </div>
            </div>
          </div>
          <h3 className="font-display font-black text-2xl md:text-3xl text-white mb-2 text-balance tracking-tight">
            <span className="hero-gradient-text">Segmenting Spatial Cutout...</span>
          </h3>
          <p className="text-xs text-slate-300 mb-6 max-w-sm text-pretty font-medium">
            {processingStatus}
          </p>
          <div 
            className="w-80 h-3 rounded-full overflow-hidden mb-2 p-0.5 shadow-inner"
            style={{
              background: 'oklch(0.07 0.02 260)',
              border: '1px solid color-mix(in oklch, white 12%, transparent)'
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-accent-purple to-accent-cyan rounded-full transition-all duration-300 relative shadow-glow"
              style={{ width: `${processingPct}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[pulse_1s_infinite]"></div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold tracking-widest stat-glow" style={{ color: 'oklch(0.80 0.16 275)' }}>
            {processingPct}% PROCESSED
          </span>
        </div>
      )}

      {/* Edge Halo Quality Inspector Floating Bar */}
      <div 
        className="absolute top-5 right-5 z-35 flex items-center gap-1.5 p-1.5 rounded-2xl shadow-xl backdrop-blur-2xl"
        style={{
          background: 'color-mix(in oklch, oklch(0.09 0.025 260) 88%, transparent)',
          border: '1px solid color-mix(in oklch, white 12%, transparent)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        }}
      >
        <span className="text-[11px] font-bold text-slate-300 px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'oklch(0.80 0.16 275)' }} />
          <span>Edge Check:</span>
        </span>
        <button
          onClick={() => setInspectBackdrop('checkerboard')}
          className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition ${
            inspectBackdrop === 'checkerboard'
              ? 'ring-2 ring-brand-400 scale-105 shadow-glow'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          }`}
          style={{ border: '1px solid color-mix(in oklch, white 20%, transparent)' }}
          title="Transparent Checkerboard"
        >
          <span className="w-4 h-4 rounded-sm checkerboard-bg inline-block"></span>
        </button>
        <button
          onClick={() => setInspectBackdrop('white')}
          className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition ${
            inspectBackdrop === 'white'
              ? 'ring-2 ring-brand-400 scale-105 shadow-glow'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          }`}
          style={{ border: '1px solid color-mix(in oklch, white 20%, transparent)' }}
          title="Pure White #FFFFFF (Inspect for dark halos)"
        >
          <span className="w-4 h-4 rounded-sm bg-white inline-block"></span>
        </button>
        <button
          onClick={() => setInspectBackdrop('black')}
          className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition ${
            inspectBackdrop === 'black'
              ? 'ring-2 ring-brand-400 scale-105 shadow-glow'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          }`}
          style={{ border: '1px solid color-mix(in oklch, white 20%, transparent)' }}
          title="Pitch Black #000000 (Inspect for white outlines)"
        >
          <span className="w-4 h-4 rounded-sm bg-black inline-block"></span>
        </button>
        <button
          onClick={() => setInspectBackdrop('green')}
          className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition ${
            inspectBackdrop === 'green'
              ? 'ring-2 ring-brand-400 scale-105 shadow-glow'
              : 'opacity-70 hover:opacity-100 hover:scale-105'
          }`}
          style={{ border: '1px solid color-mix(in oklch, white 20%, transparent)' }}
          title="Chroma Green #00FF00 (Chroma key edge inspection)"
        >
          <span className="w-4 h-4 rounded-sm bg-[#00ff00] inline-block"></span>
        </button>
      </div>

      {/* 3D Spatial Canvas Viewport Frame */}
      <div
        ref={wrapperRef}
        onMouseDown={handlePointerDown}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          cursor: isSpacePressed 
            ? (isPanning.current ? 'grabbing' : 'grab')
            : (activeTab === 'retouch' 
              ? (activeTool === 'wand' || activeTool === 'lasso' ? 'crosshair' : 'crosshair') 
              : 'grab')
        }}
        className={`relative rounded-3xl overflow-hidden transition-all duration-150 origin-center border-2 border-white/10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] ${
          inspectBackdrop === 'white'
            ? 'bg-white'
            : inspectBackdrop === 'black'
            ? 'bg-black'
            : inspectBackdrop === 'green'
            ? 'bg-[#00ff00]'
            : 'checkerboard-bg'
        }`}
      >
        <canvas ref={canvasRefs.bg} className="absolute inset-0 z-10" />
        <canvas ref={canvasRefs.shadow} className="absolute inset-0 z-15" />
        <canvas ref={canvasRefs.main} className="relative z-20 block" />
        <canvas ref={canvasRefs.cursor} className="absolute inset-0 z-30 pointer-events-none" />

        <BeforeAfterSlider originalSrc={originalImageSrc} isActive={compareActive} />
      </div>

      {/* Three.js Real-Time 3D Spatial Stage Viewport Mode */}
      {threeSpatialActive && (
        <div className="absolute inset-0 z-40 bg-studio-950 flex flex-col">
          <ThreeSpatialStage
            mainCanvas={canvasRefs.main.current}
            bgCanvas={canvasRefs.bg.current}
            shadow={shadow}
            onClose={() => setThreeSpatialActive(false)}
          />
        </div>
      )}

      {/* 3D Floating Glass Pedestal Toolbar at Bottom */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full flex items-center gap-3 text-xs shadow-2xl backdrop-blur-2xl"
        style={{
          background: 'color-mix(in oklch, oklch(0.09 0.025 260) 88%, transparent)',
          border: '1px solid color-mix(in oklch, white 14%, transparent)',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.18)'
        }}
      >
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition keycap-3d"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-white min-w-[42px] text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3.0, z + 0.15))}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition keycap-3d"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!containerRef.current || !canvasRefs.main.current) return;
              const c = containerRef.current;
              const cw = canvasRefs.main.current.width || 800;
              const ch = canvasRefs.main.current.height || 600;
              setZoom(Math.min((c.clientWidth - 80) / cw, (c.clientHeight - 80) / ch, 1.0));
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition ml-0.5 keycap-3d"
            title="Fit to Screen"
            aria-label="Fit canvas to screen"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ml-0.5 keycap-3d ${
              Math.abs(zoom - 1.0) < 0.05
                ? 'text-white shadow-glow'
                : 'text-slate-400 hover:text-white hover:bg-white/8'
            }`}
            style={
              Math.abs(zoom - 1.0) < 0.05
                ? {
                    background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.60 0.28 308))',
                    boxShadow: '0 2px 12px oklch(0.65 0.28 278 / 0.5)'
                  }
                : {}
            }
            title="100% 1:1 Pixel Scale (Native Resident Inspection)"
            aria-label="100% 1:1 pixel scale"
          >
            100%
          </button>
        </div>


        <div className="w-px h-5 bg-white/10"></div>

        {/* Before / After toggle (3D tactile button) */}
        <button
          onClick={() => setCompareActive(!compareActive)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold transition text-xs ${
            compareActive 
              ? 'text-white shadow-glow btn-3d' 
              : 'text-slate-300 hover:text-white hover:bg-white/8 keycap-3d'
          }`}
          style={
            compareActive
              ? {
                  background: 'linear-gradient(135deg, oklch(0.55 0.28 278), oklch(0.60 0.28 308))',
                  boxShadow: '0 2px 14px oklch(0.65 0.28 278 / 0.5)'
                }
              : {}
          }
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Before / After</span>
        </button>

        <div className="w-px h-5 bg-white/10"></div>

        {/* Three.js 3D WebGL Orbit Mode button */}
        <button
          onClick={() => setThreeSpatialActive(!threeSpatialActive)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold transition text-xs ${
            threeSpatialActive 
              ? 'text-white shadow-glow btn-3d' 
              : 'text-slate-300 hover:text-white hover:bg-white/8 keycap-3d'
          }`}
          style={
            threeSpatialActive
              ? {
                  background: 'linear-gradient(135deg, oklch(0.60 0.25 195), oklch(0.55 0.28 278), oklch(0.60 0.28 308))',
                  boxShadow: '0 2px 14px oklch(0.82 0.18 195 / 0.5)'
                }
              : {}
          }
          title="Inspect Cutout in Three.js WebGL 3D Spatial Space"
        >
          <Rotate3D className="w-3.5 h-3.5" style={{ color: 'oklch(0.82 0.18 195)' }} />
          <span>3D WebGL Orbit</span>
        </button>

        <div className="w-px h-5 bg-white/10 hidden sm:block"></div>

        {/* Quick shortcut indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <span 
            className="px-2 py-0.5 rounded-md text-slate-300 font-bold"
            style={{
              background: 'oklch(0.07 0.02 260)',
              border: '1px solid color-mix(in oklch, white 10%, transparent)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            Space + Drag
          </span>
          <span>to Pan</span>
        </div>
      </div>

    </section>
  );
}
