import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBarChart2, FiDollarSign, FiPower, FiTrendingUp, FiZap } from 'react-icons/fi';
import DataCard from '../components/DataCard';
import Charts from '../components/Charts';
import Controls from '../components/Controls';
import { fetchMetrics, sendControl, mockMetrics, fetchDailyEnergy, fetchHourlyPower } from '../services/api';

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
  const [metrics, setMetrics] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    energy: 0,
    frequency: 0,
    pf: 0,
    cost: 0,
  });

  const [powerData, setPowerData] = useState(generateSamplePowerData());
  const [vcData, setVcData] = useState(generateSampleVCData());
  const [energyData, setEnergyData] = useState(generateSampleEnergyData());
  const [switchStates, setSwitchStates] = useState(switchesDefault);

  // Fetch real-time metrics from API or fallback to mock
  useEffect(() => {
    const fetchAndUpdate = async () => {
      try {
        const data = await fetchMetrics();
        
        // Update with real API data
        setMetrics({
          voltage: data.voltage || 0,
          current: data.current || 0,
          power: data.power || 0,
          energy: data.energy || 0,
          frequency: data.frequency || 50,
          pf: data.pf || 0.95,
          cost: data.cost || 0,
        });

        // Sync relay state from backend if available
        if (data.relay_state) {
          setSwitchStates((prev) => ({
            ...prev,
            main: data.relay_state === "ON"
          }));
        }

        // Fetch chart data with fallback to sample data
        try {
          const dailyResult = await fetchDailyEnergy(7);
          const dailyData = dailyResult?.data || dailyResult || [];
          if (dailyData && Array.isArray(dailyData) && dailyData.length > 0) {
            setEnergyData(dailyData.map(d => ({
              day: new Date(d.date || d.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
              energy: parseFloat((d.energy_kwh || 0).toFixed(1))
            })));
          } else {
            setEnergyData(generateSampleEnergyData());
          }
        } catch (err) {
          console.warn('Failed to fetch daily energy, using sample data:', err);
          setEnergyData(generateSampleEnergyData());
        }

        try {
          const hourlyResult = await fetchHourlyPower(24);
          const hourlyData = hourlyResult?.data || hourlyResult || [];
          if (hourlyData && Array.isArray(hourlyData) && hourlyData.length > 0) {
            setPowerData(hourlyData.map(d => ({
              time: new Date(d.date || d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              power: Math.max(0, Math.min(2200, parseFloat(d.avg_power || d.power || 0)))
            })));
          } else {
            setPowerData(generateSamplePowerData());
          }
        } catch (err) {
          console.warn('Failed to fetch hourly power, using sample data:', err);
          setPowerData(generateSamplePowerData());
        }
      } catch (error) {
        console.warn('⚠️  Backend unavailable, using mock data:', error.message);
        // Fallback to mock metrics when backend is down
        const mockData = mockMetrics();
        setMetrics({
          voltage: mockData.voltage,
          current: mockData.current,
          power: mockData.power,
          energy: mockData.energy,
          frequency: mockData.frequency,
          pf: mockData.pf,
          cost: mockData.cost,
        });
      }
    };

    // Fetch immediately on mount
    fetchAndUpdate();

    // Fetch at intervals (2.5 second update)
    const interval = setInterval(fetchAndUpdate, 2500);

    return () => clearInterval(interval);
  }, []);

  const cards = useMemo(
    () =>
      cardConfig.map((c) => ({
        ...c,
        value: c.key === 'cost' ? metrics[c.key].toFixed(2) : metrics[c.key],
      })),
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
