import { Icon, cn } from '../ui';

interface MobileActionBarProps {
  onOverview: () => void;
  onApplications: () => void;
  onCreate: () => void;
  onPlanner: () => void;
  onMore: () => void;
  hasActiveFilters?: boolean;
}

export const MobileActionBar = ({
  onOverview,
  onApplications,
  onCreate,
  onPlanner,
  onMore,
  hasActiveFilters = false
}: MobileActionBarProps) => {
  return (
    <nav
      className="print-hidden pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden"
      aria-label="Mobile Hauptaktionen"
    >
      <div className="mx-auto max-w-[520px] px-3 pb-[calc(env(safe-area-inset-bottom)+0.7rem)] pt-2">
        <div className="pointer-events-auto grid grid-cols-5 items-end gap-1 rounded-lg border border-border-strong bg-surface px-2 py-2 shadow-shell backdrop-blur-xl">
          <NavItem icon="home" label="Übersicht" onClick={onOverview} active />
          <NavItem icon="briefcase" label="Bewerbungen" onClick={onApplications} />
          <button
            type="button"
            className="mx-auto flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full border border-primary/60 bg-primary text-on-primary shadow-glow transition hover:-translate-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={onCreate}
            aria-label="Neue Bewerbung"
            title="Neue Bewerbung"
          >
            <Icon name="plus" className="h-6 w-6" />
          </button>
          <NavItem icon="calendar" label="Planer" onClick={onPlanner} />
          <NavItem icon="menu" label="Mehr" onClick={onMore} active={hasActiveFilters} />
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: 'briefcase' | 'calendar' | 'home' | 'menu';
  label: string;
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    type="button"
    className={cn(
      'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.65rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
      active ? 'text-primary' : 'text-muted hover:bg-surface-2 hover:text-text'
    )}
    onClick={onClick}
  >
    <Icon name={icon} className="h-5 w-5" />
    <span className="truncate">{label}</span>
  </button>
);
