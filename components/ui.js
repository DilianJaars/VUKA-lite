'use client';
import { getWatch } from '@/lib/watches';
import { IconStar } from './Icons';
import { initials } from '@/lib/format';

export function WatchLogo({ id, size = 44, className = '' }) {
  const w = getWatch(id);
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 font-heading font-extrabold rounded-xl ${className}`}
      style={{ width: size, height: size, background: w.color, color: w.ink, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {w.mark}
    </span>
  );
}

export function Avatar({ name, color = '#C6FF00', size = 44 }) {
  return (
    <span className="inline-flex items-center justify-center shrink-0 rounded-full font-heading font-extrabold text-black" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function PageHeader({ title, sub, right }) {
  return (
    <header className="px-5 pt-6 pb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[34px] leading-[1] uppercase">{title}</h1>
        <div className="mt-2 h-[6px] w-16 bg-lime" />
        {sub && <p className="mt-3 text-sm text-white/65">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Stat({ label, value, unit, className = '', big = false }) {
  return (
    <div className={`glass p-4 ${className}`}>
      <div className="label">{label}</div>
      <div className={`stat font-bold mt-1 leading-none ${big ? 'text-4xl' : 'text-2xl'}`}>
        {value}
        {unit && <span className="text-sm text-white/55 font-medium ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 24 }) {
  return (
    <div className="flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value >= n - 0.25;
        const half = !on && value >= n - 0.75;
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-1 -m-0.5" aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            <IconStar size={size} on={value >= n} />
          </button>
        ) : (
          <span key={n} className={half ? 'opacity-60' : ''}><IconStar size={size} on={on || half} /></span>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange, label, sub, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="w-full flex items-center justify-between gap-4 py-3 min-h-[56px] text-left disabled:opacity-40"
    >
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {sub && <span className="block text-xs text-white/55 mt-0.5">{sub}</span>}
      </span>
      <span className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${on ? 'bg-lime' : 'bg-white/15'}`}>
        <span className={`absolute top-1 w-6 h-6 rounded-full transition-all ${on ? 'left-7 bg-black' : 'left-1 bg-white'}`} />
      </span>
    </button>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={`flex-1 min-h-[44px] rounded-full text-sm font-bold px-3 ${value === o.value ? 'bg-lime text-black' : 'text-white/70'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ComparisonTable() {
  const rows = [
    ['Price', 'R279 / month', 'R0. Forever.'],
    ['Per year', 'R3,348', 'R0'],
    ['Works offline', 'Limited', 'Yes - saves & syncs later'],
    ['Data saver mode', 'No', 'Yes - maps optional'],
    ['SA budget watches', 'Hit and miss', '14 brands + GPX / TCX / FIT'],
    ['Safe-at-night route ratings', 'Paid extra', 'By locals, free'],
    ['Export all your runs', 'Gated', 'One tap GPX'],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-white" role="table" aria-label="Strava versus VUKA Lite">
      <div role="row" className="grid grid-cols-[1.1fr_1fr_1.2fr] text-xs uppercase tracking-wider font-bold">
        <div className="p-3 bg-white/5" role="columnheader"><span className="sr-only">Feature</span></div>
        <div className="p-3 bg-white/5 text-white/70" role="columnheader">Strava</div>
        <div className="p-3 bg-lime text-black" role="columnheader">VUKA Lite</div>
      </div>
      {rows.map(([k, a, b], i) => (
        <div role="row" key={k} className={`grid grid-cols-[1.1fr_1fr_1.2fr] text-[13px] ${i % 2 ? 'bg-white/[0.03]' : ''}`}>
          <div className="p-3 font-semibold text-white/80" role="rowheader">{k}</div>
          <div className="p-3 text-white/60" role="cell">{a}</div>
          <div className="p-3 font-bold text-lime" role="cell">{b}</div>
        </div>
      ))}
    </div>
  );
}
