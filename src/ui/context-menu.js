/* ═══════════════════════════════════════════
   MUBIX OS — Context Menu
   Right-click context menus.
   ═══════════════════════════════════════════ */

import { h, $ } from '@utils/helpers.js';

class ContextMenu {
  constructor() {
    this._el = null;
  }

  init() {
    this._el = h('div', { id: 'context-menu', class: 'll-menu' });
    $('#mubix-root').appendChild(this._el);

    // Dismiss on click anywhere
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', () => this.hide());
    window.addEventListener('blur', () => this.hide());
  }

  /**
   * Show context menu at position.
   * @param {number} x
   * @param {number} y
   * @param {Array} items - [{ label, icon, action, type, shortcut }]
   */
  show(x, y, items) {
    this._el.innerHTML = '';

    for (const item of items) {
      if (item.type === 'separator') {
        this._el.appendChild(h('div', { class: 'ctx-separator' }));
        continue;
      }

      const el = h('div', {
        class: 'ctx-item',
        onClick: (e) => {
          e.stopPropagation();
          this.hide();
          item.action?.();
        }
      },
        h('span', { class: 'ctx-item-icon' }, item.icon || ''),
        h('span', { class: 'ctx-item-label' }, item.label),
        item.shortcut ? h('span', { class: 'ctx-item-shortcut' }, item.shortcut) : null
      );
      this._el.appendChild(el);
    }

    // Position — keep within viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const menuW = 200; // approximate
    const menuH = items.length * 34;

    const posX = (x + menuW > vw) ? x - menuW : x;
    const posY = (y + menuH > vh) ? y - menuH : y;

    this._el.style.left = Math.max(0, posX) + 'px';
    this._el.style.top = Math.max(0, posY) + 'px';
    this._el.classList.add('visible');
  }

  hide() {
    this._el?.classList.remove('visible');
  }
}

export const contextMenu = new ContextMenu();
export default contextMenu;
