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
    this._batteryEl = null;
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

    // Battery widget
    this._batteryEl = h('div', { class: 'dock-battery', id: 'dock-battery' },
      h('span', { class: 'battery-icon' }, '🔋'),
      h('span', { class: 'battery-level', id: 'dock-battery-percent' }, '100%')
    );

    // Launcher button
    const launcherBtn = this._createDockItem({
      id: '__launcher',
      name: 'Apps',
      icon: '⊞',
    }, true);

    // Help Info Button (Leverages standard magnification & tooltip style)
    const infoBtn = h('div', {
      class: 'dock-item system-item',
      id: 'dock-info-btn',
      onClick: () => this.toggleOnboardingTooltip()
    },
      h('div', { class: 'dock-icon' }, 'ℹ️'),
      h('div', { class: 'dock-tooltip' }, 'System Help')
    );

    // Logout Shut Down Button (Leverages standard magnification & tooltip style)
    const logoutBtn = h('div', {
      class: 'dock-item system-item',
      id: 'dock-logout-btn',
      onClick: () => this.handleLogout()
    },
      h('div', { class: 'dock-icon', style: { color: 'var(--mx-red)' } }, '⏻'),
      h('div', { class: 'dock-tooltip' }, 'Exit OS')
    );

    // Dock bar
    this._dockEl = h('div', { id: 'dock', class: 'll-dock' },
      launcherBtn,
      h('div', { class: 'dock-separator' }),
      ...items,
      sep,
      this._batteryEl,
      h('div', { class: 'dock-separator' }),
      infoBtn,
      logoutBtn,
      h('div', { class: 'dock-separator' }),
      this._clockEl
    );

    // Create the onboarding tooltip element with precise shortcut guidance
    this._tooltipEl = h('div', { class: 'mubix-onboarding-tooltip' },
      h('span', { class: 'tooltip-icon' }, '💡'),
      h('span', {}, 'Press Ctrl + Space to open system launcher. Press ESC or click Exit to exit.')
    );

    // Container
    this._el = h('div', { id: 'dock-container' }, this._dockEl, this._tooltipEl);
    root.appendChild(this._el);

    // Dock magnification — handled via CSS hover + JS for neighbors
    this._setupMagnification();

    // Clock update
    this._updateClock();
    this._clockInterval = setInterval(() => this._updateClock(), 30000);

    // Battery init
    this._initBattery();

    // Listen for dock updates
    bus.on('dock:update', () => this._updateRunningIndicators());

    // First-time onboarding floating tip trigger
    setTimeout(() => {
      const isFirst = !localStorage.getItem('mubix_os_onboarded');
      if (isFirst) {
        this.showOnboardingTooltip();
        localStorage.setItem('mubix_os_onboarded', 'true');
        setTimeout(() => this.hideOnboardingTooltip(), 6000);
      }
    }, 1500);
  }

  async _initBattery() {
    if (!navigator.getBattery) {
      if (this._batteryEl) this._batteryEl.style.display = 'none';
      return;
    }
    try {
      const battery = await navigator.getBattery();
      const updateBattery = () => {
        const pct = Math.round(battery.level * 100);
        const isCharging = battery.charging;
        const percentEl = $('#dock-battery-percent');
        const iconEl = this._batteryEl?.querySelector('.battery-icon');
        
        if (percentEl) percentEl.textContent = `${pct}%`;
        
        if (isCharging) {
          if (iconEl) iconEl.textContent = '⚡';
          this._batteryEl.classList.add('charging');
          this._batteryEl.classList.remove('low-battery');
        } else {
          if (iconEl) iconEl.textContent = pct <= 20 ? '🪫' : '🔋';
          this._batteryEl.classList.remove('charging');
          if (pct <= 20) {
            this._batteryEl.classList.add('low-battery');
            bus.emit('notification:show', {
              title: 'Low Battery Alert',
              message: `System battery level at ${pct}%. Connect charger.`,
              icon: '🪫',
              duration: 5000
            });
          } else {
            this._batteryEl.classList.remove('low-battery');
          }
        }
      };
      
      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
      updateBattery();
    } catch(err) {
      console.warn('Battery status not accessible:', err);
    }
  }

  _createDockItem(config, isLauncher = false) {
    const icon = h('div', { class: 'dock-icon' }, config.icon);
    const tooltip = h('div', { class: 'dock-tooltip' }, config.name);
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
    }, icon, tooltip, indicator);

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

  showOnboardingTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.classList.add('visible');
    }
  }

  hideOnboardingTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.classList.remove('visible');
    }
  }

  toggleOnboardingTooltip() {
    if (this._tooltipEl) {
      this._tooltipEl.classList.toggle('visible');
    }
  }

  async handleLogout() {
    // 1. Sleek fade-out shutdown overlay
    const overlay = h('div', { class: 'mubix-shutdown-overlay' });
    document.body.appendChild(overlay);
    
    // Trigger transition
    void overlay.offsetWidth;
    overlay.style.opacity = '1';

    // 2. Delay for shutting down transition
    setTimeout(async () => {
      // 3. Exit Fullscreen Mode
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('Failed to exit fullscreen:', err);
      }

      // 4. Return to portfolio
      window.location.href = '/';
    }, 1200);
  }

  destroy() {
    if (this._clockInterval) clearInterval(this._clockInterval);
    this._el?.remove();
  }
}

export const dock = new Dock();
export default dock;
