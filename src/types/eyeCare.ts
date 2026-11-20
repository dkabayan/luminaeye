export type NavSection =
  | 'overview'
  | 'bluelight'
  | 'brightness'
  | 'timer'
  | 'focus'
  | 'stats';

export type FilterModeId =
  | 'office'
  | 'night'
  | 'game'
  | 'movie'
  | 'reading'
  | 'custom';

export interface FilterPreset {
  id: FilterModeId;
  name: string;
  subtitle: string;
  kelvin: number;
  brightness: number;
  blueReductionPct: number;
  description: string;
}

export interface AutoScheduleConfig {
  enabled: boolean;
  dayStartHour: number; // e.g., 7 (07:00)
  nightStartHour: number; // e.g., 19 (19:00)
  dayKelvin: number;
  nightKelvin: number;
  dayBrightness: number;
  nightBrightness: number;
  simulatedHour: number | null; // null = use real system clock
}

export interface DisplayMonitor {
  id: string;
  name: string;
  model: string;
  resolution: string;
  orientation: 'landscape' | 'portrait';
  isPrimary: boolean;
  connected: boolean;
  brightness: number; // 10 - 100
  kelvin: number; // 1900 - 6500
  useDdcCi: boolean;
}

export interface BreakTimerConfig {
  enabled: boolean;
  workMinutes: number; // default 20
  breakSeconds: number; // default 20
  strictMode: boolean; // if true, hides quick skip for first 5s
  soundEnabled: boolean;
  ruleLabel: string; // e.g., "Aturan 20-20-20"
}

export interface BreakSessionLog {
  id: string;
  timestamp: string;
  durationSeconds: number;
  status: 'completed' | 'skipped';
  note: string;
}

export type FocusModeType = 'reading-line' | 'window-spotlight' | 'magicx-blur';

export interface FocusMagicXConfig {
  enabledOnApp: boolean;
  mode: FocusModeType;
  dimOpacity: number; // 20 - 85 (%)
  blurAmount: number; // 0 - 12 (px)
  bandHeight: number; // 80 - 280 (px)
  spotlightRadius: number; // 140 - 340 (px)
  accentBorder: boolean;
}

export interface DailyEyeStat {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "13 Nov"
  dayShort: string; // e.g., "Sen"
  totalMinutes: number;
  protectedMinutes: number;
  avgKelvin: number;
  avgBrightness: number;
  breaksCompleted: number;
  breaksTarget: number;
  dominantMode: FilterModeId;
  strainRisk: 'Rendah' | 'Sedang' | 'Tinggi';
}

export interface AppSettingsState {
  masterEnabled: boolean;
  applyLiveOverlay: boolean;
  activeMode: FilterModeId;
  kelvin: number;
  brightness: number;
  schedule: AutoScheduleConfig;
  monitors: DisplayMonitor[];
  syncMonitors: boolean;
  breakConfig: BreakTimerConfig;
  focusConfig: FocusMagicXConfig;
  breakLogs: BreakSessionLog[];
  dailyStats: DailyEyeStat[];
  closeToTray: boolean;
  launchOnStartup: boolean;
}
