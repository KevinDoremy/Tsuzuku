const DB_NAME = 'tsuzuku_fs';
const STORE_NAME = 'handles';
const FILE_NAME = 'tsuzuku.json';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDirHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get('dir');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function saveDirHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(handle, 'dir');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Safe to call without a user gesture
async function hasPermission(handle) {
  return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
}

// Requires a user gesture (click handler)
export async function requestAccess(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

export async function writeList(handle, list) {
  if (!(await hasPermission(handle))) return false;
  const fileHandle = await handle.getFileHandle(FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(list, null, 2));
  await writable.close();
  return true;
}

export async function readList(handle) {
  if (!(await hasPermission(handle))) return null;
  try {
    const fileHandle = await handle.getFileHandle(FILE_NAME);
    const text = await (await fileHandle.getFile()).text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function getFileLastModified(handle) {
  if (!(await hasPermission(handle))) return 0;
  try {
    const fileHandle = await handle.getFileHandle(FILE_NAME);
    const file = await fileHandle.getFile();
    return file.lastModified;
  } catch {
    return 0;
  }
}

export async function pickDir() {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await saveDirHandle(handle);
  return handle;
}
