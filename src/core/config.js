/* ═══════════════════════════════════════════
   MUBIX OS — Config
   Global OS configuration and app registry.
   ═══════════════════════════════════════════ */

export const OS_CONFIG = {
  name: 'MUBIX OS',
  version: '1.0.0',
  tagline: 'The Future OS for Old Machines',

  // Process limits per tier
  maxProcesses: { 1: 3, 2: 5, 3: 8 },

  // Suspend after N ms of inactivity
  suspendAfterMs: 60_000,
  // Sleep (unload DOM) after N ms of inactivity
  sleepAfterMs: 300_000,

  // Scheduler interval
  schedulerIntervalMs: 10_000,
};

/**
 * App registry — all built-in apps.
 * Each app is lazy-loaded via dynamic import.
 */
export const APP_REGISTRY = [
  {
    id: 'notepad',
    name: 'Notepad',
    icon: '📝',
    category: 'productivity',
    description: 'Simple text editor',
    module: () => import('@apps/notepad/index.js'),
    defaultSize: { w: 560, h: 420 },
    singleton: false,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: '🧮',
    category: 'utilities',
    description: 'Scientific calculator',
    module: () => import('@apps/calculator/index.js'),
    defaultSize: { w: 340, h: 480 },
    singleton: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: '⌨️',
    category: 'system',
    description: 'System terminal',
    module: () => import('@apps/terminal/index.js'),
    defaultSize: { w: 640, h: 400 },
    singleton: false,
  },
  {
    id: 'file-manager',
    name: 'Files',
    icon: '📁',
    category: 'system',
    description: 'File manager',
    module: () => import('@apps/file-manager/index.js'),
    defaultSize: { w: 700, h: 450 },
    singleton: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    category: 'system',
    description: 'System settings',
    module: () => import('@apps/settings/index.js'),
    defaultSize: { w: 600, h: 450 },
    singleton: true,
  },
  {
    id: 'browser',
    name: 'Browser',
    icon: '🌐',
    category: 'internet',
    description: 'Web browser',
    module: () => import('@apps/browser/index.js'),
    defaultSize: { w: 900, h: 600 },
    singleton: false,
  },
  {
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    category: 'utilities',
    description: 'Clock and timer',
    module: () => import('@apps/clock/index.js'),
    defaultSize: { w: 350, h: 380 },
    singleton: true,
  },
  {
    id: 'media-player',
    name: 'Media Player',
    icon: '🎵',
    category: 'media',
    description: 'Audio and video player',
    module: () => import('@apps/media-player/index.js'),
    defaultSize: { w: 500, h: 400 },
    singleton: true,
  },
  {
    id: 'image-viewer',
    name: 'Photos',
    icon: '🖼️',
    category: 'media',
    description: 'Image viewer',
    module: () => import('@apps/image-viewer/index.js'),
    defaultSize: { w: 600, h: 450 },
    singleton: false,
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    icon: '💻',
    category: 'productivity',
    description: 'Lightweight code editor',
    module: () => import('@apps/code-editor/index.js'),
    defaultSize: { w: 750, h: 500 },
    singleton: false,
  },
  {
    id: 'youtube-lite',
    name: 'YouTube Lite',
    icon: '▶️',
    category: 'internet',
    description: 'Lightweight YouTube player',
    module: () => import('@apps/youtube-lite/index.js'),
    defaultSize: { w: 800, h: 550 },
    singleton: true,
  },
  {
    id: 'google-lite',
    name: 'Mubix Lite Search',
    icon: '🔍',
    category: 'internet',
    description: 'Lightweight Mubix search',
    module: () => import('@apps/google-lite/index.js'),
    defaultSize: { w: 700, h: 500 },
    singleton: true,
  },
];

/** Get app config by ID */
export function getAppConfig(appId) {
  return APP_REGISTRY.find(a => a.id === appId);
}

/** Get apps by category */
export function getAppsByCategory(category) {
  return APP_REGISTRY.filter(a => a.category === category);
}

/** Dock items — primary apps shown in dock */
export const DOCK_APPS = [
  'notepad', 'terminal', 'calculator', 'file-manager',
  'browser', 'settings',
];
