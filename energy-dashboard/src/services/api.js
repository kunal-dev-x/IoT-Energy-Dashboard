import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://10.86.213.110:5000';

export async function fetchMetrics() {
  const res = await axios.get(`${API_BASE}/metrics`, { timeout: 2000 });
  return res.data;
}

export async function sendControl(target, state) {
  return axios.post(`${API_BASE}/control`, { target, state });
}

// Mock helper (optional): call this instead of fetchMetrics to test without device
export function mockMetrics() {
  const rand = (min, max) => Number((Math.random() * (max - min) + min).toFixed(2));
  return {
    voltage: rand(215, 235),
    current: rand(0.5, 3.2),
    power: rand(100, 700),
    energy: rand(0.5, 3.5),
    frequency: rand(49.8, 50.2),
    pf: rand(0.8, 0.99),
    cost: rand(5, 25)
  };
}
