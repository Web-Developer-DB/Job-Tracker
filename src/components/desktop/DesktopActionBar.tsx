import { Badge, Button } from '../ui';

interface DesktopActionBarProps {
  visibleCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onCreate: () => void;
  onFocusSearch: () => void;
  onClearFilters: () => void;
  onPrint: () => void;
}

export const DesktopActionBar = ({
  visibleCount,
  totalCount,
  hasActiveFilters,
  onCreate,
  onFocusSearch,
  onClearFilters,
  onPrint
}: DesktopActionBarProps) => {
  return (
    <div className="hidden md:sticky md:top-3 md:z-20 md:block">
      <div className="card-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge>{visibleCount} sichtbar</Badge>
          <Badge>{totalCount} gesamt</Badge>
          <span className="text-xs text-muted">Shortcuts: Ctrl/Cmd+K Suche, Ctrl/Cmd+N Neu</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={onCreate}>
            Neue Bewerbung
          </Button>
          <Button type="button" variant="secondary" onClick={onFocusSearch}>
            Suche fokussieren
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" onClick={onClearFilters}>
              Filter zurücksetzen
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onPrint}>
            Drucken
          </Button>
        </div>
      </div>
    </div>
  );
};
