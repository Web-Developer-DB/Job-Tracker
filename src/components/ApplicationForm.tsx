import { useEffect, useState, type FormEvent } from 'react';
import { calculateFollowUpDate } from '../services/logic';
import type { ApplicationStatus, JobApplication } from '../types';

// Erlaubte Status-Werte für das Auswahlfeld.
const STATUSES: ApplicationStatus[] = ['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt', 'Zurückgezogen'];

const FORM_STEPS = [
  { title: 'Basis', description: 'Unternehmen, Rolle und Quelle' },
  { title: 'Prozess', description: 'Status und Follow-up planen' },
  { title: 'Details', description: 'Links und Notizen ergänzen' }
];

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
  embedded?: boolean;
  submitLabel?: string;
  resetAfterSubmit?: boolean;
}

// Leerzeichen entfernen. Leere Strings werden zu `undefined`,
// damit sie nicht als „echte“ Daten gespeichert werden.
const normalize = (value: string): string | undefined => (value.trim() ? value.trim() : undefined);

// Formular für neue Bewerbungen und zum Bearbeiten bestehender Bewerbungen.
export const ApplicationForm = ({
  initial,
  onSubmit,
  onCancel,
  embedded = false,
  submitLabel = 'Speichern',
  resetAfterSubmit = false
}: ApplicationFormProps) => {
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

  const [stepMode, setStepMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const isEditing = Boolean(initial);
  const isFinalStep = activeStep === FORM_STEPS.length - 1;

  const resetForm = () => {
    setCompany('');
    setPosition('');
    setLocation('');
    setLink('');
    setSource('');
    setStatus('Entwurf');
    setFollowUpDate('');
    setContact('');
    setNotes('');
    setActiveStep(0);
  };

  const handleStatusChange = (nextStatus: ApplicationStatus) => {
    setStatus(nextStatus);
    if (initial || followUpDate) return;
    const suggestedDate = calculateFollowUpDate(nextStatus);
    if (suggestedDate) {
      setFollowUpDate(suggestedDate);
    }
  };

  // Wenn ein Datensatz zum Bearbeiten übergeben wird, füllen wir das Formular damit.
  useEffect(() => {
    if (!initial) {
      resetForm();
      return;
    }
    setCompany(initial.company ?? '');
    setPosition(initial.position ?? '');
    setLocation(initial.location ?? '');
    setLink(initial.link ?? '');
    setSource(initial.source ?? '');
    setStatus(initial.status ?? 'Entwurf');
    setFollowUpDate(initial.followUpDate ?? '');
    setContact(initial.contact ?? '');
    setNotes(initial.notes ?? '');
    setStepMode(false);
    setActiveStep(0);
    setShowSuccess(false);
  }, [initial]);

  useEffect(() => {
    if (!showSuccess) return;
    const timeout = window.setTimeout(() => {
      setShowSuccess(false);
    }, 3200);
    return () => window.clearTimeout(timeout);
  }, [showSuccess]);

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

    if (!embedded) {
      setShowSuccess(true);
    }

    if (resetAfterSubmit && !initial) {
      resetForm();
    }
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Unternehmen <span className="field-note">empfohlen</span>
            <input
              className="input-field"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="z. B. Nordlicht GmbH"
            />
          </label>

          <label className="field-label">
            Position <span className="field-note">empfohlen</span>
            <input
              className="input-field"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="z. B. Frontend Engineer"
            />
          </label>

          <label className="field-label">
            Ort / remote
            <input
              className="input-field"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Berlin oder remote"
            />
          </label>

          <label className="field-label">
            Quelle
            <input
              className="input-field"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="LinkedIn, Empfehlung, Karriereportal"
            />
          </label>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Status
            <select
              className="select-field"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Follow-up-Datum
            <input
              type="date"
              className="input-field"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
            />
            <span className="field-note">Wird bei Statuswechsel automatisch vorgeschlagen.</span>
          </label>

          <label className="field-label md:col-span-2">
            Kontaktperson
            <input
              className="input-field"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Name, Rolle, E-Mail oder Telefon"
            />
          </label>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <label className="field-label">
          Link
          <input
            className="input-field"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="field-label">
          Notizen
          <textarea
            className="textarea-field"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Wichtige Infos, nächste Schritte, Feedback nach Gespräch …"
          />
        </label>
      </div>
    );
  };

  const renderAllFields = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          Unternehmen <span className="field-note">empfohlen</span>
          <input
            className="input-field"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="z. B. Nordlicht GmbH"
          />
        </label>

        <label className="field-label">
          Position <span className="field-note">empfohlen</span>
          <input
            className="input-field"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="z. B. Frontend Engineer"
          />
        </label>

        <label className="field-label">
          Ort / remote
          <input
            className="input-field"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Berlin oder remote"
          />
        </label>

        <label className="field-label">
          Link
          <input
            className="input-field"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="field-label">
          Quelle
          <input
            className="input-field"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="LinkedIn, Empfehlung, Karriereportal"
          />
        </label>

        <label className="field-label">
          Status
          <select
            className="select-field"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Follow-up-Datum
          <input
            type="date"
            className="input-field"
            value={followUpDate}
            onChange={(event) => setFollowUpDate(event.target.value)}
          />
        </label>

        <label className="field-label">
          Kontaktperson
          <input
            className="input-field"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Name, Rolle, E-Mail oder Telefon"
          />
        </label>
      </div>

      <label className="field-label">
        Notizen
        <textarea
          className="textarea-field"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Wichtige Infos, nächste Schritte, Feedback nach Gespräch …"
        />
      </label>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-4' : 'card space-y-4 p-6'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">{initial ? 'Bewerbung bearbeiten' : 'Neue Bewerbung'}</h2>
          <p className="text-sm text-muted">
            {embedded
              ? 'Passe die Felder an und speichere direkt in dieser Bewerbung.'
              : 'Schnell eintragen, Fortschritt sichtbar machen und direkt den nächsten Schritt planen.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!embedded && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setStepMode((value) => !value);
                setActiveStep(0);
              }}
              className="btn btn-ghost"
            >
              {stepMode ? 'Komplette Ansicht' : 'Schrittmodus'}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          )}
        </div>
      </div>

      {showSuccess && !embedded && (
        <div className="card-soft flex items-center justify-between gap-3 px-4 py-3" role="status">
          <p className="text-sm text-text">Gespeichert. Starker Schritt nach vorne.</p>
          <span className="chip">Nächster Fokus: Follow-up setzen</span>
        </div>
      )}

      {stepMode && !embedded && !isEditing ? (
        <>
          <div className="grid gap-2 md:grid-cols-3">
            {FORM_STEPS.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`card-soft px-3 py-3 text-left transition ${
                  activeStep === index ? 'border-primary bg-primary-soft' : ''
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Schritt {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-text">{step.title}</p>
                <p className="mt-1 text-xs text-muted">{step.description}</p>
              </button>
            ))}
          </div>

          <div className="card-soft p-4">{renderStep()}</div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted">Keine Pflichtfelder – du kannst jederzeit speichern.</span>
            <div className="flex gap-2">
              {activeStep > 0 && (
                <button type="button" className="btn btn-secondary" onClick={() => setActiveStep((value) => value - 1)}>
                  Zurück
                </button>
              )}

              {!isFinalStep && (
                <button type="button" className="btn btn-secondary" onClick={() => setActiveStep((value) => value + 1)}>
                  Weiter
                </button>
              )}

              {isFinalStep && (
                <button type="submit" className="btn btn-primary">
                  {submitLabel}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {renderAllFields()}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary"
            >
              {submitLabel}
            </button>
            {!embedded && <span className="text-xs text-muted">Keine Pflichtfelder – du kannst jederzeit speichern.</span>}
          </div>
        </>
      )}
    </form>
  );
};
