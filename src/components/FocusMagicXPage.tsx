import React, { useRef, useState } from 'react';
import { Crosshair, Maximize2, Layers, AlignJustify, Eye } from 'lucide-react';
import { FocusMagicXConfig, FocusModeType } from '../types/eyeCare';

interface FocusMagicXPageProps {
  config: FocusMagicXConfig;
  onUpdateConfig: (patch: Partial<FocusMagicXConfig>) => void;
}

type SandboxWindowId = 'editor' | 'docs' | 'notes';

export const FocusMagicXPage: React.FC<FocusMagicXPageProps> = ({
  config,
  onUpdateConfig,
}) => {
  const sandboxRef = useRef<HTMLDivElement | null>(null);
  const [cursorLocal, setCursorLocal] = useState({ x: 320, y: 150 });
  const [activeWindow, setActiveWindow] = useState<SandboxWindowId>('docs');

  const handleSandboxMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sandboxRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorLocal({
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
    });
  };

  const modes: Array<{
    id: FocusModeType;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'reading-line',
      label: 'Focus Reading Line',
      desc: 'Menyorot baris horizontal mengikuti kursor untuk membaca dokumen panjang tanpa kehilangan baris.',
      icon: <AlignJustify className="h-4 w-4" />,
    },
    {
      id: 'window-spotlight',
      label: 'Active Window Spotlight',
      desc: 'Menyorot jendela Windows yang sedang aktif dan meredupkan jendela latar belakang secara otomatis.',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: 'magicx-blur',
      label: 'MagicX Area Spotlight',
      desc: 'Menciptakan lingkaran fokus presisi di sekitar kursor sambil mengaburkan area di luar fokus.',
      icon: <Crosshair className="h-4 w-4" />,
    },
  ];

  const dimAlpha = config.dimOpacity / 100;
  const halfBand = Math.min(110, config.bandHeight / 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Focus &amp; MagicX
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tingkatkan konsentrasi membaca dan bekerja dengan menyorot area atau jendela tertentu sambil meredupkan atau mengaburkan bagian layar lainnya.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onUpdateConfig({ enabledOnApp: !config.enabledOnApp })}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            config.enabledOnApp
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          <Maximize2 className="h-4 w-4" />
          {config.enabledOnApp ? 'Nonaktifkan di Layar Penuh' : 'Aktifkan di Layar Penuh'}
        </button>
      </div>

      {/* Mode Switcher Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {modes.map((m) => {
          const isSelected = config.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onUpdateConfig({ mode: m.id })}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
                <span className={isSelected ? 'text-sky-600' : 'text-slate-500'}>{m.icon}</span>
                <span>{m.label}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Interactive Windows Desktop Sandbox + Parameter Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Interactive Sandbox */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Simulasi Langsung Focus &amp; MagicX
              </h2>
              <p className="text-xs text-slate-500">
                {config.mode === 'window-spotlight'
                  ? 'Klik salah satu jendela di bawah untuk menyorot jendela aktif dan meredupkan jendela lain.'
                  : 'Gerakkan kursor di dalam area kerja di bawah untuk merasakan efek sorotan secara langsung.'}
              </p>
            </div>
            <span className="font-mono text-xs text-sky-700">
              {config.mode === 'reading-line'
                ? `Tinggi pita ${config.bandHeight}px`
                : config.mode === 'window-spotlight'
                ? `Jendela aktif: ${activeWindow === 'docs' ? 'Dokumen' : activeWindow === 'editor' ? 'Kode Rust' : 'Catatan'}`
                : `Radius ${config.spotlightRadius}px`}
            </span>
          </div>

          {/* Multi-Window Mock Windows Desktop */}
          <div
            ref={sandboxRef}
            onMouseMove={handleSandboxMove}
            className="relative mt-4 h-[360px] overflow-hidden rounded-xl border border-slate-200 bg-[#EEF2F6] p-4 select-none"
          >
            <div className="grid h-full grid-cols-12 gap-3">
              {/* Left Window: Rust Code Window */}
              <div
                onClick={() => setActiveWindow('editor')}
                className={`relative col-span-5 flex flex-col overflow-hidden rounded-lg border bg-white shadow-xs transition-all duration-200 cursor-pointer ${
                  config.mode === 'window-spotlight' && activeWindow === 'editor'
                    ? 'z-20 border-sky-500 ring-2 ring-sky-200'
                    : 'z-10 border-slate-200'
                }`}
                style={
                  config.mode === 'window-spotlight' && activeWindow !== 'editor'
                    ? {
                        filter: `brightness(${(1 - dimAlpha * 0.65).toFixed(2)}) blur(${(
                          config.blurAmount * 0.45
                        ).toFixed(1)}px)`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="font-mono text-[11px] font-medium text-slate-700">gamma_ramp.rs</span>
                  <span className="text-[10px] text-slate-400">Rust · Win32</span>
                </div>
                <pre className="flex-1 overflow-hidden p-3 font-mono text-[11px] leading-relaxed text-slate-700">
{`pub fn apply_kelvin(k: u32) {
  let (r, g, b) = kelvin_rgb(k);
  let mut ramp = [0u16; 768];
  for i in 0..256 {
    ramp[i] = scale(i, r);
    ramp[256+i] = scale(i, g);
    ramp[512+i] = scale(i, b);
  }
  set_device_gamma(&ramp);
}`}
                </pre>
              </div>

              {/* Right Column: Primary Document + Bottom Notes */}
              <div className="col-span-7 flex flex-col gap-3">
                {/* Document Reader Window */}
                <div
                  onClick={() => setActiveWindow('docs')}
                  className={`relative flex-1 overflow-hidden rounded-lg border bg-white shadow-xs transition-all duration-200 cursor-pointer ${
                    config.mode === 'window-spotlight' && activeWindow === 'docs'
                      ? 'z-20 border-sky-500 ring-2 ring-sky-200'
                      : 'z-10 border-slate-200'
                  }`}
                  style={
                    config.mode === 'window-spotlight' && activeWindow !== 'docs'
                      ? {
                          filter: `brightness(${(1 - dimAlpha * 0.65).toFixed(2)}) blur(${(
                            config.blurAmount * 0.45
                          ).toFixed(1)}px)`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-[11px] font-medium text-slate-800">
                      Panduan Ergonomi Visual Kerja Harian.pdf
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">Hal 4 / 18</span>
                  </div>
                  <div className="space-y-2 p-3.5 text-xs leading-relaxed text-slate-700">
                    <p className="font-display font-semibold text-slate-900">
                      Mengurangi Beban Kognitif dengan Penggaris Fokus
                    </p>
                    <p>
                      Saat membaca paragraf padat pada monitor resolusi tinggi, mata sering melompat antar baris dan mempercepat kelelahan. Fitur Focus Reading Line menahan perhatian pada satu rentang baris aktif.
                    </p>
                    <p>
                      Kombinasi peredupan latar belakang sebesar 50–65% dan pengaburan halus menjaga konteks halaman tetap terlihat tanpa memicu distraksi tepi layar.
                    </p>
                  </div>
                </div>

                {/* Quick Task Notes Window */}
                <div
                  onClick={() => setActiveWindow('notes')}
                  className={`relative h-28 overflow-hidden rounded-lg border bg-white shadow-xs transition-all duration-200 cursor-pointer ${
                    config.mode === 'window-spotlight' && activeWindow === 'notes'
                      ? 'z-20 border-sky-500 ring-2 ring-sky-200'
                      : 'z-10 border-slate-200'
                  }`}
                  style={
                    config.mode === 'window-spotlight' && activeWindow !== 'notes'
                      ? {
                          filter: `brightness(${(1 - dimAlpha * 0.65).toFixed(2)}) blur(${(
                            config.blurAmount * 0.45
                          ).toFixed(1)}px)`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-1.5">
                    <span className="text-[11px] font-medium text-slate-800">Catatan Rapat Tim</span>
                    <span className="text-[10px] text-slate-400">Tersimpan</span>
                  </div>
                  <div className="p-3 text-xs text-slate-600 space-y-1">
                    <p>1. Verifikasi kurva transisi malam 2700K pada monitor sekunder.</p>
                    <p>2. Uji notifikasi istirahat 20-20-20 pada mode layar penuh.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Line Overlay Inside Sandbox */}
            {config.mode === 'reading-line' && (
              <>
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0 z-30"
                  style={{
                    height: `${Math.max(0, cursorLocal.y - halfBand)}px`,
                    backgroundColor: `rgba(15, 23, 42, ${dimAlpha})`,
                    backdropFilter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
                  }}
                />
                {config.accentBorder && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-30 border-y border-sky-400"
                    style={{
                      top: `${Math.max(0, cursorLocal.y - halfBand)}px`,
                      height: `${halfBand * 2}px`,
                    }}
                  />
                )}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 z-30"
                  style={{
                    top: `${Math.min(360, cursorLocal.y + halfBand)}px`,
                    backgroundColor: `rgba(15, 23, 42, ${dimAlpha})`,
                    backdropFilter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
                  }}
                />
              </>
            )}

            {/* MagicX Circular Spotlight Inside Sandbox */}
            {config.mode === 'magicx-blur' && (
              <div
                className="pointer-events-none absolute inset-0 z-30"
                style={{
                  background: `radial-gradient(circle ${Math.round(
                    config.spotlightRadius * 0.65
                  )}px at ${cursorLocal.x}px ${cursorLocal.y}px, transparent 0%, transparent 58%, rgba(15, 23, 42, ${dimAlpha}) 100%)`,
                }}
              />
            )}
          </div>
        </section>

        {/* Parameters Control Panel */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Parameter MagicX
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="focus-opacity" className="font-medium text-slate-700">
                  Tingkat Peredupan Latar
                </label>
                <span className="font-mono font-semibold tabular-nums text-sky-700">
                  {config.dimOpacity}%
                </span>
              </div>
              <input
                id="focus-opacity"
                type="range"
                min={20}
                max={85}
                step={5}
                value={config.dimOpacity}
                onChange={(e) => onUpdateConfig({ dimOpacity: Number(e.target.value) })}
                className="optical-slider mt-2 w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="focus-blur" className="font-medium text-slate-700">
                  Intensitas Pengaburan (Blur)
                </label>
                <span className="font-mono font-semibold tabular-nums text-sky-700">
                  {config.blurAmount}px
                </span>
              </div>
              <input
                id="focus-blur"
                type="range"
                min={0}
                max={12}
                step={1}
                value={config.blurAmount}
                onChange={(e) => onUpdateConfig({ blurAmount: Number(e.target.value) })}
                className="optical-slider mt-2 w-full"
              />
            </div>

            {config.mode === 'reading-line' && (
              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="focus-band" className="font-medium text-slate-700">
                    Tinggi Pita Bacaan
                  </label>
                  <span className="font-mono font-semibold tabular-nums text-sky-700">
                    {config.bandHeight}px
                  </span>
                </div>
                <input
                  id="focus-band"
                  type="range"
                  min={80}
                  max={260}
                  step={10}
                  value={config.bandHeight}
                  onChange={(e) => onUpdateConfig({ bandHeight: Number(e.target.value) })}
                  className="optical-slider mt-2 w-full"
                />
              </div>
            )}

            {config.mode === 'magicx-blur' && (
              <div>
                <div className="flex justify-between text-xs">
                  <label htmlFor="focus-radius" className="font-medium text-slate-700">
                    Radius Sorotan MagicX
                  </label>
                  <span className="font-mono font-semibold tabular-nums text-sky-700">
                    {config.spotlightRadius}px
                  </span>
                </div>
                <input
                  id="focus-radius"
                  type="range"
                  min={140}
                  max={340}
                  step={10}
                  value={config.spotlightRadius}
                  onChange={(e) => onUpdateConfig({ spotlightRadius: Number(e.target.value) })}
                  className="optical-slider mt-2 w-full"
                />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-medium text-slate-800">Garis Panduan Sorotan</p>
                <p className="text-[11px] text-slate-500">Tampilkan garis tipis biru pada tepi pita baca</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.accentBorder}
                onClick={() => onUpdateConfig({ accentBorder: !config.accentBorder })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  config.accentBorder
                    ? 'border-sky-200 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {config.accentBorder ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                <Eye className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>
                  Saat diaktifkan pada layar penuh, tekan tombol <kbd className="font-mono text-slate-900">Esc</kbd> kapan saja untuk kembali ke tampilan normal.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
