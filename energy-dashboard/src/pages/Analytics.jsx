import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FiTrendingUp, FiCalendar, FiBarChart2 } from 'react-icons/fi';

const axisStyle = { stroke: '#94a3b8', fontSize: 12 };
const gridColor = '#1f2937';
const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '12px',
  padding: '10px 12px',
  color: '#e2e8f0',
};

// Sample Monthly Data
const monthlyDataSample = [
  { month: 'Jan', energy_kwh: 420, cost: 3570, avg_power: 580 },
  { month: 'Feb', energy_kwh: 385, cost: 3273, avg_power: 540 },
  { month: 'Mar', energy_kwh: 510, cost: 4335, avg_power: 650 },
  { month: 'Apr', energy_kwh: 465, cost: 3953, avg_power: 620 },
  { month: 'May', energy_kwh: 580, cost: 4930, avg_power: 720 },
  { month: 'Jun', energy_kwh: 625, cost: 5313, avg_power: 780 },
  { month: 'Jul', energy_kwh: 680, cost: 5780, avg_power: 850 },
  { month: 'Aug', energy_kwh: 665, cost: 5653, avg_power: 830 },
  { month: 'Sep', energy_kwh: 545, cost: 4633, avg_power: 680 },
  { month: 'Oct', energy_kwh: 475, cost: 4038, avg_power: 590 },
  { month: 'Nov', energy_kwh: 420, cost: 3570, avg_power: 520 },
  { month: 'Dec', energy_kwh: 490, cost: 4165, avg_power: 610 },
];

// Sample Daily Data
const dailyDataSample = [
  { date: 'Mar 20', energy_kwh: 15.2, cost: 129.2, avg_power: 630 },
  { date: 'Mar 21', energy_kwh: 14.8, cost: 125.8, avg_power: 615 },
  { date: 'Mar 22', energy_kwh: 16.5, cost: 140.3, avg_power: 680 },
  { date: 'Mar 23', energy_kwh: 14.1, cost: 119.9, avg_power: 587 },
  { date: 'Mar 24', energy_kwh: 17.3, cost: 147.1, avg_power: 720 },
  { date: 'Mar 25', energy_kwh: 16.8, cost: 142.8, avg_power: 700 },
  { date: 'Mar 26', energy_kwh: 15.5, cost: 131.8, avg_power: 645 },
  { date: 'Mar 27', energy_kwh: 18.2, cost: 154.7, avg_power: 756 },
  { date: 'Mar 28', energy_kwh: 16.9, cost: 143.7, avg_power: 704 },
  { date: 'Mar 29', energy_kwh: 14.3, cost: 121.6, avg_power: 596 },
  { date: 'Mar 30', energy_kwh: 15.7, cost: 133.5, avg_power: 652 },
];

// Hourly data sample
const hourlyDataSample = [
  { hour: '00:00', power: 250 },
  { hour: '01:00', power: 200 },
  { hour: '02:00', power: 180 },
  { hour: '03:00', power: 170 },
  { hour: '04:00', power: 160 },
  { hour: '05:00', power: 280 },
  { hour: '06:00', power: 450 },
  { hour: '07:00', power: 680 },
  { hour: '08:00', power: 750 },
  { hour: '09:00', power: 820 },
  { hour: '10:00', power: 900 },
  { hour: '11:00', power: 950 },
  { hour: '12:00', power: 1020 },
  { hour: '13:00', power: 980 },
  { hour: '14:00', power: 920 },
  { hour: '15:00', power: 850 },
  { hour: '16:00', power: 780 },
  { hour: '17:00', power: 920 },
  { hour: '18:00', power: 1050 },
  { hour: '19:00', power: 1100 },
  { hour: '20:00', power: 950 },
  { hour: '21:00', power: 720 },
  { hour: '22:00', power: 520 },
  { hour: '23:00', power: 380 },
];

// Device consumption breakdown
const deviceDataSample = [
  { name: 'AC', value: 35, color: '#22d3ee' },
  { name: 'Lights', value: 15, color: '#a855f7' },
  { name: 'Appliances', value: 30, color: '#ec4899' },
  { name: 'Electronics', value: 20, color: '#fbbf24' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('monthly');

  const totalEnergy = monthlyDataSample.reduce((sum, m) => sum + m.energy_kwh, 0);
  const totalCost = monthlyDataSample.reduce((sum, m) => sum + m.cost, 0);
  const avgMonthlyPower = Math.round(
    monthlyDataSample.reduce((sum, m) => sum + m.avg_power, 0) / monthlyDataSample.length
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Annual Energy</p>
              <p className="text-3xl font-bold text-white mt-2">{totalEnergy.toFixed(0)} <span className="text-lg text-slate-400">kWh</span></p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Annual Cost</p>
              <p className="text-3xl font-bold text-white mt-2">₹<span className="text-3xl">{totalCost.toFixed(0)}</span></p>
            </div>
            <FiBarChart2 className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Power</p>
              <p className="text-3xl font-bold text-white mt-2">{avgMonthlyPower} <span className="text-lg text-slate-400">W</span></p>
            </div>
            <FiCalendar className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass rounded-2xl p-4 shadow-glow">
        <div className="flex gap-2 border-b border-slate-700">
          {['monthly', 'daily', 'hourly', 'devices'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold capitalize transition ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Chart */}
      {activeTab === 'monthly' && (
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Energy Usage & Cost</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDataSample} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={axisStyle} />
                <YAxis yAxisId="left" tick={axisStyle} domain={[0, 700]} />
                <YAxis yAxisId="right" orientation="right" tick={axisStyle} domain={[0, 6000]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Bar yAxisId="left" dataKey="energy_kwh" fill="url(#energyGrad)" name="Energy (kWh)" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="url(#costGrad)" name="Cost (₹)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      {activeTab === 'daily' && (
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Last 11 Days Energy Consumption</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyDataSample} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={axisStyle} />
                <YAxis tick={axisStyle} domain={[0, 20]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="energy_kwh" stroke="#22d3ee" fill="url(#dailyGrad)" strokeWidth={2} name="Energy (kWh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      {activeTab === 'hourly' && (
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Hourly Power Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyDataSample} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={axisStyle} />
                <YAxis tick={axisStyle} domain={[0, 1200]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="power" stroke="#fbbf24" strokeWidth={3} dot={false} name="Power (W)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Device Breakdown */}
      {activeTab === 'devices' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5 shadow-glow">
            <h3 className="text-lg font-semibold text-white mb-4">Device Consumption %</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceDataSample} cx="50%" cy="50%" labelLine={false} label label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {deviceDataSample.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 shadow-glow flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-white mb-6">Device Details</h3>
            <div className="space-y-4">
              {deviceDataSample.map(device => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: device.color }} />
                    <p className="text-slate-300">{device.name}</p>
                  </div>
                  <p className="font-semibold text-white">{device.value}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
