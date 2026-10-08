import { format, startOfWeek, subWeeks, addDays, startOfMonth, isSameMonth, differenceInCalendarDays } from 'date-fns';
import { bestEffort, runCum } from './geo';
import { getWatch } from './watches';

export const LEVELS = [0, 50, 150, 400, 800, 1500, 3000];
export function levelOf(totalKm) {
  let lvl = 1;
  for (let i = 0; i < LEVELS.length; i++) if (totalKm >= LEVELS[i]) lvl = i + 1;
  const next = LEVELS[lvl] ?? null;
  return { level: lvl, next, from: LEVELS[lvl - 1], progress: next ? (totalKm - LEVELS[lvl - 1]) / (next - LEVELS[lvl - 1]) : 1 };
}

export const dkey = (d) => format(new Date(d), 'yyyy-MM-dd');

export function streakOf(runs, now = new Date()) {
  const days = new Set(runs.map((r) => dkey(r.date)));
  let cursor = new Date(now);
  if (!days.has(dkey(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (days.has(dkey(cursor))) { n++; cursor = addDays(cursor, -1); }
  return n;
}

const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

export function computeStats(runs, now = new Date()) {
  const sorted = [...runs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalKm = sum(sorted, (r) => r.distance);
  const totalTime = sum(sorted, (r) => r.duration);
  const wk0 = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekKm = sum(sorted.filter((r) => new Date(r.date) >= wk0), (r) => r.distance);
  const monthRuns = sorted.filter((r) => isSameMonth(new Date(r.date), now));
  const thisMonthKm = sum(monthRuns, (r) => r.distance);

  const weekly = [];
  for (let i = 11; i >= 0; i--) {
    const s = subWeeks(wk0, i);
    const e = addDays(s, 7);
    const inW = sorted.filter((r) => new Date(r.date) >= s && new Date(r.date) < e);
    weekly.push({ label: format(s, 'd MMM'), km: +sum(inW, (r) => r.distance).toFixed(1), elev: Math.round(sum(inW, (r) => r.elevGain)), runs: inW.length });
  }

  const paceTrend = sorted.filter((r) => r.elevGain < 150).slice(-30).map((r) => ({ label: format(new Date(r.date), 'd MMM'), pace: +(r.avgPace / 60).toFixed(2), km: r.distance }));

  const heat = {};
  sorted.forEach((r) => { heat[dkey(r.date)] = (heat[dkey(r.date)] || 0) + r.distance; });

  // personal records
  const best = (km) => {
    let b = null, run = null;
    for (const r of sorted) {
      if (r.distance < km - 0.05 || !r.points?.length) continue;
      const t = bestEffort(r.points, km, runCum(r));
      if (t && (b == null || t < b)) { b = t; run = r; }
    }
    return b ? { time: b, run } : null;
  };
  const longest = sorted.reduce((m, r) => (!m || r.distance > m.distance ? r : m), null);
  const mostElev = sorted.reduce((m, r) => (!m || r.elevGain > m.elevGain ? r : m), null);
  const records = { k1: best(1), k5: best(5), k10: best(10), longest, mostElev };

  // watches
  const byWatch = {};
  sorted.forEach((r) => { byWatch[r.watch] = (byWatch[r.watch] || 0) + 1; });
  const watchUsage = Object.entries(byWatch)
    .map(([id, count]) => ({ id, count, pct: sorted.length ? Math.round((count / sorted.length) * 100) : 0, w: getWatch(id) }))
    .sort((a, b) => b.count - a.count);

  // data saved vs a typical map-heavy app (rough estimate: ~9 MB/run vs ~0.4 MB)
  const savedMB = Math.round(monthRuns.length * 8.9);

  return {
    sorted,
    totalKm,
    totalRuns: sorted.length,
    avgPace: totalKm > 0 ? totalTime / totalKm : 0,
    thisWeekKm,
    thisMonthKm,
    monthRuns: monthRuns.length,
    weekly,
    paceTrend,
    heat,
    records,
    watchUsage,
    streak: streakOf(sorted, now),
    level: levelOf(totalKm),
    savedMB,
    offlineRuns: sorted.filter((r) => r.offline).length,
  };
}

export function heatGrid(heat, now = new Date(), weeks = 17) {
  const start = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1);
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const k = dkey(date);
      col.push({ date, key: k, km: heat[k] || 0, future: differenceInCalendarDays(date, now) > 0 });
    }
    cols.push(col);
  }
  return cols;
}

export function achievementsOf(runs, stats) {
  const has = (f) => runs.some(f);
  const off = stats.offlineRuns;
  return [
    { id: 'first5', icon: '🏁', name: 'First 5km', desc: 'Finish a 5 km run', done: has((r) => r.distance >= 5), progress: Math.min(1, Math.max(0, ...runs.map((r) => r.distance)) / 5) },
    { id: 'loadshedding', icon: '🕯️', name: 'Loadshedding Warrior', desc: '10 offline runs', done: off >= 10, progress: Math.min(1, off / 10), label: `${Math.min(off, 10)}/10 offline runs` },
    { id: 'tablemtn', icon: '⛰️', name: 'Table Mountain Climber', desc: 'Run Platteklip Gorge', done: has((r) => r.routeId === 'tablemountain') },
    { id: 'streak5', icon: '🔥', name: 'Vuka Streak', desc: 'Run 5 days in a row', done: stats.streak >= 5, progress: Math.min(1, stats.streak / 5), label: `${Math.min(stats.streak, 5)}/5 days` },
    { id: 'k10', icon: '💪', name: '10K Club', desc: 'Finish a 10 km run', done: has((r) => r.distance >= 10), progress: Math.min(1, Math.max(0, ...runs.map((r) => r.distance)) / 10) },
    { id: 'k100', icon: '🌍', name: '100 km Legend', desc: 'Run 100 km in total', done: stats.totalKm >= 100, progress: Math.min(1, stats.totalKm / 100), label: `${Math.min(Math.round(stats.totalKm), 100)}/100 km` },
    { id: 'early', icon: '🌅', name: 'Early Bird', desc: 'Start a run before 6am', done: has((r) => new Date(r.date).getHours() < 6) },
    { id: 'township', icon: '🤝', name: 'Run Club Regular', desc: 'Run a township club route', done: has((r) => ['langa', 'khayelitsha', 'soweto'].includes(r.routeId)) },
  ];
}
