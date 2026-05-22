/* ═══════════════════════════════════════════
   MUBIX OS — Utilities
   Tiny DOM helpers, debounce, and ID gen.
   ═══════════════════════════════════════════ */

// ── DOM Helpers ──
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Create a DOM element with attributes and children.
 * @param {string} tag
 * @param {Object} attrs - { class, id, style, dataset, on, ... }
 * @param  {...(Node|string)} children
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class' || key === 'className') {
      if (Array.isArray(val)) el.className = val.filter(Boolean).join(' ');
      else el.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      for (const [sKey, sVal] of Object.entries(val)) {
        if (sKey.startsWith('--')) {
          el.style.setProperty(sKey, sVal);
        } else {
          el.style[sKey] = sVal;
        }
      }
    } else if (key === 'dataset') {
      Object.assign(el.dataset, val);
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === 'html') {
      el.innerHTML = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  // Flatten children to support arrays mapped to elements seamlessly
  const flatChildren = children.flat(Infinity);
  for (const child of flatChildren) {
    if (child == null) continue;
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

// ── Debounce / Throttle ──
export function debounce(fn, ms = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

// ── ID Generator ──
let _idCounter = 0;
export function uid(prefix = 'mx') {
  return `${prefix}-${++_idCounter}`;
}

// ── Misc ──
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
