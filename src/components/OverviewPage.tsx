import React, { useState } from 'react';
import {
  Monitor,
  Sun,
  Coffee,
  Crosshair,
  ArrowRight,
  Download,
  Copy,
  Check,
  Sliders,
  Minimize2,
  Power,
} from 'lucide-react';
import { AppSettingsState, FilterModeId, NavSection } from '../types/eyeCare';
import { FILTER_PRESETS, buildRustConfigToml } from '../data/defaults';
import { computeBlueLightReduction, formatMinutesToHours } from '../utils/colorMath';

interface OverviewPageProps {
  state: AppSettingsState;
  effectiveKelvin: number;
  effectiveBrightness: number;
  nextBreakSeconds: number;
  onNavigate: (section: NavSection) => void;
  onSelectMode: (mode: FilterModeId) => void;
  onUpdateKelvin: (kelvin: number) => void;
  onUpdateBrightness: (brightness: number) => void;
  onToggleLiveOverlay: () => void;
  onTriggerBreakNow: () => void;
  onToggleCloseToTray?: () => void;
  onToggleLaunchOnStartup?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  state,
  effectiveKelvin,
  effectiveBrightness,
  nextBreakSeconds,
  onNavigate,
  onSelectMode,
  onUpdateKelvin,
  onUpdateBrightness,
  onToggleLiveOverlay,
  onTriggerBreakNow,
  onToggleCloseToTray,
  onToggleLaunchOnStartup,
}) => {
  const [showTomlExport, setShowTomlExport] = useState(false);
  const [copiedToml, setCopiedToml] = useState(false);

  const blueReduction = state.masterEnabled ? computeBlueLightReduction(effectiveKelvin) : 0;
  const todayStat = state.dailyStats[state.dailyStats.length - 1];
  const minsUntilBreak = Math.floor(nextBreakSeconds / 60);
  const secsUntilBreak = nextBreakSeconds % 60;

  const pillars: Array<{
    id: NavSection;
    icon: React.ReactNode;
    title: string;
    points: [string, string];
    actionLabel: string;
    metric: string;
  }> = [
    {
      id: 'bluelight',
      icon: <Monitor className="h-8 w-8 stroke-[1.5] text-sky-600" />,
      title: 'Kurangi Cahaya Biru Berbahaya',
      points: [
        'Saring emisi cahaya biru berlebih dari layar secara halus dengan kurva Kelvin akurat.',
        'Jaga kualitas tidur malam lewat jadwal otomatis siang/malam dan 5 mode bawaan.',
      ],
      actionLabel: 'Atur Blue Light Filter',
      metric: `${effectiveKelvin}K · ${blueReduction}% tersaring`,
    },
    {
      id: 'brightness',
      icon: <Sun className="h-8 w-8 stroke-[1.5] text-sky-600" />,
      title: 'Optimalkan Kecerahan Layar',
      points: [
        'Sesuaikan tingkat kecerahan lebih halus hingga 10% tanpa flicker PWM.',
        'Kelola banyak monitor sekaligus secara tersinkronisasi atau terpisah per layar.',
      ],
      actionLabel: 'Kelola Multi-Monitor',
      metric: `${effectiveBrightness}% · ${state.monitors.length} layar terhubung`,
    },
    {
      id: 'timer',
      icon: <Coffee className="h-8 w-8 stroke-[1.5] text-sky-600" />,
      title: 'Pengingat Istirahat Cerdas',
      points: [
        'Terapkan aturan 20-20-20 otomatis agar otot mata tidak tegang menatap layar.',
        'Kurangi kelelahan dan mata kering lewat jeda singkat 20 detik setiap 20 menit.',
      ],
      actionLabel: 'Buka Break Timer',
      metric: state.breakConfig.enabled
        ? `Berikutnya ${String(minsUntilBreak).padStart(2, '0')}:${String(secsUntilBreak).padStart(2, '0')}`
        : 'Timer dijeda',
    },
    {
      id: 'focus',
      icon: <Crosshair className="h-8 w-8 stroke-[1.5] text-sky-600" />,
      title: 'Tetap Fokus dengan MagicX',
      points: [
        'Sorot baris bacaan atau jendela aktif untuk mengurangi distraksi visual.',
        'Redupkan dan kaburkan latar belakang layar lain saat membaca atau bekerja.',
      ],
      actionLabel: 'Coba Focus & MagicX',
      metric: state.focusConfig.enabledOnApp ? 'Aktif di layar' : 'Siap diaktifkan',
    },
  ];

  const handleCopyToml = async () => {
    try {
      await navigator.clipboard.writeText(buildRustConfigToml(state));
      setCopiedToml(true);
      setTimeout(() => setCopiedToml(false), 2000);
    } catch {
      // Fallback ignored gracefully
    }
  };

  const handleDownloadToml = () => {
    const content = buildRustConfigToml(state);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'luminaeye-config.toml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Optical Control Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
              Pusat Perlindungan Mata Windows
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Kendali cepat penyaringan cahaya biru, peredupan multi-monitor, pengingat istirahat 20-20-20, dan area fokus MagicX berbasis profil konfigurasi ringan untuk Windows (Rust).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onTriggerBreakNow}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Coffee className="h-4 w-4 text-sky-600" />
              Mulai Istirahat 20d
            </button>
            <button
              type="button"
              onClick={() => setShowTomlExport((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Ekspor config.toml
            </button>
          </div>
        </div>

        <hr className="my-6 border-slate-100" />

        {/* Quick Mode Selector + Direct Sliders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Mode Cepat Layar</span>
              <button
                type="button"
                onClick={onToggleLiveOverlay}
                className="text-xs font-medium text-sky-700 hover:text-sky-800 underline-offset-4 hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                {state.applyLiveOverlay ? 'Matikan efek pada layar ini' : 'Terapkan efek ke layar ini'}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {FILTER_PRESETS.filter((p) => p.id !== 'custom').map((preset) => {
                const isActive = state.activeMode === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectMode(preset.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'border border-slate-200 bg-slate-50/70 text-slate-700 hover:border-sky-300 hover:bg-sky-50/50'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Mode aktif:{' '}
              <span className="font-medium text-slate-800 capitalize">{state.activeMode}</span>
              {' · '}
              <span>
                {FILTER_PRESETS.find((p) => p.id === state.activeMode)?.description}
              </span>
            </p>
          </div>

          <div className="space-y-4 lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-6">
            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="quick-kelvin" className="font-medium text-slate-700">
                  Suhu Warna (Blue Light Filter)
                </label>
                <span className="font-mono font-medium tabular-nums text-slate-900">
                  {effectiveKelvin}K · -{blueReduction}% biru
                </span>
              </div>
              <input
                id="quick-kelvin"
                type="range"
                min={1900}
                max={6500}
                step={50}
                value={effectiveKelvin}
                onChange={(e) => onUpdateKelvin(Number(e.target.value))}
                className="optical-slider mt-2 w-full"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b 0%, #fde68a 45%, #e0f2fe 100%)',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="quick-brightness" className="font-medium text-slate-700">
                  Kecerahan Layar (Screen Dimmer)
                </label>
                <span className="font-mono font-medium tabular-nums text-slate-900">
                  {effectiveBrightness}%
                </span>
              </div>
              <input
                id="quick-brightness"
                type="range"
                min={10}
                max={100}
                step={1}
                value={effectiveBrightness}
                onChange={(e) => onUpdateBrightness(Number(e.target.value))}
                className="optical-slider mt-2 w-full"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Windows Rust TOML Configuration Drawer */}
        {showTomlExport && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Konfigurasi Mesin Windows (Rust Win32 GammaRamp &amp; DDC/CI)
                </h3>
                <p className="text-xs text-slate-500">
                  Simpan berkas ini ke direktori <code className="font-mono text-slate-700">%APPDATA%\LuminaEye\config.toml</code> untuk sinkronisasi dengan daemon Rust.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyToml}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedToml ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedToml ? 'Disalin' : 'Salin TOML'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadToml}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh config.toml
                </button>
              </div>
            </div>
            <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">
              {buildRustConfigToml(state)}
            </pre>
          </div>
        )}
      </section>

      {/* 4-Column Feature Pillar Grid (Inspired directly by attached Capture_ba46db79.PNG) */}
      <section aria-label="Empat Pilar Perlindungan Mata">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => (
            <article
              key={pillar.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-sky-300"
            >
              <div>
                <div className="mb-4">{pillar.icon}</div>
                <h2 className="font-display text-lg font-semibold leading-snug text-sky-700">
                  {pillar.title}
                </h2>
                <hr className="my-4 border-slate-200" />
                <ul className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                    <span>{pillar.points[0]}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                    <span>{pillar.points[1]}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="font-mono text-xs tabular-nums text-slate-500">{pillar.metric}</p>
                <button
                  type="button"
                  onClick={() => onNavigate(pillar.id)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {pillar.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Today's Eye Health Compact Summary Row */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Ringkasan Kesehatan Mata Hari Ini
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pelacakan otomatis durasi layar aktif, proteksi cahaya biru, dan kepatuhan istirahat berkala.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('stats')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sliders className="h-4 w-4" />
            Lihat Dashboard Statistik Lengkap
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-6 border-t border-slate-100 pt-5 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Durasi Layar Hari Ini</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {formatMinutesToHours(todayStat.totalMinutes)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {Math.round((todayStat.protectedMinutes / Math.max(1, todayStat.totalMinutes)) * 100)}% terlindungi filter
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Reduksi Cahaya Biru</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-sky-700">
              {blueReduction}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Suhu aktif {effectiveKelvin}K
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Istirahat 20-20-20</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {todayStat.breaksCompleted}/{todayStat.breaksTarget}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sesi relaksasi mata selesai
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Risiko Kelelahan Mata</p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-700">
              {todayStat.strainRisk}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Rata-rata kecerahan {todayStat.avgBrightness}%
            </p>
          </div>
        </div>
      </section>

      {/* Desktop Integration Settings (Tray & Startup) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Integrasi Aplikasi Desktop
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Pengaturan perilaku jendela dan sistem operasi Windows untuk LuminaEye.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Close to Tray */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-300">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Minimize2 className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-900">
                  Minimize ke System Tray saat ditutup
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tombol silang (X) menyembunyikan ke tray agar pelindung mata tetap aktif.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.closeToTray ?? true}
              onClick={onToggleCloseToTray}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                (state.closeToTray ?? true) ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  (state.closeToTray ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Launch on Startup */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-300">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-900">
                  Launch on StartUp (Otomatis saat Boot)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                LuminaEye langsung berjalan otomatis ketika Windows dinyalakan.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.launchOnStartup ?? false}
              onClick={onToggleLaunchOnStartup}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                state.launchOnStartup ? 'bg-sky-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  state.launchOnStartup ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
