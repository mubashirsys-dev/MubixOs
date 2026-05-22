/* ═══════════════════════════════════════════
   MUBIX OS — Main Entry Point
   Imports and loads all core modules.
   ═══════════════════════════════════════════ */

// ── Global CSS Imports ──
import '@styles/reset.css';
import '@styles/variables.css';
import '@styles/liquidlite.css';
import '@styles/typography.css';
import '@styles/animations.css';
import '@styles/desktop.css';
import '@styles/dock.css';
import '@styles/window.css';
import '@styles/launcher.css';
import '@styles/notifications.css';

// ── Notepad App CSS Import ──
import '@apps/notepad/style.css';
import '@apps/calculator/style.css';
import '@apps/terminal/style.css';

// ── Boot Orchestrator ──
import { boot } from '@core/boot.js';

// Boot the system when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  boot();
});
