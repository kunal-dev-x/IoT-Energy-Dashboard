import { FiPower } from 'react-icons/fi';

export default function DeviceCard({ name, status, power, onToggle }) {
  const active = status === 'ON';
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Device</p>
          <h4 className="mt-1 text-xl font-semibold text-white">{name}</h4>
          <p className="mt-2 text-sm text-slate-300">Power: {power} W</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/5 text-slate-300'}`}>
          <FiPower />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-sm font-semibold ${active ? 'text-emerald-300' : 'text-slate-400'}`}>
          {active ? 'ON' : 'OFF'}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-9 w-16 items-center rounded-full p-1 transition ${
            active ? 'bg-emerald-400/80' : 'bg-slate-700'
          }`}
        >
          <span
            className={`h-7 w-7 rounded-full bg-white shadow transition ${
              active ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}