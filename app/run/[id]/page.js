'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useApp } from '@/components/AppProvider';
import RouteMap from '@/components/RouteMap';
import Sheet from '@/components/Sheet';
import { Stat, Stars, WatchLogo, Segmented, Avatar } from '@/components/ui';
import { IconBack, IconEdit, IconTrash, IconShare, IconDownload, IconShield } from '@/components/Icons';
import { generateFeed, getRoute, weatherFor, feelEmoji } from '@/lib/mock';
import { runCum, splitsOf } from '@/lib/geo';
import { fmtDuration, fmtPace, fmtShort } from '@/lib/format';
import { getWatch } from '@/lib/watches';
import { toGPX, download } from '@/lib/gpx';
import { getFile } from '@/lib/idb';
import { shareToWhatsApp } from '@/lib/share';

const ProfileChart = dynamic(() => import('@/components/Charts').then((m) => m.ProfileChart), { ssr: false, loading: () => <div className="skeleton h-[160px] rounded-xl" /> });

export default function RunDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, runs, ready, deleteRun, updateRun, toast, likes, toggleLike } = useApp();
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [name, setName] = useState('');
  const [feel, setFeel] = useState(4);
  const [privacy, setPrivacy] = useState('friends');
  const [extra, setExtra] = useState([]);
  const [text, setText] = useState('');

  const feed = useMemo(() => generateFeed(), []);
  const mine = runs.find((r) => r.id === id);
  const fi = feed.find((f) => f.id === id);
  const run = mine || fi?.run;
  const route = run ? getRoute(run.routeId) : null;

  useEffect(() => { if (mine) { setName(mine.name); setFeel(mine.feel || 4); setPrivacy(mine.privacy || 'friends'); } }, [mine?.id]); // eslint-disable-line
  useEffect(() => {
    if (!route) return;
    try { setExtra(JSON.parse(localStorage.getItem(`vuka:comments:${route.id}`) || '[]')); } catch {}
  }, [route?.id]); // eslint-disable-line

  const chart = useMemo(() => {
    if (!run) return { ele: [], hr: [] };
    const cum = runCum(run);
    const step = Math.max(1, Math.floor(run.points.length / 160));
    const rows = run.points.filter((_, i) => i % step === 0).map((p, i) => ({ km: +(cum[i * step] / 1000).toFixed(3), ele: p[2], hr: p[4] }));
    return { ele: rows, hr: rows.filter((r) => r.hr > 0) };
  }, [run]);
  const splits = useMemo(() => (run ? splitsOf(run) : []), [run]);
  const weather = useMemo(() => (run ? weatherFor(run) : null), [run]);

  if (!ready) return null;
  if (!run) {
    return (
      <div className="px-5 pt-16 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🤷</div>
        <h1 className="text-3xl uppercase">Run not found</h1>
        <p className="text-white/60 mt-2 mb-6">It may have been deleted, or it lives on another phone.</p>
        <Link href="/dashboard" className="btn-lime">Back to dashboard</Link>
      </div>
    );
  }

  const w = getWatch(run.watch);
  const author = fi ? fi.user.name : user.name;
  const bestSplit = splits.length ? Math.min(...splits.filter((s) => s.dist > 0.9).map((s) => s.pace)) : 0;
  const maxPace = splits.length ? Math.max(...splits.map((s) => s.pace)) : 1;

  const exportGpx = async () => {
    const stored = await getFile(`run:${run.id}`);
    if (stored && stored.type === 'gpx' && typeof stored.data === 'string') download(`${run.name.replace(/\W+/g, '-')}.gpx`, stored.data);
    else download(`${run.name.replace(/\W+/g, '-')}.gpx`, toGPX(run));
    toast('GPX downloaded');
  };

  const share = async () => {
    const r = await shareToWhatsApp(run, author);
    if (r === 'downloaded') toast('Image saved - attach it in WhatsApp');
  };

  const postComment = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const next = [{ name: user.name, text: text.trim(), ago: 'just now' }, ...extra];
    setExtra(next); setText('');
    try { localStorage.setItem(`vuka:comments:${route.id}`, JSON.stringify(next.slice(0, 20))); } catch {}
  };

  const comments = [...extra, ...route.comments];

  return (
    <div className="pb-6">
      <div className="relative">
        <RouteMap points={run.points} className="w-full h-[42dvh] min-h-[280px]" ariaLabel={`Map of ${run.place}`} />
        <button onClick={() => router.back()} aria-label="Back" className="absolute top-3 left-3 z-[500] w-12 h-12 rounded-full bg-black/80 flex items-center justify-center border border-white/20"><IconBack /></button>
        <span className="absolute left-3 bottom-3 z-[500] chip bg-black/85 border-white/20"><WatchLogo id={w.id} size={22} /> {w.short} - {w.gps}</span>
      </div>

      <div className="px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label">{format(new Date(run.date), 'EEEE d MMMM yyyy · HH:mm')}</div>
            <h1 className="text-3xl uppercase leading-none mt-1">{run.name}</h1>
            <div className="text-sm text-white/60 mt-1">{run.place} · {author}</div>
          </div>
          <div className="text-4xl" aria-label="How it felt">{feelEmoji[run.feel || 4]}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat big className="col-span-2" label="Distance" value={run.distance.toFixed(2)} unit="km" />
          <Stat label="Time" value={fmtDuration(run.duration)} />
          <Stat label="Avg pace" value={fmtPace(run.avgPace)} unit="/km" />
          <Stat label="Best pace" value={fmtPace(run.bestPace)} unit="/km" />
          <Stat label="Elevation gain" value={run.elevGain} unit="m" />
          <Stat label="Calories" value={run.calories} unit="kcal" />
          <Stat label="Avg heart rate" value={run.avgHr || '-'} unit={run.avgHr ? 'bpm' : ''} />
        </div>

        {weather && (
          <section className="mt-4 glass p-4 flex items-center gap-4" aria-label="Weather">
            <div className="text-4xl" aria-hidden="true">{weather.icon}</div>
            <div className="flex-1">
              <div className="font-bold">{weather.label}, {weather.temp}°C</div>
              <div className="text-xs text-white/55">Wind {weather.wind} km/h · Humidity {weather.humidity}%</div>
            </div>
            <span className="text-[10px] uppercase tracking-wide text-white/35">Mock weather</span>
          </section>
        )}

        <section className="mt-6" aria-label="Splits">
          <h2 className="text-xl uppercase mb-3">Splits</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm stat">
              <thead><tr className="text-left label"><th className="p-3">Km</th><th className="p-3">Pace</th><th className="p-3 w-[34%]" aria-label="Relative speed"></th><th className="p-3 text-right">Elev</th><th className="p-3 text-right">HR</th></tr></thead>
              <tbody>
                {splits.map((s) => (
                  <tr key={s.km} className="border-t border-white/5">
                    <td className="p-3 font-bold">{s.dist < 0.95 ? s.dist.toFixed(2) : s.km}</td>
                    <td className={`p-3 ${s.pace === bestSplit ? 'text-lime font-bold' : ''}`}>{fmtPace(s.pace)}</td>
                    <td className="p-3"><div className="h-2.5 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full ${s.pace === bestSplit ? 'bg-lime' : 'bg-white/50'}`} style={{ width: `${Math.max(12, 100 - ((s.pace - bestSplit) / (maxPace - bestSplit || 1)) * 55)}%` }} /></div></td>
                    <td className="p-3 text-right text-white/70">{s.elev > 0 ? '+' : ''}{s.elev} m</td>
                    <td className="p-3 text-right text-white/70">{s.hr || '-'}</td>
                  </tr>
                ))}
                {splits.length === 0 && <tr><td className="p-4 text-white/50" colSpan={5}>Run too short for splits.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {chart.hr.length > 3 && (
          <section className="mt-6 card p-4" aria-label="Heart rate">
            <h2 className="text-lg uppercase mb-1">Heart rate</h2>
            <p className="text-xs text-white/50 mb-2">Avg {run.avgHr} · Max {run.maxHr} bpm</p>
            <ProfileChart data={chart.hr} dataKey="hr" color="#FF3B30" unit="bpm" id="hr" />
          </section>
        )}

        <section className="mt-4 card p-4" aria-label="Elevation">
          <h2 className="text-lg uppercase mb-1">Elevation</h2>
          <p className="text-xs text-white/50 mb-2">+{run.elevGain} m climbed</p>
          <ProfileChart data={chart.ele} dataKey="ele" color="#FB923C" unit="m" id="ele" />
        </section>

        <section id="comments" className="mt-6" aria-label="Route safety">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl uppercase flex items-center gap-2"><IconShield size={22} className="text-lime" /> Route safety</h2>
            <div className="text-right"><Stars value={route.safety.rating} size={16} /><div className="text-[11px] text-white/50">{route.safety.rating}/5 · {route.safety.reviews} locals{route.safety.night ? ' · safe at night' : ''}</div></div>
          </div>
          <form onSubmit={postComment} className="flex gap-2 mb-3">
            <input className="input" placeholder="Add a tip for other runners…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Add a safety comment" maxLength={200} />
            <button className="btn-lime !px-5">Post</button>
          </form>
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="card p-3 flex gap-3">
                <Avatar name={c.name} color="#38BDF8" size={36} />
                <div className="min-w-0"><div className="text-sm font-bold">{c.name} <span className="text-white/40 font-normal text-xs ml-1">{c.ago}</span></div><p className="text-sm text-white/75 mt-0.5">{c.text}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {mine && <button className="btn-ghost" onClick={() => setEdit(true)}><IconEdit size={20} /> Edit</button>}
          <button className="btn-ghost" onClick={share}><IconShare size={20} /> Share</button>
          <button className="btn-ghost" onClick={exportGpx}><IconDownload size={20} /> Export GPX</button>
          {mine && <button className="btn-ghost !text-[#FF3B30]" onClick={() => setDel(true)}><IconTrash size={20} /> Delete</button>}
          {fi && (
            <button className="btn-lime col-span-2" onClick={() => toggleLike(fi.id)}>🔥 {likes[fi.id] ? 'Fired up' : 'Give fire'} · {fi.likes + (likes[fi.id] ? 1 : 0)}</button>
          )}
        </div>
        {fi && <p className="mt-3 text-xs text-white/40 text-center">Sample run from the VUKA community feed.</p>}
      </div>

      <Sheet open={edit} onClose={() => setEdit(false)} title="Edit run">
        <div className="space-y-4">
          <div><label className="label" htmlFor="rn">Name</label><input id="rn" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div>
            <div className="label mb-2">How did it feel</div>
            <div className="flex justify-between">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setFeel(n)} aria-label={`Feel ${n}`} aria-pressed={feel === n} className={`w-[56px] h-[56px] rounded-2xl text-3xl border-2 ${feel === n ? 'border-lime bg-lime/15' : 'border-white/10'}`}>{feelEmoji[n]}</button>)}</div>
          </div>
          <div><div className="label mb-2">Who can see this</div><Segmented label="Privacy" value={privacy} onChange={setPrivacy} options={[{ value: 'public', label: 'Public' }, { value: 'friends', label: 'Friends' }, { value: 'private', label: 'Private' }]} /></div>
          <button className="btn-lime w-full" onClick={() => { updateRun(run.id, { name: name.trim() || run.name, feel, privacy }); setEdit(false); toast('Saved'); }}>Save changes</button>
        </div>
      </Sheet>

      <Sheet open={del} onClose={() => setDel(false)} title="Delete this run?">
        <p className="text-white/70 mb-5">{run.distance.toFixed(2)} km on {format(new Date(run.date), 'd MMM')} will be removed from this phone. Export the GPX first if you want to keep it.</p>
        <div className="grid gap-3">
          <button className="btn-red" onClick={() => { deleteRun(run.id); toast('Run deleted'); router.replace('/dashboard'); }}>Yes, delete</button>
          <button className="btn-ghost" onClick={() => setDel(false)}>Keep it</button>
        </div>
      </Sheet>
    </div>
  );
}
