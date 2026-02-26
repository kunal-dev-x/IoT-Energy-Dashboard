import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '12px',
  padding: '10px 12px',
  color: '#e2e8f0',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p className="text-sm text-slate-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Charts({ powerData, energyData, vcData }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="glass rounded-2xl p-4 sm:p-5 shadow-glow lg:col-span-2">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Real-time Power</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Watts</span>
        </header>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={powerData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 2200]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="power" stroke="#22d3ee" fill="url(#powerGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shadow-glow">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Daily Energy</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">kWh</span>
        </header>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={energyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 60]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="energy" radius={[10, 10, 4, 4]} fill="url(#energyGradient)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5 shadow-glow lg:col-span-3">
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Voltage vs Current</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
        </header>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vcData} margin={{ top: 10, right: 20, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} yAxisId="left" domain={[200, 260]} />
              <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} yAxisId="right" orientation="right" domain={[0, 15]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
              <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#a855f7" strokeWidth={2.2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}