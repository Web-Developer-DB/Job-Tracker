// Alle möglichen Status-Werte einer Bewerbung.
export type ApplicationStatus =
  | 'Entwurf'
  | 'Beworben'
  | 'Interview'
  | 'Angebot'
  | 'Abgelehnt'
  | 'Zurückgezogen';

// Sortier-Optionen in der UI.
export type SortOption = 'createdAt' | 'status' | 'followUp';
// Zeitraum-Filter.
export type FilterRange = 'all' | '7d' | '14d' | '30d' | '90d' | '180d' | '365d';
// Theme-Optionen.
export type ThemeMode = 'light' | 'dark';

// Optionaler Verlauf von Status-Wechseln.
export interface StatusHistoryItem {
  status: ApplicationStatus;
  date: string;
}

// Bewerbungsdatensatz.
export interface JobApplication {
  id: string;
  company?: string;
  position?: string;
  location?: string;
  link?: string;
  source?: string;
  status: ApplicationStatus;
  followUpDate?: string;
  contact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history?: StatusHistoryItem[];
}

// Aufgabe/Termin, der zu einer Bewerbung gehört.
export interface Task {
  id: string;
  applicationId: string;
  title: string;
  dueDate?: string;
  done: boolean;
  type: 'task' | 'interview' | 'reminder';
  createdAt: string;
  updatedAt: string;
}

// App-Einstellungen, die gespeichert werden.
export interface Settings {
  theme: ThemeMode;
  sort: SortOption;
  filterStatus: ApplicationStatus | 'Alle';
  filterRange: FilterRange;
  search: string;
}

// Form- und Filterwerte für die UI.
export interface FilterSettings {
  sort: SortOption;
  status: ApplicationStatus | 'Alle';
  range: FilterRange;
  search: string;
}

// Gesamter App-Status (Daten + Settings).
export interface AppState {
  applications: JobApplication[];
  tasks: Task[];
  settings: Settings;
}

// Backup-Datei (JSON) mit Versionsfeld.
export interface BackupFile {
  version: '1.0';
  createdAt: string;
  data: AppState;
}

// Dashboard-KPIs und Statistiken.
export interface DashboardStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  thisWeek: number;
  thisMonth: number;
  lastSixMonths: { label: string; count: number }[];
  followUpsDue: JobApplication[];
}

// Zeile für die Druck-/PDF-Tabelle.
export interface ExportRow {
  date: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  result: string;
}
