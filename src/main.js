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
import '@apps/browser/style.css';
import '@apps/clock/style.css';
import '@apps/code-editor/style.css';
import '@apps/file-manager/style.css';
import '@apps/google-lite/style.css';
import '@apps/image-viewer/style.css';
import '@apps/media-player/style.css';
import '@apps/settings/style.css';
import '@apps/youtube-lite/style.css';

// ── Boot Orchestrator ──
import { boot } from '@core/boot.js';

// Boot the system when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  boot();
});
