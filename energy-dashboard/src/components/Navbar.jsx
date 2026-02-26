import { useEffect, useState } from 'react';
import { FiCpu } from 'react-icons/fi';

export default function Navbar({ title = 'Energy Monitoring Dashboard', subtitle = 'Demo Project' }) {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateText = clock.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeText = clock.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-10 mb-6 bg-gradient-to-b from-[#050b18]/80 via-[#050b18]/60 to-transparent backdrop-blur">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 shadow-lg shadow-emerald-500/30">
            <FiCpu size={22} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{subtitle}</p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-right">
          <div className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-200 border border-white/10">
            <span className="text-slate-400">Date</span>
            <div className="font-medium text-white">{dateText}</div>
          </div>
          <div className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-200 border border-white/10">
            <span className="text-slate-400">Time</span>
            <div className="font-semibold text-white tracking-widest">{timeText}</div>
          </div>
        </div>
      </div>
    </header>
  );
}