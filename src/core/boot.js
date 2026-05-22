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

  // Wait for user gesture to boot in order to request immersive fullscreen
  const powerBtn = $('#boot-power-btn');
  const powerContainer = $('#boot-power-container');
  const progressContainer = document.querySelector('.boot-progress');

  if (progressContainer) {
    progressContainer.style.opacity = '0';
  }

  await new Promise(resolve => {
    if (!powerBtn) {
      resolve();
      return;
    }
    powerBtn.addEventListener('click', async () => {
      // 1. Enter Fullscreen Mode
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      } catch (err) {
        console.warn('[Boot] Fullscreen request rejected or unsupported:', err);
      }

      // 2. Hide power button cleanly and show loading bar
      if (powerContainer) {
        powerContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        powerContainer.style.opacity = '0';
        powerContainer.style.transform = 'scale(0.95)';
        setTimeout(() => {
          powerContainer.remove();
          if (progressContainer) {
            progressContainer.style.transition = 'opacity 0.3s ease';
            progressContainer.style.opacity = '1';
          }
          resolve();
        }, 400);
      } else {
        if (progressContainer) progressContainer.style.opacity = '1';
        resolve();
      }
    }, { once: true });
  });

  const startTime = Date.now();
  const minBootTime = 3200; // 3.2s cinematic load duration

  // 1. Run all subsystems and filesystem initializations in parallel background thread
  const initPromise = (async () => {
    await perf.detect();
    await vfs.init();
    await createDefaults();
    await settings.load();
    await theme.init();
    await power.init();

    desktop.init();
    windowManager.init();
    dock.init();
    launcher.init();
    notifications.init();
    contextMenu.init();

    scheduler.start();

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js');
    }
  })();

  // 2. Animate the progress bar continuously and fluidly using a premium sine-curve interpolation
  let currentProgress = 0;
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const ratio = elapsed / minBootTime;

    if (ratio < 1) {
      // Sine easing for a satisfying slow-taper progress movement
      currentProgress = Math.round(98 * Math.sin(ratio * Math.PI / 2));
      setProgress(currentProgress);
    }
  }, 50);

  // 3. Wait for both the minimum cinematic duration and the subsystem loads to resolve
  try {
    await Promise.all([
      initPromise,
      new Promise(resolve => setTimeout(resolve, minBootTime))
    ]);

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
    }, 450);

  } catch (e) {
    clearInterval(progressInterval);
    console.error('[Boot] Core System Panic:', e);
    const progress = $('.boot-progress');
    if (progress) progress.style.background = 'var(--mx-red)';
  }
}
