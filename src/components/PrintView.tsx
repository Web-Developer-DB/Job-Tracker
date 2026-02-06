import type { ApplicationStatus, FilterSettings, JobApplication } from '../types';
import { buildExportRows } from '../services/export';

interface PrintViewProps {
  applications: JobApplication[];
  filters: FilterSettings;
  title?: string;
}

// Text für den Zeitraum-Filter.
const rangeLabels: Record<FilterSettings['range'], string> = {
  all: 'Alle Daten',
  '7d': 'Letzte 7 Tage',
  '14d': 'Letzte 14 Tage',
  '30d': 'Letzte 30 Tage',
  '90d': 'Letzte 90 Tage',
  '180d': 'Letzte 180 Tage',
  '365d': 'Letzte 365 Tage'
};

// Druckansicht, die von react-to-print genutzt wird.
export const PrintView = ({ applications, filters, title = 'Bewerbungsnachweis' }: PrintViewProps) => {
  // Aus Bewerbungen eine flache Tabelle bauen.
  const rows = buildExportRows(applications);
  const date = new Date().toLocaleDateString('de-DE');
  const period = `Zeitraum: ${rangeLabels[filters.range]} · Status: ${filters.status}`;
  // Farben für Status in der Drucktabelle.
  const statusColors: Record<ApplicationStatus, string> = {
    Entwurf: '#6272a4',
    Beworben: '#8be9fd',
    Interview: '#bd93f9',
    Angebot: '#50fa7b',
    Abgelehnt: '#ff5555',
    Zurückgezogen: '#ffb86c'
  };

  return (
    <div className="print-container p-8 bg-white text-black">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm">{period}</p>
        <p className="text-xs text-gray-600">Erstellt am: {date}</p>
      </header>

      <table className="w-full text-sm">
        <colgroup>
          <col style={{ width: '12%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
        </colgroup>
        <thead>
          <tr className="text-left border-b border-gray-300">
            <th className="py-2">Erstellt am</th>
            <th className="py-2">Unternehmen</th>
            <th className="py-2">Position</th>
            <th className="py-2">Status</th>
            <th className="py-2">Ergebnis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.company}-${index}`} className="border-b border-gray-200">
              <td className="py-2">{row.date}</td>
              <td className="py-2 break-words">{row.company || '-'}</td>
              <td className="py-2 break-words">{row.position || '-'}</td>
              <td className="py-2" style={{ color: statusColors[row.status] }}>{row.status}</td>
              <td className="py-2">{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
