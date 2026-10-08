// Geo + run maths. A point is [lat, lng, ele, t(seconds since start), hr]
const R = 6371000;
const toR = Math.PI / 180;

export function haversine(a, b) {
  const dLat = (b[0] - a[0]) * toR;
  const dLng = (b[1] - a[1]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function cumulative(points) {
  const c = [0];
  for (let i = 1; i < points.length; i++) c.push(c[i - 1] + haversine(points[i - 1], points[i]));
  return c;
}

export function elevationGain(points) {
  if (points.length < 3) return 0;
  const w = 4;
  const sm = points.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - w); j <= Math.min(points.length - 1, i + w); j++) {
      s += points[j][2] || 0;
      n++;
    }
    return s / n;
  });
  let gain = 0;
  for (let i = 1; i < sm.length; i++) {
    const d = sm[i] - sm[i - 1];
    if (d > 0) gain += d;
  }
  return Math.round(gain);
}

// Fastest `km` window inside the run, in seconds. `cum` is cumulative metres.
export function bestEffort(points, km, cum) {
  cum = cum || cumulative(points);
  const target = km * 1000;
  const n = points.length;
  if (n < 2 || cum[n - 1] < target) return null;
  let best = Infinity;
  let j = 1;
  for (let i = 0; i < n - 1; i++) {
    if (j <= i) j = i + 1;
    while (j < n && cum[j] - cum[i] < target) j++;
    if (j >= n) break;
    const need = cum[i] + target;
    const seg = cum[j] - cum[j - 1];
    const f = seg > 0 ? (need - cum[j - 1]) / seg : 0;
    const tEnd = points[j - 1][3] + (points[j][3] - points[j - 1][3]) * f;
    const dt = tEnd - points[i][3];
    if (dt > 0 && dt < best) best = dt;
  }
  return isFinite(best) ? best : null;
}

// Cumulative metres scaled so the last value equals run.distance (the authoritative number)
const cumCache = new WeakMap();
export function runCum(run) {
  if (cumCache.has(run.points)) return cumCache.get(run.points);
  const raw = cumulative(run.points);
  const end = raw[raw.length - 1] || 0;
  const k = end > 0 && run.distance > 0 ? (run.distance * 1000) / end : 1;
  const out = raw.map((x) => x * k);
  cumCache.set(run.points, out);
  return out;
}

export function summarize(points, o = {}) {
  const raw = cumulative(points);
  const rawKm = (raw[raw.length - 1] || 0) / 1000;
  const distance = o.distanceKm != null ? o.distanceKm : rawKm;
  const duration = o.durationS != null ? o.durationS : points.length ? points[points.length - 1][3] - points[0][3] : 0;
  const k = rawKm > 0 ? distance / rawKm : 1;
  const sc = raw.map((x) => x * k);
  const avgPace = distance > 0 ? duration / distance : 0;
  const b1 = bestEffort(points, 1, sc);
  const hrs = points.map((p) => p[4]).filter(Boolean);
  return {
    distance: +distance.toFixed(2),
    duration: Math.round(duration),
    avgPace: Math.round(avgPace),
    bestPace: Math.round(b1 || avgPace),
    elevGain: elevationGain(points),
    calories: Math.round(distance * 72 * 1.02),
    avgHr: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : 0,
    maxHr: hrs.length ? Math.max(...hrs) : 0,
  };
}

// Per-km splits
export function splitsOf(run) {
  const pts = run.points;
  if (!pts || pts.length < 2) return [];
  const cum = runCum(run);
  const total = cum[cum.length - 1];
  const at = (dm) => {
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < dm) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const seg = cum[i] - cum[i - 1];
    const f = seg > 0 ? (dm - cum[i - 1]) / seg : 0;
    const lerp = (idx) => pts[i - 1][idx] + (pts[i][idx] - pts[i - 1][idx]) * f;
    return { t: lerp(3), e: lerp(2), i };
  };
  const rows = [];
  const full = Math.floor(total / 1000);
  let prev = at(0);
  for (let k = 1; k <= full + 1; k++) {
    const end = Math.min(k * 1000, total);
    const dist = (end - (k - 1) * 1000) / 1000;
    if (dist < 0.05) break;
    const cur = at(end);
    const slice = pts.slice(Math.max(0, prev.i - 1), cur.i + 1).map((p) => p[4]).filter(Boolean);
    const time = cur.t - prev.t;
    rows.push({
      km: k,
      dist,
      time,
      pace: dist > 0 ? time / dist : 0,
      elev: Math.round(cur.e - prev.e),
      hr: slice.length ? Math.round(slice.reduce((a, b) => a + b, 0) / slice.length) : 0,
    });
    prev = cur;
  }
  return rows;
}

// Keep points manageable for localStorage
export function thin(points, max = 600) {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}

export function bbox(points) {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const p of points) {
    if (p[0] < minLat) minLat = p[0];
    if (p[0] > maxLat) maxLat = p[0];
    if (p[1] < minLng) minLng = p[1];
    if (p[1] > maxLng) maxLng = p[1];
  }
  return { minLat, maxLat, minLng, maxLng };
}
