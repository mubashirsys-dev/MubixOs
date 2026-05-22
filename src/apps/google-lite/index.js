/* ═══════════════════════════════════════════
   MUBIX OS — Google Lite App (REAL)
   Simulated Search engine with customized widgets and dynamic query database.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';

export default class GoogleLiteApp extends MubixApp {
  constructor() {
    super();
    this.activeView = 'home'; // 'home' or 'results' or 'detail'
    this.currentQuery = '';
    this.bodyEl = null;
    this.inputEl = null;
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/google-lite/style.css' });
    container.appendChild(styleLink);

    this.bodyEl = h('div', { class: 'google-app-body' });
    container.appendChild(this.bodyEl);

    this.renderHome();
  }

  renderHome() {
    this.activeView = 'home';
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    this.inputEl = h('input', {
      type: 'text',
      class: 'google-search-input',
      placeholder: 'Search cyber net or type query (try "mubix", "weather", "news")...',
      onKeydown: (e) => {
        if (e.key === 'Enter') {
          this.executeSearch(this.inputEl.value);
        }
      }
    });

    const searchBtn = h('button', {
      class: 'google-btn google-search-btn',
      onClick: () => this.executeSearch(this.inputEl.value)
    }, '🔍 Search');

    const trendingTags = ['mubix os', 'weather forecast', 'cyberpunk news', 'synthwave beat', 'matrix code'];
    const tagsContainer = h('div', { class: 'google-trending-row' });
    for (const tag of trendingTags) {
      const tagBtn = h('span', {
        class: 'google-tag',
        onClick: () => this.executeSearch(tag)
      }, tag);
      tagsContainer.appendChild(tagBtn);
    }

    const homeUI = h('div', { class: 'google-home-container' },
      h('div', { class: 'google-logo-container' },
        h('span', { class: 'g-blue' }, 'M'),
        h('span', { class: 'g-red' }, 'u'),
        h('span', { class: 'g-yellow' }, 'b'),
        h('span', { class: 'g-blue' }, 'i'),
        h('span', { class: 'g-green' }, 'x'),
        h('span', { class: 'g-lite' }, ' Search')
      ),
      h('div', { class: 'google-search-row' },
        this.inputEl,
        searchBtn
      ),
      h('div', { class: 'google-trending-title' }, '🔥 Trending Cyber Queries:'),
      tagsContainer
    );

    this.bodyEl.appendChild(homeUI);
    this.setTitle('Mubix Lite Search');
  }

  executeSearch(query) {
    if (!query || !query.trim()) return;
    this.currentQuery = query.trim();
    this.renderResults();
  }

  renderResults() {
    this.activeView = 'results';
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    // Results header search bar
    const navInput = h('input', {
      type: 'text',
      class: 'google-nav-input',
      value: this.currentQuery,
      onKeydown: (e) => {
        if (e.key === 'Enter') {
          this.executeSearch(navInput.value);
        }
      }
    });

    const header = h('div', { class: 'google-results-header' },
      h('div', {
        class: 'google-logo-sm',
        onClick: () => this.renderHome()
      }, 'MubixSearch'),
      navInput,
      h('button', {
        class: 'google-btn',
        onClick: () => this.executeSearch(navInput.value)
      }, 'Search')
    );

    // Search filters
    const filters = ['All', 'News', 'Images', 'Maps'];
    const filterBar = h('div', { class: 'google-results-filter-bar' });
    for (const f of filters) {
      const fBtn = h('span', {
        class: `google-filter-tab ${f === 'All' ? 'active' : ''}`
      }, f);
      filterBar.appendChild(fBtn);
    }

    // Results container
    const resultsContainer = h('div', { class: 'google-results-list' });

    // Generate simulated results
    const results = this.getMockResults(this.currentQuery);
    
    // Check for special widgets
    const widget = this.getSpecialWidget(this.currentQuery);
    if (widget) {
      resultsContainer.appendChild(widget);
    }

    for (const res of results) {
      const card = h('div', { class: 'google-result-card' });
      const path = h('div', { class: 'google-result-path' }, res.path);
      const title = h('a', {
        class: 'google-result-title',
        href: '#',
        onClick: (e) => {
          e.preventDefault();
          this.openDetail(res);
        }
      }, res.title);
      const snippet = h('div', { class: 'google-result-snippet' }, res.snippet);

      card.appendChild(path);
      card.appendChild(title);
      card.appendChild(snippet);
      resultsContainer.appendChild(card);
    }

    const resultsUI = h('div', { class: 'google-results-container' },
      header,
      filterBar,
      resultsContainer
    );

    this.bodyEl.appendChild(resultsUI);
    this.setTitle(`Mubix - ${this.currentQuery}`);
  }

  getSpecialWidget(query) {
    const q = query.toLowerCase();
    
    if (q.includes('weather')) {
      return h('div', { class: 'google-widget weather-widget' },
        h('div', { class: 'weather-main' },
          h('div', {},
            h('h3', { style: { margin: 0, fontSize: '1.2rem' } }, 'Neo-Tokyo Sector 4'),
            h('span', { class: 'text-tertiary', style: { fontSize: '0.75rem' } }, 'Dynamic Holographic Forecast')
          ),
          h('div', { class: 'weather-temp' }, '28°C'),
          h('div', { class: 'weather-icon' }, '⛈️')
        ),
        h('div', { class: 'weather-details' },
          h('div', {}, '💨 Wind: 24 km/h'),
          h('div', {}, '💧 Humidity: 82%'),
          h('div', {}, '⚡ Pressure: 1014hPa')
        )
      );
    }

    if (q.includes('mubix') || q.includes('system')) {
      return h('div', { class: 'google-widget system-widget' },
        h('h3', { style: { color: 'var(--mx-accent)', marginBottom: '8px' } }, '🤖 MUBIX OS Systems Check'),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' } },
          h('div', {}, '🖥️ Kernel Version: 1.0.0-gold'),
          h('div', {}, '⚙️ System Tier: Fully Operational'),
          h('div', {}, '🧠 Memory Pool: Dynamic DB Heap'),
          h('div', {}, '⚡ Thread Loops: Active Scheduler')
        )
      );
    }

    return null;
  }

  getMockResults(query) {
    const q = query.toLowerCase();
    const list = [];

    // Search Database
    if (q.includes('mubix') || q.includes('os')) {
      list.push({
        title: 'MUBIX OS — The Ultra-Lightweight Browser Operating System',
        path: 'https://mubix.in/os-architecture',
        snippet: 'MUBIX OS is a premium browser-based operating system designed to revive low-end hardware. Featuring a real-time dynamic scheduler, custom virtual filesystem, and high-performance glassmorphism GUI.',
        detailContent: '<h1>MUBIX OS Architecture</h1><p>MUBIX OS leverages advanced sandboxed dynamic runtimes and modern lifecycle states to deliver exceptional speed on older machines.</p><p>Core features include a UNIX-like IndexedDB Virtual Filesystem (VFS), an event-driven IPC system, a cooperative task scheduler, and complete asset-isolated workspaces. Optimize performance tiers inside System settings instantly.</p>'
      });
      list.push({
        title: 'GitHub - mubix/mubix-os-core',
        path: 'https://github.com/mubix/mubix-os-core',
        snippet: 'Official repository containing the source code of MUBIX OS. Download shell widgets, desktop engines, theme layers, and view dynamic processes. Stars: 42.1k.',
        detailContent: '<h1>mubix-os-core Github Portal</h1><p>Welcome to the open source core of the future desktop shell environment.</p><pre>npm install mubix-core\nnpm run dev</pre><p>Supported by 200+ global core cyber contributors. Revive your legacy hardware today!</p>'
      });
    }

    if (q.includes('weather')) {
      list.push({
        title: 'Neo-Tokyo Meteorological Center — Live Humidity & Temperature Alerts',
        path: 'https://weather.net/neotokyo',
        snippet: 'Acid rain warning active in Sector 4 until 18:00. High energy radiation levels normal. View global atmospheric charts and real-time wind speeds.',
        detailContent: '<h1>Neo-Tokyo Weather Alert</h1><p>A meteorological depression in Sector 4 is causing local atmospheric shifts. UV indices are high; solar shield activation recommended. Stay indoors and enjoy MUBIX terminal operations.</p>'
      });
    }

    if (q.includes('news') || q.includes('cyber')) {
      list.push({
        title: 'Cyber Net Chronicles — Global AI and Tech Expansion Updates',
        path: 'https://chronicles.net/ai-expansion',
        snippet: 'Global technology industries report 300% throughput enhancements following localized hardware scheduler updates. Silicon hubs deploy offline-first sandboxed modules.',
        detailContent: '<h1>Cyber Net Chronicles</h1><p>Industry leaders are aggressively migrating backend services to browser-side, offline-capable client kernels like MUBIX OS to curb hosting overheads and protect individual privacy.</p>'
      });
      list.push({
        title: 'Orbital Tech Weekly — Space Launches and Mars Colonization',
        path: 'https://orbitalweekly.com/launches',
        snippet: 'Mega rocket boosters achieve orbital trajectory success utilizing low-level memory schedulers. Next Mars rover launches slated for Sector 7 next Tuesday.',
        detailContent: '<h1>Orbital Tech Weekly</h1><p>Space aerospace entities validate standard browser-engine controllers for cockpit interfaces. Micro-latency dynamic operating layers allow accurate feedback telemetry.</p>'
      });
    }

    // Fallbacks to generic searches
    list.push({
      title: `Wikipedia: Search Details for "${query}"`,
      path: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      snippet: `Explore definitions, mathematical proofs, background, history, and scientific journals relating to the term "${query}" on the web encyclopedia.`,
      detailContent: `<h1>${query.toUpperCase()} — Reference Article</h1><p>This is a sandboxed mock encyclopedia page displaying references for the query: <b>${query}</b>.</p><p>Scientific definitions identify this topic as crucial for technological research. Stay tuned as researchers feed new records into the VFS repository database.</p>`
    });

    list.push({
      title: `StackOverflow answers regarding "${query}" issues`,
      path: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(query)}`,
      snippet: `Check solutions, debug codes, syntax highlights, and developer answers discussing "${query}" problems. Resolved with high developer approval.`,
      detailContent: `<h1>StackOverflow Thread: ${query}</h1><p><b>Q:</b> How can I optimize processes involving ${query} in modern browser shells?</p><p><b>A:</b> Ensure you bind abort signal controllers to listeners, cleanly suspend loops during app sleep, and rely on virtual IndexedDB VFS for offline persistence.</p>`
    });

    return list;
  }

  openDetail(result) {
    this.activeView = 'detail';
    if (!this.bodyEl) return;
    this.bodyEl.innerHTML = '';

    const backBtn = h('button', {
      class: 'google-btn',
      style: { marginBottom: '12px' },
      onClick: () => this.renderResults()
    }, '◀ Back to Search');

    const browserAddressBar = h('div', { class: 'google-address-bar' },
      h('span', { style: { color: 'var(--mx-green)' } }, '🔒 Secure Connection | '),
      h('span', { class: 'text-tertiary', style: { marginLeft: '4px' } }, result.path)
    );

    const viewport = h('div', {
      class: 'google-simulated-viewport',
      html: result.detailContent
    });

    const detailUI = h('div', { class: 'google-detail-container' },
      backBtn,
      browserAddressBar,
      viewport
    );

    this.bodyEl.appendChild(detailUI);
    this.setTitle(`Web - ${vfs.basename(result.path)}`);
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      activeView: this.activeView,
      currentQuery: this.currentQuery
    };
  }

  resume(state = null) {
    if (state) {
      this.activeView = state.activeView || 'home';
      this.currentQuery = state.currentQuery || '';
      
      if (this.activeView === 'home') {
        this.renderHome();
      } else if (this.activeView === 'results') {
        this.renderResults();
      }
    }
  }

  destroy() {
    super.destroy();
  }
}
