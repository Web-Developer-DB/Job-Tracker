import type { ApplicationStatus, FilterRange, FilterSettings, SortOption } from '../types';
import { Button, Input, Select } from './ui';

interface FiltersBarProps {
  value: FilterSettings;
  onChange: (value: FilterSettings) => void;
}

// Optionen für Status-Filter.
export const STATUS_OPTIONS: (ApplicationStatus | 'Alle')[] = [
  'Alle',
  'Entwurf',
  'Beworben',
  'Interview',
  'Angebot',
  'Abgelehnt',
  'Zurückgezogen'
];

// Optionen für Zeiträume.
export const RANGE_OPTIONS: { value: FilterRange; label: string }[] = [
  { value: 'all', label: 'Alle Daten' },
  { value: '7d', label: 'Letzte 7 Tage' },
  { value: '14d', label: 'Letzte 14 Tage' },
  { value: '30d', label: 'Letzte 30 Tage' },
  { value: '90d', label: 'Letzte 90 Tage' },
  { value: '180d', label: 'Letzte 180 Tage' },
  { value: '365d', label: 'Letzte 365 Tage' }
];

// Optionen für Sortierung.
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'createdAt', label: 'Erstellt am' },
  { value: 'status', label: 'Status' },
  { value: 'followUp', label: 'Follow-up-Datum' }
];

// Filter- und Sortierleiste.
export const FiltersBar = ({ value, onChange }: FiltersBarProps) => {
  // Hilfsfunktion: Teil-Update zusammenführen.
  const update = (patch: Partial<FilterSettings>) => onChange({ ...value, ...patch });

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Suche und Fokus</h2>
          <p className="text-sm text-muted">Filtere deine Pipeline nach Status, Zeitraum und Priorität.</p>
        </div>
        {(value.search || value.status !== 'Alle' || value.range !== 'all') && (
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              onChange({
                ...value,
                search: '',
                status: 'Alle',
                range: 'all'
              })
            }
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="field-label">
          Suche
          <Input
            type="search"
            inputMode="search"
            autoCapitalize="none"
            placeholder="Unternehmen oder Position"
            value={value.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>

        <label className="field-label">
          Status
          <Select
            value={value.status}
            onChange={(event) => update({ status: event.target.value as ApplicationStatus | 'Alle' })}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </label>

        <label className="field-label">
          Zeitraum
          <Select
            value={value.range}
            onChange={(event) => update({ range: event.target.value as FilterRange })}
          >
            {RANGE_OPTIONS.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="field-label">
          Sortieren
          <Select
            value={value.sort}
            onChange={(event) => update({ sort: event.target.value as SortOption })}
          >
            {SORT_OPTIONS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  );
};
