import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ApplicationStatus, JobApplication, Task } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateDE } from '../services/export';
import { ApplicationForm, type ApplicationFormValues } from './ApplicationForm';

interface ApplicationCardProps {
  application: JobApplication;
  taskCount?: number;
  tasks?: Task[];
  onUpdate: (values: ApplicationFormValues) => void;
  onDelete: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

// Alle Status-Werte für das Dropdown.
const STATUSES: ApplicationStatus[] = ['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt', 'Zurückgezogen'];

// Einzelkarte für eine Bewerbung inkl. Aktionen.
export const ApplicationCard = ({
  application,
  taskCount = 0,
  tasks = [],
  onUpdate,
  onDelete,
  onStatusChange,
  onTaskUpdate,
  onTaskDelete
}: ApplicationCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNoteDraft, setCompletionNoteDraft] = useState('');

  const tasksLabel = taskCount === 1 ? '1 Aufgabe geplant' : `${taskCount} Aufgaben geplant`;

  const startTaskEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitleDraft(task.title);
    setCompletingTaskId(null);
    setCompletionNoteDraft('');
  };

  const saveTaskEdit = () => {
    if (!editingTaskId) return;
    const normalizedTitle = taskTitleDraft.trim();
    if (!normalizedTitle) return;
    onTaskUpdate(editingTaskId, { title: normalizedTitle });
    setEditingTaskId(null);
    setTaskTitleDraft('');
  };

  const startTaskCompletion = (taskId: string) => {
    setCompletingTaskId(taskId);
    setCompletionNoteDraft('');
    setEditingTaskId(null);
    setTaskTitleDraft('');
  };

  const saveTaskCompletion = () => {
    if (!completingTaskId) return;
    const normalizedNote = completionNoteDraft.trim();
    if (!normalizedNote) return;
    onTaskUpdate(completingTaskId, {
      done: true,
      completionNote: normalizedNote,
      completedAt: new Date().toISOString()
    });
    setCompletingTaskId(null);
    setCompletionNoteDraft('');
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg">{application.company || 'Unbenannt'}</h3>
          <p className="text-sm text-muted">
            {application.position || 'Position nicht angegeben'}
            {application.location ? ` · ${application.location}` : ''}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-2 text-sm text-muted md:grid-cols-2">
        <div className="card-soft px-3 py-2">
          <p className="text-xs text-muted">Erstellt</p>
          <p className="font-medium text-text">{formatDateDE(application.createdAt)}</p>
        </div>
        <div className="card-soft px-3 py-2">
          <p className="text-xs text-muted">Follow-up</p>
          <p className="font-medium text-text">{application.followUpDate ? formatDateDE(application.followUpDate) : 'Noch nicht geplant'}</p>
        </div>
      </div>

      <div className="space-y-1 text-sm text-muted">
        {application.link && (
          <a className="font-medium text-primary hover:underline" href={application.link} target="_blank" rel="noreferrer">
            Job-Link öffnen
          </a>
        )}
        {application.source && <p>Quelle: {application.source}</p>}
        {application.contact && <p>Kontakt: {application.contact}</p>}

        {taskCount > 0 && (
          <div className="space-y-2">
            <p>{tasksLabel}</p>

            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="card-soft space-y-2 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${task.done ? 'text-muted line-through' : 'text-text'}`}>
                      {task.title || 'Ohne Titel'}
                    </p>
                    <span className="chip">{task.done ? 'Erledigt' : 'Offen'}</span>
                  </div>

                  <div className="text-xs text-muted">
                    {task.dueDate ? `Fällig: ${formatDateDE(task.dueDate)}` : 'Ohne Fälligkeitsdatum'}
                    {task.completedAt ? ` · Erledigt am ${formatDateDE(task.completedAt)}` : ''}
                  </div>

                  {task.completionNote && (
                    <p className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-muted">
                      Notiz: {task.completionNote}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-ghost" onClick={() => startTaskEdit(task)}>
                      Aufgabe ändern
                    </button>

                    {task.done ? (
                      <button type="button" className="btn btn-danger" onClick={() => onTaskDelete(task.id)}>
                        Aufgabe löschen
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" onClick={() => startTaskCompletion(task.id)}>
                        Aufgabe erledigen
                      </button>
                    )}
                  </div>

                  {editingTaskId === task.id && (
                    <div className="space-y-2 border-t border-border pt-2">
                      <label className="field-label">
                        Aufgabe ändern
                        <input
                          className="input-field"
                          value={taskTitleDraft}
                          onChange={(event) => setTaskTitleDraft(event.target.value)}
                          placeholder="Aufgaben-Titel"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-primary" onClick={saveTaskEdit}>
                          Speichern
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setEditingTaskId(null);
                            setTaskTitleDraft('');
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}

                  {completingTaskId === task.id && !task.done && (
                    <div className="space-y-2 border-t border-border pt-2">
                      <label className="field-label">
                        Notiz zur erledigten Aufgabe
                        <input
                          className="input-field"
                          value={completionNoteDraft}
                          onChange={(event) => setCompletionNoteDraft(event.target.value)}
                          placeholder="z. B. Follow-up gesendet, Antwort kommt nächste Woche"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-primary" onClick={saveTaskCompletion}>
                          Erledigt speichern
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => {
                            setCompletingTaskId(null);
                            setCompletionNoteDraft('');
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {application.notes && (
        <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-muted">{application.notes}</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
        <label className="field-label max-w-[220px]">
          Status ändern
          <select
            className="select-field"
            value={application.status}
            onChange={(event) => onStatusChange(event.target.value as ApplicationStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button className="btn btn-secondary" type="button" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? 'Schließen' : 'Bearbeiten'}
          </button>
          <button className="btn btn-danger" type="button" onClick={onDelete}>
            Löschen
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            key="edit-panel"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border pt-4">
              <ApplicationForm
                initial={application}
                embedded
                submitLabel="Änderungen speichern"
                onSubmit={(values) => {
                  onUpdate(values);
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
