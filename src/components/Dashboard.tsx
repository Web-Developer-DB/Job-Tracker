import { useEffect, useState } from 'react';
import { formatDateDE } from '../services/export';
import type { ApplicationStatus, DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  weeklyGoal: number;
  onWeeklyGoalChange: (goal: number) => void;
}

const STATUS_META: Array<{ status: ApplicationStatus; label: string; color: string }> = [
  { status: 'Entwurf', label: 'Entwurf', color: '#94a3b8' },
  { status: 'Beworben', label: 'Beworben', color: '#2563eb' },
  { status: 'Interview', label: 'Interview', color: '#0ea5a4' },
  { status: 'Angebot', label: 'Angebot', color: '#16a34a' },
  { status: 'Abgelehnt', label: 'Abgelehnt', color: '#dc2626' },
  { status: 'Zurückgezogen', label: 'Zurückgezogen', color: '#64748b' }
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
};

const stripTime = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Dashboard zeigt KPIs, Verlauf und Follow-ups.
export const Dashboard = ({ stats, weeklyGoal, onWeeklyGoalChange }: DashboardProps) => {
  const safeWeeklyGoal = Math.min(30, Math.max(1, Math.round(weeklyGoal || 1)));
  const [goalInput, setGoalInput] = useState(String(safeWeeklyGoal));

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

  const max = Math.max(1, ...stats.lastSixMonths.map((item) => item.count));
  const progressRatio = Math.min(1, stats.thisWeek / safeWeeklyGoal);
  const progressPercent = Math.round(progressRatio * 100);

  const latestMonth = stats.lastSixMonths[stats.lastSixMonths.length - 1]?.count ?? 0;
  const previousMonth = stats.lastSixMonths[stats.lastSixMonths.length - 2]?.count ?? 0;
  const monthDelta = latestMonth - previousMonth;

  const today = stripTime(new Date());
  const overdueCount = stats.followUpsDue.filter((application) => {
    const followUpDate = application.followUpDate ? stripTime(new Date(application.followUpDate)) : null;
    return Boolean(followUpDate && followUpDate < today);
  }).length;
  const dueTodayCount = stats.followUpsDue.filter((application) => {
    const followUpDate = application.followUpDate ? stripTime(new Date(application.followUpDate)) : null;
    return Boolean(followUpDate && followUpDate.getTime() === today.getTime());
  }).length;

  const chartPoints = stats.lastSixMonths.map((item, index, array) => {
    const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
    const y = 100 - (item.count / max) * 78 - 8;
    return { ...item, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1]?.x ?? 100} 100 L ${chartPoints[0]?.x ?? 0} 100 Z`;

  const trendText =
    monthDelta > 0
      ? `+${monthDelta} im Vergleich zum Vormonat`
      : monthDelta < 0
        ? `${monthDelta} im Vergleich zum Vormonat`
        : 'Gleich wie im Vormonat';

  const progressCopy =
    stats.thisWeek >= safeWeeklyGoal
      ? 'Wochenziel erreicht. Nächster Schritt: gezielte Follow-ups.'
      : `Noch ${safeWeeklyGoal - stats.thisWeek} Bewerbungen bis zum Wochenziel.`;

  const kpis = [
    {
      label: 'Gesamt',
      value: stats.total,
      helper: 'Alle erfassten Bewerbungen'
    },
    {
      label: 'Diese Woche',
      value: stats.thisWeek,
      helper: progressCopy
    },
    {
      label: 'Dieser Monat',
      value: stats.thisMonth,
      helper: trendText
    },
    {
      label: 'Follow-ups',
      value: stats.followUpsDue.length,
      helper: overdueCount > 0 ? `${overdueCount} überfällig` : dueTodayCount > 0 ? `${dueTodayCount} heute` : 'Alles im Plan'
    }
  ];

  return (
    <section className="grid gap-4">
      <div className="card overflow-hidden p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">{getGreeting()}</span>
              <span className="chip">Heute zählt jeder Schritt.</span>
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl">
                <span className="text-gradient">Momentum</span> für deine Bewerbungen
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Fokus für heute: Halte deinen Funnel aktiv und setze offene Follow-ups zuerst um.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="card-soft px-3 py-2">
                <p className="text-xs text-muted">Interviews</p>
                <p className="mono text-lg font-semibold">{stats.byStatus.Interview}</p>
              </div>
              <div className="card-soft px-3 py-2">
                <p className="text-xs text-muted">Angebote</p>
                <p className="mono text-lg font-semibold">{stats.byStatus.Angebot}</p>
              </div>
              <div className="card-soft px-3 py-2">
                <p className="text-xs text-muted">Antwortquote</p>
                <p className="mono text-lg font-semibold">
                  {stats.total === 0 ? 0 : Math.round(((stats.byStatus.Interview + stats.byStatus.Angebot) / stats.total) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Wochenziel</p>
            <div className="mt-3 flex items-center gap-4">
              <svg viewBox="0 0 88 88" className="h-24 w-24" aria-label="Wochenziel Fortschritt">
                <circle cx="44" cy="44" r="34" stroke="var(--color-border)" strokeWidth="8" fill="none" />
                <circle
                  cx="44"
                  cy="44"
                  r="34"
                  stroke="var(--color-primary)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressRatio)}`}
                  style={{ transition: 'stroke-dashoffset 380ms ease-out' }}
                />
                <text x="44" y="47" textAnchor="middle" fontSize="13" className="mono" fill="var(--color-text)">
                  {progressPercent}%
                </text>
              </svg>
              <div>
                <p className="text-sm font-semibold text-text">{stats.thisWeek} von {safeWeeklyGoal} erledigt</p>
                <p className="mt-1 text-xs text-muted">{progressCopy}</p>
                <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                  Ziel pro Woche
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={goalInput}
                    onChange={(event) => handleGoalInputChange(event.target.value)}
                    onBlur={handleGoalCommit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur();
                      }
                    }}
                    className="input-field h-8 w-20 px-2 py-1 text-sm"
                    aria-label="Wochenziel eingeben"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
            <p className="kpi-value mt-2">{item.value}</p>
            <p className="mt-2 text-xs text-muted">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg">Monatsverlauf</h3>
              <p className="text-sm text-muted">Sechs-Monats-Entwicklung deiner Aktivitäten</p>
            </div>
            <span className="chip">{trendText}</span>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label="Bewerbungsverlauf der letzten Monate">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#trendFill)" />
              <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.4" strokeLinecap="round" />
              {chartPoints.map((point) => (
                <circle key={point.label} cx={point.x} cy={point.y} r="2.3" fill="var(--color-accent)" />
              ))}
            </svg>

            <div className="mt-3 grid grid-cols-6 gap-2">
              {chartPoints.map((point) => (
                <div key={point.label} className="text-center">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted">{point.label}</p>
                  <p className="mono mt-1 text-sm">{point.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg">Follow-ups</h3>
              <p className="text-sm text-muted">Priorität für deinen heutigen Fokus</p>
            </div>
            <span className="chip">{stats.followUpsDue.length} offen</span>
          </div>

          {stats.followUpsDue.length === 0 ? (
            <div className="mt-4 card-soft p-4 text-sm text-muted">Keine fälligen Follow-ups. Du bist aktuell im Plan.</div>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.followUpsDue.slice(0, 5).map((application) => {
                const dateLabel = application.followUpDate ? formatDateDE(application.followUpDate) : 'Ohne Datum';
                const applicationDate = application.followUpDate ? stripTime(new Date(application.followUpDate)) : null;
                const isOverdue = Boolean(applicationDate && applicationDate < today);

                return (
                  <li key={application.id} className="card-soft flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-text">{application.company || 'Unbenannt'}</p>
                      <p className="text-xs text-muted">{application.position || 'Position nicht angegeben'}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: isOverdue ? 'var(--color-danger)' : 'var(--color-info)' }}>
                      {isOverdue ? 'Überfällig' : dateLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg">Statusübersicht</h3>
          <span className="chip">Pipeline-Health</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {STATUS_META.map((item) => {
            const count = stats.byStatus[item.status] ?? 0;
            const ratio = stats.total === 0 || count === 0 ? 0 : Math.max(8, Math.round((count / stats.total) * 100));
            return (
              <div key={item.status} className="card-soft p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className="mono rounded-md border border-border bg-surface px-2 py-0.5 text-sm font-semibold text-text">
                    {count}
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
