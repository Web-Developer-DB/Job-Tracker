import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../store/appStore';
import type { AppState } from '../types';
import type { StorageDriver } from '../services/storage';

const baseState: AppState = {
  applications: [],
  tasks: [],
  settings: {
    theme: 'dark',
    sort: 'createdAt',
    filterStatus: 'Alle',
    filterRange: 'all',
    search: ''
  }
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('app store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels pending auto-save when resetAll is called', async () => {
    const driver: StorageDriver = {
      load: vi.fn(async () => baseState),
      save: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined)
    };

    const store = createAppStore(driver);
    store.getState().addApplication({ company: 'Acme' });

    await store.getState().resetAll();
    vi.advanceTimersByTime(300);
    await flush();

    expect(driver.clear).toHaveBeenCalledTimes(1);
    expect(driver.save).not.toHaveBeenCalled();
  });
});
