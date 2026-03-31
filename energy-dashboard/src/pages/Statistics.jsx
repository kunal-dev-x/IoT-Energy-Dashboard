import { useEffect, useState, useRef } from 'react';
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

// ===== FALLBACK DATA =====
const FALLBACK_MONTHLY = [
  { month: '2026-01', energy_kwh: 362.13, cost: 3078.13, avg_power: 500, max_power: 850 },
  { month: '2026-02', energy_kwh: 313.96, cost: 2668.67, avg_power: 460, max_power: 820 },
  { month: '2026-03', energy_kwh: 265.66, cost: 2258.11, avg_power: 420, max_power: 780 },
];

const FALLBACK_DAILY = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    energy_kwh: 8 + Math.random() * 4,
    cost: 68 + Math.random() * 34,
    avg_power: 350 + Math.random() * 150,
    max_power: 500 + Math.random() * 300,
  };
});

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Statistics() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('api');
  const hourlyBufferRef = useRef([]);

  // Device consumption breakdown (static)
  const deviceDataSample = [
    { name: 'AC', value: 35, color: '#22d3ee' },
    { name: 'Lights', value: 15, color: '#a855f7' },
    { name: 'Appliances', value: 30, color: '#ec4899' },
    { name: 'Electronics', value: 20, color: '#fbbf24' },
  ];

  // ===== FETCH HISTORICAL DATA (ONCE ON MOUNT) =====
  useEffect(() => {
    const fetchStatisticsData = async () => {
      try {
        setLoading(true);
        let finalMonthly = [];
        let finalDaily = [];

        // Fetch monthly data
        try {
          const monthlyResponse = await fetch('http://localhost:5000/history/monthly?months=12');
          const monthlyJson = await monthlyResponse.json();
          
          if (monthlyJson.data && monthlyJson.data.length > 0) {
            finalMonthly = monthlyJson.data;
            setDataSource('api');
            console.log('✓ Fetched monthly data from API:', finalMonthly.length, 'months');
          } else {
            finalMonthly = FALLBACK_MONTHLY;
            console.log('⚠ Using fallback monthly data');
          }
        } catch (err) {
          console.error('⚠️ Error fetching monthly data:', err);
          finalMonthly = FALLBACK_MONTHLY;
        }

        // Fetch daily data
        try {
          const dailyResponse = await fetch('http://localhost:5000/history/daily?days=30');
          const dailyJson = await dailyResponse.json();
          
          if (dailyJson.data && dailyJson.data.length > 0) {
            finalDaily = dailyJson.data;
            console.log('✓ Fetched daily data from API:', finalDaily.length, 'days');
          } else {
            finalDaily = FALLBACK_DAILY;
            console.log('⚠ Using fallback daily data');
          }
        } catch (err) {
          console.error('⚠️ Error fetching daily data:', err);
          finalDaily = FALLBACK_DAILY;
        }

        // Format monthly data
        const formattedMonthly = finalMonthly.map(item => ({
          month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          energy_kwh: parseFloat(item.energy_kwh) || 0,
          cost: parseFloat(item.cost) || 0,
          avg_power: parseFloat(item.avg_power) || 0,
          max_power: parseFloat(item.max_power) || 0,
        }));
        setMonthlyData(formattedMonthly);

        // Format daily data
        const formattedDaily = finalDaily.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          energy_kwh: parseFloat(item.energy_kwh) || 0,
          cost: parseFloat(item.cost) || 0,
          avg_power: parseFloat(item.avg_power) || 0,
          max_power: parseFloat(item.max_power) || 0,
        }));
        setDailyData(formattedDaily);

        console.log('✓ Statistics data loaded:', {
          monthly: formattedMonthly.length,
          daily: formattedDaily.length,
        });

        setLoading(false);
      } catch (error) {
        console.error('⚠️ Error in fetchStatisticsData:', error);
        setMonthlyData(FALLBACK_MONTHLY);
        setDailyData(FALLBACK_DAILY);
        setLoading(false);
      }
    };

    fetchStatisticsData();
  }, []);

  // ===== LIVE POLLING FOR HOURLY DATA (every 2 seconds) =====
  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        const response = await fetch('http://localhost:5000/waveform?limit=50');
        const json = await response.json();

        if (json.data && json.data.length > 0) {
          const formattedHourly = json.data.map(item => ({
            time: item.time || '00:00',
            power: parseFloat(item.power) || 0,
          }));

          hourlyBufferRef.current = formattedHourly;
          setHourlyData([...formattedHourly]);
        }
      } catch (error) {
        console.error('⚠️ Error fetching hourly data:', error);
        // Keep previous data on error
      }
    };

    // Fetch immediately
    fetchHourlyData();

    // Poll every 2 seconds
    const interval = setInterval(fetchHourlyData, 2000);

    return () => clearInterval(interval);
  }, []);

  // ===== CALCULATE STATISTICS FROM DAILY DATA =====
  const totalEnergy = dailyData.reduce((sum, day) => sum + (day.energy_kwh || 0), 0);
  const totalCost = dailyData.reduce((sum, day) => sum + (day.cost || 0), 0);
  const avgDailyPower = dailyData.length > 0 
    ? Math.round(dailyData.reduce((sum, day) => sum + (day.avg_power || 0), 0) / dailyData.length)
    : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Energy (30d)</p>
              <p className="text-3xl font-bold text-white mt-2">
                {totalEnergy.toFixed(1)} <span className="text-lg text-slate-400">kWh</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Cost (30d)</p>
              <p className="text-3xl font-bold text-white mt-2">₹{totalCost.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-2">₹{(totalCost / 30).toFixed(0)}/day avg</p>
            </div>
            <FiBarChart2 className="w-8 h-8 text-pink-400" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Power (30d)</p>
              <p className="text-3xl font-bold text-white mt-2">
                {avgDailyPower} <span className="text-lg text-slate-400">W</span>
              </p>
              <p className="text-xs text-slate-500 mt-2">Daily average</p>
            </div>
            <FiCalendar className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* ===== MONTHLY STATISTICS SECTION ===== */}
      <div className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Analysis</p>
              <h3 className="text-lg font-semibold text-white">Monthly Statistics</h3>
              <p className="text-xs text-slate-400 mt-1">
                {dataSource === 'api' ? '✓ Real data from backend' : '⚠ Demo data (API fallback)'}
              </p>
            </div>
          </div>
        </div>

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
                <YAxis yAxisId="left" tick={axisStyle} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" tick={axisStyle} label={{ value: 'Cost (₹)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Bar yAxisId="left" dataKey="energy_kwh" fill="url(#energyGrad)" name="Energy (kWh)" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="url(#costGrad)" name="Cost (₹)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              {loading ? '⏳ Loading monthly data...' : '⚠️ No monthly data available'}
            </div>
          )}
        </div>
      </div>

      {/* ===== DAILY ENERGY SECTION ===== */}
      <div className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Consumption Pattern</p>
          <h3 className="text-lg font-semibold text-white">Daily Energy Consumption (Last 30 Days)</h3>
        </div>

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
                <YAxis tick={axisStyle} label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="energy_kwh" stroke="#22d3ee" fill="url(#dailyGrad)" strokeWidth={2} name="Energy (kWh)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              {loading ? '⏳ Loading daily data...' : '⚠️ No daily data available'}
            </div>
          )}
        </div>
      </div>

      {/* ===== HOURLY POWER DISTRIBUTION (LIVE) ===== */}
      <div className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Real-time</p>
          <h3 className="text-lg font-semibold text-white">Hourly Power Distribution (Live - Last 50 Points)</h3>
          <p className="text-xs text-slate-400 mt-1">🔴 Updates every 2 seconds</p>
        </div>

        <div className="h-80">
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={axisStyle} />
                <YAxis tick={axisStyle} label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="power" stroke="#fbbf24" strokeWidth={3} dot={false} name="Power (W)" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              ⏳ Waiting for live data...
            </div>
          )}
        </div>
      </div>

      {/* ===== DEVICE BREAKDOWN ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5 shadow-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Device Consumption %</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={deviceDataSample} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  label={({ name, value }) => `${name} ${value}%`} 
                  outerRadius={80} 
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {deviceDataSample.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Details Panel */}
        <div className="glass rounded-2xl p-5 shadow-glow flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-white mb-6">Device Details</h3>
          <div className="space-y-4">
            {deviceDataSample.map(device => (
              <div key={device.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: device.color }} />
                  <p className="text-slate-300 font-medium">{device.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-lg">{device.value}%</p>
                  <p className="text-slate-400 text-sm">({Math.round(device.value / 100 * (totalEnergy * 1000))} Wh)</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-400">Total: {deviceDataSample.reduce((sum, d) => sum + d.value, 0)}% assigned load</p>
          </div>
        </div>
      </div>
    </div>
  );
}
        
