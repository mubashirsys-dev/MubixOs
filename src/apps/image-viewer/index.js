/* ═══════════════════════════════════════════
   MUBIX OS — Photos App (REAL)
   Interactive gallery, slideshow, and wallpaper manager.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';
import settings from '@services/settings.js';

export default class ImageViewerApp extends MubixApp {
  constructor() {
    super();
    this.images = [];
    this.currentIndex = -1;
    this.gridContainer = null;
    this.viewerContainer = null;
    this.activeView = 'grid'; // 'grid' or 'viewer'
  }

  async init(ctx) {
    await super.init(ctx);
    // If launched with a path, open directly in viewer mode
    if (ctx && ctx.path) {
      this.activeView = 'viewer';
      this.initialPath = ctx.path;
    }
  }

  async mount(container) {
    await super.mount(container);

    // Load custom styles
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/image-viewer/style.css' });
    container.appendChild(styleLink);

    // Top Action Bar
    const uploadInput = h('input', {
      type: 'file',
      accept: 'image/*',
      style: { display: 'none' },
      onChange: (e) => this.handleUpload(e)
    });

    const uploadBtn = h('button', {
      class: 'photo-btn photo-btn-accent',
      onClick: () => uploadInput.click()
    }, '📤 Upload Image');

    const backToGridBtn = h('button', {
      class: 'photo-btn',
      id: 'photo-back-btn',
      style: { display: this.activeView === 'viewer' ? 'inline-block' : 'none' },
      onClick: () => this.setView('grid')
    }, '◀ Gallery Grid');

    const toolbar = h('div', { class: 'photo-toolbar' },
      backToGridBtn,
      h('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px' } },
        uploadBtn,
        uploadInput
      )
    );

    // Views container
    this.gridContainer = h('div', { class: 'photo-grid-view' });
    this.viewerContainer = h('div', { class: 'photo-viewer-view', style: { display: 'none' } });

    const appUI = h('div', { class: 'photo-app-container' },
      toolbar,
      this.gridContainer,
      this.viewerContainer
    );

    container.appendChild(appUI);

    // Initial load
    await this.scanImages();
    
    if (this.activeView === 'viewer' && this.initialPath) {
      const idx = this.images.findIndex(img => img.path === this.initialPath);
      if (idx !== -1) {
        this.openViewer(idx);
      } else {
        // Fallback if the path is not found in seed
        await this.scanImages();
        this.setView('grid');
      }
    } else {
      this.setView('grid');
    }

    // Keyboard navigation for image viewer
    this.addListener(window, 'keydown', (e) => {
      if (this.activeView === 'viewer') {
        if (e.key === 'ArrowLeft') {
          this.navigate(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigate(1);
        }
      }
    });

    // Reactive VFS changes
    this.addListener(bus, 'vfs:changed', () => this.scanImages());
  }

  async scanImages() {
    try {
      const picturesPath = '/home/Pictures';
      if (!(await vfs.exists(picturesPath))) {
        await vfs.mkdir(picturesPath);
      }
      const files = await vfs.readdir(picturesPath);
      
      this.images = [];
      for (const f of files) {
        if (f.type === 'file' && (f.name.endsWith('.svg') || f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.jpeg') || f.name.endsWith('.gif'))) {
          this.images.push(f);
        }
      }
      this.renderGrid();
    } catch (e) {
      console.error('[ImageViewer] Error scanning images:', e);
    }
  }

  async renderGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    if (this.images.length === 0) {
      const emptyState = h('div', { class: 'photo-empty-state' },
        h('span', { style: { fontSize: '3rem', marginBottom: '10px', display: 'block' } }, '🖼️'),
        h('h3', {}, 'No Photos Found'),
        h('p', { class: 'text-tertiary', style: { fontSize: '0.8rem', marginTop: '4px' } }, 'Upload some PNG, JPG, or SVGs into MUBIX Pictures folder!')
      );
      this.gridContainer.appendChild(emptyState);
      return;
    }

    for (let i = 0; i < this.images.length; i++) {
      const img = this.images[i];
      const card = h('div', {
        class: 'photo-card',
        onClick: () => this.openViewer(i)
      });

      const previewThumb = h('div', { class: 'photo-card-thumb' });
      
      // Load thumb content async
      vfs.readFile(img.path).then(content => {
        let finalUrl = content;
        if (img.name.endsWith('.svg')) {
          finalUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
        }
        previewThumb.style.backgroundImage = `url("${finalUrl}")`;
      }).catch(err => {
        console.error(err);
      });

      const label = h('div', { class: 'photo-card-label' },
        h('span', { class: 'photo-card-title' }, img.name),
        h('span', { class: 'photo-card-size' }, this.formatBytes(img.size))
      );

      card.appendChild(previewThumb);
      card.appendChild(label);
      this.gridContainer.appendChild(card);
    }
  }

  async openViewer(index) {
    this.currentIndex = index;
    if (this.currentIndex < 0 || this.currentIndex >= this.images.length) return;
    this.setView('viewer');

    const img = this.images[this.currentIndex];
    this.viewerContainer.innerHTML = '';

    const imgViewport = h('div', { class: 'photo-viewport' });
    const imgEl = h('img', { class: 'photo-main-img' });

    // Load file content
    try {
      const content = await vfs.readFile(img.path);
      let srcUrl = content;
      if (img.name.endsWith('.svg')) {
        srcUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
      }
      imgEl.src = srcUrl;
    } catch (e) {
      console.error(e);
      imgEl.alt = 'Failed to load image content';
    }

    imgViewport.appendChild(imgEl);

    // Left/Right Controls
    const prevBtn = h('button', {
      class: 'photo-nav-arrow arrow-left',
      onClick: () => this.navigate(-1)
    }, '◀');
    const nextBtn = h('button', {
      class: 'photo-nav-arrow arrow-right',
      onClick: () => this.navigate(1)
    }, '▶');

    imgViewport.appendChild(prevBtn);
    imgViewport.appendChild(nextBtn);

    // Metadata & Sidebar actions
    const metadataPanel = h('div', { class: 'photo-metadata-panel' },
      h('h3', { class: 'photo-meta-title' }, img.name),
      h('div', { class: 'photo-meta-details' },
        h('div', { class: 'photo-meta-row' }, h('span', { class: 'meta-label' }, 'Path:'), h('span', { class: 'meta-val' }, img.path)),
        h('div', { class: 'photo-meta-row' }, h('span', { class: 'meta-label' }, 'Size:'), h('span', { class: 'meta-val' }, this.formatBytes(img.size))),
        h('div', { class: 'photo-meta-row' }, h('span', { class: 'meta-label' }, 'Modified:'), h('span', { class: 'meta-val' }, new Date(img.modifiedAt).toLocaleTimeString()))
      )
    );

    const actionPanel = h('div', { class: 'photo-action-panel' },
      h('button', {
        class: 'photo-btn photo-btn-accent',
        style: { width: '100%', marginBottom: '10px' },
        onClick: () => this.setWallpaper(img.path)
      }, '🖼️ Set Desktop Wallpaper'),
      h('button', {
        class: 'photo-btn',
        style: { width: '100%', color: 'var(--mx-red)', borderColor: 'rgba(239, 68, 68, 0.2)' },
        onClick: () => this.deleteImage(img.path)
      }, '🗑️ Delete Image')
    );

    const detailsSidebar = h('div', { class: 'photo-details-sidebar' },
      metadataPanel,
      actionPanel
    );

    this.viewerContainer.appendChild(imgViewport);
    this.viewerContainer.appendChild(detailsSidebar);

    // Update window title dynamically
    this.setTitle(`Photos - ${img.name}`);
  }

  navigate(direction) {
    if (this.images.length === 0) return;
    let nextIndex = this.currentIndex + direction;
    if (nextIndex < 0) nextIndex = this.images.length - 1;
    if (nextIndex >= this.images.length) nextIndex = 0;
    this.openViewer(nextIndex);
  }

  async setWallpaper(path) {
    await settings.set('wallpaper', path);
    bus.emit('notification:show', {
      title: 'Wallpaper Updated',
      message: 'Desktop background updated successfully!',
      icon: '🖼️',
      duration: 3000
    });
  }

  async deleteImage(path) {
    if (confirm('Are you sure you want to delete this image?')) {
      await vfs.delete(path);
      this.setView('grid');
      await this.scanImages();
      bus.emit('vfs:changed');
    }
  }

  setView(view) {
    this.activeView = view;
    const backBtn = $('#photo-back-btn', this.container);

    if (view === 'grid') {
      if (this.gridContainer) this.gridContainer.style.display = 'grid';
      if (this.viewerContainer) this.viewerContainer.style.display = 'none';
      if (backBtn) backBtn.style.display = 'none';
      this.setTitle('Photos');
    } else {
      if (this.gridContainer) this.gridContainer.style.display = 'none';
      if (this.viewerContainer) this.viewerContainer.style.display = 'flex';
      if (backBtn) backBtn.style.display = 'inline-block';
    }
  }

  async handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target.result;
        const picturesPath = `/home/Pictures/${file.name}`;
        await vfs.writeFile(picturesPath, fileContent, file.type);
        
        bus.emit('notification:show', {
          title: 'Photo Uploaded',
          message: `${file.name} saved to VFS successfully!`,
          icon: '📥',
          duration: 3000
        });

        bus.emit('vfs:changed');
        await this.scanImages();
      } catch (err) {
        console.error(err);
        alert('Failed to save file: ' + err.message);
      }
    };

    if (file.type.includes('svg')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }

  formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      activeView: this.activeView,
      currentIndex: this.currentIndex
    };
  }

  resume(state = null) {
    if (state) {
      this.activeView = state.activeView || 'grid';
      this.currentIndex = state.currentIndex || -1;
      this.scanImages().then(() => {
        if (this.activeView === 'viewer' && this.currentIndex !== -1) {
          this.openViewer(this.currentIndex);
        } else {
          this.setView('grid');
        }
      });
    }
  }
}
