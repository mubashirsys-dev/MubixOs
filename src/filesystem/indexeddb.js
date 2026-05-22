/* ═══════════════════════════════════════════
   MUBIX OS — IndexedDB Storage Backend
   Promise-based wrapper for filesystem storage.
   ═══════════════════════════════════════════ */

const DB_NAME = 'mubix-fs';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let _db = null;

/**
 * Open/create the IndexedDB database.
 */
export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        store.createIndex('parent', 'parent', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Execute a transaction.
 */
function tx(mode = 'readonly') {
  return _db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a file/folder entry by path.
 */
export function getEntry(path) {
  return promisify(tx().get(path));
}

/**
 * Put (create/update) an entry.
 */
export function putEntry(entry) {
  return promisify(tx('readwrite').put(entry));
}

/**
 * Delete an entry by path.
 */
export function deleteEntry(path) {
  return promisify(tx('readwrite').delete(path));
}

/**
 * Get all entries under a parent path.
 */
export function getChildren(parentPath) {
  return new Promise((resolve, reject) => {
    const store = tx();
    const idx = store.index('parent');
    const req = idx.getAll(parentPath);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all entries.
 */
export function getAllEntries() {
  return promisify(tx().getAll());
}

/**
 * Delete all entries under a parent (recursive).
 */
export async function deleteTree(path) {
  const children = await getChildren(path);
  for (const child of children) {
    if (child.type === 'directory') {
      await deleteTree(child.path);
    }
    await deleteEntry(child.path);
  }
  await deleteEntry(path);
}

/**
 * Check if an entry exists.
 */
export async function exists(path) {
  const entry = await getEntry(path);
  return !!entry;
}
