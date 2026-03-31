import axios from 'axios';

// API endpoint configuration - tries localhost first for development, then production addresses
const API_BASE = import.meta.env.VITE_API_BASE || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'http://raspberrypi.local:5000'
);

console.log('📡 API Base URL:', API_BASE);

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 5000  // Increased from 2000ms to account for sensor reading time (~0.4s)
});

export async function fetchMetrics() {
  const res = await apiClient.get('/metrics');
  return res.data;
}

export async function fetchDevices() {
  // Your new backend doesn't have /devices endpoint, so return mock device data
  return {
    devices: [
      { name: 'Main Meter', power: 0, status: 'OFF' }
    ]
  };
}

export async function sendControl(target, state) {
  // Control main relay via Pin 17
  if (target === 'main') {
    const endpoint = state ? '/relay/on' : '/relay/off';
    return apiClient.post(endpoint);
  }
  return Promise.resolve({ data: { success: false } });
}

export async function relayOn() {
  return apiClient.post('/relay/on');
}

export async function relayOff() {
  return apiClient.post('/relay/off');
}

export async function fetchDailyEnergy(days = 7) {
  try {
    const res = await apiClient.get(`/history/daily?days=${days}`);
    return res.data;
  } catch (error) {
    console.warn('Failed to fetch daily energy:', error);
    return [];
  }
}

export async function fetchHourlyPower(hours = 24) {
  try {
    const res = await apiClient.get(`/waveform?limit=${hours}`);
    return res.data;
  } catch (error) {
    console.warn('Failed to fetch hourly power:', error);
    return [];
  }
}

export async function fetchWaveform(limit = 60) {
  try {
    const res = await apiClient.get(`/waveform?limit=${limit}`);
    return res.data.data || [];
  } catch (error) {
    console.warn('Failed to fetch waveform data:', error);
    return [];
  }
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

// ================= BILLING DATA SAVE ENDPOINTS =================

export async function saveBillingData(billingData) {
  // Save real-time billing data point to database
  try {
    const res = await apiClient.post('/billing/save-hourly', {
      voltage: billingData.voltage || 0,
      current: billingData.current || 0,
      power: billingData.power || 0,
      energy: billingData.energy || 0,
      cost: billingData.cost || 0,
    });
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to save billing data:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCurrentBilling() {
  // Get current live billing data with cost calculations
  try {
    const res = await apiClient.get('/billing/current');
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to fetch current billing:', error.message);
    return { success: false, error: error.message };
  }
}

// ================= SESSION MANAGEMENT ENDPOINTS =================

export async function startSession() {
  // Start a new billing session
  try {
    const res = await apiClient.post('/session/start');
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to start session:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getCurrentSession() {
  // Get current active session data
  try {
    const res = await apiClient.get('/session/current');
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to fetch session:', error.message);
    return { success: false, error: error.message };
  }
}

export async function endSession(sessionId = null) {
  // End the current billing session
  try {
    const res = await apiClient.post('/session/end', {
      session_id: sessionId
    });
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to end session:', error.message);
    return { success: false, error: error.message };
  }
}

export async function resetSession() {
  // Reset current session data
  try {
    const res = await apiClient.post('/session/reset');
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to reset session:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getSessionHistory(limit = 50) {
  // Get session history from database
  try {
    const res = await apiClient.get(`/session/history?limit=${limit}`);
    return res.data;
  } catch (error) {
    console.warn('⚠ Failed to fetch session history:', error.message);
    return { success: false, error: error.message };
  }
}

