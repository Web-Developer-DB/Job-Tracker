import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ApplicationForm, type ApplicationFormValues } from './components/ApplicationForm';
import { ApplicationList } from './components/ApplicationList';
import { Dashboard } from './components/Dashboard';
import { FiltersBar } from './components/FiltersBar';
import { Planner } from './components/Planner';
import { PrintView } from './components/PrintView';
import { Skeleton } from './components/Skeleton';
import { filterApplications, getDashboardStats, sortApplications } from './services/logic';
import type { FilterSettings } from './types';
import { useAppStore } from './store/appStore';

// Browser-Event für die Installationsaufforderung (nicht in TS definiert).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

// Hauptkomponente: verbindet Store, Logik und UI.
const App = () => {
  // Alles, was wir aus dem globalen Store brauchen.
  const {
    applications,
    tasks,
    settings,
    isHydrated,
    hydrate,
    addApplication,
    updateApplication,
    deleteApplication,
    changeStatus,
    addTask,
    updateTask,
    deleteTask,
    setFilters,
    setTheme,
    exportBackup,
    importBackup,
    resetAll
  } = useAppStore();

  // Installationsstatus der PWA.
  const [isInstalled, setIsInstalled] = useState(false);
  // Speichert das Installations-Event, damit wir es auf Button-Klick auslösen können.
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Referenz auf die versteckte File-Input für Restore.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Referenz auf die Print-Komponente.
  const printRef = useRef<HTMLDivElement>(null);

  // Beim Start Daten aus dem Storage laden.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Installationsstatus überwachen und Install-Event abfangen.
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone;
      setIsInstalled(Boolean(isStandalone));
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    checkInstalled();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Filter-Einstellungen aus dem Store auf ein Filter-Objekt mappen.
  const filters: FilterSettings = useMemo(
    () => ({
      status: settings.filterStatus,
      range: settings.filterRange,
      search: settings.search,
      sort: settings.sort
    }),
    [settings]
  );

  const hasActiveFilters = useMemo(
    () => filters.status !== 'Alle' || filters.range !== 'all' || filters.search.trim().length > 0,
    [filters]
  );

  // Bewerbungen nach Filter/Suche/Sortierung vorbereiten.
  const filteredApplications = useMemo(() => {
    const filtered = filterApplications(applications, {
      status: filters.status,
      range: filters.range,
      search: filters.search
    });
    return sortApplications(filtered, filters.sort);
  }, [applications, filters]);

  // Dashboard-KPIs berechnen.
  const stats = useMemo(() => getDashboardStats(applications), [applications]);

  // Anzahl Aufgaben je Bewerbung (für die Kartenanzeige).
  const taskCounts = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.applicationId] = (acc[task.applicationId] ?? 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  // Druckfunktion von react-to-print.
  const handlePrint = useReactToPrint({
    content: () => printRef.current
  });

  // Installations-Button: zeigt Prompt oder eine kurze Anleitung.
  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
      return;
    }
    alert(
      'Installation: Im Browsermenü „App installieren“ auswählen (oder auf iOS: Teilen → „Zum Home-Bildschirm“).'
    );
  };

  // Neues Formular oben: erstellt immer einen neuen Datensatz.
  const handleCreate = (values: ApplicationFormValues) => {
    addApplication(values);
  };

  // Bearbeiten in der Karte: aktualisiert den gewählten Datensatz.
  const handleUpdate = (id: string, values: ApplicationFormValues) => {
    updateApplication(id, values);
  };

  // Löschen mit Sicherheitsabfrage.
  const handleDelete = (id: string) => {
    if (window.confirm('Diese Bewerbung wirklich löschen?')) {
      deleteApplication(id);
    }
  };

  // Backup-Datei als JSON speichern.
  const handleBackup = () => {
    const backup = exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Backup-Datei laden und importieren.
  const handleRestore = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        importBackup(parsed);
      } catch (err) {
        console.error('Backup restore failed', err);
        alert('Backup konnte nicht importiert werden.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Alle lokalen Daten löschen (mit mehrstufiger Bestätigung).
  const handleReset = async () => {
    const first = window.confirm(
      'Daten wirklich löschen?\n\nAlle Bewerbungen, Aufgaben, Statusverläufe und Einstellungen werden unwiderruflich gelöscht.'
    );
    if (!first) return;

    const second = window.confirm(
      'Bist du sicher?\n\nAlle Verläufe sind danach vollständig gelöscht. Wenn du deine Daten noch nicht gesichert hast, klicke zuerst oben auf „Sichern“.'
    );
    if (!second) return;

    const third = window.confirm(
      'Letzte Bestätigung:\n\nAlle lokalen Daten werden jetzt endgültig gelöscht. Fortfahren?'
    );
    if (!third) return;

    await resetAll();
  };

  // Solange der Store noch lädt, zeigen wir ein Skeleton.
  if (!isHydrated) {
    return <Skeleton />;
  }

  return (
    <div className="min-h-screen bg-base text-text px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Job-Tracker und Planer</h1>
            <p className="text-sm text-muted">Offline-fähig, lokal gespeichert, bereit für deinen Alltag.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstall}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                App installieren
              </button>
            )}
            <button
              type="button"
              onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              {settings.theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
            </button>
            <button
              type="button"
              onClick={handleBackup}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              Sichern
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-border px-4 py-2 text-sm"
            >
              Wiederherstellen
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            >
              PDF / Drucken
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-danger px-4 py-2 text-sm text-danger"
            >
              Alles löschen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleRestore}
            />
          </div>
        </header>

        <Dashboard stats={stats} />

        <FiltersBar value={filters} onChange={setFilters} />

        <ApplicationForm
          onSubmit={handleCreate}
          resetAfterSubmit
        />

        <ApplicationList
          applications={filteredApplications}
          taskCounts={taskCounts}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onStatusChange={changeStatus}
          totalCount={applications.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() =>
            setFilters({
              ...filters,
              status: 'Alle',
              range: 'all',
              search: ''
            })
          }
        />

        <Planner
          tasks={tasks}
          applications={applications}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </div>

      <footer className="mx-auto mt-12 max-w-6xl border-t border-border pt-6 text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Lizenz: MIT</span>
          <span>Projekt von Dimitri B · Erstellt mit Unterstützung von Codex-Agenten</span>
          <a
            href="https://github.com/Web-Developer-DB/Job-Tracker"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            GitHub-Repository
          </a>
        </div>
      </footer>

      <div ref={printRef} className="print-only">
        <PrintView applications={filteredApplications} filters={filters} />
      </div>
    </div>
  );
};

export default App;
