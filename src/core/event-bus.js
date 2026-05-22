/* ═══════════════════════════════════════════
   MUBIX OS — Event Bus
   Lightweight pub/sub (~40 lines).
   ═══════════════════════════════════════════ */

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} unsubscribe function
   */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Subscribe once — auto-removes after first call.
   */
  once(event, handler) {
    const wrapped = (...args) => {
      this.off(event, wrapped);
      handler(...args);
    };
    return this.on(event, wrapped);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this._listeners.delete(event);
    }
  }

  /**
   * Emit an event with optional data.
   */
  emit(event, data) {
    const set = this._listeners.get(event);
    if (set) {
      for (const handler of set) {
        try { handler(data); }
        catch (e) { console.error(`[EventBus] Error in handler for "${event}":`, e); }
      }
    }
    // Wildcard listeners
    const wildcard = this._listeners.get('*');
    if (wildcard) {
      for (const handler of wildcard) {
        try { handler({ event, data }); }
        catch (e) { console.error('[EventBus] Error in wildcard handler:', e); }
      }
    }
  }

  /** Remove all listeners */
  clear() {
    this._listeners.clear();
  }
}

// Singleton
export const bus = new EventBus();
export default bus;
