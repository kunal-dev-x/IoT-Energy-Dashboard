import { useEffect, useState } from 'react';
import { FiActivity, FiCpu, FiPower, FiZap } from 'react-icons/fi';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import DataCard from '../components/DataCard';
import { driftValue, genSeries, randomInRange, timeLabel } from '../data/mockData';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';

export default function Monitoring() {
  const [metrics, setMetrics] = useState({
    voltage: 230,
    current: 4.2,
    power: 900,
    energy: 12,
    status: 'Online',
  });

  const [waveData, setWaveData] = useState(() =>
    genSeries(20, 'voltage', { min: 220, max: 240, decimals: 2 }).map((p) => ({
      ...p,
      current: randomInRange(1.4, 4.5, 2),
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        voltage: driftValue(prev.voltage ?? 230, 224, 236, 1.1, 2),
        current: driftValue(prev.current ?? 2.4, 1.4, 4.6, 0.18, 2),
        power: driftValue(prev.power ?? 720, 520, 980, 35, 0),
        energy: driftValue(prev.energy ?? 14, 10, 24, 0.18, 2),
        status: Math.random() > 0.93 ? 'Offline' : 'Online',
      }));

      setWaveData((prev) => {
        const last = prev[prev.length - 1] ?? { voltage: 230, current: 2.5 };
        const next = {
          time: timeLabel(),
          voltage: driftValue(last.voltage, 224, 238, 0.9, 2),
          current: driftValue(last.current, 1.4, 4.6, 0.16, 2),
        };
        return [...prev.slice(-19), next];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { title: 'Voltage', value: metrics.voltage, unit: 'V', icon: FiZap, accent: 'linear-gradient(120deg, rgba(34,211,238,0.35), rgba(99,102,241,0.3))' },
    { title: 'Current', value: metrics.current, unit: 'A', icon: FiActivity, accent: 'linear-gradient(120deg, rgba(16,185,129,0.35), rgba(34,211,238,0.3))' },
    { title: 'Power', value: metrics.power, unit: 'W', icon: FiPower, accent: 'linear-gradient(120deg, rgba(251,191,36,0.35), rgba(34,197,94,0.3))' },
    { title: 'Energy Usage', value: metrics.energy, unit: 'kWh', icon: FiCpu, accent: 'linear-gradient(120deg, rgba(168,85,247,0.4), rgba(34,211,238,0.3))' },
    { title: 'Device Status', value: metrics.status, unit: '', icon: FiCpu, accent: 'linear-gradient(120deg, rgba(59,130,246,0.35), rgba(16,185,129,0.3))' },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <DataCard key={card.title} {...card} />
        ))}
      </section>

      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Monitoring</p>
            <h3 className="text-xl font-semibold text-white">Live Waveform</h3>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${metrics.status === 'Online' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
            {metrics.status}
          </span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={waveData} margin={{ top: 10, right: 20, left: -5, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis yAxisId="left" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[200, 260]} />
              <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 12]} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12 }}
              />
              <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#22d3ee" strokeWidth={2.2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="current" stroke="#a855f7" strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}