import { create, type StateCreator } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { AppState, BackupFile, FilterSettings, JobApplication, Task, ThemeMode } from '../types';
import {
  addApplication,
  addTask,
  buildBackup,
  changeStatus,
  createApplication,
  createTask,
  defaultState,
  deleteApplication,
  deleteTask,
  restoreBackup,
  updateApplication,
  updateTask
} from '../services/logic';
import { storage, type StorageDriver } from '../services/storage';
import { applyTheme, resolveInitialTheme } from '../services/theme';

// Zustand-Slice: alle Daten + Aktionen der App.
export interface AppStoreState extends AppState {
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addApplication: (data: Partial<JobApplication>) => void;
  updateApplication: (id: string, patch: Partial<JobApplication>) => void;
  deleteApplication: (id: string) => void;
  changeStatus: (id: string, status: JobApplication['status']) => void;
  addTask: (data: Partial<Task>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilters: (filters: FilterSettings) => void;
  setTheme: (theme: ThemeMode) => void;
  exportBackup: () => BackupFile;
  importBackup: (backup: BackupFile) => void;
  resetAll: () => Promise<void>;
}

// Erstellt den Store. Optional kann ein anderer Storage-Treiber übergeben werden.
const createState = (driver: StorageDriver = storage): StateCreator<AppStoreState> => {
  let saveTimeout: ReturnType<typeof setTimeout> | undefined;
  const clearScheduledSave = () => {
    if (!saveTimeout) return;
    clearTimeout(saveTimeout);
    saveTimeout = undefined;
  };

  // Speichern mit kleinem Debounce, damit nicht bei jedem Klick geschrieben wird.
  const scheduleSave = (state: AppStoreState) => {
    clearScheduledSave();
    const payload = pickAppState(state);
    saveTimeout = setTimeout(() => {
      driver.save(payload).catch((err) => console.warn('Auto-save failed.', err));
    }, 250);
  };

  return (set, get): AppStoreState => ({
    ...defaultState,
    isHydrated: false,
    // Initiales Laden aus dem Storage (wird einmal beim Start aufgerufen).
    hydrate: async () => {
      const stored = await driver.load();
      const storedState = stored ? restoreBackup({ version: '1.0', createdAt: new Date().toISOString(), data: stored }) : defaultState;
      const theme = resolveInitialTheme(storedState.settings.theme);
      applyTheme(theme);
      set(() => ({
        ...storedState,
        settings: { ...storedState.settings, theme },
        isHydrated: true
      }));
    },
    // Bewerbung hinzufügen.
    addApplication: (data) => {
      set((state) => {
        const created = createApplication(data);
        const applications = addApplication(state.applications, created);
        const next = { ...state, applications };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Bewerbung aktualisieren.
    updateApplication: (id, patch) => {
      set((state) => {
        const applications = updateApplication(state.applications, id, patch);
        const next = { ...state, applications };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Bewerbung löschen (inkl. Aufgaben).
    deleteApplication: (id) => {
      set((state) => {
        const applications = deleteApplication(state.applications, id);
        const tasks = state.tasks.filter((task) => task.applicationId !== id);
        const next = { ...state, applications, tasks };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Status wechseln.
    changeStatus: (id, status) => {
      set((state) => {
        const applications = changeStatus(state.applications, id, status);
        const next = { ...state, applications };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Aufgabe hinzufügen.
    addTask: (data) => {
      set((state) => {
        const created = createTask(data);
        const tasks = addTask(state.tasks, created);
        const next = { ...state, tasks };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Aufgabe aktualisieren.
    updateTask: (id, patch) => {
      set((state) => {
        const tasks = updateTask(state.tasks, id, patch);
        const next = { ...state, tasks };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Aufgabe löschen.
    deleteTask: (id) => {
      set((state) => {
        const tasks = deleteTask(state.tasks, id);
        const next = { ...state, tasks };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Filter/Sortierung aktualisieren.
    setFilters: (filters) => {
      set((state) => {
        const settings = {
          ...state.settings,
          sort: filters.sort,
          filterStatus: filters.status,
          filterRange: filters.range,
          search: filters.search
        };
        const next = { ...state, settings };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Theme umschalten und speichern.
    setTheme: (theme) => {
      applyTheme(theme);
      set((state) => {
        const settings = { ...state.settings, theme };
        const next = { ...state, settings };
        scheduleSave(next as AppStoreState);
        return next;
      });
    },
    // Backup erstellen.
    exportBackup: () => buildBackup(pickAppState(get())),
    // Backup importieren.
    importBackup: (backup) => {
      const restored = restoreBackup(backup);
      set(() => ({
        ...restored,
        isHydrated: true
      }));
      applyTheme(restored.settings.theme);
      scheduleSave(get());
    },
    // Alles löschen und auf Standard zurücksetzen.
    resetAll: async () => {
      clearScheduledSave();
      set(() => ({
        ...defaultState,
        isHydrated: true
      }));
      applyTheme(defaultState.settings.theme);
      await driver.clear();
    }
  });
};

// Für Tests: Store-Factory mit eigenem Storage.
export const createAppStore = (driver?: StorageDriver) => createStore<AppStoreState>(createState(driver));

// Standard-Store für die App.
export const useAppStore = create<AppStoreState>(createState(storage));

// Nur die echten App-Daten (ohne Methoden) extrahieren.
const pickAppState = (state: AppStoreState): AppState => ({
  applications: state.applications,
  tasks: state.tasks,
  settings: state.settings
});
