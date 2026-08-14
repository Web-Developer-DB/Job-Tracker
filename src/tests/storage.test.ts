import { describe, expect, it, beforeEach } from 'vitest';
import { createStorage } from '../services/storage';
import type { AppState } from '../types';

const STORAGE_KEY = 'job-tracker-state';

const sampleState: AppState = {
  applications: [],
  tasks: [],
  settings: {
    theme: 'light',
    sort: 'createdAt',
    filterStatus: 'Alle',
    filterRange: 'all',
    search: '',
    weeklyGoal: 5
  }
};

describe('storage service', () => {
  beforeEach(async () => {
    localStorage.clear();
    await createStorage({ mode: 'indexeddb' }).clear();
  });

  it('saves and loads state via localStorage fallback', async () => {
    const storage = createStorage({ mode: 'localstorage' });
    await storage.save(sampleState);
    const loaded = await storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.settings.theme).toBe('light');
  });

  it('loads localStorage fallback when IndexedDB has no state', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));

    const storage = createStorage({ mode: 'indexeddb' });
    const loaded = await storage.load();

    expect(loaded).toEqual(sampleState);
  });

  it('clears stored state', async () => {
    const storage = createStorage({ mode: 'localstorage' });
    await storage.save(sampleState);
    await storage.clear();
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });

  it('clears both IndexedDB and localStorage fallback data', async () => {
    const storage = createStorage({ mode: 'indexeddb' });
    await storage.save(sampleState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));

    await storage.clear();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await storage.load()).toBeNull();
  });
});
