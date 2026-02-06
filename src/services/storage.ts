import type { AppState } from '../types';

export interface StorageDriver {
  load: () => Promise<AppState | null>;
  save: (state: AppState) => Promise<void>;
  clear: () => Promise<void>;
}

interface StorageOptions {
  mode?: 'auto' | 'indexeddb' | 'localstorage';
}

// Schlüssel und Namen für die Storage-Schicht.
const STORAGE_KEY = 'job-tracker-state';
const DB_NAME = 'job-tracker-db';
const STORE_NAME = 'kv';

// Prüfen, ob IndexedDB im Browser verfügbar ist.
const isIndexedDbAvailable = (): boolean =>
  typeof indexedDB !== 'undefined' && typeof indexedDB.open === 'function';

// Factory: liefert entweder IndexedDB- oder localStorage-Implementierung.
export const createStorage = (options: StorageOptions = {}): StorageDriver => {
  const mode = options.mode ?? 'auto';
  const useIndexedDb = mode === 'indexeddb' || (mode === 'auto' && isIndexedDbAvailable());

  if (useIndexedDb) {
    return {
      // Laden aus IndexedDB, bei Fehler fallback auf localStorage.
      load: async () => {
        try {
          return await idbGet<AppState>(STORAGE_KEY);
        } catch (err) {
          console.warn('IndexedDB load failed, falling back to localStorage.', err);
          return localLoad();
        }
      },
      // Speichern in IndexedDB, bei Fehler fallback auf localStorage.
      save: async (state) => {
        try {
          await idbSet(STORAGE_KEY, state);
        } catch (err) {
          console.warn('IndexedDB save failed, falling back to localStorage.', err);
          localSave(state);
        }
      },
      // Löschen in IndexedDB, bei Fehler fallback auf localStorage.
      clear: async () => {
        try {
          await idbDelete(STORAGE_KEY);
        } catch (err) {
          console.warn('IndexedDB clear failed, falling back to localStorage.', err);
          localClear();
        }
      }
    };
  }

  // Reiner localStorage-Modus (z.B. in sehr alten Browsern).
  return {
    load: async () => localLoad(),
    save: async (state) => localSave(state),
    clear: async () => localClear()
  };
};

// Standard-Storage für die App.
export const storage = createStorage();

// localStorage: laden.
const localLoad = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch (err) {
    console.warn('localStorage load failed.', err);
    return null;
  }
};

// localStorage: speichern.
const localSave = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('localStorage save failed.', err);
  }
};

// localStorage: löschen.
const localClear = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('localStorage clear failed.', err);
  }
};

// IndexedDB: Datenbank öffnen (legt Store an, falls nötig).
const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Hilfsfunktion: Transaktion starten und Request ausführen.
const withStore = async <T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

// IndexedDB: lesen.
const idbGet = async <T>(key: string): Promise<T | null> => {
  const result = await withStore<T | undefined>('readonly', (store) => store.get(key));
  return result ?? null;
};

// IndexedDB: schreiben.
const idbSet = async <T>(key: string, value: T): Promise<void> => {
  await withStore('readwrite', (store) => store.put(value as unknown as T, key));
};

// IndexedDB: löschen.
const idbDelete = async (key: string): Promise<void> => {
  await withStore('readwrite', (store) => store.delete(key));
};
