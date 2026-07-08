import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ApplicationForm, type ApplicationFormValues } from './components/ApplicationForm';
import { ApplicationList } from './components/ApplicationList';
import { Dashboard } from './components/Dashboard';
import { RANGE_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from './components/FiltersBar';
import { MobileActionBar } from './components/mobile/MobileActionBar';
import { Planner } from './components/Planner';
import { PrintView } from './components/PrintView';
import { Skeleton } from './components/Skeleton';
import { Badge, BottomSheet, Button, Input, Select, useToast } from './components/ui';
import { downloadJsonFile, saveJsonWithPicker, supportsSaveFilePicker } from './services/fileSave';
import { parseDateValue } from './services/date';
import { filterApplications, getDashboardStats, sortApplications } from './services/logic';
import type { ApplicationStatus, FilterRange, FilterSettings, SortOption, Task } from './types';
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

type MobileFilterChipKey = 'search' | 'status' | 'range' | 'sort';

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
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { showToast } = useToast();
  // Referenz auf die versteckte File-Input für Restore.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Referenz auf die Print-Komponente.
  const printRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const listSectionRef = useRef<HTMLElement>(null);
  const filterStatusRef = useRef<HTMLSelectElement>(null);
  const pendingDeleteRef = useRef<{ id: string; timeoutId: number } | null>(null);

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

  useEffect(() => {
    return () => {
      const pending = pendingDeleteRef.current;
      if (!pending) return;
      window.clearTimeout(pending.timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const withModifier = event.metaKey || event.ctrlKey;
      if (!withModifier) return;
      if (event.defaultPrevented) return;

      const key = event.key.toLowerCase();

      if (key === 'k') {
        event.preventDefault();
        if (window.innerWidth < 768) {
          listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.setTimeout(() => mobileSearchInputRef.current?.focus(), 130);
          return;
        }
        desktopSearchInputRef.current?.focus();
      }

      if (key === 'n') {
        event.preventDefault();
        setIsCreateSheetOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const updateFilters = (patch: Partial<FilterSettings>) => setFilters({ ...filters, ...patch });

  const clearFilters = () =>
    setFilters({
      status: 'Alle',
      range: 'all',
      search: '',
      sort: 'createdAt'
    });

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: MobileFilterChipKey; label: string }> = [];
    const trimmedSearch = filters.search.trim();
    if (trimmedSearch) {
      chips.push({ key: 'search', label: `Suche: ${trimmedSearch}` });
    }
    if (filters.status !== 'Alle') {
      chips.push({ key: 'status', label: `Status: ${filters.status}` });
    }
    if (filters.range !== 'all') {
      const rangeLabel = RANGE_OPTIONS.find((option) => option.value === filters.range)?.label ?? filters.range;
      chips.push({ key: 'range', label: `Zeitraum: ${rangeLabel}` });
    }
    if (filters.sort !== 'createdAt') {
      const sortLabel = SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? filters.sort;
      chips.push({ key: 'sort', label: `Sortierung: ${sortLabel}` });
    }
    return chips;
  }, [filters]);

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
        const aDue = parseDateValue(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bDue = parseDateValue(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
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
    contentRef: printRef
  });

  // In installierten PWAs ist native window.print stabiler bei wiederholten Klicks.
  const handlePrint = () => {
    if (isStandaloneMode()) {
      window.print();
      return;
    }
    handleLibraryPrint?.();
  };

  const handleFocusMobileSearch = () => {
    listSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => mobileSearchInputRef.current?.focus(), 130);
  };

  const handleFocusDesktopSearch = () => {
    desktopSearchInputRef.current?.focus();
  };

  const handleFocusDesktopCreate = () => setIsCreateSheetOpen(true);

  const handleDashboardStatusSelect = (status: ApplicationStatus | 'Alle') => {
    updateFilters({ status });
    listSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  const handleChipRemove = (key: MobileFilterChipKey) => {
    if (key === 'search') {
      updateFilters({ search: '' });
      return;
    }
    if (key === 'status') {
      updateFilters({ status: 'Alle' });
      return;
    }
    if (key === 'range') {
      updateFilters({ range: 'all' });
      return;
    }
    updateFilters({ sort: 'createdAt' });
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
    setIsCreateSheetOpen(false);
    showToast({
      title: 'Gespeichert',
      description: 'Neue Bewerbung wurde hinzugefügt.',
      variant: 'success'
    });
  };

  // Bearbeiten in der Karte: aktualisiert den gewählten Datensatz.
  const handleUpdate = (id: string, values: ApplicationFormValues) => {
    updateApplication(id, values);
    showToast({
      title: 'Gespeichert',
      description: 'Änderungen wurden übernommen.',
      variant: 'success'
    });
  };

  // Löschen mit Sicherheitsabfrage.
  const handleDelete = (id: string) => {
    if (!window.confirm('Diese Bewerbung wirklich löschen?')) {
      return;
    }

    const existingPending = pendingDeleteRef.current;
    if (existingPending) {
      window.clearTimeout(existingPending.timeoutId);
      deleteApplication(existingPending.id);
      pendingDeleteRef.current = null;
    }

    const timeoutId = window.setTimeout(() => {
      deleteApplication(id);
      pendingDeleteRef.current = null;
    }, 4800);

    pendingDeleteRef.current = { id, timeoutId };
    showToast({
      title: 'Löschen vorgemerkt',
      description: 'Die Bewerbung wird in 5 Sekunden entfernt.',
      variant: 'warning',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          const pending = pendingDeleteRef.current;
          if (!pending || pending.id !== id) return;
          window.clearTimeout(pending.timeoutId);
          pendingDeleteRef.current = null;
          showToast({
            title: 'Löschen abgebrochen',
            description: 'Die Bewerbung bleibt unverändert erhalten.',
            variant: 'info'
          });
        }
      }
    });
  };

  // Backup-Datei als JSON speichern.
  const handleBackup = async () => {
    const backup = exportBackup();
    const fileName = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (!supportsSaveFilePicker()) {
      downloadJsonFile(backup, fileName);
      showToast({
        title: 'Backup heruntergeladen',
        description: 'Dein Browser unterstützt keine direkte Speicherort-Auswahl.',
        variant: 'info'
      });
      return;
    }

    try {
      const result = await saveJsonWithPicker(backup, fileName);
      if (result === 'saved') {
        showToast({
          title: 'Backup gespeichert',
          description: 'Die JSON-Datei wurde erfolgreich exportiert.',
          variant: 'success'
        });
      }
    } catch (err) {
      console.error('Backup save failed', err);
      alert('Backup konnte nicht gespeichert werden.');
    }
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
        showToast({
          title: 'Backup importiert',
          description: 'Daten und Einstellungen wurden wiederhergestellt.',
          variant: 'success'
        });
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
    showToast({
      title: 'Daten gelöscht',
      description: 'Die App wurde auf den Ausgangszustand zurückgesetzt.',
      variant: 'info'
    });
  };

  // Solange der Store noch lädt, zeigen wir ein Skeleton.
  if (!isHydrated) {
    return <Skeleton />;
  }

  const hasAnyFilterSignals = hasActiveFilters || filters.sort !== 'createdAt';

  return (
    <div className="app-shell min-h-screen px-3 py-4 pb-[calc(7rem+env(safe-area-inset-bottom))] text-text sm:px-6 sm:py-7 sm:pb-[calc(7.2rem+env(safe-area-inset-bottom))] md:pb-7">
      <div className="print-hidden">
        <div className="app-frame content-stage space-y-6 sm:space-y-7">
          <header className="card p-4 md:p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Offline-fähig</Badge>
                  <Badge>Lokal gespeichert</Badge>
                  <Badge>PWA bereit</Badge>
                </div>
                <div>
                  <h1 className="font-display text-3xl md:text-[2.25rem]">
                    Job Tracker <span className="text-gradient">Momentum</span>
                  </h1>
                  <p className="mt-2 text-sm text-muted">{getMotivationLine(stats.thisWeek)}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="card-soft flex min-h-[76px] flex-col justify-between px-3 py-2">
                    <p className="min-h-[2.2rem] text-xs leading-tight text-muted">Bewerbungen diese Woche</p>
                    <p className="mono text-lg font-semibold leading-none">{stats.thisWeek}</p>
                  </div>
                  <div className="card-soft flex min-h-[76px] flex-col justify-between px-3 py-2">
                    <p className="min-h-[2.2rem] text-xs leading-tight text-muted">Fällige Follow-ups</p>
                    <p className="mono text-lg font-semibold leading-none">{stats.followUpsDue.length}</p>
                  </div>
                  <div className="card-soft flex min-h-[76px] flex-col justify-between px-3 py-2">
                    <p className="min-h-[2.2rem] text-xs leading-tight text-muted">Aktive Aufgaben</p>
                    <p className="mono text-lg font-semibold leading-none">{tasks.filter((task) => !task.done).length}</p>
                  </div>
                </div>
              </div>

              <div className="w-full">
                <div className="card-soft space-y-2 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Schnellaktionen</p>

                  <Button
                    type="button"
                    onClick={handleFocusDesktopCreate}
                    variant="primary"
                    className="w-full !min-h-[46px]"
                  >
                    Neue Bewerbung
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={handlePrint}
                      variant="secondary"
                      className="!w-full"
                    >
                      PDF / Drucken
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                      variant="secondary"
                      className="!w-full"
                    >
                      {settings.theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
                    </Button>

                    <Button type="button" onClick={handleBackup} variant="secondary" className="!w-full">
                      Sichern
                    </Button>

                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      variant="secondary"
                      className="!w-full"
                    >
                      Wiederherstellen
                    </Button>

                    {!isInstalled && (
                      <Button type="button" onClick={handleInstall} variant="ghost" className="col-span-2 !w-full">
                        App installieren
                      </Button>
                    )}
                  </div>

                  <Button type="button" onClick={handleReset} variant="destructive" className="w-full">
                    Alles löschen
                  </Button>
                </div>

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
            activeStatus={filters.status}
            onStatusSelect={handleDashboardStatusSelect}
          />

          <Planner
            tasks={tasks}
            applications={applications}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />

          <section ref={listSectionRef} className="space-y-3">
            <div className="hidden md:block">
              <div className="card-soft space-y-3 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base text-text">Suche und Filter</p>
                    <p className="text-xs text-muted">Fokussiert auf die Bewerbungsübersicht.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(true)}>
                      Filter öffnen
                    </Button>
                    {hasAnyFilterSignals && (
                      <Button type="button" variant="ghost" onClick={clearFilters}>
                        Zurücksetzen
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <label className="field-label">
                    Suche
                    <Input
                      ref={desktopSearchInputRef}
                      type="search"
                      inputMode="search"
                      autoCapitalize="none"
                      value={filters.search}
                      onChange={(event) => updateFilters({ search: event.target.value })}
                      placeholder="Unternehmen oder Position (Ctrl/Cmd+K)"
                    />
                  </label>
                  <Button type="button" variant="ghost" className="self-end" onClick={handleFocusDesktopSearch}>
                    Suche fokussieren
                  </Button>
                </div>

                {activeFilterChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                    {activeFilterChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        className="chip !normal-case !tracking-normal !text-xs !text-text"
                        onClick={() => handleChipRemove(chip.key)}
                        aria-label={`Filter entfernen: ${chip.label}`}
                      >
                        <span>{chip.label}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky top-2 z-30 md:hidden">
              <div className="card-soft space-y-3 p-3">
                <label className="field-label">
                  Suche
                  <Input
                    ref={mobileSearchInputRef}
                    type="search"
                    inputMode="search"
                    autoCapitalize="none"
                    value={filters.search}
                    onChange={(event) => updateFilters({ search: event.target.value })}
                    placeholder="Unternehmen oder Position"
                  />
                </label>

                {activeFilterChips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeFilterChips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        className="chip !normal-case !tracking-normal !text-xs !text-text"
                        onClick={() => handleChipRemove(chip.key)}
                        aria-label={`Filter entfernen: ${chip.label}`}
                      >
                        <span>{chip.label}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl">Bewerbungen im Überblick</h2>
              <Badge>
                {filteredApplications.length} sichtbar · {applications.length} gesamt
              </Badge>
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
              onClearFilters={clearFilters}
            />
          </section>
        </div>

        <BottomSheet
          open={isCreateSheetOpen}
          onClose={() => setIsCreateSheetOpen(false)}
          title="Neue Bewerbung"
        >
          <ApplicationForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateSheetOpen(false)}
            embedded
            resetAfterSubmit
            submitLabel="Bewerbung speichern"
          />
        </BottomSheet>

        <BottomSheet
          open={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          title="Filter und Sortierung"
          initialFocusRef={filterStatusRef}
        >
          <div className="space-y-4">
            <label className="field-label">
              Status
              <Select
                ref={filterStatusRef}
                value={filters.status}
                onChange={(event) => updateFilters({ status: event.target.value as ApplicationStatus | 'Alle' })}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-label">
              Zeitraum
              <Select
                value={filters.range}
                onChange={(event) => updateFilters({ range: event.target.value as FilterRange })}
              >
                {RANGE_OPTIONS.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="field-label">
              Sortieren
              <Select
                value={filters.sort}
                onChange={(event) => updateFilters({ sort: event.target.value as SortOption })}
              >
                {SORT_OPTIONS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </Select>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
              <Button type="button" variant="primary" onClick={() => setIsFilterSheetOpen(false)}>
                Anwenden
              </Button>
            </div>
          </div>
        </BottomSheet>

        <footer className="content-stage mt-10 border-t border-border pt-5 text-sm text-muted">
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

      <MobileActionBar
        onCreate={() => setIsCreateSheetOpen(true)}
        onSearch={handleFocusMobileSearch}
        onFilter={() => setIsFilterSheetOpen(true)}
        hasActiveFilters={hasActiveFilters || filters.sort !== 'createdAt'}
      />

      <div ref={printRef} className="print-only">
        <PrintView applications={filteredApplications} filters={filters} />
      </div>
    </div>
  );
};

export default App;
