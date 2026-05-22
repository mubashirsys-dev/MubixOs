/* ═══════════════════════════════════════════
   MUBIX OS — Notification System
   Toast notifications with auto-dismiss.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { h, $ } from '@utils/helpers.js';
import { uid } from '@utils/helpers.js';

class NotificationManager {
  constructor() {
    this._container = null;
    this._queue = [];
    this._maxVisible = 3;
  }

  init() {
    this._container = h('div', { id: 'notification-container' });
    $('#mubix-root').appendChild(this._container);

    bus.on('notification:show', (data) => this.show(data));
  }

  /**
   * Show a notification.
   * @param {object} opts - { title, message, icon, duration }
   */
  show({ title = 'Notice', message = '', icon = 'ℹ️', duration = 4000 } = {}) {
    const id = uid('notif');

    const closeBtn = h('button', {
      class: 'notification-close',
      onClick: () => this.dismiss(id),
    }, '×');

    const el = h('div', {
      class: 'notification ll-notification',
      id,
    },
      h('div', { class: 'notification-icon' }, icon),
      h('div', { class: 'notification-content' },
        h('div', { class: 'notification-title' }, title),
        h('div', { class: 'notification-message' }, message)
      ),
      closeBtn
    );

    this._container.appendChild(el);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    // Limit visible
    const children = this._container.children;
    if (children.length > this._maxVisible) {
      this.dismiss(children[0].id);
    }
  }

  /**
   * Dismiss a notification.
   */
  dismiss(id) {
    const el = $(`#${id}`);
    if (!el || el.classList.contains('closing')) return;

    el.classList.add('closing');
    setTimeout(() => el.remove(), 250);
  }
}

export const notifications = new NotificationManager();
export default notifications;
