import { useEffect, useState, useRef } from 'react';
import { FiActivity, FiCpu, FiPower, FiZap, FiDollarSign, FiBarChart2, FiPlayCircle } from 'react-icons/fi';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import DataCard from '../components/DataCard';
import { fetchMetrics, mockMetrics } from '../services/api';

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

export default function Monitoring() {
  const [metrics, setMetrics] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    cost: 0,
    frequency: 50,
    pf: 0.95,
    status: 'Connecting...',
    relay_state: 'OFF',
  });

  const [powerData, setPowerData] = useState([]);
  const [vcData, setVcData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const dataPointCounterRef = useRef(0);

  // ===== FETCH REAL-TIME METRICS =====
  const fetchLiveData = async () => {
    try {
      const data = await fetchMetrics();
      
      // Update metrics
      setMetrics({
        voltage: parseFloat(data.voltage || 0).toFixed(2),
        current: parseFloat(data.current || 0).toFixed(2),
        power: Math.round(data.power || 0),
        energy: parseFloat(data.energy || 0).toFixed(2),
        cost: parseFloat(data.cost || 0).toFixed(2),
        frequency: parseFloat(data.frequency || 50).toFixed(2),
        pf: parseFloat(data.pf || 0.95).toFixed(3),
        status: 'Online',
        relay_state: data.relay_state || 'OFF',
      });

      // Add to power chart (keep last 50 points)
      setPowerData((prev) => {
        const point = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          power: Math.round(data.power || 0),
          timestamp: Date.now(),
        };
        const updated = [...prev, point];
        return updated.slice(-50); // Keep only last 50 points
      });

      // Add to voltage vs current chart (keep last 50 points)
      setVcData((prev) => {
        const point = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          voltage: parseFloat(data.voltage || 0).toFixed(1),
          current: parseFloat(data.current || 0).toFixed(2),
          timestamp: Date.now(),
        };
        const updated = [...prev, point];
        return updated.slice(-50); // Keep only last 50 points
      });

      setLastUpdate(new Date());
      setLoading(false);
      
      console.log('✓ Live data fetched:', {
        voltage: data.voltage,
        current: data.current,
        power: data.power,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('⚠️ Error fetching live data:', error.message);
      setMetrics((prev) => ({
        ...prev,
        status: 'Offline - Using Mock Data',
      }));
      
      // Use mock data as fallback
      const mockData = mockMetrics();
      setPowerData((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          power: mockData.power,
          timestamp: Date.now(),
        },
      ].slice(-50));

      setVcData((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          voltage: mockData.voltage,
          current: mockData.current,
          timestamp: Date.now(),
        },
      ].slice(-50));

      setLoading(false);
    }
  };

  // ===== POLLING INTERVAL EFFECT =====
  useEffect(() => {
    if (!liveMode) return;

    // Fetch immediately on mount
    fetchLiveData();

    // Set up polling interval (1.5 seconds for smooth updates)
    const interval = setInterval(fetchLiveData, 1500);

    return () => clearInterval(interval);
  }, [liveMode]);

  // ===== METRIC CARDS CONFIG =====
  const cards = [
    { title: 'Voltage', value: metrics.voltage, unit: 'V', icon: FiZap, accent: 'linear-gradient(120deg, rgba(34,211,238,0.35), rgba(99,102,241,0.3))' },
    { title: 'Current', value: metrics.current, unit: 'A', icon: FiActivity, accent: 'linear-gradient(120deg, rgba(16,185,129,0.35), rgba(34,211,238,0.3))' },
    { title: 'Power', value: metrics.power, unit: 'W', icon: FiPower, accent: 'linear-gradient(120deg, rgba(251,191,36,0.35), rgba(34,197,94,0.3))' },
    { title: 'Energy', value: metrics.energy, unit: 'kWh', icon: FiCpu, accent: 'linear-gradient(120deg, rgba(168,85,247,0.4), rgba(34,211,238,0.3))' },
    { title: 'Cost', value: `₹${metrics.cost}`, unit: '', icon: FiDollarSign, accent: 'linear-gradient(120deg, rgba(236,72,153,0.4), rgba(99,102,241,0.3))' },
    { title: 'Frequency', value: metrics.frequency, unit: 'Hz', icon: FiBarChart2, accent: 'linear-gradient(120deg, rgba(56,189,248,0.45), rgba(96,165,250,0.35))' },
    { title: 'Power Factor', value: metrics.pf, unit: '', icon: FiPower, accent: 'linear-gradient(120deg, rgba(52,211,153,0.45), rgba(14,165,233,0.35))' },
    { title: 'Device Status', value: metrics.status || 'Connecting...', unit: '', icon: FiCpu, accent: 'linear-gradient(120deg, rgba(59,130,246,0.35), rgba(16,185,129,0.3))' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header with Live Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Real-Time Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">
            Last update: {lastUpdate.toLocaleTimeString()} | Status: 
            <span className={metrics.status === 'Online' ? ' text-emerald-400 font-semibold' : ' text-rose-400 font-semibold'}>
              {' ' + metrics.status}
            </span>
          </p>
        </div>

        {/* Live Mode Toggle */}
        <button
          onClick={() => setLiveMode(!liveMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            liveMode
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'bg-slate-500/20 text-slate-300 border border-slate-500/50'
          }`}
        >
          <FiPlayCircle size={18} />
          {liveMode ? 'Live Mode: ON' : 'Live Mode: OFF'}
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="glass rounded-2xl p-4 shadow-glow bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <p className="text-blue-300 text-sm">Connecting to backend... Polling every 1.5 seconds</p>
        </div>
      )}

      {/* Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <DataCard key={card.title} {...card} />
        ))}
      </section>

      {/* Real-Time Power Chart */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Real-Time</p>
            <h3 className="text-lg font-semibold text-white">Power Consumption (Last 50 Points)</h3>
            <p className="text-xs text-slate-400 mt-1">Updates every 1.5 seconds</p>
          </div>
          <div className={`w-3 h-3 rounded-full animate-pulse ${liveMode ? 'bg-emerald-500' : 'bg-slate-500'}`} />
        </div>
        <div className="h-80">
          {powerData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={powerData} margin={{ top: 10, right: 30, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
                <YAxis tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Line type="monotone" dataKey="power" stroke="#fbbf24" strokeWidth={2.5} dot={false} name="Power (W)" isAnimationActive={liveMode} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <p className="text-lg font-semibold">Waiting for data...</p>
                <p className="text-sm mt-2">Make sure backend is running on port 5000</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Voltage vs Current Chart */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Relationship</p>
            <h3 className="text-lg font-semibold text-white">Voltage vs Current (Last 50 Points)</h3>
            <p className="text-xs text-slate-400 mt-1">Live voltage and current correlation</p>
          </div>
          <div className={`w-3 h-3 rounded-full animate-pulse ${liveMode ? 'bg-emerald-500' : 'bg-slate-500'}`} />
        </div>
        <div className="h-80">
          {vcData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vcData} margin={{ top: 10, right: 30, left: -5, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} />
                <YAxis yAxisId="left" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} label={{ value: 'Current (A)', angle: 90, position: 'insideRight' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="Voltage (V)" isAnimationActive={liveMode} />
                <Line yAxisId="right" type="monotone" dataKey="current" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Current (A)" isAnimationActive={liveMode} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <p className="text-lg font-semibold">Waiting for data...</p>
                <p className="text-sm mt-2">Charts will display live data when available</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="glass rounded-2xl p-5 shadow-glow">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Monitoring Information</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-300">
          <div>
            <p className="font-semibold text-white mb-2">Update Frequency</p>
            <p>Every 1.5 seconds (auto-polling)</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Chart History</p>
            <p>Last 50 data points (~1.25 minutes)</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend API</p>
            <p>http://localhost:5000/metrics</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Live Mode</p>
            <p>{liveMode ? '✓ Enabled (Real-time updates)' : '✗ Disabled (paused)'}</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Device Status</p>
            <p>{metrics.relay_state === 'ON' ? '✓ Relay: ON' : '✗ Relay: OFF'}</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Connection</p>
            <p className={metrics.status === 'Online' ? 'text-emerald-400' : 'text-rose-400'}>
              {metrics.status === 'Online' ? '✓ Connected' : '⚠ Fallback Mode'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}