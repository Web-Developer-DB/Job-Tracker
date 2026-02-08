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
    search: '',
    weeklyGoal: 5
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

  it('persists weekly goal immediately', async () => {
    const saveMock = vi.fn<(state: AppState) => Promise<void>>(async () => undefined);
    const driver: StorageDriver = {
      load: vi.fn(async () => baseState),
      save: saveMock,
      clear: vi.fn(async () => undefined)
    };

    const store = createAppStore(driver);
    store.getState().setWeeklyGoal(9);
    await flush();

    expect(saveMock).toHaveBeenCalledTimes(1);
    const savedState = saveMock.mock.calls[0][0] as AppState;
    expect(savedState.settings.weeklyGoal).toBe(9);
  });

  it('flushes pending save on flushSave', async () => {
    const saveMock = vi.fn<(state: AppState) => Promise<void>>(async () => undefined);
    const driver: StorageDriver = {
      load: vi.fn(async () => baseState),
      save: saveMock,
      clear: vi.fn(async () => undefined)
    };

    const store = createAppStore(driver);
    store.getState().addApplication({ company: 'Acme' });
    expect(saveMock).toHaveBeenCalledTimes(0);

    await store.getState().flushSave();
    expect(saveMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    await flush();
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it('hydrates missing weeklyGoal with default value', async () => {
    const legacyState = {
      applications: [],
      tasks: [],
      settings: {
        theme: 'light',
        sort: 'createdAt',
        filterStatus: 'Alle',
        filterRange: 'all',
        search: ''
      }
    } as unknown as AppState;

    const driver: StorageDriver = {
      load: vi.fn(async () => legacyState),
      save: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined)
    };

    const store = createAppStore(driver);
    await store.getState().hydrate();

    expect(store.getState().settings.weeklyGoal).toBe(5);
  });
});
