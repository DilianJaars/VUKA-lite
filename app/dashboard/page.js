'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { useApp } from '@/components/AppProvider';
import Heatmap from '@/components/Heatmap';
import MiniRoute from '@/components/MiniRoute';
import { Avatar, Stat, WatchLogo } from '@/components/ui';
import { IconDownload, IconShare } from '@/components/Icons';
import { computeStats, achievementsOf } from '@/lib/stats';
import { fmtPace, fmtShort, fmtDuration } from '@/lib/format';
import { getWatch } from '@/lib/watches';
import { toMultiGPX, toGPX, download } from '@/lib/gpx';

const chartSkeleton = () => <div className="skeleton h-[200px] rounded-xl" />;
const WeeklyChart = dynamic(() => import('@/components/Charts').then((m) => m.WeeklyChart), { ssr: false, loading: chartSkeleton });
const PaceChart = dynamic(() => import('@/components/Charts').then((m) => m.PaceChart), { ssr: false, loading: chartSkeleton });
const ElevChart = dynamic(() => import('@/components/Charts').then((m) => m.ElevChart), { ssr: false, loading: chartSkeleton });

const PRIV = { public: ['Public', '🌍'], friends: ['Friends', '👥'], private: ['Private', '🔒'] };
const NEXT = { public: 'friends', friends: 'private', private: 'public' };

function Card({ title, sub, children, className = '' }) {
  return (
    <section className={`card p-4 ${className}`} aria-label={title}>
      <div className="mb-3"><h2 className="text-lg uppercase leading-tight">{title}</h2>{sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}</div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const { user, runs, devices, updateRun, toast } = useApp();
  const [shown, setShown] = useState(8);
  const now = useMemo(() => new Date(), []);
  const s = useMemo(() => computeStats(runs, now), [runs, now]);
  const badges = useMemo(() => achievementsOf(runs, s), [runs, s]);
  const recent = useMemo(() => [...runs].sort((a, b) => new Date(b.date) - new Date(a.date)), [runs]);
  const goal = user.goalKm || 20;
  const weekPct = Math.min(1, s.thisWeekKm / goal);
  const MONTH_GOAL = 100;
  const monthPct = Math.min(1, s.thisMonthKm / MONTH_GOAL);
  const top = s.watchUsage[0];

  const exportAll = () => {
    if (!runs.length) return toast('No runs to export yet', 'err');
    download(`vuka-all-runs-${format(new Date(), 'yyyyMMdd')}.gpx`, toMultiGPX(recent));
    toast(`${runs.length} runs exported as GPX`);
  };
  const exportStrava = () => {
    if (!recent.length) return toast('No runs to export yet', 'err');
    download(`vuka-${recent[0].id}.gpx`, toGPX(recent[0]));
    window.open('https://www.strava.com/upload/select', '_blank', 'noopener');
    toast('GPX downloaded - drop it into Strava upload');
  };

  const devs = Object.entries(devices);

  return (
    <div className="px-5 pt-6 space-y-4">
      {/* HEADER */}
      <header className="flex items-center gap-4">
        <Avatar name={user.name} color={user.color} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-none uppercase truncate">{user.name}</h1>
          <div className="mt-1 text-lime font-heading font-extrabold uppercase">Level {s.level.level} Runner</div>
          <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden" aria-label={s.level.next ? `${Math.round(s.level.progress * 100)}% to level ${s.level.level + 1}` : 'Max level'}>
            <div className="h-full bg-lime" style={{ width: `${s.level.progress * 100}%` }} />
          </div>
          {s.level.next && <div className="text-[11px] text-white/45 mt-1">{Math.max(0, s.level.next - s.totalKm).toFixed(0)} km to Level {s.level.level + 1}</div>}
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4"><div className="label">Total distance</div><div className="stat text-3xl font-bold mt-1">{s.totalKm.toFixed(0)}<span className="text-sm text-white/50 ml-1">km</span></div></div>
        <div className="glass p-4 border-lime/40"><div className="label">Streak</div><div className="font-heading font-extrabold text-xl uppercase mt-1 leading-tight">{s.streak > 0 ? <>🔥 {s.streak} day streak <span className="text-lime">Vuka!</span></> : <>Run today to start a streak</>}</div></div>
      </div>

      {/* OVERVIEW */}
      <section aria-label="Overview" className="grid grid-cols-2 gap-3">
        <Stat label="This week" value={s.thisWeekKm.toFixed(1)} unit="km" />
        <Stat label="This month" value={s.thisMonthKm.toFixed(1)} unit="km" />
        <Stat label="Total runs" value={s.totalRuns} />
        <Stat label="Average pace" value={fmtPace(s.avgPace)} unit="/km" />
        <Stat className="col-span-2 !border-lime/40" label="Personal best 5 km" value={s.records.k5 ? fmtShort(s.records.k5.time) : '-'} unit={s.records.k5 ? 'min' : ''} />
      </section>

      {/* GOALS */}
      <Card title="Goals">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-baseline"><span className="font-bold">Weekly goal</span><span className="stat"><b className="text-lime text-xl">{s.thisWeekKm.toFixed(0)}</b> / {goal} km</span></div>
            <div className="mt-2 h-4 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(weekPct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Weekly goal"><div className="h-full bg-lime rounded-full transition-all" style={{ width: `${weekPct * 100}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between items-baseline"><span className="font-bold">{format(now, 'MMMM')} challenge: {MONTH_GOAL} km</span><span className="stat"><b className="text-lime text-xl">{s.thisMonthKm.toFixed(0)}</b> / {MONTH_GOAL}</span></div>
            <div className="mt-2 h-4 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(monthPct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly challenge"><div className="h-full rounded-full transition-all bg-[#38BDF8]" style={{ width: `${monthPct * 100}%` }} /></div>
            <p className="text-xs text-white/50 mt-1.5">{monthPct >= 1 ? 'Challenge complete. Lekker!' : `${(MONTH_GOAL - s.thisMonthKm).toFixed(0)} km to go. Sharp, you can do it.`}</p>
          </div>
        </div>
      </Card>

      {/* CHARTS */}
      <Card title="Weekly distance" sub="Last 12 weeks, km. Red line is your weekly goal."><WeeklyChart data={s.weekly} goal={goal} /></Card>
      <Card title="Pace trend" sub="Average pace of your last 30 runs. Higher on the chart is faster."><PaceChart data={s.paceTrend} /></Card>
      <Card title="Elevation gain" sub="Metres climbed per week"><ElevChart data={s.weekly} /></Card>

      <Card title="Running calendar" sub="Last 17 weeks. Darker lime is a longer run."><Heatmap heat={s.heat} /></Card>

      {/* RECORDS */}
      <Card title="Personal records">
        <ul className="divide-y divide-white/10">
          {[
            ['Fastest 1 km', s.records.k1, (r) => fmtShort(r.time), (r) => r.run],
            ['Fastest 5 km', s.records.k5, (r) => fmtShort(r.time), (r) => r.run],
            ['Fastest 10 km', s.records.k10, (r) => fmtDuration(r.time).replace(/^00:/, ''), (r) => r.run],
            ['Longest run', s.records.longest, (r) => `${r.distance.toFixed(2)} km`, (r) => r],
            ['Most elevation', s.records.mostElev, (r) => `${r.elevGain} m`, (r) => r],
          ].map(([label, rec, val, run]) => (
            <li key={label}>
              {rec ? (
                <Link href={`/run/${run(rec).id}`} className="flex items-center justify-between min-h-[56px] gap-3">
                  <span><span className="block font-semibold">{label}</span><span className="block text-xs text-white/45">{format(new Date(run(rec).date), 'd MMM yyyy')} · {run(rec).place}</span></span>
                  <span className="stat text-xl font-bold text-lime shrink-0">{val(rec)}</span>
                </Link>
              ) : (
                <div className="flex items-center justify-between min-h-[56px] text-white/45"><span>{label}</span><span className="stat">not yet</span></div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {/* RECENT */}
      <Card title="Recent runs">
        {recent.length === 0 && <p className="text-white/55 text-sm">No runs yet. Hit Start on the Track tab, or connect a watch.</p>}
        <ul className="space-y-3">
          {recent.slice(0, shown).map((r) => {
            const [pl, pi] = PRIV[r.privacy || 'friends'];
            return (
              <li key={r.id} className="flex items-center gap-3">
                <Link href={`/run/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1 min-h-[64px]">
                  <MiniRoute points={r.points} className="w-[84px] h-[60px] rounded-xl overflow-hidden shrink-0" w={168} h={120} pad={12} />
                  <span className="min-w-0">
                    <span className="block font-bold truncate">{r.name}</span>
                    <span className="block text-xs text-white/50 truncate">{format(new Date(r.date), 'EEE d MMM, HH:mm')} · {r.place}</span>
                    <span className="block stat text-xs text-white/80">{r.distance.toFixed(2)} km · {fmtShort(r.duration)} · {fmtPace(r.avgPace)}/km</span>
                  </span>
                </Link>
                <button onClick={() => { updateRun(r.id, { privacy: NEXT[r.privacy || 'friends'] }); toast(`Now ${PRIV[NEXT[r.privacy || 'friends']][0].toLowerCase()}`); }} className="chip shrink-0 flex-col !gap-0 !py-1 !min-h-[48px] !px-2.5 text-[10px]" aria-label={`Privacy: ${pl}. Tap to change.`}>
                  <span className="text-base leading-none" aria-hidden="true">{pi}</span>{pl}
                </button>
              </li>
            );
          })}
        </ul>
        {recent.length > shown && <button className="btn-ghost w-full mt-4 !min-h-[48px]" onClick={() => setShown((n) => n + 10)}>Show more ({recent.length - shown} left)</button>}
      </Card>

      {/* WATCH STATS */}
      <Card title="Watch stats" sub={top ? `You run most with ${top.w.short} (${top.pct}% of runs)` : 'Connect a watch to see stats'}>
        <ul className="space-y-3">
          {s.watchUsage.map(({ id, pct, count, w }) => {
            const d = devices[id];
            return (
              <li key={id} className="flex items-center gap-3">
                <WatchLogo id={id} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm"><b className="truncate">{w.id === 'generic' ? 'File uploads' : w.short}</b><span className="stat text-white/60">{count} runs</span></div>
                  <div className="h-2 rounded-full bg-white/10 mt-1 overflow-hidden"><div className="h-full bg-lime" style={{ width: `${pct}%` }} /></div>
                  <div className="flex justify-between text-[11px] mt-1 text-white/55">
                    <span>{w.short}: <b className="text-white">{w.accuracy}% accuracy</b> ({w.gps})</span>
                    {d && <span>Battery health {d.health ?? 90}%</span>}
                  </div>
                </div>
              </li>
            );
          })}
          {s.watchUsage.length === 0 && <li className="text-sm text-white/50">No watch data yet.</li>}
        </ul>
        {devs.length > 0 && <p className="text-[11px] text-white/35 mt-3">GPS accuracy scores are typical figures for each device class, battery health is simulated.</p>}
      </Card>

      {/* DATA SAVER */}
      <section className="rounded-2xl p-4 bg-lime text-black" aria-label="Data saved">
        <div className="font-heading font-extrabold text-2xl uppercase leading-tight">You saved {s.savedMB} MB vs Strava this month</div>
        <p className="text-sm font-medium mt-1 opacity-80">About {s.monthRuns} runs this month. Estimated at roughly 9 MB per run for a map-heavy app vs under 0.5 MB on VUKA. That&apos;s airtime in your pocket.</p>
      </section>

      {/* BADGES PREVIEW */}
      <Card title="Badges" sub={`${badges.filter((b) => b.done).length} of ${badges.length} unlocked`}>
        <ul className="grid grid-cols-4 gap-2 text-center">
          {badges.map((b) => (
            <li key={b.id} className={`rounded-2xl p-2 ${b.done ? 'bg-lime/10 border border-lime/40' : 'bg-white/5 opacity-50'}`} title={b.desc}>
              <div className="text-2xl" aria-hidden="true">{b.icon}</div>
              <div className="text-[10px] font-bold leading-tight mt-1">{b.name}</div>
              <span className="sr-only">{b.done ? 'unlocked' : 'locked'}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* EXPORT */}
      <Card title="Your data, your call" sub="No lock-in. Take every run with you, any time.">
        <div className="grid gap-3">
          <button className="btn-lime" onClick={exportAll}><IconDownload size={22} /> Download all runs (GPX)</button>
          <button className="btn bg-[#FC4C02] text-white" onClick={exportStrava}><IconShare size={22} /> Export to Strava</button>
        </div>
        <p className="text-xs text-white/45 mt-3">Strava export downloads your latest run as GPX and opens Strava&apos;s upload page. Drop the file in, done.</p>
      </Card>
    </div>
  );
}
