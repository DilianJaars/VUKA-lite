'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppProvider';
import RouteMap from '@/components/RouteMap';
import Sheet from '@/components/Sheet';
import { Stat, Stars, Toggle, Segmented } from '@/components/ui';
import { IconShield, IconShare } from '@/components/Icons';
import { fmtDuration, fmtPace } from '@/lib/format';
import { getWatch } from '@/lib/watches';
import { feelEmoji } from '@/lib/mock';
import { toGPX } from '@/lib/gpx';
import { putFile } from '@/lib/idb';
import { shareToWhatsApp } from '@/lib/share';

export default function FinishPage() {
  const { draft, setDraft, saveRun, user, updateSettings, toast } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [feel, setFeel] = useState(4);
  const [rating, setRating] = useState(0);
  const [night, setNight] = useState(false);
  const [privacy, setPrivacy] = useState('friends');
  const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);

  useEffect(() => { if (!draft) { if (!leaving.current) router.replace('/'); } else setName((n) => n || draft.name); }, [draft, router]);
  if (!draft) return null;

  const w = getWatch(draft.watch);
  const auto = user.settings.autoSync;
  const build = () => ({ ...draft, name: name.trim() || draft.name, feel, privacy, safety: { rating, night }, syncQueued: auto ? ['Strava', 'Google Health'] : [] });

  const save = async () => {
    setBusy(true);
    const run = build();
    saveRun(run);
    await putFile(`run:${run.id}`, { name: `${run.id}.gpx`, type: 'gpx', data: toGPX(run) });
    leaving.current = true;
    setDraft(null);
    toast(auto ? 'Lekker! Saved - queued for Strava & Google Health' : 'Lekker! Run saved');
    router.replace(`/run/${run.id}`);
  };

  const share = async () => {
    const r = await shareToWhatsApp(build(), user.name);
    if (r === 'downloaded') toast('Image saved - attach it in WhatsApp');
  };

  return (
    <div className="pb-6">
      <div className="relative">
        <RouteMap points={draft.points} className="w-full h-[40dvh] min-h-[260px]" ariaLabel="Your route" />
        <div className="absolute left-3 bottom-3 z-[500] chip bg-black/85 text-white border-white/20">{w.short} - {w.gps}</div>
      </div>

      <div className="px-5 pt-5">
        <div className="label text-lime">Run complete · Sharp!</div>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Run name" className="mt-1 w-full bg-transparent font-heading font-extrabold text-3xl uppercase border-b-2 border-white/15 focus:border-lime outline-none pb-1" />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat big label="Distance" value={draft.distance.toFixed(2)} unit="km" className="col-span-2" />
          <Stat label="Time" value={fmtDuration(draft.duration)} />
          <Stat label="Avg pace" value={fmtPace(draft.avgPace)} unit="/km" />
          <Stat label="Best pace" value={fmtPace(draft.bestPace)} unit="/km" />
          <Stat label="Elevation gain" value={draft.elevGain} unit="m" />
          <Stat label="Calories" value={draft.calories} unit="kcal" />
          <div className="glass p-4 flex flex-col justify-between">
            <div className="label">Watch source</div>
            <div className="font-bold text-sm mt-1 leading-tight">{w.short} - {w.gps}</div>
          </div>
        </div>

        <section className="mt-6 card p-4" aria-label="How did it feel">
          <div className="label mb-3">How did it feel?</div>
          <div className="flex justify-between" role="radiogroup" aria-label="How did it feel">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={feel === n} aria-label={['Rough', 'Meh', 'Okay', 'Good', 'On fire'][n - 1]} onClick={() => setFeel(n)} className={`w-[56px] h-[56px] rounded-2xl text-3xl flex items-center justify-center border-2 ${feel === n ? 'border-lime bg-lime/15 scale-110' : 'border-white/10'} transition-transform`}>{feelEmoji[n]}</button>
            ))}
          </div>
        </section>

        <section className="mt-3 card p-4" aria-label="Route safety">
          <div className="flex items-center gap-2 label mb-3"><IconShield size={16} /> Rate this route&apos;s safety</div>
          <Stars value={rating} onChange={setRating} size={34} />
          <Toggle on={night} onChange={setNight} label="Felt safe at night" sub="Helps other runners pick safe routes" />
        </section>

        <section className="mt-3 card p-4" aria-label="Who can see this">
          <div className="label mb-2">Who can see this run</div>
          <Segmented label="Privacy" value={privacy} onChange={setPrivacy} options={[{ value: 'public', label: 'Public' }, { value: 'friends', label: 'Friends' }, { value: 'private', label: 'Private' }]} />
          <Toggle on={auto} onChange={(v) => updateSettings({ autoSync: v })} label="Auto-sync to Google Health / Strava" sub={auto ? 'Queued when you save. Export from your dashboard to push to Strava.' : 'Off - run stays on your phone only'} />
        </section>

        <div className="mt-6 grid gap-3">
          <button className="btn-lime" onClick={save} disabled={busy}>Save run</button>
          <button className="btn bg-[#25D366] text-black" onClick={share}><IconShare size={22} /> Share to WhatsApp</button>
          <button className="btn-ghost !text-start border-start/40 text-start" onClick={() => setDiscard(true)} style={{ color: '#FF3B30' }}>Discard</button>
        </div>
      </div>

      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard this run?">
        <p className="text-white/70 mb-5">{draft.distance.toFixed(2)} km will be gone for good. No ways back, boet.</p>
        <div className="grid gap-3">
          <button className="btn-red" onClick={() => { leaving.current = true; setDraft(null); router.replace('/'); }}>Yes, discard</button>
          <button className="btn-ghost" onClick={() => setDiscard(false)}>Keep it</button>
        </div>
      </Sheet>
    </div>
  );
}
