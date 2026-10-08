'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Leaflet + OpenStreetMap. Loaded lazily - never part of the initial bundle.
export default function LeafletMap({ points = [], live = false, tiles = true, interactive = true, center, onTile, className = '', ariaLabel = 'Route map' }) {
  const el = useRef(null);
  const st = useRef({});
  const tileCb = useRef(onTile);
  tileCb.current = onTile;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let dead = false;
    let ro;
    (async () => {
      const L = (await import('leaflet')).default;
      if (dead || !el.current) return;
      const map = L.map(el.current, {
        zoomControl: false, attributionControl: false, dragging: interactive, touchZoom: interactive,
        scrollWheelZoom: false, doubleClickZoom: interactive, boxZoom: false, keyboard: false, zoomSnap: 0.5,
      });
      map.setView(center || [-33.9249, 18.4241], 15);
      if (tiles) {
        const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, crossOrigin: true });
        layer.on('tileload', () => tileCb.current && tileCb.current());
        layer.addTo(map);
        L.control.attribution({ prefix: false, position: 'bottomright' }).addAttribution('© OpenStreetMap').addTo(map);
      } else {
        el.current.classList.add('no-tiles');
      }
      st.current = { L, map };
      ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(el.current);
      setReady(true);
    })();
    return () => {
      dead = true;
      if (ro) ro.disconnect();
      if (st.current.map) st.current.map.remove();
      st.current = {};
      setReady(false);
    };
  }, [tiles]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    const { L, map } = st.current;
    if (!map) return;
    const ll = points.map((p) => [p[0], p[1]]);
    const s = st.current;
    if (!s.line) {
      s.glow = L.polyline([], { color: '#C6FF00', weight: 12, opacity: 0.18, lineJoin: 'round' }).addTo(map);
      s.line = L.polyline([], { color: '#C6FF00', weight: 5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }).addTo(map);
      s.start = L.circleMarker([0, 0], { radius: 7, color: '#000', weight: 2, fillColor: '#fff', fillOpacity: 1 });
      s.end = L.circleMarker([0, 0], { radius: 8, color: '#fff', weight: 3, fillColor: live ? '#FF3B30' : '#C6FF00', fillOpacity: 1 });
    }
    s.line.setLatLngs(ll);
    s.glow.setLatLngs(ll);
    if (ll.length) {
      s.start.setLatLng(ll[0]).addTo(map);
      s.end.setLatLng(ll[ll.length - 1]).addTo(map);
    }
    if (live) {
      if (ll.length) {
        if (!s.followed) { map.setView(ll[ll.length - 1], 17, { animate: false }); s.followed = true; }
        else map.panTo(ll[ll.length - 1], { animate: true, duration: 0.8 });
      }
    } else if (ll.length > 1) {
      map.fitBounds(L.latLngBounds(ll), { padding: [28, 28], animate: false });
    } else if (ll.length === 1) {
      map.setView(ll[0], 16);
    }
  }, [points, ready, live]);

  return <div ref={el} className={className} role="img" aria-label={ariaLabel} />;
}
