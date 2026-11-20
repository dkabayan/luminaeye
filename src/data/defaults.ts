import { AppSettingsState, DailyEyeStat, FilterPreset } from '../types/eyeCare';

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'office',
    name: 'Office',
    subtitle: 'Produktivitas harian',
    kelvin: 4500,
    brightness: 82,
    blueReductionPct: 36,
    description: 'Menyeimbangkan kejernihan teks dokumen dan pengurangan cahaya biru untuk kerja 8 jam.',
  },
  {
    id: 'night',
    name: 'Night',
    subtitle: 'Perlindungan tidur malam',
    kelvin: 2700,
    brightness: 55,
    blueReductionPct: 66,
    description: 'Suhu warna amber hangat untuk menjaga produksi melatonin saat bekerja di malam hari.',
  },
  {
    id: 'reading',
    name: 'Reading',
    subtitle: 'Kontras kertas lembut',
    kelvin: 3600,
    brightness: 74,
    blueReductionPct: 51,
    description: 'Menyerupai refleksi kertas cetak agar mata tidak perih saat membaca artikel atau buku digital.',
  },
  {
    id: 'movie',
    name: 'Movie',
    subtitle: 'Akurasi warna sinematik',
    kelvin: 5400,
    brightness: 90,
    blueReductionPct: 20,
    description: 'Menjaga saturasi film tetap natural sambil menahan lonjakan sinar biru berlebih.',
  },
  {
    id: 'game',
    name: 'Game',
    subtitle: 'Visibilitas tinggi & nyaman',
    kelvin: 5000,
    brightness: 95,
    blueReductionPct: 27,
    description: 'Mempertahankan detail bayangan dan kontras gerak cepat tanpa membuat mata cepat kering.',
  },
  {
    id: 'custom',
    name: 'Custom',
    subtitle: 'Kalibrasi manual',
    kelvin: 4100,
    brightness: 78,
    blueReductionPct: 43,
    description: 'Sesuaikan suhu Kelvin dan peredupan layar secara presisi sesuai pencahayaan ruangan Anda.',
  },
];

export const INITIAL_DAILY_STATS: DailyEyeStat[] = [
  {
    date: '2026-11-10',
    label: '10 Nov',
    dayShort: 'Sel',
    totalMinutes: 412,
    protectedMinutes: 358,
    avgKelvin: 4250,
    avgBrightness: 76,
    breaksCompleted: 14,
    breaksTarget: 18,
    dominantMode: 'office',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-11',
    label: '11 Nov',
    dayShort: 'Rab',
    totalMinutes: 468,
    protectedMinutes: 390,
    avgKelvin: 3900,
    avgBrightness: 72,
    breaksCompleted: 16,
    breaksTarget: 20,
    dominantMode: 'office',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-12',
    label: '12 Nov',
    dayShort: 'Kam',
    totalMinutes: 525,
    protectedMinutes: 372,
    avgKelvin: 4850,
    avgBrightness: 86,
    breaksCompleted: 11,
    breaksTarget: 22,
    dominantMode: 'game',
    strainRisk: 'Sedang',
  },
  {
    date: '2026-11-13',
    label: '13 Nov',
    dayShort: 'Jum',
    totalMinutes: 395,
    protectedMinutes: 378,
    avgKelvin: 3550,
    avgBrightness: 70,
    breaksCompleted: 17,
    breaksTarget: 18,
    dominantMode: 'reading',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-14',
    label: '14 Nov',
    dayShort: 'Sab',
    totalMinutes: 280,
    protectedMinutes: 245,
    avgKelvin: 5100,
    avgBrightness: 84,
    breaksCompleted: 9,
    breaksTarget: 12,
    dominantMode: 'movie',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-15',
    label: '15 Nov',
    dayShort: 'Min',
    totalMinutes: 315,
    protectedMinutes: 298,
    avgKelvin: 3100,
    avgBrightness: 62,
    breaksCompleted: 13,
    breaksTarget: 14,
    dominantMode: 'night',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-16',
    label: '16 Nov',
    dayShort: 'Sen',
    totalMinutes: 486,
    protectedMinutes: 440,
    avgKelvin: 4100,
    avgBrightness: 75,
    breaksCompleted: 19,
    breaksTarget: 22,
    dominantMode: 'office',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-17',
    label: '17 Nov',
    dayShort: 'Sel',
    totalMinutes: 540,
    protectedMinutes: 412,
    avgKelvin: 4650,
    avgBrightness: 84,
    breaksCompleted: 12,
    breaksTarget: 24,
    dominantMode: 'office',
    strainRisk: 'Sedang',
  },
  {
    date: '2026-11-18',
    label: '18 Nov',
    dayShort: 'Rab',
    totalMinutes: 432,
    protectedMinutes: 410,
    avgKelvin: 3650,
    avgBrightness: 71,
    breaksCompleted: 18,
    breaksTarget: 20,
    dominantMode: 'reading',
    strainRisk: 'Rendah',
  },
  {
    date: '2026-11-19',
    label: 'Hari Ini',
    dayShort: 'Kam',
    totalMinutes: 264,
    protectedMinutes: 248,
    avgKelvin: 4300,
    avgBrightness: 78,
    breaksCompleted: 11,
    breaksTarget: 13,
    dominantMode: 'office',
    strainRisk: 'Rendah',
  },
];

export const DEFAULT_APP_STATE: AppSettingsState = {
  masterEnabled: true,
  applyLiveOverlay: true,
  activeMode: 'office',
  kelvin: 4500,
  brightness: 82,
  schedule: {
    enabled: false,
    dayStartHour: 7,
    nightStartHour: 19,
    dayKelvin: 5200,
    nightKelvin: 2700,
    dayBrightness: 88,
    nightBrightness: 56,
    simulatedHour: null,
  },
  monitors: [
    {
      id: 'disp-1',
      name: 'Display 1 (Utama)',
      model: 'Dell UltraSharp U2723QE',
      resolution: '3840 × 2160 · 60Hz',
      orientation: 'landscape',
      isPrimary: true,
      connected: true,
      brightness: 82,
      kelvin: 4500,
      useDdcCi: true,
    },
    {
      id: 'disp-2',
      name: 'Display 2 (Eksternal)',
      model: 'LG 24QP500 IPS',
      resolution: '2560 × 1440 · 75Hz',
      orientation: 'landscape',
      isPrimary: false,
      connected: true,
      brightness: 76,
      kelvin: 4400,
      useDdcCi: true,
    },
    {
      id: 'disp-3',
      name: 'Display 3 (Vertikal)',
      model: 'ASUS ProArt PA248QV',
      resolution: '1200 × 1920 · 60Hz',
      orientation: 'portrait',
      isPrimary: false,
      connected: true,
      brightness: 70,
      kelvin: 3800,
      useDdcCi: false,
    },
  ],
  syncMonitors: true,
  breakConfig: {
    enabled: true,
    workMinutes: 20,
    breakSeconds: 20,
    strictMode: false,
    soundEnabled: true,
    ruleLabel: 'Aturan 20-20-20',
  },
  focusConfig: {
    enabledOnApp: false,
    mode: 'reading-line',
    dimOpacity: 55,
    blurAmount: 4,
    bandHeight: 150,
    spotlightRadius: 230,
    accentBorder: true,
  },
  breakLogs: [
    {
      id: 'brk-1',
      timestamp: '09:20',
      durationSeconds: 20,
      status: 'completed',
      note: 'Fokus pandang jarak jauh (6 meter)',
    },
    {
      id: 'brk-2',
      timestamp: '09:42',
      durationSeconds: 20,
      status: 'completed',
      note: 'Relaksasi kedipan mata',
    },
    {
      id: 'brk-3',
      timestamp: '10:05',
      durationSeconds: 20,
      status: 'skipped',
      note: 'Ditunda saat rapat daring',
    },
    {
      id: 'brk-4',
      timestamp: '10:30',
      durationSeconds: 20,
      status: 'completed',
      note: 'Fokus pandang jarak jauh (6 meter)',
    },
  ],
  dailyStats: INITIAL_DAILY_STATS,
  closeToTray: true,
  launchOnStartup: false,
};

/**
 * Generates a real Rust Windows desktop engine configuration (config.toml)
 * matching the user's current settings for export.
 */
export function buildRustConfigToml(state: AppSettingsState): string {
  const monitorsBlock = state.monitors
    .map(
      (m) => `[[monitors]]
id = "${m.id}"
name = "${m.name}"
primary = ${m.isPrimary}
brightness = ${m.brightness}
kelvin = ${m.kelvin}
driver = "${m.useDdcCi ? 'ddc_ci_hardware' : 'win32_gamma_ramp'}"`
    )
    .join('\n\n');

  return `# Konfigurasi LuminaEye (Windows Rust Engine - Win32 GammaRamp & DDC/CI)
[general]
enabled = ${state.masterEnabled}
active_mode = "${state.activeMode}"
sync_all_monitors = ${state.syncMonitors}

[blue_light_filter]
kelvin = ${state.kelvin}
brightness = ${state.brightness}
auto_circadian = ${state.schedule.enabled}
day_start_hour = ${state.schedule.dayStartHour}
night_start_hour = ${state.schedule.nightStartHour}
day_kelvin = ${state.schedule.dayKelvin}
night_kelvin = ${state.schedule.nightKelvin}

[break_timer]
enabled = ${state.breakConfig.enabled}
rule = "${state.breakConfig.ruleLabel}"
work_interval_minutes = ${state.breakConfig.workMinutes}
break_duration_seconds = ${state.breakConfig.breakSeconds}
strict_mode = ${state.breakConfig.strictMode}
audio_chime = ${state.breakConfig.soundEnabled}

[focus_magicx]
mode = "${state.focusConfig.mode}"
dim_opacity_percent = ${state.focusConfig.dimOpacity}
blur_radius_px = ${state.focusConfig.blurAmount}
reading_band_height_px = ${state.focusConfig.bandHeight}
accent_border = ${state.focusConfig.accentBorder}

${monitorsBlock}
`;
}
