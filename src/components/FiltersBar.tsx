import type { RefObject } from 'react';
import type { ApplicationStatus, FilterRange, FilterSettings, SortOption } from '../types';
import { Button, Input, Select } from './ui';

interface FiltersBarProps {
  value: FilterSettings;
  onChange: (value: FilterSettings) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
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
  { value: 'followUp', label: 'Nächste Aktion' },
  { value: 'createdAt', label: 'Erstellt am' },
  { value: 'status', label: 'Status' }
];

// Filter- und Sortierleiste.
export const FiltersBar = ({ value, onChange, searchInputRef, className }: FiltersBarProps) => {
  // Hilfsfunktion: Teil-Update zusammenführen.
  const update = (patch: Partial<FilterSettings>) => onChange({ ...value, ...patch });
  const hasActiveFilters =
    value.search.trim().length > 0 || value.status !== 'Alle' || value.range !== 'all' || value.sort !== 'followUp';
  const activeChips = [
    value.search.trim().length > 0 ? { key: 'search', label: `Suche: ${value.search.trim()}` } : null,
    value.status !== 'Alle' ? { key: 'status', label: `Status: ${value.status}` } : null,
    value.range !== 'all'
      ? { key: 'range', label: `Zeitraum: ${RANGE_OPTIONS.find((option) => option.value === value.range)?.label ?? value.range}` }
      : null,
    value.sort !== 'createdAt'
      ? { key: 'sort', label: `Sortierung: ${SORT_OPTIONS.find((option) => option.value === value.sort)?.label ?? value.sort}` }
      : null
  ].filter(Boolean) as Array<{ key: 'search' | 'status' | 'range' | 'sort'; label: string }>;

  const resetAll = () =>
    onChange({
      ...value,
      search: '',
      status: 'Alle',
      range: 'all',
      sort: 'followUp'
    });

  const clearChip = (key: 'search' | 'status' | 'range' | 'sort') => {
    if (key === 'search') {
      update({ search: '' });
      return;
    }
    if (key === 'status') {
      update({ status: 'Alle' });
      return;
    }
    if (key === 'range') {
      update({ range: 'all' });
      return;
    }
    update({ sort: 'followUp' });
  };

  return (
    <div className={`card space-y-4 p-5 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Suche und Fokus</h2>
          <p className="text-sm text-muted">Filtere deine Pipeline nach Status, Zeitraum und Priorität.</p>
        </div>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={resetAll}
          >
            Filter zurücksetzen
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="field-label">
          Suche
          <Input
            ref={searchInputRef}
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

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="chip !normal-case !tracking-normal !text-xs !text-text"
              onClick={() => clearChip(chip.key)}
              aria-label={`Filter entfernen: ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
