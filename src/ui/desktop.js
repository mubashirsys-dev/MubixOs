/* ═══════════════════════════════════════════
   MUBIX OS — Reactive Desktop Surface
   Autosyncs icons with /home/Desktop changes.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { h, $ } from '@utils/helpers.js';
import windowManager from '@ws/window-manager.js';
import { contextMenu } from '@ui/context-menu.js';
import vfs from '@fs/vfs.js';
import settings from '@services/settings.js';

class Desktop {
  constructor() {
    this._el = null;
    this._iconsContainer = null;
  }

  async init() {
    const root = $('#mubix-root');

    this._iconsContainer = h('div', { class: 'desktop-icons', id: 'desktop-icons' });

    // Build desktop DOM
    this._el = h('div', { id: 'desktop' },
      h('div', { id: 'wallpaper' }),
      h('div', { id: 'desktop-content' },
        this._iconsContainer,
        h('div', { id: 'window-layer' })
      )
    );

    root.appendChild(this._el);

    // Initial desktop populate
    await this.syncDesktopIcons();

    // Initial wallpaper load
    const initialWp = settings.get('wallpaper') || '/bg.png';
    this.applyWallpaper(initialWp);

    // Setup reactive VFS listeners
    bus.on('vfs:changed', async () => {
      await this.syncDesktopIcons();
    });

    // Reactive wallpaper listener
    bus.on('settings:changed:wallpaper', (wallpaper) => {
      this.applyWallpaper(wallpaper);
    });

    // Right-click context menu
    this._el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (e.target.closest('.mx-window') || e.target.closest('#dock')) return;
      contextMenu.show(e.clientX, e.clientY, [
        { label: 'Create File', icon: '📄', action: () => this.promptCreateFile() },
        { label: 'Create Folder', icon: '📁', action: () => this.promptCreateFolder() },
        { type: 'separator' },
        { label: 'Open Terminal', icon: '⌨️', action: () => windowManager.openWindow('terminal') },
        { label: 'System Diagnostics', icon: '⚙️', action: () => windowManager.openWindow('settings') },
      ]);
    });

    this._el.addEventListener('click', (e) => {
      if (e.target.closest('.mx-window') || e.target.closest('#dock')) return;
      contextMenu.hide();
    });
  }

  /**
   * Synchronize Desktop icons directly from the VFS directory
   */
  async syncDesktopIcons() {
    if (!this._iconsContainer) return;
    this._iconsContainer.innerHTML = '';

    try {
      const path = '/home/Desktop';
      const items = await vfs.readdir(path);

      // Build desktop icon for each item
      for (const item of items) {
        const isDir = item.type === 'directory';
        const iconUnicode = isDir ? '📁' : this._getFileIcon(item.name);

        const el = h('div', {
          class: 'desktop-icon',
          onDblclick: () => this.handleOpen(item),
          contextmenu: (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.showIconContextMenu(e.clientX, e.clientY, item);
          }
        },
          h('div', { class: 'icon' }, iconUnicode),
          h('div', { class: 'label' }, item.name)
        );
        this._iconsContainer.appendChild(el);
      }
    } catch (e) {
      console.error('[Desktop Sync Error]', e);
    }
  }

  _getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'md' || ext === 'json') return '📄';
    return '📦';
  }

  async handleOpen(item) {
    if (item.type === 'directory') {
      // Open in File Manager at that specific path
      windowManager.openWindow('file-manager', { path: item.path });
    } else {
      // If text/doc, open inside notepad
      windowManager.openWindow('notepad', { path: item.path });
    }
  }

  showIconContextMenu(x, y, item) {
    contextMenu.show(x, y, [
      { label: `Open ${item.name}`, icon: '⚡', action: () => this.handleOpen(item) },
      { label: 'Rename', icon: '✏️', action: () => this.promptRename(item) },
      { label: 'Delete', icon: '🗑️', action: () => this.deleteItem(item) },
    ]);
  }

  async promptCreateFile() {
    const name = prompt('Enter file name:');
    if (!name) return;
    try {
      await vfs.writeFile(`/home/Desktop/${name}`, '');
      bus.emit('vfs:changed');
    } catch(e) {
      alert(e.message);
    }
  }

  async promptCreateFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;
    try {
      await vfs.mkdir(`/home/Desktop/${name}`);
      bus.emit('vfs:changed');
    } catch(e) {
      alert(e.message);
    }
  }

  async promptRename(item) {
    const newName = prompt('Enter new name:', item.name);
    if (!newName) return;
    try {
      const parent = vfs.parentPath(item.path);
      await vfs.rename(item.path, `${parent}/${newName}`);
      bus.emit('vfs:changed');
    } catch(e) {
      alert(e.message);
    }
  }

  async deleteItem(item) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      await vfs.delete(item.path);
      bus.emit('vfs:changed');
    }
  }

  applyWallpaper(wallpaper) {
    const wpEl = $('#wallpaper', this._el);
    if (!wpEl) return;
    
    // Clear previous background
    wpEl.style.background = '';
    wpEl.innerHTML = '';
    
    const buildMeshWallpaper = () => {
      const mesh = h('div', { class: 'wallpaper-mesh' });
      mesh.appendChild(h('div', { class: 'mubix-shape shape-circle' }));
      mesh.appendChild(h('div', { class: 'mubix-shape shape-square' }));
      mesh.appendChild(h('div', { class: 'mubix-shape shape-triangle' }));
      mesh.appendChild(h('div', { class: 'mubix-circuit circuit-1' }));
      mesh.appendChild(h('div', { class: 'mubix-circuit circuit-2' }));
      return mesh;
    };

    if (wallpaper === 'mesh') {
      wpEl.appendChild(buildMeshWallpaper());
    } else if (wallpaper && (wallpaper.startsWith('/') || wallpaper.startsWith('data:') || wallpaper.startsWith('http'))) {
      if (wallpaper.startsWith('/') && wallpaper !== '/bg.png') {
        vfs.readFile(wallpaper).then(content => {
          if (wallpaper.endsWith('.svg')) {
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
            wpEl.style.background = `url("${dataUrl}") center/cover no-repeat`;
          } else {
            wpEl.style.background = `url("${content}") center/cover no-repeat`;
          }
        }).catch(e => {
          console.error('[Desktop] Failed to load wallpaper from VFS:', e);
          wpEl.appendChild(buildMeshWallpaper());
        });
      } else {
        wpEl.style.background = `url("${wallpaper}") center/cover no-repeat`;
      }
    } else {
      wpEl.appendChild(buildMeshWallpaper());
    }
  }
}

export const desktop = new Desktop();
export default desktop;
