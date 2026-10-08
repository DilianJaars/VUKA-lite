const p2 = (n) => String(n).padStart(2, '0');

// 00:12:34
export function fmtDuration(s) {
  s = Math.max(0, Math.round(s || 0));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}

// 12:34 or 1h 02m
export function fmtShort(s) {
  s = Math.max(0, Math.round(s || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${p2(m)}m`;
  return `${m}:${p2(s % 60)}`;
}

// seconds per km -> 5'32"
export function fmtPace(spk) {
  if (!spk || !isFinite(spk) || spk <= 0 || spk > 3600) return `0'00"`;
  const r = Math.round(spk);
  return `${Math.floor(r / 60)}'${p2(r % 60)}"`;
}

export function fmtKm(km, d = 2) {
  return (km || 0).toFixed(d);
}

export function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'V'
  );
}

export function timeAgo(date, now = new Date()) {
  const s = Math.max(0, (now - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
