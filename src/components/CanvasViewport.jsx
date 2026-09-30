import React, { useRef, useEffect, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ArrowLeftRight,
  Wand2
} from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';

export default function CanvasViewport({
  originalImageSrc,
  originalDims,
  activeTab,
  activeTool = 'erase',
  brush,
  wand,
  lasso,
  transform,
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
  const [compareActive, setCompareActive] = useState(false);
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const isPainting = useRef(false);
  const lastPaintPos = useRef(null);

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
    };

    handleFit();
    window.addEventListener('resize', handleFit);
    return () => window.removeEventListener('resize', handleFit);
  }, [canvasRefs.main, originalDims]);

  // Pointer interactions
  const handlePointerDown = (e) => {
    if (!canvasRefs.main.current) return;
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
          // Render Magic Wand targeting crosshair with sparkles
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

          // Outer targeting ring
          cursorCtx.beginPath();
          cursorCtx.arc(canvasX, canvasY, 6, 0, Math.PI * 2);
          cursorCtx.strokeStyle = '#ec4899';
          cursorCtx.stroke();
          cursorCtx.restore();
        } else if (activeTool === 'lasso') {
          // Render lasso cursor / live trace
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
            // Idle lasso cursor
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
    <section ref={containerRef} className="flex-1 bg-studio-950 relative flex items-center justify-center overflow-hidden select-none">
      
      {/* AI Processing Screen */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-studio-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
          <div className="relative w-20 h-20 mb-6">
            <div className="w-full h-full rounded-full border-4 border-transparent border-t-brand-500 border-r-purple-500 animate-spin"></div>
            <Wand2 className="w-8 h-8 text-white absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-xl text-white mb-2">Removing Background with AI...</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-xs">{processingStatus}</p>
          <div className="w-64 h-2 bg-studio-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${processingPct}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-brand-500">{processingPct}%</span>
        </div>
      )}

      {/* Canvas Viewport Wrapper */}
      <div
        ref={wrapperRef}
        onMouseDown={handlePointerDown}
        style={{
          transform: `scale(${zoom})`,
          cursor: activeTab === 'retouch' 
            ? (activeTool === 'wand' || activeTool === 'lasso' ? 'crosshair' : 'crosshair') 
            : 'grab'
        }}
        className="relative shadow-studio rounded-lg overflow-hidden checkerboard-bg transition-transform duration-75 origin-center"
      >
        <canvas ref={canvasRefs.bg} className="absolute inset-0 z-10" />
        <canvas ref={canvasRefs.shadow} className="absolute inset-0 z-15" />
        <canvas ref={canvasRefs.main} className="relative z-20 block" />
        <canvas ref={canvasRefs.cursor} className="absolute inset-0 z-30 pointer-events-none" />

        <BeforeAfterSlider originalSrc={originalImageSrc} isActive={compareActive} />
      </div>

      {/* Floating Toolbar at Bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-studio-900/90 backdrop-blur-lg border border-studio-border shadow-studio flex items-center gap-3 text-xs">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-studio-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-slate-300 min-w-[38px] text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3.0, z + 0.15))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-studio-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (!containerRef.current || !canvasRefs.main.current) return;
              const c = containerRef.current;
              const cw = canvasRefs.main.current.width || 800;
              const ch = canvasRefs.main.current.height || 600;
              setZoom(Math.min((c.clientWidth - 80) / cw, (c.clientHeight - 80) / ch, 1.0));
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-studio-800 transition ml-1"
            title="Fit to Screen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-studio-border"></div>

        {/* Before / After toggle */}
        <button
          onClick={() => setCompareActive(!compareActive)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition ${
            compareActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:text-white hover:bg-studio-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Before / After</span>
        </button>
      </div>

    </section>
  );
}
