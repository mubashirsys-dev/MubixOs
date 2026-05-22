/* ═══════════════════════════════════════════
   MUBIX OS — YouTube Lite App (REAL)
   Safe Iframe embed streams, search filters, like/sub toggles, and interactive comments.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';

export default class YoutubeLiteApp extends MubixApp {
  constructor() {
    super();
    this.activeView = 'home'; // 'home' or 'play'
    this.searchQuery = '';
    this.bodyEl = null;
    this.sidebarEl = null;
    this.contentEl = null;
    this.activeVideoId = null;

    // Database of actual, compatible YouTube Embeds
    this.videos = [
      { id: 'jfKfPfyJRdk', title: 'lofi hip hop radio 🌌 beats to relax/study to', channel: 'Lofi Girl', views: '2.4M', age: 'Live Now', duration: 'LIVE', category: 'Music' },
      { id: '4xDzrJKXOOY', title: 'SYNTHWAVE RADIO 🕹️ Cyberpunk Beats for Coding/Gaming', channel: 'Lofi Girl Synthwave', views: '840K', age: 'Live Now', duration: 'LIVE', category: 'Music' },
      { id: '21X5lGlDOfg', title: 'NASA Live Stream: Space Walk Telemetry & Earth Views', channel: 'NASA', views: '12K', age: 'Live Now', duration: 'LIVE', category: 'Tech' },
      { id: '5qap5aO4i9A', title: 'Lofi beats for coding 💻 relax / study / focus beat selection', channel: 'Lofi Records', views: '1.2M', age: '3 weeks ago', duration: '1:02:40', category: 'Music' },
      { id: 'tNtMyUXSGJk', title: 'React JS in 100 Seconds — Core Front-end Architecture Explained', channel: 'Fireship', views: '640k', age: '1 year ago', duration: '1:40', category: 'Tech' },
      { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', channel: 'Rick Astley', views: '1.4B', age: '14 years ago', duration: '3:32', category: 'Entertainment' }
    ];

    // Sub/Like states
    this.isSubscribed = false;
    this.subscribersCount = 248000;
    this.likesCount = 4250;
    this.isLiked = false;

    // Comments database
    this.comments = [
      { author: 'CyberSam', text: 'This lofi stream is carrying my coding session on MUBIX OS right now! 🔥', avatar: '💻' },
      { author: 'PixelQueen', text: 'Rick Astley in the playlist is absolute genius! Rickroll of the future.', avatar: '👾' },
      { author: 'ByteSized', text: 'Is it just me, or does MUBIX OS run this YouTube player faster than Chrome does?', avatar: '🚀' }
    ];
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/youtube-lite/style.css' });
    container.appendChild(styleLink);

    // App header search bar
    const searchInput = h('input', {
      type: 'text',
      class: 'yt-search-input',
      placeholder: 'Search videos...',
      onInput: (e) => this.handleSearch(e.target.value)
    });

    const header = h('div', { class: 'yt-header' },
      h('div', {
        class: 'yt-brand',
        onClick: () => this.setView('home')
      },
        h('span', { class: 'yt-logo' }, '▶️'),
        h('span', { class: 'yt-title' }, 'YouTube'),
        h('span', { class: 'yt-badge' }, 'Lite')
      ),
      searchInput
    );

    // Left Sidebar Tabs
    const sidebarTabs = [
      { name: '🏠 Home', action: () => this.setView('home') },
      { name: '🔥 Trending', action: () => this.handleCategoryFilter('Music') },
      { name: '💻 Developer', action: () => this.handleCategoryFilter('Tech') },
      { name: '🎧 Library', action: () => alert('Library is synchronized local-only.') }
    ];

    this.sidebarEl = h('div', { class: 'yt-sidebar' });
    for (const tab of sidebarTabs) {
      const btn = h('button', {
        class: 'yt-sidebar-btn',
        onClick: () => tab.action()
      }, tab.name);
      this.sidebarEl.appendChild(btn);
    }

    this.contentEl = h('div', { class: 'yt-content' });

    const layout = h('div', { class: 'yt-layout' },
      this.sidebarEl,
      this.contentEl
    );

    const appUI = h('div', { class: 'yt-container' },
      header,
      layout
    );

    container.appendChild(appUI);

    this.setView('home');
  }

  setView(view) {
    this.activeView = view;
    if (view === 'home') {
      this.renderHome();
    } else {
      this.renderPlayView();
    }
  }

  renderHome() {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';
    this.setTitle('YouTube Lite');

    // Filter through search query
    const filtered = this.videos.filter(v => {
      const matchQuery = v.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                         v.channel.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchQuery;
    });

    if (filtered.length === 0) {
      this.contentEl.appendChild(h('div', { class: 'yt-empty-feed' }, 'No videos matching search query.'));
      return;
    }

    const grid = h('div', { class: 'yt-grid' });
    for (const vid of filtered) {
      const card = h('div', {
        class: 'yt-card',
        onClick: () => {
          this.activeVideoId = vid.id;
          this.setView('play');
        }
      });

      const thumb = h('div', {
        class: 'yt-card-thumb',
        style: { backgroundImage: `url("https://img.youtube.com/vi/${vid.id}/hqdefault.jpg")` }
      },
        h('span', { class: 'yt-duration' }, vid.duration)
      );

      const label = h('div', { class: 'yt-card-label' },
        h('div', { class: 'yt-card-avatar' }, vid.channel[0]),
        h('div', { class: 'yt-card-details' },
          h('span', { class: 'yt-card-title' }, vid.title),
          h('span', { class: 'yt-card-meta' }, vid.channel),
          h('span', { class: 'yt-card-meta' }, `${vid.views} views • ${vid.age}`)
        )
      );

      card.appendChild(thumb);
      card.appendChild(label);
      grid.appendChild(card);
    }

    this.contentEl.appendChild(grid);
  }

  renderPlayView() {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';

    const vid = this.videos.find(v => v.id === this.activeVideoId);
    if (!vid) return;

    this.setTitle(`YouTube - Playing ${vid.title}`);

    // Sandbox streaming iframe player
    const iframe = h('iframe', {
      class: 'yt-iframe-player',
      src: `https://www.youtube.com/embed/${vid.id}?autoplay=1&enablejsapi=1`,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowfullscreen: 'true'
    });

    const playerContainer = h('div', { class: 'yt-player-container' }, iframe);

    // Video description info pane
    const subBtn = h('button', {
      class: `yt-btn-sub ${this.isSubscribed ? 'subscribed' : ''}`,
      onClick: (e) => this.toggleSubscribe(e.target)
    }, this.isSubscribed ? '🔔 Subscribed' : '🔔 Subscribe');

    const subCount = h('span', { class: 'yt-sub-count' }, this.formatSubscribers());

    const likeBtn = h('button', {
      class: `yt-btn-like ${this.isLiked ? 'liked' : ''}`,
      onClick: (e) => this.toggleLike(e.target)
    }, this.isLiked ? `👍 ${this.likesCount + 1}` : `👍 ${this.likesCount}`);

    const metadataRow = h('div', { class: 'yt-meta-row' },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('div', { class: 'yt-card-avatar' }, vid.channel[0]),
        h('div', { style: { display: 'flex', flexDirection: 'column' } },
          h('span', { style: { fontWeight: '600', fontSize: '12px' } }, vid.channel),
          subCount
        ),
        subBtn
      ),
      h('div', {}, likeBtn)
    );

    const description = h('div', { class: 'yt-desc-box' },
      h('span', { style: { fontWeight: '600' } }, `${vid.views} views • ${vid.age}`),
      h('p', { style: { marginTop: '6px', fontSize: '11px', color: 'var(--mx-text-secondary)' } }, `Enjoy high-fidelity streaming loops for "${vid.title}" inside MUBIX sandbox workspace. Optimize performant pipelines and frames!`)
    );

    const videoTitle = h('h2', { class: 'yt-video-title' }, vid.title);

    // Dynamic Comments Box
    const commentsListContainer = h('div', { class: 'yt-comments-list' });
    this.renderComments(commentsListContainer);

    const commentInput = h('input', {
      type: 'text',
      class: 'yt-comment-input',
      placeholder: 'Add a public comment...'
    });

    const submitCommentBtn = h('button', {
      class: 'photo-btn photo-btn-accent',
      onClick: () => {
        if (commentInput.value.trim()) {
          this.comments.push({
            author: 'You',
            text: commentInput.value.trim(),
            avatar: '😎'
          });
          commentInput.value = '';
          this.renderComments(commentsListContainer);
        }
      }
    }, 'Comment');

    const commentForm = h('div', { class: 'yt-comment-form' },
      commentInput,
      submitCommentBtn
    );

    const commentsSection = h('div', { class: 'yt-comments-section' },
      h('h3', { style: { fontSize: '12px', marginBottom: '8px' } }, '💬 Comments'),
      commentForm,
      commentsListContainer
    );

    const leftCol = h('div', { class: 'yt-play-left-col' },
      playerContainer,
      videoTitle,
      metadataRow,
      description,
      commentsSection
    );

    // Right Sidebar recommendations
    const rightCol = h('div', { class: 'yt-play-right-col' });
    for (const otherVid of this.videos) {
      if (otherVid.id === vid.id) continue;
      const rec = h('div', {
        class: 'yt-rec-card',
        onClick: () => {
          this.activeVideoId = otherVid.id;
          this.setView('play');
        }
      },
        h('img', { class: 'yt-rec-thumb', src: `https://img.youtube.com/vi/${otherVid.id}/hqdefault.jpg` }),
        h('div', { class: 'yt-rec-details' },
          h('span', { class: 'yt-rec-title' }, otherVid.title),
          h('span', { class: 'yt-rec-meta' }, otherVid.channel),
          h('span', { class: 'yt-rec-meta' }, `${otherVid.views} views`)
        )
      );
      rightCol.appendChild(rec);
    }

    const playLayout = h('div', { class: 'yt-play-layout' },
      leftCol,
      rightCol
    );

    this.contentEl.appendChild(playLayout);
  }

  renderComments(container) {
    container.innerHTML = '';
    // Reverse comments to show newest first!
    const reversed = [...this.comments].reverse();
    for (const comment of reversed) {
      const el = h('div', { class: 'yt-comment-card' },
        h('div', { class: 'yt-comment-avatar' }, comment.avatar),
        h('div', { class: 'yt-comment-body' },
          h('span', { class: 'yt-comment-author' }, comment.author),
          h('p', { class: 'yt-comment-text' }, comment.text)
        )
      );
      container.appendChild(el);
    }
  }

  toggleSubscribe(btn) {
    this.isSubscribed = !this.isSubscribed;
    if (this.isSubscribed) {
      btn.textContent = '🔔 Subscribed';
      btn.classList.add('subscribed');
      this.subscribersCount++;
    } else {
      btn.textContent = '🔔 Subscribe';
      btn.classList.remove('subscribed');
      this.subscribersCount--;
    }
    const countEl = this.container.querySelector('.yt-sub-count');
    if (countEl) countEl.textContent = this.formatSubscribers();
  }

  toggleLike(btn) {
    this.isLiked = !this.isLiked;
    if (this.isLiked) {
      btn.classList.add('liked');
      btn.textContent = `👍 ${this.likesCount + 1}`;
    } else {
      btn.classList.remove('liked');
      btn.textContent = `👍 ${this.likesCount}`;
    }
  }

  formatSubscribers() {
    const k = 1000;
    if (this.subscribersCount >= k) {
      return `${(this.subscribersCount / k).toFixed(1)}k subscribers`;
    }
    return `${this.subscribersCount} subscribers`;
  }

  handleSearch(val) {
    this.searchQuery = val;
    if (this.activeView === 'home') {
      this.renderHome();
    }
  }

  handleCategoryFilter(category) {
    this.searchQuery = category;
    this.setView('home');
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      activeView: this.activeView,
      activeVideoId: this.activeVideoId,
      searchQuery: this.searchQuery
    };
  }

  resume(state = null) {
    if (state) {
      this.activeView = state.activeView || 'home';
      this.activeVideoId = state.activeVideoId;
      this.searchQuery = state.searchQuery || '';
      
      if (this.activeView === 'play' && this.activeVideoId) {
        this.setView('play');
      } else {
        this.setView('home');
      }
    }
  }

  destroy() {
    const iframe = this.container.querySelector('.yt-iframe-player');
    if (iframe) iframe.src = 'about:blank'; // stop iframe loops
    super.destroy();
  }
}
