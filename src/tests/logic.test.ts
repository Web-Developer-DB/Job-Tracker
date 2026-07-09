import { describe, expect, it } from 'vitest';
import {
  addApplication,
  addTask,
  changeStatus,
  createApplication,
  createTask,
  deleteTask,
  deleteApplication,
  filterApplications,
  getDashboardStats,
  sortApplications,
  updateTask,
  updateApplication,
  buildBackup,
  restoreBackup,
  isRestorableBackup,
  calculateFollowUpDate,
  defaultState
} from '../services/logic';
import type { AppState } from '../types';

const baseDate = new Date('2025-01-01T10:00:00.000Z');

describe('application CRUD', () => {
  it('adds, updates, and deletes applications', () => {
    const app = createApplication({ company: 'Acme', position: 'Engineer' }, baseDate);
    const added = addApplication([], app);
    expect(added).toHaveLength(1);

    const updated = updateApplication(added, app.id, { status: 'Beworben' }, baseDate);
    expect(updated[0].status).toBe('Beworben');

    const removed = deleteApplication(updated, app.id);
    expect(removed).toHaveLength(0);
  });

  it('records status history when status changes', () => {
    const app = createApplication({ company: 'Nova' }, baseDate);
    const updated = changeStatus([app], app.id, 'Interview', baseDate);
    expect(updated[0].status).toBe('Interview');
    expect(updated[0].history?.length).toBe(1);
  });

  it('clears follow-up when moving to a terminal status', () => {
    const app = createApplication({ company: 'Nova', followUpDate: '2025-01-20' }, baseDate);
    const updated = changeStatus([app], app.id, 'Abgelehnt', baseDate);
    expect(updated[0].followUpDate).toBeUndefined();
  });

  it('creates automatic follow-up when changing to Beworben', () => {
    const app = createApplication({ company: 'Nova', followUpDate: undefined }, baseDate);
    const updated = changeStatus([app], app.id, 'Beworben', baseDate);
    expect(updated[0].followUpDate).toBe('2025-01-08');
  });

  it('clears follow-up when editing an application to a terminal status', () => {
    const app = createApplication({ company: 'Nova', followUpDate: '2025-01-20' }, baseDate);
    const updated = updateApplication([app], app.id, { status: 'Abgelehnt' }, baseDate);
    expect(updated[0].followUpDate).toBeUndefined();
  });

  it('records status history when editing the status through a full update', () => {
    const app = createApplication({ company: 'Nova', status: 'Beworben' }, baseDate);
    const updated = updateApplication([app], app.id, { status: 'Interview' }, baseDate);
    expect(updated[0].history).toEqual([{ status: 'Interview', date: baseDate.toISOString() }]);
  });
});

describe('task CRUD', () => {
  it('adds, updates, and deletes tasks', () => {
    const task = createTask({ title: 'Follow-up mail', applicationId: 'app-1' }, baseDate);
    const added = addTask([], task);
    expect(added).toHaveLength(1);

    const updated = updateTask(added, task.id, { done: true }, baseDate);
    expect(updated[0].done).toBe(true);

    const removed = deleteTask(updated, task.id);
    expect(removed).toHaveLength(0);
  });

  it('keeps task completion metadata consistent', () => {
    const task = createTask({ title: 'Follow-up mail', applicationId: 'app-1' }, baseDate);
    const completed = updateTask([task], task.id, { done: true }, baseDate);

    expect(completed[0].completedAt).toBe(baseDate.toISOString());

    const reopened = updateTask(completed, task.id, { done: false }, baseDate);

    expect(reopened[0].done).toBe(false);
    expect(reopened[0].completedAt).toBeUndefined();
    expect(reopened[0].completionNote).toBeUndefined();
  });
});

describe('follow-up logic', () => {
  it('calculates follow-up dates for key statuses', () => {
    const followUp = calculateFollowUpDate('Beworben', baseDate);
    expect(followUp).toBe('2025-01-08');
  });

  it('returns null for statuses without automatic follow-up', () => {
    expect(calculateFollowUpDate('Entwurf', baseDate)).toBeNull();
    expect(calculateFollowUpDate('Abgelehnt', baseDate)).toBeNull();
  });
});

describe('filtering and sorting', () => {
  it('filters by status and search term', () => {
    const apps = [
      createApplication({ company: 'Alpha', status: 'Beworben' }, baseDate),
      createApplication({ company: 'Beta', status: 'Interview' }, baseDate)
    ];
    const filtered = filterApplications(apps, {
      status: 'Beworben',
      range: 'all',
      search: 'alp'
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].company).toBe('Alpha');
  });

  it('ignores leading/trailing spaces in search', () => {
    const apps = [createApplication({ company: 'Alpha', status: 'Beworben' }, baseDate)];
    const filtered = filterApplications(apps, {
      status: 'Alle',
      range: 'all',
      search: '  alp  '
    });
    expect(filtered).toHaveLength(1);
  });

  it('sorts by follow-up date', () => {
    const apps = [
      createApplication({ company: 'Alpha', followUpDate: '2025-01-20' }, baseDate),
      createApplication({ company: 'Beta', followUpDate: '2025-01-05' }, baseDate)
    ];
    const sorted = sortApplications(apps, 'followUp');
    expect(sorted[0].company).toBe('Beta');
  });

  it('filters by range (last 7 days)', () => {
    const now = new Date('2025-01-20T00:00:00Z');
    const apps = [
      createApplication({ company: 'Recent' }, new Date('2025-01-17T00:00:00Z')),
      createApplication({ company: 'Old' }, new Date('2025-01-01T00:00:00Z'))
    ];
    const filtered = filterApplications(
      apps,
      {
        status: 'Alle',
        range: '7d',
        search: ''
      },
      now
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].company).toBe('Recent');
  });

  it('sorts by status order', () => {
    const apps = [
      createApplication({ company: 'B', status: 'Interview' }, baseDate),
      createApplication({ company: 'A', status: 'Entwurf' }, baseDate),
      createApplication({ company: 'C', status: 'Angebot' }, baseDate)
    ];
    const sorted = sortApplications(apps, 'status');
    expect(sorted.map((item) => item.status)).toEqual(['Entwurf', 'Interview', 'Angebot']);
  });
});

describe('dashboard stats', () => {
  it('builds totals and monthly series', () => {
    const apps = [
      createApplication({ status: 'Beworben' }, new Date('2024-12-01T00:00:00Z')),
      createApplication({ status: 'Interview' }, new Date('2025-01-15T00:00:00Z'))
    ];
    const stats = getDashboardStats(apps, new Date('2025-01-20T00:00:00Z'));
    expect(stats.total).toBe(2);
    expect(stats.byStatus.Interview).toBe(1);
    expect(stats.lastSixMonths.length).toBe(6);
  });

  it('excludes terminal applications from due follow-ups', () => {
    const apps = [
      createApplication({ status: 'Abgelehnt', followUpDate: '2025-01-10' }, baseDate),
      createApplication({ status: 'Zurückgezogen', followUpDate: '2025-01-10' }, baseDate),
      createApplication({ status: 'Beworben', followUpDate: '2025-01-10' }, baseDate)
    ];

    const stats = getDashboardStats(apps, new Date('2025-01-20T00:00:00Z'));

    expect(stats.followUpsDue).toHaveLength(1);
    expect(stats.followUpsDue[0].status).toBe('Beworben');
  });
});

describe('backup and restore', () => {
  it('builds and restores backup payloads', () => {
    const app = createApplication({ company: 'Gamma' }, baseDate);
    const task = createTask({ applicationId: app.id, title: 'Call' }, baseDate);
    const state: AppState = {
      applications: [app],
      tasks: [task],
      settings: {
        theme: 'dark',
        sort: 'createdAt',
        filterStatus: 'Alle',
        filterRange: 'all',
        search: '',
        weeklyGoal: 5
      }
    };

    const backup = buildBackup(state, baseDate);
    expect(backup.version).toBe('1.0');

    const restored = restoreBackup(backup);
    expect(restored.applications).toHaveLength(1);
    expect(restored.tasks).toHaveLength(1);
  });

  it('falls back to default state for invalid backups', () => {
    const restored = restoreBackup({} as never);
    expect(restored.settings.weeklyGoal).toBe(defaultState.settings.weeklyGoal);
    expect(restored.applications).toHaveLength(0);
  });

  it('restores raw app-state JSON backups from older exports', () => {
    const rawState: AppState = {
      applications: [createApplication({ id: 'app-raw', company: 'Raw Backup GmbH' }, baseDate)],
      tasks: [createTask({ id: 'task-raw', applicationId: 'app-raw', title: 'Nachfassen' }, baseDate)],
      settings: {
        theme: 'dark',
        sort: 'createdAt',
        filterStatus: 'Alle',
        filterRange: 'all',
        search: '',
        weeklyGoal: 5
      }
    };

    expect(isRestorableBackup(rawState)).toBe(true);
    const restored = restoreBackup(rawState);

    expect(restored.applications).toHaveLength(1);
    expect(restored.applications[0].company).toBe('Raw Backup GmbH');
    expect(restored.tasks).toHaveLength(1);
    expect(restored.tasks[0].applicationId).toBe('app-raw');
  });

  it('does not treat arbitrary JSON as a restorable backup', () => {
    expect(isRestorableBackup({ version: '1.0', data: {} })).toBe(false);
    expect(isRestorableBackup({ hello: 'world' })).toBe(false);
  });

  it('normalizes restored data before it reaches the app', () => {
    const restored = restoreBackup({
      version: '1.0',
      createdAt: baseDate.toISOString(),
      data: {
        applications: [
          {
            id: 'app-1',
            company: '  Nova  ',
            link: 'javascript:alert(1)',
            status: 'Abgelehnt',
            followUpDate: '2025-01-10',
            createdAt: 'not-a-date',
            updatedAt: baseDate.toISOString()
          }
        ],
        tasks: [
          {
            id: 'task-1',
            applicationId: 'missing-app',
            title: '  Follow-up  ',
            done: false,
            completionNote: 'old note',
            completedAt: baseDate.toISOString(),
            type: 'invalid',
            createdAt: baseDate.toISOString(),
            updatedAt: baseDate.toISOString()
          }
        ],
        settings: {
          theme: 'invalid',
          sort: 'invalid',
          filterStatus: 'invalid',
          filterRange: 'invalid',
          search: '  dev  ',
          weeklyGoal: 999
        }
      }
    } as never);

    expect(restored.applications[0]).toMatchObject({
      company: 'Nova',
      status: 'Abgelehnt'
    });
    expect(restored.applications[0].followUpDate).toBeUndefined();
    expect(restored.applications[0].link).toBeUndefined();
    expect(restored.tasks[0]).toMatchObject({
      applicationId: 'unknown',
      title: 'Follow-up',
      done: false,
      type: 'task'
    });
    expect(restored.tasks[0].completedAt).toBeUndefined();
    expect(restored.settings).toMatchObject({
      theme: 'dark',
      sort: 'followUp',
      filterStatus: 'Alle',
      filterRange: 'all',
      search: 'dev',
      weeklyGoal: 30
    });
  });

  it('preserves protocol-less web links from legacy backups as https URLs', () => {
    const restored = restoreBackup({
      version: '1.0',
      createdAt: baseDate.toISOString(),
      data: {
        applications: [
          {
            id: 'app-1',
            company: 'Nova',
            link: 'jobs.example.com/role',
            status: 'Beworben',
            createdAt: baseDate.toISOString(),
            updatedAt: baseDate.toISOString()
          }
        ],
        tasks: [],
        settings: defaultState.settings
      }
    });

    expect(restored.applications[0].link).toBe('https://jobs.example.com/role');
  });

  it('deduplicates task ids during restore so actions only affect one task', () => {
    const restored = restoreBackup({
      version: '1.0',
      createdAt: baseDate.toISOString(),
      data: {
        applications: [createApplication({ id: 'app-1' }, baseDate)],
        tasks: [
          {
            id: 'duplicate-task',
            applicationId: 'app-1',
            title: 'Erste Aufgabe',
            done: false,
            type: 'task',
            createdAt: baseDate.toISOString(),
            updatedAt: baseDate.toISOString()
          },
          {
            id: 'duplicate-task',
            applicationId: 'app-1',
            title: 'Zweite Aufgabe',
            done: false,
            type: 'task',
            createdAt: baseDate.toISOString(),
            updatedAt: baseDate.toISOString()
          }
        ],
        settings: defaultState.settings
      }
    });

    expect(restored.tasks).toHaveLength(2);
    expect(new Set(restored.tasks.map((task) => task.id)).size).toBe(2);
    expect(restored.tasks.map((task) => task.title)).toEqual(['Erste Aufgabe', 'Zweite Aufgabe']);
  });
});
