/* ═══════════════════════════════════════════
   MUBIX OS — Performance Detection
   Hardware detection + adaptive tier system.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';

class PerformanceDetector {
  constructor() {
    this.tier = 3;         // Default: normal
    this.cores = 4;
    this.memory = 4;       // GB
    this.gpu = 'unknown';
    this.battery = null;
    this.reducedMotion = false;
  }

  /**
   * Detect hardware capabilities and assign performance tier.
   * Tier 1 = ultra-low, Tier 2 = low, Tier 3 = normal
   */
  async detect() {
    // CPU cores
    this.cores = navigator.hardwareConcurrency || 2;

    // RAM (Chrome only, returns GB)
    this.memory = navigator.deviceMemory || 4;

    // Reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Battery
    try {
      if ('getBattery' in navigator) {
        this.battery = await navigator.getBattery();
      }
    } catch (e) { /* battery API not available */ }

    // GPU detection via WebGL renderer string
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          this.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
        // Clean up
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      canvas.remove();
    } catch (e) { /* WebGL not available */ }

    // Calculate tier
    this._calculateTier();

    // Apply to DOM
    this._applyTier();

    bus.emit('perf:detected', {
      tier: this.tier,
      cores: this.cores,
      memory: this.memory,
      gpu: this.gpu,
      battery: this.battery ? {
        level: this.battery.level,
        charging: this.battery.charging
      } : null
    });

    return this;
  }

  _calculateTier() {
    let score = 0;

    // CPU scoring
    if (this.cores >= 4) score += 2;
    else if (this.cores >= 2) score += 1;

    // RAM scoring
    if (this.memory >= 4) score += 2;
    else if (this.memory >= 2) score += 1;

    // Motion preference
    if (this.reducedMotion) score -= 1;

    // Battery penalty
    if (this.battery && !this.battery.charging && this.battery.level < 0.2) {
      score -= 1;
    }

    // Assign tier
    if (score <= 1) this.tier = 1;
    else if (score <= 3) this.tier = 2;
    else this.tier = 3;
  }

  _applyTier() {
    document.documentElement.setAttribute('data-perf-tier', this.tier);
  }

  /** Get quick query values */
  get canAnimate() { return this.tier >= 2; }
  get canBlur() { return this.tier >= 3; }
  get canGlow() { return this.tier >= 2; }
  get maxProcesses() { return [0, 3, 5, 8][this.tier]; }

  /** Check if power saving mode should be recommended */
  get shouldSavePower() {
    return this.battery && !this.battery.charging && this.battery.level < 0.3;
  }

  /** Downgrade tier (e.g., user enables power saving) */
  setTier(tier) {
    this.tier = Math.max(1, Math.min(3, tier));
    this._applyTier();
    bus.emit('perf:tier-changed', this.tier);
  }
}

export const perf = new PerformanceDetector();
export default perf;
