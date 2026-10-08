'use client';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './AppProvider';
import Sheet from './Sheet';
import RouteMap from './RouteMap';
import { WatchLogo, Toggle, Stat } from './ui';
import { IconUpload, IconLink, IconSync } from './Icons';
import { parseActivityFile } from '@/lib/gpx';
import { putFile } from '@/lib/idb';
import { generateStravaRun } from '@/lib/mock';
import { fmtDuration, fmtPace } from '@/lib/format';

const PERMS = [
  ['steps', 'Steps', 'Daily step count'],
  ['hr', 'Heart rate', 'Live + average BPM on runs'],
  ['gps', 'GPS routes', 'Needed to draw your run on the map'],
  ['sleep', 'Sleep', 'Optional - helps recovery tips'],
];

function Preview({ result, name, setName, onSave, saving, note }) {
  const s = result.summary;
  return (
    <div className="mt-4 space-y-3">
      <RouteMap points={result.points} className="w-full h-44 rounded-2xl overflow-hidden" interactive={false} ariaLabel="Parsed route" />
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Run name" />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Distance" value={s.distance.toFixed(2)} unit="km" />
        <Stat label="Time" value={fmtDuration(s.duration)} />
        <Stat label="Pace" value={fmtPace(s.avgPace)} />
        <Stat label="Elev" value={s.elevGain} unit="m" />
        <Stat label="Avg HR" value={s.avgHr || '-'} />
        <Stat label="Points" value={result.points.length} />
      </div>
      {note && <p className="text-xs text-white/50">{note}</p>}
      <button className="btn-lime w-full" onClick={onSave} disabled={saving}>Save to my runs</button>
    </div>
  );
}

export default function ConnectSheet({ brand, open, onClose }) {
  const { user, devices, setDevice, saveRun, toast } = useApp();
  const isFile = brand?.kind === 'file';
  const isStrava = brand?.kind === 'strava';
  const [tab, setTab] = useState('auto');
  const [perms, setPerms] = useState({ steps: true, hr: true, gps: true, sleep: false });
  const [phase, setPhase] = useState('idle'); // idle | asking
  const [drag, setDrag] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [fileRef, setFileRef] = useState(null);
  const [runName, setRunName] = useState('');
  const [url, setUrl] = useState('');
  const input = useRef(null);
  const dev = brand ? devices[brand.id] : null;

  useEffect(() => {
    if (!open || !brand) return;
    setTab(isFile ? 'file' : isStrava ? 'manual' : 'auto');
    setPerms(devices[brand.id]?.perms || { steps: true, hr: true, gps: true, sleep: false });
    setPhase('idle'); setErr(''); setResult(null); setFileRef(null); setUrl(''); setParsing(false);
  }, [open, brand?.id]); // eslint-disable-line

  if (!brand) return null;

  const connect = () => {
    if (!perms.gps) { setErr('Switch on GPS routes so your runs show up on the map.'); return; }
    setErr(''); setPhase('asking');
    setTimeout(() => {
      setDevice(brand.id, {
        connectedAt: dev?.connectedAt || Date.now(),
        lastSync: Date.now(),
        battery: dev?.battery ?? 55 + Math.floor(Math.random() * 40),
        health: dev?.health ?? 80 + Math.floor(Math.random() * 18),
        perms, status: 'synced',
      });
      setPhase('idle');
      toast(`${brand.short} connected. Yebo!`);
      onClose();
    }, 1500);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setErr(''); setResult(null); setParsing(true);
    try {
      const r = await parseActivityFile(file);
      setResult(r); setRunName(r.name); setFileRef(file);
    } catch (e) {
      setErr(e.message || 'Could not read that file');
    } finally { setParsing(false); }
  };

  const saveFile = async () => {
    const id = `file-${Date.now().toString(36)}`;
    const when = result.startTime || new Date().toISOString();
    const run = {
      id, name: runName.trim() || 'Imported run', place: result.format + ' import', routeId: 'custom', city: user.city,
      date: when, ...result.summary, watch: isFile ? 'generic' : brand.id, offline: false, privacy: 'friends', feel: 4,
      safety: { rating: 0, night: false }, source: 'file', points: result.points,
    };
    saveRun(run);
    try {
      const f = fileRef;
      const isText = !/\.fit$/i.test(f.name);
      await putFile(`run:${id}`, { name: f.name, type: result.format.toLowerCase(), data: isText ? await f.text() : await f.arrayBuffer() });
    } catch {}
    toast('Run imported - lekker!');
    onClose();
  };

  const importStrava = () => {
    if (!/strava\.com\/activities\/\d+/i.test(url) && !/strava\.app\.link\//i.test(url)) {
      setErr('Paste a link like https://www.strava.com/activities/123456789');
      return;
    }
    setErr('');
    const run = generateStravaRun({ url: url.trim(), userId: user.id, city: user.city });
    setResult({ points: run.points, summary: run, format: 'Strava', _run: run });
    setRunName(run.name);
  };

  const saveStrava = () => {
    saveRun({ ...result._run, name: runName.trim() || 'Strava import' });
    toast('Strava run added');
    onClose();
  };

  const tabs = [
    !isFile && ['auto', 'Auto sync'],
    ['file', 'File upload'],
    ['manual', 'Manual'],
  ].filter(Boolean);

  return (
    <Sheet open={open} onClose={onClose} title={brand.short} tall>
      <div className="flex items-center gap-3 mb-4">
        <WatchLogo id={brand.id} size={52} />
        <div className="min-w-0">
          <div className="font-bold leading-tight">{brand.models}</div>
          <div className="text-sm text-white/60">via {brand.app}{dev ? ' · Connected' : ''}</div>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-4">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setErr(''); setResult(null); }} className={`flex-1 min-h-[44px] rounded-full text-sm font-bold ${tab === k ? 'bg-lime text-black' : 'text-white/70'}`}>{label}</button>
        ))}
      </div>

      {tab === 'auto' && (
        <div role="tabpanel">
          <div className="card p-4 text-sm text-white/75 space-y-2">
            <p><b className="text-white">How it works:</b> {brand.app} saves your runs to <b>Health Connect</b> (Android&apos;s shared health store). VUKA reads them from there, with your permission, so you never log in to another account.</p>
            <p className="text-white/55 text-xs">In {brand.app}, open Settings → Health Connect (or Connected apps) and switch it on. Not there yet? Use File upload and export a GPX from {brand.app}.</p>
          </div>
          <div className="mt-3 divide-y divide-white/10">
            {PERMS.map(([k, label, sub]) => (
              <Toggle key={k} on={!!perms[k]} onChange={(v) => setPerms((p) => ({ ...p, [k]: v }))} label={label} sub={sub} />
            ))}
          </div>
          {err && <p className="text-start text-sm mt-2" role="alert">{err}</p>}
          <button className="btn-lime w-full mt-4" onClick={connect} disabled={phase === 'asking'}>
            {phase === 'asking' ? (<><IconSync className="blink" /> Waiting for Health Connect…</>) : dev ? 'Update permissions' : `Connect ${brand.short}`}
          </button>
          {dev && (
            <button className="btn-ghost w-full mt-3" onClick={() => { setDevice(brand.id, null); toast(`${brand.short} disconnected`); onClose(); }}>Disconnect</button>
          )}
          <p className="text-xs text-white/40 mt-3">Demo build: the permission step is simulated on this device. A real Health Connect link needs the Android app wrapper.</p>
        </div>
      )}

      {tab === 'file' && (
        <div role="tabpanel">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? 'border-lime bg-lime/10' : 'border-white/25'}`}
          >
            <IconUpload size={36} className="mx-auto text-lime" />
            <p className="mt-2 font-bold">Drag &amp; drop a GPX, TCX or FIT file</p>
            <p className="text-xs text-white/50 mb-4">Parsed on your phone. The file never leaves it.</p>
            <input ref={input} type="file" accept=".gpx,.tcx,.fit,application/gpx+xml" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} aria-label="Choose activity file" />
            <button className="btn-ghost" onClick={() => input.current?.click()}>Choose file</button>
          </div>
          {parsing && <p className="mt-3 text-sm text-lime blink">Reading your run…</p>}
          {err && <p className="text-start text-sm mt-3" role="alert">{err}</p>}
          {result && tab === 'file' && <Preview result={result} name={runName} setName={setRunName} onSave={saveFile} note={result.timed ? null : 'This file had no timestamps, so time and pace are estimated.'} />}
        </div>
      )}

      {tab === 'manual' && (
        <div role="tabpanel">
          <label className="label" htmlFor="strava-url">Strava activity link</label>
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <IconLink size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input id="strava-url" className="input !pl-11" placeholder="https://www.strava.com/activities/…" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
            </div>
            <button className="btn-lime !px-5" onClick={importStrava}>Import</button>
          </div>
          {err && <p className="text-start text-sm mt-2" role="alert">{err}</p>}
          <p className="text-xs text-white/45 mt-3">Demo import: Strava&apos;s API needs your own API key, so until that is linked VUKA builds a sample run from the link ID. For real data, export the GPX from Strava and use File upload.</p>
          {result && tab === 'manual' && <Preview result={result} name={runName} setName={setRunName} onSave={saveStrava} />}
        </div>
      )}
    </Sheet>
  );
}
