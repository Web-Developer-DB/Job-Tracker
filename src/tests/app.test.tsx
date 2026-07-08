import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, JobApplication } from '../types';
import { ToastProvider } from '../components/ui';

const mockUseAppStore = vi.fn();
const mockPrint = vi.fn();
const originalMatchMedia = window.matchMedia;
const originalShowSaveFilePicker = (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

vi.mock('../store/appStore', () => ({
  useAppStore: () => mockUseAppStore()
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => mockPrint
}));

import App from '../App';

const renderApp = () =>
  render(
    <ToastProvider>
      <App />
    </ToastProvider>
  );

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

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker = originalShowSaveFilePicker;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('renders skeleton while store is not hydrated', () => {
    const store = createStoreSlice();
    store.isHydrated = false;
    mockUseAppStore.mockReturnValue(store);

    const { container } = renderApp();
    expect(store.hydrate).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText(/job tracker/i)).not.toBeInTheDocument();
  });

  it('toggles theme, triggers print and flushes save on pagehide', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    renderApp();
    expect(store.hydrate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /hellmodus/i }));
    expect(store.setTheme).toHaveBeenCalledWith('light');

    await user.click(screen.getByRole('button', { name: /pdf \/ drucken/i }));
    expect(mockPrint).toHaveBeenCalledTimes(1);

    fireEvent(window, new Event('pagehide'));
    expect(store.flushSave).toHaveBeenCalledTimes(1);
  });

  it('uses native printing in standalone mode', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })) as unknown as typeof window.matchMedia;

    const nativePrintSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    renderApp();
    await user.click(screen.getByRole('button', { name: /pdf \/ drucken/i }));

    expect(nativePrintSpy).toHaveBeenCalledTimes(1);
    expect(mockPrint).not.toHaveBeenCalled();
  });

  it('marks the mobile action bar as print-hidden', () => {
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    renderApp();

    expect(screen.getByRole('navigation', { name: /mobile hauptaktionen/i })).toHaveClass('print-hidden');
  });

  it('resets filters from empty filtered list view', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    store.applications = [createApplication()];
    store.settings.search = 'kein-treffer';
    store.settings.filterStatus = 'Beworben';
    mockUseAppStore.mockReturnValue(store);

    renderApp();

    expect(screen.getByText(/keine treffer für die aktuellen filter/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /filter zurücksetzen/i })[0]);

    expect(store.setFilters).toHaveBeenCalledWith({
      status: 'Alle',
      range: 'all',
      search: '',
      sort: 'createdAt'
    });
  });

  it('sets the status filter from the dashboard overview', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    store.applications = [
      createApplication({ id: 'app-1', company: 'Alpha', status: 'Beworben' }),
      createApplication({ id: 'app-2', company: 'Beta', status: 'Abgelehnt' })
    ];
    mockUseAppStore.mockReturnValue(store);

    renderApp();

    await user.click(screen.getByRole('button', { name: /bewerbungen mit status beworben anzeigen/i }));

    expect(store.setFilters).toHaveBeenCalledWith({
      status: 'Beworben',
      range: 'all',
      search: '',
      sort: 'createdAt'
    });
  });

  it('uses the file picker for backup export when supported', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    const write = vi.fn<(payload: string) => Promise<void>>(async (_payload) => undefined);
    const close = vi.fn(async () => undefined);
    const createWritable = vi.fn(async () => ({ write, close }));
    const showSaveFilePicker = vi.fn(async () => ({ createWritable }));
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker = showSaveFilePicker;

    renderApp();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /sichern/i }));
      await Promise.resolve();
    });

    expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(createWritable).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    const exportedJson = write.mock.calls[0][0] as string;
    expect(JSON.parse(exportedJson)).toEqual(store.exportBackup());
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('falls back to download and shows a notice when file picker is unsupported', async () => {
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker = undefined;
    URL.createObjectURL = vi.fn(() => 'blob:backup-url');
    URL.revokeObjectURL = vi.fn();

    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /sichern/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/backup heruntergeladen/i)
    ).toBeInTheDocument();
  });

  it('silently aborts backup export when the picker dialog is cancelled', async () => {
    const user = userEvent.setup();
    const store = createStoreSlice();
    mockUseAppStore.mockReturnValue(store);

    const showSaveFilePicker = vi.fn(async () => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    });
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker = showSaveFilePicker;

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL');

    renderApp();
    await user.click(screen.getByRole('button', { name: /sichern/i }));

    expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(createObjectUrlSpy).not.toHaveBeenCalled();
  });
});
