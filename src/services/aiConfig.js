/**
 * AI Engine Configuration & Persistence
 * Supports both In-Browser Neural AI (IS-Net / U-2-Net family via WebAssembly)
 * and Official Remove.bg Cloud API Integration.
 */

const STORAGE_KEY = 'purecut_ai_config';

export const DEFAULT_AI_CONFIG = {
  // 'local' (In-Browser Neural IS-Net) or 'removebg' (Official Remove.bg Cloud API)
  engine: 'local',
  removeBgApiKey: '',
  // Hardware device: 'gpu' (WebGPU Hardware Acceleration - 0% CPU Load) or 'cpu' (WebAssembly CPU)
  device: 'gpu',
  // Local model quality: 'medium' (Studio HD IS-Net FP16) or 'small' (Fast Quantized)
  quality: 'medium',
  // Resolution preservation: 'original' (100% Native Unscaled) or 'balanced' (2048px max)
  resolutionMode: 'original',
  // 100% Studio Result: Remove.bg-grade Color Decontamination & Edge Matting
  edgeDecontaminate: true,
  // Edge feather softness (0 to 4 px)
  edgeFeather: 1,
  // Ultra-Precision 100% Result Suite
  ultraPrecision: true,
  // Automatic stray background island cleaner
  autoCleanIslands: true,
  // Automatic contact shadow attenuation
  autoCleanShadows: true,
  // Closed-form color despill weight
  despillStrength: 0.85
};

/**
 * Retrieves the current AI engine configuration from localStorage
 */
export function getAiConfig() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch (e) {
    console.warn('Failed to parse AI configuration, using defaults', e);
    return { ...DEFAULT_AI_CONFIG };
  }
}

/**
 * Saves updated AI configuration and broadcasts change event
 */
export function saveAiConfig(newConfig) {
  try {
    const current = getAiConfig();
    const updated = { ...current, ...newConfig };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('purecut_ai_config_updated', { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('Failed to save AI configuration', e);
    return newConfig;
  }
}
