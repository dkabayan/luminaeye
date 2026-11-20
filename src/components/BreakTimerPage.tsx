import React from 'react';
import { Play, Pause, RotateCcw, Coffee, Volume2, VolumeX, ShieldAlert, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { BreakSessionLog, BreakTimerConfig } from '../types/eyeCare';
import { playGentleChime } from '../utils/colorMath';
import { playCatSound } from './CatGatekeeper';

interface BreakTimerPageProps {
  config: BreakTimerConfig;
  secondsRemaining: number;
  isRunning: boolean;
  breakLogs: BreakSessionLog[];
  onUpdateConfig: (patch: Partial<BreakTimerConfig>) => void;
  onToggleRunning: () => void;
  onResetTimer: () => void;
  onTriggerBreakNow: () => void;
  onLogManualBreak: () => void;
}

export const BreakTimerPage: React.FC<BreakTimerPageProps> = ({
  config,
  secondsRemaining,
  isRunning,
  breakLogs,
  onUpdateConfig,
  onToggleRunning,
  onResetTimer,
  onTriggerBreakNow,
  onLogManualBreak,
}) => {
  const totalWorkSeconds = config.workMinutes * 60;
  const progressPct =
    totalWorkSeconds > 0
      ? Math.min(100, Math.max(0, ((totalWorkSeconds - secondsRemaining) / totalWorkSeconds) * 100))
      : 0;

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;

  const workIntervalOptions = [15, 20, 30, 45, 60];
  const breakDurationOptions = [20, 30, 45, 60];

  const completedToday = breakLogs.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Break Timer &amp; Aturan 20-20-20
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Setiap 20 menit bekerja di depan layar, istirahatkan mata selama 20 detik dengan memandang objek berjarak minimal 6 meter (20 kaki) untuk mencegah ketegangan akomodasi mata.
          </p>
        </div>
        <button
          type="button"
          onClick={onTriggerBreakNow}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          Uji Layar Cat Gatekeeper
        </button>
      </div>

      {/* Main Timer Cockpit + Settings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Countdown Card */}
        <section className="flex flex-col items-center justify-between rounded-xl border border-slate-200 bg-white p-8 text-center lg:col-span-5">
          <div>
            <p className="text-xs font-medium text-sky-700">{config.ruleLabel}</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
              Menuju Istirahat Berikutnya
            </h2>
          </div>

          <div className="relative my-8 flex h-52 w-52 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 70}
                strokeDashoffset={2 * Math.PI * 70 * (1 - progressPct / 100)}
                className="transition-[stroke-dashoffset] duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-semibold tabular-nums text-slate-900">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="mt-1.5 text-xs text-slate-500">
                {isRunning ? 'Menghitung mundur' : 'Timer dijeda'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onToggleRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Jeda Timer' : 'Mulai Timer'}
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>

        {/* Configuration Panel */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pengaturan Jadwal Istirahat
          </h2>

          <div className="mt-5 space-y-6">
            {/* Work Interval */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  Interval Kerja Sebelum Pengingat
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-sky-700">
                  Setiap {config.workMinutes} menit
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {workIntervalOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        workMinutes: m,
                        ruleLabel: m === 20 && config.breakSeconds === 20 ? 'Aturan 20-20-20' : `Interval ${m}m / ${config.breakSeconds}d`,
                      })
                    }
                    className={`rounded-lg px-3.5 py-2 font-mono text-xs font-medium tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      config.workMinutes === m
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    {m} menit
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  Durasi Istirahat Mata
                </span>
                <span className="font-mono text-xs font-semibold tabular-nums text-sky-700">
                  {config.breakSeconds} detik
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {breakDurationOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        breakSeconds: s,
                        ruleLabel: config.workMinutes === 20 && s === 20 ? 'Aturan 20-20-20' : `Interval ${config.workMinutes}m / ${s}d`,
                      })
                    }
                    className={`rounded-lg px-3.5 py-2 font-mono text-xs font-medium tabular-nums transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      config.breakSeconds === s
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300'
                    }`}
                  >
                    {s} detik
                  </button>
                ))}
              </div>
            </div>

            {/* Behavior Toggles */}
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Mode Pengingat Ketat</p>
                  <p className="text-xs text-slate-500">
                    Menahan tombol lewati selama 5 detik pertama agar mata benar-benar sempat beristirahat.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.strictMode}
                  onClick={() => onUpdateConfig({ strictMode: !config.strictMode })}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    config.strictMode
                      ? 'border-sky-200 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {config.strictMode ? 'Ketat Aktif' : 'Mode Fleksibel'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Nada Pengingat Lembut</p>
                  <p className="text-xs text-slate-500">
                    Bunyikan lonceng halus saat sesi istirahat dimulai dan berakhir.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playCatSound('meow')}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    🐾 Uji Meow
                  </button>
                  <button
                    type="button"
                    onClick={() => playGentleChime('start')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Uji Lonceng
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.soundEnabled}
                    onClick={() => onUpdateConfig({ soundEnabled: !config.soundEnabled })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      config.soundEnabled
                        ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {config.soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                    {config.soundEnabled ? 'Suara Aktif' : 'Senyap'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Today's Break History Log */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Riwayat Istirahat Hari Ini
            </h2>
            <p className="text-xs text-slate-500">
              {completedToday} sesi selesai · {breakLogs.length - completedToday} ditunda
            </p>
          </div>
          <button
            type="button"
            onClick={onLogManualBreak}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Catat Istirahat Manual
          </button>
        </div>

        {breakLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Belum ada riwayat istirahat hari ini. Mulai timer atau catat sesi istirahat pertama Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-4 py-3">Durasi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3 font-mono text-xs tabular-nums text-slate-900">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-slate-700">
                      {log.durationSeconds} detik
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <span
                        className={
                          log.status === 'completed' ? 'text-emerald-700' : 'text-amber-700'
                        }
                      >
                        {log.status === 'completed' ? 'Selesai' : 'Ditunda'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
