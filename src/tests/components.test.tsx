import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ApplicationCard } from '../components/ApplicationCard';
import { Dashboard } from '../components/Dashboard';
import { Planner } from '../components/Planner';
import type { DashboardStats, JobApplication, Task } from '../types';

const buildApplication = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: 'app-1',
  status: 'Entwurf',
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-01T10:00:00.000Z',
  company: 'Nova GmbH',
  position: 'Frontend Engineer',
  ...overrides
});

const buildDashboardStats = (): DashboardStats => ({
  total: 4,
  byStatus: {
    Entwurf: 2,
    Beworben: 1,
    Interview: 1,
    Angebot: 0,
    Abgelehnt: 0,
    Zurückgezogen: 0
  },
  thisWeek: 2,
  thisMonth: 3,
  lastSixMonths: [
    { label: 'Aug', count: 0 },
    { label: 'Sep', count: 1 },
    { label: 'Okt', count: 1 },
    { label: 'Nov', count: 0 },
    { label: 'Dez', count: 2 },
    { label: 'Jan', count: 3 }
  ],
  followUpsDue: []
});

describe('Dashboard interactions', () => {
  it('emits weekly goal changes from the input', () => {
    const handleWeeklyGoalChange = vi.fn();

    render(
      <Dashboard
        stats={buildDashboardStats()}
        weeklyGoal={5}
        onWeeklyGoalChange={handleWeeklyGoalChange}
      />
    );

    const goalInput = screen.getByLabelText(/wochenziel eingeben/i);
    fireEvent.change(goalInput, { target: { value: '12' } });

    expect(handleWeeklyGoalChange).toHaveBeenCalled();
    expect(handleWeeklyGoalChange).toHaveBeenLastCalledWith(12);
  });
});

describe('ApplicationCard interactions', () => {
  it('changes status and deletes application', () => {
    const handleStatusChange = vi.fn();
    const handleDelete = vi.fn();

    render(
      <ApplicationCard
        application={buildApplication()}
        onUpdate={vi.fn()}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onTaskUpdate={vi.fn()}
        onTaskDelete={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/status ändern/i), { target: { value: 'Interview' } });
    expect(handleStatusChange).toHaveBeenCalledWith('Interview');

    fireEvent.click(screen.getByRole('button', { name: /löschen/i }));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('opens edit mode and submits updated data', () => {
    const handleUpdate = vi.fn();

    render(
      <ApplicationCard
        application={buildApplication()}
        onUpdate={handleUpdate}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onTaskUpdate={vi.fn()}
        onTaskDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /bearbeiten/i }));
    fireEvent.change(screen.getByLabelText(/unternehmen/i), { target: { value: 'Nova Labs' } });
    fireEvent.click(screen.getByRole('button', { name: /änderungen speichern/i }));

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    expect(handleUpdate.mock.calls[0][0].company).toBe('Nova Labs');
  });

  it('renders task titles and allows editing/completing tasks', () => {
    const handleTaskUpdate = vi.fn();
    const tasks: Task[] = [
      {
        id: 'task-1',
        applicationId: 'app-1',
        title: 'Follow-up Mail',
        done: false,
        type: 'task',
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z'
      }
    ];

    render(
      <ApplicationCard
        application={buildApplication()}
        taskCount={1}
        tasks={tasks}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/1 aufgabe geplant/i)).toBeInTheDocument();
    expect(screen.getByText('Follow-up Mail')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /aufgabe ändern/i }));
    fireEvent.change(screen.getByLabelText(/aufgabe ändern/i), { target: { value: 'Follow-up Telefonat' } });
    fireEvent.click(screen.getByRole('button', { name: /^speichern$/i }));
    expect(handleTaskUpdate).toHaveBeenCalledWith('task-1', { title: 'Follow-up Telefonat' });

    fireEvent.click(screen.getByRole('button', { name: /aufgabe erledigen/i }));
    fireEvent.change(screen.getByLabelText(/notiz zur erledigten aufgabe/i), {
      target: { value: 'Mail versendet und bestätigt' }
    });
    fireEvent.click(screen.getByRole('button', { name: /erledigt speichern/i }));

    expect(handleTaskUpdate).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({
        done: true,
        completionNote: 'Mail versendet und bestätigt'
      })
    );
  });

  it('allows deleting completed tasks', () => {
    const handleTaskDelete = vi.fn();
    const tasks: Task[] = [
      {
        id: 'task-1',
        applicationId: 'app-1',
        title: 'Interview vorbereitet',
        done: true,
        completionNote: 'Leitfaden finalisiert',
        type: 'task',
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z'
      }
    ];

    render(
      <ApplicationCard
        application={buildApplication()}
        taskCount={1}
        tasks={tasks}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onStatusChange={vi.fn()}
        onTaskUpdate={vi.fn()}
        onTaskDelete={handleTaskDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /aufgabe löschen/i }));
    expect(handleTaskDelete).toHaveBeenCalledWith('task-1');
  });
});

describe('Planner interactions', () => {
  it('rejects empty task titles and submits trimmed tasks', () => {
    const handleAddTask = vi.fn();

    render(
      <Planner
        tasks={[]}
        applications={[buildApplication()]}
        onAddTask={handleAddTask}
        onUpdateTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /hinzufügen/i }));
    expect(handleAddTask).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/neue aufgabe/i), {
      target: { value: '  Follow-up Mail  ' }
    });
    fireEvent.click(screen.getByRole('button', { name: /hinzufügen/i }));

    expect(handleAddTask).toHaveBeenCalledTimes(1);
    expect(handleAddTask.mock.calls[0][0]).toMatchObject({
      title: 'Follow-up Mail',
      applicationId: 'unknown',
      type: 'task',
      dueDate: undefined
    });
  });

  it('shows overdue tasks and triggers update/delete actions', () => {
    const handleUpdateTask = vi.fn();
    const handleDeleteTask = vi.fn();
    const tasks: Task[] = [
      {
        id: 'task-1',
        applicationId: 'app-1',
        title: 'Anruf vorbereiten',
        dueDate: '2000-01-01',
        done: false,
        type: 'task',
        createdAt: '2025-01-01T10:00:00.000Z',
        updatedAt: '2025-01-01T10:00:00.000Z'
      }
    ];

    render(
      <Planner
        tasks={tasks}
        applications={[buildApplication()]}
        onAddTask={vi.fn()}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /überfällig/i }));
    expect(screen.getByText(/anruf vorbereiten/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(handleUpdateTask).toHaveBeenCalledWith('task-1', { done: true });

    fireEvent.click(screen.getByRole('button', { name: /löschen/i }));
    expect(handleDeleteTask).toHaveBeenCalledWith('task-1');
  });
});
