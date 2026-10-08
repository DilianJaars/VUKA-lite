'use client';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtPace } from '@/lib/format';

const LIME = '#C6FF00';
const SKY = '#38BDF8';
const ORANGE = '#FB923C';
const axis = { tickLine: false, axisLine: false, tick: { fill: 'rgba(255,255,255,.55)', fontSize: 11 } };
const tipStyle = { background: '#0A0A0A', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, fontSize: 12, color: '#fff' };
const paceLabel = (v) => `${fmtPace(v * 60)}/km`;

function Frame({ height = 200, children }) {
  return <div style={{ width: '100%', height }}><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

export function WeeklyChart({ data, goal }) {
  return (
    <Frame>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axis} interval={1} />
        <YAxis {...axis} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,.06)' }} contentStyle={tipStyle} formatter={(v) => [`${v} km`, 'Distance']} />
        {goal ? <ReferenceLine y={goal} stroke="#FF3B30" strokeDasharray="4 4" /> : null}
        <Bar dataKey="km" fill={LIME} radius={[5, 5, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function PaceChart({ data }) {
  return (
    <Frame>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={30} />
        <YAxis {...axis} reversed domain={['dataMin - 0.2', 'dataMax + 0.2']} tickFormatter={(v) => fmtPace(v * 60).replace('"', '')} width={48} />
        <Tooltip contentStyle={tipStyle} formatter={(v) => [paceLabel(v), 'Avg pace']} />
        <Line type="monotone" dataKey="pace" stroke={SKY} strokeWidth={3} dot={{ r: 2.5, fill: SKY, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </Frame>
  );
}

export function ElevChart({ data }) {
  return (
    <Frame>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="elev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ORANGE} stopOpacity={0.5} />
            <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axis} interval={1} />
        <YAxis {...axis} />
        <Tooltip contentStyle={tipStyle} formatter={(v) => [`${v} m`, 'Elevation gain']} />
        <Area type="monotone" dataKey="elev" stroke={ORANGE} strokeWidth={3} fill="url(#elev)" />
      </AreaChart>
    </Frame>
  );
}

// run detail: elevation profile + heart rate against distance
export function ProfileChart({ data, dataKey, color = ORANGE, unit, height = 160, id }) {
  return (
    <Frame height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="km" {...axis} type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${Math.round(v * 10) / 10}`} />
        <YAxis {...axis} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(v) => Math.round(v)} />
        <Tooltip contentStyle={tipStyle} labelFormatter={(v) => `${(+v).toFixed(2)} km`} formatter={(v) => [`${Math.round(v)} ${unit}`, '']} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </Frame>
  );
}
