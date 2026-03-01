import { Button, cn } from '../ui';

interface MobileActionBarProps {
  onCreate: () => void;
  onSearch: () => void;
  onFilter: () => void;
  hasActiveFilters?: boolean;
}

export const MobileActionBar = ({ onCreate, onSearch, onFilter, hasActiveFilters = false }: MobileActionBarProps) => {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Mobile Hauptaktionen"
    >
      <div className="mx-auto max-w-[1180px] px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-2">
        <div className="pointer-events-auto card-soft grid grid-cols-3 gap-2 border-border-strong px-2 py-2 shadow-lg">
          <Button
            type="button"
            variant="primary"
            className="!min-h-[46px] !w-full !text-sm"
            onClick={onCreate}
          >
            Neu
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="!min-h-[46px] !w-full !text-sm"
            onClick={onSearch}
          >
            Suche
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={cn('!min-h-[46px] !w-full !text-sm', hasActiveFilters && 'border-primary text-primary')}
            onClick={onFilter}
          >
            {hasActiveFilters ? 'Filter aktiv' : 'Filter'}
          </Button>
        </div>
      </div>
    </nav>
  );
};
