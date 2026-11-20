import React, { useState } from 'react';
import { Monitor, Link2, Unlink, Plus, Trash2, Sun, Keyboard } from 'lucide-react';
import { DisplayMonitor } from '../types/eyeCare';
import { kelvinToOverlayColor } from '../utils/colorMath';

interface BrightnessPageProps {
  monitors: DisplayMonitor[];
  syncMonitors: boolean;
  onToggleSync: () => void;
  onUpdateMonitor: (id: string, patch: Partial<DisplayMonitor>) => void;
  onUpdateAllMonitors: (patch: { brightness?: number; kelvin?: number }) => void;
  onAddMonitor: () => void;
  onRemoveMonitor: (id: string) => void;
}

export const BrightnessPage: React.FC<BrightnessPageProps> = ({
  monitors,
  syncMonitors,
  onToggleSync,
  onUpdateMonitor,
  onUpdateAllMonitors,
  onAddMonitor,
  onRemoveMonitor,
}) => {
  const [selectedId, setSelectedId] = useState<string>(monitors[0]?.id ?? 'disp-1');
  const selectedMonitor = monitors.find((m) => m.id === selectedId) ?? monitors[0];

  const handleBrightnessChange = (val: number) => {
    if (syncMonitors) {
      onUpdateAllMonitors({ brightness: val });
    } else if (selectedMonitor) {
      onUpdateMonitor(selectedMonitor.id, { brightness: val });
    }
  };

  const handleKelvinChange = (val: number) => {
    if (syncMonitors) {
      onUpdateAllMonitors({ kelvin: val });
    } else if (selectedMonitor) {
      onUpdateMonitor(selectedMonitor.id, { kelvin: val });
    }
  };

  const ambientPresets = [
    { label: 'Malam / Ruangan Gelap', brightness: 35, note: 'Mengurangi silau berlebih' },
    { label: 'Ruang Kerja Standar', brightness: 75, note: 'Pencahayaan lampu kantor' },
    { label: 'Terang / Dekat Jendela', brightness: 94, note: 'Cahaya matahari langsung' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Screen Dimmer &amp; Kontrol Multi-Monitor
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atur kecerahan layar lebih halus hingga 10% melalui DDC/CI perangkat keras atau peredupan gamma perangkat lunak, mendukung konfigurasi banyak monitor sekaligus.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleSync}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              syncMonitors
                ? 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {syncMonitors ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
            {syncMonitors ? 'Sinkronkan Semua Monitor' : 'Kontrol Independen'}
          </button>
          {monitors.length < 4 && (
            <button
              type="button"
              onClick={onAddMonitor}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Layar
            </button>
          )}
        </div>
      </div>

      {/* Interactive Multi-Monitor Visual Desk Canvas */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Susunan Monitor Terdeteksi ({monitors.length} layar)
          </h2>
          <span className="text-xs text-slate-500">
            Klik layar di bawah untuk memilih dan menyesuaikan kecerahan secara spesifik
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-center gap-6 rounded-xl border border-slate-100 bg-slate-50/70 px-6 py-8">
          {monitors.map((monitor, idx) => {
            const isSelected = selectedMonitor?.id === monitor.id;
            const dimOverlay = Math.max(0, Math.min(0.88, (100 - monitor.brightness) / 100));
            const tint = kelvinToOverlayColor(monitor.kelvin, 1.15);
            const isPortrait = monitor.orientation === 'portrait';

            return (
              <div key={monitor.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setSelectedId(monitor.id)}
                  className={`group relative overflow-hidden rounded-lg border-2 bg-slate-900 p-2 text-left transition-all cursor-pointer ${
                    isPortrait ? 'h-48 w-32' : 'h-36 w-56'
                  } ${
                    isSelected
                      ? 'border-sky-600 ring-4 ring-sky-100'
                      : 'border-slate-700 hover:border-sky-400'
                  }`}
                >
                  {/* Simulated Bright Desktop Screen Inside Bezel */}
                  <div className="relative h-full w-full overflow-hidden rounded bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        #{idx + 1}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-slate-500">
                        {monitor.brightness}%
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-2 w-3/4 rounded bg-slate-200" />
                      <div className="h-2 w-full rounded bg-slate-100" />
                      <div className="h-2 w-2/3 rounded bg-slate-100" />
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between font-mono text-[10px] text-slate-600">
                      <span>{monitor.kelvin}K</span>
                      <span>{monitor.useDdcCi ? 'DDC/CI' : 'Gamma'}</span>
                    </div>

                    {/* Blue Light Tint on Simulated Monitor */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundColor: tint,
                        mixBlendMode: 'multiply',
                      }}
                    />
                    {/* Real Dimmer Darkness on Simulated Monitor */}
                    <div
                      className="pointer-events-none absolute inset-0 transition-opacity duration-150"
                      style={{
                        backgroundColor: `rgba(2, 6, 23, ${dimOverlay.toFixed(2)})`,
                      }}
                    />
                  </div>
                </button>

                {/* Monitor Stand */}
                <div className="h-3 w-8 bg-slate-300" />
                <div className="h-1.5 w-16 rounded-full bg-slate-300" />

                <div className="mt-2.5 text-center">
                  <p className="text-xs font-semibold text-slate-900">{monitor.name}</p>
                  <p className="font-mono text-[11px] tabular-nums text-slate-500">
                    {monitor.brightness}% · {monitor.kelvin}K
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Monitor Detail Controls + Ambient Presets */}
      {selectedMonitor && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  {syncMonitors ? 'Pengaturan Gabungan Semua Monitor' : selectedMonitor.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedMonitor.model} · {selectedMonitor.resolution}
                </p>
              </div>

              {!selectedMonitor.isPrimary && monitors.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveMonitor(selectedMonitor.id);
                    setSelectedId(monitors[0].id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Layar
                </button>
              )}
            </div>

            <div className="mt-6 space-y-6">
              {/* Smooth Brightness Dimmer */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="monitor-brightness" className="font-medium text-slate-800">
                    Kecerahan &amp; Screen Dimmer
                  </label>
                  <span className="font-mono text-base font-semibold tabular-nums text-sky-700">
                    {selectedMonitor.brightness}%
                  </span>
                </div>
                <input
                  id="monitor-brightness"
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={selectedMonitor.brightness}
                  onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                  className="optical-slider mt-3 w-full"
                />
                <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-slate-500">
                  <span>10% (Ultra Redup)</span>
                  <span>50% (Nyaman Malam)</span>
                  <span>100% (Maksimal)</span>
                </div>
              </div>

              {/* Per-Monitor Kelvin Trim */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="monitor-kelvin" className="font-medium text-slate-800">
                    Suhu Warna Monitor
                  </label>
                  <span className="font-mono text-base font-semibold tabular-nums text-slate-900">
                    {selectedMonitor.kelvin}K
                  </span>
                </div>
                <input
                  id="monitor-kelvin"
                  type="range"
                  min={1900}
                  max={6500}
                  step={50}
                  value={selectedMonitor.kelvin}
                  onChange={(e) => handleKelvinChange(Number(e.target.value))}
                  className="optical-slider mt-3 w-full"
                  style={{
                    background: 'linear-gradient(90deg, #f59e0b 0%, #fde68a 50%, #e0f2fe 100%)',
                  }}
                />
              </div>

              {/* Driver Mode Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Metode Kontrol Perangkat Keras (Windows)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    DDC/CI mengatur lampu latar monitor langsung; Software Gamma meredupkan di bawah batas minimum panel.
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => onUpdateMonitor(selectedMonitor.id, { useDdcCi: true })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedMonitor.useDdcCi
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    DDC/CI Hardware
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMonitor(selectedMonitor.id, { useDdcCi: false })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      !selectedMonitor.useDdcCi
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Software Gamma
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Ambient Presets & Keyboard Shortcuts */}
          <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
            <div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-sky-600" />
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Preset Pencahayaan Ruangan
                </h2>
              </div>
              <div className="mt-4 space-y-2.5">
                {ambientPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleBrightnessChange(preset.brightness)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{preset.label}</p>
                      <p className="text-xs text-slate-500">{preset.note}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-sky-700">
                      {preset.brightness}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Keyboard className="h-4 w-4 text-slate-500" />
                Pintasan Global Windows
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <dt>Naikkan / Turunkan Kecerahan</dt>
                  <dd className="font-mono text-slate-900">Alt + ↑ / ↓</dd>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <dt>Jeda / Aktifkan Perlindungan</dt>
                  <dd className="font-mono text-slate-900">Alt + P</dd>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <dt>Ganti Profil Layar Berikutnya</dt>
                  <dd className="font-mono text-slate-900">Alt + M</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      )}

      {/* Compact Per-Monitor Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Ringkasan Parameter Semua Monitor
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-6 py-3">Monitor</th>
                <th className="px-4 py-3">Resolusi</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3 text-right">Kecerahan</th>
                <th className="px-6 py-3 text-right">Suhu Warna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monitors.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedMonitor?.id === m.id ? 'bg-sky-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-6 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-sky-600 shrink-0" />
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.resolution}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {m.useDdcCi ? 'DDC/CI Hardware' : 'Win32 GammaRamp'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-medium tabular-nums text-slate-900">
                    {m.brightness}%
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs font-medium tabular-nums text-sky-700">
                    {m.kelvin}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
