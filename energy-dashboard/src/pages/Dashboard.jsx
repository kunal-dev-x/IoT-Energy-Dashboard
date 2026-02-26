import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBarChart2, FiDollarSign, FiPower, FiTrendingUp, FiZap } from 'react-icons/fi';
import DataCard from '../components/DataCard';
import Charts from '../components/Charts';
import Controls from '../components/Controls';

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

const randomInRange = (min, max, decimals = 2) => Number((Math.random() * (max - min) + min).toFixed(decimals));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const drift = (prev, min, max, step, decimals = 2) => {
  const next = prev + randomInRange(-step, step, decimals);
  return Number(clamp(next, min, max).toFixed(decimals));
};

const timeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

const initialSeries = (length, min, max, key) =>
  Array.from({ length }).map(() => ({
    time: timeLabel(),
    [key]: randomInRange(min, max, key === 'power' ? 0 : 2),
  }));

const initialEnergy = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({ day, energy: randomInRange(16, 28, 2) }));
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState(() => {
    const values = {};
    cardConfig.forEach((c) => {
      values[c.key] = randomInRange(c.range[0], c.range[1], c.key === 'power' ? 0 : 2);
    });
    return values;
  });

  const [powerData, setPowerData] = useState(() => initialSeries(18, 520, 880, 'power'));
  const [vcData, setVcData] = useState(() =>
    initialSeries(18, 223, 238, 'voltage').map((p) => ({ ...p, current: randomInRange(1.6, 3.8, 2) }))
  );
  const [energyData, setEnergyData] = useState(initialEnergy);
  const [switchStates, setSwitchStates] = useState(switchesDefault);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prevMetrics) =>
        cardConfig.reduce((acc, c) => {
          const decimals = c.key === 'power' ? 0 : 2;
          const stepMap = {
            voltage: 1.5,
            current: 0.3,
            power: 70,
            energy: 0.12,
            frequency: 0.05,
            pf: 0.01,
            cost: 1.2,
          };
          const step = stepMap[c.key] ?? 0.2;
          const prev = prevMetrics[c.key] ?? randomInRange(c.range[0], c.range[1], decimals);
          acc[c.key] = drift(prev, c.range[0], c.range[1], step, decimals);
          return acc;
        }, {})
      );

      setPowerData((prev) => {
        const lastPower = prev[prev.length - 1]?.power ?? 700;
        const nextPoint = { time: timeLabel(), power: drift(lastPower, 520, 960, 60, 0) };
        return [...prev.slice(-17), nextPoint];
      });

      setVcData((prev) => {
        const last = prev[prev.length - 1] ?? { voltage: 230, current: 2.4 };
        const nextPoint = {
          time: timeLabel(),
          voltage: drift(last.voltage, 223, 238, 1.2, 2),
          current: drift(last.current, 1.4, 4.6, 0.25, 2),
        };
        return [...prev.slice(-17), nextPoint];
      });

      setEnergyData((prev) =>
        prev.map((item) => {
          const delta = randomInRange(-0.05, 0.35, 2);
          const energy = clamp(item.energy + delta, 12, 44);
          return { ...item, energy: Number(energy.toFixed(2)) };
        })
      );
    }, 2500);

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
