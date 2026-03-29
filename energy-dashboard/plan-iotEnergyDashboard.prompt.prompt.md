# IoT Energy Dashboard - Implementation Plan

## Project Overview
A complete energy monitoring system combining a Raspberry Pi backend API with a React-based web dashboard for real-time display of electrical metrics and relay control.

## Architecture

```
Frontend (React)          Backend (Flask)           Hardware (RPi)
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Dashboard      │◄────►│  Energy API      │◄────►│ ADS1115 ADC  │
│  - Live Cards   │ HTTP │  - Metrics Endpoint    │  ACS712 Sensor
│  - Charts       │      │  - Control Endpoint    │  GPIO 17 Relay
│  - Controls     │      │  - Health Check        └──────────────┘
└─────────────────┘      │  - Mock Mode           
                         └──────────────────┘
```

## Backend API Specifications

### Technology Stack
- **Framework**: Flask with CORS
- **Language**: Python 3.7+
- **Hardware Libraries**: RPi.GPIO, board, busio, adafruit-ads1x15 (optional)
- **Data Processing**: NumPy for RMS calculations

### Endpoints

#### 1. Health Check
```
GET /health
Response: {
  "status": "ok",
  "monitor": "HardwareEnergyMonitor|MockEnergyMonitor",
  "timestamp": "2026-03-24T10:30:00Z"
}
```

#### 2. Current Metrics
```
GET /metrics
Response: {
  "voltage": 230.45,
  "current": 2.34,
  "power": 539.65,
  "energy": 12.456,
  "frequency": 50.0,
  "pf": 0.95,
  "cost": 105.76,
  "relay": true,
  "overload": false,
  "timestamp": "2026-03-24T10:30:00Z"
}
```

#### 3. Relay Control
```
POST /control
Request: {
  "target": "relay",
  "state": true
}
Response: {
  "target": "relay",
  "state": true,
  "metrics": {...}
}
```

### Hardware Implementation

#### Real Hardware Mode (HardwareEnergyMonitor)
- **Voltage Reading**:
  - ADC Channel: P1
  - Gain: 260 (voltage divider)
  - RMS Calculation: 400 samples, 0.001s delay
  - Threshold: Ignore < 5V

- **Current Reading**:
  - Sensor: ACS712
  - ADC Channel: P0
  - Sensitivity: 0.185 V/A
  - Threshold: Ignore < 0.02A

- **Energy Integration**:
  - Formula: Energy (kWh) = ∫(Power (W) / 1000) × dt
  - Timestamp-based accumulation

- **Relay Control**:
  - GPIO Pin: 17 (BCM)
  - Logic: GPIO.LOW = ON, GPIO.HIGH = OFF
  - Protection: Auto-opens if Power > ENERGY_API_POWER_LIMIT

#### Mock Mode (MockEnergyMonitor)
- Generates realistic simulated data
- Voltage: 223-238V with drift
- Current: 1.2-4.8A with drift
- Energy: 10-48 kWh continuous integration
- Frequency: 49.6-50.4 Hz variation
- Power Factor: 0.9-0.99 random
- Auto-triggers overload at power limit

### Configuration (Environment Variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | API listening port |
| `ENERGY_API_TARIFF` | 8.5 | Cost per kWh (currency) |
| `ENERGY_API_POWER_LIMIT` | 500 | Max power in watts |
| `ENERGY_API_FORCE_MOCK` | 0 | Force mock mode ("1" to disable hardware) |
| `ENERGY_API_LOGLEVEL` | INFO | Logging level (DEBUG/INFO/WARNING/ERROR) |
| `ENERGY_API_ALLOWED_ORIGINS` | * | CORS allowed origins |

### Error Handling
- Missing libraries → Fallback to Mock mode
- Hardware initialization failure → Fallback to Mock mode
- API requests → Return 400 for invalid targets/states
- GPIO errors → Log and continue
- Graceful shutdown with cleanup

## Frontend Dashboard Specifications

### Technology Stack
- **Framework**: React 18+
- **Styling**: Tailwind CSS
- **Icons**: React Icons (FiZap, FiActivity, etc.)
- **HTTP Client**: Axios
- **Charts**: Recharts (or similar)

### Features

#### 1. Live Metric Display
- **Data Cards**: 7 cards showing real-time API data
  - Voltage (V)
  - Current (A)
  - Power (W)
  - Energy (kWh)
  - Frequency (Hz)
  - Power Factor (-)
  - Cost (₹)

- **Update Frequency**: 2.5 seconds
- **Zero Handling**: Display `0` if API returns 0 (not fallback to default)
- **Error Handling**: Fallback to simulated data if API unavailable

#### 2. Real-Time Charts
- **Power Chart**: 18-point rolling history (simulated data for past readings)
- **Voltage-Current Chart**: Dual-axis with 18-point history (simulated)
- **Energy Chart**: Weekly breakdown (Mon-Sun) with simulated daily totals

#### 3. Control Panel
- **Relay Buttons**: ON/OFF toggle for GPIO 17 relay
- **Status Indicators**: Show relay state
- **Overload Warning**: Display if power exceeds limit

#### 4. Error States
- Connection error → Show warning, use mock data
- Timeout → Retry silently, maintain last known values

### Data Flow

```
1. Component Mount
   ↓
2. Fetch API (/metrics) every 2.5s
   ├─ Success → Update metric cards with real values
   └─ Fail → Use simulated fallback data
   ↓
3. Generate simulated chart data
   ├─ Power data: drift-based simulation
   ├─ Voltage/Current: independent drift
   └─ Energy: daily accumulation
   ↓
4. Render with real-time values
```

### Component Structure

```
Dashboard/
├── Metrics Section
│   └── DataCard × 7 (Real API data)
├── Charts Section
│   ├── PowerChart (Simulated history)
│   └── VCChart (Simulated history)
├── Controls Section
│   ├── RelaySwitch
│   └── StatusIndicators
└── Footer
```

## Raspberry Pi Setup

### Prerequisites
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

### Installation
```bash
# Core dependencies
pip3 install flask flask-cors numpy

# Hardware libraries (optional)
pip3 install RPi.GPIO board busio adafruit-ads1x15
```

### Running
```bash
# Mock mode (no hardware)
python3 energy_api.py

# Hardware mode
ENERGY_API_FORCE_MOCK=0 python3 energy_api.py

# Custom configuration
PORT=5000 ENERGY_API_TARIFF=10 ENERGY_API_POWER_LIMIT=800 python3 energy_api.py
```

### As Systemd Service
Create `/etc/systemd/system/energy-api.service`:
```ini
[Unit]
Description=Energy Monitoring API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/energy_api.py
Restart=always
RestartSec=10
Environment="ENERGY_API_TARIFF=8.5"
Environment="ENERGY_API_POWER_LIMIT=500"

[Install]
WantedBy=multi-user.target
```

## Frontend Setup

### Installation
```bash
npm install
```

### Environment Configuration
```bash
# .env.local or export VITE_API_BASE
VITE_API_BASE=http://10.86.213.110:5000
```

### Running
```bash
# Development
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## API Usage Examples

### Fetch Metrics
```bash
curl http://10.86.213.110:5000/metrics
```

### Control Relay (ON)
```bash
curl -X POST http://10.86.213.110:5000/control \
  -H "Content-Type: application/json" \
  -d '{"target":"relay","state":true}'
```

### Control Relay (OFF)
```bash
curl -X POST http://10.86.213.110:5000/control \
  -H "Content-Type: application/json" \
  -d '{"target":"relay","state":false}'
```

## Files Structure

```
energy-dashboard/
├── RPI_API_CODE.py                 # Raspberry Pi Backend
├── COMPLETE_SETUP.md               # Setup Guide
├── src/
│   ├── pages/
│   │   └── Dashboard.jsx           # Main page (REAL API data for cards)
│   ├── services/
│   │   └── api.js                  # API client (fetchMetrics, sendControl)
│   ├── components/
│   │   ├── DataCard.jsx            # Metric display (real values)
│   │   ├── Charts.jsx              # Chart components (simulated data)
│   │   ├── Controls.jsx            # Relay control buttons
│   │   ├── Charts/
│   │   │   ├── PowerChart.jsx
│   │   │   └── EnergyChart.jsx
│   │   └── Cards/
│   │       └── DataCard.jsx
│   └── App.jsx
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Data Specifications

### Metrics Ranges (Display)
| Metric | Min | Max | Unit | Decimals |
|--------|-----|-----|------|----------|
| Voltage | 215 | 250 | V | 2 |
| Current | 0 | 5 | A | 3 |
| Power | 0 | 1250 | W | 0 |
| Energy | 0 | 100 | kWh | 4 |
| Frequency | 49 | 51 | Hz | 2 |
| Power Factor | 0.8 | 1.0 | - | 3 |
| Cost | 0 | 999 | ₹ | 2 |

### Update Intervals
- Live metrics: 2500ms (2.5s)
- Chart updates: 2500ms
- Chart history length: 18 points
- Energy chart: Daily breakdown

## Special Handling

### Zero Values
- Display `0` if API returns `0` (not falsy fallback)
- Check: `value !== undefined && value !== null ? value : 0`

### Overload Protection
- Relay auto-opens if Power > ENERGY_API_POWER_LIMIT
- Event logged with warning level
- Can be manually controlled via API

### CORS Configuration
- Default: All origins accepted (`*`)
- Production: Restrict to specific domain
- Env: `ENERGY_API_ALLOWED_ORIGINS=https://yourdomain.com`

## Testing Checklist

- [ ] API health check returns correct monitor type
- [ ] Real metrics endpoint returns valid data
- [ ] Control endpoint accepts all state formats
- [ ] Relay GPIO pin responds to control commands
- [ ] Mock mode works when hardware unavailable
- [ ] Dashboard displays real API values every 2.5s
- [ ] Zero values display as "0" not hidden
- [ ] Charts show simulated history
- [ ] Fallback to simulation if API fails
- [ ] Responsive design on mobile/desktop
- [ ] Relay status updates immediately on control

## Future Enhancements

- [ ] Database logging of metrics
- [ ] Authentication/API keys
- [ ] Historical data graphs (hourly, daily, monthly)
- [ ] Multiple sensor support
- [ ] Threshold alerts and notifications
- [ ] Mobile app (React Native)
- [ ] Cloud sync and analytics
- [ ] ML-based anomaly detection
