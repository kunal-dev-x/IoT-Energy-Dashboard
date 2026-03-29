# IoT Energy Dashboard - Complete Setup Guide

## 🚀 Quick Start

### For Raspberry Pi (Backend API)

1. **Copy the API code to your Raspberry Pi:**
   ```bash
   # On your Raspberry Pi
   scp RPI_API_CODE.py pi@<your-rpi-ip>:~/energy_api.py
   ```

2. **Install dependencies:**
   ```bash
   ssh pi@<your-rpi-ip>
   cd ~
   pip3 install flask flask-cors numpy
   ```

3. **Run the API** (mock mode - no hardware):
   ```bash
   python3 energy_api.py
   ```
   
   The API will be available at: `http://<your-rpi-ip>:5000`

4. **Test the API:**
   ```bash
   curl http://<your-rpi-ip>:5000/health
   curl http://<your-rpi-ip>:5000/metrics
   ```

### For Web Frontend (Dashboard)

1. **Update API endpoint** (already done in `src/services/api.js`):
   - Default: `http://10.86.213.110:5000`
   - To change: Set `VITE_API_BASE` environment variable

2. **Run the dashboard:**
   ```bash
   npm install
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   npm run preview
   ```

## 📊 Features

### Live Metrics Display
- **Voltage (V)** - Real-time voltage reading
- **Current (A)** - Load current measurement
- **Power (W)** - Instantaneous power consumption
- **Energy (kWh)** - Cumulative energy usage
- **Frequency (Hz)** - AC frequency
- **Power Factor** - Efficiency rating
- **Cost (₹)** - Calculated energy cost

### Real-Time Charts
- **Power Trend** - 18-point power history
- **Voltage & Current** - Dual-axis chart
- **Daily Energy** - Weekly consumption breakdown

### Hardware Control
- **Relay Control** - ON/OFF switching
- **Overload Protection** - Auto-cutoff at limit
- **Manual Controls** - Dashboard switches

## 🔌 API Endpoints

### Health Check
```bash
GET http://10.86.213.110:5000/health
```
Response:
```json
{
  "status": "ok",
  "monitor": "MockEnergyMonitor",
  "timestamp": "2026-03-24T10:30:00.000Z"
}
```

### Get Current Metrics
```bash
GET http://10.86.213.110:5000/metrics
```
Response:
```json
{
  "voltage": 230.45,
  "current": 2.34,
  "power": 539.65,
  "energy": 12.456,
  "frequency": 50.0,
  "pf": 0.95,
  "cost": 105.76,
  "relay": true,
  "overload": false,
  "timestamp": "2026-03-24T10:30:00.000Z"
}
```

### Control Relay
```bash
POST http://10.86.213.110:5000/control
Content-Type: application/json

{
  "target": "relay",
  "state": true
}
```

## ⚙️ Configuration

### Environment Variables (Raspberry Pi)

```bash
# API port
PORT=5000

# Cost per kWh in your currency
ENERGY_API_TARIFF=8.5

# Maximum power limit in watts
ENERGY_API_POWER_LIMIT=500

# Force mock mode (set to "1" if no hardware)
ENERGY_API_FORCE_MOCK=0

# Logging level
ENERGY_API_LOGLEVEL=INFO

# CORS allowed origins
ENERGY_API_ALLOWED_ORIGINS=*
```

### Example - Run with custom tariff:
```bash
ENERGY_API_TARIFF=10 ENERGY_API_POWER_LIMIT=800 python3 energy_api.py
```

## 🛠️ Hardware Setup (Optional)

### Required Components
- Raspberry Pi 4 (or newer)
- ADS1115 ADC Converter (I2C)
- ACS712 Current Sensor
- Voltage Divider Circuit

### Connections
- **ADS1115 to Raspberry Pi:**
  - SCL → GPIO 3 (Pin 5)
  - SDA → GPIO 2 (Pin 3)
  - GND → Ground
  - VDD → 3.3V

- **ACS712 to ADS1115:**
  - Output → ADS1115 Channel 0 (P0)

- **Voltage Divider to ADS1115:**
  - Output → ADS1115 Channel 1 (P1)

- **Relay Control:**
  - Control pin → GPIO 17

### Install Hardware Libraries
```bash
pip3 install board busio adafruit-ads1x15 RPi.GPIO
```

## 📱 Running as a Service

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

Enable and start:
```bash
sudo systemctl enable energy-api.service
sudo systemctl start energy-api.service
sudo systemctl status energy-api.service
sudo journalctl -u energy-api -f
```

## 🐛 Troubleshooting

### API Connection Issues
```bash
# Check if API is running
curl http://10.86.213.110:5000/health

# Check Raspberry Pi firewall
sudo ufw allow 5000

# Check if port is in use
sudo netstat -tlnp | grep :5000
```

### Mock vs Hardware
```bash
# Check which monitor is active
curl http://10.86.213.110:5000/health | grep monitor

# Force mock mode
ENERGY_API_FORCE_MOCK=1 python3 energy_api.py
```

### CORS Errors
```bash
# Allow specific origin
ENERGY_API_ALLOWED_ORIGINS="http://localhost:5173" python3 energy_api.py

# Allow all origins (default)
ENERGY_API_ALLOWED_ORIGINS="*" python3 energy_api.py
```

## 📝 Architecture

```
┌─────────────────────────────────────────┐
│   React Frontend (Dashboard)            │
│   - Real-time gauge & charts            │
│   - Live metrics update every 2.5s      │
│   - Relay control buttons               │
└────────────┬────────────────────────────┘
             │ HTTP API (REST)
             │ http://10.86.213.110:5000
             ↓
┌─────────────────────────────────────────┐
│   Raspberry Pi (Flask API)              │
│   - Mock or Hardware Monitor            │
│   - Energy calculations                 │
│   - Relay control via GPIO              │
└─────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│   Optional Hardware Sensors             │
│   - ADS1115 ADC (I2C)                   │
│   - ACS712 Current Sensor               │
│   - Voltage Divider                     │
└─────────────────────────────────────────┘
```

## 📊 Live Data Flow

1. Frontend polls API every 2.5 seconds
2. API returns real or mock metrics
3. Frontend updates:
   - Data cards with latest values
   - Power consumption chart (rolling 18 points)
   - Voltage/Current chart (dual-axis)
4. Automatic fallback to mock data if API unreachable

## 🎯 Next Steps

- [ ] Connect actual ADS1115 sensor
- [ ] Calibrate current and voltage readings
- [ ] Set appropriate power limit for your device
- [ ] Deploy API as systemd service
- [ ] Host dashboard on web server
- [ ] Add authentication
- [ ] Build mobile app for remote monitoring

## 📄 File Structure

```
energy-dashboard/
├── RPI_API_CODE.py              # Copy this to Raspberry Pi
├── RASPBERRY_PI_SETUP.md        # Setup instructions
├── COMPLETE_SETUP.md            # This file
├── src/
│   ├── pages/Dashboard.jsx      # Updated to use real API
│   ├── services/api.js          # API client (already configured)
│   ├── components/
│   │   ├── DataCard.jsx         # Metric display
│   │   ├── Charts.jsx           # Real-time charts
│   │   └── Controls.jsx         # Relay control
└── server/
    └── app.py                   # Alternative Flask API
```

## 🔐 Security Notes

- Set `ENERGY_API_ALLOWED_ORIGINS` to specific domains for production
- Use HTTPS with reverse proxy in production
- Add authentication/API keys
- Firewall port 5000 to trusted networks only
- Run API with non-root user (already configured in systemd)

---
**Last Updated:** March 24, 2026
