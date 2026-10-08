'use client';
import { useMemo, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import ConnectSheet from '@/components/ConnectSheet';
import Sheet from '@/components/Sheet';
import MiniRoute from '@/components/MiniRoute';
import { WatchLogo, PageHeader } from '@/components/ui';
import { IconSync, IconWatch, IconDownload, IconShield, IconCheck } from '@/components/Icons';
import { WATCHES, getWatch } from '@/lib/watches';
import { generateSyncRuns } from '@/lib/mock';
import { fmtShort, fmtPace, timeAgo } from '@/lib/format';
import { format } from 'date-fns';

const FLOW = [
  ['⌚', 'Watch'],
  ['📱', 'Native app'],
  ['❤️', 'Health Connect'],
  ['⚡', 'VUKA'],
  ['📤', 'Strava / Google Health'],
];

export default function ConnectPage() {
  const { user, runs, devices, setDevice, addRuns, toast } = useApp();
  const [brand, setBrand] = useState(null);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [found, setFound] = useState(null);
  const connected = Object.entries(devices);
  const have = useMemo(() => new Set(runs.map((r) => r.id)), [runs]);

  const pick = (id) => { setBrand(getWatch(id)); setOpen(true); };

  const syncNow = () => {
    const live = connected.filter(([, d]) => d.perms?.gps !== false).map(([id]) => id);
    if (!live.length) { toast('Connect a watch first', 'err'); return; }
    setSyncing(true);
    Object.keys(devices).forEach((id) => setDevice(id, { status: 'syncing' }));
    setTimeout(() => {
      const list = generateSyncRuns({ userId: user.id, city: user.city, brands: live });
      Object.entries(devices).forEach(([id, d]) => setDevice(id, { status: 'synced', lastSync: Date.now(), battery: Math.max(5, (d.battery ?? 60) - 1) }));
      setFound(list);
      setSyncing(false);
    }, 1800);
  };

  const fresh = found ? found.filter((r) => !have.has(r.id)) : [];

  return (
    <div>
      <PageHeader title="Connect any watch - 1 tap" sub="Polaroid, Amazfit, Huawei, Garmin and every budget brand in between." />

      <section className="px-5" aria-label="Connected devices">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg uppercase">Your watches</h2>
          <button onClick={syncNow} disabled={syncing} className="btn-lime !min-h-[48px] !px-5 !text-sm">
            <IconSync size={18} className={syncing ? 'blink' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </div>
        {connected.length === 0 && (
          <div className="card p-6 text-center text-white/60"><IconWatch size={32} className="mx-auto mb-2 text-lime" />No watch connected yet. Pick your brand below - it takes one tap.</div>
        )}
        <ul className="space-y-2">
          {connected.map(([id, d]) => {
            const w = getWatch(id);
            return (
              <li key={id}>
                <button onClick={() => pick(id)} className="w-full glass p-3 flex items-center gap-3 text-left min-h-[76px]" aria-label={`${w.name}, manage`}>
                  <WatchLogo id={id} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold truncate">{w.short}</span>
                    <span className="block text-xs text-white/55">{w.app} · {d.status === 'syncing' ? 'Syncing…' : `synced ${timeAgo(d.lastSync)}`}</span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="flex items-center justify-end gap-1.5 text-xs font-bold">
                      <span className={`w-2.5 h-2.5 rounded-full ${d.status === 'syncing' ? 'bg-yellow-400 blink' : 'bg-[#22c55e]'}`} aria-hidden="true" />
                      {d.status === 'syncing' ? 'Syncing' : 'Synced'}
                    </span>
                    <span className="mt-1.5 flex items-center justify-end gap-1.5" aria-label={`Battery ${d.battery}%`}>
                      <span className="w-9 h-3 rounded-[3px] border border-white/50 p-[1.5px]"><span className={`block h-full rounded-[1.5px] ${d.battery < 20 ? 'bg-start' : 'bg-lime'}`} style={{ width: `${d.battery}%` }} /></span>
                      <span className="stat text-[11px] text-white/70">{d.battery}%</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-white/35 mt-2">Battery &amp; sync times are simulated in this demo build.</p>
      </section>

      <section className="px-5 mt-8" aria-label="How syncing works">
        <h2 className="text-lg uppercase mb-3">How it flows</h2>
        <div className="card p-4">
          <ol className="flex items-stretch gap-1 overflow-x-auto no-scrollbar">
            {FLOW.map(([e, t], i) => (
              <li key={t} className="flex items-center gap-1 shrink-0">
                <div className={`w-[84px] h-[96px] rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center px-1 ${t === 'VUKA' ? 'bg-lime text-black' : 'bg-white/5 border border-white/10'}`}>
                  <span className="text-2xl" aria-hidden="true">{e}</span>
                  <span className="text-[11px] font-bold leading-tight">{t}</span>
                </div>
                {i < FLOW.length - 1 && <span className="text-lime text-xl font-bold" aria-hidden="true">›</span>}
              </li>
            ))}
          </ol>
          <p className="text-xs text-white/55 mt-3">Your watch talks to its own app. That app drops runs into Health Connect. VUKA picks them up and can pass them on to Strava or Google Health. On iPhone, or if your app has no Health Connect, drop a GPX / TCX / FIT file instead.</p>
        </div>
      </section>

      <section className="px-5 mt-8" aria-label="All supported watches">
        <h2 className="text-lg uppercase mb-3">All SA watch brands</h2>
        <ul className="grid grid-cols-2 gap-3">
          {WATCHES.map((w) => {
            const on = !!devices[w.id];
            return (
              <li key={w.id}>
                <button onClick={() => pick(w.id)} className={`w-full h-full text-left p-3 rounded-2xl border-2 min-h-[128px] flex flex-col gap-2 ${on ? 'border-lime bg-lime/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
                  <div className="flex items-center justify-between">
                    <WatchLogo id={w.id} size={44} />
                    {on ? <IconCheck size={20} className="text-lime" /> : null}
                  </div>
                  <span className="font-bold leading-tight text-[15px]">{w.id === 'generic' ? 'Any watch' : w.short}</span>
                  <span className="text-[11px] text-white/55 leading-tight -mt-1">{w.models}</span>
                  <span className="mt-auto text-xs"><span className="text-white/50">via </span><b>{w.app}</b></span>
                  <span className={`text-[11px] font-bold uppercase tracking-wide ${on ? 'text-lime' : 'text-white/40'}`}>{on ? '● Connected' : w.kind ? 'Tap to import' : 'Tap to connect'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ConnectSheet brand={brand} open={open} onClose={() => setOpen(false)} />

      <Sheet open={!!found} onClose={() => setFound(null)} title="Last 7 days" tall>
        {found && (
          <>
            <p className="text-sm text-white/65 mb-4">{fresh.length ? `Found ${fresh.length} new run${fresh.length > 1 ? 's' : ''} on your watches. Lekker!` : 'You are all caught up. Nothing new on your watches.'}</p>
            {fresh.length > 0 && <button className="btn-lime w-full mb-4" onClick={() => { addRuns(fresh); toast(`${fresh.length} runs added`); setFound(null); }}><IconDownload size={20} /> Add all {fresh.length}</button>}
            <ul className="space-y-2">
              {found.map((r) => {
                const added = have.has(r.id);
                const w = getWatch(r.watch);
                return (
                  <li key={r.id} className="card p-3 flex items-center gap-3">
                    <MiniRoute points={r.points} className="w-20 h-14 rounded-lg overflow-hidden shrink-0" w={160} h={112} pad={12} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold truncate">{r.place}</span>
                      <span className="block stat text-xs text-white/70">{r.distance.toFixed(2)} km · {fmtShort(r.duration)} · {fmtPace(r.avgPace)}</span>
                      <span className="block text-[11px] text-white/45">{format(new Date(r.date), 'EEE d MMM, HH:mm')} · {w.short}</span>
                    </span>
                    {added ? <span className="text-lime text-xs font-bold flex items-center gap-1"><IconCheck size={16} /> Added</span> : <button className="chip chip-on" onClick={() => addRuns([r])}>Add</button>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Sheet>
    </div>
  );
}
