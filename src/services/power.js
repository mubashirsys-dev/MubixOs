/* ═══════════════════════════════════════════
   MUBIX OS — Power Service
   Battery monitoring and power-saving mode.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { perf } from '@kernel/performance.js';

class PowerService {
  constructor() {
    this._saving = false;
    this._battery = null;
    this._previousTier = 3;
  }

  async init() {
    // Monitor battery
    try {
      if ('getBattery' in navigator) {
        this._battery = await navigator.getBattery();
        this._battery.addEventListener('levelchange', () => this._checkBattery());
        this._battery.addEventListener('chargingchange', () => this._checkBattery());
        this._checkBattery();
      }
    } catch (e) { /* no battery API */ }
  }

  _checkBattery() {
    if (!this._battery) return;

    // Auto-enable power saving below 20%
    if (!this._battery.charging && this._battery.level < 0.2 && !this._saving) {
      this.enablePowerSaving();
      bus.emit('notification:show', {
        title: 'Low Battery',
        message: 'Power saving mode enabled automatically.',
        icon: '🔋'
      });
    }

    // Auto-disable when charging
    if (this._battery.charging && this._saving) {
      this.disablePowerSaving();
    }
  }

  enablePowerSaving() {
    if (this._saving) return;
    this._saving = true;
    this._previousTier = perf.tier;
    perf.setTier(1);
    bus.emit('power:saving', true);
  }

  disablePowerSaving() {
    if (!this._saving) return;
    this._saving = false;
    perf.setTier(this._previousTier);
    bus.emit('power:saving', false);
  }

  get isSaving() { return this._saving; }

  getBatteryInfo() {
    if (!this._battery) return null;
    return {
      level: Math.round(this._battery.level * 100),
      charging: this._battery.charging,
    };
  }
}

export const power = new PowerService();
export default power;
