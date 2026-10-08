'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import Sheet from '@/components/Sheet';
import { Avatar, Toggle, ComparisonTable, WatchLogo } from '@/components/ui';
import { computeStats, achievementsOf } from '@/lib/stats';
import { CITIES, getWatch } from '@/lib/watches';
import { generateMockRuns } from '@/lib/mock';
import { countFiles } from '@/lib/idb';
import { fmtBytes } from '@/lib/format';

function Group({ title, children }) {
  return (
    <section className="card p-4 mt-4" aria-label={title}>
      <h2 className="text-lg uppercase mb-1">{title}</h2>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { user, runs, devices, updateUser, updateSettings, logout, addRuns, toast, canInstall, install } = useApp();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [confirm, setConfirm] = useState(false);
  const [store, setStore] = useState({ ls: 0, files: 0, usage: null, quota: null });
  const s = user.settings;
  const stats = useMemo(() => computeStats(runs), [runs]);
  const badges = useMemo(() => achievementsOf(runs, stats), [runs, stats]);

  const measure = async () => {
    let ls = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('vuka:')) ls += (k.length + localStorage.getItem(k).length) * 2; } } catch {}
    const files = await countFiles();
    let usage = null, quota = null;
    try { const e = await navigator.storage?.estimate?.(); usage = e?.usage ?? null; quota = e?.quota ?? null; } catch {}
    setStore({ ls, files, usage, quota });
  };
  useEffect(() => { measure(); }, [runs.length]); // eslint-disable-line

  const clearTiles = async () => {
    try { await caches.delete('vuka-tiles-v1'); toast('Cached maps cleared'); } catch { toast('Nothing to clear'); }
    measure();
  };

  const notif = s.notif;
  const pct = store.quota ? Math.min(100, ((store.usage || 0) / store.quota) * 100) : 0;

  return (
    <div className="px-5 pt-6 pb-4">
      <header className="flex items-center gap-4">
        <Avatar name={user.name} color={user.color} size={72} />
        <div className="min-w-0">
          <h1 className="text-[28px] leading-none uppercase truncate">{user.name}</h1>
          <p className="text-sm text-white/55 mt-1 truncate">{user.id.startsWith('google') ? 'Google account' : user.id.replace(/^(phone|email):/, user.id.startsWith('phone') ? '+' : '')}</p>
          <p className="text-xs text-lime font-bold mt-1">Level {stats.level.level} Runner · {stats.totalKm.toFixed(0)} km</p>
        </div>
      </header>

      <Group title="Settings">
        <div className="py-3">
          <label className="label" htmlFor="nm">Name</label>
          <input id="nm" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => { const n = name.trim(); if (n && n !== user.name) { updateUser({ name: n }); toast('Name updated'); } else setName(user.name); }} />
        </div>
        <div className="py-3">
          <div className="label mb-2">Location</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Location">
            {CITIES.map((c) => <button key={c.id} role="radio" aria-checked={user.city === c.id} onClick={() => updateUser({ city: c.id })} className={`chip !min-h-[44px] ${user.city === c.id ? 'chip-on' : ''}`}>{c.label}</button>)}
          </div>
        </div>
        <div className="py-3 flex items-center justify-between">
          <div><div className="font-semibold">Weekly goal</div><div className="text-xs text-white/55">Kilometres per week</div></div>
          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-full bg-white/10 text-xl font-bold" aria-label="Decrease goal" onClick={() => updateUser({ goalKm: Math.max(5, user.goalKm - 5) })}>−</button>
            <span className="stat text-xl font-bold w-12 text-center text-lime">{user.goalKm}</span>
            <button className="w-11 h-11 rounded-full bg-white/10 text-xl font-bold" aria-label="Increase goal" onClick={() => updateUser({ goalKm: Math.min(150, user.goalKm + 5) })}>+</button>
          </div>
        </div>
        <div className="py-3 flex items-center justify-between"><div className="font-semibold">Units</div><span className="chip chip-on">Kilometres · min/km</span></div>
        <div className="divide-y divide-white/10 border-t border-white/10">
          <Toggle on={s.dataSaver} onChange={(v) => updateSettings({ dataSaver: v })} label="Data saver mode" sub="No map tiles, no blur effects. Routes still draw. Saves airtime." />
          <Toggle on={s.offlineMode} onChange={(v) => updateSettings({ offlineMode: v })} label="Offline mode" sub="Save everything on your phone first, sync later. Loadshedding proof." />
        </div>
        <div className="py-3 border-t border-white/10">
          <div className="label mb-1">Primary watch</div>
          <div className="flex items-center gap-3"><WatchLogo id={user.watch} size={36} /><span className="font-bold">{getWatch(user.watch).name}</span></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
            {Object.keys(devices).map((id) => <button key={id} onClick={() => updateUser({ watch: id })} className={`chip !min-h-[44px] ${user.watch === id ? 'chip-on' : ''}`}>{getWatch(id).short}</button>)}
          </div>
        </div>
      </Group>

      <Group title="Connected accounts">
        <div className="divide-y divide-white/10">
          <Toggle on={s.accounts.strava} onChange={(v) => { updateSettings({ accounts: { ...s.accounts, strava: v } }); toast(v ? 'Strava linked (demo)' : 'Strava unlinked'); }} label="Strava" sub="Demo: export GPX from the dashboard to push runs" />
          <Toggle on={s.accounts.health} onChange={(v) => { updateSettings({ accounts: { ...s.accounts, health: v } }); toast(v ? 'Google Health linked (demo)' : 'Google Health unlinked'); }} label="Google Health / Health Connect" sub="Demo: simulated on this device" />
          <Toggle on={s.autoSync} onChange={(v) => updateSettings({ autoSync: v })} label="Auto-sync new runs" sub="Queue finished runs for your linked accounts" />
        </div>
      </Group>

      <Group title="Notifications">
        <div className="divide-y divide-white/10">
          <Toggle on={notif.reminders} onChange={(v) => updateSettings({ notif: { ...notif, reminders: v } })} label="Run reminders" sub="A nudge on your usual run days" />
          <Toggle on={notif.streak} onChange={(v) => updateSettings({ notif: { ...notif, streak: v } })} label="Streak alerts" sub="Don't lose your Vuka streak" />
          <Toggle on={notif.weekly} onChange={(v) => updateSettings({ notif: { ...notif, weekly: v } })} label="Weekly summary" sub="Monday morning recap" />
        </div>
      </Group>

      <Group title="Achievements">
        <p className="text-xs text-white/50 mb-3">{badges.filter((b) => b.done).length} of {badges.length} unlocked</p>
        <ul className="grid grid-cols-2 gap-3">
          {badges.map((b) => (
            <li key={b.id} className={`rounded-2xl p-3 border ${b.done ? 'border-lime/50 bg-lime/10' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className={`text-3xl ${b.done ? '' : 'grayscale opacity-50'}`} aria-hidden="true">{b.icon}</div>
              <div className="font-bold text-sm mt-1 leading-tight">{b.name}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{b.done ? 'Unlocked ✓' : b.label || b.desc}</div>
              {!b.done && b.progress != null && <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full bg-lime" style={{ width: `${b.progress * 100}%` }} /></div>}
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Storage">
        <dl className="text-sm space-y-2 mt-2">
          <div className="flex justify-between"><dt className="text-white/60">Runs &amp; settings (localStorage)</dt><dd className="stat font-bold">{fmtBytes(store.ls)}</dd></div>
          <div className="flex justify-between"><dt className="text-white/60">GPX files (IndexedDB)</dt><dd className="stat font-bold">{store.files}</dd></div>
          {store.usage != null && <div className="flex justify-between"><dt className="text-white/60">Total on this phone</dt><dd className="stat font-bold">{fmtBytes(store.usage)}</dd></div>}
        </dl>
        {store.quota && <div className="h-2 rounded-full bg-white/10 mt-3 overflow-hidden" aria-hidden="true"><div className="h-full bg-lime" style={{ width: `${Math.max(1, pct)}%` }} /></div>}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button className="btn-ghost !min-h-[48px] !text-xs" onClick={clearTiles}>Clear cached maps</button>
          <button className="btn-ghost !min-h-[48px] !text-xs" onClick={() => { addRuns(generateMockRuns({ userId: user.id, city: user.city, watch: user.watch })); toast('Demo runs restored'); }}>Restore demo runs</button>
        </div>
      </Group>

      {canInstall && (
        <button className="btn-lime w-full mt-4" onClick={install}>Install VUKA on your home screen</button>
      )}

      <section className="mt-8" aria-label="Why VUKA">
        <h2 className="text-lg uppercase mb-3">Why VUKA Lite?</h2>
        <ComparisonTable />
      </section>

      <button className="btn-ghost w-full mt-8" onClick={() => setConfirm(true)}>Log out</button>
      <p className="text-center text-xs text-white/30 mt-4">VUKA Lite v1.0 · Map data © OpenStreetMap contributors · Lekker</p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Log out?">
        <p className="text-white/70 mb-5">Your runs stay safe on this phone. Log back in with the same {user.method === 'phone' ? 'number' : user.method === 'email' ? 'email' : 'account'} and everything is waiting for you.</p>
        <div className="grid gap-3">
          <button className="btn-red" onClick={() => { logout(); router.replace('/login'); }}>Log out</button>
          <button className="btn-ghost" onClick={() => setConfirm(false)}>Stay</button>
        </div>
      </Sheet>
    </div>
  );
}
