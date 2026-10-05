import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import Navbar from './components/Navbar';

import Sidebar from './components/Sidebar';
import UploadStage from './components/UploadStage';
import CanvasViewport from './components/CanvasViewport';
import ExportModal from './components/ExportModal';
import BatchStudio from './components/BatchStudio';
import AiEngineModal from './components/AiEngineModal';

// Panels
import BackgroundPanel from './components/panels/BackgroundPanel';
import RetouchPanel from './components/panels/RetouchPanel';
import TransformPanel from './components/panels/TransformPanel';
import ShadowPanel from './components/panels/ShadowPanel';
import AdjustPanel from './components/panels/AdjustPanel';
import CanvasSizePanel from './components/panels/CanvasSizePanel';

// Services & Utilities
import { transitionView } from './utils/viewTransition';
import { removeBackgroundAI } from './services/backgroundRemoval';
import { renderCompositeCanvas } from './utils/canvasRenderer';

import { createBatchItem } from './services/batchProcessor';
import { getAiConfig } from './services/aiConfig';
import {
  applyMagicWand,
  applyLassoCut,
  applyEdgeChoke,
  applyPurgeFloorShadows,
  applyCleanStrayIslands,
  applyAlphaThreshold,
  applyInvertMask,
  applyColorDespill,
  apply100PercentAutoPerfect
} from './services/smartMaskTools';

export default function App() {
  // App Mode ('single' | 'batch')
  const [appMode, setAppMode] = useState('single');
  const [batchItems, setBatchItems] = useState([]);

  // Image & Canvas state
  const [originalSrc, setOriginalSrc] = useState(null);
  const [originalDims, setOriginalDims] = useState(null);
  const originalImageRef = useRef(null);
  const cutoutImageRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const brushPatchCanvasRef = useRef(null);

  // Active Tool Tab
  const [activeTab, setActiveTab] = useState('background');

  // Background Settings
  const [background, setBackground] = useState({
    type: 'transparent',
    color: '#ffffff',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    photoUrl: null,
    blurRadius: 16,
    customImage: null,
    customPreviewUrl: null
  });

  // Transform Settings
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1.0,
    rotation: 0,
    flipH: 1,
    flipV: 1
  });

  // Shadow Settings
  const [shadow, setShadow] = useState({
    enabled: false,
    blur: 25,
    opacity: 0.45,
    offsetY: 20,
    offsetX: 0,
    color: '#000000'
  });

  // Filter Adjustments
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    warmth: 0
  });

  // Retouch & Mask Cutout Tools
  const [activeRetouchTool, setActiveRetouchTool] = useState('wand');
  const [brush, setBrush] = useState({
    mode: 'erase',
    size: 32,
    feather: 30
  });
  const [wand, setWand] = useState({
    tolerance: 28,
    contiguous: true
  });
  const [lasso, setLasso] = useState({
    feather: 1
  });
  const [refine, setRefine] = useState({
    threshold: 50,
    choke: 0,
    feather: 1
  });
  const baseAiMaskCanvasRef = useRef(null);

  // Aspect Ratio
  const [aspectRatio, setAspectRatio] = useState('original');

  // AI Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingPct, setProcessingPct] = useState(0);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  // AI Engine Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState(getAiConfig());

  useEffect(() => {
    const handleConfigChange = (e) => {
      if (e.detail) setAiConfig(e.detail);
    };
    window.addEventListener('purecut_ai_config_updated', handleConfigChange);
    return () => window.removeEventListener('purecut_ai_config_updated', handleConfigChange);
  }, []);

  // Undo / Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: '', isError: false });
  const toastTimeoutRef = useRef(null);

  // Canvas Refs
  const canvasRefs = {
    bg: useRef(null),
    shadow: useRef(null),
    main: useRef(null),
    cursor: useRef(null)
  };

  const showToast = useCallback((message, isError = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ visible: true, message, isError });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ visible: false, message: '', isError: false });
    }, 3200);
  }, []);

  // Update canvas internal sizes according to aspect ratio
  const updateCanvasDimensions = useCallback(() => {
    if (!originalDims) return;
    let targetW = originalDims.width;
    let targetH = originalDims.height;

    const maxDimension = Math.max(originalDims.width, originalDims.height);

    if (aspectRatio === '1:1') {
      targetW = maxDimension;
      targetH = maxDimension;
    } else if (aspectRatio === '4:5') {
      targetH = maxDimension;
      targetW = Math.round((targetH * 4) / 5);
    } else if (aspectRatio === '9:16') {
      targetH = maxDimension;
      targetW = Math.round((targetH * 9) / 16);
    } else if (aspectRatio === '16:9') {
      targetW = maxDimension;
      targetH = Math.round((targetW * 9) / 16);
    } else {
      // 'original' preserves 100% exact native image dimensions
      targetW = originalDims.width;
      targetH = originalDims.height;
    }

    Object.values(canvasRefs).forEach((ref) => {
      if (ref.current) {
        ref.current.width = targetW;
        ref.current.height = targetH;
      }
    });
  }, [originalDims, aspectRatio]);

  // Main Render Loop Trigger
  const renderAll = useCallback(() => {
    renderCompositeCanvas({
      bgCanvas: canvasRefs.bg.current,
      shadowCanvas: canvasRefs.shadow.current,
      mainCanvas: canvasRefs.main.current,
      originalImage: originalImageRef.current,
      maskCanvas: maskCanvasRef.current,
      background,
      transform,
      shadow,
      filters
    });
  }, [background, transform, shadow, filters]);

  useEffect(() => {
    updateCanvasDimensions();
    renderAll();
  }, [updateCanvasDimensions, renderAll]);

  // Handle uploaded or sample image
  const handleSelectImage = async (imgSrc) => {
    setOriginalSrc(imgSrc);
    setIsProcessing(true);
    setProcessingStatus('Analyzing photo and initializing AI...');
    setProcessingPct(20);

    const onImageLoaded = async (img) => {
      originalImageRef.current = img;
      const dims = { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
      setOriginalDims(dims);

      try {
        const cutout = await removeBackgroundAI(imgSrc, (status, pct) => {
          console.log('[AI Progress]', pct + '%', status);
          setProcessingStatus(status);
          setProcessingPct(pct);
        });

        console.log('[AI Completed Cutout]', cutout.width, 'x', cutout.height);
        cutoutImageRef.current = cutout;

        // Initialize alpha mask canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = dims.width;
        maskCanvas.height = dims.height;
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.drawImage(cutout, 0, 0);
        maskCanvasRef.current = maskCanvas;

        // Clone pristine base AI mask canvas for non-destructive sensitivity & threshold tuning
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = dims.width;
        baseCanvas.height = dims.height;
        baseCanvas.getContext('2d').drawImage(cutout, 0, 0);
        baseAiMaskCanvasRef.current = baseCanvas;
        setRefine({ threshold: 50, choke: 0, feather: 1 });

        // Reset transforms
        setTransform({ x: 0, y: 0, scale: 1.0, rotation: 0, flipH: 1, flipV: 1 });

        // Push initial history snapshot
        const initialSnap = {
          maskData: maskCtx.getImageData(0, 0, dims.width, dims.height),
          transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: 1, flipV: 1 }
        };
        setHistory([initialSnap]);
        setHistoryIndex(0);

        setIsProcessing(false);
        showToast('Background removed successfully!');
      } catch (err) {
        console.error('[AI Error]', err);
        setIsProcessing(false);
        showToast('Failed to remove background: ' + err.message, true);
      }
    };

    let called = false;
    const triggerLoad = () => {
      if (called) return;
      called = true;
      onImageLoaded(img);
    };

    const img = new Image();
    const isExternal = typeof imgSrc === 'string' &&
      (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) &&
      typeof window !== 'undefined' && !imgSrc.includes(window.location.host);

    if (isExternal) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = triggerLoad;
    img.onerror = () => {
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = () => onImageLoaded(retry);
        retry.onerror = () => {
          setIsProcessing(false);
          showToast('Could not load image file', true);
        };
        retry.src = imgSrc;
        return;
      }
      setIsProcessing(false);
      showToast('Could not load image file', true);
    };
    img.src = imgSrc;

    if (img.complete && img.naturalWidth > 0) {
      triggerLoad();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__purecutSelectImage = handleSelectImage;
    }
  }, [handleSelectImage]);

  // Global Window Drag-and-Drop state
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);

  const dragCounter = useRef(0);

  // Global Clipboard Image Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (evt) => {
              handleSelectImage(evt.target.result);
              showToast('✨ Loaded photo from clipboard!');
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showToast]);

  // Global Window Drag & Drop Protection & Upload
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDragOver(true);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) {
        setIsWindowDragOver(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsWindowDragOver(false);

      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        f.type && f.type.startsWith('image/')
      );
      if (files.length === 0) return;

      if (files.length === 1) {
        const reader = new FileReader();
        reader.onload = (evt) => handleSelectImage(evt.target.result);
        reader.readAsDataURL(files[0]);
      } else {
        handleSelectBatch(files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Batch processing handlers
  const handleSelectBatch = (files) => {
    const newItems = files.map((file, idx) => createBatchItem(file, idx));
    setBatchItems((prev) => [...prev, ...newItems]);
    setAppMode('batch');
    showToast(`Queued ${newItems.length} images for batch processing!`);
  };


  const handleAddBatchFiles = (newFiles) => {
    const newItems = newFiles.map((file, idx) =>
      createBatchItem(file, batchItems.length + idx)
    );
    setBatchItems((prev) => [...prev, ...newItems]);
    showToast(`Added ${newItems.length} images to batch queue`);
  };

  const handleClearBatchAll = () => {
    setBatchItems([]);
    showToast('Batch queue cleared');
  };

  // Return to Home Showcase (Landing Showcase Page)
  const handleGoHome = useCallback(() => {
    transitionView(() => {
      setOriginalSrc(null);
      setOriginalDims(null);
      setAppMode('single');
    });
    showToast('Returned to Home Showcase');
  }, [showToast]);

  const handleOpenInSingleStudio = (batchItem) => {

    if (!batchItem) return;
    const originalUrl = URL.createObjectURL(batchItem.file);
    setOriginalSrc(originalUrl);
    setAppMode('single');

    if (batchItem.status === 'completed' && batchItem.resultBlob) {
      // Instant load from pre-computed cutout blob! Zero waiting!
      const origImg = new Image();
      origImg.crossOrigin = 'anonymous';
      origImg.onload = () => {
        originalImageRef.current = origImg;
        const dims = {
          width: origImg.naturalWidth || origImg.width,
          height: origImg.naturalHeight || origImg.height
        };
        setOriginalDims(dims);

        const cutImg = new Image();
        cutImg.onload = () => {
          cutoutImageRef.current = cutImg;
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = dims.width;
          maskCanvas.height = dims.height;
          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.drawImage(cutImg, 0, 0);
          maskCanvasRef.current = maskCanvas;

          const baseCanvas = document.createElement('canvas');
          baseCanvas.width = dims.width;
          baseCanvas.height = dims.height;
          baseCanvas.getContext('2d').drawImage(cutImg, 0, 0);
          baseAiMaskCanvasRef.current = baseCanvas;
          setRefine({ threshold: 50, choke: 0, feather: 1 });

          setTransform({ x: 0, y: 0, scale: 1.0, rotation: 0, flipH: 1, flipV: 1 });
          const initialSnap = {
            maskData: maskCtx.getImageData(0, 0, dims.width, dims.height),
            transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: 1, flipV: 1 }
          };
          setHistory([initialSnap]);
          setHistoryIndex(0);
          showToast(`Opened "${batchItem.name}" in Single Studio Editor`);
        };
        cutImg.src = URL.createObjectURL(batchItem.resultBlob);
      };
      origImg.src = originalUrl;
    } else {
      // Process fresh in single studio flow
      handleSelectImage(originalUrl);
    }
  };

  // Push to Undo/Redo history
  const pushHistory = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d');
    const w = maskCanvasRef.current.width;
    const h = maskCanvasRef.current.height;

    const snapshot = {
      maskData: maskCtx.getImageData(0, 0, w, h),
      transform: { ...transform }
    };

    setHistory((prev) => {
      const pruned = prev.slice(0, historyIndex + 1);
      return [...pruned, snapshot].slice(-25);
    });
    setHistoryIndex((prev) => prev + 1);
  }, [transform, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const snap = history[newIdx];
      if (snap && maskCanvasRef.current) {
        const maskCtx = maskCanvasRef.current.getContext('2d');
        maskCtx.putImageData(snap.maskData, 0, 0);
        setTransform({ ...snap.transform });
        setHistoryIndex(newIdx);
        renderAll();
      }
    }
  }, [historyIndex, history, renderAll]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const snap = history[newIdx];
      if (snap && maskCanvasRef.current) {
        const maskCtx = maskCanvasRef.current.getContext('2d');
        maskCtx.putImageData(snap.maskData, 0, 0);
        setTransform({ ...snap.transform });
        setHistoryIndex(newIdx);
        renderAll();
      }
    }
  }, [historyIndex, history, renderAll]);


  // Coordinate transform from viewport canvas to subject local space
  const canvasToSubjectLocal = useCallback((canvasX, canvasY) => {
    if (!maskCanvasRef.current || !canvasRefs.main.current) return { x: 0, y: 0 };
    const maskCanvas = maskCanvasRef.current;
    const canvasW = canvasRefs.main.current.width;
    const canvasH = canvasRefs.main.current.height;

    const centerX = canvasW / 2 + transform.x;
    const centerY = canvasH / 2 + transform.y;
    const dx = canvasX - centerX;
    const dy = canvasY - centerY;

    const angle = -((transform.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rx = (dx * cos - dy * sin) / ((transform.scale || 1) * (transform.flipH || 1));
    const ry = (dx * sin + dy * cos) / ((transform.scale || 1) * (transform.flipV || 1));

    return {
      x: rx + maskCanvas.width / 2,
      y: ry + maskCanvas.height / 2
    };
  }, [transform, canvasRefs]);

  // Manual brush stroke handler (Erase & Restore)
  const handleBrushStroke = (canvasX, canvasY) => {
    if (!maskCanvasRef.current || !originalImageRef.current || !canvasRefs.main.current) return;
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');

    const local = canvasToSubjectLocal(canvasX, canvasY);
    const localX = local.x;
    const localY = local.y;
    const radius = brush.size;

    maskCtx.save();
    if (activeRetouchTool === 'erase' || (activeRetouchTool !== 'restore' && brush.mode === 'erase')) {
      maskCtx.globalCompositeOperation = 'destination-out';
      const grad = maskCtx.createRadialGradient(localX, localY, 0, localX, localY, radius);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(Math.max(0, 1 - brush.feather / 100), 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      maskCtx.fillStyle = grad;
      maskCtx.beginPath();
      maskCtx.arc(localX, localY, radius, 0, Math.PI * 2);
      maskCtx.fill();
    } else {
      maskCtx.globalCompositeOperation = 'source-over';
      if (brush.feather > 0) {
        if (!brushPatchCanvasRef.current) {
          brushPatchCanvasRef.current = document.createElement('canvas');
        }
        const patchCanvas = brushPatchCanvasRef.current;
        const patchDiameter = Math.ceil(radius * 2);
        patchCanvas.width = patchDiameter;
        patchCanvas.height = patchDiameter;
        const pCtx = patchCanvas.getContext('2d');

        pCtx.clearRect(0, 0, patchDiameter, patchDiameter);
        const grad = pCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(Math.max(0, 1 - brush.feather / 100), 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        pCtx.fillStyle = grad;
        pCtx.beginPath();
        pCtx.arc(radius, radius, radius, 0, Math.PI * 2);
        pCtx.fill();

        pCtx.globalCompositeOperation = 'source-in';
        pCtx.drawImage(
          originalImageRef.current,
          localX - radius, localY - radius, patchDiameter, patchDiameter,
          0, 0, patchDiameter, patchDiameter
        );

        maskCtx.drawImage(patchCanvas, localX - radius, localY - radius);
      } else {
        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.arc(localX, localY, radius, 0, Math.PI * 2);
        maskCtx.clip();
        maskCtx.drawImage(originalImageRef.current, 0, 0);
        maskCtx.restore();
      }
    }
    maskCtx.restore();
    renderAll();
  };

  // Magic Wand Tool Handler
  const handleMagicWand = useCallback((canvasX, canvasY) => {
    if (!maskCanvasRef.current) return;
    const local = canvasToSubjectLocal(canvasX, canvasY);
    const modified = applyMagicWand(
      maskCanvasRef.current,
      originalImageRef.current,
      local.x,
      local.y,
      wand
    );
    if (modified) {
      pushHistory();
      renderAll();
      showToast('Purged background area with Magic Wand!');
    }
  }, [canvasToSubjectLocal, wand, pushHistory, renderAll, showToast]);

  // Lasso Cutout Tool Handler
  const handleLassoCut = useCallback((canvasPoints) => {
    if (!maskCanvasRef.current || !canvasPoints || canvasPoints.length < 3) return;
    const localPoints = canvasPoints.map(p => canvasToSubjectLocal(p.x, p.y));
    const modified = applyLassoCut(maskCanvasRef.current, localPoints, lasso.feather);
    if (modified) {
      pushHistory();
      renderAll();
      showToast('Cut out selected region with Lasso!');
    }
  }, [canvasToSubjectLocal, lasso, pushHistory, renderAll, showToast]);

  // Real-time AI Sensitivity & Edge Refinement
  const handleApplyRefine = useCallback((newRefine) => {
    if (!maskCanvasRef.current || !baseAiMaskCanvasRef.current) return;
    const w = maskCanvasRef.current.width;
    const h = maskCanvasRef.current.height;
    const ctx = maskCanvasRef.current.getContext('2d');

    // Restore from pristine base AI mask
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseAiMaskCanvasRef.current, 0, 0);

    // Apply sensitivity threshold
    if (newRefine.threshold !== 50) {
      applyAlphaThreshold(maskCanvasRef.current, baseAiMaskCanvasRef.current, newRefine.threshold, newRefine.feather);
    }

    // Apply edge choke
    if (newRefine.choke !== 0) {
      applyEdgeChoke(maskCanvasRef.current, newRefine.choke, newRefine.feather);
    }

    renderAll();
  }, [renderAll]);

  // 1-Click 100% Auto-Perfect Handler
  const handleAutoPerfect100 = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const modified = apply100PercentAutoPerfect(
      maskCanvasRef.current,
      originalImageRef.current,
      { cleanIslands: true, purgeShadows: true, despill: true, chokeHalos: true }
    );
    if (modified) {
      pushHistory();
      renderAll();
      showToast('✨ 100% Auto-Perfect applied: Halos defringed, specks purged & shadows cleaned!');
    } else {
      showToast('Cutout is already 100% crisp and clean!');
    }
  }, [pushHistory, renderAll, showToast]);

  // Neutralize Color Spill (Despill) Handler
  const handleColorDespill = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const modified = applyColorDespill(maskCanvasRef.current, originalImageRef.current, 0.85);
    if (modified) {
      pushHistory();
      renderAll();
      showToast('Color spill & background tint neutralized!');
    } else {
      showToast('No prominent edge color spill detected');
    }
  }, [pushHistory, renderAll, showToast]);

  // Auto Purge Floor & Contact Shadows
  const handlePurgeFloorShadows = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const modified = applyPurgeFloorShadows(maskCanvasRef.current, originalImageRef.current, 65);
    if (modified) {
      pushHistory();
      renderAll();
      showToast('Floor & road shadows purged successfully!');
    } else {
      showToast('No prominent ground shadows detected');
    }
  }, [pushHistory, renderAll, showToast]);

  // Auto Clean Stray Islands
  const handleCleanStrayIslands = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const modified = applyCleanStrayIslands(maskCanvasRef.current, 0.015);
    if (modified) {
      pushHistory();
      renderAll();
      showToast('Cleaned floating background specks & islands!');
    } else {
      showToast('Cutout is already clean of floating artifacts');
    }
  }, [pushHistory, renderAll, showToast]);

  // Auto Defringe Edges
  const handleDefringeEdges = useCallback(() => {
    if (!maskCanvasRef.current) return;
    applyEdgeChoke(maskCanvasRef.current, 1, 1);
    pushHistory();
    renderAll();
    showToast('Background halos and color fringe defringed!');
  }, [pushHistory, renderAll, showToast]);

  // Invert Cutout
  const handleInvertMask = useCallback(() => {
    if (!maskCanvasRef.current || !originalImageRef.current) return;
    applyInvertMask(maskCanvasRef.current, originalImageRef.current);
    pushHistory();
    renderAll();
    showToast('Inverted subject and background cutout!');
  }, [pushHistory, renderAll, showToast]);

  // Reset Mask to Pristine AI
  const handleResetMask = useCallback(() => {
    if (!maskCanvasRef.current || !baseAiMaskCanvasRef.current) return;
    const w = maskCanvasRef.current.width;
    const h = maskCanvasRef.current.height;
    const ctx = maskCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseAiMaskCanvasRef.current, 0, 0);

    setRefine({ threshold: 50, choke: 0, feather: 1 });
    pushHistory();
    renderAll();
    showToast('Reverted to pristine AI cutout');
  }, [pushHistory, renderAll, showToast]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+E, 1-6, [, ])
  const shortcutsRef = useRef({ handleUndo, handleRedo, originalSrc });
  useEffect(() => {
    shortcutsRef.current = { handleUndo, handleRedo, originalSrc };
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        shortcutsRef.current.handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        shortcutsRef.current.handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        if (shortcutsRef.current.originalSrc) {
          e.preventDefault();
          setIsExportOpen(true);
        }
      } else if (e.key === '[') {
        setBrush((b) => ({ ...b, size: Math.max(4, b.size - 4) }));
      } else if (e.key === ']') {
        setBrush((b) => ({ ...b, size: Math.min(120, b.size + 4) }));
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
        const tabMap = {
          '1': 'background',
          '2': 'retouch',
          '3': 'transform',
          '4': 'shadow',
          '5': 'adjust',
          '6': 'canvas'
        };
        if (tabMap[e.key]) setActiveTab(tabMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="w-screen h-dvh flex flex-col bg-studio-950 text-slate-100 overflow-hidden font-sans">
      {/* Skip Navigation Link — WCAG 2.4.1: keyboard users can bypass navbar */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navbar */}
      <Navbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onGoHome={handleGoHome}
        onReset={() => {
          setTransform({ x: 0, y: 0, scale: 1.0, rotation: 0, flipH: 1, flipV: 1 });
          setFilters({ brightness: 100, contrast: 100, saturation: 100, warmth: 0 });
          setShadow({ enabled: false, blur: 25, opacity: 0.45, offsetY: 20, offsetX: 0, color: '#000000' });
          setBackground({ type: 'transparent', color: '#ffffff', gradient: '', photoUrl: null, blurRadius: 16 });
          showToast('Reset all edits to default');
        }}
        onNewImage={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const f = e.target.files[0];
            if (f) {
              const r = new FileReader();
              r.onload = (evt) => handleSelectImage(evt.target.result);
              r.readAsDataURL(f);
            }
          };
          input.click();
        }}
        onExport={() => setIsExportOpen(true)}
        hasImage={!!originalSrc}
        appMode={appMode}
        onSwitchMode={setAppMode}
        batchCount={batchItems.length}
        batchCompletedCount={batchItems.filter((i) => i.status === 'completed').length}
        aiConfig={aiConfig}
        onOpenAiEngine={() => setIsAiModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main id="main-content" className="flex-1 flex overflow-hidden relative">
        {appMode === 'batch' ? (
          <BatchStudio
            batchItems={batchItems}
            onUpdateItems={setBatchItems}
            onClearAll={handleClearBatchAll}
            onAddFiles={handleAddBatchFiles}
            onOpenInSingleStudio={handleOpenInSingleStudio}
            onShowToast={showToast}
            onBackToStudio={handleGoHome}
            onGoHome={handleGoHome}
          />

        ) : !originalSrc ? (
          <UploadStage
            onSelectImage={handleSelectImage}
            onSelectBatch={handleSelectBatch}
          />
        ) : (
          <>
            {/* Leftmost Tool Strip */}
            <Sidebar 
              activeTab={activeTab} 
              onSelectTab={setActiveTab} 
              onGoHome={handleGoHome} 
            />


            {/* Sub-Panel Controls with Container Queries and Glassmorphism */}
            <aside 
              className="w-80 backdrop-blur-2xl border-r border-white/8 flex flex-col z-25 overflow-hidden panel-container"
              style={{
                background: 'color-mix(in oklch, oklch(0.09 0.025 260) 92%, transparent)',
                boxShadow: '4px 0 30px rgba(0, 0, 0, 0.7), inset -1px 0 0 rgba(255, 255, 255, 0.03)'
              }}
            >
              {activeTab === 'background' && (
                <BackgroundPanel background={background} onChangeBackground={setBackground} />
              )}
              {activeTab === 'retouch' && (
                <RetouchPanel
                  activeTool={activeRetouchTool}
                  onChangeTool={setActiveRetouchTool}
                  brush={brush}
                  onChangeBrush={setBrush}
                  wand={wand}
                  onChangeWand={setWand}
                  lasso={lasso}
                  onChangeLasso={setLasso}
                  refine={refine}
                  onChangeRefine={setRefine}
                  onApplyRefine={handleApplyRefine}
                  onAutoPerfect100={handleAutoPerfect100}
                  onColorDespill={handleColorDespill}
                  onPurgeFloorShadows={handlePurgeFloorShadows}
                  onCleanStrayIslands={handleCleanStrayIslands}
                  onDefringeEdges={handleDefringeEdges}
                  onInvertMask={handleInvertMask}
                  onResetMask={handleResetMask}
                />
              )}
              {activeTab === 'transform' && (
                <TransformPanel
                  transform={transform}
                  onChangeTransform={setTransform}
                  onCenter={() => {
                    setTransform((t) => ({ ...t, x: 0, y: 0 }));
                    pushHistory();
                  }}
                  onFit={() => {
                    if (!originalDims || !canvasRefs.main.current) return;
                    const scaleW = canvasRefs.main.current.width / originalDims.width;
                    const scaleH = canvasRefs.main.current.height / originalDims.height;
                    setTransform((t) => ({ ...t, scale: Math.min(scaleW, scaleH), x: 0, y: 0 }));
                    pushHistory();
                  }}
                />
              )}
              {activeTab === 'shadow' && (
                <ShadowPanel shadow={shadow} onChangeShadow={setShadow} />
              )}
              {activeTab === 'adjust' && (
                <AdjustPanel
                  filters={filters}
                  onChangeFilters={setFilters}
                  onResetFilters={() => {
                    setFilters({ brightness: 100, contrast: 100, saturation: 100, warmth: 0 });
                    showToast('Adjustments reset');
                  }}
                />
              )}
              {activeTab === 'canvas' && (
                <CanvasSizePanel
                  aspectRatio={aspectRatio}
                  onSelectRatio={setAspectRatio}
                  originalDimensions={originalDims}
                />
              )}
            </aside>

            {/* Center Canvas Viewport */}
            <CanvasViewport
              originalImageSrc={originalSrc}
              originalDims={originalDims}
              activeTab={activeTab}
              activeTool={activeRetouchTool}
              brush={brush}
              wand={wand}
              lasso={lasso}
              transform={transform}
              shadow={shadow}
              onChangeTransform={setTransform}
              onBrushStroke={handleBrushStroke}
              onMagicWand={handleMagicWand}
              onLassoCut={handleLassoCut}
              onPushHistory={pushHistory}
              canvasRefs={canvasRefs}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
              processingPct={processingPct}
            />
          </>
        )}
      </main>

      {/* AI Engine & Remove.bg Technology Modal */}
      <AiEngineModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaveSuccess={(newCfg) => {
          setAiConfig(newCfg);
          showToast(
            newCfg.engine === 'removebg'
              ? 'Active Engine: Official Remove.bg Cloud API'
              : 'Active Engine: In-Browser Neural AI (IS-Net / WASM)'
          );
        }}
      />

      {/* Export High-Resolution Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        bgCanvas={canvasRefs.bg.current}
        shadowCanvas={canvasRefs.shadow.current}
        mainCanvas={canvasRefs.main.current}
        onShowToast={showToast}
      />

      {/* Accessible Glassmorphic Toast Notification */}
      {toast.visible && (
        <div 
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl backdrop-blur-2xl text-white flex items-center gap-3 text-xs font-semibold shadow-2xl toast-notification select-text"
          style={{
            background: 'color-mix(in oklch, oklch(0.09 0.025 260) 94%, transparent)',
            border: '1px solid color-mix(in oklch, white 14%, transparent)',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          }}
        >
          <span 
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.isError 
                ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' 
                : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
            }`}
            aria-hidden="true"
          ></span>
          <span className="text-slate-100">{toast.message}</span>
          <button
            onClick={() => setToast({ visible: false, message: '', isError: false })}
            className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Drag-and-Drop Protective Overlay */}
      {isWindowDragOver && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8 backdrop-blur-md"
          style={{
            background: 'color-mix(in oklch, oklch(0.09 0.025 260) 85%, transparent)',
            border: '3px dashed oklch(0.65 0.28 278)'
          }}
        >
          <div 
            className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-studio-900/95 border border-white/20 shadow-2xl text-center"
            style={{
              boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 50px -15px oklch(0.65 0.28 278 / 0.5)'
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-300 flex items-center justify-center animate-bounce border border-brand-500/40">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">Drop Photo Here</h3>
            <p className="text-xs text-slate-300 max-w-xs">Release mouse to instantly load and segment in PureCut AI</p>
          </div>
        </div>
      )}
    </div>
  );
}


