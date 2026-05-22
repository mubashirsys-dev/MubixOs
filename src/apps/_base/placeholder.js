import MubixApp from '@apps/_base/app.js';
import { h } from '@utils/helpers.js';

export default class PlaceholderApp extends MubixApp {
  async onMount(container, ctx) {
    await super.onMount(container, ctx);
    const content = h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--mx-bg-secondary)',
        color: 'var(--mx-text-secondary)'
      }
    },
      h('div', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🚀'),
      h('h2', { style: { color: 'var(--mx-text-primary)', marginBottom: '0.5rem' } }, `${this.ctx.appId.toUpperCase()} - Coming Soon`),
      h('p', { style: { fontSize: '0.85rem', maxWidth: '300px' } }, 'This premium, ultra-lightweight app is scheduled for Phase 2 optimization. Keep hardware resources high!')
    );
    container.appendChild(content);
  }
}
