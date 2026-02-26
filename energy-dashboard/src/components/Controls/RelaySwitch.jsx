export default function RelaySwitch({ label, checked, onChange }) {
  return (
    <div className="relay glassy">
      <div>
        <p className="label">{label}</p>
        <p className={`status ${checked ? 'on' : 'off'}`}>{checked ? 'ON' : 'OFF'}</p>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="slider" />
      </label>
    </div>
  );
}
