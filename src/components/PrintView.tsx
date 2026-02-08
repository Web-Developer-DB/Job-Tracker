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
    Entwurf: '#94a3b8',
    Beworben: '#2563eb',
    Interview: '#0ea5a4',
    Angebot: '#16a34a',
    Abgelehnt: '#dc2626',
    Zurückgezogen: '#64748b'
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
          <tr className="text-left">
            <th className="py-2 border-b border-gray-300">Erstellt am</th>
            <th className="py-2 border-b border-gray-300">Unternehmen</th>
            <th className="py-2 border-b border-gray-300">Position</th>
            <th className="py-2 border-b border-gray-300">Status</th>
            <th className="py-2 border-b border-gray-300">Ergebnis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.company}-${index}`}>
              <td className="py-2 border-b border-gray-200">{row.date}</td>
              <td className="py-2 border-b border-gray-200 break-words">{row.company || '-'}</td>
              <td className="py-2 border-b border-gray-200 break-words">{row.position || '-'}</td>
              <td className="py-2 border-b border-gray-200 text-base font-semibold" style={{ color: statusColors[row.status] }}>
                {row.status}
              </td>
              <td className="py-2 border-b border-gray-200">{row.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
