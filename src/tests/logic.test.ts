import { describe, expect, it } from 'vitest';
import {
  addApplication,
  changeStatus,
  createApplication,
  createTask,
  deleteApplication,
  filterApplications,
  getDashboardStats,
  sortApplications,
  updateApplication,
  buildBackup,
  restoreBackup,
  calculateFollowUpDate
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
});

describe('follow-up logic', () => {
  it('calculates follow-up dates for key statuses', () => {
    const followUp = calculateFollowUpDate('Beworben', baseDate);
    expect(followUp).toBe('2025-01-08');
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

  it('sorts by follow-up date', () => {
    const apps = [
      createApplication({ company: 'Alpha', followUpDate: '2025-01-20' }, baseDate),
      createApplication({ company: 'Beta', followUpDate: '2025-01-05' }, baseDate)
    ];
    const sorted = sortApplications(apps, 'followUp');
    expect(sorted[0].company).toBe('Beta');
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
        search: ''
      }
    };

    const backup = buildBackup(state, baseDate);
    expect(backup.version).toBe('1.0');

    const restored = restoreBackup(backup);
    expect(restored.applications).toHaveLength(1);
    expect(restored.tasks).toHaveLength(1);
  });
});
