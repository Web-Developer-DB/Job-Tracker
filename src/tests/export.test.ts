import { describe, expect, it } from 'vitest';
import { buildExportRows } from '../services/export';
import { createApplication } from '../services/logic';

const baseDate = new Date('2025-02-01T10:00:00.000Z');

describe('export helpers', () => {
  it('builds rows for print export', () => {
    const app = createApplication({
      company: 'Acme',
      position: 'Designer',
      status: 'Beworben'
    }, baseDate);

    const rows = buildExportRows([app]);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('Beworben');
  });
});
