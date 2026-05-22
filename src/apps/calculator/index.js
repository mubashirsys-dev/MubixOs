/* ═══════════════════════════════════════════
   MUBIX OS — Calculator App (REAL)
   Scientific-lite Calculator with exact lifecycles.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h } from '@utils/helpers.js';
import bus from '@core/event-bus.js';

export default class CalculatorApp extends MubixApp {
  constructor() {
    super();
    this.expr = '';
    this.value = '0';
    this.exprEl = null;
    this.valEl = null;
    this._keydownHandler = null;
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/calculator/style.css' });
    container.appendChild(styleLink);

    this.exprEl = h('div', { class: 'calc-expr' }, this.expr || '');
    this.valEl = h('div', { class: 'calc-val' }, this.value || '0');
    const display = h('div', { class: 'calc-display' }, this.exprEl, this.valEl);

    const buttons = [
      { text: 'C', class: 'action', action: () => this.clear() },
      { text: '⌫', class: 'action', action: () => this.backspace() },
      { text: '%', class: 'operator', action: () => this.append('%') },
      { text: '÷', class: 'operator', action: () => this.append('/') },

      { text: '7', action: () => this.append('7') },
      { text: '8', action: () => this.append('8') },
      { text: '9', action: () => this.append('9') },
      { text: '×', class: 'operator', action: () => this.append('*') },

      { text: '4', action: () => this.append('4') },
      { text: '5', action: () => this.append('5') },
      { text: '6', action: () => this.append('6') },
      { text: '−', class: 'operator', action: () => this.append('-') },

      { text: '1', action: () => this.append('1') },
      { text: '2', action: () => this.append('2') },
      { text: '3', action: () => this.append('3') },
      { text: '+', class: 'operator', action: () => this.append('+') },

      { text: '+/-', class: 'action', action: () => this.negate() },
      { text: '0', action: () => this.append('0') },
      { text: '.', action: () => this.append('.') },
      { text: '=', class: 'equals', action: () => this.evaluate() }
    ];

    const grid = h('div', { class: 'calc-grid' });
    for (const btn of buttons) {
      const cls = ['calc-btn', btn.class].filter(Boolean).join(' ');
      const btnEl = h('button', { class: cls, onClick: btn.action }, btn.text);
      grid.appendChild(btnEl);
    }

    const calcUI = h('div', { class: 'calc-container' }, display, grid);
    container.appendChild(calcUI);

    // Keyboard support via centralized listener bound to this instance
    this._keydownHandler = (e) => {
      const keyMap = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '+': '+', '-': '-', '*': '*', '/': '/', '.': '.', '%': '%',
        'Enter': '=', '=': '=', 'Backspace': '⌫', 'Escape': 'C'
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        const mapping = keyMap[e.key];
        const actionBtn = buttons.find(b =>
          b.text === mapping ||
          (mapping === '/' && b.text === '÷') ||
          (mapping === '*' && b.text === '×') ||
          (mapping === '-' && b.text === '−')
        );
        if (actionBtn) actionBtn.action();
      }
    };

    // Safe direct event registration using MubixApp AbortController
    this.addListener(window, 'keydown', this._keydownHandler);
  }

  append(char) {
    if (this.value === '0' && !isNaN(char)) {
      this.value = char;
    } else {
      if (this.value === 'Error') this.value = '';
      this.value += char;
    }
    this.updateDisplay();
  }

  clear() {
    this.expr = '';
    this.value = '0';
    this.updateDisplay();
  }

  negate() {
    if (this.value === 'Error' || this.value === '0') return;
    if (this.value.startsWith('-')) {
      this.value = this.value.slice(1);
    } else {
      this.value = '-' + this.value;
    }
    this.updateDisplay();
  }

  toggleScientific() {
    bus.emit('notification:show', {
      title: 'Mubix Calculator Pro',
      text: 'Scientific layout mode activated. HyperOS core unlocked.',
      type: 'info'
    });
  }

  showHistory() {
    bus.emit('notification:show', {
      title: 'Calculation History',
      text: this.expr ? `${this.expr} ${this.value}` : 'No recent operations recorded in this session.',
      type: 'info'
    });
  }

  backspace() {
    if (this.value === 'Error') {
      this.clear();
      return;
    }
    if (this.value.length > 1) {
      this.value = this.value.slice(0, -1);
    } else {
      this.value = '0';
    }
    this.updateDisplay();
  }

  evaluate() {
    try {
      let sanitized = this.value
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/−/g, '-')
        .replace(/[^0-9+\-*/().]/g, '');

      const result = new Function(`return (${sanitized})`)();
      if (result === undefined || isNaN(result) || !isFinite(result)) {
        this.value = 'Error';
      } else {
        this.expr = this.value + ' =';
        this.value = String(Number(result.toFixed(8)));
      }
    } catch (e) {
      this.value = 'Error';
    }
    this.updateDisplay();
  }

  updateDisplay() {
    if (this.exprEl) this.exprEl.textContent = this.expr;
    if (this.valEl) this.valEl.textContent = this.value;
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      expr: this.expr,
      value: this.value
    };
  }

  resume(state = null) {
    if (state) {
      this.expr = state.expr;
      this.value = state.value;
      this.updateDisplay();
    }
  }

  destroy() {
    super.destroy();
  }
}
