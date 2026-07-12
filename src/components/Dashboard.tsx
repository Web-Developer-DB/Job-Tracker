import { useEffect, useState } from 'react';
import { parseDateValue, stripTime } from '../services/date';
import type { ApplicationStatus, DashboardStats } from '../types';
import { Badge, Icon, Input, cn } from './ui';
import { getStatusColor, hexToRgba } from './StatusBadge';

interface DashboardProps {
  stats: DashboardStats;
  weeklyGoal: number;
  onWeeklyGoalChange: (goal: number) => void;
  activeStatus: ApplicationStatus | 'Alle';
  onStatusSelect: (status: ApplicationStatus | 'Alle') => void;
}

type FilterStatus = 'Alle' | 'Beworben' | 'Interview' | 'Angebot' | 'Abgelehnt';

const FILTER_TABS: Array<{ status: FilterStatus; label: string; ariaLabel: string }> = [
  { status: 'Alle', label: 'Alle anzeigen', ariaLabel: 'Alle Bewerbungen anzeigen' },
  { status: 'Beworben', label: 'Beworben', ariaLabel: 'Bewerbungen mit Status Beworben anzeigen' },
  { status: 'Interview', label: 'Interview', ariaLabel: 'Bewerbungen mit Status Interview anzeigen' },
  { status: 'Angebot', label: 'Angebot', ariaLabel: 'Bewerbungen mit Status Angebot anzeigen' },
  { status: 'Abgelehnt', label: 'Abgelehnt', ariaLabel: 'Bewerbungen mit Status Abgelehnt anzeigen' }
];

export const Dashboard = ({ stats, weeklyGoal, onWeeklyGoalChange, activeStatus, onStatusSelect }: DashboardProps) => {
  const safeWeeklyGoal = Math.min(30, Math.max(1, Math.round(weeklyGoal || 1)));
  const [goalInput, setGoalInput] = useState(String(safeWeeklyGoal));
  const today = stripTime(new Date());
  const followUpsToday = stats.followUpsDue.filter((application) => {
    const followUpDate = application.followUpDate ? parseDateValue(application.followUpDate) : null;
    return Boolean(followUpDate && followUpDate.getTime() === today.getTime());
  }).length;
  const progressRatio = Math.min(1, stats.thisWeek / safeWeeklyGoal);
  const progressPercent = Math.round(progressRatio * 100);
  const latestMonth = stats.lastSixMonths[stats.lastSixMonths.length - 1]?.count ?? 0;
  const previousMonth = stats.lastSixMonths[stats.lastSixMonths.length - 2]?.count ?? 0;
  const monthDelta = latestMonth - previousMonth;

  useEffect(() => {
    setGoalInput(String(safeWeeklyGoal));
  }, [safeWeeklyGoal]);

  const handleGoalCommit = () => {
    const parsed = Number.parseInt(goalInput, 10);
    if (Number.isNaN(parsed)) {
      setGoalInput(String(safeWeeklyGoal));
      return;
    }
    onWeeklyGoalChange(parsed);
  };

  const handleGoalInputChange = (value: string) => {
    setGoalInput(value);
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    onWeeklyGoalChange(parsed);
  };

  const kpis = [
    {
      label: 'Gesamt',
      value: stats.total,
      helper: 'Alle Bewerbungen',
      icon: 'briefcase' as const,
      color: '#4e9eff'
    },
    {
      label: 'Diese Woche',
      value: stats.thisWeek,
      helper: `${Math.max(0, safeWeeklyGoal - stats.thisWeek)} bis Ziel`,
      icon: 'calendar' as const,
      color: '#a855f7'
    },
    {
      label: 'Dieser Monat',
      value: stats.thisMonth,
      helper: `${monthDelta >= 0 ? '+' : ''}${monthDelta} im Vergleich`,
      icon: 'chart' as const,
      color: '#47c884'
    },
    {
      label: 'Follow-ups heute',
      value: followUpsToday,
      helper: `${stats.followUpsDue.length} offen`,
      icon: 'bell' as const,
      color: '#f6b450'
    }
  ];

  return (
    <section className="space-y-4" aria-labelledby="dashboard-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="dashboard-title" className="font-display text-2xl font-bold leading-tight md:text-[2rem]">
            Übersicht
          </h1>
          <p className="mt-1 text-sm text-muted">Dein aktueller Bewerbungsüberblick</p>
        </div>
        <Badge className="!min-h-8">Momentum</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="metric-card rounded-lg border border-border bg-surface px-3 py-2.5 shadow-soft sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border sm:h-10 sm:w-10"
                style={{
                  color: item.color,
                  borderColor: hexToRgba(item.color, 0.28),
                  backgroundColor: hexToRgba(item.color, 0.13)
                }}
                aria-hidden="true"
              >
                <Icon name={item.icon} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <p className="mono text-xl font-semibold leading-none text-text sm:text-2xl">{item.value}</p>
            </div>
            <p className="mt-2 text-[0.78rem] font-bold leading-tight text-text sm:mt-3 sm:text-sm">{item.label}</p>
            <p className="mt-0.5 truncate text-[0.7rem] text-muted sm:text-xs">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface px-1.5 py-1.5 shadow-soft sm:px-2 sm:py-2">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Statusfilter">
          {FILTER_TABS.map((item) => {
            const count = item.status === 'Alle' ? stats.total : stats.byStatus[item.status] ?? 0;
            const isActive = activeStatus === item.status;
            const color = item.status === 'Alle' ? '#4e9eff' : getStatusColor(item.status);

            return (
              <button
                key={item.status}
                type="button"
                className={cn(
                  'inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:min-h-[44px] sm:gap-2 sm:px-3 sm:text-sm',
                  isActive ? 'text-text shadow-soft' : 'border-transparent text-muted hover:bg-surface-2 hover:text-text'
                )}
                style={
                  isActive
                    ? {
                        borderColor: hexToRgba(color, 0.42),
                        backgroundColor: hexToRgba(color, 0.14)
                      }
                    : undefined
                }
                role="tab"
                aria-selected={isActive}
                aria-pressed={isActive}
                aria-label={item.ariaLabel}
                onClick={() => onStatusSelect(item.status)}
              >
                <span>{item.label}</span>
                <span className="mono rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[0.68rem] text-text sm:text-xs">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-3 shadow-soft lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted">Wochenziel</p>
            <p className="mt-1 text-sm leading-tight text-text">{stats.thisWeek} von {safeWeeklyGoal} erledigt</p>
          </div>
          <div className="mono text-lg font-semibold text-primary">{progressPercent}%</div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progressRatio * 100}%` }} />
        </div>
        <label className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-muted">
          <span>Ziel</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={goalInput}
            className="!min-h-[36px] !w-20 !px-2 !py-1 text-right text-sm"
            onChange={(event) => handleGoalInputChange(event.target.value)}
            onBlur={handleGoalCommit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      </div>
    </section>
  );
};
