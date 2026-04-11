import { useEffect, useCallback } from 'react';
import type { UploadedImage } from '@/lib/animations';

const DB_NAME = 'HorrorStudioDB';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_PROJECT = 'project';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECT)) {
        db.createObjectStore(STORE_PROJECT);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save a single image file blob to IndexedDB
async function saveImageBlob(id: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    tx.objectStore(STORE_IMAGES).put({ id, file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Load all image blobs from IndexedDB
async function loadAllImageBlobs(): Promise<{ id: string; file: File }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const req = tx.objectStore(STORE_IMAGES).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteImageBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    tx.objectStore(STORE_IMAGES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Project state (animations, positions, environment, sounds, etc.)
type ProjectState = {
  images: Omit<UploadedImage, 'file' | 'url'>[];
  selectedId: string | null;
  aspectRatio: string;
  greenScreen: boolean;
  animMode: string;
  activeParticles: string[];
  activeSounds: string[];
  masterVolume: number;
  activeEnvironment: string | null;
};

async function saveProject(state: ProjectState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECT, 'readwrite');
    tx.objectStore(STORE_PROJECT).put(state, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadProject(): Promise<ProjectState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECT, 'readonly');
      const req = tx.objectStore(STORE_PROJECT).get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export type { ProjectState };
export { saveImageBlob, loadAllImageBlobs, deleteImageBlob, saveProject, loadProject };

// Hook for auto-save
export function useAutoSave(state: ProjectState, images: UploadedImage[], enabled: boolean) {
  const save = useCallback(async () => {
    if (!enabled) return;
    try {
      await saveProject(state);
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  }, [state, enabled]);

  useEffect(() => {
    const timeout = setTimeout(save, 800);
    return () => clearTimeout(timeout);
  }, [save]);
}
