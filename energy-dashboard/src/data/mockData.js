export const randomInRange = (min, max, decimals = 2) => Number((Math.random() * (max - min) + min).toFixed(decimals));

export const timeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

export const genSeries = (count, key, { min, max, decimals = 2 }) =>
  Array.from({ length: count }).map(() => ({ time: timeLabel(), [key]: randomInRange(min, max, decimals) }));

export const genBarData = (labels, key, { min, max, decimals = 1 }) =>
  labels.map((label) => ({ [key]: randomInRange(min, max, decimals), label }));

export const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

export const driftValue = (prev, min, max, step, decimals = 2) => {
  const next = prev + randomInRange(-step, step, decimals);
  return Number(clampValue(next, min, max).toFixed(decimals));
};

const deviceProfiles = {
  'Main Meter': { onRange: [650, 1400], standbyRange: [12, 20] },
  'Smart Light': { onRange: [10, 14], standbyRange: [0, 0.4] },
  Fan: { onRange: [55, 90], standbyRange: [1, 3] },
  AC: { onRange: [950, 1500], standbyRange: [8, 20] },
  'Plug Socket': { onRange: [30, 260], standbyRange: [2, 8] },
};

export const sampleDevicePower = (name, status = 'ON') => {
  const profile = deviceProfiles[name];
  if (!profile) return status === 'ON' ? randomInRange(8, 30, 0) : 0;
  const key = status === 'ON' ? 'onRange' : 'standbyRange';
  const [min, max] = profile[key];
  const decimals = status === 'ON' ? 0 : 1;
  return status === 'ON' ? randomInRange(min, max, decimals) : randomInRange(min, max, decimals);
};

export const demoAlerts = () => {
  const kinds = [
    { title: 'Over Voltage Warning', severity: 'high' },
    { title: 'High Power Consumption', severity: 'medium' },
    { title: 'Device Offline', severity: 'critical' },
    { title: 'Overload Detected', severity: 'high' },
    { title: 'Temperature Rise', severity: 'medium' },
  ];
  return Array.from({ length: 6 }).map(() => {
    const pick = kinds[Math.floor(Math.random() * kinds.length)];
    return {
      ...pick,
      time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
      status: Math.random() > 0.4 ? 'Active' : 'Resolved',
    };
  });
};

export const devicesSeed = () => [
  { name: 'Main Meter', status: 'ON' },
  { name: 'Smart Light', status: 'OFF' },
  { name: 'Fan', status: 'OFF' },
  { name: 'AC', status: 'ON' },
  { name: 'Plug Socket', status: 'ON' },
].map((device) => ({ ...device, power: sampleDevicePower(device.name, device.status) }));