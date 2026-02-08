import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, JobApplication } from '../types';

const mockUseAppStore = vi.fn();
const mockPrint = vi.fn();

vi.mock('../store/appStore', () => ({
  useAppStore: () => mockUseAppStore()
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => mockPrint
}));

import App from '../App';

const createApplication = (patch: Partial<JobApplication> = {}): JobApplication => ({
  id: 'app-1',
  status: 'Entwurf',
  company: 'Acme',
  position: 'Engineer',
  createdAt: '2025-01-10T10:00:00.000Z',
  updatedAt: '2025-01-10T10:00:00.000Z',
  ...patch
});

const createAppState = (): AppState => ({
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
});

const createStoreSlice = () => ({
  ...createAppState(),
  isHydrated: true,
  hydrate: vi.fn(async () => undefined),
  flushSave: vi.fn(async () => undefined),
  addApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
  changeStatus: vi.fn(),
  addTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  setFilters: vi.fn(),
  setTheme: vi.fn(),
  setWeeklyGoal: vi.fn(),
  exportBackup: vi.fn(() => ({
    version: '1.0' as const,
    createdAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
    data: createAppState()
  })),
  importBackup: vi.fn(),
  resetAll: vi.fn(async () => undefined)
});

describe('App', () => {
  beforeEach(() => {
    mockUseAppStore.mockReset();
    mockPrint.mockReset();
  });

  it('renders skeleton while store is not hydrated', () => {
    const store = createStoreSlice();
    store.isHydrated = false;
    mockUseAppStore.mockReturnValue(store);

    const { container } = render(<App />);
    expect(store.hydrate).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText(/job tracker/i)).not.toBeInTheDocument();
  });

  it('toggles theme, triggers print and flushes save on pagehide', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    render(<App />);
    expect(store.hydrate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /hellmodus/i }));
    expect(store.setTheme).toHaveBeenCalledWith('light');

    await user.click(screen.getByRole('button', { name: /pdf \/ drucken/i }));
    expect(mockPrint).toHaveBeenCalledTimes(1);

    fireEvent(window, new Event('pagehide'));
    expect(store.flushSave).toHaveBeenCalledTimes(1);
  });

  it('resets filters from empty filtered list view', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    store.applications = [createApplication()];
    store.settings.search = 'kein-treffer';
    store.settings.filterStatus = 'Beworben';
    mockUseAppStore.mockReturnValue(store);

    render(<App />);

    expect(screen.getByText(/keine treffer für die aktuellen filter/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /filter zurücksetzen/i })[0]);

    expect(store.setFilters).toHaveBeenCalledWith({
      status: 'Alle',
      range: 'all',
      search: '',
      sort: 'createdAt'
    });
  });
});
