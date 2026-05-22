/* ═══════════════════════════════════════════
   MUBIX OS — Boot Manager
   Splash screen orchestrator and subsystem init.
   ═══════════════════════════════════════════ */

import bus from '@core/event-bus.js';
import { $ } from '@utils/helpers.js';
import { perf } from '@kernel/performance.js';
import { scheduler } from '@kernel/scheduler.js';
import { vfs } from '@fs/vfs.js';
import { createDefaults } from '@fs/defaults.js';
import { windowManager } from '@ws/window-manager.js';
import { desktop } from '@ui/desktop.js';
import { dock } from '@ui/dock.js';
import { launcher } from '@ui/launcher.js';
import { notifications } from '@ui/notification.js';
import { contextMenu } from '@ui/context-menu.js';
import { settings } from '@services/settings.js';
import { theme } from '@services/theme.js';
import { power } from '@services/power.js';

export async function boot() {
  const bar = $('#boot-progress-bar');
  const setProgress = (w) => {
    if (bar) bar.style.width = `${w}%`;
  };

  const startTime = Date.now();

  try {
    // Step 1: Detect Hardware Performance Capability
    setProgress(15);
    await perf.detect();

    // Step 2: Initialize Virtual Filesystem
    setProgress(35);
    await vfs.init();
    await createDefaults();

    // Step 3: Load Persistent Settings
    setProgress(55);
    await settings.load();
    await theme.init();
    await power.init();

    // Step 4: Initialize Shell UI Components
    setProgress(75);
    desktop.init();
    windowManager.init();
    dock.init();
    launcher.init();
    notifications.init();
    contextMenu.init();

    // Step 5: Start scheduler and background optimizer loops
    setProgress(90);
    scheduler.start();

    // Register service worker if supported
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js');
    }

    // Cinematic artificial delay to let the boot splash animations play completely
    const elapsed = Date.now() - startTime;
    const minBootTime = 3000; // 3 seconds of high-fidelity cinematic loading
    const remainingTime = Math.max(0, minBootTime - elapsed);

    let currentProgress = 90;
    const progressInterval = setInterval(() => {
      if (currentProgress < 99) {
        currentProgress += 1;
        setProgress(currentProgress);
      }
    }, remainingTime / 10);

    await new Promise(resolve => setTimeout(resolve, remainingTime));
    clearInterval(progressInterval);

    setProgress(100);

    // Hide Splash Screen elegantly
    setTimeout(() => {
      const splash = $('#boot-splash');
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 800); // 800ms match css transition
      }

      // Show welcome toast notification
      bus.emit('notification:show', {
        title: 'MUBIX OS Loaded',
        message: `Running smoothly in Tier ${perf.tier} mode!`,
        icon: '🚀',
        duration: 5000
      });
    }, 400);

  } catch (e) {
    console.error('[Boot] Core System Panic:', e);
    const progress = $('.boot-progress');
    if (progress) progress.style.background = 'var(--mx-red)';
  }
}
