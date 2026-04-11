// src/hooks/useProjectPersistence.ts
// IndexedDB-based persistence for Horror Studio project

const DB_NAME = 'HorrorStudioDB';
const DB_VERSION = 1;
const BLOBS_STORE = 'imageBlobs';
const PROJECT_STORE = 'projectState';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImageBlob(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    const store = tx.objectStore(BLOBS_STORE);
    store.put({ id, file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadAllImageBlobs(): Promise<{ id: string; file: File }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readonly');
    const store = tx.objectStore(BLOBS_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImageBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS_STORE, 'readwrite');
    const store = tx.objectStore(BLOBS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveProject(data: object): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, 'readwrite');
    const store = tx.objectStore(PROJECT_STORE);
    store.put({ key: 'current', ...data });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadProject(): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, 'readonly');
    const store = tx.objectStore(PROJECT_STORE);
    const req = store.get('current');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
