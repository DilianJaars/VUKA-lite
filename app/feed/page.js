'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { m } from 'framer-motion';
import { useApp } from '@/components/AppProvider';
import MiniRoute from '@/components/MiniRoute';
import { Avatar, PageHeader, WatchLogo } from '@/components/ui';
import { IconChat, IconShield } from '@/components/Icons';
import { generateFeed, getRoute } from '@/lib/mock';
import { getWatch, cityLabel } from '@/lib/watches';
import { fmtShort, fmtPace, timeAgo } from '@/lib/format';

const COLORS = ['#C6FF00', '#FF3B30', '#38BDF8', '#F5C400', '#A78BFA', '#34D399', '#FB923C', '#F472B6'];
const colorFor = (n) => COLORS[n.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export default function FeedPage() {
  const { user, runs, likes, toggleLike } = useApp();
  const [filter, setFilter] = useState('all');
  const city = user.city === 'Other' ? 'Cape Town' : user.city;

  const items = useMemo(() => {
    const mine = runs
      .filter((r) => r.privacy === 'public')
      .slice(0, 2)
      .map((r) => ({ id: r.id, mine: true, user: { name: `${user.name} (you)`, city: r.city || city }, friend: true, caption: r.name, likes: 3, comments: 0, run: r }));
    return [...mine, ...generateFeed()];
  }, [runs, user.name, city]);

  const filters = [
    ['all', 'All'],
    ['near', `Near You (${cityLabel(user.city)})`],
    ['friends', 'Friends Only'],
    ['night', 'Safe Routes at Night'],
    ['budget', 'Budget Watch Runs'],
    ['township', 'Township Routes'],
  ];

  const shown = items.filter((it) => {
    const r = it.run;
    if (filter === 'near') return (it.user.city || r.city) === city;
    if (filter === 'friends') return it.friend;
    if (filter === 'night') return r.safety?.night && r.safety.rating >= 4;
    if (filter === 'budget') return getWatch(r.watch).budget;
    if (filter === 'township') return getRoute(r.routeId).township;
    return true;
  });

  return (
    <div>
      <PageHeader title="Feed" sub="Real runs from real SA runners. Yebo!" />
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur py-2 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-5" role="tablist" aria-label="Feed filters">
          {filters.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={`chip ${filter === k ? 'chip-on' : ''}`}>{label}</button>
          ))}
        </div>
      </div>

      <ul className="px-5 mt-4 space-y-5">
        {shown.length === 0 && <li className="card p-8 text-center text-white/60">No runs match that filter yet. Try another one.</li>}
        {shown.map((it, i) => {
          const r = it.run;
          const w = getWatch(r.watch);
          const route = getRoute(r.routeId);
          const liked = !!likes[it.id];
          const night = r.safety?.night;
          return (
            <m.li key={it.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.3, delay: Math.min(i, 3) * 0.05 }}>
              <article className="card overflow-hidden">
                <header className="flex items-center gap-3 p-4">
                  <Avatar name={it.user.name} color={it.mine ? user.color : colorFor(it.user.name)} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{it.user.name}</div>
                    <div className="text-xs text-white/55 truncate">{r.place} · {cityLabel(it.user.city)} · {timeAgo(r.date)}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-white/60 shrink-0"><WatchLogo id={w.id} size={26} />{w.short}</span>
                </header>
                <Link href={`/run/${it.id}`} className="block relative" aria-label={`Open run: ${r.place}`}>
                  <MiniRoute points={r.points} className="w-full h-[210px]" w={420} h={260} pad={26} />
                  {route.township && <span className="absolute top-3 left-3 chip bg-black/80 text-lime border-lime/40">Township route</span>}
                </Link>
                <div className="p-4">
                  <p className="text-[15px] mb-3">{it.caption}</p>
                  <div className="grid grid-cols-3 gap-2 stat">
                    <div><div className="label">Distance</div><div className="text-xl font-bold">{r.distance.toFixed(1)}<span className="text-xs text-white/50 ml-0.5">km</span></div></div>
                    <div><div className="label">Time</div><div className="text-xl font-bold">{fmtShort(r.duration)}</div></div>
                    <div><div className="label">Pace</div><div className="text-xl font-bold">{fmtPace(r.avgPace)}</div></div>
                  </div>
                  {r.safety?.rating > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs rounded-xl bg-white/5 px-3 py-2">
                      <IconShield size={16} className={night ? 'text-lime' : 'text-white/50'} />
                      <span><b>{night ? 'Safe at night' : 'Daytime route'} {r.safety.rating}/5</b> <span className="text-white/55">by locals</span></span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => toggleLike(it.id)} aria-pressed={liked} aria-label={`${liked ? 'Remove fire' : 'Give fire'}, ${it.likes + (liked ? 1 : 0)} so far`} className={`chip !min-h-[44px] !px-4 ${liked ? 'bg-start/20 border-start text-white' : ''}`}>
                      <span className={`text-lg ${liked ? '' : 'grayscale opacity-70'}`}>🔥</span> <b className="stat">{it.likes + (liked ? 1 : 0)}</b>
                    </button>
                    <Link href={`/run/${it.id}#comments`} className="chip !min-h-[44px] !px-4"><IconChat size={18} /> <b className="stat">{it.comments}</b></Link>
                    <Link href={`/run/${it.id}`} className="ml-auto text-lime text-sm font-bold min-h-[44px] flex items-center">Details →</Link>
                  </div>
                </div>
              </article>
            </m.li>
          );
        })}
      </ul>
    </div>
  );
}
