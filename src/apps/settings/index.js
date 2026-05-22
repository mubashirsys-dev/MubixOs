/* ═══════════════════════════════════════════
   MUBIX OS — Settings App (REAL)
   System customization controls with exact lifecycle structure.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import settingsService from '@services/settings.js';
import theme from '@services/theme.js';
import perf from '@kernel/performance.js';
import processManager from '@kernel/process-manager.js';
import memoryManager from '@kernel/memory-manager.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';

export default class SettingsApp extends MubixApp {
  constructor() {
    super();
    this.bodyEl = null;
    this.diagInterval = null;
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/settings/style.css' });
    container.appendChild(styleLink);

    // Sidebar navigation items
    const tabs = [
      { name: '⚙️ General', action: () => this.showGeneral() },
      { name: '📊 Diagnostics', action: () => this.showDiagnostics() },
      { name: '💾 Storage', action: () => this.showStorage() },
    ];

    const sidebar = h('div', { class: 'settings-sidebar' });
    for (const tab of tabs) {
      const btn = h('button', {
        class: 'settings-tab-btn',
        onClick: (e) => {
          sidebar.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          tab.action();
        }
      }, tab.name);
      sidebar.appendChild(btn);
    }
    sidebar.firstChild.classList.add('active');

    this.bodyEl = h('div', { class: 'settings-body' });

    const settingsUI = h('div', { class: 'settings-container' },
      sidebar,
      this.bodyEl
    );

    container.appendChild(settingsUI);

    // Show initial view
    this.showGeneral();
  }

  showGeneral() {
    this.stopDiagnosticsLoop();
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    // ── Transparency Slider ──
    const transRange = h('input', {
      type: 'range',
      min: '0.4',
      max: '1.0',
      step: '0.05',
      class: 'settings-slider',
      value: settingsService.get('transparency') ?? 0.95,
      onInput: (e) => {
        const val = parseFloat(e.target.value);
        settingsService.set('transparency', val);
      }
    });

    // ── Dock Scaling Slider ──
    const dockRange = h('input', {
      type: 'range',
      min: '0.8',
      max: '1.4',
      step: '0.1',
      class: 'settings-slider',
      value: settingsService.get('dockScale') ?? 1,
      onInput: (e) => {
        const val = parseFloat(e.target.value);
        settingsService.set('dockScale', val);
      }
    });

    // ── Desktop Icon Size ──
    const iconSizeSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => settingsService.set('desktopIconSize', e.target.value)
    },
      h('option', { value: 'small', selected: settingsService.get('desktopIconSize') === 'small' }, 'Small (Compact)'),
      h('option', { value: 'medium', selected: (settingsService.get('desktopIconSize') || 'medium') === 'medium' }, 'Medium (Default)'),
      h('option', { value: 'large', selected: settingsService.get('desktopIconSize') === 'large' }, 'Large (Prominent)')
    );

    // ── Battery Saver Checkbox ──
    const batteryToggle = h('input', {
      type: 'checkbox',
      class: 'settings-checkbox',
      checked: settingsService.get('batterySaver') === true,
      onChange: (e) => {
        const val = e.target.checked;
        settingsService.set('batterySaver', val);
        if (val) {
          perf.setTier(1);
          settingsService.set('animationsIntensity', 'none');
        } else {
          perf.setTier(3);
          settingsService.set('animationsIntensity', 'normal');
        }
        this.showGeneral();
      }
    });

    const perfSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => perf.setTier(parseInt(e.target.value))
    },
      h('option', { value: '3', selected: perf.tier === 3 }, 'Normal (Tier 3)'),
      h('option', { value: '2', selected: perf.tier === 2 }, 'Reduced (Tier 2)'),
      h('option', { value: '1', selected: perf.tier === 1 }, 'Battery Saver (Tier 1)')
    );

    const animSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => {
        const val = e.target.value;
        settingsService.set('animationsIntensity', val);
      }
    },
      h('option', { value: 'normal', selected: (settingsService.get('animationsIntensity') || 'normal') === 'normal' }, 'Playful (Normal)'),
      h('option', { value: 'low', selected: settingsService.get('animationsIntensity') === 'low' }, 'Gentle (Low)'),
      h('option', { value: 'none', selected: settingsService.get('animationsIntensity') === 'none' }, 'Static (No Motion)')
    );

    const accentColors = [
      { name: 'Mubix Violet', value: '#8B5CF6' },
      { name: 'Mubix Coral', value: '#FF6B6B' },
      { name: 'Mubix Amber', value: '#FBBF24' },
      { name: 'Mubix Emerald', value: '#10B981' }
    ];
    const currentAccent = settingsService.get('accent_color') || '#8B5CF6';
    const accentSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => settingsService.set('accent_color', e.target.value)
    },
      accentColors.map(ac => h('option', { value: ac.value, selected: currentAccent === ac.value }, ac.name))
    );

    const gridSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => settingsService.set('grid_visible', e.target.value === 'true')
    },
      h('option', { value: 'true', selected: settingsService.get('grid_visible') !== false }, 'Visible'),
      h('option', { value: 'false', selected: settingsService.get('grid_visible') === false }, 'Hidden')
    );

    // Wallpaper Selection Grid
    const presetWallpapers = [
      { id: 'mubix_brand', name: 'Premium Brand', path: '/bg.png' },
      { id: 'mesh', name: 'Animated Mesh', path: 'mesh' },
      { id: 'neon_grid', name: 'Neon Grid Vector', path: '/home/Pictures/neon_grid.svg' },
      { id: 'cyber_sunset', name: 'Sunset Vector', path: '/home/Pictures/cyber_sunset.svg' },
      { id: 'matrix_os', name: 'Matrix OS Grid', path: '/home/Pictures/matrix_os.svg' }
    ];

    const pickerContainer = h('div', { class: 'settings-wallpaper-picker' });

    presetWallpapers.forEach(wp => {
      const activeWallpaper = settingsService.get('wallpaper') || '/bg.png';
      const isActive = activeWallpaper === wp.path;

      const card = h('div', {
        class: `wallpaper-card ${isActive ? 'active' : ''}`,
        onClick: async () => {
          pickerContainer.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          await settingsService.set('wallpaper', wp.path);
          bus.emit('desktop:wallpaper-changed', wp.path);
        }
      });

      const thumbPreview = h('div', { class: 'wallpaper-card-thumb' });
      if (wp.path === 'mesh') {
        thumbPreview.style.background = 'linear-gradient(135deg, #F8F5EE 0%, #F0EDE5 100%)';
        const meshIndicator = h('div', {
          style: {
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(var(--mx-accent-glow) 1px, transparent 1px)',
            backgroundSize: '8px 8px',
            opacity: 0.5
          }
        });
        thumbPreview.appendChild(meshIndicator);
      } else if (wp.path === '/bg.png') {
        thumbPreview.style.backgroundImage = 'url("/bg.png")';
        thumbPreview.style.backgroundSize = 'cover';
        thumbPreview.style.backgroundPosition = 'center';
      } else {
        vfs.readFile(wp.path).then(content => {
          const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;
          thumbPreview.style.backgroundImage = `url("${url}")`;
        }).catch(err => {
          console.warn(`[Settings] Thumb load failed: ${wp.path}`, err);
        });
      }

      const label = h('div', { class: 'wallpaper-card-label' }, wp.name);
      card.appendChild(thumbPreview);
      card.appendChild(label);
      pickerContainer.appendChild(card);
    });

    const uploadInput = h('input', {
      type: 'file',
      accept: 'image/*',
      style: { display: 'none' },
      onChange: async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const dataUrl = event.target.result;
            const filename = `/home/Pictures/${file.name}`;
            
            if (!(await vfs.exists('/home/Pictures'))) {
              await vfs.mkdir('/home/Pictures');
            }

            await vfs.writeFile(filename, dataUrl, file.type);
            bus.emit('vfs:changed');

            await settingsService.set('wallpaper', filename);
            bus.emit('desktop:wallpaper-changed', filename);

            this.showGeneral();
          } catch (err) {
            alert('Upload failed: ' + err.message);
          }
        };

        reader.readAsDataURL(file);
      }
    });

    const uploadBtn = h('button', {
      class: 'fm-btn',
      style: { marginTop: '8px', background: 'var(--mx-accent)', border: 'none', color: '#fff' },
      onClick: () => uploadInput.click()
    }, '📤 Upload Custom Image');

    const wallpaperRow = h('div', {
      class: 'settings-wallpaper-row',
      style: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: 'var(--mx-space-sm) 0' }
    },
      h('div', { class: 'settings-label-group' },
        h('span', { class: 'settings-label' }, 'Desktop Wallpaper'),
        h('span', { class: 'settings-desc' }, 'Select a premium vector backdrop preset or upload custom images.')
      ),
      pickerContainer,
      uploadBtn,
      uploadInput
    );

    const sections = [
      h('div', { class: 'settings-section-title' }, 'Personalization & Layout'),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Branding Accent Color'),
          h('span', { class: 'settings-desc' }, 'Choose primary accent highlight color.')
        ),
        accentSelect
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Interface Transparency'),
          h('span', { class: 'settings-desc' }, 'Control acrylic surface window glass opacity level.')
        ),
        transRange
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Dock Magnification Scale'),
          h('span', { class: 'settings-desc' }, 'Resize system Dock panel bar size.')
        ),
        dockRange
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Desktop Icon Size'),
          h('span', { class: 'settings-desc' }, 'Configure grid layout size of icons.')
        ),
        iconSizeSelect
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Dotted Backdrop Grid'),
          h('span', { class: 'settings-desc' }, 'Toggle dotted tech pattern presence.')
        ),
        gridSelect
      ),
      wallpaperRow,

      h('div', { class: 'settings-section-title' }, 'Performance & Motion'),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Animations Intensity'),
          h('span', { class: 'settings-desc' }, 'Adjust speed scale of visual micro-animations.')
        ),
        animSelect
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Battery Saver Mode'),
          h('span', { class: 'settings-desc' }, 'Enforces Tier 1 rendering to reduce CPU load.')
        ),
        batteryToggle
      ),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Hardware Graphics Tier'),
          h('span', { class: 'settings-desc' }, 'Current performance profiling level.')
        ),
        perfSelect
      ),
    ];

    sections.forEach(s => this.bodyEl.appendChild(s));
  }

  showDiagnostics() {
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    const cpuVal = h('span', { class: 'diag-val' }, `${perf.cores} Cores`);
    const heapVal = h('span', { class: 'diag-val' }, '0 MB');
    const pressureVal = h('span', { class: 'diag-val' }, 'Normal');
    const processesVal = h('span', { class: 'diag-val' }, '0 running');

    const diagGrid = h('div', { class: 'diag-grid' },
      h('div', { class: 'diag-item' }, h('span', { class: 'settings-desc' }, 'CPU Cores Detected'), cpuVal),
      h('div', { class: 'diag-item' }, h('span', { class: 'settings-desc' }, 'JS Heap Usage'), heapVal),
      h('div', { class: 'diag-item' }, h('span', { class: 'settings-desc' }, 'Memory Pressure'), pressureVal),
      h('div', { class: 'diag-item' }, h('span', { class: 'settings-desc' }, 'Active PID Processes'), processesVal)
    );

    this.bodyEl.appendChild(h('div', { class: 'settings-section-title' }, 'Diagnostics Monitor'));
    this.bodyEl.appendChild(diagGrid);

    // Live update loop
    const updateStats = () => {
      const mem = memoryManager.getSystemMemory();
      if (mem) {
        heapVal.textContent = `${Math.round(mem.usedJSHeap)} MB / ${Math.round(mem.limit)} MB`;
      } else {
        heapVal.textContent = 'Heuristic Only';
      }

      pressureVal.textContent = memoryManager.isUnderPressure() ? 'HIGH' : 'Normal';
      pressureVal.style.color = memoryManager.isUnderPressure() ? 'var(--mx-red)' : 'var(--mx-green)';

      const procs = processManager.getAll();
      processesVal.textContent = `${procs.length} processes`;
    };

    updateStats();
    this.diagInterval = this.addInterval(updateStats, 1000);
  }

  showStorage() {
    this.stopDiagnosticsLoop();
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    const formatBtn = h('button', {
      class: 'fm-btn',
      style: { background: 'var(--mx-red)', border: 'none', color: '#fff' },
      onClick: () => this.formatVfs()
    }, 'Format VFS Database');

    const sections = [
      h('div', { class: 'settings-section-title' }, 'Storage Manager'),
      h('div', { class: 'settings-row' },
        h('div', { class: 'settings-label-group' },
          h('span', { class: 'settings-label' }, 'Virtual Filesystem Wipe'),
          h('span', { class: 'settings-desc' }, 'Reset the system Virtual Filesystem back to pristine factory settings.')
        ),
        formatBtn
      )
    ];

    sections.forEach(s => this.bodyEl.appendChild(s));
  }

  stopDiagnosticsLoop() {
    if (this.diagInterval) {
      clearInterval(this.diagInterval);
      this.diagInterval = null;
    }
  }

  async formatVfs() {
    if (confirm('Format system files? This will clear all welcome files, settings, and documents.')) {
      const req = indexedDB.deleteDatabase('mubix-fs');
      req.onsuccess = () => {
        alert('Format complete. Rebooting system shell...');
        window.location.reload();
      };
    }
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    this.stopDiagnosticsLoop();
    super.suspend();
  }

  resume(state = null) {
    // Redraw diagnostics if active
    const activeTab = $('.settings-tab-btn.active');
    if (activeTab && activeTab.textContent.includes('Diagnostics')) {
      this.showDiagnostics();
    }
  }

  destroy() {
    this.stopDiagnosticsLoop();
    super.destroy();
  }
}
