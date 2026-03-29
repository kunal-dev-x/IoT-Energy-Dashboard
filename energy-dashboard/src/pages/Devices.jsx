import { useState } from 'react';
import DeviceCard from '../components/DeviceCard';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggle = (name) => {
    // TODO: Send control command to API
    setDevices((prev) =>
      prev.map((d) =>
        d.name === name
          ? { ...d, status: d.status === 'ON' ? 'OFF' : 'ON' }
          : d
      )
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">IoT Devices</p>
        <h3 className="text-xl font-semibold text-white">Connected Hardware</h3>
      </div>
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading devices...</div>
      ) : devices.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No devices connected</div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard key={device.name} {...device} onToggle={() => toggle(device.name)} />
        ))}
      </div>
      )}
    </div>
  );
}