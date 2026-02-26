export default function DataCard({ label, value, accent = 'cyan', loading }) {
  return (
    <div className={`data-card glassy accent-${accent}`}>
      <p className="label">{label}</p>
      <div className="value">
        {loading ? <span className="loader" /> : <span>{value}</span>}
      </div>
    </div>
  );
}
