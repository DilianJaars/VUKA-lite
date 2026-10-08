'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { generateMockRuns } from '@/lib/mock';
import { thin } from '@/lib/geo';
import { delFile } from '@/lib/idb';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const K = {
  session: 'vuka:session',
  user: (id) => `vuka:user:${id}`,
  runs: (id) => `vuka:runs:${id}`,
  devices: (id) => `vuka:devices:${id}`,
  likes: (id) => `vuka:likes:${id}`,
  draft: (id) => `vuka:draft:${id}`,
};

const read = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

export const DEFAULT_SETTINGS = {
  dataSaver: false,
  offlineMode: true,
  units: 'km',
  autoSync: true,
  notif: { reminders: true, weekly: true, streak: true },
  accounts: { strava: false, health: false },
};

const AVATAR_COLORS = ['#C6FF00', '#FF3B30', '#38BDF8', '#F5C400', '#A78BFA', '#34D399', '#FB923C'];
const mkDevice = (battery, minsAgo) => ({
  connectedAt: Date.now() - 20 * 86400000,
  lastSync: Date.now() - minsAgo * 60000,
  battery,
  health: 88,
  perms: { steps: true, hr: true, gps: true, sleep: false },
  status: 'synced',
});

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [runs, setRuns] = useState([]);
  const [devices, setDevices] = useState({});
  const [likes, setLikes] = useState({});
  const [draft, setDraftState] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [online, setOnline] = useState(true);
  const [installEvt, setInstallEvt] = useState(null);
  const userRef = useRef(null);
  userRef.current = user;

  const loadUser = useCallback((id) => {
    const u = read(K.user(id), null);
    if (!u) return false;
    setUser({ ...u, settings: { ...DEFAULT_SETTINGS, ...u.settings } });
    setRuns(read(K.runs(id), []));
    setDevices(read(K.devices(id), {}));
    setLikes(read(K.likes(id), {}));
    setDraftState(read(K.draft(id), null));
    try { localStorage.setItem(K.session, id); } catch {}
    return true;
  }, []);

  useEffect(() => {
    const id = (() => { try { return localStorage.getItem(K.session); } catch { return null; } })();
    if (id) loadUser(id);
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const bip = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', bip);
    setReady(true);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('beforeinstallprompt', bip);
    };
  }, [loadUser]);

  // persistence
  useEffect(() => { if (ready && user) write(K.user(user.id), user); }, [user, ready]);
  useEffect(() => { if (ready && user) { if (!write(K.runs(user.id), runs)) setToastMsg({ id: Date.now(), msg: 'Phone storage is full - export your runs to free space', type: 'err' }); } }, [runs, ready, user?.id]); // eslint-disable-line
  useEffect(() => { if (ready && user) write(K.devices(user.id), devices); }, [devices, ready, user?.id]); // eslint-disable-line
  useEffect(() => { if (ready && user) write(K.likes(user.id), likes); }, [likes, ready, user?.id]); // eslint-disable-line
  useEffect(() => {
    if (!ready || !user) return;
    if (draft) write(K.draft(user.id), draft);
    else try { localStorage.removeItem(K.draft(user.id)); } catch {}
  }, [draft, ready, user?.id]); // eslint-disable-line

  // data saver class
  useEffect(() => {
    document.documentElement.classList.toggle('data-saver', !!user?.settings?.dataSaver);
  }, [user?.settings?.dataSaver]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const toast = useCallback((msg, type = 'ok') => setToastMsg({ id: Date.now(), msg, type }), []);

  const login = useCallback((id) => loadUser(id), [loadUser]);

  const register = useCallback(({ id, name, city, watch, goalKm, method, demo }) => {
    const u = {
      id, name, city, watch, goalKm, method,
      color: AVATAR_COLORS[Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length],
      createdAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    };
    const r = demo ? generateMockRuns({ userId: id, city, watch }) : [];
    const second = watch === 'amazfit' ? 'huawei' : 'amazfit';
    const d = { [watch]: mkDevice(74, 35) };
    if (demo) d[second] = { ...mkDevice(41, 60 * 52), perms: { steps: true, hr: true, gps: true, sleep: true } };
    write(K.user(id), u);
    write(K.runs(id), r);
    write(K.devices(id), d);
    loadUser(id);
  }, [loadUser]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(K.session); } catch {}
    setUser(null); setRuns([]); setDevices({}); setLikes({}); setDraftState(null);
  }, []);

  const saveRun = useCallback((run) => {
    const clean = { ...run, points: thin(run.points, 600) };
    setRuns((rs) => [clean, ...rs.filter((r) => r.id !== run.id)]);
  }, []);
  const addRuns = useCallback((list) => {
    setRuns((rs) => {
      const ids = new Set(rs.map((r) => r.id));
      return [...list.filter((r) => !ids.has(r.id)).map((r) => ({ ...r, points: thin(r.points, 600) })), ...rs];
    });
  }, []);
  const deleteRun = useCallback((id) => { setRuns((rs) => rs.filter((r) => r.id !== id)); delFile(`run:${id}`); }, []);
  const updateRun = useCallback((id, patch) => setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r))), []);
  const updateUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);
  const updateSettings = useCallback((patch) => setUser((u) => (u ? { ...u, settings: { ...u.settings, ...patch } } : u)), []);
  const setDevice = useCallback((brand, patch) => {
    setDevices((d) => {
      const n = { ...d };
      if (patch === null) delete n[brand];
      else n[brand] = { ...(n[brand] || {}), ...patch };
      return n;
    });
  }, []);
  const toggleLike = useCallback((id) => setLikes((l) => ({ ...l, [id]: !l[id] })), []);
  const setDraft = useCallback((d) => setDraftState(d), []);

  const install = useCallback(async () => {
    if (!installEvt) return false;
    installEvt.prompt();
    try { await installEvt.userChoice; } catch {}
    setInstallEvt(null);
    return true;
  }, [installEvt]);

  const value = useMemo(
    () => ({
      ready, user, runs, devices, likes, draft, toastMsg, online, canInstall: !!installEvt,
      login, register, logout, saveRun, addRuns, deleteRun, updateRun, updateUser, updateSettings,
      setDevice, toggleLike, setDraft, toast, install,
    }),
    [ready, user, runs, devices, likes, draft, toastMsg, online, installEvt, login, register, logout, saveRun, addRuns, deleteRun, updateRun, updateUser, updateSettings, setDevice, toggleLike, setDraft, toast, install]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const storageKeys = K;
