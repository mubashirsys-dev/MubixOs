/* ═══════════════════════════════════════════
   MUBIX OS — Settings Service
   IndexedDB-persisted user settings.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import vfs from '@fs/vfs.js';

const SETTINGS_PATH = '/system/config/settings.json';

const DEFAULTS = {
  theme: 'dark',
  wallpaper: '/bg.png',
  performanceTier: 'auto',
  fontSize: 14,
  animations: true,
  dockPosition: 'bottom',
  showDesktopIcons: true,
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
    return this._data;
  }

  async save() {
    await vfs.writeFile(SETTINGS_PATH, JSON.stringify(this._data, null, 2));
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
