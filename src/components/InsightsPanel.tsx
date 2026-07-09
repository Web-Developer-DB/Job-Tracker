import { useEffect, useMemo, useState } from 'react';
import { formatDateDE } from '../services/export';
import { parseDateValue } from '../services/date';
import type { ApplicationStatus, DashboardStats, JobApplication, Task } from '../types';
import { Badge, Icon, Input } from './ui';
import { getStatusColor, hexToRgba } from './StatusBadge';

interface InsightsPanelProps {
  stats: DashboardStats;
  weeklyGoal: number;
  tasks: Task[];
  applications: JobApplication[];
  onWeeklyGoalChange: (goal: number) => void;
}

const DISTRIBUTION_STATUSES: ApplicationStatus[] = ['Beworben', 'Interview', 'Angebot', 'Abgelehnt'];

export const InsightsPanel = ({ stats, weeklyGoal, tasks, applications, onWeeklyGoalChange }: InsightsPanelProps) => {
  const safeWeeklyGoal = Math.min(30, Math.max(1, Math.round(weeklyGoal || 1)));
  const [goalInput, setGoalInput] = useState(String(safeWeeklyGoal));
  const progressRatio = Math.min(1, stats.thisWeek / safeWeeklyGoal);
  const progressPercent = Math.round(progressRatio * 100);

  useEffect(() => {
    setGoalInput(String(safeWeeklyGoal));
  }, [safeWeeklyGoal]);

  const applicationMap = useMemo(() => {
    return applications.reduce<Record<string, JobApplication>>((acc, application) => {
      acc[application.id] = application;
      return acc;
    }, {});
  }, [applications]);

  const nextActions = useMemo(() => {
    const followUps = stats.followUpsDue.map((application) => ({
      id: `follow-${application.id}`,
      title: 'Follow-up',
      company: application.company || 'Unbenannt',
      date: application.followUpDate,
      color: getStatusColor('Follow-up fällig')
    }));

    const taskActions = tasks
      .filter((task) => !task.done)
      .map((task) => {
        const application = applicationMap[task.applicationId];
        const color = task.type === 'interview' ? getStatusColor('Interview') : task.type === 'reminder' ? '#f6b450' : '#4e9eff';
        return {
          id: `task-${task.id}`,
          title: task.title || 'Aufgabe',
          company: application?.company || 'Ohne Bewerbung',
          date: task.dueDate,
          color
        };
      });

    return [...followUps, ...taskActions]
      .sort((a, b) => {
        const aTime = a.date ? parseDateValue(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        const bTime = b.date ? parseDateValue(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 5);
  }, [applicationMap, stats.followUpsDue, tasks]);

  const maxMonthCount = Math.max(1, ...stats.lastSixMonths.map((item) => item.count));
  const chartPoints = stats.lastSixMonths.map((item, index, array) => {
    const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
    const y = 100 - (item.count / maxMonthCount) * 72 - 14;
    return { ...item, x, y };
  });
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const latestMonth = stats.lastSixMonths[stats.lastSixMonths.length - 1]?.count ?? 0;
  const previousMonth = stats.lastSixMonths[stats.lastSixMonths.length - 2]?.count ?? 0;
  const monthDelta = latestMonth - previousMonth;

  const distributionGradient = buildDistributionGradient(stats);

  const commitGoal = () => {
    const parsed = Number.parseInt(goalInput, 10);
    if (Number.isNaN(parsed)) {
      setGoalInput(String(safeWeeklyGoal));
      return;
    }
    onWeeklyGoalChange(parsed);
  };

  return (
    <aside className="space-y-4" aria-label="Insights">
      <section className="insight-panel rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Wochenziel</h2>
            <p className="text-sm text-muted">{stats.thisWeek} von {safeWeeklyGoal} Bewerbungen</p>
          </div>
          <Badge>{progressPercent}%</Badge>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <svg viewBox="0 0 92 92" className="h-24 w-24" aria-label="Wochenziel Fortschritt">
            <circle cx="46" cy="46" r="36" stroke="var(--color-border)" strokeWidth="8" fill="none" />
            <circle
              cx="46"
              cy="46"
              r="36"
              stroke="var(--color-primary)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              transform="rotate(-90 46 46)"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progressRatio)}`}
            />
            <text x="46" y="50" textAnchor="middle" fontSize="13" className="mono" fill="var(--color-text)">
              {progressPercent}%
            </text>
          </svg>
          <label className="field-label flex-1">
            Wochenziel eingeben
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={goalInput}
              onChange={(event) => {
                setGoalInput(event.target.value);
                const parsed = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(parsed)) onWeeklyGoalChange(parsed);
              }}
              onBlur={commitGoal}
            />
          </label>
        </div>
      </section>

      <section className="insight-panel rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Statusverteilung</h2>
          <Badge>{stats.total} Gesamt</Badge>
        </div>

        <div className="mt-4 grid grid-cols-[104px_minmax(0,1fr)] items-center gap-4">
          <div
            className="h-24 w-24 rounded-full border border-border"
            style={{ background: distributionGradient }}
            aria-label="Statusverteilung als Diagramm"
            role="img"
          />
          <div className="space-y-2">
            {DISTRIBUTION_STATUSES.map((status) => {
              const count = stats.byStatus[status] ?? 0;
              const color = getStatusColor(status);
              return (
                <div key={status} className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate">{status}</span>
                  </span>
                  <span className="mono text-text">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="insight-panel rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Nächste Aktionen</h2>
          <Icon name="bell" className="text-warning" />
        </div>

        {nextActions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-3 text-sm text-muted">
            Keine offenen Aktionen.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {nextActions.map((action) => (
              <div key={action.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: action.color, boxShadow: `0 0 0 4px ${hexToRgba(action.color, 0.12)}` }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{action.title}</p>
                    <p className="truncate text-xs text-muted">
                      {action.company}
                      {action.date ? ` · ${formatDateDE(action.date)}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="insight-panel rounded-lg border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Monatsverlauf</h2>
          <Badge>{monthDelta >= 0 ? `+${monthDelta}` : monthDelta}</Badge>
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-28 w-full" role="img" aria-label="Bewerbungsverlauf der letzten sechs Monate">
          <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="2.8" strokeLinecap="round" />
          {chartPoints.map((point) => (
            <circle key={point.label} cx={point.x} cy={point.y} r="2.4" fill="var(--color-accent)" />
          ))}
        </svg>

        <div className="mt-2 grid grid-cols-6 gap-1">
          {chartPoints.map((point) => (
            <div key={point.label} className="text-center">
              <p className="text-[0.62rem] font-semibold uppercase text-muted">{point.label}</p>
              <p className="mono text-xs text-text">{point.count}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

const buildDistributionGradient = (stats: DashboardStats) => {
  if (stats.total === 0) {
    return 'conic-gradient(var(--color-surface-3) 0deg 360deg)';
  }

  let cursor = 0;
  const stops = DISTRIBUTION_STATUSES.map((status) => {
    const count = stats.byStatus[status] ?? 0;
    const start = cursor;
    const end = cursor + (count / stats.total) * 360;
    cursor = end;
    return `${getStatusColor(status)} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
};
