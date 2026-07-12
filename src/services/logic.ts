import type {
  AppState,
  ApplicationStatus,
  FilterRange,
  FilterSettings,
  JobApplication,
  SortOption,
  Task,
  BackupFile,
  DashboardStats,
  ThemeMode
} from '../types';
import { normalizeDateOnly, parseDateValue, stripTime, toDateOnly } from './date';

// Feste Reihenfolge für Status-Sortierung.
const STATUS_ORDER: ApplicationStatus[] = [
  'Entwurf',
  'Beworben',
  'Interview',
  'Angebot',
  'Abgelehnt',
  'Zurückgezogen'
];

const TERMINAL_STATUSES: ApplicationStatus[] = ['Abgelehnt', 'Zurückgezogen'];
const SORT_OPTIONS: SortOption[] = ['createdAt', 'status', 'followUp'];
const FILTER_RANGES: FilterRange[] = ['all', '7d', '14d', '30d', '90d', '180d', '365d'];
const THEME_MODES: ThemeMode[] = ['light', 'dark'];
const TASK_TYPES: Task['type'][] = ['task', 'interview', 'reminder'];

// Monatslabels für die Verlaufsgrafik.
const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Standard-Startzustand der App.
export const defaultState: AppState = {
  applications: [],
  tasks: [],
  settings: {
    theme: 'dark',
    sort: 'followUp',
    filterStatus: 'Alle',
    filterRange: 'all',
    search: '',
    weeklyGoal: 5
  }
};

// Neue Bewerbung erzeugen und Standardwerte setzen.
export const createApplication = (partial: Partial<JobApplication> = {}, now: Date = new Date()): JobApplication => {
  const timestamp = now.toISOString();
  return normalizeApplication(partial, timestamp);
};

// Neue Aufgabe erzeugen und Standardwerte setzen.
export const createTask = (partial: Partial<Task> = {}, now: Date = new Date()): Task => {
  const timestamp = now.toISOString();
  return normalizeTask(partial, new Set(), timestamp);
};

// Bewerbung in die Liste einfügen (oben).
export const addApplication = (applications: JobApplication[], application: JobApplication): JobApplication[] => [
  application,
  ...applications
];

// Bewerbung aktualisieren.
export const updateApplication = (
  applications: JobApplication[],
  id: string,
  patch: Partial<JobApplication>,
  now: Date = new Date()
): JobApplication[] =>
  applications.map((application) => {
    if (application.id !== id) return application;

    const normalizedCurrent = normalizeApplication(application, now.toISOString());
    const nextApplication = normalizeApplication({
      ...application,
      ...patch,
      updatedAt: now.toISOString()
    }, now.toISOString());
    const statusChanged = normalizedCurrent.status !== nextApplication.status;

    if (!statusChanged) return nextApplication;

    return {
      ...nextApplication,
      history: [
        ...(normalizedCurrent.history ?? []),
        {
          status: nextApplication.status,
          date: now.toISOString()
        }
      ]
    };
  });

// Bewerbung löschen.
export const deleteApplication = (applications: JobApplication[], id: string): JobApplication[] =>
  applications.filter((application) => application.id !== id);

// Status ändern und optional Historie + Follow-up setzen.
export const changeStatus = (
  applications: JobApplication[],
  id: string,
  status: ApplicationStatus,
  now: Date = new Date()
): JobApplication[] =>
  applications.map((application) => {
    if (application.id !== id) return application;
    const history = application.history ? [...application.history] : [];
    history.push({ status, date: now.toISOString() });
    const calculatedFollowUp = calculateFollowUpDate(status, now) ?? undefined;
    const followUpDate = isTerminalStatus(status) ? undefined : application.followUpDate ?? calculatedFollowUp;
    return {
      ...application,
      status,
      followUpDate,
      history,
      updatedAt: now.toISOString()
    };
  });

// Automatisches Follow-up-Datum je Status berechnen.
export const calculateFollowUpDate = (status: ApplicationStatus, baseDate: Date = new Date()): string | null => {
  const dayOffsets: Record<ApplicationStatus, number | null> = {
    Entwurf: null,
    Beworben: 7,
    Interview: 3,
    Angebot: 2,
    Abgelehnt: null,
    Zurückgezogen: null
  };

  const offset = dayOffsets[status];
  if (!offset) return null;

  const target = new Date(baseDate);
  target.setDate(target.getDate() + offset);
  return toDateOnly(target);
};

// Aufgabe hinzufügen.
export const addTask = (tasks: Task[], task: Task): Task[] => [task, ...tasks];

// Aufgabe aktualisieren.
export const updateTask = (tasks: Task[], id: string, patch: Partial<Task>, now: Date = new Date()): Task[] =>
  tasks.map((task) => {
    if (task.id !== id) return task;

    const nextTask = {
      ...task,
      ...patch,
      updatedAt: now.toISOString()
    };

    if (patch.done === false) {
      return {
        ...nextTask,
        done: false,
        completionNote: undefined,
        completedAt: undefined
      };
    }

    if (patch.done === true) {
      return {
        ...nextTask,
        done: true,
        completedAt: nextTask.completedAt ?? now.toISOString()
      };
    }

    return nextTask;
  });

// Aufgabe löschen.
export const deleteTask = (tasks: Task[], id: string): Task[] => tasks.filter((task) => task.id !== id);

// Bewerbungen nach Status, Zeitraum und Suchbegriff filtern.
export const filterApplications = (
  applications: JobApplication[],
  filters: Pick<FilterSettings, 'status' | 'range' | 'search'>,
  now: Date = new Date()
): JobApplication[] => {
  const search = filters.search.trim().toLowerCase();

  return applications.filter((application) => {
    if (filters.status !== 'Alle' && application.status !== filters.status) return false;
    if (search) {
      const company = application.company?.toLowerCase() ?? '';
      const position = application.position?.toLowerCase() ?? '';
      if (!company.includes(search) && !position.includes(search)) return false;
    }
    if (filters.range !== 'all') {
      const createdAt = parseDateValue(application.createdAt);
      if (!createdAt) return false;
      const cutoff = subtractDays(now, rangeToDays(filters.range));
      if (createdAt < cutoff) return false;
    }
    return true;
  });
};

// Bewerbungen sortieren nach Datum, Status oder Follow-up.
export const sortApplications = (applications: JobApplication[], sort: SortOption): JobApplication[] => {
  const sorted = [...applications];
  if (sort === 'status') {
    sorted.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    return sorted;
  }
  if (sort === 'followUp') {
    sorted.sort((a, b) => {
      if (!a.followUpDate && !b.followUpDate) return 0;
      if (!a.followUpDate) return 1;
      if (!b.followUpDate) return -1;
      return getSortableTime(a.followUpDate) - getSortableTime(b.followUpDate);
    });
    return sorted;
  }
  sorted.sort((a, b) => getSortableTime(b.createdAt) - getSortableTime(a.createdAt));
  return sorted;
};

// Dashboard-Statistiken berechnen.
export const getDashboardStats = (applications: JobApplication[], now: Date = new Date()): DashboardStats => {
  const byStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  applications.forEach((application) => {
    if (!isApplicationStatus(application.status)) return;
    byStatus[application.status] += 1;
  });

  const startOfWeek = getStartOfWeek(now);
  const thisWeek = applications.filter((application) => {
    const createdAt = parseDateValue(application.createdAt);
    return Boolean(createdAt && createdAt >= startOfWeek);
  }).length;
  const thisMonth = applications.filter((application) => {
    const date = parseDateValue(application.createdAt);
    if (!date) return false;
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = MONTH_LABELS[date.getMonth()];
    const count = applications.filter((application) => {
      const created = parseDateValue(application.createdAt);
      if (!created) return false;
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    }).length;
    return { label, count };
  });

  const followUpsDue = applications
    .filter((application) => application.followUpDate && !isTerminalStatus(application.status))
    .filter((application) => {
      const followUpDate = parseDateValue(application.followUpDate);
      return Boolean(followUpDate && followUpDate <= stripTime(now));
    })
    .sort((a, b) => getSortableTime(a.followUpDate) - getSortableTime(b.followUpDate));

  return {
    total: applications.length,
    byStatus,
    thisWeek,
    thisMonth,
    lastSixMonths,
    followUpsDue
  };
};

// Backup-Objekt bauen (inkl. Versionsfeld).
export const buildBackup = (state: AppState, now: Date = new Date()): BackupFile => ({
  version: '1.0',
  createdAt: now.toISOString(),
  data: state
});

type RestorableBackup = BackupFile | AppState;

export const isRestorableBackup = (value: unknown): value is RestorableBackup => {
  const source = getRecord(value);
  if (source.version === '1.0') return isStatePayload(source.data);
  return isStatePayload(value);
};

// Backup prüfen und auf gültigen Zustand zurückführen.
export const restoreBackup = (backup: unknown): AppState => {
  const payload = getBackupPayload(backup);
  if (!payload) {
    return cloneDefaultState();
  }

  const fallbackTimestamp = new Date().toISOString();
  const applications = Array.isArray(payload.applications)
    ? normalizeApplications(payload.applications, fallbackTimestamp)
    : [];
  const applicationIds = new Set(applications.map((application) => application.id));
  const tasks = Array.isArray(payload.tasks)
    ? normalizeTasks(payload.tasks, applicationIds, fallbackTimestamp)
    : [];

  return {
    applications,
    tasks,
    settings: normalizeSettings(payload.settings)
  };
};

const getBackupPayload = (value: unknown): Record<string, unknown> | null => {
  const source = getRecord(value);
  if (source.version === '1.0' && isStatePayload(source.data)) {
    return getRecord(source.data);
  }
  return isStatePayload(value) ? source : null;
};

const isStatePayload = (value: unknown): boolean => {
  const source = getRecord(value);
  return Array.isArray(source.applications) || Array.isArray(source.tasks) || source.settings !== undefined;
};

const cloneDefaultState = (): AppState => ({
  applications: [],
  tasks: [],
  settings: { ...defaultState.settings }
});

const normalizeApplications = (applications: unknown[], fallbackTimestamp: string): JobApplication[] => {
  const usedIds = new Set<string>();

  return applications.map((application) => {
    const normalized = normalizeApplication(application, fallbackTimestamp);
    if (!usedIds.has(normalized.id)) {
      usedIds.add(normalized.id);
      return normalized;
    }

    const id = generateId();
    usedIds.add(id);
    return { ...normalized, id };
  });
};

const normalizeTasks = (tasks: unknown[], applicationIds: Set<string>, fallbackTimestamp: string): Task[] => {
  const usedIds = new Set<string>();

  return tasks.map((task) => {
    const normalized = normalizeTask(task, applicationIds, fallbackTimestamp);
    if (!usedIds.has(normalized.id)) {
      usedIds.add(normalized.id);
      return normalized;
    }

    const id = generateId();
    usedIds.add(id);
    return { ...normalized, id };
  });
};

const normalizeApplication = (value: unknown, fallbackTimestamp: string): JobApplication => {
  const source = getRecord(value);
  const status = isApplicationStatus(source.status) ? source.status : 'Entwurf';
  const followUpDate = isTerminalStatus(status) ? undefined : normalizeDateOnlyValue(source.followUpDate);
  const history = normalizeHistory(source.history);
  const application: JobApplication = {
    id: normalizeId(source.id) ?? generateId(),
    status,
    createdAt: normalizeTimestamp(source.createdAt, fallbackTimestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, fallbackTimestamp)
  };

  assignOptional(application, 'company', normalizeText(source.company));
  assignOptional(application, 'position', normalizeText(source.position));
  assignOptional(application, 'location', normalizeText(source.location));
  assignOptional(application, 'link', normalizeHttpUrl(source.link));
  assignOptional(application, 'source', normalizeText(source.source));
  assignOptional(application, 'followUpDate', followUpDate);
  assignOptional(application, 'contact', normalizeText(source.contact));
  assignOptional(application, 'notes', normalizeText(source.notes));
  assignOptional(application, 'history', history.length > 0 ? history : undefined);

  return application;
};

const normalizeTask = (value: unknown, applicationIds: Set<string>, fallbackTimestamp: string): Task => {
  const source = getRecord(value);
  const done = source.done === true;
  const task: Task = {
    id: normalizeId(source.id) ?? generateId(),
    applicationId: normalizeApplicationId(source.applicationId, applicationIds),
    title: normalizeText(source.title) ?? '',
    done,
    type: isTaskType(source.type) ? source.type : 'task',
    createdAt: normalizeTimestamp(source.createdAt, fallbackTimestamp),
    updatedAt: normalizeTimestamp(source.updatedAt, fallbackTimestamp)
  };

  assignOptional(task, 'dueDate', normalizeDateOnlyValue(source.dueDate));

  if (done) {
    assignOptional(task, 'completionNote', normalizeText(source.completionNote));
    assignOptional(task, 'completedAt', normalizeTimestamp(source.completedAt, undefined));
  }

  return task;
};

const normalizeSettings = (value: unknown): AppState['settings'] => {
  const source = getRecord(value);

  return {
    theme: isThemeMode(source.theme) ? source.theme : defaultState.settings.theme,
    sort: isSortOption(source.sort) ? source.sort : defaultState.settings.sort,
    filterStatus:
      source.filterStatus === 'Alle' || isApplicationStatus(source.filterStatus)
        ? source.filterStatus
        : defaultState.settings.filterStatus,
    filterRange: isFilterRange(source.filterRange) ? source.filterRange : defaultState.settings.filterRange,
    search: normalizeText(source.search) ?? defaultState.settings.search,
    weeklyGoal: normalizeWeeklyGoal(source.weeklyGoal)
  };
};

const normalizeHistory = (value: unknown): NonNullable<JobApplication['history']> => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const source = getRecord(item);
      if (!isApplicationStatus(source.status)) return null;
      const date = normalizeTimestamp(source.date, undefined);
      if (!date) return null;
      return { status: source.status, date };
    })
    .filter((item): item is NonNullable<JobApplication['history']>[number] => Boolean(item));
};

const assignOptional = <T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void => {
  if (value !== undefined) {
    target[key] = value;
  }
};

const getRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const normalizeId = (value: unknown): string | undefined => normalizeText(value);

const normalizeApplicationId = (value: unknown, applicationIds: Set<string>): string => {
  const applicationId = normalizeId(value);
  if (!applicationId || applicationId === 'unknown') return 'unknown';
  return applicationIds.size === 0 || applicationIds.has(applicationId) ? applicationId : 'unknown';
};

const normalizeDateOnlyValue = (value: unknown): string | undefined =>
  typeof value === 'string' ? normalizeDateOnly(value) : undefined;

function normalizeTimestamp(value: unknown, fallback: string): string;
function normalizeTimestamp(value: unknown, fallback?: undefined): string | undefined;
function normalizeTimestamp(value: unknown, fallback?: string): string | undefined {
  if (typeof value !== 'string') return fallback;
  const date = parseDateValue(value);
  return date ? date.toISOString() : fallback;
}

const normalizeHttpUrl = (value: unknown): string | undefined => {
  const text = normalizeText(value);
  if (!text) return undefined;
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};

const normalizeWeeklyGoal = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  const rounded = Math.round(numeric);
  if (!Number.isFinite(rounded)) return defaultState.settings.weeklyGoal;
  return Math.min(30, Math.max(1, rounded));
};

const isApplicationStatus = (value: unknown): value is ApplicationStatus =>
  typeof value === 'string' && STATUS_ORDER.includes(value as ApplicationStatus);

const isSortOption = (value: unknown): value is SortOption =>
  typeof value === 'string' && SORT_OPTIONS.includes(value as SortOption);

const isFilterRange = (value: unknown): value is FilterRange =>
  typeof value === 'string' && FILTER_RANGES.includes(value as FilterRange);

const isThemeMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && THEME_MODES.includes(value as ThemeMode);

const isTaskType = (value: unknown): value is Task['type'] =>
  typeof value === 'string' && TASK_TYPES.includes(value as Task['type']);

// ID erzeugen (crypto.randomUUID falls verfügbar).
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now()}`;
};

export const isTerminalStatus = (status: ApplicationStatus): boolean => TERMINAL_STATUSES.includes(status);

const getSortableTime = (value?: string): number => parseDateValue(value)?.getTime() ?? Number.MAX_SAFE_INTEGER;

// Zeitraum-Filter in Tage umrechnen.
const rangeToDays = (range: FilterRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '14d':
      return 14;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '180d':
      return 180;
    case '365d':
      return 365;
    default:
      return 0;
  }
};

// Datum um X Tage zurücksetzen.
const subtractDays = (date: Date, days: number): Date => {
  const target = new Date(date);
  target.setDate(target.getDate() - days);
  return target;
};

// Start der Woche (Montag) berechnen.
const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};
