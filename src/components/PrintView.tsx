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
    <div className="print-container bg-white text-black">
      <header className="print-header">
        <div>
          <h1 className="print-title">{title}</h1>
          <p className="print-subtitle">{period}</p>
        </div>
        <div className="print-meta">
          <p>
            <span>Erstellt am</span> {date}
          </p>
          <p>
            <span>Einträge</span> {rows.length}
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="print-empty">Keine Bewerbungen für den gewählten Filter gefunden.</p>
      ) : (
        <table className="print-report-table">
          <colgroup>
            <col className="print-col-date" />
            <col className="print-col-company" />
            <col className="print-col-position" />
            <col className="print-col-status" />
            <col className="print-col-result" />
          </colgroup>
          <thead>
            <tr>
              <th>Erstellt am</th>
              <th>Unternehmen</th>
              <th>Position</th>
              <th>Status</th>
              <th>Ergebnis</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.company}-${index}`}>
                <td className="print-cell-date">{row.date || '-'}</td>
                <td className="print-cell-company">{row.company || '-'}</td>
                <td className="print-cell-position">{row.position || '-'}</td>
                <td className="print-cell-status">
                  <span
                    className="print-status-chip"
                    style={{ color: statusColors[row.status], borderColor: statusColors[row.status] }}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="print-cell-result">{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
