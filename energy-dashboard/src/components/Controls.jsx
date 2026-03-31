const switches = [
  { key: 'main', label: 'Main Power' },
];

export default function Controls({ states, onToggle }) {
  return (
    <section className="glass rounded-2xl p-5 shadow-glow">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Control Panel</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">UI only</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {switches.map(({ key, label }) => {
          const active = states[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key, !active)}
              className={`group relative flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 ${
                active
                  ? 'border-emerald-400/50 bg-emerald-400/10 shadow-[0_10px_35px_-15px_rgba(16,185,129,0.8)]'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-400">{active ? 'On' : 'Off'}</p>
              </div>
              <span
                className={`flex h-9 w-16 items-center rounded-full p-1 transition ${
                  active ? 'bg-emerald-400/80' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`h-7 w-7 rounded-full bg-white shadow transition ${
                    active ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}