/* ═══════════════════════════════════════════
   MUBIX OS — Settings Service
   IndexedDB-persisted user settings.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import vfs from '@fs/vfs.js';

const SETTINGS_PATH = '/system/config/settings.json';

const DEFAULTS = {
  theme: 'light',
  wallpaper: 'mesh',
  performanceTier: 'auto',
  fontSize: 14,
  animations: true,
  dockPosition: 'bottom',
  showDesktopIcons: true,
  transparency: 0.95,
  accent_color: '#8B5CF6',
  desktopIconSize: 'medium',
  dockScale: 1,
  animationsIntensity: 'normal',
  batterySaver: false,
};

class Settings {
  constructor() {
    this._data = { ...DEFAULTS };
  }

  async load() {
    try {
      const raw = await vfs.readFile(SETTINGS_PATH);
      this._data = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {
      this._data = { ...DEFAULTS };
    }
    // Apply initial settings variables dynamically
    this._applyDynamicVars();
    return this._data;
  }

  _applyDynamicVars() {
    try {
      const t = this._data.transparency ?? 0.95;
      document.documentElement.style.setProperty('--glass-opacity', t);
      
      const acc = this._data.accent_color ?? '#8B5CF6';
      document.documentElement.style.setProperty('--accent', acc);
      document.documentElement.style.setProperty('--accent-color', acc);

      const dScale = this._data.dockScale ?? 1;
      document.documentElement.style.setProperty('--mx-dock-scale', dScale);
      document.documentElement.style.setProperty('--mx-dock-h', (56 * dScale) + 'px');

      const iSize = this._data.desktopIconSize ?? 'medium';
      document.documentElement.style.setProperty('--desktop-icon-size', iSize === 'small' ? '0.8' : (iSize === 'large' ? '1.2' : '1'));

      const animInt = this._data.animationsIntensity ?? 'normal';
      document.documentElement.style.setProperty('--mx-motion-scale', animInt === 'none' ? '0' : (animInt === 'low' ? '0.5' : '1'));
    } catch(err) {
      console.warn('Failed to apply dynamic system variables:', err);
    }
  }

  async save() {
    await vfs.writeFile(SETTINGS_PATH, JSON.stringify(this._data, null, 2));
    this._applyDynamicVars();
    bus.emit('settings:changed', this._data);
  }

  get(key) {
    return this._data[key];
  }

  async set(key, value) {
    this._data[key] = value;
    await this.save();
    bus.emit('settings:changed:' + key, value);
  }

  getAll() {
    return { ...this._data };
  }
}

export const settings = new Settings();
export default settings;
