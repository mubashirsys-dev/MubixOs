/* ═══════════════════════════════════════════
   MUBIX OS — Code Editor App (REAL)
   Workspace explorer, multi-tab layout, and sandboxed execution shell.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';

export default class CodeEditorApp extends MubixApp {
  constructor() {
    super();
    this.openTabs = new Map(); // path -> { content, isDirty }
    this.activePath = null;
    this.treeContainer = null;
    this.tabsContainer = null;
    this.editorTextarea = null;
    this.gutterEl = null;
    this.terminalOutput = null;
    this.terminalContainer = null;
    this.previewIframe = null;
    this.addressTextEl = null;
    this._previewDebounce = null;
  }

  async init(ctx) {
    await super.init(ctx);
    if (ctx && ctx.path) {
      this.activePath = ctx.path;
    }
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/code-editor/style.css' });
    container.appendChild(styleLink);

    // Action Toolbar
    const saveBtn = h('button', {
      class: 'editor-btn editor-btn-accent',
      onClick: () => this.saveActiveFile()
    }, '💾 Save');

    const runBtn = h('button', {
      class: 'editor-btn',
      style: { background: 'var(--mx-green, #10B981)', borderColor: 'transparent', color: '#fff' },
      onClick: () => this.runCode()
    }, '⚡ Run JS');

    const newBtn = h('button', {
      class: 'editor-btn',
      onClick: () => this.createNewFilePrompt()
    }, '📄 New File');

    const clearConsoleBtn = h('button', {
      class: 'editor-btn',
      onClick: () => this.clearTerminal()
    }, '🗑️ Clear Output');

    const toolbar = h('div', { class: 'editor-toolbar' },
      saveBtn,
      runBtn,
      newBtn,
      h('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px' } }, clearConsoleBtn)
    );

    // Left Workspace Tree
    this.treeContainer = h('div', { class: 'editor-sidebar-tree' });

    const sidebar = h('div', { class: 'editor-sidebar' },
      h('div', { class: 'sidebar-header' }, '📂 Workspace Explorer'),
      this.treeContainer
    );

    // Main workspace tabs
    this.tabsContainer = h('div', { class: 'editor-tabs-bar' });

    // Text Editor Panel
    this.gutterEl = h('div', { class: 'editor-gutter' }, h('div', {}, '1'));
    this.editorTextarea = h('textarea', {
      class: 'editor-textarea',
      placeholder: '// Select a file or write some HTML, CSS, or Javascript here...',
      spellcheck: 'false',
      onInput: () => this.handleEditorInput(),
      onScroll: () => {
        if (this.gutterEl && this.editorTextarea) {
          this.gutterEl.scrollTop = this.editorTextarea.scrollTop;
        }
      }
    });

    const editorBody = h('div', { class: 'editor-body' },
      this.gutterEl,
      this.editorTextarea
    );

    // Collapsible Output Terminal Console
    this.terminalOutput = h('div', { class: 'editor-term-logs' }, '[System] Studio sandbox ready. Typing auto-compiles preview.');
    this.terminalContainer = h('div', { class: 'editor-terminal' },
      h('div', { class: 'editor-term-header' }, '📊 Output Console (Javascript Log)'),
      this.terminalOutput
    );

    const workspaceArea = h('div', { class: 'editor-workspace-area' },
      this.tabsContainer,
      editorBody,
      this.terminalContainer
    );

    // Right Preview Panel
    this.previewIframe = h('iframe', {
      class: 'editor-preview-iframe',
      sandbox: 'allow-scripts allow-modals allow-same-origin'
    });

    this.addressTextEl = h('span', { class: 'address-text' }, 'mubix://studio/sandbox.html');

    const previewAddressBar = h('div', { class: 'editor-preview-address' },
      h('span', { class: 'address-icon' }, '🔒'),
      this.addressTextEl
    );

    const previewPanel = h('div', { class: 'editor-preview-panel' },
      h('div', { class: 'editor-preview-header' }, '🌐 Live Preview Sandbox'),
      previewAddressBar,
      this.previewIframe
    );

    // Layout shell
    const editorUI = h('div', { class: 'editor-container' },
      toolbar,
      h('div', { class: 'editor-main' },
        sidebar,
        workspaceArea,
        previewPanel
      )
    );

    container.appendChild(editorUI);

    // Populate tree and open initial file
    await this.refreshTree();

    if (this.activePath) {
      await this.openFile(this.activePath);
    } else {
      // Default open
      const welcomePath = '/home/Documents/welcome_code.js';
      if (await vfs.exists(welcomePath)) {
        await this.openFile(welcomePath);
      }
    }

    // React to file changes
    this.addListener(bus, 'vfs:changed', () => this.refreshTree());
  }

  async refreshTree() {
    if (!this.treeContainer) return;
    this.treeContainer.innerHTML = '';
    
    try {
      const renderNode = async (path, container) => {
        const items = await vfs.readdir(path);
        
        // Sort directories first
        items.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });

        for (const item of items) {
          const isDir = item.type === 'directory';
          const node = h('div', { class: `tree-node ${isDir ? 'tree-folder' : 'tree-file'}` });
          
          const label = h('div', {
            class: 'tree-label',
            onClick: async (e) => {
              e.stopPropagation();
              if (isDir) {
                const sub = node.querySelector('.tree-subnodes');
                if (sub) {
                  const isHidden = sub.style.display === 'none';
                  sub.style.display = isHidden ? 'block' : 'none';
                  node.classList.toggle('collapsed', !isHidden);
                }
              } else {
                await this.openFile(item.path);
              }
            }
          },
            h('span', { class: 'tree-icon' }, isDir ? '📁' : '📄'),
            h('span', { class: 'tree-name' }, item.name)
          );

          node.appendChild(label);

          if (isDir) {
            const subnodes = h('div', { class: 'tree-subnodes', style: { display: 'none' } });
            node.appendChild(subnodes);
            node.classList.add('collapsed');
            await renderNode(item.path, subnodes);
          }
          
          container.appendChild(node);
        }
      };

      await renderNode('/home', this.treeContainer);
    } catch (e) {
      console.error('[CodeEditor] Error rendering tree:', e);
    }
  }

  async openFile(path) {
    if (!this.openTabs.has(path)) {
      try {
        const content = await vfs.readFile(path);
        this.openTabs.set(path, { content, isDirty: false });
      } catch (e) {
        console.error('[CodeEditor] Could not read file:', e);
        return;
      }
    }

    this.activePath = path;
    const tabInfo = this.openTabs.get(path);
    if (this.editorTextarea) {
      this.editorTextarea.value = tabInfo.content;
      this.editorTextarea.readOnly = false;
      this.updateLineNumbers();
    }
    
    if (this.addressTextEl) {
      this.addressTextEl.textContent = `mubix://studio${path}`;
    }

    this.renderTabs();
    this.setTitle(`Studio - ${vfs.basename(path)}`);
    this.updateLivePreview();
  }

  async saveActiveFile() {
    if (!this.activePath || !this.editorTextarea) return;
    try {
      const val = this.editorTextarea.value;
      await vfs.writeFile(this.activePath, val);
      
      const tabInfo = this.openTabs.get(this.activePath);
      if (tabInfo) {
        tabInfo.content = val;
        tabInfo.isDirty = false;
      }

      this.renderTabs();
      bus.emit('notification:show', {
        title: 'Saved Successfully',
        message: `${vfs.basename(this.activePath)} has been updated.`,
        icon: '💾',
        duration: 2000
      });
      bus.emit('vfs:changed');
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  }

  createNewFilePrompt() {
    const name = prompt('Enter new filename (e.g. index.html or script.js):');
    if (!name) return;
    const fullPath = `/home/Documents/${name}`;
    const initialContent = name.endsWith('.html') 
      ? '<!-- HTML Content -->\n<h1>Mubix OS Sandbox</h1>\n<p>Start editing to see preview!</p>\n'
      : '// Javascript Content\nconsole.log("Hello from Mubix Studio Sandbox!");\n';
      
    vfs.writeFile(fullPath, initialContent).then(() => {
      this.openFile(fullPath);
      bus.emit('vfs:changed');
    }).catch(e => {
      alert('Failed to create file: ' + e.message);
    });
  }

  handleEditorInput() {
    if (!this.activePath || !this.editorTextarea) return;
    const val = this.editorTextarea.value;
    const tabInfo = this.openTabs.get(this.activePath);
    if (tabInfo) {
      tabInfo.isDirty = val !== tabInfo.content;
    }
    this.renderTabs();
    this.updateLineNumbers();

    // Debounced automatic compile preview
    if (this._previewDebounce) clearTimeout(this._previewDebounce);
    this._previewDebounce = setTimeout(() => {
      this.updateLivePreview();
    }, 400);
  }

  async updateLivePreview() {
    if (!this.previewIframe || !this.editorTextarea || !this.activePath) return;

    const code = this.editorTextarea.value;
    const ext = this.activePath.split('.').pop().toLowerCase();
    let htmlContent = '';

    if (ext === 'html') {
      htmlContent = code;

      // Scan and resolve local relative paths from the Virtual Filesystem (VFS)
      const parentDir = vfs.parentPath(this.activePath) || '/home';

      // 1. Resolve relative CSS links: <link rel="stylesheet" href="style.css">
      const linkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match;
      const linkMatches = [];
      while ((match = linkRegex.exec(code)) !== null) {
        linkMatches.push({ tag: match[0], href: match[1] });
      }
      for (const item of linkMatches) {
        if (!item.href.startsWith('http') && !item.href.startsWith('//')) {
          const cssPath = `${parentDir}/${item.href.replace(/^\.\//, '')}`;
          try {
            if (await vfs.exists(cssPath)) {
              const cssCode = await vfs.readFile(cssPath);
              htmlContent = htmlContent.replace(item.tag, `<style>${cssCode}</style>`);
            }
          } catch(err) {
            console.warn('[MubixStudio] Failed resolving css import:', cssPath, err);
          }
        }
      }

      // 2. Resolve relative JS scripts: <script src="script.js"></script>
      const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
      const scriptMatches = [];
      while ((match = scriptRegex.exec(code)) !== null) {
        scriptMatches.push({ tag: match[0], src: match[1] });
      }
      for (const item of scriptMatches) {
        if (!item.src.startsWith('http') && !item.src.startsWith('//')) {
          const jsPath = `${parentDir}/${item.src.replace(/^\.\//, '')}`;
          try {
            if (await vfs.exists(jsPath)) {
              const jsCode = await vfs.readFile(jsPath);
              htmlContent = htmlContent.replace(item.tag, `<script>${jsCode}</script>`);
            }
          } catch(err) {
            console.warn('[MubixStudio] Failed resolving js import:', jsPath, err);
          }
        }
      }
    } else if (ext === 'css') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${code}</style>
        </head>
        <body style="font-family: sans-serif; padding: 24px; background: #fafafa; color: #111;">
          <h2>CSS Preview</h2>
          <p>Style changes will reload here live.</p>
          <div class="card" style="padding: 16px; border: 2px solid #000; border-radius: 8px; box-shadow: 3px 3px 0 #000; max-width: 300px; background: #fff;">
            <h3>Outlined Sandbox Card</h3>
            <p>Modify CSS rules in the editor!</p>
          </div>
        </body>
        </html>
      `;
    } else if (ext === 'js') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: monospace; padding: 20px; background: #0b0a0e; color: #10B981; line-height: 1.4; }
            h3 { color: #fff; border-bottom: 2px solid #10B981; padding-bottom: 6px; margin-top: 0; }
            #console-logs { white-space: pre-wrap; font-size: 13px; }
            .log-item { margin-bottom: 4px; }
            .log-err { color: #ff6b6b; }
          </style>
        </head>
        <body>
          <h3>JS LIVE PREVIEW</h3>
          <div id="console-logs"></div>
          <script>
            const logBox = document.getElementById('console-logs');
            console.log = (...args) => {
              const el = document.createElement('div');
              el.className = 'log-item';
              el.textContent = '>> ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
              logBox.appendChild(el);
            };
            console.error = (...args) => {
              const el = document.createElement('div');
              el.className = 'log-item log-err';
              el.textContent = '!! ' + args.join(' ');
              logBox.appendChild(el);
            };
            try {
              ${code}
            } catch(e) {
              console.error(e.message);
            }
          </script>
        </body>
        </html>
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; padding: 20px; background: #fff; color: #000;">
          <pre style="white-space: pre-wrap; word-break: break-all;">${code}</pre>
        </body>
        </html>
      `;
    }

    try {
      const doc = this.previewIframe.contentDocument || this.previewIframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();
    } catch (e) {
      console.error('[MubixStudio] Failed writing iframe preview content:', e);
    }
  }

  renderTabs() {
    if (!this.tabsContainer) return;
    this.tabsContainer.innerHTML = '';

    for (const [path, info] of this.openTabs.entries()) {
      const isActive = path === this.activePath;
      const tab = h('div', {
        class: `editor-tab ${isActive ? 'active' : ''}`,
        onClick: () => this.openFile(path)
      },
        h('span', { class: 'tab-title' }, vfs.basename(path)),
        info.isDirty ? h('span', { class: 'tab-dirty' }, '●') : null,
        h('span', {
          class: 'tab-close',
          onClick: (e) => {
            e.stopPropagation();
            this.closeTab(path);
          }
        }, '×')
      );
      this.tabsContainer.appendChild(tab);
    }
  }

  closeTab(path) {
    const tabInfo = this.openTabs.get(path);
    if (tabInfo && tabInfo.isDirty) {
      if (!confirm(`Save unsaved changes in ${vfs.basename(path)}?`)) {
        this.openTabs.delete(path);
      } else {
        this.saveActiveFile().then(() => this.openTabs.delete(path));
      }
    } else {
      this.openTabs.delete(path);
    }

    if (this.activePath === path) {
      const keys = [...this.openTabs.keys()];
      if (keys.length > 0) {
        this.openFile(keys[keys.length - 1]);
      } else {
        this.activePath = null;
        if (this.editorTextarea) {
          this.editorTextarea.value = '';
          this.editorTextarea.readOnly = true;
        }
        this.updateLineNumbers();
        this.renderTabs();
        this.setTitle('Studio');
      }
    } else {
      this.renderTabs();
    }
  }

  updateLineNumbers() {
    if (!this.gutterEl || !this.editorTextarea) return;
    const text = this.editorTextarea.value;
    const lines = text.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lines; i++) {
      gutterHTML += `<div>${i}</div>`;
    }
    this.gutterEl.innerHTML = gutterHTML;
  }

  runCode() {
    if (!this.editorTextarea) return;
    const code = this.editorTextarea.value;
    this.clearTerminal();

    this.terminalOutput.innerHTML += `<div><span class="text-secondary">[Runtime] Executing sandbox code...</span></div>`;

    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      const parsed = args.map(arg => {
        if (typeof arg === 'object') return JSON.stringify(arg);
        return arg;
      }).join(' ');
      logs.push({ type: 'info', content: parsed });
    };

    console.error = (...args) => {
      const parsed = args.join(' ');
      logs.push({ type: 'error', content: parsed });
    };

    const startTime = performance.now();
    try {
      const runner = new Function(code);
      const res = runner();
      if (res !== undefined) {
        console.log(`Returned result: ${typeof res === 'object' ? JSON.stringify(res) : res}`);
      }
    } catch (e) {
      console.error(`Runtime Crash: ${e.name} — ${e.message}`);
    }

    // Restore original consoles
    console.log = originalLog;
    console.error = originalError;

    const duration = (performance.now() - startTime).toFixed(1);

    for (const log of logs) {
      const line = h('div', {
        class: log.type === 'error' ? 'log-line-error' : 'log-line'
      }, log.content);
      this.terminalOutput.appendChild(line);
    }

    this.terminalOutput.appendChild(h('div', { class: 'text-tertiary', style: { fontSize: '10px', marginTop: '4px' } }, `[Execution complete in ${duration}ms]`));
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  clearTerminal() {
    if (this.terminalOutput) {
      this.terminalOutput.innerHTML = '';
    }
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    const state = {
      openTabs: {},
      activePath: this.activePath
    };
    for (const [k, v] of this.openTabs.entries()) {
      state.openTabs[k] = v;
    }
    return state;
  }

  resume(state = null) {
    if (state) {
      this.openTabs = new Map();
      for (const [k, v] of Object.entries(state.openTabs)) {
        this.openTabs.set(k, v);
      }
      this.activePath = state.activePath;
      this.refreshTree().then(() => {
        if (this.activePath) {
          this.openFile(this.activePath);
        }
      });
    }
  }

  destroy() {
    super.destroy();
  }
}
