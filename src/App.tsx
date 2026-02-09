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
import type { FilterSettings, Task } from './types';
import { useAppStore } from './store/appStore';

// Browser-Event für die Installationsaufforderung (nicht in TS definiert).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const getMotivationLine = (count: number) => {
  if (count === 0) return 'Heute ist ein guter Tag für den ersten Eintrag.';
  if (count < 4) return 'Du bist im Flow. Ein zusätzlicher Eintrag verstärkt den Effekt.';
  return 'Starker Fortschritt. Halte die Dynamik mit Follow-ups hoch.';
};

// Hauptkomponente: verbindet Store, Logik und UI.
const App = () => {
  // Alles, was wir aus dem globalen Store brauchen.
  const {
    applications,
    tasks,
    settings,
    isHydrated,
    hydrate,
    flushSave,
    addApplication,
    updateApplication,
    deleteApplication,
    changeStatus,
    addTask,
    updateTask,
    deleteTask,
    setFilters,
    setTheme,
    setWeeklyGoal,
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

  // Offene Saves flushen, wenn die App in den Hintergrund geht oder geschlossen wird.
  useEffect(() => {
    const handlePageHide = () => {
      void flushSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushSave();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSave]);

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

  const tasksByApplication = useMemo(() => {
    const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (!task.applicationId || task.applicationId === 'unknown') return acc;
      const list = acc[task.applicationId] ?? [];
      list.push(task);
      acc[task.applicationId] = list;
      return acc;
    }, {});

    for (const key of Object.keys(grouped)) {
      grouped[key] = [...grouped[key]].sort((a, b) => {
        if (a.done !== b.done) return Number(a.done) - Number(b.done);
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      });
    }

    return grouped;
  }, [tasks]);

  // Anzahl Aufgaben je Bewerbung (für die Kartenanzeige).
  const taskCounts = useMemo(() => {
    return Object.entries(tasksByApplication).reduce<Record<string, number>>((acc, [applicationId, list]) => {
      acc[applicationId] = list.length;
      return acc;
    }, {});
  }, [tasksByApplication]);

  const isStandaloneMode = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((window.navigator as NavigatorWithStandalone).standalone);

  // Druckfunktion von react-to-print für Browser-Tabs.
  const handleLibraryPrint = useReactToPrint({
    content: () => printRef.current
  });

  // In installierten PWAs ist native window.print stabiler bei wiederholten Klicks.
  const handlePrint = () => {
    if (isStandaloneMode()) {
      window.print();
      return;
    }
    handleLibraryPrint?.();
  };

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
    <div className="min-h-screen bg-base px-4 py-6 text-text sm:px-6 sm:py-8">
      <div className="print-hidden">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="chip">Offline-fähig</span>
                  <span className="chip">Lokal gespeichert</span>
                  <span className="chip">PWA bereit</span>
                </div>
                <div>
                  <h1 className="font-display text-3xl md:text-4xl">
                    Job Tracker <span className="text-gradient">Momentum</span>
                  </h1>
                  <p className="mt-2 text-sm text-muted">{getMotivationLine(stats.thisWeek)}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="card-soft px-3 py-2">
                    <p className="text-xs text-muted">Bewerbungen diese Woche</p>
                    <p className="mono text-lg font-semibold">{stats.thisWeek}</p>
                  </div>
                  <div className="card-soft px-3 py-2">
                    <p className="text-xs text-muted">Fällige Follow-ups</p>
                    <p className="mono text-lg font-semibold">{stats.followUpsDue.length}</p>
                  </div>
                  <div className="card-soft px-3 py-2">
                    <p className="text-xs text-muted">Aktive Aufgaben</p>
                    <p className="mono text-lg font-semibold">{tasks.filter((task) => !task.done).length}</p>
                  </div>
                </div>
              </div>

              <div className="flex max-w-[380px] flex-wrap items-center justify-end gap-2">
                {!isInstalled && (
                  <button type="button" onClick={handleInstall} className="btn btn-secondary">
                    App installieren
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                  className="btn btn-secondary"
                >
                  {settings.theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
                </button>

                <button type="button" onClick={handleBackup} className="btn btn-secondary">
                  Sichern
                </button>

                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
                  Wiederherstellen
                </button>

                <button type="button" onClick={handlePrint} className="btn btn-primary">
                  PDF / Drucken
                </button>

                <button type="button" onClick={handleReset} className="btn btn-danger">
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
            </div>
          </header>

          <Dashboard
            stats={stats}
            weeklyGoal={settings.weeklyGoal}
            onWeeklyGoalChange={setWeeklyGoal}
          />

          <ApplicationForm onSubmit={handleCreate} resetAfterSubmit />

          <FiltersBar value={filters} onChange={setFilters} />

          <Planner
            tasks={tasks}
            applications={applications}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl">Bewerbungen im Überblick</h2>
              <span className="chip">
                {filteredApplications.length} sichtbar · {applications.length} gesamt
              </span>
            </div>

            <ApplicationList
              applications={filteredApplications}
              taskCounts={taskCounts}
              tasksByApplication={tasksByApplication}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onStatusChange={changeStatus}
              onTaskUpdate={updateTask}
              onTaskDelete={deleteTask}
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
          </section>
        </div>

        <footer className="mx-auto mt-12 max-w-7xl border-t border-border pt-6 text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Lizenz: MIT</span>
            <span>Projekt von Dimitri B · Erstellt mit Unterstützung von Codex-Agenten</span>
            <a
              href="https://github.com/Web-Developer-DB/Job-Tracker"
              className="font-medium text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub-Repository
            </a>
          </div>
        </footer>
      </div>

      <div ref={printRef} className="print-only">
        <PrintView applications={filteredApplications} filters={filters} />
      </div>
    </div>
  );
};

export default App;
