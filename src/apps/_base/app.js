/* ═══════════════════════════════════════════
   MUBIX OS — Core App Lifecycle Class
   Each app exports these critical methods.
   ═══════════════════════════════════════════ */

export default class MubixApp {
  constructor() {
    /** @type {HTMLElement|null} */
    this.container = null;
    /** @type {object|null} */
    this.ctx = null; // { windowId, pid, appId }
    this.abortController = new AbortController();
    this.activeIntervals = new Set();
    this.eventCleanups = [];
  }

  /**
   * Initialize app state before mounting.
   * @param {object} ctx - Process Context
   */
  async init(ctx) {
    this.ctx = ctx;
    this.abortController = new AbortController();
    this.eventCleanups = [];
  }

  /**
   * Mount app GUI into window body.
   * @param {HTMLElement} container - Window's container viewport
   */
  async mount(container) {
    this.container = container;
  }

  /**
   * Pause background loops, rendering frames, and active timers.
   */
  suspend() {
    // Clear all registers to free CPU load
    for (const interval of this.activeIntervals) {
      clearInterval(interval);
    }
    this.activeIntervals.clear();

    // Clear event cleanups
    for (const cleanup of this.eventCleanups) {
      cleanup();
    }
    this.eventCleanups = [];
  }

  /**
   * Restore execution context and restart loops.
   * @param {object|null} state - Preserved state
   */
  resume(state = null) {}

  /**
   * Tear down DOM structures and discard listeners cleanly to prevent memory leaks.
   */
  destroy() {
    this.suspend();
    this.abortController.abort(); // Cancel all listeners assigned to this controller
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
    this.ctx = null;
  }

  /* ── Runtime Helper Methods ── */

  /**
   * Dynamic event registration automatically bounded to the lifecycle AbortController.
   */
  addListener(target, type, listener, options = {}) {
    if (target && typeof target.on === 'function' && typeof target.off === 'function') {
      target.on(type, listener);
      this.eventCleanups.push(() => target.off(type, listener));
    } else if (target && typeof target.addEventListener === 'function') {
      target.addEventListener(type, listener, {
        signal: this.abortController.signal,
        ...options
      });
    }
  }

  /**
   * Add a dynamic interval registered for automatic unbinding on suspend/destroy.
   */
  addInterval(callback, ms) {
    const id = setInterval(callback, ms);
    this.activeIntervals.add(id);
    return id;
  }

  /** Set the window title */
  setTitle(title) {
    if (!this.ctx) return;
    const titleEl = document.querySelector(`#${this.ctx.windowId} .window-title`);
    if (titleEl) titleEl.textContent = title;
  }

  /**
   * Return serialized state for storage.
   */
  saveState() {
    return null;
  }

  /**
   * Restore state from storage.
   */
  restoreState(state) {}
}
