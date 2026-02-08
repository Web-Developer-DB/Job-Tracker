import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplicationForm } from '../components/ApplicationForm';
import { Dashboard } from '../components/Dashboard';
import { FiltersBar } from '../components/FiltersBar';
import type { DashboardStats, FilterSettings } from '../types';

const baseFilters: FilterSettings = {
  status: 'Alle',
  range: 'all',
  search: '',
  sort: 'createdAt'
};

describe('ApplicationForm', () => {
  it('submits entered values', () => {
    const handleSubmit = vi.fn();

    render(<ApplicationForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/unternehmen/i), { target: { value: 'Nova' } });
    fireEvent.click(screen.getByRole('button', { name: /speichern/i }));

    expect(handleSubmit).toHaveBeenCalled();
    expect(handleSubmit.mock.calls[0][0].company).toBe('Nova');
  });
});

describe('Dashboard', () => {
  it('shows KPI totals', () => {
    const stats: DashboardStats = {
      total: 3,
      byStatus: {
        Entwurf: 1,
        Beworben: 1,
        Interview: 1,
        Angebot: 0,
        Abgelehnt: 0,
        'Zurückgezogen': 0
      },
      thisWeek: 1,
      thisMonth: 2,
      lastSixMonths: [
        { label: 'Aug', count: 0 },
        { label: 'Sep', count: 0 },
        { label: 'Okt', count: 1 },
        { label: 'Nov', count: 0 },
        { label: 'Dez', count: 1 },
        { label: 'Jan', count: 1 }
      ],
      followUpsDue: []
    };

    render(<Dashboard stats={stats} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/gesamt/i)).toBeInTheDocument();
  });
});

describe('FiltersBar', () => {
  it('fires onChange when selecting sort', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<FiltersBar value={baseFilters} onChange={handleChange} />);

    await user.selectOptions(screen.getByLabelText(/sortieren/i), 'status');
    expect(handleChange).toHaveBeenCalled();
  });
});
