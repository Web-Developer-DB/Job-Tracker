import type {
  AppState,
  ApplicationStatus,
  FilterRange,
  FilterSettings,
  JobApplication,
  SortOption,
  Task,
  BackupFile,
  DashboardStats
} from '../types';

// Feste Reihenfolge für Status-Sortierung.
const STATUS_ORDER: ApplicationStatus[] = [
  'Entwurf',
  'Beworben',
  'Interview',
  'Angebot',
  'Abgelehnt',
  'Zurückgezogen'
];

// Monatslabels für die Verlaufsgrafik.
const MONTH_LABELS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// Standard-Startzustand der App.
export const defaultState: AppState = {
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

// Neue Bewerbung erzeugen und Standardwerte setzen.
export const createApplication = (partial: Partial<JobApplication> = {}, now: Date = new Date()): JobApplication => {
  const timestamp = now.toISOString();
  return {
    id: generateId(),
    status: partial.status ?? 'Entwurf',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial
  };
};

// Neue Aufgabe erzeugen und Standardwerte setzen.
export const createTask = (partial: Partial<Task> = {}, now: Date = new Date()): Task => {
  const timestamp = now.toISOString();
  return {
    id: generateId(),
    applicationId: partial.applicationId ?? 'unknown',
    title: partial.title ?? '',
    done: partial.done ?? false,
    type: partial.type ?? 'task',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...partial
  };
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
  applications.map((application) =>
    application.id === id
      ? {
          ...application,
          ...patch,
          updatedAt: now.toISOString()
        }
      : application
  );

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
    const followUpDate =
      status === 'Abgelehnt' || status === 'Zurückgezogen' ? undefined : application.followUpDate ?? calculatedFollowUp;
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
  tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          ...patch,
          updatedAt: now.toISOString()
        }
      : task
  );

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
      const createdAt = new Date(application.createdAt);
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
      return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
    });
    return sorted;
  }
  sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return sorted;
};

// Dashboard-Statistiken berechnen.
export const getDashboardStats = (applications: JobApplication[], now: Date = new Date()): DashboardStats => {
  const byStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  applications.forEach((application) => {
    byStatus[application.status] += 1;
  });

  const startOfWeek = getStartOfWeek(now);
  const thisWeek = applications.filter((application) => new Date(application.createdAt) >= startOfWeek).length;
  const thisMonth = applications.filter((application) => {
    const date = new Date(application.createdAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = MONTH_LABELS[date.getMonth()];
    const count = applications.filter((application) => {
      const created = new Date(application.createdAt);
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    }).length;
    return { label, count };
  });

  const followUpsDue = applications
    .filter((application) => application.followUpDate)
    .filter((application) => new Date(application.followUpDate ?? '') <= stripTime(now))
    .sort((a, b) => new Date(a.followUpDate ?? '').getTime() - new Date(b.followUpDate ?? '').getTime());

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

// Backup prüfen und auf gültigen Zustand zurückführen.
export const restoreBackup = (backup: BackupFile): AppState => {
  if (!backup || backup.version !== '1.0' || !backup.data) {
    return { ...defaultState };
  }

  return {
    applications: Array.isArray(backup.data.applications) ? backup.data.applications : [],
    tasks: Array.isArray(backup.data.tasks) ? backup.data.tasks : [],
    settings: {
      ...defaultState.settings,
      ...backup.data.settings
    }
  };
};

// ID erzeugen (crypto.randomUUID falls verfügbar).
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now()}`;
};

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

// Date -> "YYYY-MM-DD" (nur Datum, ohne Uhrzeit).
const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

// Zeit auf 00:00:00 setzen (für Vergleiche).
const stripTime = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Start der Woche (Montag) berechnen.
const getStartOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};
