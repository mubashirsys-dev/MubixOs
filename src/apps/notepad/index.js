/* ═══════════════════════════════════════════
   MUBIX OS — Notepad App (REAL)
   Industrial-strength text editor with exact lifecycles.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';

export default class NotepadApp extends MubixApp {
  constructor() {
    super();
    this.filePath = '/home/Desktop/welcome.txt';
    this.editor = null;
    this.charCountEl = null;
    this.wordCountEl = null;
  }

  async init(ctx) {
    await super.init(ctx);
    // Bind dynamic launch parameters from VFS Explorer or Desktop clicks
    if (ctx && ctx.path) {
      this.filePath = ctx.path;
    }
  }

  async mount(container) {
    await super.mount(container);

    // Build Toolbar DOM
    const saveBtn = h('button', {
      class: 'notepad-btn',
      onClick: () => this.saveFile()
    }, '💾 Save');

    const clearBtn = h('button', {
      class: 'notepad-btn',
      onClick: () => this.clearEditor()
    }, '🗑️ Clear');

    const pathIndicator = h('span', {
      class: 'text-xs text-tertiary',
      style: { marginLeft: 'auto', fontFamily: 'var(--mx-font-mono)' }
    }, this.filePath);

    const toolbar = h('div', { class: 'notepad-toolbar' },
      saveBtn,
      clearBtn,
      pathIndicator
    );

    // Textarea DOM
    this.editor = h('textarea', {
      class: 'notepad-textarea',
      placeholder: 'Start typing here...',
      onInput: () => this.updateStats()
    });

    // Statusbar DOM
    this.charCountEl = h('span', {}, '0 chars');
    this.wordCountEl = h('span', {}, '0 words');

    const statusbar = h('div', { class: 'notepad-statusbar' },
      this.wordCountEl,
      this.charCountEl
    );

    // App Wrapper
    const notepadUI = h('div', { class: 'notepad-container' },
      toolbar,
      this.editor,
      statusbar
    );

    container.appendChild(notepadUI);

    // Initial file read
    await this.loadFile();
  }

  async loadFile() {
    try {
      if (await vfs.exists(this.filePath)) {
        const content = await vfs.readFile(this.filePath);
        if (this.editor) {
          this.editor.value = content;
          this.updateStats();
        }
      } else {
        // Create initial empty file if it doesn't exist
        await vfs.writeFile(this.filePath, '');
      }
    } catch (e) {
      console.error('[Notepad] Error loading file:', e);
    }
  }

  async saveFile(silent = false) {
    if (!this.editor) return;
    try {
      await vfs.writeFile(this.filePath, this.editor.value);
      if (!silent) {
        bus.emit('notification:show', {
          title: 'Notepad',
          message: 'Saved to virtual filesystem successfully!',
          icon: '📝',
          duration: 2000
        });
      }
    } catch (e) {
      if (!silent) {
        bus.emit('notification:show', {
          title: 'Notepad Error',
          message: `Failed to save file: ${e.message}`,
          icon: '⚠️'
        });
      }
    }
  }

  clearEditor() {
    if (this.editor) {
      this.editor.value = '';
      this.updateStats();
    }
  }

  updateStats() {
    if (!this.editor) return;
    const text = this.editor.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    this.charCountEl.textContent = `${chars} chars`;
    this.wordCountEl.textContent = `${words} words`;
  }

  /* ── Standardized Lifecycles ── */

  /**
   * Suspend: saves current draft silently and returns text payload
   */
  suspend() {
    super.suspend();
    this.saveFile(true); // Save silently to prevent annoying toasts during suspension
    return {
      text: this.editor ? this.editor.value : '',
      cursorPos: this.editor ? this.editor.selectionStart : 0
    };
  }

  /**
   * Resume: restores exact value and caret position
   */
  resume(state = null) {
    if (state && this.editor) {
      this.editor.value = state.text;
      this.updateStats();
      this.editor.focus();
      // Restore caret selection
      this.editor.setSelectionRange(state.cursorPos, state.cursorPos);
    }
  }

  /**
   * Destroy: absolute clean up
   */
  destroy() {
    this.saveFile(true); // Final flush to VFS
    super.destroy();
  }
}
