import { useState } from 'react';
import DeviceCard from '../components/DeviceCard';
import { devicesSeed, sampleDevicePower } from '../data/mockData';

export default function Devices() {
  const [devices, setDevices] = useState(() => devicesSeed());

  const toggle = (name) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.name === name
          ? (() => {
              const nextStatus = d.status === 'ON' ? 'OFF' : 'ON';
              return { ...d, status: nextStatus, power: sampleDevicePower(d.name, nextStatus) };
            })()
          : d
      )
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">IoT Devices</p>
        <h3 className="text-xl font-semibold text-white">Connected Hardware (UI only)</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <DeviceCard key={device.name} {...device} onToggle={() => toggle(device.name)} />
        ))}
      </div>
    </div>
  );
}