import { useEffect, useRef, useState, type FormEvent } from 'react';
import { calculateFollowUpDate, isTerminalStatus } from '../services/logic';
import type { ApplicationStatus, JobApplication } from '../types';
import { Badge, Button, Input, Select, Textarea } from './ui';

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
const isLikelyUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.host);
  } catch {
    return false;
  }
};

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
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isEditing = Boolean(initial);
  const isFinalStep = activeStep === FORM_STEPS.length - 1;
  const statusBlocksFollowUp = isTerminalStatus(status);
  const linkInvalid = showValidationErrors && !isLikelyUrl(link);

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
    setShowValidationErrors(false);
  };

  const handleStatusChange = (nextStatus: ApplicationStatus) => {
    setStatus(nextStatus);
    if (isTerminalStatus(nextStatus)) {
      setFollowUpDate('');
      return;
    }
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
    setFollowUpDate(initial.status && isTerminalStatus(initial.status) ? '' : initial.followUpDate ?? '');
    setContact(initial.contact ?? '');
    setNotes(initial.notes ?? '');
    setStepMode(false);
    setActiveStep(0);
    setShowSuccess(false);
    setShowValidationErrors(false);
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
    setShowValidationErrors(true);
    const form = event.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector<HTMLElement>(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      form.reportValidity();
      return;
    }

    onSubmit({
      company: normalize(company),
      position: normalize(position),
      location: normalize(location),
      link: normalize(link),
      source: normalize(source),
      status,
      followUpDate: statusBlocksFollowUp ? undefined : normalize(followUpDate),
      contact: normalize(contact),
      notes: normalize(notes)
    });

    if (!embedded) {
      setShowSuccess(true);
    }

    if (resetAfterSubmit && !initial) {
      resetForm();
    } else {
      setShowValidationErrors(false);
    }
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-label">
            Unternehmen <span className="field-note">empfohlen</span>
            <Input
              name="company"
              inputMode="text"
              autoComplete="organization"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="z. B. Nordlicht GmbH"
            />
          </label>

          <label className="field-label">
            Position <span className="field-note">empfohlen</span>
            <Input
              name="position"
              inputMode="text"
              autoComplete="organization-title"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="z. B. Frontend Engineer"
            />
          </label>

          <label className="field-label">
            Ort / remote
            <Input
              name="location"
              inputMode="text"
              autoComplete="address-level2"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Berlin oder remote"
            />
          </label>

          <label className="field-label">
            Quelle
            <Input
              name="source"
              inputMode="text"
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
            <Select
              name="status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>

          <label className="field-label">
            Follow-up-Datum
            <Input
              name="followUpDate"
              type="date"
              value={followUpDate}
              disabled={statusBlocksFollowUp}
              onChange={(event) => setFollowUpDate(event.target.value)}
            />
            <span className="field-note">
              {statusBlocksFollowUp
                ? 'Für diesen Status ist kein Follow-up notwendig.'
                : 'Wird bei Statuswechsel automatisch vorgeschlagen.'}
            </span>
          </label>

          <label className="field-label md:col-span-2">
            Kontaktperson
            <Input
              name="contact"
              inputMode="text"
              autoComplete="name"
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
          <Input
            name="link"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="url"
            invalid={linkInvalid}
            aria-invalid={linkInvalid || undefined}
            aria-describedby={linkInvalid ? 'application-link-error-step' : undefined}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
          />
          {linkInvalid && (
            <span id="application-link-error-step" className="text-xs text-danger" role="alert">
              Bitte gib eine valide URL mit Protokoll an (z. B. https://example.com).
            </span>
          )}
        </label>

        <label className="field-label">
          Notizen
          <Textarea
            name="notes"
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
          <Input
            name="company"
            inputMode="text"
            autoComplete="organization"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="z. B. Nordlicht GmbH"
          />
        </label>

        <label className="field-label">
          Position <span className="field-note">empfohlen</span>
          <Input
            name="position"
            inputMode="text"
            autoComplete="organization-title"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="z. B. Frontend Engineer"
          />
        </label>

        <label className="field-label">
          Ort / remote
          <Input
            name="location"
            inputMode="text"
            autoComplete="address-level2"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Berlin oder remote"
          />
        </label>

        <label className="field-label">
          Link
          <Input
            name="link"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="url"
            invalid={linkInvalid}
            aria-invalid={linkInvalid || undefined}
            aria-describedby={linkInvalid ? 'application-link-error-all' : undefined}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="https://..."
          />
          {linkInvalid && (
            <span id="application-link-error-all" className="text-xs text-danger" role="alert">
              Bitte gib eine valide URL mit Protokoll an (z. B. https://example.com).
            </span>
          )}
        </label>

        <label className="field-label">
          Quelle
          <Input
            name="source"
            inputMode="text"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="LinkedIn, Empfehlung, Karriereportal"
          />
        </label>

        <label className="field-label">
          Status
          <Select
            name="status"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
          >
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>

        <label className="field-label">
          Follow-up-Datum
          <Input
            name="followUpDate"
            type="date"
            value={followUpDate}
            disabled={statusBlocksFollowUp}
            onChange={(event) => setFollowUpDate(event.target.value)}
          />
        </label>

        <label className="field-label">
          Kontaktperson
          <Input
            name="contact"
            inputMode="text"
            autoComplete="name"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="Name, Rolle, E-Mail oder Telefon"
          />
        </label>
      </div>

      <label className="field-label">
        Notizen
        <Textarea
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Wichtige Infos, nächste Schritte, Feedback nach Gespräch …"
        />
      </label>
    </>
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={embedded ? 'space-y-4' : 'card space-y-4 p-6'}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">{initial ? 'Bewerbung bearbeiten' : 'Neue Bewerbung'}</h2>
          <p className="text-sm text-muted">
            {embedded
              ? initial
                ? 'Passe die Felder an und speichere direkt in dieser Bewerbung.'
                : 'Fülle die wichtigsten Felder aus und speichere die Bewerbung.'
              : 'Schnell eintragen, Fortschritt sichtbar machen und direkt den nächsten Schritt planen.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!embedded && !isEditing && (
            <Button
              type="button"
              onClick={() => {
                setStepMode((value) => !value);
                setActiveStep(0);
              }}
              variant="ghost"
            >
              {stepMode ? 'Komplette Ansicht' : 'Schrittmodus'}
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
            >
              Abbrechen
            </Button>
          )}
        </div>
      </div>

      {showSuccess && !embedded && (
        <div className="card-soft flex items-center justify-between gap-3 px-4 py-3" role="status">
          <p className="text-sm text-text">Gespeichert. Starker Schritt nach vorne.</p>
          <Badge>Nächster Fokus: Follow-up setzen</Badge>
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
                <Button type="button" variant="secondary" onClick={() => setActiveStep((value) => value - 1)}>
                  Zurück
                </Button>
              )}

              {!isFinalStep && (
                <Button type="button" variant="secondary" onClick={() => setActiveStep((value) => value + 1)}>
                  Weiter
                </Button>
              )}

              {isFinalStep && (
                <Button type="submit" variant="primary">
                  {submitLabel}
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {renderAllFields()}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
            >
              {submitLabel}
            </Button>
            {!embedded && <span className="text-xs text-muted">Keine Pflichtfelder – du kannst jederzeit speichern.</span>}
          </div>
        </>
      )}
    </form>
  );
};
