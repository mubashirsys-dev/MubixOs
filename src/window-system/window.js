/* ═══════════════════════════════════════════
   MUBIX OS — Window Component
   Individual window DOM construction & behavior.
   ═══════════════════════════════════════════ */

import { h, clamp } from '@utils/helpers.js';

/**
 * Create a window DOM element.
 * @param {object} data - { id, title, icon, x, y, w, h, zIndex }
 * @param {object} wm - WindowManager reference
 * @returns {HTMLElement}
 */
export function createWindow(data, wm) {
  const { id, title, icon, x, y, w, h: height, zIndex } = data;

  // ── Title bar controls ──
  const btnClose = h('button', { class: 'window-btn window-btn-close', title: 'Close' });
  const btnMin = h('button', { class: 'window-btn window-btn-minimize', title: 'Minimize' });
  const btnMax = h('button', { class: 'window-btn window-btn-maximize', title: 'Maximize' });

  const controls = h('div', { class: 'window-controls' }, btnClose, btnMin, btnMax);
  const titleText = h('span', { class: 'window-title' }, `${icon} ${title}`);
  const titlebar = h('div', { class: 'window-titlebar' }, controls, titleText);

  // ── Body ──
  const body = h('div', { class: 'window-body' });

  // ── Resize handles ──
  const handles = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'].map(dir =>
    h('div', { class: `window-resize resize-${dir}`, dataset: { dir } })
  );

  // ── Window container ──
  const win = h('div', {
    class: 'mx-window ll-window',
    id,
    style: {
      width: w + 'px',
      height: height + 'px',
      '--wx': x + 'px',
      '--wy': y + 'px',
      '--wz': zIndex,
    }
  }, titlebar, body, ...handles);

  // ── Event Handlers ──

  // Focus on click
  win.addEventListener('pointerdown', () => wm.focus(id), true);

  // Close
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); wm.close(id); });
  // Minimize
  btnMin.addEventListener('click', (e) => { e.stopPropagation(); wm.minimize(id); });
  // Maximize
  btnMax.addEventListener('click', (e) => { e.stopPropagation(); wm.toggleMaximize(id); });
  // Double-click titlebar to maximize
  titlebar.addEventListener('dblclick', () => wm.toggleMaximize(id));

  // ── Drag ──
  setupDrag(win, titlebar, id, data, wm);

  // ── Resize ──
  for (const handle of handles) {
    setupResize(win, handle, id, data, wm);
  }

  return win;
}

/**
 * Drag handler — uses standard-compliant Pointer Capture API for seamless dragging over iframes.
 */
/**
 * Drag handler — uses standard-compliant Pointer Capture API for seamless dragging over iframes.
 */
function setupDrag(win, titlebar, id, data, wm) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origX = 0;
  let origY = 0;

  const onPointerMove = (e) => {
    if (!dragging) return;

    const winData = wm.windows.get(id);
    if (!winData) return;

    // Calculate delta relative to original pointer coordinates
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = origX + dx;
    let newY = origY + dy;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dockHeight = 75;

    // Viewport bounds clamping: titlebar must remain accessible and on-screen
    const maxX = vw - 50; 
    const minX = -winData.w + 50; 
    const maxY = vh - dockHeight - 30; 
    const minY = 0; 

    newX = clamp(newX, minX, maxX);
    newY = clamp(newY, minY, maxY);

    // Snap target overlays
    if (e.clientX <= 6) wm.showSnapPreview('left');
    else if (e.clientX >= vw - 6) wm.showSnapPreview('right');
    else if (e.clientY <= 6) wm.showSnapPreview('top');
    else wm.hideSnapPreview();

    // Zero-latency transform application bypasses RAF queue to track cursor 1:1
    winData.x = newX;
    winData.y = newY;
    win.style.setProperty('--wx', newX + 'px');
    win.style.setProperty('--wy', newY + 'px');
  };

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;

    try {
      titlebar.releasePointerCapture(e.pointerId);
    } catch (err) {}

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);

    win.style.transition = '';
    win.classList.remove('dragging');
    document.body.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    wm.hideSnapPreview();

    const winData = wm.windows.get(id);
    if (!winData) return;

    // Snap triggering on release
    const vw = window.innerWidth;
    if (e.clientX <= 6) {
      wm.snap(id, 'left');
    } else if (e.clientX >= vw - 6) {
      wm.snap(id, 'right');
    } else if (e.clientY <= 6) {
      wm.toggleMaximize(id);
    } else {
      if (wm.saveLastPosition) {
        wm.saveLastPosition(id, winData.x, winData.y);
      }
    }
  };

  titlebar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // Drag on left click only
    if (e.target.closest('.window-controls')) return;

    const winData = wm.windows.get(id);
    if (!winData || winData.state === 'maximized') return;

    wm.focus(id);

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = winData.x;
    origY = winData.y;

    // Seamless un-snapping if window is currently snapped
    if (winData.state && winData.state.startsWith('snapped')) {
      winData.state = 'normal';
      win.classList.remove('snapped-left', 'snapped-right');
      win.style.width = winData.w + 'px';
      win.style.height = winData.h + 'px';

      // Center horizontally under cursor
      origX = e.clientX - winData.w / 2;
      origY = e.clientY - 18;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      origX = clamp(origX, 0, vw - winData.w);
      origY = clamp(origY, 0, vh - 75 - 36);

      winData.x = origX;
      winData.y = origY;
      win.style.setProperty('--wx', origX + 'px');
      win.style.setProperty('--wy', origY + 'px');
    }

    try {
      titlebar.setPointerCapture(e.pointerId);
    } catch (err) {}

    win.style.transition = 'none';
    win.classList.add('dragging');
    document.body.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  });
}

/**
 * Resize handler — edges and corners.
 */
function setupResize(win, handle, id, data, wm) {
  const dir = handle.dataset.dir;
  let resizing = false;
  let startX, startY, origW, origH, origX, origY;

  handle.addEventListener('pointerdown', (e) => {
    const winData = wm.windows.get(id);
    if (!winData || winData.state !== 'normal') return;

    resizing = true;
    e.stopPropagation();
    startX = e.clientX;
    startY = e.clientY;
    origW = winData.w;
    origH = winData.h;
    origX = winData.x;
    origY = winData.y;
    handle.setPointerCapture(e.pointerId);
    win.style.transition = 'none';
    win.classList.add('resizing');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const winData = wm.windows.get(id);
    if (!winData) return;

    let newW = origW, newH = origH, newX = origX, newY = origY;

    // Minimum window size constraints (320x240)
    const minW = 320;
    const minH = 240;
    const maxW = window.innerWidth;
    const maxH = window.innerHeight - 80;

    if (dir.includes('e')) {
      newW = clamp(origW + dx, minW, maxW - origX);
    }
    if (dir.includes('w')) {
      const computedW = origW - dx;
      if (computedW >= minW) {
        newW = computedW;
        newX = origX + dx;
      }
    }
    if (dir.includes('s')) {
      newH = clamp(origH + dy, minH, maxH - origY);
    }
    if (dir.includes('n')) {
      const computedH = origH - dy;
      if (computedH >= minH) {
        newH = computedH;
        newY = origY + dy;
      }
    }

    winData.w = newW;
    winData.h = newH;
    winData.x = newX;
    winData.y = newY;

    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
    win.style.setProperty('--wx', newX + 'px');
    win.style.setProperty('--wy', newY + 'px');
  });

  const endResize = () => {
    if (!resizing) return;
    resizing = false;
    win.style.transition = '';
    win.classList.remove('resizing');
  };

  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
}
