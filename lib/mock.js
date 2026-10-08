// Mock data: SA routes, a believable 47-run / 312 km history, the community feed, weather.
import { mulberry32, hashStr, shuffle, clamp } from './rng';
import { haversine, summarize } from './geo';
import { getWatch } from './watches';

export const MOCK_RUNS = 47;
export const MOCK_TOTAL_KM = 312;

export const ROUTES = [
  {
    id: 'seapoint', name: 'Sea Point Promenade', city: 'Cape Town', loop: false, base: 4, amp: 6, township: false,
    wps: [[-33.9005, 18.4035], [-33.906, 18.3985], [-33.912, 18.3895], [-33.918, 18.383], [-33.924, 18.3785], [-33.9285, 18.377]],
    safety: { rating: 4.5, reviews: 312, night: true },
    comments: [
      { name: 'Lerato K.', text: 'Well lit and always busy until 9pm. Stick to the promenade side.', ago: '2 days ago' },
      { name: 'Pieter v.d.M.', text: 'Run clubs here every evening. Feels very safe, just watch the wind.', ago: '1 week ago' },
      { name: 'Aisha P.', text: 'Lekker at sunrise. Keep your phone in a belt, not in hand.', ago: '3 weeks ago' },
    ],
  },
  {
    id: 'tablemountain', name: 'Table Mountain - Platteklip Gorge', city: 'Cape Town', loop: false, base: 90, amp: 620, township: false,
    wps: [[-33.9488, 18.41], [-33.952, 18.4085], [-33.956, 18.406], [-33.96, 18.404], [-33.9625, 18.403]],
    safety: { rating: 3.5, reviews: 148, night: false },
    comments: [
      { name: 'Johan D.', text: 'Go before 10am, take water and tell someone your plan. Not for after dark.', ago: '4 days ago' },
      { name: 'Megan S.', text: 'Steep and brutal. Run in groups, the gorge has been sketchy for lone runners.', ago: '2 weeks ago' },
    ],
  },
  {
    id: 'langa', name: 'Langa Stadium Loop', city: 'Cape Town', loop: true, base: 20, amp: 4, township: true,
    wps: [[-33.9435, 18.533], [-33.9435, 18.538], [-33.947, 18.5385], [-33.9475, 18.5335], [-33.9435, 18.533]],
    safety: { rating: 4.0, reviews: 64, night: true },
    comments: [
      { name: 'Sipho N.', text: 'Langa Run Club meets here Tuesdays and Thursdays 5:30pm. Everyone is welcome, yebo!', ago: '3 days ago' },
      { name: 'Zanele M.', text: 'Safe in a group, solo after dark I would skip the back streets.', ago: '1 month ago' },
    ],
  },
  {
    id: 'khayelitsha', name: 'Khayelitsha Site B Loop', city: 'Cape Town', loop: true, base: 25, amp: 4, township: true,
    wps: [[-34.039, 18.676], [-34.039, 18.685], [-34.045, 18.686], [-34.0455, 18.677], [-34.039, 18.676]],
    safety: { rating: 3.5, reviews: 41, night: false },
    comments: [
      { name: 'Nomsa D.', text: 'Our Saturday run club does this at 6am. Come with us first, then explore solo.', ago: '5 days ago' },
      { name: 'Kagiso T.', text: 'Roads are good, traffic is light early morning.', ago: '2 weeks ago' },
    ],
  },
  {
    id: 'soweto', name: 'Soweto - Orlando Stadium Loop', city: 'Joburg', loop: true, base: 1700, amp: 6, township: true,
    wps: [[-26.239, 27.998], [-26.239, 28.004], [-26.243, 28.0045], [-26.2435, 27.9985], [-26.239, 27.998]],
    safety: { rating: 4.0, reviews: 88, night: true },
    comments: [
      { name: 'Themba L.', text: 'Orlando run crew goes Wednesday evenings. Well lit around the stadium.', ago: '1 week ago' },
      { name: 'Naledi B.', text: 'Love the energy here. Keep to the main roads.', ago: '3 weeks ago' },
    ],
  },
  {
    id: 'zoolake', name: 'Zoo Lake Loop', city: 'Joburg', loop: true, base: 1690, amp: 5, township: false,
    wps: [[-26.1555, 28.014], [-26.155, 28.019], [-26.159, 28.02], [-26.16, 28.015], [-26.1555, 28.014]],
    safety: { rating: 4.5, reviews: 205, night: false },
    comments: [
      { name: 'Fatima H.', text: 'Busy and safe in daylight. Gates close at dusk so plan accordingly.', ago: '6 days ago' },
      { name: 'Ruan C.', text: 'Parkrun Saturdays. Great community.', ago: '1 month ago' },
    ],
  },
  {
    id: 'deltapark', name: 'Delta Park Trail', city: 'Joburg', loop: true, base: 1660, amp: 14, township: false,
    wps: [[-26.123, 28.01], [-26.1225, 28.017], [-26.127, 28.0185], [-26.1285, 28.0115], [-26.123, 28.01]],
    safety: { rating: 4.0, reviews: 97, night: false },
    comments: [{ name: 'Lwazi M.', text: 'Nice dirt paths. Go with a buddy early morning.', ago: '2 weeks ago' }],
  },
  {
    id: 'beachfront', name: 'Durban Beachfront - Golden Mile', city: 'Durban', loop: false, base: 5, amp: 4, township: false,
    wps: [[-29.8675, 31.0452], [-29.862, 31.0445], [-29.856, 31.043], [-29.85, 31.0415], [-29.844, 31.042]],
    safety: { rating: 4.5, reviews: 276, night: true },
    comments: [
      { name: 'Bongani Z.', text: 'Flat, wide and full of runners at 5am. The promenade is patrolled.', ago: '2 days ago' },
      { name: 'Priya N.', text: 'Humid but gorgeous. Watch for cyclists near uShaka.', ago: '1 week ago' },
    ],
  },
  {
    id: 'mabhida', name: 'Moses Mabhida Stadium Loop', city: 'Durban', loop: true, base: 12, amp: 5, township: false,
    wps: [[-29.829, 31.0295], [-29.829, 31.0345], [-29.8325, 31.035], [-29.8328, 31.03], [-29.829, 31.0295]],
    safety: { rating: 4.0, reviews: 52, night: false },
    comments: [{ name: 'Sanele K.', text: 'Great for intervals, and there are lights around the stadium.', ago: '3 weeks ago' }],
  },
];

export const getRoute = (id) => ROUTES.find((r) => r.id === id) || ROUTES[0];
const routesFor = (city) => ROUTES.filter((r) => r.city === (city === 'Other' ? 'Cape Town' : city));

// -- path building -------------------------------------------------------------
function legsOf(r) {
  const legs = [];
  let L = 0;
  for (let i = 0; i < r.wps.length - 1; i++) {
    const d = haversine(r.wps[i], r.wps[i + 1]);
    legs.push(d);
    L += d;
  }
  return { legs, L };
}

export const routeLength = (r) => legsOf(r).L / 1000;

// n+1 evenly spaced points over `km`, repeating laps / out-and-back as needed. returns [lat,lng,frac]
export function densePath(route, km, n) {
  const { legs, L } = legsOf(route);
  const total = km * 1000;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const sm = (i / n) * total;
    const phase = route.loop ? sm % L : (() => { const c = sm % (2 * L); return c <= L ? c : 2 * L - c; })();
    let acc = 0;
    for (let k = 0; k < legs.length; k++) {
      if (phase <= acc + legs[k] || k === legs.length - 1) {
        const f = legs[k] > 0 ? clamp((phase - acc) / legs[k], 0, 1) : 0;
        const a = route.wps[k], b = route.wps[k + 1];
        out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, phase / L]);
        break;
      }
      acc += legs[k];
    }
  }
  return out;
}

export function eleAt(route, frac) {
  return route.loop ? route.base + route.amp * (0.5 + 0.5 * Math.sin(frac * Math.PI * 2)) : route.base + route.amp * frac;
}

export function makeRunPoints(route, km, { pace = 340, rng = Math.random, hrBase = 148 } = {}) {
  const n = clamp(Math.round(km * 14), 40, 170);
  const dense = densePath(route, km, n);
  const ph = rng() * 6.28;
  const pts = [];
  let t = 0;
  let prev = null;
  for (let i = 0; i < dense.length; i++) {
    const lat = dense[i][0] + (rng() - 0.5) * 0.00005;
    const lng = dense[i][1] + (rng() - 0.5) * 0.00005;
    const ele = eleAt(route, dense[i][2]) + Math.sin(i / 9 + ph) * 1.2 + (rng() - 0.5) * 1.5;
    let bump = 0;
    if (prev) {
      const d = haversine([prev[0], prev[1]], [lat, lng]);
      const grade = (ele - prev[2]) / Math.max(d, 1);
      const warm = i < n * 0.06 ? 1.12 : 1;
      const fatigue = 1 + 0.05 * (i / n);
      const wob = 1 + 0.06 * Math.sin(i / 7 + ph);
      t += (d / 1000) * pace * clamp(1 + 5 * grade, 0.7, 2.2) * warm * fatigue * wob;
      bump = clamp((ele - prev[2]) * 3, -6, 12);
    }
    const hr = Math.round(hrBase + 12 * (i / n) + bump + (rng() - 0.5) * 4);
    prev = [lat, lng, ele];
    pts.push([+lat.toFixed(5), +lng.toFixed(5), +ele.toFixed(1), Math.round(t), hr]);
  }
  return pts;
}

// -- user's mock history ----------------------------------------------------------
const dayKey = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

function runTime(rng, date, now) {
  const dow = date.getDay();
  const r = rng();
  let h, m;
  if (dow === 6 || dow === 0) { h = 6; m = 30 + Math.floor(rng() * 40); }
  else if (r < 0.4) { h = 5 + Math.floor(rng() * 2); m = 20 + Math.floor(rng() * 40); }
  else if (r < 0.5) { h = 12; m = 30; }
  else { h = 17; m = 15 + Math.floor(rng() * 90); if (m >= 60) { h = 18; m -= 60; } }
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, Math.floor(rng() * 59));
  if (d > now) return new Date(now.getTime() - 40 * 60 * 1000 - Math.floor(rng() * 20) * 60 * 1000);
  return d;
}

const todLabel = (d) => (d.getHours() < 10 ? 'Morning' : d.getHours() < 15 ? 'Lunch' : 'Evening');

export function generateMockRuns({ userId = 'demo', city = 'Cape Town', watch = 'polaroid', now = new Date() }) {
  const rng = mulberry32(hashStr(`${userId}:vuka`));
  const pool = routesFor(city);
  const isCT = pool.some((r) => r.id === 'seapoint');
  // run days: a 5 day streak up to today, a rest day, then 42 earlier days
  const earlier = shuffle(Array.from({ length: 92 }, (_, i) => i + 6), rng).slice(0, MOCK_RUNS - 5).sort((a, b) => b - a);
  const offsets = [...earlier, 4, 3, 2, 1, 0]; // oldest -> newest
  const N = offsets.length;

  // distances
  const kinds = offsets.map(() => { const r = rng(); return r < 0.45 ? [3, 6] : r < 0.8 ? [6, 9] : [10, 15]; });
  const tmIdx = isCT ? [Math.floor(N * 0.28), Math.floor(N * 0.62)] : [];
  const tm = ROUTES.find((r) => r.id === 'tablemountain');
  const tmLap = routeLength(tm) * 2;
  const targets = new Array(N);
  let fixed = 0;
  tmIdx.forEach((idx, k) => { targets[idx] = +(tmLap * (k + 1)).toFixed(2); fixed += targets[idx]; });
  const free = [];
  for (let i = 0; i < N; i++) if (targets[i] == null) free.push(i);
  const raw = free.map((i) => kinds[i][0] + rng() * (kinds[i][1] - kinds[i][0]));
  const k = (MOCK_TOTAL_KM - fixed) / raw.reduce((a, b) => a + b, 0);
  let acc = fixed;
  free.forEach((i, j) => { targets[i] = +(raw[j] * k).toFixed(2); acc += targets[i]; });
  targets[free[free.length - 1]] = +(targets[free[free.length - 1]] + (MOCK_TOTAL_KM - acc)).toFixed(2); // exact total

  const offlineSet = new Set(shuffle(Array.from({ length: N }, (_, i) => i), rng).slice(0, 13));
  const second = watch === 'amazfit' ? 'huawei' : 'amazfit';

  const runs = [];
  for (let i = 0; i < N; i++) {
    const date = runTime(rng, new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsets[i]), now);
    let route;
    if (tmIdx.includes(i)) route = tm;
    else if (isCT) {
      const r = rng();
      route = r < 0.6 ? getRoute('seapoint') : r < 0.82 ? getRoute('langa') : getRoute('khayelitsha');
    } else route = pool[Math.floor(rng() * pool.length)];
    const km = targets[i];
    const pace = 382 - 44 * (i / (N - 1)) + (rng() - 0.5) * 30 + (km > 10 ? 14 : 0);
    const wr = rng();
    const w = wr < 0.65 ? watch : wr < 0.9 ? second : 'generic';
    const points = makeRunPoints(route, km, { pace, rng, hrBase: 146 + (rng() - 0.5) * 8 });
    const s = summarize(points, { distanceKm: km });
    const pr = rng();
    runs.push({
      id: `m-${userId.slice(0, 6)}-${dayKey(date)}`,
      name: `${todLabel(date)} run`,
      place: route.name,
      routeId: route.id,
      city: route.city,
      date: date.toISOString(),
      ...s,
      watch: w,
      offline: offlineSet.has(i),
      privacy: pr < 0.6 ? 'public' : pr < 0.85 ? 'friends' : 'private',
      feel: 3 + Math.floor(rng() * 3),
      safety: { rating: route.safety.rating, night: route.safety.night },
      source: 'mock',
      points,
    });
  }
  return runs.reverse(); // newest first
}

// -- watch sync simulation ---------------------------------------------------------
export function generateSyncRuns({ userId, city, brands, now = new Date() }) {
  const pool = routesFor(city);
  const out = [];
  for (let d = 0; d < 7; d++) {
    const brand = brands[d % brands.length];
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const rng = mulberry32(hashStr(`${userId}:${brand}:${dayKey(day)}`));
    const route = pool[Math.floor(rng() * pool.length)];
    const km = +(route.id === 'tablemountain' ? routeLength(route) * 2 : 4 + rng() * 6).toFixed(2);
    const date = runTime(rng, day, now);
    const points = makeRunPoints(route, km, { pace: 330 + rng() * 50, rng, hrBase: 148 });
    out.push({
      id: `sync-${brand}-${dayKey(date)}`,
      name: `${todLabel(date)} run`,
      place: route.name, routeId: route.id, city: route.city,
      date: date.toISOString(),
      ...summarize(points, { distanceKm: km }),
      watch: brand, offline: true, privacy: 'friends', feel: 4,
      safety: { rating: route.safety.rating, night: route.safety.night },
      source: 'sync', points,
    });
  }
  return out;
}

// sample run for "paste Strava link" demo import
export function generateStravaRun({ url, userId, city, now = new Date() }) {
  const id = (url.match(/activities\/(\d+)/) || [])[1] || String(hashStr(url));
  const rng = mulberry32(hashStr(`strava:${id}`));
  const pool = routesFor(city);
  const route = pool[Math.floor(rng() * pool.length)];
  const km = +(5 + rng() * 6).toFixed(2);
  const date = new Date(now.getTime() - (1 + Math.floor(rng() * 5)) * 86400000);
  const points = makeRunPoints(route, km, { pace: 335 + rng() * 40, rng });
  return {
    id: `strava-${id}`,
    name: 'Strava import',
    place: route.name, routeId: route.id, city: route.city,
    date: date.toISOString(),
    ...summarize(points, { distanceKm: km }),
    watch: 'strava', offline: false, privacy: 'friends', feel: 4,
    safety: { rating: route.safety.rating, night: route.safety.night },
    source: 'strava', stravaUrl: url, points,
  };
}

// -- community feed -----------------------------------------------------------------
const FEED_SPECS = [
  ['Thandi Mokoena', 'Cape Town', 'seapoint', 'polaroid', 8.2, 2, 'Sunrise on the prom. Lekker start to the day!', 48, 7, true],
  ['Sipho Ndlovu', 'Cape Town', 'langa', 'volkano', 5.1, 5, 'Langa Run Club Tuesday session. Sharp sharp!', 91, 18, true],
  ['Lerato Khumalo', 'Joburg', 'soweto', 'mibro', 6.4, 8, 'Orlando loops before work. Vuka!', 63, 11, false],
  ['Pieter van der Merwe', 'Cape Town', 'tablemountain', 'garmin', 4.2, 11, 'Platteklip in 41 minutes. Legs are gone.', 120, 24, false],
  ['Nomsa Dlamini', 'Cape Town', 'khayelitsha', 'haylou', 5.8, 14, 'Saturday crew in Site B. Yebo yes!', 77, 15, true],
  ['Bongani Zulu', 'Durban', 'beachfront', 'oraimo', 10.3, 20, 'Golden Mile long run. Howzit Durban!', 54, 9, false],
  ['Aisha Patel', 'Cape Town', 'seapoint', 'amazfit', 12.0, 26, 'Half marathon training, wind was a skelm today.', 85, 13, false],
  ['Themba Letsie', 'Joburg', 'zoolake', 'kieslect', 5.0, 30, 'Parkrun PB! Budget watch, big heart.', 142, 31, true],
  ['Zanele Mbeki', 'Cape Town', 'langa', 'lava', 3.9, 36, 'Easy recovery loops with the girls.', 39, 5, false],
  ['Johan Botha', 'Cape Town', 'tablemountain', 'huawei', 6.3, 40, 'Two trips up the gorge. Never again (see you Thursday).', 101, 20, false],
  ['Naledi Baloyi', 'Joburg', 'soweto', 'polaroid', 7.7, 47, 'Orlando Stadium evening session.', 58, 8, true],
  ['Kagiso Tau', 'Cape Town', 'khayelitsha', 'oraimo', 4.6, 52, 'First 5k attempt, nearly there. Lekker!', 96, 22, false],
  ['Priya Naidoo', 'Durban', 'beachfront', 'xiaomi', 8.9, 60, 'Sunrise at the Golden Mile. Sharp!', 72, 10, false],
  ['Megan Smith', 'Cape Town', 'seapoint', 'honor', 6.0, 70, 'Quick prom run before the rain.', 33, 4, false],
  ['Lwazi Mthembu', 'Joburg', 'deltapark', 'volkano', 9.2, 75, 'Trail run through Delta Park.', 47, 6, true],
];

export function generateFeed(now = new Date()) {
  return FEED_SPECS.map((s, i) => {
    const [name, city, routeId, watch, km, hoursAgo, caption, likes, comments, friend] = s;
    const route = getRoute(routeId);
    const rng = mulberry32(hashStr(`feed:${i}:${name}`));
    const date = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    const dist = routeId === 'tablemountain' ? +(routeLength(route) * 2 * (km > 5 ? 2 : 1)).toFixed(2) : km;
    const pace = routeId === 'tablemountain' ? 560 : 300 + rng() * 80;
    const points = makeRunPoints(route, dist, { pace, rng, hrBase: 150 });
    return {
      id: `f${i + 1}`,
      feed: true,
      user: { name, city, handle: name.split(' ')[0].toLowerCase() },
      friend,
      caption,
      likes,
      comments,
      run: {
        id: `f${i + 1}`,
        name: caption.split(/[.!]/)[0],
        place: route.name, routeId: route.id, city: route.city,
        date: date.toISOString(),
        ...summarize(points, { distanceKm: dist }),
        watch, privacy: 'public', feel: 4, offline: false,
        safety: { rating: route.safety.rating, night: route.safety.night },
        source: 'feed', points,
      },
    };
  });
}

// -- weather (mock, deterministic per run) --------------------------------------------
const CONDITIONS = [
  { label: 'Clear', icon: '☀️' }, { label: 'Partly cloudy', icon: '⛅' }, { label: 'Windy', icon: '💨' },
  { label: 'Overcast', icon: '☁️' }, { label: 'Light drizzle', icon: '🌦️' },
];
export function weatherFor(run) {
  const rng = mulberry32(hashStr(`${run.id}:${run.date}`));
  const hour = new Date(run.date).getHours();
  const city = run.city || 'Cape Town';
  const base = city === 'Durban' ? 24 : city === 'Joburg' ? 20 : 17;
  const temp = Math.round(base + (hour > 11 && hour < 17 ? 6 : hour < 8 ? -3 : 1) + (rng() - 0.5) * 6);
  const cond = CONDITIONS[Math.floor(rng() * (city === 'Cape Town' ? 3 : 2) + (city === 'Cape Town' && rng() > 0.7 ? 2 : 0))] || CONDITIONS[0];
  return { temp, ...cond, wind: Math.round(8 + rng() * (city === 'Cape Town' ? 28 : 14)), humidity: Math.round(45 + rng() * 40) };
}

export const feelEmoji = ['', '😫', '😕', '🙂', '😄', '🔥'];
export { getWatch };
