/* ═══════════════════════════════════════════
   MUBIX OS — Browser App (REAL)
   Sandboxed browser runtime with history navigation & exact lifecycle hooks.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';

export default class BrowserApp extends MubixApp {
  constructor() {
    super();
    this.history = [];
    this.historyIndex = -1;
    this.urlInput = null;
    this.iframe = null;
    this.defaultUrl = 'https://mubix.in'; // MUBIX OS official home URL
  }

  async init(ctx) {
    await super.init(ctx);
    this.history = [this.defaultUrl];
    this.historyIndex = 0;
  }

  async mount(container) {
    await super.mount(container);

    // Load styles
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/browser/style.css' });
    container.appendChild(styleLink);

    // Navigation Buttons
    const backBtn = h('button', {
      class: 'browser-nav-btn',
      onClick: () => this.goBack()
    }, '◀️');

    const forwardBtn = h('button', {
      class: 'browser-nav-btn',
      onClick: () => this.goForward()
    }, '▶️');

    const refreshBtn = h('button', {
      class: 'browser-nav-btn',
      onClick: () => this.reload()
    }, '🔄');

    this.urlInput = h('input', {
      class: 'browser-url-input',
      type: 'text',
      value: this.history[this.historyIndex] || this.defaultUrl,
      onKeydown: (e) => {
        if (e.key === 'Enter') {
          this.navigateTo(this.urlInput.value);
        }
      }
    });

    const goBtn = h('button', {
      class: 'fm-btn',
      onClick: () => this.navigateTo(this.urlInput.value)
    }, 'Go');

    const toolbar = h('div', { class: 'browser-bar' },
      backBtn,
      forwardBtn,
      refreshBtn,
      this.urlInput,
      goBtn
    );

    // Sandboxed Iframe
    this.iframe = h('iframe', {
      class: 'browser-viewport',
      src: this.history[this.historyIndex] || this.defaultUrl,
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
      referrerpolicy: 'no-referrer'
    });

    const browserUI = h('div', { class: 'browser-container' },
      toolbar,
      this.iframe
    );

    container.appendChild(browserUI);
  }

  navigateTo(url) {
    if (!url.trim()) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (this.urlInput) this.urlInput.value = url;
    if (this.iframe) this.iframe.src = url;

    // History tracking
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      if (this.urlInput) this.urlInput.value = url;
      if (this.iframe) this.iframe.src = url;
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const url = this.history[this.historyIndex];
      if (this.urlInput) this.urlInput.value = url;
      if (this.iframe) this.iframe.src = url;
    }
  }

  reload() {
    if (this.iframe) {
      this.iframe.src = this.iframe.src;
    }
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      url: this.urlInput ? this.urlInput.value : this.defaultUrl,
      history: this.history,
      historyIndex: this.historyIndex
    };
  }

  resume(state = null) {
    if (state && this.iframe) {
      this.history = state.history || [this.defaultUrl];
      this.historyIndex = state.historyIndex || 0;
      this.navigateTo(state.url);
    }
  }

  destroy() {
    if (this.iframe) this.iframe.src = 'about:blank'; // stop iframe processes
    super.destroy();
  }
}
