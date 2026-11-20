import React, { useState } from 'react';
import { Sun, Moon, Clock, Eye, RotateCcw } from 'lucide-react';
import { AutoScheduleConfig, FilterModeId } from '../types/eyeCare';
import { FILTER_PRESETS } from '../data/defaults';
import {
  computeBlueLightReduction,
  computeCircadianValues,
  formatHour,
  kelvinToOverlayColor,
} from '../utils/colorMath';

interface BlueLightPageProps {
  masterEnabled: boolean;
  applyLiveOverlay: boolean;
  activeMode: FilterModeId;
  kelvin: number;
  brightness: number;
  schedule: AutoScheduleConfig;
  effectiveKelvin: number;
  currentHour: number;
  onSelectMode: (mode: FilterModeId) => void;
  onUpdateKelvin: (kelvin: number) => void;
  onUpdateSchedule: (partial: Partial<AutoScheduleConfig>) => void;
  onToggleLiveOverlay: () => void;
}

export const BlueLightPage: React.FC<BlueLightPageProps> = ({
  masterEnabled,
  applyLiveOverlay,
  activeMode,
  kelvin,
  schedule,
  effectiveKelvin,
  currentHour,
  onSelectMode,
  onUpdateKelvin,
  onUpdateSchedule,
  onToggleLiveOverlay,
}) => {
  const [compareSplit, setCompareSplit] = useState(52);
  const activeReduction = computeBlueLightReduction(effectiveKelvin);

  const circadianNow = computeCircadianValues(
    currentHour,
    schedule.dayStartHour,
    schedule.nightStartHour,
    schedule.dayKelvin,
    schedule.nightKelvin,
    schedule.dayBrightness,
    schedule.nightBrightness
  );

  // Build 24-hour circadian SVG curve points
  const curvePoints = Array.from({ length: 49 }, (_, i) => {
    const h = i * 0.5;
    const { kelvin: k } = computeCircadianValues(
      h,
      schedule.dayStartHour,
      schedule.nightStartHour,
      schedule.dayKelvin,
      schedule.nightKelvin,
      schedule.dayBrightness,
      schedule.nightBrightness
    );
    const x = (h / 24) * 480;
    const y = 120 - ((k - 1800) / (6500 - 1800)) * 96;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const markerX = (currentHour / 24) * 480;
  const markerY = 120 - ((circadianNow.kelvin - 1800) / (6500 - 1800)) * 96;

  // Spectral blue-light attenuation curve (380nm - 720nm)
  const blueScale = 1 - activeReduction / 100;
  const rawSpectrumPath =
    'M 0,108 C 28,108 42,18 66,18 C 92,18 112,86 144,72 C 178,56 218,32 255,44 C 288,54 316,96 340,108';
  const filteredBluePeakY = 18 + (1 - blueScale) * 76;
  const filteredSpectrumPath = `M 0,108 C 28,108 42,${filteredBluePeakY.toFixed(1)} 66,${filteredBluePeakY.toFixed(
    1
  )} C 92,${filteredBluePeakY.toFixed(1)} 112,86 144,76 C 178,60 218,36 255,46 C 288,56 316,96 340,108`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Blue Light Filter &amp; Suhu Warna
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atur spektrum Kelvin layar untuk mengurangi gelombang cahaya biru energi tinggi (415–455 nm) yang memicu kelelahan retina dan gangguan tidur.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleLiveOverlay}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            applyLiveOverlay
              ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Eye className="h-4 w-4" />
          {applyLiveOverlay ? 'Filter Layar Langsung: Aktif' : 'Filter Layar Langsung: Hanya Pratinjau'}
        </button>
      </div>

      {/* Mode Presets Grid */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Mode Bawaan
          </h2>
          <span className="text-xs text-slate-500">
            Pilih profil optik sesuai aktivitas Anda
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = activeMode === preset.id && !schedule.enabled;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectMode(preset.id)}
                className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-slate-900">
                    {preset.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-sky-700">
                    {preset.id === 'custom' ? `${kelvin}K` : `${preset.kelvin}K`}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {preset.subtitle} · -{preset.id === 'custom' ? computeBlueLightReduction(kelvin) : preset.blueReductionPct}% cahaya biru
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Kelvin Calibration + Live Before/After Split Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Manual Kelvin & Spectrum Graph */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Kalibrasi Suhu Warna (Kelvin)
            </h2>
            <span className="font-mono text-sm font-semibold tabular-nums text-sky-700">
              {effectiveKelvin}K
            </span>
          </div>

          <div className="mt-5">
            <input
              type="range"
              min={1900}
              max={6500}
              step={50}
              value={effectiveKelvin}
              disabled={schedule.enabled}
              onChange={(e) => onUpdateKelvin(Number(e.target.value))}
              aria-label="Suhu warna Kelvin"
              className="optical-slider w-full disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg, #ea580c 0%, #f59e0b 28%, #fde68a 58%, #e0f2fe 100%)',
              }}
            />
            <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-slate-500">
              <span>1900K · Lilin</span>
              <span>3600K · Baca</span>
              <span>4500K · Kantor</span>
              <span>6500K · Siang</span>
            </div>
            {schedule.enabled && (
              <p className="mt-2 text-xs text-amber-700">
                Jadwal otomatis siang/malam sedang aktif. Matikan jadwal otomatis untuk mengatur slider manual.
              </p>
            )}
          </div>

          {/* Spectral Wavelength Attenuation Chart */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">Kurva Redaman Spektrum Cahaya Biru</span>
              <span className="font-mono tabular-nums text-slate-600">
                Reduksi HEV: <strong className="text-sky-700">{activeReduction}%</strong>
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/70 p-3">
              <svg viewBox="0 0 340 128" className="h-32 w-full">
                <defs>
                  <linearGradient id="blueZone" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                {/* 415-455nm HEV highlight band */}
                <rect x="34" y="8" width="60" height="100" fill="url(#blueZone)" />
                <text x="64" y="16" textAnchor="middle" className="fill-sky-700 text-[9px] font-medium">
                  415–455nm
                </text>

                {/* Baseline */}
                <line x1="0" y1="108" x2="340" y2="108" stroke="#cbd5e1" strokeWidth="1" />

                {/* Raw 6500K spectrum */}
                <path
                  d={rawSpectrumPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />

                {/* Filtered active spectrum */}
                <path
                  d={filteredSpectrumPath}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                />

                <text x="12" y="122" className="fill-slate-500 font-mono text-[9px]">380nm</text>
                <text x="112" y="122" className="fill-slate-500 font-mono text-[9px]">480nm</text>
                <text x="210" y="122" className="fill-slate-500 font-mono text-[9px]">580nm</text>
                <text x="304" y="122" className="fill-slate-500 font-mono text-[9px]">700nm</text>
              </svg>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                <span>Garis putus: Layar standar 6500K</span>
                <span aria-hidden="true">·</span>
                <span className="text-sky-700">Garis biru: Output terfilter ({effectiveKelvin}K)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Before/After Screen Comparison */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Pratinjau Perbandingan Layar
            </h2>
            <span className="text-xs text-slate-500">
              Geser pembatas untuk membandingkan
            </span>
          </div>

          <div className="relative mt-4 h-60 overflow-hidden rounded-lg border border-slate-200 bg-white select-none">
            {/* Mock Windows Document Surface (Unfiltered Left Base) */}
            <div className="absolute inset-0 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-xs font-medium text-slate-700">Laporan_Risiko_Optik_2026.docx</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">Zoom 100%</span>
              </div>
              <div className="mt-4 space-y-2.5">
                <p className="font-display text-sm font-semibold text-slate-900">
                  Evaluasi Paparan Cahaya Biru pada Layar Kerja
                </p>
                <p className="text-xs leading-relaxed text-slate-700">
                  Cahaya biru bergelombang pendek antara 415 hingga 455 nanometer memancarkan energi foton tinggi yang dapat menembus kornea langsung ke retina. Penyesuaian suhu warna ke kisaran 3500K–4500K menjaga kenyamanan membaca tanpa menurunkan ketajaman huruf.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="rounded border border-slate-200 bg-sky-50 p-2">
                    <div className="text-[10px] text-slate-500">Suhu Awal</div>
                    <div className="font-mono text-xs font-semibold text-slate-900">6500K</div>
                  </div>
                  <div className="rounded border border-slate-200 bg-amber-50 p-2">
                    <div className="text-[10px] text-slate-500">Target Filter</div>
                    <div className="font-mono text-xs font-semibold text-slate-900">{effectiveKelvin}K</div>
                  </div>
                  <div className="rounded border border-slate-200 bg-emerald-50 p-2">
                    <div className="text-[10px] text-slate-500">Reduksi HEV</div>
                    <div className="font-mono text-xs font-semibold text-emerald-700">-{activeReduction}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtered Right Overlay Clipped by compareSplit */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                clipPath: `inset(0 0 0 ${compareSplit}%)`,
                backgroundColor: masterEnabled
                  ? kelvinToOverlayColor(effectiveKelvin, 1.35)
                  : 'transparent',
                mixBlendMode: 'multiply',
              }}
            />

            {/* Divider Line */}
            <div
              className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-sky-600"
              style={{ left: `${compareSplit}%` }}
            />

            {/* Corner labels */}
            <span className="pointer-events-none absolute bottom-2.5 left-3 rounded bg-white/90 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 shadow-xs">
              Tanpa Filter (6500K)
            </span>
            <span className="pointer-events-none absolute bottom-2.5 right-3 rounded bg-slate-900/85 px-2 py-0.5 font-mono text-[11px] font-medium text-white shadow-xs">
              LuminaEye ({effectiveKelvin}K)
            </span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-slate-500 whitespace-nowrap">Posisi batas</span>
            <input
              type="range"
              min={10}
              max={90}
              value={compareSplit}
              onChange={(e) => setCompareSplit(Number(e.target.value))}
              aria-label="Geser perbandingan sebelum dan sesudah"
              className="optical-slider w-full"
            />
            <span className="font-mono text-xs tabular-nums text-slate-600">{compareSplit}%</span>
          </div>
        </section>
      </div>

      {/* Automatic Day/Night Circadian Schedule */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Penyesuaian Otomatis Siang / Malam (Sirkadian)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Mengubah suhu warna secara bertahap mengikuti jam matahari terbit dan terbenam agar ritme tidur tetap terjaga.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={schedule.enabled}
            onClick={() => onUpdateSchedule({ enabled: !schedule.enabled })}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              schedule.enabled
                ? 'bg-sky-600 text-white hover:bg-sky-700'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4 w-4" />
            {schedule.enabled ? 'Jadwal Otomatis: Aktif' : 'Aktifkan Jadwal Otomatis'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 24-Hour Circadian Curve Visualization */}
          <div className="lg:col-span-7">
            <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Kurva 24 Jam · Fase saat ini: <strong className="text-sky-700">{circadianNow.phase}</strong>
                </span>
                <span className="font-mono tabular-nums text-slate-600">
                  Pukul {formatHour(currentHour)} → {circadianNow.kelvin}K
                </span>
              </div>
              <svg viewBox="0 0 480 144" className="h-36 w-full">
                {/* Horizontal guidelines */}
                <line x1="0" y1="24" x2="480" y2="24" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="0" y1="72" x2="480" y2="72" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="0" y1="120" x2="480" y2="120" stroke="#cbd5e1" strokeWidth="1" />

                {/* Night shading */}
                <rect
                  x="0"
                  y="14"
                  width={(schedule.dayStartHour / 24) * 480}
                  height="106"
                  fill="rgba(15, 23, 42, 0.05)"
                />
                <rect
                  x={(schedule.nightStartHour / 24) * 480}
                  y="14"
                  width={((24 - schedule.nightStartHour) / 24) * 480}
                  height="106"
                  fill="rgba(15, 23, 42, 0.05)"
                />

                {/* Circadian Kelvin Polyline */}
                <polyline
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  points={curvePoints}
                />

                {/* Current Hour Indicator */}
                <line
                  x1={markerX}
                  y1="14"
                  x2={markerX}
                  y2="120"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle cx={markerX} cy={markerY} r="5" fill="#d97706" stroke="#ffffff" strokeWidth="2" />

                {/* Hour labels */}
                {[0, 6, 12, 18, 24].map((h) => (
                  <text
                    key={h}
                    x={h === 24 ? 464 : h === 0 ? 12 : (h / 24) * 480}
                    y="138"
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[10px]"
                  >
                    {String(h === 24 ? 0 : h).padStart(2, '0')}:00
                  </text>
                ))}
              </svg>

              {/* Interactive Time Simulator */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200/70 pt-3">
                <label htmlFor="sim-hour" className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  Simulasi Jam:
                </label>
                <input
                  id="sim-hour"
                  type="range"
                  min={0}
                  max={23.5}
                  step={0.5}
                  value={currentHour}
                  onChange={(e) => onUpdateSchedule({ simulatedHour: Number(e.target.value) })}
                  className="optical-slider flex-1 min-w-[140px]"
                />
                <span className="font-mono text-xs tabular-nums text-slate-900">
                  {formatHour(currentHour)}
                </span>
                {schedule.simulatedHour !== null && (
                  <button
                    type="button"
                    onClick={() => onUpdateSchedule({ simulatedHour: null })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Jam Sistem
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Day / Night Parameters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sun className="h-4 w-4 text-amber-500" />
                Profil Siang
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Mulai Siang</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatHour(schedule.dayStartHour)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={10}
                    step={0.5}
                    value={schedule.dayStartHour}
                    onChange={(e) => onUpdateSchedule({ dayStartHour: Number(e.target.value) })}
                    className="optical-slider mt-1.5 w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Suhu Siang</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {schedule.dayKelvin}K
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4000}
                    max={6500}
                    step={100}
                    value={schedule.dayKelvin}
                    onChange={(e) => onUpdateSchedule({ dayKelvin: Number(e.target.value) })}
                    className="optical-slider mt-1.5 w-full"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Moon className="h-4 w-4 text-sky-700" />
                Profil Malam
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Mulai Malam</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatHour(schedule.nightStartHour)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={17}
                    max={22}
                    step={0.5}
                    value={schedule.nightStartHour}
                    onChange={(e) => onUpdateSchedule({ nightStartHour: Number(e.target.value) })}
                    className="optical-slider mt-1.5 w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Suhu Malam</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {schedule.nightKelvin}K
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1900}
                    max={4200}
                    step={100}
                    value={schedule.nightKelvin}
                    onChange={(e) => onUpdateSchedule({ nightKelvin: Number(e.target.value) })}
                    className="optical-slider mt-1.5 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
