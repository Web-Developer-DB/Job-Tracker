import { AnimatePresence, motion } from 'framer-motion';
import type { ApplicationStatus, JobApplication, Task } from '../types';
import { ApplicationCard } from './ApplicationCard';
import type { ApplicationFormValues } from './ApplicationForm';

interface ApplicationListProps {
  applications: JobApplication[];
  taskCounts: Record<string, number>;
  tasksByApplication: Record<string, Task[]>;
  onUpdate: (id: string, values: ApplicationFormValues) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  totalCount?: number;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

// Liste aller Bewerbungen inkl. einfacher Animationen.
export const ApplicationList = ({
  applications,
  taskCounts,
  tasksByApplication,
  onUpdate,
  onDelete,
  onStatusChange,
  onTaskUpdate,
  onTaskDelete,
  totalCount = 0,
  hasActiveFilters = false,
  onClearFilters
}: ApplicationListProps) => {
  // Leerer Zustand, wenn es noch keine Bewerbungen gibt.
  if (applications.length === 0) {
    if (totalCount > 0 && hasActiveFilters) {
      return (
        <div className="card p-8 text-center">
          <p className="font-display text-xl text-text">Keine Treffer für die aktuellen Filter.</p>
          <p className="mt-2 text-sm text-muted">
            Es sind {totalCount} Bewerbungen gespeichert, aber keine passt zu Suche, Status oder Zeitraum.
          </p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="btn btn-secondary mt-5"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl text-text">Noch keine Bewerbungen.</p>
        <p className="mt-2 text-sm text-muted">Dein erster Eintrag dauert unter zwei Minuten und bringt sofort Momentum.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* AnimatePresence ermöglicht Ein- und Ausblend-Animationen */}
      <AnimatePresence initial={false}>
        {applications.map((application) => (
          <motion.div
            key={application.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <ApplicationCard
              application={application}
              taskCount={taskCounts[application.id] ?? 0}
              tasks={tasksByApplication[application.id] ?? []}
              onUpdate={(values) => onUpdate(application.id, values)}
              onDelete={() => onDelete(application.id)}
              onStatusChange={(status) => onStatusChange(application.id, status)}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
