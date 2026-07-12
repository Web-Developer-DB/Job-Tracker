import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ApplicationStatus, JobApplication, Task } from '../types';
import { StatusBadge, getStatusColor, hexToRgba, type DisplayStatus } from './StatusBadge';
import { formatDateDE } from '../services/export';
import { parseDateValue, stripTime } from '../services/date';
import { isTerminalStatus } from '../services/logic';
import { ApplicationForm, type ApplicationFormValues } from './ApplicationForm';
import { Button, Icon, Input, Select, cn } from './ui';

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

const STATUSES: ApplicationStatus[] = ['Entwurf', 'Beworben', 'Interview', 'Angebot', 'Abgelehnt', 'Zurückgezogen'];

const getInitials = (value?: string) => {
  const normalized = value?.trim();
  if (!normalized) return '?';
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
};

const getFollowUpState = (application: JobApplication) => {
  if (isTerminalStatus(application.status) || !application.followUpDate) return 'none';
  const followUpDate = parseDateValue(application.followUpDate);
  if (!followUpDate) return 'none';
  const today = stripTime(new Date());
  if (followUpDate < today) return 'overdue';
  if (followUpDate.getTime() === today.getTime()) return 'today';
  return 'planned';
};

const getFollowUpLabel = (application: JobApplication) => {
  if (isTerminalStatus(application.status)) return 'Nicht relevant';
  if (!application.followUpDate) return 'Noch offen';
  const state = getFollowUpState(application);
  if (state === 'overdue') return 'Follow-up fällig';
  if (state === 'today') return 'Follow-up heute';
  return formatDateDE(application.followUpDate);
};

// Einzelkarte für eine Bewerbung: kompakte Summary, Detaildaten erst beim Aufklappen.
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completionNoteDraft, setCompletionNoteDraft] = useState('');

  const followUpState = getFollowUpState(application);
  const displayStatus: DisplayStatus =
    followUpState === 'overdue' || followUpState === 'today' ? 'Follow-up fällig' : application.status;
  const statusColor = getStatusColor(displayStatus);
  const openTasks = useMemo(() => tasks.filter((task) => !task.done), [tasks]);
  const primaryTask = openTasks[0] ?? tasks[0];
  const tasksLabel = taskCount === 1 ? '1 Aufgabe geplant' : `${taskCount} Aufgaben geplant`;
  const nextActionLabel = primaryTask?.title ?? getFollowUpLabel(application);
  const applicationDateLabel = formatDateDE(application.createdAt);

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

  const handleEditOpen = () => {
    setIsDetailsOpen(true);
    setIsEditing(true);
  };

  return (
    <article
      className="application-card group relative overflow-hidden rounded-lg border bg-surface shadow-soft transition hover:border-border-strong"
      style={{
        borderColor: hexToRgba(statusColor, 0.34),
        boxShadow: `inset 4px 0 0 ${statusColor}, var(--shadow-soft)`
      }}
    >
      <div className="grid gap-3 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-4">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-bold text-white shadow-soft"
          style={{
            borderColor: hexToRgba(statusColor, 0.4),
            background: `linear-gradient(145deg, ${hexToRgba(statusColor, 0.72)}, ${hexToRgba(statusColor, 0.28)})`
          }}
          aria-hidden="true"
        >
          {getInitials(application.company)}
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[0.96rem] font-extrabold leading-snug text-text">
                {application.company || 'Unbenannt'}
              </h3>
              <p className="truncate text-xs font-medium text-muted">{application.position || 'Position nicht angegeben'}</p>
            </div>
            <StatusBadge status={displayStatus} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.73rem] font-medium text-muted">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon name="mapPin" className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{application.location || 'Remote/Offen'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" className="h-3.5 w-3.5 text-primary" />
              <span>Beworben am {applicationDateLabel}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1 text-text">
              <Icon name="bell" className="h-3.5 w-3.5 text-warning" />
              <span className="truncate">{nextActionLabel}</span>
            </span>
            {taskCount > 0 && <span className="chip !min-h-6 !px-2 !py-0.5 !text-[0.65rem]">{tasksLabel}</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
          <Button
            type="button"
            variant={isDetailsOpen ? 'primary' : 'ghost'}
            size="icon"
            className="!min-h-[44px] !w-11"
            onClick={() => setIsDetailsOpen((value) => !value)}
            aria-expanded={isDetailsOpen}
            aria-label={isDetailsOpen ? 'Details schließen' : 'Details anzeigen'}
            title={isDetailsOpen ? 'Details schließen' : 'Details anzeigen'}
          >
            <Icon name="chevronDown" className={cn('transition', isDetailsOpen && 'rotate-180')} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="!min-h-[44px] !w-11"
            onClick={handleEditOpen}
            aria-label="Bearbeiten"
            title="Bearbeiten"
          >
            <Icon name="edit" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="!min-h-[44px] !w-11"
            aria-label="Weitere Aktionen"
            title="Weitere Aktionen"
            onClick={() => setIsDetailsOpen(true)}
          >
            <Icon name="more" />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isDetailsOpen && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3 pb-4 pt-3 sm:px-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <DetailItem label="Erstellt" value={applicationDateLabel} icon="calendar" />
                    <DetailItem label="Follow-up" value={getFollowUpLabel(application)} icon="bell" />
                    <DetailItem label="Quelle" value={application.source || 'Nicht angegeben'} icon="archive" />
                    <DetailItem label="Kontakt" value={application.contact || 'Nicht angegeben'} icon="user" />
                  </div>

                  {application.link && (
                    <a
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:border-border-strong hover:bg-surface-2"
                      href={application.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="briefcase" />
                      Job-Link öffnen
                    </a>
                  )}

                  <div className="rounded-lg border border-border bg-surface-2 px-3 py-3">
                    <p className="text-xs font-semibold uppercase text-muted">Notizen</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text">
                      {application.notes || 'Keine Notizen hinterlegt.'}
                    </p>
                  </div>

                  {taskCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted">{tasksLabel}</p>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div key={task.id} className="rounded-lg border border-border bg-surface-2 px-3 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={cn('break-words text-sm font-semibold', task.done ? 'text-muted line-through' : 'text-text')}>
                                  {task.title || 'Ohne Titel'}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                  {task.dueDate ? `Fällig: ${formatDateDE(task.dueDate)}` : 'Ohne Fälligkeitsdatum'}
                                  {task.completedAt ? ` · Erledigt am ${formatDateDE(task.completedAt)}` : ''}
                                </p>
                              </div>
                              <span className="chip !min-h-6 !px-2 !py-0.5">{task.done ? 'Erledigt' : 'Offen'}</span>
                            </div>

                            {task.completionNote && (
                              <p className="mt-2 rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted">
                                Notiz: {task.completionNote}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="ghost" onClick={() => startTaskEdit(task)}>
                                Aufgabe ändern
                              </Button>

                              {task.done ? (
                                <Button type="button" variant="destructive" onClick={() => onTaskDelete(task.id)}>
                                  Aufgabe löschen
                                </Button>
                              ) : (
                                <Button type="button" variant="secondary" onClick={() => startTaskCompletion(task.id)}>
                                  Aufgabe erledigen
                                </Button>
                              )}
                            </div>

                            {editingTaskId === task.id && (
                              <div className="mt-3 space-y-2 border-t border-border pt-3">
                                <label className="field-label">
                                  Aufgabe ändern
                                  <Input
                                    value={taskTitleDraft}
                                    onChange={(event) => setTaskTitleDraft(event.target.value)}
                                    placeholder="Aufgaben-Titel"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <Button type="button" variant="primary" onClick={saveTaskEdit}>
                                    Speichern
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingTaskId(null);
                                      setTaskTitleDraft('');
                                    }}
                                  >
                                    Abbrechen
                                  </Button>
                                </div>
                              </div>
                            )}

                            {completingTaskId === task.id && !task.done && (
                              <div className="mt-3 space-y-2 border-t border-border pt-3">
                                <label className="field-label">
                                  Notiz zur erledigten Aufgabe
                                  <Input
                                    value={completionNoteDraft}
                                    onChange={(event) => setCompletionNoteDraft(event.target.value)}
                                    placeholder="z. B. Follow-up gesendet"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <Button type="button" variant="primary" onClick={saveTaskCompletion}>
                                    Erledigt speichern
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      setCompletingTaskId(null);
                                      setCompletionNoteDraft('');
                                    }}
                                  >
                                    Abbrechen
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="field-label">
                    Status ändern
                    <Select
                      value={application.status}
                      onChange={(event) => onStatusChange(event.target.value as ApplicationStatus)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" type="button" onClick={() => setIsEditing((value) => !value)}>
                      {isEditing ? 'Schließen' : 'Bearbeiten'}
                    </Button>
                    <Button variant="destructive" type="button" onClick={onDelete}>
                      Löschen
                    </Button>
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isEditing && (
                  <motion.div
                    key="edit-panel"
                    className="mt-4 overflow-hidden"
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
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};

const DetailItem = ({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: 'archive' | 'bell' | 'calendar' | 'user';
}) => (
  <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-semibold text-text">{value}</p>
  </div>
);
