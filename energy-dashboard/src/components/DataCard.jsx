export default function DataCard({ title, value, unit, icon: Icon, accent }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-glow transition duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br opacity-30" style={{ backgroundImage: accent }} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl sm:text-4xl font-semibold text-white drop-shadow">{value}</span>
            {unit ? <span className="mb-1 text-sm text-slate-300">{unit}</span> : null}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-neon shadow-lg shadow-emerald-400/30">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}