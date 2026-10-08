'use client';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { heatGrid } from '@/lib/stats';

const shade = (km) => (km <= 0 ? 'rgba(255,255,255,0.06)' : km < 3 ? 'rgba(198,255,0,0.28)' : km < 6 ? 'rgba(198,255,0,0.5)' : km < 10 ? 'rgba(198,255,0,0.75)' : '#C6FF00');

// GitHub style running calendar, last 17 weeks
export default function Heatmap({ heat }) {
  const cols = useMemo(() => heatGrid(heat), [heat]);
  return (
    <div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-[4px] min-w-max" role="img" aria-label="Running calendar, last 17 weeks">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-col gap-[4px]">
              {col.map((c) => (
                <div
                  key={c.key}
                  title={`${format(c.date, 'EEE d MMM')}: ${c.km ? c.km.toFixed(1) + ' km' : 'rest day'}`}
                  className="w-[18px] h-[18px] rounded-[4px]"
                  style={{ background: c.future ? 'transparent' : shade(c.km), outline: c.future ? '1px dashed rgba(255,255,255,.06)' : 'none' }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-white/55">
        Less
        {[0, 2, 4, 8, 12].map((k) => <span key={k} className="w-3.5 h-3.5 rounded-[3px]" style={{ background: shade(k) }} />)}
        More
      </div>
    </div>
  );
}
