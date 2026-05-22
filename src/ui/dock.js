/* ═══════════════════════════════════════════
   MUBIX OS — Dock
   Floating taskbar with magnification.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { h, $ } from '@utils/helpers.js';
import { DOCK_APPS, getAppConfig } from '@core/config.js';
import windowManager from '@ws/window-manager.js';
import { processManager } from '@kernel/process-manager.js';

class Dock {
  constructor() {
    this._el = null;
    this._dockEl = null;
    this._clockEl = null;
    this._clockInterval = null;
  }

  init() {
    const root = $('#mubix-root');

    // Build dock items
    const items = DOCK_APPS.map(appId => {
      const config = getAppConfig(appId);
      if (!config) return null;
      return this._createDockItem(config);
    }).filter(Boolean);

    // Separator
    const sep = h('div', { class: 'dock-separator' });

    // Clock
    this._clockEl = h('div', { class: 'dock-clock' },
      h('span', { class: 'dock-clock-time', id: 'dock-time' }),
      h('span', { class: 'dock-clock-date', id: 'dock-date' })
    );

    // Launcher button
    const launcherBtn = this._createDockItem({
      id: '__launcher',
      name: 'Apps',
      icon: '⊞',
    }, true);

    // Dock bar
    this._dockEl = h('div', { id: 'dock', class: 'll-dock' },
      launcherBtn,
      h('div', { class: 'dock-separator' }),
      ...items,
      sep,
      this._clockEl
    );

    // Container
    this._el = h('div', { id: 'dock-container' }, this._dockEl);
    root.appendChild(this._el);

    // Dock magnification — handled via CSS hover + JS for neighbors
    this._setupMagnification();

    // Clock update
    this._updateClock();
    this._clockInterval = setInterval(() => this._updateClock(), 30000);

    // Listen for dock updates
    bus.on('dock:update', () => this._updateRunningIndicators());
  }

  _createDockItem(config, isLauncher = false) {
    const icon = h('div', { class: 'dock-icon' }, config.icon);
    const indicator = h('div', { class: 'dock-indicator' });

    const item = h('div', {
      class: 'dock-item',
      dataset: { appId: config.id },
      onClick: () => {
        if (isLauncher) {
          bus.emit('launcher:toggle');
          return;
        }
        // Try to toggle existing window, else open new
        if (!windowManager.toggle(config.id)) {
          windowManager.openWindow(config.id);
        }
      },
    }, icon, indicator);

    return item;
  }

  _setupMagnification() {
    const items = this._dockEl.querySelectorAll('.dock-item');

    this._dockEl.addEventListener('pointermove', (e) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const dist = Math.abs(e.clientX - itemCenter);

        // Mark immediate center focus and immediate neighbor nodes
        if (dist < 45) {
          item.setAttribute('data-near', '0');
        } else if (dist < 85) {
          item.setAttribute('data-near', '1');
        } else {
          item.removeAttribute('data-near');
        }
      }
    });

    this._dockEl.addEventListener('pointerleave', () => {
      for (const item of items) {
        item.removeAttribute('data-near');
      }
    });
  }

  _updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const timeEl = $('#dock-time');
    const dateEl = $('#dock-date');
    if (timeEl) timeEl.textContent = time;
    if (dateEl) dateEl.textContent = date;
  }

  _updateRunningIndicators() {
    const items = this._dockEl.querySelectorAll('.dock-item[data-app-id]');
    for (const item of items) {
      const appId = item.dataset.appId;
      if (appId === '__launcher') continue;
      const procs = processManager.findByApp(appId);
      if (procs.length > 0) {
        item.classList.add('running');
      } else {
        item.classList.remove('running');
      }
    }
  }

  destroy() {
    if (this._clockInterval) clearInterval(this._clockInterval);
    this._el?.remove();
  }
}

export const dock = new Dock();
export default dock;
