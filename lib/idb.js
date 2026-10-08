// Tiny IndexedDB key/value store for raw GPX/TCX/FIT files
const DB = 'vuka-lite';
const STORE = 'files';

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const putFile = (key, value) => tx('readwrite', (s) => s.put(value, key)).catch(() => {});
export const getFile = (key) => tx('readonly', (s) => s.get(key)).catch(() => undefined);
export const delFile = (key) => tx('readwrite', (s) => s.delete(key)).catch(() => {});
export const countFiles = () => tx('readonly', (s) => s.count()).catch(() => 0);
