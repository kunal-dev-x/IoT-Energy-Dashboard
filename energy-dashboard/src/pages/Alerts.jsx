import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { demoAlerts } from '../data/mockData';

const severityStyles = {
  critical: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
  high: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  medium: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(() => demoAlerts());

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) =>
        prev.map((alert, idx) => {
          // Only adjust a couple of rows per tick to keep things steady
          if (idx % 2 !== 0 && Math.random() > 0.6) return alert;
          const statusFlip = Math.random() > 0.9;
          const status = statusFlip ? (alert.status === 'Active' ? 'Resolved' : 'Active') : alert.status;
          const time = statusFlip ? new Date().toLocaleTimeString() : alert.time;
          return { ...alert, status, time };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Safety</p>
          <h3 className="text-xl font-semibold text-white">Alerts & Notifications</h3>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Demo Data</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`glass rounded-2xl border p-4 shadow-glow ${severityStyles[alert.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <FiAlertTriangle />
                </span>
                <div>
                  <p className="text-sm text-slate-200">{alert.title}</p>
                  <p className="text-xs text-slate-300">{alert.time}</p>
                </div>
              </div>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  alert.status === 'Active' ? 'bg-rose-500/20 text-rose-100' : 'bg-emerald-500/15 text-emerald-100'
                }`}
              >
                {alert.status === 'Active' ? <FiAlertTriangle size={12} /> : <FiCheckCircle size={12} />}
                {alert.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}