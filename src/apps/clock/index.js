/* ═══════════════════════════════════════════
   MUBIX OS — Clock App (REAL)
   Timezone converter, 12h/24h style format, and throttled low-power timer loop.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';

export default class ClockApp extends MubixApp {
  constructor() {
    super();
    this.timeEl = null;
    this.dateEl = null;
    this.timezoneSelect = null;
    this.formatSelect = null;
    this.timer = null;
    this.is24Hour = false;
    this.timezone = 'local';
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/clock/style.css' });
    container.appendChild(styleLink);

    this.timeEl = h('div', { class: 'clock-time-display' }, '00:00:00');
    this.dateEl = h('div', { class: 'clock-date-display' }, 'Loading Date...');

    this.formatSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => {
        this.is24Hour = e.target.value === '24';
        this.updateTime();
      }
    },
      h('option', { value: '12', selected: !this.is24Hour }, '12-Hour Format'),
      h('option', { value: '24', selected: this.is24Hour }, '24-Hour Format')
    );

    this.timezoneSelect = h('select', {
      class: 'settings-select',
      onChange: (e) => {
        this.timezone = e.target.value;
        this.updateTime();
      }
    },
      h('option', { value: 'local', selected: this.timezone === 'local' }, 'Local Timezone'),
      h('option', { value: 'UTC', selected: this.timezone === 'UTC' }, 'UTC'),
      h('option', { value: 'America/New_York', selected: this.timezone === 'America/New_York' }, 'New York (EST)'),
      h('option', { value: 'Europe/London', selected: this.timezone === 'Europe/London' }, 'London (GMT)'),
      h('option', { value: 'Asia/Tokyo', selected: this.timezone === 'Asia/Tokyo' }, 'Tokyo (JST)')
    );

    const clockUI = h('div', { class: 'clock-app-container' },
      h('div', { class: 'clock-body-panel' },
        this.timeEl,
        this.dateEl
      ),
      h('div', { class: 'clock-settings-panel' },
        h('div', { class: 'settings-row' },
          h('span', { class: 'settings-label' }, 'Time Format'),
          this.formatSelect
        ),
        h('div', { class: 'settings-row' },
          h('span', { class: 'settings-label' }, 'Timezone Region'),
          this.timezoneSelect
        )
      )
    );

    container.appendChild(clockUI);

    this.updateTime();
    
    // Smooth update once per second
    this.timer = this.addInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    if (!this.timeEl || !this.dateEl) return;

    const now = new Date();
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !this.is24Hour
    };

    if (this.timezone !== 'local') {
      options.timeZone = this.timezone;
    }

    try {
      const timeStr = now.toLocaleTimeString([], options);
      this.timeEl.textContent = timeStr;

      const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      if (this.timezone !== 'local') {
        dateOptions.timeZone = this.timezone;
      }
      this.dateEl.textContent = now.toLocaleDateString([], dateOptions);
    } catch (e) {
      console.error('[Clock] Error rendering time:', e);
    }
  }

  suspend() {
    super.suspend();
    return {
      is24Hour: this.is24Hour,
      timezone: this.timezone
    };
  }

  resume(state = null) {
    if (state) {
      this.is24Hour = state.is24Hour || false;
      this.timezone = state.timezone || 'local';
      
      if (this.formatSelect) this.formatSelect.value = this.is24Hour ? '24' : '12';
      if (this.timezoneSelect) this.timezoneSelect.value = this.timezone;
    }
    this.updateTime();
  }

  destroy() {
    super.destroy();
  }
}
