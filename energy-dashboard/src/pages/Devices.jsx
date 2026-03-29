import { useState, useEffect } from 'react';
import DeviceCard from '../components/DeviceCard';
import { fetchDevices, sendControl } from '../services/api';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        const data = await fetchDevices();
        setDevices(data.devices || []);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  const toggle = async (name) => {
    try {
      // Get current device
      const device = devices.find(d => d.name === name);
      if (!device) return;

      // Determine new state
      const newState = device.status === 'ON' ? 'OFF' : 'ON';
      
      // Send control command to backend
      // Main Meter uses the 'main' relay on Pin 17
      const target = name === 'Main Meter' ? 'main' : name.toLowerCase().replace(/\s+/g, '_');
      await sendControl(target, newState === 'ON');

      // Update local state
      setDevices((prev) =>
        prev.map((d) =>
          d.name === name
            ? { ...d, status: newState }
            : d
        )
      );
    } catch (error) {
      console.error('Failed to control device:', error);
      // Revert on error
    }
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