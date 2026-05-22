/* ═══════════════════════════════════════════
   MUBIX OS — Terminal App (REAL)
   System command terminal with custom shell commands & exact lifecycle hooks.
   ═══════════════════════════════════════════ */

import MubixApp from '@apps/_base/app.js';
import { h, $ } from '@utils/helpers.js';
import vfs from '@fs/vfs.js';
import bus from '@core/event-bus.js';
import { processManager } from '@kernel/process-manager.js';
import { perf } from '@kernel/performance.js';
import windowManager from '@ws/window-manager.js';
import { APP_REGISTRY } from '@core/config.js';

export default class TerminalApp extends MubixApp {
  constructor() {
    super();
    this.cwd = '/home';
    this.outputEl = null;
    this.inputEl = null;
    this.history = [];
    this.historyIndex = -1;
  }

  async init(ctx) {
    await super.init(ctx);
  }

  async mount(container) {
    await super.mount(container);

    // Dynamic style loading
    const styleLink = h('link', { rel: 'stylesheet', href: '/src/apps/terminal/style.css' });
    container.appendChild(styleLink);

    this.outputEl = h('div', { class: 'term-output' });
    this.inputEl = h('input', {
      class: 'term-input',
      type: 'text',
      onKeydown: (e) => this.handleKeydown(e)
    });

    const promptLine = h('div', { class: 'term-prompt-line' },
      h('span', { class: 'term-prompt' }, [
        h('span', { class: 'term-user' }, 'mubix@os'),
        h('span', { class: 'term-sep' }, ':'),
        h('span', { class: 'term-path' }, this.cwd),
        h('span', { class: 'term-char' }, ' $')
      ]),
      this.inputEl
    );

    const termUI = h('div', { class: 'term-container' },
      h('div', { class: 'term-inner-panel' },
        this.outputEl,
        promptLine
      )
    );

    container.appendChild(termUI);

    // Focus editor
    setTimeout(() => {
      if (this.inputEl) this.inputEl.focus();
    }, 50);

    // Welcome banner
    this.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'sys');
    this.print(' 🚀 MUBIX OS DEVELOPER STUDIO SHELL', 'sys');
    this.print(" Type 'help' for a list of system commands.", 'sys');
    this.print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'sys');
  }

  print(text, type = '') {
    if (!this.outputEl) return;
    const line = h('div', { class: `term-line ${type}` }, text);
    this.outputEl.appendChild(line);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      const command = this.inputEl.value.trim();
      this.inputEl.value = '';
      if (command) {
        this.history.push(command);
        this.historyIndex = this.history.length;
        this.executeCommand(command);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputEl.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.inputEl.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.inputEl.value = '';
      }
    }
  }

  async executeCommand(rawCmd) {
    if (this.outputEl) {
      const cmdPrompt = h('div', { class: 'term-line cmd' }, [
        h('span', { class: 'term-user' }, 'mubix@os'),
        h('span', { class: 'term-sep' }, ':'),
        h('span', { class: 'term-path' }, this.cwd),
        h('span', { class: 'term-char' }, ' $'),
        h('span', { class: 'term-cmd-text' }, ` ${rawCmd}`)
      ]);
      this.outputEl.appendChild(cmdPrompt);
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    const parts = rawCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.print('Available commands:');
        this.print('  help             - Show this help listing');
        this.print('  ls               - List directories/files in current path');
        this.print('  cd <dir>         - Change directory');
        this.print('  cat <file>       - Output file content');
        this.print('  mkdir <dir>      - Create directory');
        this.print('  touch <file>     - Create an empty file');
        this.print('  open <app>       - Open an installed application');
        this.print('  neofetch         - Display system branding & hardware stats');
        this.print('  apps             - List all registered system applications');
        this.print('  ps               - List active processes');
        this.print('  kill <pid>       - Terminate a running process');
        this.print('  clear            - Clear terminal log');
        this.print('  exit             - Close terminal session');
        break;

      case 'clear':
        if (this.outputEl) this.outputEl.innerHTML = '';
        break;

      case 'ls':
        try {
          const entries = await vfs.readdir(this.cwd);
          if (entries.length === 0) {
            this.print('(empty)');
          } else {
            for (const entry of entries) {
              const marker = entry.type === 'directory' ? '📁' : '📄';
              this.print(`  ${marker}  ${entry.name}   [${entry.type}]`);
            }
          }
        } catch (e) {
          this.print(`Error listing path: ${e.message}`, 'err');
        }
        break;

      case 'cd':
        const target = args[0] || '/home';
        const absolute = target.startsWith('/') ? target : `${this.cwd}/${target}`;
        try {
          const cleanPath = vfs.normalizePath(absolute);
          const stat = await vfs.stat(cleanPath);
          if (stat && stat.type === 'directory') {
            this.cwd = cleanPath;
            const promptEl = $('.term-prompt', this.container);
            if (promptEl) {
              promptEl.innerHTML = '';
              promptEl.appendChild(h('span', { class: 'term-user' }, 'mubix@os'));
              promptEl.appendChild(h('span', { class: 'term-sep' }, ':'));
              promptEl.appendChild(h('span', { class: 'term-path' }, this.cwd));
              promptEl.appendChild(h('span', { class: 'term-char' }, ' $'));
            }
          } else {
            this.print(`Directory not found: ${target}`, 'err');
          }
        } catch (e) {
          this.print(`cd error: ${e.message}`, 'err');
        }
        break;

      case 'cat':
        if (!args[0]) {
          this.print('Usage: cat <filename>', 'warn');
          break;
        }
        try {
          const path = args[0].startsWith('/') ? args[0] : `${this.cwd}/${args[0]}`;
          const content = await vfs.readFile(path);
          this.print(content);
        } catch (e) {
          this.print(`cat error: ${e.message}`, 'err');
        }
        break;

      case 'touch':
        if (!args[0]) {
          this.print('Usage: touch <filename>', 'warn');
          break;
        }
        try {
          const path = args[0].startsWith('/') ? args[0] : `${this.cwd}/${args[0]}`;
          await vfs.writeFile(path, '');
          this.print(`Created empty file: ${args[0]}`);
        } catch (e) {
          this.print(`touch error: ${e.message}`, 'err');
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          this.print('Usage: mkdir <dirname>', 'warn');
          break;
        }
        try {
          const path = args[0].startsWith('/') ? args[0] : `${this.cwd}/${args[0]}`;
          await vfs.mkdir(path);
          this.print(`Created directory: ${args[0]}`);
        } catch (e) {
          this.print(`mkdir error: ${e.message}`, 'err');
        }
        break;

      case 'neofetch':
        this.print('    /\\_/\\      mubix@os', 'sys');
        this.print('   ( o.o )     OS: MUBIX OS 1.0.0', 'sys');
        this.print('    > ^ <      Kernel: LiquidLite Node V1', 'sys');
        this.print('   /     \\     Shell: Mubix-Shell v1', 'sys');
        this.print(`               Performance Tier: Tier ${perf.tier}`, 'sys');
        this.print(`               Cores Detected: ${perf.cores}`, 'sys');
        this.print(`               Memory Limit: ${perf.memory} GB`, 'sys');
        this.print(`               GPU Render Node: ${perf.gpu.substring(0, 24)}...`, 'sys');
        break;

      case 'apps':
        this.print('Registered applications:');
        for (const app of APP_REGISTRY) {
          this.print(`  ${app.icon}  ${app.id.padEnd(16)} - ${app.description}`);
        }
        break;

      case 'ps':
        const procs = processManager.getAll();
        this.print(' PID   APP ID       STATE      PRIORITY');
        this.print('────────────────────────────────────────');
        for (const p of procs) {
          this.print(`  ${String(p.pid).padEnd(4)} ${p.appId.padEnd(12)} ${p.state.padEnd(10)} ${p.priority}`);
        }
        break;

      case 'kill':
        if (!args[0]) {
          this.print('Usage: kill <pid>', 'warn');
          break;
        }
        const pid = parseInt(args[0]);
        if (isNaN(pid)) {
          this.print('Invalid PID format.', 'err');
        } else {
          processManager.kill(pid);
          this.print(`Terminated process PID ${pid}`);
        }
        break;

      case 'open':
        if (!args[0]) {
          this.print('Usage: open <app_id>', 'warn');
          break;
        }
        windowManager.openWindow(args[0]);
        break;

      case 'exit':
        if (this.ctx && this.ctx.windowId) {
          windowManager.close(this.ctx.windowId);
        }
        break;

      default:
        this.print(`Unknown command: ${cmd}. Type 'help' for help.`, 'err');
    }
  }

  /* ── Standardized Lifecycles ── */

  suspend() {
    super.suspend();
    return {
      cwd: this.cwd,
      history: this.history,
      historyIndex: this.historyIndex
    };
  }

  resume(state = null) {
    if (state) {
      this.cwd = state.cwd || '/home';
      this.history = state.history || [];
      this.historyIndex = state.historyIndex || -1;
    }
    setTimeout(() => {
      if (this.inputEl) this.inputEl.focus();
    }, 50);
  }

  destroy() {
    super.destroy();
  }
}
