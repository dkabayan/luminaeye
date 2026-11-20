import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import {
  LayoutGrid,
  Monitor,
  Sun,
  Coffee,
  Crosshair,
  BarChart3,
  Power,
  Menu,
  X,
} from 'lucide-react';
import {
  AppSettingsState,
  AutoScheduleConfig,
  BreakTimerConfig,
  DisplayMonitor,
  FilterModeId,
  FocusMagicXConfig,
  NavSection,
} from './types/eyeCare';
import { DEFAULT_APP_STATE, FILTER_PRESETS } from './data/defaults';
import { computeCircadianValues, playGentleChime } from './utils/colorMath';
import { ViewportOverlay } from './components/ViewportOverlay';
import { OverviewPage } from './components/OverviewPage';
import { BlueLightPage } from './components/BlueLightPage';
import { BrightnessPage } from './components/BrightnessPage';
import { BreakTimerPage } from './components/BreakTimerPage';
import { FocusMagicXPage } from './components/FocusMagicXPage';
import { StatsDashboardPage } from './components/StatsDashboardPage';

const STORAGE_KEY = 'luminaeye_state_v1';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  breadcrumb: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Ringkasan', breadcrumb: 'Ringkasan', icon: LayoutGrid },
  { id: 'bluelight', label: 'Blue Light Filter', breadcrumb: 'Blue Light Filter', icon: Monitor },
  { id: 'brightness', label: 'Kecerahan & Monitor', breadcrumb: 'Kecerahan & Monitor', icon: Sun },
  { id: 'timer', label: 'Break Timer', breadcrumb: 'Break Timer 20-20-20', icon: Coffee },
  { id: 'focus', label: 'Focus & MagicX', breadcrumb: 'Focus & MagicX', icon: Crosshair },
  { id: 'stats', label: 'Statistik Mata', breadcrumb: 'Statistik Kesehatan Mata', icon: BarChart3 },
];

function loadInitialState(): AppSettingsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    const parsed = JSON.parse(raw) as Partial<AppSettingsState>;
    return {
      ...DEFAULT_APP_STATE,
      ...parsed,
      schedule: { ...DEFAULT_APP_STATE.schedule, ...(parsed.schedule ?? {}) },
      breakConfig: { ...DEFAULT_APP_STATE.breakConfig, ...(parsed.breakConfig ?? {}) },
      focusConfig: {
        ...DEFAULT_APP_STATE.focusConfig,
        ...(parsed.focusConfig ?? {}),
        enabledOnApp: false, // Always start cleanly without full-screen dim mask
      },
      monitors:
        Array.isArray(parsed.monitors) && parsed.monitors.length > 0
          ? parsed.monitors
          : DEFAULT_APP_STATE.monitors,
      breakLogs: Array.isArray(parsed.breakLogs) ? parsed.breakLogs : DEFAULT_APP_STATE.breakLogs,
      dailyStats:
        Array.isArray(parsed.dailyStats) && parsed.dailyStats.length > 0
          ? parsed.dailyStats
          : DEFAULT_APP_STATE.dailyStats,
    };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export default function App() {
  const [state, setState] = useState<AppSettingsState>(loadInitialState);
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Break timer runtime state
  const [secondsUntilBreak, setSecondsUntilBreak] = useState<number>(
    () => state.breakConfig.workMinutes * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(state.breakConfig.enabled);
  const [isBreakActive, setIsBreakActive] = useState<boolean>(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState<number>(state.breakConfig.breakSeconds);

  // Live session tracking & system clock
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(0);
  const [systemHour, setSystemHour] = useState<number>(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [state]);

  // Update real system clock once per minute
  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      const now = new Date();
      setSystemHour(now.getHours() + now.getMinutes() / 60);
    }, 60_000);
    return () => window.clearInterval(clockInterval);
  }, []);

  const currentHour = state.schedule.simulatedHour ?? systemHour;

  // Compute effective Kelvin & Brightness (respecting Circadian schedule if enabled)
  const { effectiveKelvin, effectiveBrightness } = useMemo(() => {
    if (state.schedule.enabled) {
      const circadian = computeCircadianValues(
        currentHour,
        state.schedule.dayStartHour,
        state.schedule.nightStartHour,
        state.schedule.dayKelvin,
        state.schedule.nightKelvin,
        state.schedule.dayBrightness,
        state.schedule.nightBrightness
      );
      return {
        effectiveKelvin: circadian.kelvin,
        effectiveBrightness: circadian.brightness,
      };
    }
    const primary = state.monitors.find((m) => m.isPrimary) ?? state.monitors[0];
    return {
      effectiveKelvin: state.kelvin,
      effectiveBrightness: primary ? primary.brightness : state.brightness,
    };
  }, [state.schedule, state.kelvin, state.brightness, state.monitors, currentHour]);

  // Sync hardware gamma directly to physical monitor(s) via Rust Tauri backend
  useEffect(() => {
    if (typeof window !== 'undefined' && isTauri()) {
      invoke('set_monitor_filter', {
        kelvin: Math.round(effectiveKelvin),
        brightness: effectiveBrightness,
        enabled: state.masterEnabled && state.applyLiveOverlay,
      }).catch((err) => {
        console.error('Failed to set monitor filter:', err);
      });
    }
  }, [effectiveKelvin, effectiveBrightness, state.masterEnabled, state.applyLiveOverlay]);

  // Restore monitor gamma when application closes
  useEffect(() => {
    const handleUnload = () => {
      if (typeof window !== 'undefined' && isTauri()) {
        invoke('reset_monitor_filter').catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  // Expand to full physical monitor when Cat Gatekeeper break timer triggers
  useEffect(() => {
    if (typeof window !== 'undefined' && isTauri()) {
      invoke('set_break_fullscreen', { active: isBreakActive }).catch((err) => {
        console.error('Failed to set break fullscreen:', err);
      });
    }
  }, [isBreakActive]);

  // Initialize desktop closeToTray and launchOnStartup from state
  useEffect(() => {
    if (typeof window !== 'undefined' && isTauri()) {
      invoke('set_close_to_tray', { enabled: state.closeToTray ?? true }).catch(() => {});
      invoke('get_launch_on_startup')
        .then((actual) => {
          if (typeof actual === 'boolean') {
            setState((prev) => ({ ...prev, launchOnStartup: actual }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleToggleCloseToTray = useCallback(() => {
    setState((prev) => {
      const next = !(prev.closeToTray ?? true);
      if (typeof window !== 'undefined' && isTauri()) {
        invoke('set_close_to_tray', { enabled: next }).catch(() => {});
      }
      return { ...prev, closeToTray: next };
    });
  }, []);

  const handleToggleLaunchOnStartup = useCallback(() => {
    setState((prev) => {
      const next = !prev.launchOnStartup;
      if (typeof window !== 'undefined' && isTauri()) {
        invoke('set_launch_on_startup', { enabled: next }).catch((err) => {
          console.error('Failed to set autostart:', err);
        });
      }
      return { ...prev, launchOnStartup: next };
    });
  }, []);

  const recordBreakLog = useCallback(
    (status: 'completed' | 'skipped', durationSeconds: number, note: string) => {
      const now = new Date();
      const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      setState((prev) => {
        const updatedStats = [...prev.dailyStats];
        const lastIdx = updatedStats.length - 1;
        if (lastIdx >= 0 && status === 'completed') {
          updatedStats[lastIdx] = {
            ...updatedStats[lastIdx],
            breaksCompleted: updatedStats[lastIdx].breaksCompleted + 1,
          };
        }
        return {
          ...prev,
          dailyStats: updatedStats,
          breakLogs: [
            {
              id: `brk-${Date.now()}`,
              timestamp,
              durationSeconds,
              status,
              note,
            },
            ...prev.breakLogs,
          ].slice(0, 20),
        };
      });
    },
    []
  );

  const handleCompleteBreak = useCallback(() => {
    setIsBreakActive(false);
    setSecondsUntilBreak(state.breakConfig.workMinutes * 60);
    if (state.breakConfig.soundEnabled) {
      playGentleChime('end');
    }
    recordBreakLog(
      'completed',
      state.breakConfig.breakSeconds,
      'Fokus pandang jarak jauh (6 meter)'
    );
  }, [state.breakConfig.workMinutes, state.breakConfig.breakSeconds, state.breakConfig.soundEnabled, recordBreakLog]);

  const handleSkipBreak = useCallback(() => {
    setIsBreakActive(false);
    setSecondsUntilBreak(5 * 60); // Snooze 5 minutes
    recordBreakLog('skipped', state.breakConfig.breakSeconds, 'Ditunda 5 menit oleh pengguna');
  }, [state.breakConfig.breakSeconds, recordBreakLog]);

  const handleTriggerBreakNow = useCallback(() => {
    setBreakSecondsLeft(state.breakConfig.breakSeconds);
    setIsBreakActive(true);
    if (state.breakConfig.soundEnabled) {
      playGentleChime('start');
    }
  }, [state.breakConfig.breakSeconds, state.breakConfig.soundEnabled]);

  // 1-second master tick: live session counter + break timer + active break countdown
  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveSessionSeconds((prev) => {
        const next = prev + 1;
        if (next % 60 === 0) {
          setState((curr) => {
            const updated = [...curr.dailyStats];
            const last = updated.length - 1;
            if (last >= 0) {
              updated[last] = {
                ...updated[last],
                totalMinutes: updated[last].totalMinutes + 1,
                protectedMinutes:
                  updated[last].protectedMinutes + (curr.masterEnabled ? 1 : 0),
              };
            }
            return { ...curr, dailyStats: updated };
          });
        }
        return next;
      });

      if (isBreakActive) {
        setBreakSecondsLeft((prev) => {
          if (prev <= 1) {
            handleCompleteBreak();
            return 0;
          }
          return prev - 1;
        });
      } else if (isTimerRunning && state.breakConfig.enabled) {
        setSecondsUntilBreak((prev) => {
          if (prev <= 1) {
            setBreakSecondsLeft(state.breakConfig.breakSeconds);
            setIsBreakActive(true);
            if (state.breakConfig.soundEnabled) {
              playGentleChime('start');
            }
            return state.breakConfig.workMinutes * 60;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [
    isBreakActive,
    isTimerRunning,
    state.breakConfig.enabled,
    state.breakConfig.breakSeconds,
    state.breakConfig.workMinutes,
    state.breakConfig.soundEnabled,
    handleCompleteBreak,
  ]);

  // Handlers
  const handleSelectMode = useCallback((modeId: FilterModeId) => {
    const preset = FILTER_PRESETS.find((p) => p.id === modeId);
    if (!preset) return;
    setState((prev) => ({
      ...prev,
      masterEnabled: true,
      activeMode: modeId,
      kelvin: modeId === 'custom' ? prev.kelvin : preset.kelvin,
      brightness: modeId === 'custom' ? prev.brightness : preset.brightness,
      schedule: { ...prev.schedule, enabled: false },
      monitors:
        modeId === 'custom'
          ? prev.monitors
          : prev.monitors.map((m) =>
              prev.syncMonitors || m.isPrimary
                ? { ...m, kelvin: preset.kelvin, brightness: preset.brightness }
                : m
            ),
    }));
  }, []);

  const handleUpdateKelvin = useCallback((newKelvin: number) => {
    setState((prev) => ({
      ...prev,
      activeMode: 'custom',
      kelvin: newKelvin,
      schedule: { ...prev.schedule, enabled: false },
      monitors: prev.monitors.map((m) =>
        prev.syncMonitors || m.isPrimary ? { ...m, kelvin: newKelvin } : m
      ),
    }));
  }, []);

  const handleUpdateBrightness = useCallback((newBrightness: number) => {
    const clamped = Math.max(10, Math.min(100, newBrightness));
    setState((prev) => ({
      ...prev,
      brightness: clamped,
      monitors: prev.monitors.map((m) =>
        prev.syncMonitors || m.isPrimary ? { ...m, brightness: clamped } : m
      ),
    }));
  }, []);

  const handleUpdateSchedule = useCallback((patch: Partial<AutoScheduleConfig>) => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...patch },
    }));
  }, []);

  const handleUpdateMonitor = useCallback((id: string, patch: Partial<DisplayMonitor>) => {
    setState((prev) => {
      const updated = prev.monitors.map((m) => (m.id === id ? { ...m, ...patch } : m));
      const primary = updated.find((m) => m.isPrimary) ?? updated[0];
      return {
        ...prev,
        monitors: updated,
        brightness: primary ? primary.brightness : prev.brightness,
        kelvin: primary ? primary.kelvin : prev.kelvin,
      };
    });
  }, []);

  const handleUpdateAllMonitors = useCallback(
    (patch: { brightness?: number; kelvin?: number }) => {
      setState((prev) => ({
        ...prev,
        brightness: patch.brightness ?? prev.brightness,
        kelvin: patch.kelvin ?? prev.kelvin,
        activeMode: patch.kelvin !== undefined ? 'custom' : prev.activeMode,
        monitors: prev.monitors.map((m) => ({
          ...m,
          ...(patch.brightness !== undefined ? { brightness: patch.brightness } : {}),
          ...(patch.kelvin !== undefined ? { kelvin: patch.kelvin } : {}),
        })),
      }));
    },
    []
  );

  const handleAddMonitor = useCallback(() => {
    setState((prev) => {
      const nextNum = prev.monitors.length + 1;
      const newMonitor: DisplayMonitor = {
        id: `disp-${Date.now()}`,
        name: `Display ${nextNum} (Tambahan)`,
        model: 'BenQ GW2480 Eye-Care',
        resolution: '1920 × 1080 · 60Hz',
        orientation: 'landscape',
        isPrimary: false,
        connected: true,
        brightness: prev.brightness,
        kelvin: prev.kelvin,
        useDdcCi: true,
      };
      return { ...prev, monitors: [...prev.monitors, newMonitor] };
    });
  }, []);

  const handleRemoveMonitor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      monitors: prev.monitors.filter((m) => m.id !== id),
    }));
  }, []);

  const handleUpdateBreakConfig = useCallback((patch: Partial<BreakTimerConfig>) => {
    setState((prev) => {
      const nextConfig = { ...prev.breakConfig, ...patch };
      return { ...prev, breakConfig: nextConfig };
    });
    if (patch.workMinutes !== undefined) {
      setSecondsUntilBreak(patch.workMinutes * 60);
    }
    if (patch.breakSeconds !== undefined) {
      setBreakSecondsLeft(patch.breakSeconds);
    }
  }, []);

  const handleUpdateFocusConfig = useCallback((patch: Partial<FocusMagicXConfig>) => {
    setState((prev) => ({
      ...prev,
      focusConfig: { ...prev.focusConfig, ...patch },
    }));
  }, []);

  // Global keyboard shortcuts (Alt+P pause/resume, Alt+Up/Down brightness, Alt+M cycle mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'p') {
        e.preventDefault();
        setState((prev) => ({ ...prev, masterEnabled: !prev.masterEnabled }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleUpdateBrightness(effectiveBrightness + 5);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleUpdateBrightness(effectiveBrightness - 5);
      } else if (key === 'm') {
        e.preventDefault();
        const cycle: FilterModeId[] = ['office', 'reading', 'night', 'movie', 'game'];
        const nextIdx = (cycle.indexOf(state.activeMode) + 1) % cycle.length;
        handleSelectMode(cycle[nextIdx]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [effectiveBrightness, state.activeMode, handleUpdateBrightness, handleSelectMode]);

  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0];
  const sidebarMins = Math.floor(secondsUntilBreak / 60);
  const sidebarSecs = secondsUntilBreak % 60;

  return (
    <div className={`min-h-screen text-slate-900 ${isBreakActive ? 'bg-transparent overflow-hidden' : 'bg-[#F7F9FB]'}`}>
      {/* Live Optical Filter, Screen Dimmer, Focus/MagicX & Break Overlay */}
      <ViewportOverlay
        masterEnabled={state.masterEnabled}
        applyLiveOverlay={state.applyLiveOverlay}
        effectiveKelvin={effectiveKelvin}
        effectiveBrightness={effectiveBrightness}
        focusConfig={state.focusConfig}
        onDisableFullAppFocus={() => handleUpdateFocusConfig({ enabledOnApp: false })}
        isBreakActive={isBreakActive}
        breakSecondsLeft={breakSecondsLeft}
        breakTotalSeconds={state.breakConfig.breakSeconds}
        strictMode={state.breakConfig.strictMode}
        onCompleteBreak={handleCompleteBreak}
        onSkipBreak={handleSkipBreak}
      />

      <div className={`flex min-h-screen ${isBreakActive ? 'hidden' : ''}`}>
        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
          />
        )}

        {/* Fixed Desktop Sidebar / Mobile Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand Zone (Single clean element) */}
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
            <button
              type="button"
              onClick={() => {
                setActiveNav('overview');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
            >
              <svg
                viewBox="0 0 28 28"
                className="h-7 w-7 text-sky-600 shrink-0"
                fill="none"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="24" height="24" rx="7" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M6.5 14C8.3 10.6 11 9 14 9C17 9 19.7 10.6 21.5 14C19.7 17.4 17 19 14 19C11 19 8.3 17.4 6.5 14Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <circle cx="14" cy="14" r="2.5" fill="currentColor" />
              </svg>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                LuminaEye
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup menu navigasi"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Menu Utama" className="flex-1 space-y-1 px-3 py-5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quiet Optical Summary Footer */}
          <div className="border-t border-slate-200 px-5 py-4 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Status Filter</span>
              <span className={`font-medium ${state.masterEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                {state.masterEnabled ? 'Aktif' : 'Dijeda'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-slate-500">
              <span>Optik Aktif</span>
              <span className="font-mono tabular-nums text-slate-800">
                {effectiveKelvin}K · {effectiveBrightness}%
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-slate-500">
              <span>Istirahat Berikutnya</span>
              <span className="font-mono tabular-nums text-slate-800">
                {String(sidebarMins).padStart(2, '0')}:{String(sidebarSecs).padStart(2, '0')}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Bar (Strict SaaS Top Bar Contract: Breadcrumb Left — Primary Action Right) */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-8 border-b border-slate-200 bg-white/95 px-6 backdrop-blur-xs">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-slate-400 hidden sm:inline">LuminaEye</span>
                <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                  /
                </span>
                <span className="font-medium text-slate-900 truncate">
                  {activeNavMeta.breadcrumb}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, masterEnabled: !prev.masterEnabled }))}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  state.masterEnabled
                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                {state.masterEnabled ? 'Perlindungan Aktif' : 'Aktifkan Perlindungan'}
              </button>
            </div>
          </header>

          {/* Main Scrollable Content Viewport */}
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
            {activeNav === 'overview' && (
              <OverviewPage
                state={state}
                effectiveKelvin={effectiveKelvin}
                effectiveBrightness={effectiveBrightness}
                nextBreakSeconds={secondsUntilBreak}
                onNavigate={setActiveNav}
                onSelectMode={handleSelectMode}
                onUpdateKelvin={handleUpdateKelvin}
                onUpdateBrightness={handleUpdateBrightness}
                onToggleLiveOverlay={() =>
                  setState((prev) => ({ ...prev, applyLiveOverlay: !prev.applyLiveOverlay }))
                }
                onTriggerBreakNow={handleTriggerBreakNow}
                onToggleCloseToTray={handleToggleCloseToTray}
                onToggleLaunchOnStartup={handleToggleLaunchOnStartup}
              />
            )}

            {activeNav === 'bluelight' && (
              <BlueLightPage
                masterEnabled={state.masterEnabled}
                applyLiveOverlay={state.applyLiveOverlay}
                activeMode={state.activeMode}
                kelvin={state.kelvin}
                brightness={state.brightness}
                schedule={state.schedule}
                effectiveKelvin={effectiveKelvin}
                currentHour={currentHour}
                onSelectMode={handleSelectMode}
                onUpdateKelvin={handleUpdateKelvin}
                onUpdateSchedule={handleUpdateSchedule}
                onToggleLiveOverlay={() =>
                  setState((prev) => ({ ...prev, applyLiveOverlay: !prev.applyLiveOverlay }))
                }
              />
            )}

            {activeNav === 'brightness' && (
              <BrightnessPage
                monitors={state.monitors}
                syncMonitors={state.syncMonitors}
                onToggleSync={() =>
                  setState((prev) => ({ ...prev, syncMonitors: !prev.syncMonitors }))
                }
                onUpdateMonitor={handleUpdateMonitor}
                onUpdateAllMonitors={handleUpdateAllMonitors}
                onAddMonitor={handleAddMonitor}
                onRemoveMonitor={handleRemoveMonitor}
              />
            )}

            {activeNav === 'timer' && (
              <BreakTimerPage
                config={state.breakConfig}
                secondsRemaining={secondsUntilBreak}
                isRunning={isTimerRunning}
                breakLogs={state.breakLogs}
                onUpdateConfig={handleUpdateBreakConfig}
                onToggleRunning={() => {
                  setIsTimerRunning((running) => {
                    const next = !running;
                    setState((prev) => ({
                      ...prev,
                      breakConfig: { ...prev.breakConfig, enabled: next },
                    }));
                    return next;
                  });
                }}
                onResetTimer={() => setSecondsUntilBreak(state.breakConfig.workMinutes * 60)}
                onTriggerBreakNow={handleTriggerBreakNow}
                onLogManualBreak={() =>
                  recordBreakLog(
                    'completed',
                    state.breakConfig.breakSeconds,
                    'Istirahat manual dicatat pengguna'
                  )
                }
              />
            )}

            {activeNav === 'focus' && (
              <FocusMagicXPage
                config={state.focusConfig}
                onUpdateConfig={handleUpdateFocusConfig}
              />
            )}

            {activeNav === 'stats' && (
              <StatsDashboardPage
                dailyStats={state.dailyStats}
                liveSessionSeconds={liveSessionSeconds}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
