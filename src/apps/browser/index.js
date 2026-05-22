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
    this.homeViewEl = null;
    this.resultsViewEl = null;
    this.viewContainer = null;
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

    const homeBtn = h('button', {
      class: 'browser-nav-btn',
      onClick: () => this.navigateTo(this.defaultUrl)
    }, '🏠');

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
      class: 'browser-home-search-btn',
      style: { padding: '4px 12px', boxShadow: 'none' },
      onClick: () => this.navigateTo(this.urlInput.value)
    }, 'Go');

    const toolbar = h('div', { class: 'browser-bar' },
      backBtn,
      forwardBtn,
      refreshBtn,
      homeBtn,
      this.urlInput,
      goBtn
    );

    // Dynamic views workspace
    this.viewContainer = h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } });

    // ── 1. Sandboxed Iframe ──
    this.iframe = h('iframe', {
      class: 'browser-viewport',
      src: '',
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals',
      referrerpolicy: 'no-referrer'
    });

    // ── 2. MUBIX LITE SEARCH Homepage ──
    const searchInput = h('input', {
      type: 'text',
      class: 'browser-home-search-input',
      placeholder: 'Search the web or enter URL...'
    });
    // Add Enter listener on search input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateTo(searchInput.value);
      }
    });

    this.homeViewEl = h('div', { class: 'browser-home-view' },
      h('div', { class: 'browser-home-content' },
        h('h1', { class: 'browser-home-logo' },
          h('span', {}, 'MUBIX'), ' LITE SEARCH'
        ),
        h('p', { class: 'browser-home-tagline' }, 'Fast, sandboxed, high-performance web exploration.'),
        h('div', { class: 'browser-home-searchbox' },
          searchInput,
          h('button', {
            class: 'browser-home-search-btn',
            onClick: () => this.navigateTo(searchInput.value)
          }, 'Search')
        ),
        h('div', { class: 'browser-home-bookmarks' },
          h('span', { class: 'bookmark-title' }, 'Quick Bookmarks'),
          h('div', { class: 'bookmark-grid' },
            h('div', { class: 'bookmark-item', onClick: () => this.navigateTo('https://github.com') }, '🐱 GitHub'),
            h('div', { class: 'bookmark-item', onClick: () => this.navigateTo('https://wikipedia.org') }, '📖 Wikipedia'),
            h('div', { class: 'bookmark-item', onClick: () => this.navigateTo('https://google.com') }, '🔍 Google'),
            h('div', { class: 'bookmark-item', onClick: () => this.navigateTo('https://mubix.in') }, '🏠 Mubix OS')
          )
        )
      )
    );

    // ── 3. Simulated Search Results ──
    this.resultsViewEl = h('div', { class: 'browser-results-view' });

    const browserUI = h('div', { class: 'browser-container' },
      toolbar,
      this.viewContainer
    );

    container.appendChild(browserUI);

    // Initialize display state
    this.updateViewportDisplay(this.history[this.historyIndex] || this.defaultUrl);
  }

  navigateTo(url) {
    if (!url.trim()) return;

    // Check if it's a search word (no dots, or has spaces)
    const isSearchQuery = !/\.[a-z]{2,}/i.test(url) || url.includes(' ');

    if (!isSearchQuery) {
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
    }

    if (this.urlInput) this.urlInput.value = url;

    // History tracking
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(url);
    this.historyIndex = this.history.length - 1;

    this.updateViewportDisplay(url);
  }

  updateViewportDisplay(url) {
    if (!this.viewContainer) return;
    this.viewContainer.innerHTML = '';

    const isSearchQuery = !/\.[a-z]{2,}/i.test(url) || url.includes(' ');

    if (url === 'https://mubix.in' || url === 'mubix.in' || !url) {
      // Show Home Screen
      this.viewContainer.appendChild(this.homeViewEl);
      if (this.iframe) this.iframe.src = 'about:blank';
    } else if (isSearchQuery) {
      // Show mock search results
      this.renderSimulatedResults(url);
      this.viewContainer.appendChild(this.resultsViewEl);
      if (this.iframe) this.iframe.src = 'about:blank';
    } else {
      // Show standard iframe
      this.viewContainer.appendChild(this.iframe);
      if (this.iframe) this.iframe.src = url;
    }
  }

  renderSimulatedResults(query) {
    if (!this.resultsViewEl) return;
    this.resultsViewEl.innerHTML = '';

    this.resultsViewEl.appendChild(h('div', { class: 'browser-results-header' }, 
      `Search results for "${query}"`
    ));

    const mockResults = [
      {
        title: `Mubix OS Development Hub — Official Homepage`,
        url: `https://mubix.in`,
        desc: `Explore the lightning-fast, premium retro-themed web operating system Mubix OS. Custom tools, canvas widgets, fully customized cream styling layouts and responsive execution.`
      },
      {
        title: `${query} at Wikipedia, the free encyclopedia`,
        url: `https://wikipedia.org/wiki/${encodeURIComponent(query)}`,
        desc: `Read detailed reference, histories, architectural models, and community summaries about "${query}" on Wikipedia.`
      },
      {
        title: `GitHub repositories matching "${query}"`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        desc: `Discover, clone, and contribute to open source software repositories matching "${query}" on GitHub.`
      },
      {
        title: `Google Search: ${query}`,
        url: `https://google.com/search?q=${encodeURIComponent(query)}`,
        desc: `Perform a sandboxed Google Web query for "${query}" to access billions of indexed web pages instantly.`
      }
    ];

    mockResults.forEach(res => {
      const item = h('div', { class: 'result-item' },
        h('div', {
          class: 'result-title',
          style: { cursor: 'pointer' },
          onClick: () => this.navigateTo(res.url)
        }, res.title),
        h('span', { class: 'result-url' }, res.url),
        h('p', { class: 'result-desc' }, res.desc)
      );
      this.resultsViewEl.appendChild(item);
    });
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      if (this.urlInput) this.urlInput.value = url;
      this.updateViewportDisplay(url);
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const url = this.history[this.historyIndex];
      if (this.urlInput) this.urlInput.value = url;
      this.updateViewportDisplay(url);
    }
  }

  reload() {
    const url = this.history[this.historyIndex];
    this.updateViewportDisplay(url);
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
      if (this.urlInput) this.urlInput.value = state.url;
      this.updateViewportDisplay(state.url);
    }
  }

  destroy() {
    if (this.iframe) this.iframe.src = 'about:blank'; // stop iframe processes
    super.destroy();
  }
}
