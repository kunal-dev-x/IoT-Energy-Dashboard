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
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Device consumption breakdown (static for now)
  const deviceDataSample = [
    { name: 'AC', value: 35, color: '#22d3ee' },
    { name: 'Lights', value: 15, color: '#a855f7' },
    { name: 'Appliances', value: 30, color: '#ec4899' },
    { name: 'Electronics', value: 20, color: '#fbbf24' },
  ];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Fetch monthly data (12 months)
        const monthlyResponse = await fetch('http://localhost:5000/history/monthly?months=12');
        const monthlyJson = await monthlyResponse.json();
        
        if (monthlyJson.data) {
          const formattedMonthly = monthlyJson.data.map(item => ({
            month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            energy_kwh: parseFloat(item.energy_kwh) || 0,
            cost: parseFloat(item.cost) || 0,
            avg_power: parseFloat(item.avg_power) || 0,
          }));
          setMonthlyData(formattedMonthly);
        }

        // Fetch daily data (30 days)
        const dailyResponse = await fetch('http://localhost:5000/history/daily?days=30');
        const dailyJson = await dailyResponse.json();
        
        if (dailyJson.data) {
          const formattedDaily = dailyJson.data.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            energy_kwh: parseFloat(item.energy_kwh) || 0,
            cost: parseFloat(item.cost) || 0,
            avg_power: parseFloat(item.avg_power) || 0,
          }));
          setDailyData(formattedDaily);
        }

        // Fetch hourly waveform data
        const hourlyResponse = await fetch('http://localhost:5000/waveform?limit=24');
        const hourlyJson = await hourlyResponse.json();
        
        if (hourlyJson.data) {
          const formattedHourly = hourlyJson.data.map(item => ({
            hour: item.time || '00:00',
            power: parseFloat(item.power) || 0,
            voltage: parseFloat(item.voltage) || 0,
            current: parseFloat(item.current) || 0,
          }));
          setHourlyData(formattedHourly);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Calculate statistics
  const totalEnergy = monthlyData.reduce((sum, m) => sum + m.energy_kwh, 0);
  const totalCost = monthlyData.reduce((sum, m) => sum + m.cost, 0);
  const avgMonthlyPower = Math.round(
    monthlyData.reduce((sum, m) => sum + m.avg_power, 0) / monthlyData.length || 0
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Energy (12 Months)</p>
              <p className="text-3xl font-bold text-white mt-2">{totalEnergy.toFixed(0)} <span className="text-lg text-slate-400">kWh</span></p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Cost (12 Months)</p>
              <p className="text-3xl font-bold text-white mt-2">₹<span className="text-3xl">{totalCost.toFixed(0)}</span></p>
            </div>
            <FiBarChart2 className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Power (Live)</p>
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
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Energy Usage & Cost (Live Data)</h3>
          <p className="text-xs text-slate-400 mb-4">✓ Jan 26, Feb 26, Mar 26 + Historical Data</p>
          <div className="h-80">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  <YAxis yAxisId="left" tick={axisStyle} />
                  <YAxis yAxisId="right" orientation="right" tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  <Bar yAxisId="left" dataKey="energy_kwh" fill="url(#energyGrad)" name="Energy (kWh)" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="cost" fill="url(#costGrad)" name="Cost (₹)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                {loading ? 'Loading monthly data...' : 'No data available'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Chart */}
      {activeTab === 'daily' && (
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Last 30 Days Energy Consumption (Live)</h3>
          <div className="h-80">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={axisStyle} />
                  <YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="energy_kwh" stroke="#22d3ee" fill="url(#dailyGrad)" strokeWidth={2} name="Energy (kWh)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                {loading ? 'Loading daily data...' : 'No data available'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hourly Chart */}
      {activeTab === 'hourly' && (
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Hourly Power Distribution (Live)</h3>
          <div className="h-80">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={axisStyle} />
                  <YAxis tick={axisStyle} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="power" stroke="#fbbf24" strokeWidth={3} dot={false} name="Power (W)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                {loading ? 'Loading hourly data...' : 'No data available'}
              </div>
            )}
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
                  <Pie data={deviceDataSample} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
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
                  <Pie data={deviceDataSample} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
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
