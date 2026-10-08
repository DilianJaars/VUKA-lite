// Real GPX / TCX / FIT parsers + GPX writer. No dependencies (keeps JS tiny).
import { thin, summarize } from './geo';

const DEFAULT_PACE = 345; // s/km, used only when a file has no timestamps

function finish(raw, name, format) {
  // raw: [{lat,lng,ele,time(ms|null),hr}]
  const pts = raw.filter((p) => isFinite(p.lat) && isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
  if (pts.length < 2) throw new Error('No GPS track found in this file');
  const hasTime = pts.every((p) => p.time) && pts[pts.length - 1].time > pts[0].time;
  const t0 = hasTime ? pts[0].time : 0;
  let acc = 0;
  const points = pts.map((p, i) => {
    let t;
    if (hasTime) t = (p.time - t0) / 1000;
    else {
      if (i > 0) {
        const a = pts[i - 1], b = p;
        const dLat = (b.lat - a.lat) * 111320;
        const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
        acc += (Math.hypot(dLat, dLng) / 1000) * DEFAULT_PACE;
      }
      t = acc;
    }
    return [+p.lat.toFixed(5), +p.lng.toFixed(5), p.ele != null ? +p.ele.toFixed(1) : 0, Math.round(t), p.hr || 0];
  });
  const slim = thin(points, 700);
  return {
    name: name || 'Imported run',
    format,
    startTime: hasTime ? new Date(t0).toISOString() : null,
    timed: hasTime,
    points: slim,
    summary: summarize(slim),
  };
}

const num = (v) => (v == null || v === '' ? null : parseFloat(v));

export function parseGPX(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('That GPX file looks corrupted');
  let els = Array.from(doc.getElementsByTagName('trkpt'));
  if (!els.length) els = Array.from(doc.getElementsByTagName('rtept'));
  const raw = els.map((el) => {
    const g = (tag) => {
      const n = el.getElementsByTagName(tag)[0];
      return n ? n.textContent : null;
    };
    let hr = null;
    const all = el.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const ln = all[i].localName;
      if (ln === 'hr' || ln === 'heartrate') { hr = num(all[i].textContent); break; }
    }
    const time = g('time');
    return { lat: num(el.getAttribute('lat')), lng: num(el.getAttribute('lon')), ele: num(g('ele')), time: time ? Date.parse(time) : null, hr };
  });
  const nameEl = doc.getElementsByTagName('name')[0];
  return finish(raw, nameEl ? nameEl.textContent.trim() : null, 'GPX');
}

export function parseTCX(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('That TCX file looks corrupted');
  const els = Array.from(doc.getElementsByTagName('Trackpoint'));
  const raw = els
    .map((el) => {
      const g = (tag) => {
        const n = el.getElementsByTagName(tag)[0];
        return n ? n.textContent : null;
      };
      const time = g('Time');
      return { lat: num(g('LatitudeDegrees')), lng: num(g('LongitudeDegrees')), ele: num(g('AltitudeMeters')), time: time ? Date.parse(time) : null, hr: num(g('Value')) };
    })
    .filter((p) => p.lat != null && p.lng != null);
  const idEl = doc.getElementsByTagName('Id')[0];
  return finish(raw, idEl ? 'TCX activity' : null, 'TCX');
}

// Minimal Garmin FIT decoder: reads "record" messages (global #20)
export function parseFIT(buf) {
  const dv = new DataView(buf);
  const headerSize = dv.getUint8(0);
  const sig = String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11));
  if (sig !== '.FIT') throw new Error('Not a valid FIT file');
  const dataSize = dv.getUint32(4, true);
  const end = Math.min(buf.byteLength, headerSize + dataSize);
  const defs = {};
  const raw = [];
  const SEMI = 180 / 2147483648;
  let pos = headerSize;
  let lastTs = 0;

  const read = (off, size, signed, le) => {
    if (size === 1) return signed ? dv.getInt8(off) : dv.getUint8(off);
    if (size === 2) return signed ? dv.getInt16(off, le) : dv.getUint16(off, le);
    if (size === 4) return signed ? dv.getInt32(off, le) : dv.getUint32(off, le);
    return null;
  };

  while (pos < end - 1) {
    const h = dv.getUint8(pos++);
    let local, compressed = false, timeOffset = 0;
    if (h & 0x80) {
      compressed = true;
      local = (h >> 5) & 0x03;
      timeOffset = h & 0x1f;
    } else if (h & 0x40) {
      // definition message
      local = h & 0x0f;
      const hasDev = !!(h & 0x20);
      pos++; // reserved
      const le = dv.getUint8(pos++) === 0;
      const global = dv.getUint16(pos, le);
      pos += 2;
      const nf = dv.getUint8(pos++);
      const fields = [];
      for (let i = 0; i < nf; i++) {
        fields.push({ num: dv.getUint8(pos), size: dv.getUint8(pos + 1), base: dv.getUint8(pos + 2) });
        pos += 3;
      }
      let devSize = 0;
      if (hasDev) {
        const nd = dv.getUint8(pos++);
        for (let i = 0; i < nd; i++) { devSize += dv.getUint8(pos + 1); pos += 3; }
      }
      defs[local] = { le, global, fields, devSize };
      continue;
    } else {
      local = h & 0x0f;
    }
    const def = defs[local];
    if (!def) break;
    const rec = {};
    let p = pos;
    for (const f of def.fields) {
      // base types: 0x01 sint8, 0x83 sint16, 0x85 sint32 -> signed
      const signed = f.base === 0x01 || f.base === 0x83 || f.base === 0x85;
      if (def.global === 20 && [253, 0, 1, 2, 3, 78].includes(f.num)) rec[f.num] = read(p, f.size, signed, def.le);
      else if (f.num === 253) rec[253] = read(p, f.size, false, def.le);
      p += f.size;
    }
    pos = p + def.devSize;
    if (rec[253] != null) lastTs = rec[253];
    else if (compressed) {
      const base = lastTs & ~0x1f;
      lastTs = timeOffset >= (lastTs & 0x1f) ? base + timeOffset : base + 0x20 + timeOffset;
      rec[253] = lastTs;
    }
    if (def.global !== 20) continue;
    const la = rec[0], lo = rec[1];
    if (la == null || lo == null || la === 0x7fffffff || lo === 0x7fffffff) continue;
    let ele = null;
    const alt = rec[78] != null && rec[78] !== 0xffffffff ? rec[78] : rec[2] != null && rec[2] !== 0xffff ? rec[2] : null;
    if (alt != null) ele = alt / 5 - 500;
    raw.push({
      lat: la * SEMI,
      lng: lo * SEMI,
      ele,
      time: rec[253] != null ? (rec[253] + 631065600) * 1000 : null,
      hr: rec[3] && rec[3] !== 0xff ? rec[3] : null,
    });
  }
  return finish(raw, 'Garmin FIT activity', 'FIT');
}

export async function parseActivityFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (file.size > 25 * 1024 * 1024) throw new Error('File too big (max 25 MB)');
  let res;
  if (ext === 'fit') res = parseFIT(await file.arrayBuffer());
  else {
    const text = await file.text();
    if (ext === 'tcx' || /<TrainingCenterDatabase/i.test(text.slice(0, 600))) res = parseTCX(text);
    else if (ext === 'gpx' || /<gpx/i.test(text.slice(0, 600))) res = parseGPX(text);
    else throw new Error('Use a .gpx, .tcx or .fit file');
  }
  if (res.name === 'Imported run' || /activity$/i.test(res.name)) res.name = file.name.replace(/\.[^.]+$/, '');
  return res;
}

const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

function trkXml(run) {
  const t0 = new Date(run.date).getTime();
  const pts = run.points
    .map((p) => {
      const hr = p[4] ? `<extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>${p[4]}</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>` : '';
      return `<trkpt lat="${p[0]}" lon="${p[1]}"><ele>${p[2]}</ele><time>${new Date(t0 + p[3] * 1000).toISOString()}</time>${hr}</trkpt>`;
    })
    .join('');
  return `<trk><name>${esc(run.name)}</name><type>running</type><trkseg>${pts}</trkseg></trk>`;
}

const HEAD = '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="VUKA Lite" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">';

export function toGPX(run) {
  return `${HEAD}<metadata><name>${esc(run.name)}</name><time>${new Date(run.date).toISOString()}</time></metadata>${trkXml(run)}</gpx>`;
}

export function toMultiGPX(runs) {
  return `${HEAD}<metadata><name>VUKA Lite export</name><time>${new Date().toISOString()}</time></metadata>${runs.map(trkXml).join('')}</gpx>`;
}

export function download(filename, text, type = 'application/gpx+xml') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
