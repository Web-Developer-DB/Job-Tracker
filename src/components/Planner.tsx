import { useMemo, useState, type FormEvent } from 'react';
import type { JobApplication, Task } from '../types';
import { formatDateDE } from '../services/export';

interface PlannerProps {
  tasks: Task[];
  applications: JobApplication[];
  onAddTask: (data: Partial<Task>) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

// Filteransicht für Aufgaben.
type ViewMode = 'today' | 'week' | 'overdue';

// Labels für die UI.
const viewLabels: Record<ViewMode, string> = {
  today: 'Heute',
  week: 'Diese Woche',
  overdue: 'Überfällig'
};

// Labels für Task-Typen.
const typeLabels: Record<Task['type'], string> = {
  task: 'Aufgabe',
  interview: 'Interview',
  reminder: 'Erinnerung'
};

// Planer-Komponente für Aufgaben/Termine je Bewerbung.
export const Planner = ({ tasks, applications, onAddTask, onUpdateTask, onDeleteTask }: PlannerProps) => {
  // Lokaler State für Filter, Eingabefelder und Auswahl.
  const [view, setView] = useState<ViewMode>('today');
  const [title, setTitle] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<Task['type']>('task');

  // Map für schnellen Zugriff auf Bewerbungsnamen.
  const applicationsMap = useMemo(() => {
    return applications.reduce<Record<string, string>>((acc, application) => {
      acc[application.id] = `${application.company || 'Unbenannt'}${application.position ? ` · ${application.position}` : ''}`;
      return acc;
    }, {});
  }, [applications]);

  // Filtert Aufgaben je nach gewählter Ansicht.
  const filtered = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + 7);

    return tasks.filter((task) => {
      // Wenn kein Fälligkeitsdatum gesetzt ist, nur in „Diese Woche“ zeigen.
      if (!task.dueDate) return view === 'week';
      const due = new Date(task.dueDate);
      if (view === 'today') {
        return due.toDateString() === startOfToday.toDateString();
      }
      if (view === 'week') {
        return due >= startOfToday && due <= endOfWeek;
      }
      if (view === 'overdue') {
        return due < startOfToday && !task.done;
      }
      return true;
    });
  }, [tasks, view]);

  // Neue Aufgabe abspeichern und Formular zurücksetzen.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onAddTask({
      applicationId: applicationId || 'unknown',
      title: title.trim(),
      dueDate: dueDate || undefined,
      type
    });
    setTitle('');
    setDueDate('');
    setApplicationId('');
    setType('task');
  };

  return (
    <section className="card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Planer</h2>
          <p className="text-sm text-muted">Aufgaben & Termine pro Bewerbung.</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                view === mode ? 'bg-accent text-on-primary' : 'border border-border text-muted'
              }`}
              type="button"
              onClick={() => setView(mode)}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input
          className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Neue Aufgabe"
        />
        <select
          className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          value={applicationId}
          onChange={(event) => setApplicationId(event.target.value)}
        >
          <option value="">Ohne Bewerbung</option>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.company || 'Unbenannt'}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          value={type}
          onChange={(event) => setType(event.target.value as Task['type'])}
        >
          <option value="task">Aufgabe</option>
          <option value="interview">Interview</option>
          <option value="reminder">Erinnerung</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-border bg-surface-2 px-3 py-2"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
        >
          Hinzufügen
        </button>
      </form>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted">Keine Aufgaben im Filter.</p>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(event) => onUpdateTask(task.id, { done: event.target.checked })}
                />
                <div>
                  <p className={`font-medium ${task.done ? 'line-through text-muted' : ''}`}>{task.title || 'Ohne Titel'}</p>
                  <p className="text-xs text-muted">
                    {applicationsMap[task.applicationId] || 'Ohne Bewerbung'} · {typeLabels[task.type]}
                    {task.dueDate ? ` · ${formatDateDE(task.dueDate)}` : ''}
                  </p>
                </div>
              </label>
              <button
                type="button"
                className="rounded-full border border-danger px-3 py-1 text-xs text-danger"
                onClick={() => onDeleteTask(task.id)}
              >
                Löschen
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
