import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { driftValue, genBarData, genSeries, randomInRange, timeLabel } from '../data/mockData';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';

export default function Statistics() {
  const [daily, setDaily] = useState(() => genBarData(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'value', { min: 14, max: 32, decimals: 1 }));
  const [weekly, setWeekly] = useState(() => genBarData(['Week 1', 'Week 2', 'Week 3', 'Week 4'], 'value', { min: 140, max: 220, decimals: 1 }));
  const [vcData, setVcData] = useState(() =>
    genSeries(16, 'voltage', { min: 224, max: 238, decimals: 2 }).map((p) => ({ ...p, current: randomInRange(1.4, 4.6, 2) }))
  );
  const [peak, setPeak] = useState(() =>
    genSeries(12, 'load', { min: 480, max: 1080, decimals: 0 }).map((p, idx) => ({ ...p, label: `${idx + 6}:00` }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDaily((prev) => prev.map((d) => ({ ...d, value: driftValue(d.value, 14, 34, 0.4, 1) })));
      setWeekly((prev) => prev.map((d) => ({ ...d, value: driftValue(d.value, 140, 230, 1.2, 1) })));
      setVcData((prev) => {
        const last = prev[prev.length - 1] ?? { voltage: 230, current: 2.4 };
        const next = {
          time: timeLabel(),
          voltage: driftValue(last.voltage, 224, 238, 0.9, 2),
          current: driftValue(last.current, 1.4, 4.6, 0.16, 2),
        };
        return [...prev.slice(-15), next];
      });
      setPeak((prev) => prev.map((p) => ({ ...p, load: driftValue(p.load, 480, 1100, 18, 0) })));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5 shadow-glow">
        <header className="mb-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Analytics</p>
          <h3 className="text-lg font-semibold text-white">Daily Energy Consumption</h3>
        </header>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 60]} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} />
              <Bar dataKey="value" radius={[10, 10, 4, 4]} fill="url(#dailyGradient)">
                <defs>
                  <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 shadow-glow">
        <header className="mb-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Analytics</p>
          <h3 className="text-lg font-semibold text-white">Weekly Usage Comparison</h3>
        </header>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#weeklyGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 shadow-glow">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Live</p>
            <h3 className="text-lg font-semibold text-white">Voltage vs Current</h3>
          </div>
          <span className="text-xs text-slate-400">Realtime</span>
        </header>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vcData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[200, 260]} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 12]} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#a855f7" strokeWidth={2.2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 shadow-glow">
        <header className="mb-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Load</p>
          <h3 className="text-lg font-semibold text-white">Peak Load Time</h3>
        </header>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={peak} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.75} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="load" stroke="#f59e0b" fill="url(#peakGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}