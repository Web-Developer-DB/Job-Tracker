import { useEffect, useState, type FormEvent } from 'react';
import type { ApplicationStatus, JobApplication } from '../types';

// Erlaubte Status-Werte für das Auswahlfeld.
const STATUSES: ApplicationStatus[] = ['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt', 'Zurückgezogen'];

// Formulardaten, die wir beim Speichern zurückgeben.
export interface ApplicationFormValues {
  company?: string;
  position?: string;
  location?: string;
  link?: string;
  source?: string;
  status: ApplicationStatus;
  followUpDate?: string;
  contact?: string;
  notes?: string;
}

interface ApplicationFormProps {
  initial?: Partial<JobApplication>;
  onSubmit: (values: ApplicationFormValues) => void;
  onCancel?: () => void;
}

// Leerzeichen entfernen. Leere Strings werden zu `undefined`,
// damit sie nicht als „echte“ Daten gespeichert werden.
const normalize = (value: string): string | undefined => (value.trim() ? value.trim() : undefined);

// Formular für neue Bewerbungen und zum Bearbeiten bestehender Bewerbungen.
export const ApplicationForm = ({ initial, onSubmit, onCancel }: ApplicationFormProps) => {
  // Alle Felder sind Controlled Inputs: der State ist die einzige Quelle der Wahrheit.
  const [company, setCompany] = useState(initial?.company ?? '');
  const [position, setPosition] = useState(initial?.position ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [link, setLink] = useState(initial?.link ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [status, setStatus] = useState<ApplicationStatus>(initial?.status ?? 'Entwurf');
  const [followUpDate, setFollowUpDate] = useState(initial?.followUpDate ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  // Wenn ein Datensatz zum Bearbeiten übergeben wird, füllen wir das Formular damit.
  useEffect(() => {
    if (!initial) return;
    setCompany(initial.company ?? '');
    setPosition(initial.position ?? '');
    setLocation(initial.location ?? '');
    setLink(initial.link ?? '');
    setSource(initial.source ?? '');
    setStatus(initial.status ?? 'Entwurf');
    setFollowUpDate(initial.followUpDate ?? '');
    setContact(initial.contact ?? '');
    setNotes(initial.notes ?? '');
  }, [initial]);

  // Formular absenden: Werte normalisieren und an den Parent zurückgeben.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      company: normalize(company),
      position: normalize(position),
      location: normalize(location),
      link: normalize(link),
      source: normalize(source),
      status,
      followUpDate: normalize(followUpDate),
      contact: normalize(contact),
      notes: normalize(notes)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl">{initial ? 'Bewerbung bearbeiten' : 'Neue Bewerbung'}</h2>
          <p className="text-sm text-muted">Empfohlene Felder helfen dir später beim Überblick.</p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted hover:text-text"
          >
            Abbrechen
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Unternehmen <span className="text-xs text-muted">empfohlen</span>
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="z. B. Nordlicht GmbH"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Position <span className="text-xs text-muted">empfohlen</span>
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="z. B. Frontend Engineer"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ort / remote
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Berlin oder remote"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Link
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Quelle
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="LinkedIn, Empfehlung …"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Follow-up-Datum
          <input
            type="date"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={followUpDate}
            onChange={(event) => setFollowUpDate(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kontaktperson
          <input
            className="rounded-lg border border-border bg-surface-2 px-3 py-2"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Name, E-Mail, Telefon"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notizen
        <textarea
          className="min-h-[100px] rounded-lg border border-border bg-surface-2 px-3 py-2"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Wichtige Infos, nächste Schritte …"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
        >
          Speichern
        </button>
        <span className="text-xs text-muted self-center">Keine Pflichtfelder – du kannst jederzeit speichern.</span>
      </div>
    </form>
  );
};
