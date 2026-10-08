'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { densePath, routeLength, ROUTES } from '@/lib/mock';
import { haversine, summarize } from '@/lib/geo';
import { cityCenter } from '@/lib/watches';

// Demo GPS runs the clock 6x faster so you can watch the whole thing in a minute.
export const SIM_SCALE = 6;
const ACTIVE_KEY = 'vuka:active';

const Ctx = createContext(null);
export const useTracker = () => useContext(Ctx);

function pickRoute(city) {
  const c = city === 'Other' ? 'Cape Town' : city;
  const pool = ROUTES.filter((r) => r.city === c && r.id !== 'tablemountain');
  return pool[0] || ROUTES[0];
}

export function TrackerProvider({ children }) {
  const { user, setDraft, toast, ready } = useApp();
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [mode, setMode] = useState('sim'); // sim | gps
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0); // metres
  const [points, setPoints] = useState([]);
  const [pace, setPace] = useState(0);
  const [gpsError, setGpsError] = useState(null);

  const R = useRef({ last: 0, elapsed: 0, dist: 0, points: [], sim: null, simS: 0, watch: null, wake: null, paceBuf: [], ticks: 0 });
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const route = useMemo(() => pickRoute(user?.city), [user?.city]);
  const center = useMemo(() => cityCenter(user?.city), [user?.city]);

  const persist = useCallback(() => {
    const r = R.current;
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify({ uid: user?.id, mode: modeRef.current, elapsed: r.elapsed, dist: r.dist, points: r.points, simS: r.simS }));
    } catch {}
  }, [user?.id]);

  // restore an unfinished run (power cut / app killed / loadshedding)
  useEffect(() => {
    if (!ready || !user) return;
    try {
      const a = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
      if (a && a.uid === user.id && a.points?.length > 1) {
        const r = R.current;
        r.elapsed = a.elapsed; r.dist = a.dist; r.points = a.points; r.simS = a.simS || 0;
        setMode(a.mode); setElapsed(a.elapsed); setDistance(a.dist); setPoints(a.points); setStatus('paused');
        toast('Restored your unfinished run - tap Resume');
      }
    } catch {}
  }, [ready, user?.id]); // eslint-disable-line

  const addPoint = useCallback((p) => {
    const r = R.current;
    r.points.push(p);
    // rolling pace over the last ~30s of run time
    r.paceBuf.push([p[3], r.dist]);
    while (r.paceBuf.length > 2 && r.paceBuf[r.paceBuf.length - 1][0] - r.paceBuf[0][0] > 30) r.paceBuf.shift();
    const a = r.paceBuf[0], b = r.paceBuf[r.paceBuf.length - 1];
    const dd = b[1] - a[1], dt = b[0] - a[0];
    setPace(dd > 5 ? dt / (dd / 1000) : 0);
    setPoints(r.points.slice());
    setDistance(r.dist);
  }, []);

  const tick = useCallback(() => {
    const r = R.current;
    const now = Date.now();
    const scale = modeRef.current === 'sim' ? SIM_SCALE : 1;
    const dt = Math.min((now - r.last) / 1000, modeRef.current === 'sim' ? 3 : 3600) * scale;
    r.last = now;
    r.elapsed += dt;
    r.ticks++;
    setElapsed(r.elapsed);
    if (modeRef.current === 'sim') {
      if (!r.sim) r.sim = densePath(route, Math.max(25, routeLength(route) * 6), 2500);
      const spk = 335 + Math.sin(r.elapsed / 55) * 12 + Math.sin(r.elapsed / 17) * 5; // s/km
      r.dist += (dt / spk) * 1000;
      const total = r.sim.length - 1;
      const stepM = (25 * 1000) / 2500; // densePath(…, 25km, 2500) => 10 m/step
      const f = Math.min(total - 0.001, r.dist / stepM);
      const i = Math.floor(f), w = f - i;
      const a = r.sim[i], b = r.sim[i + 1];
      const ele = route.base + route.amp * (0.5 + 0.5 * Math.sin(r.dist / 900));
      const hr = Math.round(140 + Math.min(r.elapsed / 60, 25) * 0.9 + Math.sin(r.elapsed / 11) * 3);
      addPoint([+(a[0] + (b[0] - a[0]) * w).toFixed(5), +(a[1] + (b[1] - a[1]) * w).toFixed(5), +ele.toFixed(1), Math.round(r.elapsed), hr]);
    }
    if (r.ticks % 5 === 0) persist();
  }, [route, addPoint, persist]);

  useEffect(() => {
    if (status !== 'running') return;
    R.current.last = Date.now();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, tick]);

  // real GPS
  useEffect(() => {
    if (status !== 'running' || mode !== 'gps') return;
    if (!navigator.geolocation) { setGpsError('This phone has no GPS'); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        const { latitude: la, longitude: lo, altitude, accuracy } = pos.coords;
        if (accuracy > 35) return;
        const r = R.current;
        const prev = r.points[r.points.length - 1];
        if (prev) {
          const d = haversine([prev[0], prev[1]], [la, lo]);
          if (d < 3) return;
          if (d > 80) return; // GPS jump
          r.dist += d;
        }
        addPoint([+la.toFixed(5), +lo.toFixed(5), altitude != null ? +altitude.toFixed(1) : 0, Math.round(r.elapsed), 0]);
      },
      (err) => setGpsError(err.code === 1 ? 'Location permission denied - allow it in browser settings' : 'Waiting for GPS signal...'),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [status, mode, addPoint]);

  // keep the screen awake while running
  useEffect(() => {
    if (status !== 'running' || !('wakeLock' in navigator)) return;
    let lock;
    navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {});
    return () => { try { lock?.release(); } catch {} };
  }, [status]);

  const start = useCallback(() => {
    const r = R.current;
    r.elapsed = 0; r.dist = 0; r.points = []; r.sim = null; r.paceBuf = []; r.ticks = 0; r.simS = 0;
    setElapsed(0); setDistance(0); setPoints([]); setPace(0); setGpsError(null);
    if (modeRef.current === 'sim') {
      // first fix so the map has somewhere to be
      const s = densePath(route, 1, 10)[0];
      r.points.push([+s[0].toFixed(5), +s[1].toFixed(5), route.base, 0, 120]);
      setPoints(r.points.slice());
    }
    r.last = Date.now();
    setStatus('running');
  }, [route]);

  const pause = useCallback(() => { setStatus('paused'); persist(); }, [persist]);
  const resume = useCallback(() => { R.current.last = Date.now(); setStatus('running'); }, []);

  const reset = useCallback(() => {
    const r = R.current;
    r.elapsed = 0; r.dist = 0; r.points = []; r.sim = null; r.paceBuf = [];
    setStatus('idle'); setElapsed(0); setDistance(0); setPoints([]); setPace(0);
    try { localStorage.removeItem(ACTIVE_KEY); } catch {}
  }, []);

  // returns draft run or null (nothing worth saving)
  const stop = useCallback(() => {
    const r = R.current;
    if (r.points.length < 2 || r.dist < 20) {
      reset();
      toast('Nothing to save - that run was under 20 m');
      return null;
    }
    const s = summarize(r.points, { distanceKm: r.dist / 1000, durationS: r.elapsed });
    const date = new Date(Date.now() - r.elapsed * 1000);
    const hr = date.getHours();
    const draft = {
      id: `r-${Date.now().toString(36)}`,
      name: `${hr < 10 ? 'Morning' : hr < 15 ? 'Lunch' : 'Evening'} run`,
      place: modeRef.current === 'sim' ? route.name : 'My run',
      routeId: modeRef.current === 'sim' ? route.id : 'custom',
      city: user?.city === 'Other' ? 'Cape Town' : user?.city,
      date: date.toISOString(),
      ...s,
      watch: user?.watch,
      offline: !navigator.onLine || !!user?.settings?.offlineMode,
      privacy: 'friends',
      feel: 4,
      safety: { rating: 0, night: false },
      source: modeRef.current === 'sim' ? 'recorded-demo' : 'recorded',
      points: r.points.slice(),
    };
    setDraft(draft);
    reset();
    return draft;
  }, [reset, route, user, setDraft, toast]);

  const value = useMemo(
    () => ({ status, mode, setMode, elapsed, distance, points, pace, gpsError, route, center, start, pause, resume, stop, reset, scale: mode === 'sim' ? SIM_SCALE : 1 }),
    [status, mode, elapsed, distance, points, pace, gpsError, route, center, start, pause, resume, stop, reset]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
