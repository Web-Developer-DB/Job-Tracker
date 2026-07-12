import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrintView } from '../components/PrintView';
import type { FilterSettings, JobApplication } from '../types';

const filters: FilterSettings = {
  status: 'Beworben',
  range: '30d',
  search: '',
  sort: 'createdAt'
};

const createApplication = (patch: Partial<JobApplication> = {}): JobApplication => ({
  id: 'app-1',
  status: 'Beworben',
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
  company: 'Acme GmbH',
  position: 'Backend Engineer',
  ...patch
});

describe('PrintView', () => {
  it('renders title, period and table rows', () => {
    render(
      <PrintView
        title="Mein Bewerbungsreport"
        applications={[createApplication()]}
        filters={filters}
      />
    );

    expect(screen.getByRole('heading', { name: /mein bewerbungsreport/i })).toBeInTheDocument();
    expect(screen.getByText(/Zeitraum: Letzte 30 Tage · Status: Beworben/i)).toBeInTheDocument();
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Beworben')).toBeInTheDocument();
    expect(screen.getByText('Offen')).toBeInTheDocument();
  });

  it('shows fallback cells and mapped result for rejected applications', () => {
    render(
      <PrintView
        applications={[createApplication({ status: 'Abgelehnt', company: undefined, position: undefined })]}
        filters={{ ...filters, status: 'Abgelehnt' }}
      />
    );

    expect(screen.getByText(/Zeitraum: Letzte 30 Tage · Status: Abgelehnt/i)).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Absage')).toBeInTheDocument();
    expect(screen.getByText('Abgelehnt')).toHaveStyle({ color: '#dc2626' });
  });
});
