/* ═══════════════════════════════════════════
   MUBIX OS — REAL Window Manager & App Loader
   Orchestrates the plain object app contract & error boundaries.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { getAppConfig } from '@core/config.js';
import { processManager, ProcessState } from '@kernel/process-manager.js';
import { createWindow } from '@ws/window.js';
import { uid, $ } from '@utils/helpers.js';

class WindowManager {
  constructor() {
    /** @type {Map<string, object>} */
    this.windows = new Map();
    this._zCounter = 1;
    this._container = null;
    this._snapPreview = null;
    this._lastPositions = new Map();
  }

  init() {
    this._container = $('#window-layer');

    // Create snap preview element
    this._snapPreview = document.createElement('div');
    this._snapPreview.id = 'snap-preview';
    this._container.parentElement.appendChild(this._snapPreview);

    // Sync killed processes
    bus.on('process:killed', (proc) => this._onProcessKilled(proc));
  }

  saveLastPosition(id, x, y) {
    const win = this.windows.get(id);
    if (win) {
      this._lastPositions.set(win.appId, { x, y });
    }
  }

  /**
   * Instantiate and mount a true application window.
   */
  async openWindow(appId, opts = {}) {
    const config = getAppConfig(appId);
    if (!config) {
      console.error(`[WM] App config missing: ${appId}`);
      return null;
    }

    // Focus existing window if singleton
    if (config.singleton) {
      const existing = this.findByApp(appId);
      if (existing) {
        this.focus(existing.id);
        return existing;
      }
    }

    const windowId = uid('win');
    const proc = processManager.spawn(appId, { windowId });
    if (!proc) return null;

    // Center coordinates & smart positioning cascade
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = opts.width || config.defaultSize.w;
    const h = opts.height || config.defaultSize.h;
    
    let x, y;
    if (this._lastPositions.has(appId)) {
      const last = this._lastPositions.get(appId);
      x = last.x;
      y = last.y;
    } else {
      let topWin = null;
      for (const win of this.windows.values()) {
        if (win.state === 'minimized') continue;
        if (!topWin || win.zIndex > topWin.zIndex) topWin = win;
      }
      if (topWin) {
        x = topWin.x + 32;
        y = topWin.y + 32;
        // Wrap around boundaries safely
        if (x + w > vw || y + h > vh - 80) {
          x = 40;
          y = 40;
        }
      } else {
        x = Math.max(40, (vw - w) / 2);
        y = Math.max(40, (vh - h) / 2 - 40);
      }
    }

    const winData = {
      id: windowId,
      pid: proc.pid,
      appId,
      title: config.name,
      icon: config.icon,
      x, y, w, h,
      state: 'normal',
      zIndex: ++this._zCounter,
      focused: true,
    };

    // Construct the container chrome element
    const winEl = createWindow(winData, this);
    this._container.appendChild(winEl);

    const bodyEl = winEl.querySelector('.window-body');

    const winInstance = {
      ...winData,
      el: winEl,
      bodyEl,
      proc,
    };
    this.windows.set(windowId, winInstance);

    // Dynamic Module Loader with State-Isolated App Engine
    try {
      console.log(`[App Engine] Loading module for: ${appId} (PID: ${proc.pid})`);
      const module = await config.module();
      const exported = module.default;

      if (!exported) {
        throw new Error('Module does not export a default application.');
      }

      let app;
      if (typeof exported === 'function') {
        try {
          app = new exported();
        } catch (e) {
          app = exported();
        }
      } else {
        // Clone the plain object using prototype creation to guarantee independent property instances per PID
        app = Object.create(exported);
      }

      if (!app) {
        throw new Error('App is not defined or could not be instantiated.');
      }

      // Safe app interface contract validation
      const requiredLifecycles = ['init', 'mount', 'suspend', 'resume', 'destroy'];
      const missingLifecycles = requiredLifecycles.filter(m => typeof app[m] !== 'function');
      if (missingLifecycles.length > 0) {
        throw new Error(`App does not implement the standard interface. Missing lifecycles: ${missingLifecycles.join(', ')}`);
      }

      proc.instance = app;
      console.log(`[App Engine] Module loaded successfully. Initializing: ${appId}`);

      // Executing Plain Object App Contract
      await app.init({ windowId, pid: proc.pid, appId, ...opts });
      console.log(`[App Engine] App initialized. Mounting DOM: ${appId}`);

      await app.mount(bodyEl);
      console.log(`[App Engine] App mounted & rendered successfully: ${appId}`);

      // Restore previous state if present
      if (proc.savedState && typeof app.restoreState === 'function') {
        await app.restoreState(proc.savedState);
        console.log(`[App Engine] App state restored: ${appId}`);
      }

    } catch (e) {
      console.error(`[App Engine] Runtime Crash for "${appId}" (PID: ${proc.pid}):`, e);
      this.renderFallbackUI(bodyEl, appId, e, opts);
    }

    this._unfocusAll();
    winEl.classList.add('focused');
    winEl.style.setProperty('--wz', this._zCounter);

    bus.emit('window:opened', winData);
    bus.emit('dock:update');
    return winInstance;
  }

  /**
   * Premium Fallback Error Boundary UI
   */
  renderFallbackUI(container, appId, error, opts) {
    container.innerHTML = '';
    const errorBox = document.createElement('div');
    errorBox.className = 'app-error-boundary';
    errorBox.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      background: #110e14;
      color: #eaeaea;
      text-align: center;
      font-family: var(--mx-font-sans);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Application Crash detected';
    title.style.cssText = 'color: var(--mx-red); margin-bottom: 8px; font-size: 16px; font-weight: 600;';

    const desc = document.createElement('p');
    desc.textContent = `App "${appId.toUpperCase()}" failed to compile or render at runtime.`;
    desc.style.cssText = 'font-size: 12px; color: var(--mx-text-secondary); margin-bottom: 16px; max-width: 320px;';

    const details = document.createElement('pre');
    details.textContent = `${error.name}: ${error.message}\n${error.stack ? error.stack.split('\n')[1] : ''}`;
    details.style.cssText = `
      font-family: var(--mx-font-mono);
      font-size: 10px;
      background: rgba(0,0,0,0.4);
      padding: 10px;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 4px;
      max-width: 100%;
      overflow-x: auto;
      text-align: left;
      margin-bottom: 20px;
      color: #ffa4a4;
    `;

    const retryBtn = document.createElement('button');
    retryBtn.textContent = 'Reload Application';
    retryBtn.className = 'fm-btn';
    retryBtn.style.cssText = 'background: var(--mx-accent); border: none; color: #fff; cursor: pointer;';
    retryBtn.onclick = () => {
      const winId = [...this.windows.entries()].find(([k, v]) => v.bodyEl === container)?.[0];
      if (winId) {
        this.close(winId);
        setTimeout(() => this.openWindow(appId, opts), 200);
      }
    };

    errorBox.appendChild(title);
    errorBox.appendChild(desc);
    errorBox.appendChild(details);
    errorBox.appendChild(retryBtn);
    container.appendChild(errorBox);
  }

  close(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    win.el.classList.add('closing');
    const duration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mx-duration-normal')) || 150;

    setTimeout(() => {
      // Execute unmounting destructors directly
      if (win.proc && win.proc.instance) {
        try {
          console.log(`[App Engine] Terminating app instance: ${win.appId}`);
          if (typeof win.proc.instance.destroy === 'function') {
            win.proc.instance.destroy();
          }
          console.log(`[App Engine] App instance terminated successfully: ${win.appId}`);
        } catch(e) {
          console.error(e);
        }
      }
      win.el.remove();
      this.windows.delete(windowId);
      processManager.kill(win.pid);

      bus.emit('window:closed', { id: windowId, appId: win.appId });
      bus.emit('dock:update');
      this._focusTopmost();
    }, duration);
  }

  focus(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    this._unfocusAll();
    win.focused = true;
    win.zIndex = ++this._zCounter;
    win.el.classList.add('focused');
    win.el.style.setProperty('--wz', this._zCounter);

    processManager.touch(win.pid);
    if (win.proc.state === ProcessState.SUSPENDED || win.proc.state === ProcessState.SLEEPING) {
      processManager.wake(win.pid);
    }
    bus.emit('window:focused', { id: windowId });
  }

  minimize(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    win.state = 'minimized';
    win.el.classList.add('minimizing');

    const duration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mx-duration-slow')) || 300;
    setTimeout(() => {
      win.el.style.display = 'none';
      win.el.classList.remove('minimizing');
      processManager.suspend(win.pid); // Suspend process completely
      this._focusTopmost();
      bus.emit('window:minimized', { id: windowId });
    }, duration);
  }

  restore(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    win.state = 'normal';
    win.el.style.display = '';
    win.el.classList.remove('maximized', 'snapped-left', 'snapped-right');
    this.focus(windowId);
    bus.emit('window:restored', { id: windowId });
  }

  toggleMaximize(windowId) {
    const win = this.windows.get(windowId);
    if (!win) return;

    if (win.state === 'maximized') {
      win.state = 'normal';
      win.el.classList.remove('maximized');
      win.el.style.width = win.w + 'px';
      win.el.style.height = win.h + 'px';
      win.el.style.setProperty('--wx', win.x + 'px');
      win.el.style.setProperty('--wy', win.y + 'px');
    } else {
      win.state = 'maximized';
      win.el.classList.add('maximized');
      win.el.classList.remove('snapped-left', 'snapped-right');
    }
    bus.emit('window:maximized', { id: windowId, maximized: win.state === 'maximized' });
  }

  snap(windowId, side) {
    const win = this.windows.get(windowId);
    if (!win) return;

    win.state = `snapped-${side}`;
    win.el.classList.remove('maximized', 'snapped-left', 'snapped-right');
    win.el.classList.add(`snapped-${side}`);
    this.focus(windowId);
  }

  showSnapPreview(side) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this._snapPreview.classList.add('visible');

    if (side === 'left') {
      Object.assign(this._snapPreview.style, { left: '4px', top: '4px', width: (vw / 2 - 8) + 'px', height: (vh - 8) + 'px' });
    } else if (side === 'right') {
      Object.assign(this._snapPreview.style, { left: (vw / 2 + 4) + 'px', top: '4px', width: (vw / 2 - 8) + 'px', height: (vh - 8) + 'px' });
    } else if (side === 'top') {
      Object.assign(this._snapPreview.style, { left: '4px', top: '4px', width: (vw - 8) + 'px', height: (vh - 8) + 'px' });
    }
  }

  hideSnapPreview() {
    this._snapPreview.classList.remove('visible');
  }

  findByApp(appId) {
    for (const win of this.windows.values()) {
      if (win.appId === appId) return win;
    }
    return null;
  }

  toggle(appId) {
    const win = this.findByApp(appId);
    if (!win) return false;

    if (win.state === 'minimized') {
      this.restore(win.id);
    } else if (win.focused) {
      this.minimize(win.id);
    } else {
      this.focus(win.id);
    }
    return true;
  }

  _unfocusAll() {
    for (const win of this.windows.values()) {
      win.focused = false;
      win.el.classList.remove('focused');
    }
  }

  _focusTopmost() {
    let top = null;
    for (const win of this.windows.values()) {
      if (win.state === 'minimized') continue;
      if (!top || win.zIndex > top.zIndex) top = win;
    }
    if (top) this.focus(top.id);
  }

  _onProcessKilled(proc) {
    for (const [id, win] of this.windows) {
      if (win.pid === proc.pid) {
        win.el.remove();
        this.windows.delete(id);
        break;
      }
    }
  }
}

export const windowManager = new WindowManager();
export default windowManager;
