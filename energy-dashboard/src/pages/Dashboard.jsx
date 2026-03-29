import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBarChart2, FiDollarSign, FiPower, FiTrendingUp, FiZap } from 'react-icons/fi';
import DataCard from '../components/DataCard';
import Charts from '../components/Charts';
import Controls from '../components/Controls';
import { fetchMetrics } from '../services/api';

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

  const [powerData, setPowerData] = useState([]);
  const [vcData, setVcData] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [switchStates, setSwitchStates] = useState(switchesDefault);

  // Fetch real-time metrics from API
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
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
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

  const handleToggle = (key, value) => {
    setSwitchStates((prev) => ({ ...prev, [key]: value }));
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
