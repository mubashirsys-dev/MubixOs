/* ═══════════════════════════════════════════
   MUBIX OS — File Manager App (REAL)
   Virtual Filesystem explorer with exact lifecycle hooks.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';
import windowManager from '@ws/window-manager.js';
import { contextMenu } from '@ui/context-menu.js';

export default class FileManagerApp extends MubixApp {
  constructor() {
    super();
    this.currentPath = '/home';
    this.gridEl = null;
    this.pathBarEl = null;
  }

  async init(ctx) {
    await super.init(ctx);
    if (ctx && ctx.path) {
      this.currentPath = ctx.path;
    }
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/file-manager/style.css' });
    container.appendChild(styleLink);

    // Sidebar items mapping PLACES shortcuts
    const sidebarItems = [
      { label: '🏠 Home', path: '/home' },
      { label: '🖥️ Desktop', path: '/home/Desktop' },
      { label: '📂 Documents', path: '/home/Documents' },
      { label: '📥 Downloads', path: '/home/Downloads' },
      { label: '🖼️ Pictures', path: '/home/Pictures' }
    ];

    const sidebar = h('div', { class: 'fm-sidebar' },
      h('div', { class: 'fm-sidebar-title' }, 'PLACES'),
      h('div', { class: 'fm-sidebar-list' },
        sidebarItems.map(item => h('button', {
          class: `fm-sidebar-item ${this.currentPath === item.path ? 'active' : ''}`,
          onClick: async () => {
            this.currentPath = item.path;
            await this.renderDirectory();
          }
        }, item.label))
      )
    );

    // Toolbar Elements
    const backBtn = h('button', {
      class: 'fm-btn',
      onClick: () => this.navigateUp()
    }, '⬆️ Up');

    const newFileBtn = h('button', {
      class: 'fm-btn fm-btn-accent',
      onClick: () => this.createNewFile()
    }, '📄 New File');

    const newFolderBtn = h('button', {
      class: 'fm-btn fm-btn-accent',
      onClick: () => this.createNewFolder()
    }, '📁 New Folder');

    this.pathBarEl = h('div', { class: 'fm-path-bar' }, this.currentPath);

    const toolbar = h('div', { class: 'fm-toolbar' },
      backBtn,
      newFileBtn,
      newFolderBtn,
      this.pathBarEl
    );

    this.gridEl = h('div', { class: 'fm-content' });

    const mainArea = h('div', { class: 'fm-main-area' },
      toolbar,
      this.gridEl
    );

    const fmUI = h('div', { class: 'fm-container' },
      sidebar,
      mainArea
    );

    container.appendChild(fmUI);

    // Render folder items
    await this.renderDirectory();

    // Listen to virtual filesystem updates safely via standard MubixApp listeners
    this.addListener(bus, 'vfs:changed', async () => {
      await this.renderDirectory();
    });
  }

  async renderDirectory() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    if (this.pathBarEl) this.pathBarEl.textContent = this.currentPath;

    // Update active sidebar item
    if (this.container) {
      const items = this.container.querySelectorAll('.fm-sidebar-item');
      items.forEach(btn => {
        const itemText = btn.textContent.toLowerCase();
        const baseName = this.currentPath.split('/').pop().toLowerCase();
        if (itemText.includes(baseName) || (baseName === 'home' && itemText.includes('home'))) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    try {
      const items = await vfs.readdir(this.currentPath);

      if (items.length === 0) {
        this.gridEl.appendChild(h('div', { class: 'fm-empty' }, 'This folder is empty'));
        return;
      }

      for (const item of items) {
        const isDir = item.type === 'directory';
        const icon = isDir ? '📁' : this._getFileIcon(item.name);

        const card = h('div', {
          class: 'fm-item',
          onDblclick: () => this.handleOpen(item),
          onContextmenu: (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY, item);
          }
        },
          h('div', { class: 'fm-item-icon' }, icon),
          h('div', { class: 'fm-item-name' }, item.name)
        );
        this.gridEl.appendChild(card);
      }
    } catch (e) {
      this.gridEl.appendChild(h('div', { class: 'fm-empty', style: { color: 'var(--mx-red)' } }, `Error: ${e.message}`));
    }
  }

  _getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'md' || ext === 'json') return '📄';
    return '📦';
  }

  async handleOpen(item) {
    if (item.type === 'directory') {
      this.currentPath = item.path;
      await this.renderDirectory();
    } else {
      // Direct Notepad routing
      windowManager.openWindow('notepad', { path: item.path });
    }
  }

  async navigateUp() {
    const parent = vfs.parentPath(this.currentPath);
    if (parent) {
      this.currentPath = parent;
      await this.renderDirectory();
    }
  }

  async createNewFile() {
    const name = prompt('File name:');
    if (!name) return;
    try {
      await vfs.writeFile(`${this.currentPath}/${name}`, '');
      await this.renderDirectory();
    } catch (e) {
      alert(e.message);
    }
  }

  async createNewFolder() {
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      await vfs.mkdir(`${this.currentPath}/${name}`);
      await this.renderDirectory();
    } catch (e) {
      alert(e.message);
    }
  }

  showContextMenu(x, y, item) {
    contextMenu.show(x, y, [
      { label: 'Open', icon: '⚡', action: () => this.handleOpen(item) },
      { label: 'Rename', icon: '✏️', action: () => this.renameItem(item) },
      { label: 'Delete', icon: '🗑️', action: () => this.deleteItem(item) },
    ]);
  }

  async renameItem(item) {
    const newName = prompt('New name:', item.name);
    if (!newName) return;
    try {
      await vfs.rename(item.path, `${this.currentPath}/${newName}`);
      await this.renderDirectory();
    } catch (e) {
      alert(e.message);
    }
  }

  async deleteItem(item) {
    if (confirm(`Delete ${item.name}?`)) {
      try {
        await vfs.delete(item.path);
        await this.renderDirectory();
      } catch (e) {
        alert(e.message);
      }
    }
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return { currentPath: this.currentPath };
  }

  resume(state = null) {
    if (state) {
      this.currentPath = state.currentPath || '/home';
      this.renderDirectory();
    }
  }

  destroy() {
    super.destroy();
  }
}
