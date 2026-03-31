import { useEffect, useMemo, useState, useRef } from 'react';
import { FiActivity, FiBarChart2, FiDollarSign, FiPower, FiTrendingUp, FiZap, FiPause, FiPlay } from 'react-icons/fi';
import DataCard from '../components/DataCard';
import Charts from '../components/Charts';
import Controls from '../components/Controls';
import { fetchMetrics, sendControl, mockMetrics, fetchDailyEnergy } from '../services/api';

// ================= SAMPLE DATA FOR CHARTS =================
function generateSamplePowerData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const time = `${String(i).padStart(2, '0')}:00`;
    const power = Math.round(400 + Math.random() * 800 + Math.sin(i / 6) * 300);
    data.push({ time, power: Math.max(0, Math.min(2200, power)) });
  }
  return data;
}

function generateSampleEnergyData() {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, idx) => {
    const energy = 15 + Math.random() * 35 + Math.sin(idx / 2) * 10;
    data.push({ day, energy: parseFloat(Math.max(0, Math.min(60, energy)).toFixed(1)) });
  });
  return data;
}

function generateSampleVCData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const time = `${String(i).padStart(2, '0')}:00`;
    const voltage = 220 + Math.random() * 20 + Math.sin(i / 6) * 10;
    const current = 1.5 + Math.random() * 3 + Math.sin(i / 5) * 1;
    data.push({ time, voltage: parseFloat(voltage.toFixed(1)), current: parseFloat(current.toFixed(2)) });
  }
  return data;
}

const cardConfig = [
  { key: 'voltage', label: 'Voltage', unit: 'V', range: [223, 238], icon: FiZap, accent: 'linear-gradient(120deg, rgba(34,211,238,0.4), rgba(99,102,241,0.35))' },
  { key: 'current', label: 'Current', unit: 'A', range: [1.4, 4.8], icon: FiActivity, accent: 'linear-gradient(120deg, rgba(16,185,129,0.4), rgba(34,211,238,0.35))' },
  { key: 'power', label: 'Power', unit: 'W', range: [480, 1050], icon: FiPower, accent: 'linear-gradient(120deg, rgba(251,191,36,0.4), rgba(34,197,94,0.35))' },
  { key: 'energy', label: 'Energy Units', unit: 'kWh', range: [12, 44], icon: FiTrendingUp, accent: 'linear-gradient(120deg, rgba(168,85,247,0.45), rgba(34,211,238,0.35))' },
  { key: 'frequency', label: 'Frequency', unit: 'Hz', range: [49.6, 50.4], icon: FiBarChart2, accent: 'linear-gradient(120deg, rgba(56,189,248,0.45), rgba(96,165,250,0.35))' },
  { key: 'pf', label: 'Power Factor', unit: '', range: [0.9, 0.99], icon: FiActivity, accent: 'linear-gradient(120deg, rgba(52,211,153,0.45), rgba(14,165,233,0.35))' },
  { key: 'cost', label: 'Cost', unit: '₹', range: [140, 260], icon: FiDollarSign, accent: 'linear-gradient(120deg, rgba(236,72,153,0.45), rgba(59,130,246,0.35))' },
];

const switchesDefault = {
  main: true,
  light: false,
  fan: false,
  ac: false,
  charging: false,
};

export default function Dashboard() {
  // ===== METRIC STATE =====
  const [metrics, setMetrics] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 50,
    pf: 0.95,
    cost: 0,
  });

  // ===== CHART DATA STATE =====
  const [powerData, setPowerData] = useState([]);
  const [vcData, setVcData] = useState([]);
  const [energyData, setEnergyData] = useState(generateSampleEnergyData());
  const [switchStates, setSwitchStates] = useState(switchesDefault);

  // ===== LIVE MODE STATE =====
  const [liveMode, setLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  // ===== REFS FOR CHART DATA BUFFER =====
  const powerBufferRef = useRef([]);
  const vcBufferRef = useRef([]);
  const MAX_POINTS = 50; // Keep last 50 data points (~90 seconds at 1.5s interval)

  // ===== FETCH DAILY ENERGY (ONCE ON MOUNT) =====
  useEffect(() => {
    const fetchDailyData = async () => {
      try {
        const dailyResult = await fetchDailyEnergy(7);
        const dailyData = dailyResult?.data || dailyResult || [];
        if (dailyData && Array.isArray(dailyData) && dailyData.length > 0) {
          setEnergyData(dailyData.map(d => ({
            day: new Date(d.date || d.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
            energy: parseFloat((d.energy_kwh || 0).toFixed(1))
          })));
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch daily energy, using sample data:', err.message);
        // Keep default sample data
      }
    };

    fetchDailyData();
  }, []); // Run once on mount

  // ===== LIVE METRICS POLLING (1.5 seconds) =====
  useEffect(() => {
    if (!liveMode) return; // Skip polling if live mode is off

    const fetchLiveMetrics = async () => {
      try {
        const data = await fetchMetrics();

        // ✅ Update metrics display (store as numbers, not strings)
        setMetrics({
          voltage: parseFloat(data.voltage || 0),
          current: parseFloat(data.current || 0),
          power: parseInt(data.power || 0),
          energy: parseFloat(data.energy || 0),
          frequency: parseFloat(data.frequency || 50),
          pf: parseFloat(data.pf || 0.95),
          cost: parseFloat(data.cost || 0),
        });

        // ✅ Sync relay state from backend
        if (data.relay_state) {
          setSwitchStates((prev) => ({
            ...prev,
            main: data.relay_state === "ON"
          }));
        }

        // ✅ ADD TO POWER CHART BUFFER (Real-time every 1.5 seconds)
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const powerPoint = {
          time: timeStr,
          power: Math.round(data.power || 0),
          timestamp: now.getTime(),
        };
        
        powerBufferRef.current.push(powerPoint);
        if (powerBufferRef.current.length > MAX_POINTS) {
          powerBufferRef.current.shift(); // Remove oldest point
        }
        setPowerData([...powerBufferRef.current]); // Trigger re-render with copy

        // ✅ ADD TO VOLTAGE vs CURRENT CHART BUFFER (Real-time)
        const vcPoint = {
          time: timeStr,
          voltage: parseFloat(data.voltage || 0).toFixed(1),
          current: parseFloat(data.current || 0).toFixed(2),
          timestamp: now.getTime(),
        };
        
        vcBufferRef.current.push(vcPoint);
        if (vcBufferRef.current.length > MAX_POINTS) {
          vcBufferRef.current.shift(); // Remove oldest point
        }
        setVcData([...vcBufferRef.current]); // Trigger re-render with copy

        // ✅ Update connection status
        setConnectionStatus('Online ✓');
        setLastUpdate(now);

        console.log('✓ Live metrics fetched:', {
          power: data.power,
          voltage: data.voltage,
          current: data.current,
          time: timeStr
        });

      } catch (error) {
        console.error('⚠️ Error fetching live metrics:', error.message);
        setConnectionStatus('Offline - Using Mock Data');
        
        // Fallback to mock data
        const mockData = mockMetrics();
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setMetrics({
          voltage: mockData.voltage,
          current: mockData.current,
          power: Math.round(mockData.power),
          energy: mockData.energy,
          frequency: mockData.frequency,
          pf: mockData.pf,
          cost: mockData.cost,
        });

        // Add to power buffer
        powerBufferRef.current.push({
          time: timeStr,
          power: Math.round(mockData.power),
          timestamp: now.getTime(),
        });
        if (powerBufferRef.current.length > MAX_POINTS) powerBufferRef.current.shift();
        setPowerData([...powerBufferRef.current]);

        // Add to VC buffer
        vcBufferRef.current.push({
          time: timeStr,
          voltage: mockData.voltage.toFixed(1),
          current: mockData.current.toFixed(2),
          timestamp: now.getTime(),
        });
        if (vcBufferRef.current.length > MAX_POINTS) vcBufferRef.current.shift();
        setVcData([...vcBufferRef.current]);

        setLastUpdate(now);
      }
    };

    // Fetch immediately on mount or when live mode turns on
    fetchLiveMetrics();

    // Set up polling interval (1.5 seconds for smooth real-time updates)
    const interval = setInterval(fetchLiveMetrics, 1500);

    return () => clearInterval(interval); // Cleanup on unmount or when live mode turns off

  }, [liveMode]); // Re-run effect when liveMode changes

  const cards = useMemo(
    () =>
      cardConfig.map((c) => {
        let value = metrics[c.key];
        
        // Format numbers with appropriate decimal places
        if (typeof value === 'number') {
          if (c.key === 'cost') value = value.toFixed(2);
          else if (c.key === 'pf') value = value.toFixed(3);
          else if (c.key === 'power') value = Math.round(value);
          else if (c.key === 'energy') value = value.toFixed(2);
          else value = value.toFixed(2);
        }
        
        return {
          ...c,
          value
        };
      }),
    [metrics]
  );

  const handleToggle = async (key, value) => {
    setSwitchStates((prev) => ({ ...prev, [key]: value }));
    
    // Send control command to API for main relay (Pin 17)
    if (key === 'main') {
      try {
        await sendControl('main', value);
      } catch (error) {
        console.error('Failed to control relay:', error);
        // Revert state on failure
        setSwitchStates((prev) => ({ ...prev, [key]: !value }));
      }
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ===== HEADER WITH LIVE STATUS ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Status: <span className={connectionStatus === 'Online ✓' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {connectionStatus}
            </span>
            {lastUpdate && (
              <> | Last Update: <span className="text-blue-400">{lastUpdate.toLocaleTimeString()}</span></>
            )}
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
          {liveMode ? <FiPlay size={18} /> : <FiPause size={18} />}
          {liveMode ? 'Live: ON' : 'Live: OFF'}
        </button>
      </div>

      {/* ===== METRIC CARDS SECTION ===== */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <DataCard
            key={card.key}
            title={card.label}
            value={card.value}
            unit={card.unit}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </section>

      <Charts powerData={powerData} energyData={energyData} vcData={vcData} />

      <Controls states={switchStates} onToggle={handleToggle} />

      <footer className="text-center text-sm text-slate-400">Demo Project – Energy Monitoring System</footer>
    </div>
  );
}
