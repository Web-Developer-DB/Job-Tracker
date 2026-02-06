import type { ExportRow, JobApplication } from '../types';

// Aus Bewerbungen eine einfache Tabellenstruktur für den Export bauen.
export const buildExportRows = (applications: JobApplication[]): ExportRow[] =>
  applications.map((application) => ({
    date: formatDateDE(application.createdAt),
    company: application.company ?? '',
    position: application.position ?? '',
    status: application.status,
    result: statusToResult(application.status)
  }));

// Datum in deutsches Format umwandeln (z.B. 31.01.2025).
export const formatDateDE = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('de-DE');
};

// Status in ein einfaches Ergebnis-Feld übersetzen.
const statusToResult = (status: JobApplication['status']): string => {
  switch (status) {
    case 'Angebot':
      return 'Angebot';
    case 'Abgelehnt':
      return 'Absage';
    case 'Zurückgezogen':
      return 'Zurückgezogen';
    default:
      return 'Offen';
  }
};
