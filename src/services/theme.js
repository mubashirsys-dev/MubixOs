/* ═══════════════════════════════════════════
   MUBIX OS — Theme Service
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import settings from '@services/settings.js';

class ThemeService {
  constructor() {
    this._current = 'dark';
  }

  async init() {
    this._current = settings.get('theme') || 'dark';
    this._apply();

    bus.on('settings:changed:theme', (theme) => {
      this._current = theme;
      this._apply();
    });

    // Handle branding changes reactive events
    bus.on('settings:changed:accent_color', (color) => {
      this._applyAccent(color);
    });

    bus.on('settings:changed:grid_visible', (visible) => {
      this._applyGrid(visible);
    });

    bus.on('settings:changed:motion_intensity', (motion) => {
      this._applyMotion(motion);
    });
  }

  _apply() {
    document.documentElement.setAttribute('data-theme', this._current);
    
    // Apply dynamic visual system parameters
    this._applyAccent(settings.get('accent_color') || '#8B5CF6');
    this._applyGrid(settings.get('grid_visible') !== false);
    this._applyMotion(settings.get('motion_intensity') || 'normal');
  }

  _applyAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    try {
      const r = parseInt(color.slice(1,3), 16) || 139;
      const g = parseInt(color.slice(3,5), 16) || 92;
      const b = parseInt(color.slice(5,7), 16) || 246;
      document.documentElement.style.setProperty('--mx-accent-glow', `rgba(${r}, ${g}, ${b}, 0.2)`);
    } catch(e) {
      document.documentElement.style.setProperty('--mx-accent-glow', 'rgba(139, 92, 246, 0.2)');
    }
  }

  _applyGrid(visible) {
    document.documentElement.setAttribute('data-grid-visible', visible ? 'true' : 'false');
  }

  _applyMotion(motion) {
    const scale = motion === 'normal' ? '1' : (motion === 'low' ? '0.5' : '0');
    document.documentElement.setAttribute('data-motion-scale', scale);
  }

  get current() { return this._current; }

  async setTheme(theme) {
    await settings.set('theme', theme);
    this._current = theme;
    this._apply();
  }

  toggle() {
    return this.setTheme(this._current === 'dark' ? 'light' : 'dark');
  }
}

export const theme = new ThemeService();
export default theme;
