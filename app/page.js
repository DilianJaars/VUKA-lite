'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useApp } from '@/components/AppProvider';
import { useTracker } from '@/hooks/useTracker';
import RouteMap from '@/components/RouteMap';
import Sheet from '@/components/Sheet';
import MiniRoute from '@/components/MiniRoute';
import { WatchLogo } from '@/components/ui';
import { IconPause, IconPlay, IconStop, IconLock, IconWifiOff, IconBolt } from '@/components/Icons';
import { fmtDuration, fmtPace, fmtShort } from '@/lib/format';
import { getWatch, cityLabel } from '@/lib/watches';
import { startOfWeek } from 'date-fns';

function HoldToUnlock({ onUnlock }) {
  const [p, setP] = useState(0);
  const t = useRef(null);
  const down = () => { setP(1); t.current = setTimeout(onUnlock, 1000); };
  const up = () => { setP(0); clearTimeout(t.current); };
  return (
    <button onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} className="relative overflow-hidden btn-ghost !min-h-[72px] w-full max-w-xs select-none touch-none" aria-label="Hold for one second to unlock">
      <span className="absolute inset-y-0 left-0 bg-lime/40" style={{ width: p ? '100%' : '0%', transition: p ? 'width 1s linear' : 'width .15s' }} />
      <span className="relative flex items-center gap-2"><IconLock /> Hold to unlock</span>
    </button>
  );
}

function Live() {
  const { user, online } = useApp();
  const router = useRouter();
  const t = useTracker();
  const [tiles, setTiles] = useState(0);
  const [locked, setLocked] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const saver = !!user.settings.dataSaver;
  const offline = !online || user.settings.offlineMode;
  const mb = 0.1 + tiles * 0.018 + t.points.length * 0.0002;
  const km = t.distance / 1000;
  const cal = Math.round(km * 72 * 1.02);
  const paused = t.status === 'paused';

  const finish = () => {
    setConfirm(false);
    const d = t.stop();
    if (d) router.push('/finish');
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg">
      <div className="mx-auto max-w-[560px] md:max-w-[720px] h-full flex flex-col pt-safe">
        <div className="relative h-[38dvh] min-h-[220px] shrink-0">
          <RouteMap live points={t.points} center={t.center} tiles={!saver} onTile={() => setTiles((n) => n + 1)} className="absolute inset-0" ariaLabel="Live route map" />
          <div className="absolute top-3 inset-x-3 flex flex-wrap gap-2 z-[500] pointer-events-none">
            <span className="chip bg-black/80 backdrop-blur text-lime border-lime/40">
              {offline ? <IconWifiOff size={16} /> : <IconBolt size={16} />} {offline ? 'Saving offline - will sync later' : 'Saved on device'}
            </span>
            <span className="chip bg-black/80 font-mono">{mb.toFixed(1)} MB used</span>
            {t.mode === 'sim' && <span className="chip bg-black/80 text-white/80">DEMO GPS ×{t.scale}</span>}
            {paused && <span className="chip bg-start border-start text-white">PAUSED</span>}
          </div>
          {t.gpsError && <div className="absolute bottom-3 inset-x-3 z-[500] rounded-xl bg-black/85 text-sm p-3 border border-start/60" role="alert">{t.gpsError}</div>}
        </div>

        <div className="flex-1 min-h-0 px-5 pt-4 flex flex-col justify-between">
          <div>
            <div className="label">Time</div>
            <div className="stat font-bold leading-none text-[68px] sm:text-[80px]" aria-live="off">{fmtDuration(t.elapsed)}</div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div><div className="label">Distance</div><div className="stat text-[32px] font-bold leading-none mt-1">{km.toFixed(2)}<span className="text-sm text-white/50 ml-1">km</span></div></div>
              <div><div className="label">Pace</div><div className="stat text-[32px] font-bold leading-none mt-1">{fmtPace(t.pace)}<span className="text-sm text-white/50 ml-1">/km</span></div></div>
              <div><div className="label">Calories</div><div className="stat text-[32px] font-bold leading-none mt-1">{cal}<span className="text-sm text-white/50 ml-1">kcal</span></div></div>
            </div>
          </div>

          <div className="grid grid-cols-[72px_1fr_72px] items-center gap-4 py-6 pb-safe">
            <button onClick={() => setLocked(true)} aria-label="Lock screen" className="w-[72px] h-[72px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center"><IconLock size={28} /></button>
            {paused ? (
              <button onClick={t.resume} className="btn-lime !min-h-[84px] !text-xl w-full"><IconPlay size={28} /> Resume</button>
            ) : (
              <button onClick={t.pause} className="btn !min-h-[84px] !text-xl w-full bg-white text-black"><IconPause size={28} /> Pause</button>
            )}
            <button onClick={() => (paused ? setConfirm(true) : (t.pause(), setConfirm(true)))} aria-label="Stop run" className="w-[72px] h-[72px] rounded-full bg-start flex items-center justify-center"><IconStop size={30} /></button>
          </div>
        </div>
      </div>

      {locked && (
        <div className="fixed inset-0 z-[55] bg-black flex flex-col items-center justify-center gap-8 px-8 text-center">
          <div className="stat text-[72px] font-bold">{fmtDuration(t.elapsed)}</div>
          <div className="stat text-4xl text-lime font-bold">{km.toFixed(2)} km</div>
          <p className="text-white/50 text-sm">Screen locked - no accidental taps in your pocket.</p>
          <HoldToUnlock onUnlock={() => setLocked(false)} />
        </div>
      )}

      <Sheet open={confirm} onClose={() => { setConfirm(false); }} title="Finish this run?">
        <p className="text-white/70 mb-5">{km.toFixed(2)} km in {fmtShort(t.elapsed)}. You can still keep going, boet.</p>
        <div className="grid gap-3">
          <button className="btn-lime" onClick={finish}>Finish &amp; review</button>
          <button className="btn-ghost" onClick={() => setConfirm(false)}>Keep going</button>
        </div>
      </Sheet>
    </div>
  );
}

export default function TrackPage() {
  const { user, runs, online } = useApp();
  const t = useTracker();
  const w = getWatch(user.watch);
  const last = runs[0];
  const weekKm = useMemo(() => {
    const s = startOfWeek(new Date(), { weekStartsOn: 1 });
    return runs.filter((r) => new Date(r.date) >= s).reduce((a, r) => a + r.distance, 0);
  }, [runs]);
  const pct = Math.min(1, weekKm / (user.goalKm || 20));
  const offline = !online || user.settings.offlineMode;
  const hr = new Date().getHours();
  const hi = hr < 12 ? 'Sharp morning' : hr < 18 ? 'Howzit' : 'Evening';

  if (t.status !== 'idle') return <Live />;

  return (
    <div className="px-5 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{format(new Date(), 'EEEE d MMMM')} · {cityLabel(user.city)}</p>
          <h1 className="text-[34px] leading-none uppercase mt-1">{hi}, <span className="text-lime">{user.name.split(' ')[0]}</span></h1>
        </div>
        <span className={`chip ${offline ? 'text-lime border-lime/40' : ''}`}>{offline ? <IconWifiOff size={14} /> : <IconBolt size={14} />}{offline ? 'Offline-ready' : 'Online'}</span>
      </header>

      <section aria-label="Weekly goal" className="mt-5 glass p-4">
        <div className="flex items-baseline justify-between">
          <span className="label">This week</span>
          <span className="stat text-sm"><b className="text-lime text-lg">{weekKm.toFixed(1)}</b> / {user.goalKm} km</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Weekly goal progress">
          <div className="h-full bg-lime rounded-full transition-all" style={{ width: `${pct * 100}%` }} />
        </div>
      </section>

      <section className="flex flex-col items-center py-9" aria-label="Start a run">
        <button
          onClick={t.start}
          aria-label="Start run"
          className="pulse-ring relative w-[252px] h-[252px] rounded-full bg-start text-white flex flex-col items-center justify-center active:scale-95 transition-transform border-[6px] border-white/90 shadow-[0_0_0_10px_rgba(255,59,48,0.18)]"
        >
          <span className="font-heading font-extrabold uppercase text-[44px] leading-[0.9]">Start</span>
          <span className="font-heading font-extrabold uppercase text-[44px] leading-[0.9]">Run</span>
        </button>
        <p className="mt-6 font-heading font-extrabold uppercase text-center text-lg leading-snug">Press Start. Run. Done.<br /><span className="text-lime">No subscription.</span></p>
      </section>

      <section aria-label="GPS source" className="glass p-4">
        <div className="label mb-2">GPS source</div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="GPS source">
          {[['sim', 'Demo GPS', `Simulated run, ×6 speed`], ['gps', 'Real GPS', 'Uses this phone']].map(([v, a, b]) => (
            <button key={v} role="radio" aria-checked={t.mode === v} onClick={() => t.setMode(v)} className={`text-left p-3 rounded-2xl border-2 min-h-[64px] ${t.mode === v ? 'border-lime bg-lime/10' : 'border-white/15'}`}>
              <span className="block font-bold">{a}</span>
              <span className="block text-xs text-white/55">{b}</span>
            </button>
          ))}
        </div>
        <Link href="/connect" className="mt-3 flex items-center gap-3 min-h-[52px]">
          <WatchLogo id={w.id} size={36} />
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold truncate">{w.short} · {w.gps}</span><span className="block text-xs text-white/55">via {w.app} · tap to manage watches</span></span>
          <span className="text-lime text-sm font-bold">Connect →</span>
        </Link>
      </section>

      {last && (
        <Link href={`/run/${last.id}`} className="mt-4 card p-3 flex items-center gap-3 min-h-[88px]">
          <MiniRoute points={last.points} className="w-24 h-16 rounded-xl overflow-hidden shrink-0" w={192} h={128} pad={14} />
          <span className="min-w-0 flex-1">
            <span className="label block">Last run · {format(new Date(last.date), 'EEE d MMM')}</span>
            <span className="block font-bold truncate">{last.place}</span>
            <span className="stat text-sm text-white/75">{last.distance.toFixed(2)} km · {fmtShort(last.duration)} · {fmtPace(last.avgPace)}/km</span>
          </span>
        </Link>
      )}
    </div>
  );
}
