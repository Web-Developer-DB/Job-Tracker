import type { DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
}

// Dashboard zeigt KPIs, Verlauf und Follow-ups.
export const Dashboard = ({ stats }: DashboardProps) => {
  // Maximalwert für die einfache Balkengrafik.
  const max = Math.max(1, ...stats.lastSixMonths.map((item) => item.count));

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-muted">Gesamt</p>
          <p className="font-display text-2xl">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Diese Woche</p>
          <p className="font-display text-2xl">{stats.thisWeek}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-muted">Dieser Monat</p>
          <p className="font-display text-2xl">{stats.thisMonth}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card p-4">
          <h3 className="font-display text-lg mb-4">Verlauf letzte 6 Monate</h3>
          <div className="flex items-end gap-3">
            {stats.lastSixMonths.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div
                  className="w-8 rounded-lg bg-primary"
                  style={{ height: `${(item.count / max) * 120 + 12}px` }}
                />
                <span className="text-xs text-muted">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-display text-lg mb-3">Follow-ups fällig</h3>
          {stats.followUpsDue.length === 0 ? (
            <p className="text-sm text-muted">Keine Follow-ups heute.</p>
          ) : (
            <ul className="space-y-2">
              {stats.followUpsDue.slice(0, 5).map((application) => (
                <li key={application.id} className="text-sm">
                  <span className="font-semibold">{application.company || 'Unbenannt'}</span>
                  <span className="text-muted"> · {application.position || 'Position offen'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-display text-lg mb-3">Status Übersicht</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm text-muted">{status}</span>
              <span className="font-display text-lg">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
