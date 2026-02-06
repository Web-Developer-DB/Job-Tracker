import type { ApplicationStatus, JobApplication } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateDE } from '../services/export';

interface ApplicationCardProps {
  application: JobApplication;
  taskCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
}

// Alle Status-Werte für das Dropdown.
const STATUSES: ApplicationStatus[] = ['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt', 'Zurückgezogen'];

// Einzelkarte für eine Bewerbung inkl. Aktionen.
export const ApplicationCard = ({
  application,
  taskCount = 0,
  onEdit,
  onDelete,
  onStatusChange
}: ApplicationCardProps) => {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">
            {application.company || 'Unbenanntes Unternehmen'}
          </h3>
          <p className="text-sm text-muted">
            {application.position || 'Position offen'}
            {application.location ? ` · ${application.location}` : ''}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-2 text-sm text-muted">
        <div className="flex flex-wrap gap-3">
          <span>Erstellt: {formatDateDE(application.createdAt)}</span>
          {application.followUpDate && <span>Follow-up: {formatDateDE(application.followUpDate)}</span>}
        </div>
        {application.link && (
          <a className="text-primary underline" href={application.link} target="_blank" rel="noreferrer">
            {application.link}
          </a>
        )}
        {application.source && <span>Quelle: {application.source}</span>}
        {application.contact && <span>Kontakt: {application.contact}</span>}
        {taskCount > 0 && <span>Planer: {taskCount} Aufgabe(n)</span>}
      </div>

      {application.notes && (
        <p className="text-sm text-muted border-l border-border pl-3">{application.notes}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted">
          Status ändern
          <select
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-1 text-sm text-text"
            value={application.status}
            onChange={(event) => onStatusChange(event.target.value as ApplicationStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-border px-4 py-2 text-xs text-muted hover:text-text"
            type="button"
            onClick={onEdit}
          >
            Bearbeiten
          </button>
          <button
            className="rounded-full border border-danger px-4 py-2 text-xs text-danger"
            type="button"
            onClick={onDelete}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
};
