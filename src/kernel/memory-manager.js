/* ═══════════════════════════════════════════
   MUBIX OS — Memory Manager
   RAM tracking and budget enforcement.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { perf } from '@kernel/performance.js';

class MemoryManager {
  constructor() {
    this._estimates = new Map(); // pid -> MB
  }

  /**
   * Get estimated total memory usage.
   */
  getTotalEstimate() {
    let total = 0;
    for (const mb of this._estimates.values()) total += mb;
    return total;
  }

  /**
   * Update estimate for a process.
   */
  updateEstimate(pid, mb) {
    this._estimates.set(pid, mb);
  }

  /**
   * Remove estimate when process dies.
   */
  removeEstimate(pid) {
    this._estimates.delete(pid);
  }

  /**
   * Get memory info from browser API if available.
   */
  getSystemMemory() {
    if (performance.memory) {
      return {
        usedJSHeap: performance.memory.usedJSHeapSize / 1024 / 1024,
        totalJSHeap: performance.memory.totalJSHeapSize / 1024 / 1024,
        limit: performance.memory.jsHeapSizeLimit / 1024 / 1024,
      };
    }
    return null;
  }

  /**
   * Check if memory pressure is high.
   */
  isUnderPressure() {
    const sys = this.getSystemMemory();
    if (sys) {
      return sys.usedJSHeap / sys.limit > 0.7;
    }
    // Heuristic: if we estimate > threshold, pressure
    const budget = perf.memory * 1024 * 0.4; // 40% of detected RAM in MB
    return this.getTotalEstimate() > budget;
  }

  /**
   * Get snapshot for UI display.
   */
  getSnapshot() {
    return {
      estimates: Object.fromEntries(this._estimates),
      total: this.getTotalEstimate(),
      system: this.getSystemMemory(),
      pressure: this.isUnderPressure(),
    };
  }
}

export const memoryManager = new MemoryManager();
export default memoryManager;

// Auto-cleanup when processes die
bus.on('process:killed', (proc) => {
  memoryManager.removeEstimate(proc.pid);
});
