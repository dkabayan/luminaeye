import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { DailyEyeStat, FilterModeId } from '../types/eyeCare';
import { computeBlueLightReduction, formatMinutesToHours } from '../utils/colorMath';

interface StatsDashboardPageProps {
  dailyStats: DailyEyeStat[];
  liveSessionSeconds: number;
}

type RangeFilter = 'today' | '7d' | 'all';
type RiskFilter = 'all' | 'Rendah' | 'Sedang' | 'Tinggi';

const MODE_LABELS: Record<FilterModeId, string> = {
  office: 'Office',
  night: 'Night',
  reading: 'Reading',
  movie: 'Movie',
  game: 'Game',
  custom: 'Custom',
};

export const StatsDashboardPage: React.FC<StatsDashboardPageProps> = ({
  dailyStats,
  liveSessionSeconds,
}) => {
  const [range, setRange] = useState<RangeFilter>('7d');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const rangedStats = useMemo(() => {
    if (range === 'today') return dailyStats.slice(-1);
    if (range === '7d') return dailyStats.slice(-7);
    return dailyStats;
  }, [dailyStats, range]);

  const summary = useMemo(() => {
    const totalMinutes = rangedStats.reduce((sum, d) => sum + d.totalMinutes, 0);
    const protectedMinutes = rangedStats.reduce((sum, d) => sum + d.protectedMinutes, 0);
    const breaksCompleted = rangedStats.reduce((sum, d) => sum + d.breaksCompleted, 0);
    const breaksTarget = rangedStats.reduce((sum, d) => sum + d.breaksTarget, 0);
    const avgKelvin = Math.round(
      rangedStats.reduce((sum, d) => sum + d.avgKelvin, 0) / Math.max(1, rangedStats.length)
    );
    const avgBrightness = Math.round(
      rangedStats.reduce((sum, d) => sum + d.avgBrightness, 0) / Math.max(1, rangedStats.length)
    );
    const protectionRate = Math.round((protectedMinutes / Math.max(1, totalMinutes)) * 100);
    const breakRate = Math.round((breaksCompleted / Math.max(1, breaksTarget)) * 100);

    // Mode distribution
    const modeCounts: Record<FilterModeId, number> = {
      office: 0,
      night: 0,
      reading: 0,
      movie: 0,
      game: 0,
      custom: 0,
    };
    rangedStats.forEach((d) => {
      modeCounts[d.dominantMode] += d.totalMinutes;
    });

    const modeBreakdown = (Object.entries(modeCounts) as [FilterModeId, number][])
      .filter(([, mins]) => mins > 0)
      .sort((a, b) => b[1] - a[1]);

    return {
      totalMinutes,
      protectedMinutes,
      breaksCompleted,
      breaksTarget,
      avgKelvin,
      avgBrightness,
      protectionRate,
      breakRate,
      blueCutAvg: computeBlueLightReduction(avgKelvin),
      modeBreakdown,
    };
  }, [rangedStats]);

  const filteredTableRows = useMemo(() => {
    return [...rangedStats]
      .reverse()
      .filter((row) => {
        if (riskFilter !== 'all' && row.strainRisk !== riskFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            row.label.toLowerCase().includes(q) ||
            row.date.toLowerCase().includes(q) ||
            MODE_LABELS[row.dominantMode].toLowerCase().includes(q) ||
            row.strainRisk.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [rangedStats, riskFilter, searchQuery]);

  const maxMinutes = Math.max(360, ...rangedStats.map((d) => d.totalMinutes));
  const hoveredItem = rangedStats.find((d) => d.date === hoveredDate) ?? rangedStats[rangedStats.length - 1];

  const handleExportCsv = () => {
    const header = 'Tanggal,Hari,Durasi_Menit,Terlindungi_Menit,Rata_Kelvin,Rata_Kecerahan,Istirahat_Selesai,Target_Istirahat,Mode_Dominan,Risiko_Mata\n';
    const rows = rangedStats
      .map(
        (d) =>
          `${d.date},${d.dayShort},${d.totalMinutes},${d.protectedMinutes},${d.avgKelvin},${d.avgBrightness},${d.breaksCompleted},${d.breaksTarget},${MODE_LABELS[d.dominantMode]},${d.strainRisk}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luminaeye-statistik-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header + Timeframe Segmented Control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
            Dashboard Statistik Kesehatan Mata
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pelacakan durasi layar harian, persentase waktu terlindungi Blue Light Filter, dan konsistensi istirahat 20-20-20.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            {(
              [
                { id: 'today', label: 'Hari Ini' },
                { id: '7d', label: '7 Hari' },
                { id: 'all', label: '10 Hari' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRange(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  range === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh CSV
          </button>
        </div>
      </div>

      {/* 4 Clean KPI Metric Columns */}
      <section className="grid grid-cols-1 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Total Durasi Layar</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {formatMinutesToHours(summary.totalMinutes)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Sesi aktif berjalan: <span className="font-mono tabular-nums text-slate-700">{Math.floor(liveSessionSeconds / 60)}m {liveSessionSeconds % 60}d</span>
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Waktu Terlindungi Filter</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-sky-700">
            {summary.protectionRate}%
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {formatMinutesToHours(summary.protectedMinutes)} · Rata-rata {summary.avgKelvin}K (-{summary.blueCutAvg}% biru)
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Kepatuhan Istirahat 20-20-20</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
            {summary.breakRate}%
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {summary.breaksCompleted} dari {summary.breaksTarget} target jeda selesai
          </p>
        </div>

        <div className="p-6">
          <p className="text-xs font-medium text-slate-500">Rata-Rata Kecerahan</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {summary.avgBrightness}%
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Rentang optimal ergonomi: 60%–85%
          </p>
        </div>
      </section>

      {/* Chart + Mode Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Daily Screen Duration vs Protected Hours Bar Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Durasi Penggunaan Harian &amp; Cakupan Proteksi
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Bandingkan total waktu layar (abu-abu) dengan durasi aktif Blue Light Filter (biru).
              </p>
            </div>
            {hoveredItem && (
              <div className="text-right font-mono text-xs tabular-nums">
                <p className="font-semibold text-slate-900">{hoveredItem.label}</p>
                <p className="text-slate-500">
                  Total {formatMinutesToHours(hoveredItem.totalMinutes)} · Filter {formatMinutesToHours(hoveredItem.protectedMinutes)}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex h-56 items-end gap-3 border-b border-slate-200 pb-2">
              {rangedStats.map((day) => {
                const totalHeightPct = Math.max(8, (day.totalMinutes / maxMinutes) * 100);
                const protectedHeightPct = Math.min(
                  100,
                  (day.protectedMinutes / Math.max(1, day.totalMinutes)) * 100
                );
                const isHovered = hoveredItem?.date === day.date;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setHoveredDate(day.date)}
                    onFocus={() => setHoveredDate(day.date)}
                    className="group flex h-full flex-1 flex-col items-center justify-end focus:outline-none cursor-pointer"
                  >
                    <div
                      className={`relative flex w-full max-w-[44px] items-end overflow-hidden rounded-t-md bg-slate-200 transition-all ${
                        isHovered ? 'ring-2 ring-sky-400 ring-offset-2' : ''
                      }`}
                      style={{ height: `${totalHeightPct}%` }}
                    >
                      <div
                        className="w-full bg-sky-600 transition-all"
                        style={{ height: `${protectedHeightPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex gap-3">
              {rangedStats.map((day) => (
                <div key={day.date} className="flex-1 text-center">
                  <p className="text-xs font-medium text-slate-700">{day.dayShort}</p>
                  <p className="font-mono text-[10px] tabular-nums text-slate-400">{day.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-sky-600" aria-hidden="true" />
                Terlindungi Blue Light Filter
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-xs bg-slate-200" aria-hidden="true" />
                Tanpa Filter Aktif
              </span>
            </div>
          </div>
        </section>

        {/* Mode Distribution & Ergonomic Recommendations */}
        <section className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Distribusi Mode Warna
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Proporsi durasi layar berdasarkan mode dominan.
            </p>

            <div className="mt-5 space-y-3.5">
              {summary.modeBreakdown.map(([modeId, mins]) => {
                const pct = Math.round((mins / Math.max(1, summary.totalMinutes)) * 100);
                return (
                  <div key={modeId}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{MODE_LABELS[modeId]}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {formatMinutesToHours(mins)} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-semibold text-slate-900">
              Catatan Kesehatan Mata
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {summary.breakRate >= 80
                ? 'Kebiasaan istirahat 20-20-20 Anda sangat baik. Pertahankan suhu di bawah 3200K setelah pukul 19:00 untuk menjaga kualitas tidur.'
                : 'Kepatuhan istirahat berada di bawah 80%. Pertimbangkan mengaktifkan Mode Ketat pada Break Timer agar jeda 20 detik tidak sering terlewat.'}
            </p>
          </div>
        </section>
      </div>

      {/* Searchable & Filterable Daily Usage Log Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Log Harian Kesehatan Mata
          </h2>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tanggal atau mode..."
                aria-label="Cari riwayat harian"
                className="w-48 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              {(['all', 'Rendah', 'Sedang'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskFilter(r)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    riskFilter === r
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'Semua Risiko' : r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredTableRows.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-600">
              Tidak ada data yang cocok dengan filter pencarian Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRiskFilter('all');
              }}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Atur Ulang Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-4 py-3">Mode Dominan</th>
                  <th className="px-4 py-3 text-right">Durasi Layar</th>
                  <th className="px-4 py-3 text-right">Suhu Rata-Rata</th>
                  <th className="px-4 py-3 text-right">Kecerahan</th>
                  <th className="px-4 py-3 text-right">Istirahat</th>
                  <th className="px-6 py-3 text-right">Risiko Kelelahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTableRows.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-900">{row.label}</span>
                      <span className="ml-2 font-mono text-xs text-slate-400">{row.date}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {MODE_LABELS[row.dominantMode]}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-900">
                      {formatMinutesToHours(row.totalMinutes)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-sky-700">
                      {row.avgKelvin}K
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {row.avgBrightness}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-slate-700">
                      {row.breaksCompleted}/{row.breaksTarget}
                    </td>
                    <td className="px-6 py-3 text-right text-xs font-medium">
                      <span
                        className={
                          row.strainRisk === 'Rendah'
                            ? 'text-emerald-700'
                            : row.strainRisk === 'Sedang'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {row.strainRisk}
                      </span>
                    </td>
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
