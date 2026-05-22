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
    this.canvasEl = null;
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
    this.canvasEl = h('canvas', { class: 'clock-analog-canvas', width: '140', height: '140' });

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
        h('div', { class: 'clock-digital-container' },
          this.timeEl,
          this.dateEl
        ),
        this.canvasEl
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

      const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      if (this.timezone !== 'local') {
        dateOptions.timeZone = this.timezone;
      }
      this.dateEl.textContent = now.toLocaleDateString([], dateOptions);

      // Draw interactive analog clock
      this.drawAnalogClock(now);
    } catch (e) {
      console.error('[Clock] Error rendering time:', e);
    }
  }

  drawAnalogClock(now) {
    if (!this.canvasEl) return;
    const ctx = this.canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 140, 140);
    
    const cx = 70;
    const cy = 70;
    const r = 62;

    // Draw clock face
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = '#F8F5EE';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111111';
    ctx.stroke();

    // Draw hour markers
    ctx.fillStyle = '#111111';
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      const x = cx + Math.sin(angle) * (r - 8);
      const y = cy - Math.cos(angle) * (r - 8);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Get time in selected timezone
    let targetTime = now;
    if (this.timezone !== 'local') {
      try {
        const tzTimeStr = now.toLocaleString('en-US', { timeZone: this.timezone });
        targetTime = new Date(tzTimeStr);
      } catch (err) {}
    }

    const hours = targetTime.getHours();
    const minutes = targetTime.getMinutes();
    const seconds = targetTime.getSeconds();

    // Hour hand
    const hrAngle = ((hours % 12) * 30 + minutes * 0.5) * Math.PI / 180;
    this.drawHand(ctx, cx, cy, hrAngle, r * 0.5, 4, '#8B5CF6');

    // Minute hand
    const minAngle = (minutes * 6 + seconds * 0.1) * Math.PI / 180;
    this.drawHand(ctx, cx, cy, minAngle, r * 0.7, 2.5, '#FF6B6B');

    // Second hand
    const secAngle = (seconds * 6) * Math.PI / 180;
    this.drawHand(ctx, cx, cy, secAngle, r * 0.85, 1, '#111111');

    // Center pin
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#111111';
    ctx.fill();
  }

  drawHand(ctx, x, y, angle, length, width, color) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * length, y - Math.cos(angle) * length);
    ctx.stroke();
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
