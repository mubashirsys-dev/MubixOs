/* ═══════════════════════════════════════════
   MUBIX OS — Process Manager
   Core process registry and lifecycle.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { OS_CONFIG } from '@core/config.js';
import { perf } from '@kernel/performance.js';

/** Process states */
export const ProcessState = {
  ACTIVE:     'active',
  SUSPENDED:  'suspended',
  SLEEPING:   'sleeping',
  TERMINATED: 'terminated',
};

/** Process priority */
export const Priority = {
  HIGH:       'high',
  NORMAL:     'normal',
  LOW:        'low',
  BACKGROUND: 'background',
};

let _pidCounter = 0;

class ProcessManager {
  constructor() {
    /** @type {Map<number, Process>} */
    this.processes = new Map();
  }

  /**
   * Spawn a new process.
   * @param {string} appId
   * @param {object} opts
   * @returns {Process|null}
   */
  spawn(appId, opts = {}) {
    // Check process limit
    const active = this.getActive();
    const maxProcs = OS_CONFIG.maxProcesses[perf.tier] || 8;
    if (active.length >= maxProcs) {
      // Try to suspend oldest background process
      const oldest = active
        .filter(p => p.priority === Priority.BACKGROUND || p.priority === Priority.LOW)
        .sort((a, b) => a.lastActive - b.lastActive)[0];
      if (oldest) {
        this.suspend(oldest.pid);
      } else {
        bus.emit('notification:show', {
          title: 'System',
          message: 'Too many apps open. Close one to continue.',
          icon: '⚠️'
        });
        return null;
      }
    }

    const pid = ++_pidCounter;
    const process = {
      pid,
      appId,
      state: ProcessState.ACTIVE,
      windowId: opts.windowId || null,
      priority: opts.priority || Priority.NORMAL,
      lastActive: Date.now(),
      createdAt: Date.now(),
      savedState: null,
      // App instance reference (set later by window manager)
      instance: null,
    };

    this.processes.set(pid, process);
    bus.emit('process:spawned', process);
    return process;
  }

  /**
   * Suspend a process (hide, pause timers, but keep DOM).
   */
  suspend(pid) {
    const proc = this.processes.get(pid);
    if (!proc || proc.state !== ProcessState.ACTIVE) return;

    proc.state = ProcessState.SUSPENDED;
    if (proc.instance?.suspend) {
      try { proc.instance.suspend(); } catch (e) { console.error(e); }
    }
    bus.emit('process:suspended', proc);
  }

  /**
   * Sleep a process (serialize state, remove DOM).
   */
  sleep(pid) {
    const proc = this.processes.get(pid);
    if (!proc || proc.state === ProcessState.TERMINATED) return;

    if (proc.instance?.suspend) {
      try {
        proc.savedState = proc.instance.suspend(); // suspend returns serialized state if desired
      } catch (e) { console.error(e); }
    }
    proc.state = ProcessState.SLEEPING;
    bus.emit('process:sleeping', proc);
  }

  /**
   * Wake a process from suspended/sleeping state.
   */
  wake(pid) {
    const proc = this.processes.get(pid);
    if (!proc) return;

    proc.state = ProcessState.ACTIVE;
    proc.lastActive = Date.now();

    if (proc.instance?.resume) {
      try { proc.instance.resume(proc.savedState); } catch (e) { console.error(e); }
    }
    proc.savedState = null;
    bus.emit('process:woken', proc);
  }

  /**
   * Kill a process.
   */
  kill(pid) {
    const proc = this.processes.get(pid);
    if (!proc) return;

    if (proc.instance?.destroy) {
      try { proc.instance.destroy(); } catch (e) { console.error(e); }
    }
    proc.state = ProcessState.TERMINATED;
    proc.instance = null;
    this.processes.delete(pid);
    bus.emit('process:killed', proc);
  }

  /**
   * Touch a process (mark as recently active).
   */
  touch(pid) {
    const proc = this.processes.get(pid);
    if (proc) proc.lastActive = Date.now();
  }

  /** Get all active processes */
  getActive() {
    return [...this.processes.values()].filter(p => p.state === ProcessState.ACTIVE);
  }

  /** Get all processes (any state) */
  getAll() {
    return [...this.processes.values()];
  }

  /** Find processes by app ID */
  findByApp(appId) {
    return [...this.processes.values()].filter(p => p.appId === appId && p.state !== ProcessState.TERMINATED);
  }

  /** Get process by PID */
  get(pid) {
    return this.processes.get(pid) || null;
  }
}

export const processManager = new ProcessManager();
export default processManager;
