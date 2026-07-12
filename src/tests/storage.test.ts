import { describe, expect, it, beforeEach } from 'vitest';
import { createStorage } from '../services/storage';
import type { AppState } from '../types';

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
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads state via localStorage fallback', async () => {
    const storage = createStorage({ mode: 'localstorage' });
    await storage.save(sampleState);
    const loaded = await storage.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.settings.theme).toBe('light');
  });

  it('clears stored state', async () => {
    const storage = createStorage({ mode: 'localstorage' });
    await storage.save(sampleState);
    await storage.clear();
    const loaded = await storage.load();
    expect(loaded).toBeNull();
  });
});
