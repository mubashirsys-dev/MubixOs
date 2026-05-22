/* ═══════════════════════════════════════════
   MUBIX OS — App Launcher
   Full-screen app grid overlay with search.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { h, $ } from '@utils/helpers.js';
import { APP_REGISTRY } from '@core/config.js';
import windowManager from '@ws/window-manager.js';

class Launcher {
  constructor() {
    this._el = null;
    this._searchInput = null;
    this._gridEl = null;
    this._open = false;
  }

  init() {
    const root = $('#mubix-root');

    // Search bar
    this._searchInput = h('input', {
      class: 'launcher-search-input',
      type: 'text',
      placeholder: 'Search apps...',
      onInput: (e) => this._filter(e.target.value),
    });

    // Grid
    this._gridEl = h('div', { class: 'launcher-grid' });

    // Overlay
    this._el = h('div', { id: 'launcher-overlay', class: 'll-launcher' },
      h('div', { class: 'launcher-search' }, this._searchInput),
      this._gridEl
    );

    root.appendChild(this._el);

    // Populate grid
    this._populateGrid();

    // Close on backdrop click
    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.hide();
    });

    // Keyboard shortcuts: Ctrl + Space and Alt double-tap (immersive overrides)
    let lastAltTime = 0;

    document.addEventListener('keydown', (e) => {
      // 1. Ctrl + Space toggles launcher
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        this.toggle();
        return;
      }

      // 2. Alt double-tap toggles launcher
      if (e.key === 'Alt') {
        const now = Date.now();
        if (now - lastAltTime < 250) {
          e.preventDefault();
          this.toggle();
          lastAltTime = 0; // Reset
        } else {
          lastAltTime = now;
        }
        return;
      }

      // 3. Escape key closes launcher
      if (e.key === 'Escape' && this._open) {
        e.preventDefault();
        this.hide();
      }
    });

    // Event bus
    bus.on('launcher:toggle', () => this.toggle());
    bus.on('launcher:hide', () => this.hide());
  }

  _populateGrid(filter = '') {
    this._gridEl.innerHTML = '';
    const query = filter.toLowerCase().trim();

    const apps = query
      ? APP_REGISTRY.filter(a =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
        )
      : APP_REGISTRY;

    for (const app of apps) {
      const card = h('div', {
        class: 'launcher-app',
        onClick: () => {
          windowManager.openWindow(app.id);
          this.hide();
        },
      },
        h('div', { class: 'launcher-app-icon' }, app.icon),
        h('div', { class: 'launcher-app-name' }, app.name)
      );
      this._gridEl.appendChild(card);
    }

    if (apps.length === 0) {
      this._gridEl.appendChild(
        h('div', { class: 'text-tertiary', style: { padding: '2rem', textAlign: 'center' } }, 'No apps found')
      );
    }
  }

  _filter(query) {
    this._populateGrid(query);
  }

  show() {
    this._open = true;
    this._el.classList.add('open');
    this._searchInput.value = '';
    this._populateGrid();
    requestAnimationFrame(() => this._searchInput.focus());
  }

  hide() {
    this._open = false;
    this._el.classList.remove('open');
    this._searchInput.blur();
  }

  toggle() {
    if (this._open) this.hide(); else this.show();
  }
}

export const launcher = new Launcher();
export default launcher;
