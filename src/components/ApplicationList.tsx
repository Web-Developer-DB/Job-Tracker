import { AnimatePresence, motion } from 'framer-motion';
import type { ApplicationStatus, JobApplication } from '../types';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationListProps {
  applications: JobApplication[];
  taskCounts: Record<string, number>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  totalCount?: number;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

// Liste aller Bewerbungen inkl. einfacher Animationen.
export const ApplicationList = ({
  applications,
  taskCounts,
  onEdit,
  onDelete,
  onStatusChange,
  totalCount = 0,
  hasActiveFilters = false,
  onClearFilters
}: ApplicationListProps) => {
  // Leerer Zustand, wenn es noch keine Bewerbungen gibt.
  if (applications.length === 0) {
    if (totalCount > 0 && hasActiveFilters) {
      return (
        <div className="card p-8 text-center">
          <p className="text-muted">Keine Treffer für die aktuellen Filter.</p>
          <p className="mt-2 text-sm text-muted">
            Es sind {totalCount} Bewerbungen gespeichert, aber keine passt zu Suche, Status oder Zeitraum.
          </p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="card p-8 text-center text-muted">
        Noch keine Bewerbungen – lege deine erste Bewerbung an.
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
            transition={{ duration: 0.2 }}
          >
            <ApplicationCard
              application={application}
              taskCount={taskCounts[application.id] ?? 0}
              onEdit={() => onEdit(application.id)}
              onDelete={() => onDelete(application.id)}
              onStatusChange={(status) => onStatusChange(application.id, status)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
