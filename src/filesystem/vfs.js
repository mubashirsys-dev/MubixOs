/* ═══════════════════════════════════════════
   MUBIX OS — Virtual Filesystem (VFS)
   UNIX-like API on top of IndexedDB.
   ═══════════════════════════════════════════ */

import * as db from '@fs/indexeddb.js';
import bus from '@core/event-bus.js';

function normalizePath(p) {
  if (!p || p === '/') return '/';
  const parts = p.split('/').filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') { stack.pop(); continue; }
    stack.push(part);
  }
  return '/' + stack.join('/');
}

function parentPath(p) {
  if (p === '/') return null;
  const idx = p.lastIndexOf('/');
  return idx === 0 ? '/' : p.slice(0, idx);
}

function basename(p) {
  if (p === '/') return '/';
  return p.split('/').filter(Boolean).pop();
}

export const vfs = {
  normalizePath,
  parentPath,
  basename,

  async init() {
    await db.openDB();
  },

  async mkdir(path, recursive = true) {
    path = normalizePath(path);
    if (path === '/') return;

    const existing = await db.getEntry(path);
    if (existing) {
      if (existing.type === 'directory') return;
      throw new Error(`Path exists and is not a directory: ${path}`);
    }

    if (recursive) {
      const parent = parentPath(path);
      if (parent && parent !== '/') {
        await this.mkdir(parent, true);
      }
    }

    await db.putEntry({
      path,
      parent: parentPath(path) || '/',
      type: 'directory',
      name: basename(path),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });

    bus.emit('vfs:changed', { action: 'mkdir', path });
  },

  async writeFile(path, content = '', mimeType = 'text/plain') {
    path = normalizePath(path);
    const parent = parentPath(path);
    if (parent) await this.mkdir(parent, true);

    await db.putEntry({
      path,
      parent: parent || '/',
      type: 'file',
      name: basename(path),
      content,
      mimeType,
      size: typeof content === 'string' ? content.length : content.byteLength || 0,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });

    bus.emit('vfs:changed', { action: 'write', path });
  },

  async readFile(path) {
    path = normalizePath(path);
    const entry = await db.getEntry(path);
    if (!entry) throw new Error(`File not found: ${path}`);
    if (entry.type !== 'file') throw new Error(`Not a file: ${path}`);
    return entry.content;
  },

  async readdir(path) {
    path = normalizePath(path);
    const children = await db.getChildren(path);
    return children.map(c => ({
      name: c.name,
      path: c.path,
      type: c.type,
      size: c.size || 0,
      modifiedAt: c.modifiedAt,
    }));
  },

  async stat(path) {
    path = normalizePath(path);
    const entry = await db.getEntry(path);
    if (!entry) return null;
    return {
      path: entry.path,
      name: entry.name,
      type: entry.type,
      size: entry.size || 0,
      mimeType: entry.mimeType,
      createdAt: entry.createdAt,
      modifiedAt: entry.modifiedAt,
    };
  },

  async delete(path) {
    path = normalizePath(path);
    const entry = await db.getEntry(path);
    if (!entry) return;
    if (entry.type === 'directory') {
      await db.deleteTree(path);
    } else {
      await db.deleteEntry(path);
    }

    bus.emit('vfs:changed', { action: 'delete', path });
  },

  async exists(path) {
    return db.exists(normalizePath(path));
  },

  async rename(oldPath, newPath) {
    oldPath = normalizePath(oldPath);
    newPath = normalizePath(newPath);
    const entry = await db.getEntry(oldPath);
    if (!entry) throw new Error(`Not found: ${oldPath}`);

    entry.path = newPath;
    entry.parent = parentPath(newPath) || '/';
    entry.name = basename(newPath);
    entry.modifiedAt = Date.now();

    await db.putEntry(entry);
    await db.deleteEntry(oldPath);

    bus.emit('vfs:changed', { action: 'rename', oldPath, newPath });
  },
};

export default vfs;
