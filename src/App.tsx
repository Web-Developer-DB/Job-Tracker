import { useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ApplicationForm, type ApplicationFormValues } from './components/ApplicationForm';
import { ApplicationList } from './components/ApplicationList';
import { Dashboard } from './components/Dashboard';
import { RANGE_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from './components/FiltersBar';
import { InsightsPanel } from './components/InsightsPanel';
import { MobileActionBar } from './components/mobile/MobileActionBar';
import { Planner } from './components/Planner';
import { PrintView } from './components/PrintView';
import { Skeleton } from './components/Skeleton';
import { Badge, BottomSheet, Button, Icon, Input, Select, useToast } from './components/ui';
import { downloadJsonFile, saveJsonWithPicker, supportsSaveFilePicker } from './services/fileSave';
import { parseDateValue } from './services/date';
import { filterApplications, getDashboardStats, sortApplications } from './services/logic';
import type { ApplicationStatus, FilterRange, FilterSettings, SortOption, Task } from './types';
import { useAppStore } from './store/appStore';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

type MobileFilterChipKey = 'search' | 'status' | 'range' | 'sort';

const DEFAULT_SORT: SortOption = 'followUp';

const getMotivationLine = (count: number) => {
  if (count === 0) return 'Heute ist ein guter Tag für den ersten Eintrag.';
  if (count < 4) return 'Du bist im Flow. Ein zusätzlicher Eintrag verstärkt den Effekt.';
  return 'Starker Fortschritt. Halte die Dynamik mit Follow-ups hoch.';
};

const scrollToRef = (ref: RefObject<HTMLElement | HTMLDivElement | null>) => {
  ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const App = () => {
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

  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const overviewSectionRef = useRef<HTMLElement>(null);
  const listSectionRef = useRef<HTMLElement>(null);
  const plannerSectionRef = useRef<HTMLElement>(null);
  const filterStatusRef = useRef<HTMLSelectElement>(null);
  const pendingDeleteRef = useRef<{ id: string; timeoutId: number } | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorWithStandalone).standalone;
      setIsInstalled(Boolean(standalone));
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
      if (!withModifier || event.defaultPrevented) return;

      const key = event.key.toLowerCase();
      if (key === 'k') {
        event.preventDefault();
        if (window.innerWidth < 768) {
          scrollToRef(listSectionRef);
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
      sort: DEFAULT_SORT
    });

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: MobileFilterChipKey; label: string }> = [];
    const trimmedSearch = filters.search.trim();
    if (trimmedSearch) chips.push({ key: 'search', label: `Suche: ${trimmedSearch}` });
    if (filters.status !== 'Alle') chips.push({ key: 'status', label: `Status: ${filters.status}` });
    if (filters.range !== 'all') {
      const rangeLabel = RANGE_OPTIONS.find((option) => option.value === filters.range)?.label ?? filters.range;
      chips.push({ key: 'range', label: `Zeitraum: ${rangeLabel}` });
    }
    if (filters.sort !== DEFAULT_SORT) {
      const sortLabel = SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ?? filters.sort;
      chips.push({ key: 'sort', label: `Sortierung: ${sortLabel}` });
    }
    return chips;
  }, [filters]);

  const filteredApplications = useMemo(() => {
    const filtered = filterApplications(applications, {
      status: filters.status,
      range: filters.range,
      search: filters.search
    });
    return sortApplications(filtered, filters.sort);
  }, [applications, filters]);

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

  const taskCounts = useMemo(() => {
    return Object.entries(tasksByApplication).reduce<Record<string, number>>((acc, [applicationId, list]) => {
      acc[applicationId] = list.length;
      return acc;
    }, {});
  }, [tasksByApplication]);

  const activeTaskCount = tasks.filter((task) => !task.done).length;
  const hasAnyFilterSignals = hasActiveFilters || filters.sort !== DEFAULT_SORT;

  const isStandaloneMode = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((window.navigator as NavigatorWithStandalone).standalone);

  const handleLibraryPrint = useReactToPrint({
    contentRef: printRef
  });

  const handlePrint = () => {
    if (isStandaloneMode()) {
      window.print();
      return;
    }
    handleLibraryPrint?.();
  };

  const handleDashboardStatusSelect = (status: ApplicationStatus | 'Alle') => {
    updateFilters({ status });
    scrollToRef(listSectionRef);
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
    updateFilters({ sort: DEFAULT_SORT });
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
      return;
    }
    alert('Installation: Im Browsermenü „App installieren“ auswählen (oder auf iOS: Teilen → „Zum Home-Bildschirm“).');
  };

  const handleCreate = (values: ApplicationFormValues) => {
    addApplication(values);
    setIsCreateSheetOpen(false);
    showToast({
      title: 'Gespeichert',
      description: 'Neue Bewerbung wurde hinzugefügt.',
      variant: 'success'
    });
  };

  const handleUpdate = (id: string, values: ApplicationFormValues) => {
    updateApplication(id, values);
    showToast({
      title: 'Gespeichert',
      description: 'Änderungen wurden übernommen.',
      variant: 'success'
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Diese Bewerbung wirklich löschen?')) return;

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

  const handleReset = async () => {
    const first = window.confirm(
      'Daten wirklich löschen?\n\nAlle Bewerbungen, Aufgaben, Statusverläufe und Einstellungen werden unwiderruflich gelöscht.'
    );
    if (!first) return;

    const second = window.confirm(
      'Bist du sicher?\n\nAlle Verläufe sind danach vollständig gelöscht. Wenn du deine Daten noch nicht gesichert hast, klicke zuerst oben auf „Sichern“.'
    );
    if (!second) return;

    const third = window.confirm('Letzte Bestätigung:\n\nAlle lokalen Daten werden jetzt endgültig gelöscht. Fortfahren?');
    if (!third) return;

    await resetAll();
    showToast({
      title: 'Daten gelöscht',
      description: 'Die App wurde auf den Ausgangszustand zurückgesetzt.',
      variant: 'info'
    });
  };

  if (!isHydrated) {
    return <Skeleton />;
  }

  const renderQuickActions = (placement: 'sidebar' | 'sheet' = 'sheet') => {
    const buttonClass = placement === 'sidebar' ? 'w-full justify-start !px-3 text-left' : 'w-full justify-start';
    const secondaryGridClass = placement === 'sidebar' ? 'grid gap-2' : 'grid grid-cols-2 gap-2';

    return (
    <div className="grid gap-2">
      <Button type="button" onClick={() => setIsCreateSheetOpen(true)} variant="primary" className={buttonClass}>
        <Icon name="plus" />
        Neue Bewerbung
      </Button>
      <div className={secondaryGridClass}>
        <Button type="button" onClick={handlePrint} variant="secondary" className={buttonClass}>
          <Icon name="print" />
          PDF / Drucken
        </Button>
        <Button
          type="button"
          onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
          variant="secondary"
          className={buttonClass}
        >
          <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          {settings.theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
        </Button>
        <Button type="button" onClick={handleBackup} variant="secondary" className={buttonClass}>
          <Icon name="download" />
          Sichern
        </Button>
        <Button type="button" onClick={() => fileInputRef.current?.click()} variant="secondary" className={buttonClass}>
          <Icon name="upload" />
          Wiederherstellen
        </Button>
      </div>
      {!isInstalled && (
        <Button type="button" onClick={handleInstall} variant="ghost" className={buttonClass}>
          <Icon name="download" />
          App installieren
        </Button>
      )}
      <Button type="button" onClick={handleReset} variant="destructive" className={buttonClass}>
        <Icon name="trash" />
        Alles löschen
      </Button>
    </div>
    );
  };

  return (
    <div className="app-shell min-h-screen px-3 pb-[calc(6.8rem+env(safe-area-inset-bottom))] pt-3 text-text sm:px-5 sm:pt-5 lg:px-4 lg:pb-5">
      <div className="print-hidden mx-auto grid max-w-[1580px] gap-4 lg:grid-cols-[232px_minmax(0,1fr)_310px] xl:grid-cols-[248px_minmax(0,1fr)_336px]">
        <aside className="dashboard-sidebar hidden min-h-[calc(100dvh-2rem)] rounded-lg border border-border bg-surface p-3 shadow-shell lg:sticky lg:top-4 lg:flex lg:flex-col lg:self-start">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary-soft text-primary">
              <Icon name="target" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-text">Job Tracker</p>
              <p className="text-xs font-semibold text-primary">Momentum</p>
            </div>
          </div>

          <nav className="mt-6 grid gap-1" aria-label="Desktop Navigation">
            <SidebarButton icon="home" label="Übersicht" onClick={() => scrollToRef(overviewSectionRef)} active />
            <SidebarButton icon="briefcase" label="Bewerbungen" onClick={() => scrollToRef(listSectionRef)} />
            <SidebarButton icon="calendar" label="Planer" onClick={() => scrollToRef(plannerSectionRef)} />
            <SidebarButton icon="bell" label="Follow-ups" onClick={() => scrollToRef(listSectionRef)} />
            <SidebarButton icon="chart" label="Statistiken" onClick={() => scrollToRef(overviewSectionRef)} />
          </nav>

          <div className="mt-auto space-y-4 pt-6">
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-muted">Schnellaktionen</p>
                <Icon name="plus" className="text-primary" />
              </div>
              {renderQuickActions('sidebar')}
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-xs font-semibold uppercase text-muted">Pipeline</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <SidebarStat label="Gesamt" value={stats.total} />
                <SidebarStat label="Aktiv" value={activeTaskCount} />
                <SidebarStat label="Heute" value={stats.followUpsDue.length} />
              </div>
            </div>
          </div>
        </aside>

        <main ref={overviewSectionRef} className="min-w-0 space-y-5">
          <header className="topbar sticky top-2 z-30 rounded-lg border border-border bg-surface px-3 py-3 shadow-soft backdrop-blur-xl lg:static">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-ghost btn-icon lg:hidden"
                aria-label="Mehr öffnen"
                onClick={() => setIsMoreSheetOpen(true)}
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0 flex-1 lg:hidden">
                <p className="truncate text-sm font-extrabold text-text">Job Tracker</p>
                <p className="text-xs text-muted">{getMotivationLine(stats.thisWeek)}</p>
              </div>

              <label className="relative hidden min-w-0 flex-1 lg:block">
                <span className="sr-only">Suche</span>
                <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  ref={desktopSearchInputRef}
                  type="search"
                  inputMode="search"
                  autoCapitalize="none"
                  value={filters.search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                  placeholder="Suche..."
                  className="pl-9"
                />
              </label>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="!min-h-[44px] !w-11"
                aria-label="Filter öffnen"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <Icon name="filter" />
              </Button>
              <Button
                type="button"
                variant="primary"
                size="icon"
                className="hidden !min-h-[44px] !w-11 lg:inline-flex"
                aria-label="Neue Bewerbung"
                onClick={() => setIsCreateSheetOpen(true)}
              >
                <Icon name="plus" />
              </Button>
            </div>
          </header>

          <Dashboard
            stats={stats}
            weeklyGoal={settings.weeklyGoal}
            onWeeklyGoalChange={setWeeklyGoal}
            activeStatus={filters.status}
            onStatusSelect={handleDashboardStatusSelect}
          />

          <section ref={listSectionRef} className="scroll-mt-24 space-y-3">
            <div className="rounded-lg border border-border bg-surface p-3 shadow-soft">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                <label className="field-label lg:hidden">
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

                <label className="field-label hidden lg:flex">
                  Suche
                  <Input
                    type="search"
                    inputMode="search"
                    autoCapitalize="none"
                    value={filters.search}
                    onChange={(event) => updateFilters({ search: event.target.value })}
                    placeholder="Unternehmen oder Position"
                  />
                </label>

                <label className="field-label">
                  Sortierung
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

                <div className="flex items-end gap-2">
                  <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={() => setIsFilterSheetOpen(true)}>
                    <Icon name="filter" />
                    Filter
                  </Button>
                  {hasAnyFilterSignals && (
                    <Button type="button" variant="ghost" className="w-full md:w-auto" onClick={clearFilters}>
                      Zurücksetzen
                    </Button>
                  )}
                </div>
              </div>

              {activeFilterChips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className="chip !normal-case !tracking-normal !text-xs !text-text"
                      onClick={() => handleChipRemove(chip.key)}
                      aria-label={`Filter entfernen: ${chip.label}`}
                    >
                      <span>{chip.label}</span>
                      <span aria-hidden="true">x</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Bewerbungen</h2>
                <p className="text-sm text-muted">
                  {filteredApplications.length} sichtbar, {applications.length} gesamt
                </p>
              </div>
              <Badge>{filters.sort === 'followUp' ? 'Nächste Aktion zuerst' : 'Sortiert'}</Badge>
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

          <section ref={plannerSectionRef} className="scroll-mt-24">
            <Planner
              tasks={tasks}
              applications={applications}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          </section>
        </main>

        <div className="hidden min-w-0 lg:block">
          <div className="sticky top-4">
            <InsightsPanel
              stats={stats}
              weeklyGoal={settings.weeklyGoal}
              tasks={tasks}
              applications={applications}
              onWeeklyGoalChange={setWeeklyGoal}
            />
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestore} />

      <BottomSheet open={isCreateSheetOpen} onClose={() => setIsCreateSheetOpen(false)} title="Neue Bewerbung">
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

      <BottomSheet open={isMoreSheetOpen} onClose={() => setIsMoreSheetOpen(false)} title="Mehr">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={() => scrollToRef(overviewSectionRef)}>
              <Icon name="home" />
              Übersicht
            </Button>
            <Button type="button" variant="secondary" onClick={() => scrollToRef(listSectionRef)}>
              <Icon name="briefcase" />
              Bewerbungen
            </Button>
            <Button type="button" variant="secondary" onClick={() => scrollToRef(plannerSectionRef)}>
              <Icon name="calendar" />
              Planer
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsFilterSheetOpen(true)}>
              <Icon name="filter" />
              Filter
            </Button>
          </div>
          {renderQuickActions()}
        </div>
      </BottomSheet>

      <footer className="print-hidden mx-auto mt-8 max-w-[1580px] border-t border-border pt-4 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Lizenz: MIT</span>
          <a
            href="https://github.com/Web-Developer-DB/Job-Tracker"
            className="font-semibold text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            GitHub-Repository
          </a>
        </div>
      </footer>

      <MobileActionBar
        onOverview={() => scrollToRef(overviewSectionRef)}
        onApplications={() => scrollToRef(listSectionRef)}
        onCreate={() => setIsCreateSheetOpen(true)}
        onPlanner={() => scrollToRef(plannerSectionRef)}
        onMore={() => setIsMoreSheetOpen(true)}
        hasActiveFilters={hasAnyFilterSignals}
      />

      <div ref={printRef} className="print-only">
        <PrintView applications={filteredApplications} filters={filters} />
      </div>
    </div>
  );
};

const SidebarButton = ({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: 'bell' | 'briefcase' | 'calendar' | 'chart' | 'home';
  label: string;
  onClick: () => void;
  active?: boolean;
}) => (
  <button
    type="button"
    className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
      active ? 'bg-primary-soft text-text shadow-soft' : 'text-muted hover:bg-surface-2 hover:text-text'
    }`}
    onClick={onClick}
  >
    <Icon name={icon} />
    <span>{label}</span>
  </button>
);

const SidebarStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-surface px-2 py-2">
    <p className="mono text-base font-semibold text-text">{value}</p>
    <p className="text-[0.68rem] text-muted">{label}</p>
  </div>
);

export default App;
