import { AnimatePresence, motion } from 'framer-motion';
import type { ApplicationStatus, JobApplication } from '../types';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationListProps {
  applications: JobApplication[];
  taskCounts: Record<string, number>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

// Liste aller Bewerbungen inkl. einfacher Animationen.
export const ApplicationList = ({
  applications,
  taskCounts,
  onEdit,
  onDelete,
  onStatusChange
}: ApplicationListProps) => {
  // Leerer Zustand, wenn es noch keine Bewerbungen gibt.
  if (applications.length === 0) {
    return (
      <div className="card p-8 text-center text-muted">
        Noch keine Bewerbungen. Lege deine erste Bewerbung an.
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
