import { useMemo } from 'react';
import { bbox } from '@/lib/geo';

// Zero-dependency SVG route thumbnail - far lighter than a map tile
export default function MiniRoute({ points, className = '', stroke = '#C6FF00', w = 320, h = 180, pad = 18, label = 'Route preview' }) {
  const { d, s, e } = useMemo(() => {
    if (!points || points.length < 2) return { d: '', s: null, e: null };
    const b = bbox(points);
    const kx = Math.cos((((b.minLat + b.maxLat) / 2) * Math.PI) / 180);
    const wd = (b.maxLng - b.minLng) * kx || 1e-6;
    const hd = b.maxLat - b.minLat || 1e-6;
    const sc = Math.min((w - pad * 2) / wd, (h - pad * 2) / hd);
    const ox = (w - wd * sc) / 2;
    const oy = (h - hd * sc) / 2;
    const P = (p) => [ox + (p[1] - b.minLng) * kx * sc, oy + (b.maxLat - p[0]) * sc];
    const step = Math.max(1, Math.floor(points.length / 120));
    const arr = points.filter((_, i) => i % step === 0 || i === points.length - 1).map(P);
    return { d: arr.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(''), s: arr[0], e: arr[arr.length - 1] };
  }, [points, w, h, pad]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <defs>
        <pattern id="mr-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="#111" />
      <rect width={w} height={h} fill="url(#mr-grid)" />
      {d && (
        <>
          <path d={d} fill="none" stroke={stroke} strokeOpacity=".2" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round" />
          <path d={d} fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={s[0]} cy={s[1]} r="6" fill="#fff" stroke="#000" strokeWidth="2" />
          <circle cx={e[0]} cy={e[1]} r="6" fill="#FF3B30" stroke="#fff" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}
