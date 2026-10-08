import { fmtDuration, fmtPace } from './format';
import { bbox } from './geo';
import { getWatch } from './watches';

// Draws a 1080x1350 share card on a canvas and returns a PNG blob
export async function makeShareImage(run, userName = 'Runner') {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#0A0A0A';
  g.fillRect(0, 0, W, H);

  // faint grid
  g.strokeStyle = 'rgba(255,255,255,0.05)';
  g.lineWidth = 2;
  for (let x = 0; x < W; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

  // brand
  g.fillStyle = '#C6FF00';
  g.font = '900 64px Outfit, Arial Black, sans-serif';
  g.fillText('VUKA LITE', 70, 120);
  g.fillStyle = '#FF3B30';
  g.fillRect(70, 140, 150, 10);
  g.fillStyle = '#9a9a9a';
  g.font = '500 30px Inter, Arial, sans-serif';
  g.fillText('Press Start. Run. Done. No subscription.', 70, 200);

  // route
  const pts = run.points || [];
  if (pts.length > 1) {
    const b = bbox(pts);
    const lat0 = (b.minLat + b.maxLat) / 2;
    const kx = Math.cos((lat0 * Math.PI) / 180);
    const wDeg = (b.maxLng - b.minLng) * kx || 1e-6;
    const hDeg = b.maxLat - b.minLat || 1e-6;
    const box = { x: 70, y: 260, w: W - 140, h: 560 };
    const s = Math.min(box.w / wDeg, box.h / hDeg);
    const ox = box.x + (box.w - wDeg * s) / 2;
    const oy = box.y + (box.h - hDeg * s) / 2;
    const P = (p) => [ox + (p[1] - b.minLng) * kx * s, oy + (b.maxLat - p[0]) * s];
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(198,255,0,0.22)'; g.lineWidth = 26;
    g.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    g.strokeStyle = '#C6FF00'; g.lineWidth = 10;
    g.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    const [sx, sy] = P(pts[0]); const [ex, ey] = P(pts[pts.length - 1]);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx, sy, 16, 0, 7); g.fill();
    g.fillStyle = '#FF3B30'; g.beginPath(); g.arc(ex, ey, 16, 0, 7); g.fill();
  }

  // stats
  g.fillStyle = '#fff';
  g.font = '900 150px Outfit, Arial Black, sans-serif';
  g.fillText(`${run.distance.toFixed(2)}`, 70, 990);
  const wDist = g.measureText(`${run.distance.toFixed(2)}`).width;
  g.fillStyle = '#C6FF00';
  g.font = '800 54px Outfit, Arial, sans-serif';
  g.fillText('KM', 70 + wDist + 20, 990);

  const cols = [['TIME', fmtDuration(run.duration)], ['PACE', `${fmtPace(run.avgPace)}/km`], ['ELEV', `${run.elevGain} m`]];
  cols.forEach(([k, v], i) => {
    const x = 70 + i * 330;
    g.fillStyle = '#8a8a8a'; g.font = '600 28px Inter, Arial, sans-serif'; g.fillText(k, x, 1070);
    g.fillStyle = '#fff'; g.font = '700 54px "JetBrains Mono", Menlo, monospace'; g.fillText(v, x, 1135);
  });

  g.fillStyle = '#1A1A1A'; g.fillRect(0, 1200, W, 150);
  g.fillStyle = '#fff'; g.font = '700 38px Inter, Arial, sans-serif';
  g.fillText(`${userName} · ${run.place || 'Lekker run'}`, 70, 1268);
  g.fillStyle = '#9a9a9a'; g.font = '500 28px Inter, Arial, sans-serif';
  g.fillText(`${getWatch(run.watch).name} · vuka.lite`, 70, 1312);

  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

export async function shareToWhatsApp(run, userName) {
  const text = `Just ran ${run.distance.toFixed(2)} km in ${fmtDuration(run.duration)} (${fmtPace(run.avgPace)}/km) on VUKA Lite. No subscription. Vuka!`;
  const blob = await makeShareImage(run, userName);
  const file = new File([blob], `vuka-run-${run.id}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: 'My VUKA run' }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  // desktop / unsupported: download the image and open WhatsApp with the text
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return 'downloaded';
}
