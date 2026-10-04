import { WireGenProject, WireframeScreen } from '@/types/wireframe';

const DB_NAME = 'wiregen_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('IndexedDB is only accessible in browser environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: WireGenProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ ...project, updatedAt: Date.now() });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to save to IndexedDB, fallback to localStorage', e);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`wiregen_project_${project.id}`, JSON.stringify(project));
    }
  }
}

export async function loadProject(id: string): Promise<WireGenProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(`wiregen_project_${id}`);
      return item ? JSON.parse(item) : null;
    }
    return null;
  }
}

export async function listProjects(): Promise<{ id: string; name: string; updatedAt: number; screenCount: number }[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const projects = (req.result || []) as WireGenProject[];
        resolve(
          projects.map((p) => ({
            id: p.id,
            name: p.name,
            updatedAt: p.updatedAt,
            screenCount: p.screens ? p.screens.length : 0
          }))
        );
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
