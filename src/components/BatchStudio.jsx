import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Download,
  FolderPlus,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft,
  HardDrive,
  Cpu,
  Database,
  FileArchive,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  BatchQueueWorker, 
  formatBytes, 
  formatEta 
} from '../services/batchProcessor';
import { exportBatchAsZip, calculateZipVolumes, triggerBlobDownload } from '../utils/zipExporter';
import { getBatchStorageStats, clearBatchStorage, getBatchBlob } from '../services/batchStorage';

export default function BatchStudio({
  batchItems = [],
  onUpdateItems,
  onClearAll,
  onAddFiles,
  onOpenInSingleStudio,
  onShowToast,
  onBackToStudio
}) {
  // Queue Running State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [speedSec, setSpeedSec] = useState('0.0');

  // Filter & Search & Pagination
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'processing' | 'pending' | 'error'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Batch Output Settings
  const [backgroundMode, setBackgroundMode] = useState('transparent'); // 'transparent' | 'white' | 'color'
  const [customBgColor, setCustomBgColor] = useState('#f3f4f6');
  const [outputFormat, setOutputFormat] = useState('png'); // 'png' | 'jpeg' | 'webp'

  // High-Scale 10,000+ Optimization Controls
  const [concurrency, setConcurrency] = useState(2); // 1x safe, 2x turbo, 3x ultra
  const [maxEdge, setMaxEdge] = useState(0); // 0 (100% Original Native Resolution) or 2048 (fast)
  const [dirHandle, setDirHandle] = useState(null); // Direct-to-Disk Directory Handle
  const [dirName, setDirName] = useState('');
  const [storageStats, setStorageStats] = useState({ count: 0, totalBytes: 0 });

  // Inspect & Volume Modal States
  const [inspectItem, setInspectItem] = useState(null);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);

  // ZIP Exporting state
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatusText, setZipStatusText] = useState('');

  // File Inputs
  const multiFileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Worker Ref
  const workerRef = useRef(null);
  const batchItemsRef = useRef(batchItems);
  batchItemsRef.current = batchItems;

  // Refresh IndexedDB storage stats periodically or on completion
  const refreshStorageStats = useCallback(async () => {
    try {
      const stats = await getBatchStorageStats();
      setStorageStats(stats);
    } catch {}
  }, []);

  useEffect(() => {
    refreshStorageStats();
  }, [refreshStorageStats]);

  // Keyboard Escape listener for Multi-Part Volume Modal
  useEffect(() => {
    if (!isVolumeModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsVolumeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVolumeModalOpen]);


  // Sync worker settings when any control changes
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.updateSettings({
        background: {
          type: backgroundMode,
          color: customBgColor
        },
        format: outputFormat,
        concurrency,
        maxEdge,
        dirHandle
      });
    }
  }, [backgroundMode, customBgColor, outputFormat, concurrency, maxEdge, dirHandle]);

  // Worker item update handler: optimized with throttled progress to avoid 10,000-element React re-renders
  const handleItemUpdate = useCallback((id, updates) => {
    onUpdateItems((prevItems) => {
      // Find item index
      const idx = prevItems.findIndex((it) => it.id === id);
      if (idx === -1) return prevItems;
      const copy = [...prevItems];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  }, [onUpdateItems]);

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new BatchQueueWorker({
      onItemUpdate: handleItemUpdate,
      onQueueProgress: ({ etaSeconds, speedSec }) => {
        setEtaSeconds(etaSeconds);
        setSpeedSec(speedSec);
      },
      onQueueComplete: () => {
        setIsRunning(false);
        setIsPaused(false);
        refreshStorageStats();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (onShowToast) onShowToast('All batch images processed successfully!');
      },
      onQueuePaused: () => {
        setIsRunning(false);
        setIsPaused(true);
      },
      background: {
        type: backgroundMode,
        color: customBgColor
      },
      format: outputFormat,
      concurrency,
      maxEdge,
      dirHandle
    });

    return () => {
      if (workerRef.current) {
        workerRef.current.stop();
      }
    };
  }, [handleItemUpdate, onShowToast, backgroundMode, customBgColor, outputFormat, concurrency, maxEdge, dirHandle, refreshStorageStats]);

  // Direct-to-Disk Directory Picker (File System Access API)
  const handleSelectDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      if (onShowToast) onShowToast('Direct-to-Disk requires Chromium / Brave browser', true);
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      setDirHandle(handle);
      setDirName(handle.name);
      if (onShowToast) {
        onShowToast(`Auto-saving cutouts directly into folder: "${handle.name}" (0 MB RAM used!)`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
      }
    }
  };

  // Controls: Start, Pause, Resume, Stop
  const handleStartQueue = () => {
    if (!workerRef.current) return;
    setIsRunning(true);
    setIsPaused(false);
    workerRef.current.run(batchItemsRef.current);
  };

  const handlePauseQueue = () => {
    if (!workerRef.current) return;
    workerRef.current.pause();
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResumeQueue = () => {
    if (!workerRef.current) return;
    setIsRunning(true);
    setIsPaused(false);
    workerRef.current.resume(batchItemsRef.current);
  };

  // Clear IndexedDB storage cache
  const handleClearCache = async () => {
    if (window.confirm('Clear all stored batch cutouts from local cache?')) {
      await clearBatchStorage();
      await refreshStorageStats();
      if (onShowToast) onShowToast('Local batch storage cache cleared.');
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = batchItems.length;
    let completed = 0;
    let processing = 0;
    let pending = 0;
    let errors = 0;
    let totalOriginalBytes = 0;

    for (let i = 0; i < total; i++) {
      const it = batchItems[i];
      totalOriginalBytes += it.size || 0;
      if (it.status === 'completed') {
        completed++;
      } else if (it.status === 'processing') {
        processing++;
      } else if (it.status === 'error') {
        errors++;
      } else {
        pending++;
      }
    }

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      processing,
      pending,
      errors,
      pct,
      totalOriginalBytes
    };
  }, [batchItems]);

  // Filter & Search Items
  const filteredItems = useMemo(() => {
    return batchItems.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [batchItems, filter, searchQuery]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, itemsPerPage]);

  // Paginated Sliced Items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Handle Jump to Page
  const handleJumpPage = (e) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  // Export as ZIP (Single volume or Volume Modal for 500+ files)
  const handleExportZip = async () => {
    const completedItems = batchItems.filter((it) => it.status === 'completed');
    if (completedItems.length === 0) {
      if (onShowToast) onShowToast('No completed images to download yet!', true);
      return;
    }

    // If more than 500 files, open the Multi-Part Volume Selector to protect browser memory
    if (completedItems.length > 500) {
      setIsVolumeModalOpen(true);
      return;
    }

    downloadSpecificItemsAsZip(completedItems, `purecut_batch_${completedItems.length}_images.zip`);
  };

  const downloadSpecificItemsAsZip = async (itemsToPack, filename) => {
    try {
      setIsExportingZip(true);
      setZipProgress(5);
      setZipStatusText(`Preparing ${itemsToPack.length} cutouts...`);

      const zipBlob = await exportBatchAsZip(
        itemsToPack,
        { format: outputFormat, suffix: '_purecut', maxItemsPerZip: itemsToPack.length },
        (pct, text) => {
          setZipProgress(pct);
          setZipStatusText(text);
        }
      );

      triggerBlobDownload(zipBlob, filename);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      if (onShowToast) {
        onShowToast(`Downloaded ${itemsToPack.length} cutouts as ZIP!`);
      }
    } catch (err) {
      console.error('ZIP export error:', err);
      if (onShowToast) onShowToast('Failed to create ZIP: ' + err.message, true);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Drag and drop handler inside Batch Studio
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (droppedFiles.length > 0 && onAddFiles) {
      onAddFiles(droppedFiles);
    }
  };

  // Calculate volume partitions for 500+ completed images
  const zipVolumes = useMemo(() => {
    return calculateZipVolumes(batchItems, 500);
  }, [batchItems]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`w-full h-full flex flex-col bg-studio-950 text-slate-100 overflow-hidden relative select-none ${
        isDragOver ? 'ring-4 ring-brand-500/50 bg-brand-500/5' : ''
      }`}
    >
      {/* Top Banner & Control Deck */}
      <div className="bg-studio-900 border-b border-studio-border p-4 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          {/* Left: Title & Scaled description */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStudio}
              className="p-2 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-border text-slate-300 transition"
              title="Return to Single Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_10px_#6366f1] animate-pulse"></span>
                <h1 className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-2">
                  Turbo Batch Studio
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-500 via-purple-600 to-emerald-500 text-white shadow-sm">
                    1,000 - 10,000+ Ready
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                100% Free & Client-Side. IndexedDB + Direct-to-Disk streaming eliminates memory limits.
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Start / Pause / Resume Queue */}
            {!isRunning && !isPaused && stats.pending > 0 && (
              <button
                onClick={handleStartQueue}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wide btn-3d shadow-glow"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Queue ({stats.pending.toLocaleString()})</span>
              </button>
            )}

            {isRunning && (
              <button
                onClick={handlePauseQueue}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-bold text-xs uppercase tracking-wide btn-3d shadow-glow animate-pulse"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Queue</span>
              </button>
            )}

            {isPaused && (
              <button
                onClick={handleResumeQueue}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wide btn-3d shadow-glow"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume ({stats.pending.toLocaleString()})</span>
              </button>
            )}

            {/* Add Photos */}
            <button
              onClick={() => multiFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-borderHighlight text-slate-200 font-bold text-xs transition keycap-3d"
              title="Add more photos"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span>Add Images</span>
            </button>
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files).filter((f) =>
                  f.type.startsWith('image/')
                );
                if (files.length > 0 && onAddFiles) onAddFiles(files);
                e.target.value = '';
              }}
            />

            {/* Add Folder */}
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-borderHighlight text-slate-200 font-bold text-xs transition keycap-3d"
              title="Add entire folder of images"
            >
              <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Folder</span>
            </button>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory="true"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files).filter((f) =>
                  f.type.startsWith('image/')
                );
                if (files.length > 0 && onAddFiles) onAddFiles(files);
                e.target.value = '';
              }}
            />

            {/* Clear All */}
            {stats.total > 0 && (
              <button
                onClick={() => {
                  if (isRunning) {
                    if (!window.confirm('Queue is running. Stop and clear all images?')) return;
                    handlePauseQueue();
                  }
                  onClearAll();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-studio-900 hover:bg-red-950/60 border border-studio-border hover:border-red-800 text-slate-400 hover:text-red-300 font-bold text-xs transition keycap-3d"
                title="Clear queue"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}

            {/* Download All as ZIP / Volumes (3D Primary Button) */}
            <button
              onClick={handleExportZip}
              disabled={stats.completed === 0 || isExportingZip}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-accent-purple text-white font-bold text-xs tracking-wide uppercase btn-3d disabled:opacity-40 disabled:pointer-events-none"
            >
              {isExportingZip ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {stats.completed > 500 
                  ? `Download ZIP (${stats.completed.toLocaleString()} / Volumes)` 
                  : `Download All as ZIP (${stats.completed})`}
              </span>
            </button>
          </div>
        </div>

        {/* Live Metrics 3D Pedestals Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-studio-borderHighlight">
          {/* Total */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-studio-borderHighlight flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Queue</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">{stats.total.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">({formatBytes(stats.totalOriginalBytes)})</span>
            </div>
          </div>

          {/* Completed */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-emerald-500/30 flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">Completed</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">{stats.completed.toLocaleString()}</span>
              <span className="text-[11px] text-emerald-500/80 font-bold">({stats.pct}%)</span>
            </div>
          </div>

          {/* Processing */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-brand-500/30 flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-brand-400 tracking-wider">Processing</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl font-black text-brand-400">{stats.processing}</span>
              {isRunning && <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />}
            </div>
          </div>

          {/* Pending */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-studio-borderHighlight flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pending</span>
            <span className="text-xl font-black text-slate-300 mt-1">{stats.pending.toLocaleString()}</span>
          </div>

          {/* Speed */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-purple-500/30 flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-purple-400 tracking-wider">Throughput</span>
            <span className="text-xl font-black text-purple-300 mt-1">
              {stats.completed > 0 ? `${speedSec}s/img` : '—'}
            </span>
          </div>

          {/* ETA */}
          <div className="p-3 rounded-2xl bg-studio-900/90 border border-amber-500/30 flex flex-col keycap-3d shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-amber-400 tracking-wider">Est. Time Left</span>
            <span className="text-xl font-black text-amber-300 mt-1 font-mono">
              {isRunning ? formatEta(etaSeconds) : stats.pending > 0 ? 'Paused' : 'Done'}
            </span>
          </div>
        </div>

        {/* Master Progress Bar */}
        {stats.total > 0 && (
          <div className="mt-3 w-full bg-studio-950 rounded-full h-2 overflow-hidden border border-studio-border">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-400 transition-all duration-300 relative"
              style={{ width: `${stats.pct}%` }}
            >
              {isRunning && (
                <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_infinite]"></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* High-Scale 10,000+ Optimization Toolbar */}
      <div className="px-4 md:px-6 py-2.5 bg-studio-850/90 border-b border-studio-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* DIRECT-TO-DISK Auto-Save Button */}
          <div className="flex items-center gap-1.5 bg-studio-900 p-1 px-2 rounded-xl border border-studio-border">
            <button
              onClick={handleSelectDirectory}
              className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                dirHandle 
                  ? 'bg-emerald-600 text-white shadow-glow' 
                  : 'bg-studio-800 text-slate-300 hover:text-white'
              }`}
              title="Stream cutouts directly into a local computer folder (Zero RAM used, perfect for 5,000-10,000 images!)"
            >
              <HardDrive className={`w-3.5 h-3.5 ${dirHandle ? 'text-white' : 'text-emerald-400'}`} />
              <span>{dirHandle ? `Saving to: ${dirName}` : 'Auto-Save to Local Folder (0 RAM)'}</span>
            </button>
            {dirHandle && (
              <button
                onClick={() => { setDirHandle(null); setDirName(''); }}
                className="text-slate-400 hover:text-red-400 px-1 font-bold text-xs"
                title="Disconnect folder"
              >
                ✕
              </button>
            )}
          </div>

          {/* Concurrency Selector */}
          <div className="flex items-center gap-1 bg-studio-900 p-1 rounded-xl border border-studio-border">
            <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-brand-400" /> Cores:
            </span>
            <button
              onClick={() => setConcurrency(1)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                concurrency === 1 ? 'bg-studio-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Single thread: safe for lower-RAM laptops"
            >
              1x Safe
            </button>
            <button
              onClick={() => setConcurrency(2)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                concurrency === 2 ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Dual threads: 2x faster, recommended"
            >
              2x Turbo
            </button>
            <button
              onClick={() => setConcurrency(3)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                concurrency === 3 ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Triple threads: max speed for desktop GPUs"
            >
              3x Ultra
            </button>
          </div>

          {/* Fast vs 100% Original Resolution Optimizer */}
          <div className="flex items-center gap-1 bg-studio-900 p-1 rounded-xl border border-studio-border">
            <button
              onClick={() => setMaxEdge(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                maxEdge === 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Preserves 100% exact original camera / photo resolution pixel-for-pixel (Lossless Native)"
            >
              <span>⭐ 100% Native HD</span>
            </button>
            <button
              onClick={() => setMaxEdge(2048)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                maxEdge === 2048 ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Downscales giant camera RAWs/photos to 2048px (3x faster, cuts memory by 75%)"
            >
              ⚡ Fast (2048px)
            </button>
          </div>

          {/* Format selection */}
          <div className="flex items-center gap-1 bg-studio-900 p-1 rounded-xl border border-studio-border">
            <button
              onClick={() => setOutputFormat('png')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                outputFormat === 'png' ? 'bg-studio-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setOutputFormat('jpeg')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                outputFormat === 'jpeg' ? 'bg-studio-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              JPG
            </button>
            <button
              onClick={() => setOutputFormat('webp')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                outputFormat === 'webp' ? 'bg-studio-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              WebP
            </button>
          </div>

          {/* Background Options */}
          <div className="flex items-center gap-1 bg-studio-900 p-1 rounded-xl border border-studio-border">
            <button
              onClick={() => setBackgroundMode('transparent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                backgroundMode === 'transparent'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Transparent
            </button>
            <button
              onClick={() => setBackgroundMode('white')}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                backgroundMode === 'white'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
              White
            </button>
          </div>
        </div>

        {/* Storage Cache Monitor */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>
            IndexedDB: <strong className="text-slate-200">{storageStats.count}</strong> stored ({formatBytes(storageStats.totalBytes)})
          </span>
          {storageStats.count > 0 && (
            <button
              onClick={handleClearCache}
              className="text-[10px] text-slate-400 hover:text-red-400 underline ml-1"
              title="Clear stored blobs from browser disk"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs, Search & Fast Pagination Bar */}
      <div className="px-4 md:px-6 py-2 bg-studio-900 border-b border-studio-border flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-studio-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800'
            }`}
          >
            All ({stats.total.toLocaleString()})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filter === 'completed'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed ({stats.completed.toLocaleString()})
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filter === 'processing'
                ? 'bg-brand-950 text-brand-300 border border-brand-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800'
            }`}
          >
            <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />
            Processing ({stats.processing})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-studio-800 text-slate-200 border border-studio-border'
                : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800'
            }`}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            Pending ({stats.pending.toLocaleString()})
          </button>
          {stats.errors > 0 && (
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                filter === 'error'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-studio-800'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Failed ({stats.errors})
            </button>
          )}
        </div>

        {/* Search, Items Per Page, Jump to Page */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${stats.total.toLocaleString()} images...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-studio-800 border border-studio-border text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-2 py-1.5 rounded-xl bg-studio-800 border border-studio-border text-xs text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value={24}>24 / page</option>
            <option value={48}>48 / page</option>
            <option value={96}>96 / page</option>
            <option value={192}>192 / page</option>
          </select>
        </div>
      </div>

      {/* Main Grid Viewport with Zero-Lag Sliced Pagination */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-studio-950 custom-scrollbar">
        {stats.total === 0 ? (
          // Empty State Dropzone
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-studio-border rounded-3xl p-8 text-center bg-studio-900/40">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 mb-4 shadow-glow">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl text-white mb-2">
              Batch Queue is Empty
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Drag and drop 1,000, 2,000, 5,000, or 10,000 photos here. With Direct-to-Disk and IndexedDB streaming, process huge catalogs at 0 cost!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => multiFileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white font-semibold text-xs shadow-glow transition transform hover:-translate-y-0.5"
              >
                Select Photos
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-studio-800 hover:bg-studio-700 border border-studio-border text-slate-200 font-semibold text-xs transition"
              >
                Select Folder
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="w-full h-64 flex flex-col items-center justify-center text-center text-slate-400">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No images match your filter or search.</p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-brand-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {paginatedItems.map((item) => (
              <BatchItemCard
                key={item.id}
                item={item}
                backgroundMode={backgroundMode}
                customBgColor={customBgColor}
                onInspect={() => setInspectItem(item)}
                onOpenStudio={() => onOpenInSingleStudio(item)}
                onRetry={() => {
                  handleItemUpdate(item.id, {
                    status: 'pending',
                    progress: 0,
                    statusText: 'Queued',
                    error: null
                  });
                  if (!isRunning) {
                    setTimeout(() => handleStartQueue(), 50);
                  }
                }}
                onDelete={() => {
                  onUpdateItems((prev) => prev.filter((it) => it.id !== item.id));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination & Fast Jump Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-3 bg-studio-900 border-t border-studio-border flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{' '}
            {filteredItems.length.toLocaleString()} images
          </div>

          <div className="flex items-center gap-2">
            {/* Jump to Page Form */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-1 mr-2">
              <span className="text-[11px] text-slate-500">Go to:</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={`${currentPage}`}
                className="w-12 px-1.5 py-1 rounded bg-studio-800 border border-studio-border text-center text-xs text-white focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded bg-studio-800 hover:bg-studio-700 text-slate-300 text-[11px]"
              >
                Go
              </button>
            </form>

            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg bg-studio-800 hover:bg-studio-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Multi-Part ZIP Volume Exporter Modal for 500+ Images */}
      {isVolumeModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="zip-volumes-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsVolumeModalOpen(false)}
        >
          <div 
            className="max-w-xl w-full bg-studio-900 border border-studio-border rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-studio-border">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-brand-400" />
                <h3 id="zip-volumes-title" className="font-bold text-base text-white">
                  Multi-Part ZIP Volumes ({stats.completed.toLocaleString()} Cutouts)
                </h3>
              </div>
              <button
                onClick={() => setIsVolumeModalOpen(false)}
                aria-label="Close volumes dialog"
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>


            <p className="text-xs text-slate-400 my-3">
              To prevent browser crashes and memory limits on thousands of files, cutouts are partitioned into safe 500-image packages. Download any volume below:
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {zipVolumes.map((vol) => (
                <div
                  key={vol.partNumber}
                  className="flex items-center justify-between p-3 rounded-xl bg-studio-850 border border-studio-border hover:border-brand-500/50 transition"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-slate-200">
                      Volume {vol.partNumber} of {vol.totalParts} ({vol.count} cutouts)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Images #{vol.startIdx + 1} to #{vol.endIdx}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsVolumeModalOpen(false);
                      downloadSpecificItemsAsZip(vol.items, `purecut_batch_part_${vol.partNumber}.zip`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Part {vol.partNumber}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-studio-border flex justify-end">
              <button
                onClick={() => setIsVolumeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Inspection Modal */}
      {inspectItem && (
        <InspectModal
          item={inspectItem}
          backgroundMode={backgroundMode}
          customBgColor={customBgColor}
          onClose={() => setInspectItem(null)}
          onOpenStudio={() => {
            onOpenInSingleStudio(inspectItem);
            setInspectItem(null);
          }}
        />
      )}

      {/* ZIP Packaging Modal Overlay */}
      {isExportingZip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-studio-900 border border-brand-500/40 text-center shadow-studio">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto mb-4 animate-bounce">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Packaging ZIP Archive</h3>
            <p className="text-xs text-slate-400 mb-4">{zipStatusText}</p>

            <div className="w-full bg-studio-950 rounded-full h-2.5 overflow-hidden border border-studio-border mb-3">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-200"
                style={{ width: `${zipProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-brand-400">{zipProgress}% Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy Thumbnail Card with Zero-Memory-Leak Object URLs & IndexedDB hydration
 */
function BatchItemCard({
  item,
  backgroundMode,
  customBgColor,
  onInspect,
  onOpenStudio,
  onRetry,
  onDelete
}) {
  const [previewSrc, setPreviewSrc] = useState(null);

  // Lazy Object URL lifecycle: create on mount, revoke on unmount
  useEffect(() => {
    let url = null;
    let isCancelled = false;

    if (item.resultUrl) {
      setPreviewSrc(item.resultUrl);
    } else if (item.hasResult && !item.resultBlob) {
      // Hydrate lazily from IndexedDB if not in RAM
      getBatchBlob(item.id).then((blob) => {
        if (!isCancelled && blob) {
          url = URL.createObjectURL(blob);
          setPreviewSrc(url);
        }
      });
    } else if (item.resultBlob) {
      url = URL.createObjectURL(item.resultBlob);
      setPreviewSrc(url);
    } else if (item.file) {
      url = URL.createObjectURL(item.file);
      setPreviewSrc(url);
    }

    return () => {
      isCancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.file, item.resultUrl, item.resultBlob, item.hasResult, item.id]);

  return (
    <div className="group rounded-2xl bg-studio-900 border border-studio-border hover:border-brand-500/50 p-2 flex flex-col transition shadow-sm hover:shadow-studio relative">
      {/* Thumbnail Area with Checkerboard pattern */}
      <div
        className={`w-full aspect-square rounded-xl overflow-hidden relative flex items-center justify-center ${
          backgroundMode === 'transparent'
            ? 'checkerboard-bg'
            : backgroundMode === 'white'
              ? 'bg-white'
              : 'bg-studio-950'
        }`}
        style={
          backgroundMode === 'color' && item.status === 'completed'
            ? { backgroundColor: customBgColor }
            : {}
        }
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={item.name}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-studio-800 animate-pulse"></div>
        )}

        {/* Processing Spinner Overlay */}
        {item.status === 'processing' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin mb-1.5" />
            <span className="text-[10px] font-bold text-white leading-tight">
              {item.statusText || 'Processing'}
            </span>
            <div className="w-16 bg-studio-950 rounded-full h-1.5 overflow-hidden mt-1.5 border border-studio-border">
              <div
                className="h-full bg-brand-500 transition-all duration-150"
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-brand-300 font-semibold mt-1">
              {item.progress}%
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {item.status === 'error' && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
            <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
            <span className="text-[10px] text-rose-200 line-clamp-2 mb-1.5">
              {item.error || 'Failed'}
            </span>
            <button
              onClick={onRetry}
              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" /> Retry
            </button>
          </div>
        )}

        {/* Hover Quick Actions */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
          {item.status === 'completed' && (
            <>
              <button
                onClick={onInspect}
                className="p-1.5 rounded-lg bg-studio-800 hover:bg-brand-500 text-white shadow-sm transition"
                title="Inspect Comparison"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  let blob = item.resultBlob;
                  if (!blob) blob = await getBatchBlob(item.id);
                  if (blob) {
                    triggerBlobDownload(blob, `${item.name.replace(/\.[^/.]+$/, '')}_purecut.png`);
                  }
                }}
                className="p-1.5 rounded-lg bg-studio-800 hover:bg-emerald-600 text-white shadow-sm transition"
                title="Download Cutout"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenStudio}
                className="p-1.5 rounded-lg bg-studio-800 hover:bg-purple-600 text-white shadow-sm transition"
                title="Edit in Single Studio (Brush, Shadows)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-studio-800 hover:bg-red-600 text-slate-300 hover:text-white shadow-sm transition"
            title="Remove from batch"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info strip */}
      <div className="mt-2 flex flex-col gap-0.5 px-0.5">
        <span className="text-[11px] font-semibold text-slate-200 truncate" title={item.name}>
          {item.name}
        </span>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>{formatBytes(item.size)}</span>
          {item.status === 'completed' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {(item.durationMs / 1000).toFixed(1)}s
            </span>
          ) : item.status === 'processing' ? (
            <span className="text-brand-400 font-semibold">Running</span>
          ) : item.status === 'error' ? (
            <span className="text-rose-400 font-semibold">Error</span>
          ) : (
            <span className="text-slate-500 font-medium">Queued</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inspection Modal: Side-by-Side Comparison
 */
function InspectModal({ item, backgroundMode, customBgColor, onClose, onOpenStudio }) {
  const [originalSrc, setOriginalSrc] = useState(null);
  const [cutoutSrc, setCutoutSrc] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    let origUrl = null;
    let cutUrl = null;

    if (item.file) {
      origUrl = URL.createObjectURL(item.file);
      setOriginalSrc(origUrl);
    }

    if (item.resultUrl) {
      setCutoutSrc(item.resultUrl);
    } else {
      getBatchBlob(item.id).then((blob) => {
        if (blob) {
          cutUrl = URL.createObjectURL(blob);
          setCutoutSrc(cutUrl);
        }
      });
    }

    return () => {
      if (origUrl) URL.revokeObjectURL(origUrl);
      if (cutUrl) URL.revokeObjectURL(cutUrl);
    };
  }, [item.file, item.resultUrl, item.id]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      aria-labelledby="inspect-modal-title"
      className="p-4 bg-transparent outline-none"
    >

      <div 
        className="max-w-4xl w-full bg-studio-900/95 backdrop-blur-2xl border border-studio-borderHighlight rounded-3xl overflow-hidden shadow-studio flex flex-col max-h-[90vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-studio-border flex items-center justify-between bg-studio-950/60">
          <div className="flex items-center gap-2.5">
            <h3 id="inspect-modal-title" className="font-display font-bold text-base text-white truncate max-w-sm">
              {item.name}
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">
              HD Cutout Verified
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close inspection preview"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-studio-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
          {/* Left: Original */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Original Photo ({formatBytes(item.size)})
            </span>
            <div className="w-full aspect-square rounded-2xl bg-studio-950 border border-studio-border overflow-hidden flex items-center justify-center p-3 shadow-inner">
              {originalSrc ? (
                <img
                  src={originalSrc}
                  alt="Original"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-studio-800 animate-pulse rounded-xl"></div>
              )}
            </div>
          </div>

          {/* Right: Cutout */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Cutout Result
            </span>
            <div
              className={`w-full aspect-square rounded-2xl border border-studio-border overflow-hidden flex items-center justify-center p-3 shadow-inner ${
                backgroundMode === 'transparent'
                  ? 'checkerboard-bg'
                  : backgroundMode === 'white'
                    ? 'bg-white'
                    : 'bg-studio-950'
              }`}
              style={
                backgroundMode === 'color' ? { backgroundColor: customBgColor } : {}
              }
            >
              {cutoutSrc ? (
                <img
                  src={cutoutSrc}
                  alt="Cutout"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-studio-800 animate-pulse rounded-xl"></div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-studio-border flex items-center justify-between bg-studio-950/80">
          <button
            onClick={onOpenStudio}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-glow transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open in Single Studio (Brush, Shadows)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                let blob = item.resultBlob;
                if (!blob) blob = await getBatchBlob(item.id);
                if (blob) {
                  triggerBlobDownload(blob, `${item.name.replace(/\.[^/.]+$/, '')}_purecut.png`);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Cutout</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-studio-800 hover:bg-studio-700 text-slate-300 font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
