/* ═══════════════════════════════════════════
   MUBIX OS — Scheduler
   Idle-based scheduling for process lifecycle.
   ═══════════════════════════════════════════ */

import { processManager, ProcessState } from '@kernel/process-manager.js';
import { OS_CONFIG } from '@core/config.js';
import bus from '@core/event-bus.js';

class Scheduler {
  constructor() {
    this._intervalId = null;
    this._idleCallbackId = null;
    this._running = false;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._scheduleCheck();
  }

  stop() {
    this._running = false;
    if (this._intervalId) clearInterval(this._intervalId);
    if (this._idleCallbackId && 'cancelIdleCallback' in window) {
      cancelIdleCallback(this._idleCallbackId);
    }
  }

  _scheduleCheck() {
    // Use requestIdleCallback if available, fallback to setInterval
    if ('requestIdleCallback' in window) {
      const loop = () => {
        if (!this._running) return;
        this._idleCallbackId = requestIdleCallback((deadline) => {
          this._runChecks(deadline);
          // Schedule next check after interval
          setTimeout(loop, OS_CONFIG.schedulerIntervalMs);
        }, { timeout: 5000 });
      };
      loop();
    } else {
      this._intervalId = setInterval(() => {
        this._runChecks();
      }, OS_CONFIG.schedulerIntervalMs);
    }
  }

  _runChecks(deadline) {
    const now = Date.now();
    const processes = processManager.getAll();

    for (const proc of processes) {
      // Skip terminated
      if (proc.state === ProcessState.TERMINATED) continue;

      const idle = now - proc.lastActive;

      // Auto-suspend: inactive for > suspendAfterMs
      if (proc.state === ProcessState.ACTIVE && idle > OS_CONFIG.suspendAfterMs) {
        processManager.suspend(proc.pid);
        bus.emit('scheduler:suspended', { pid: proc.pid, idle });
      }

      // Auto-sleep: suspended for > sleepAfterMs
      if (proc.state === ProcessState.SUSPENDED && idle > OS_CONFIG.sleepAfterMs) {
        processManager.sleep(proc.pid);
        bus.emit('scheduler:sleeping', { pid: proc.pid, idle });
      }

      // If using requestIdleCallback, respect time budget
      if (deadline && deadline.timeRemaining() < 2) break;
    }
  }
}

export const scheduler = new Scheduler();
export default scheduler;
