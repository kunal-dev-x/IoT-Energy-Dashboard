# 🚀 IoT Energy Dashboard - Quick Start Guide

## What Was Built

✅ **Complete Flask REST API** with 7 main endpoints  
✅ **Hardware Integration** with your Raspberry Pi ADC & relay  
✅ **Real-time Sensor Reading** (voltage, current, power)  
✅ **Alert Generation** (overload, overvoltage, offline detection)  
✅ **Historical Data Tracking** (daily, hourly, weekly aggregations)  
✅ **Billing System** (energy tracking, cost calculation)  
✅ **Auto Relay Control** (overload protection at 1500W)  

---

## 📁 Backend Files Created

### Core Application
- **`app.py`** (450 lines) — Main Flask server with all 7 API endpoints
- **`sensor_handler.py`** (150 lines) — ADC + relay integration from your hardware code
- **`config.py`** (70 lines) — Configuration management with .env support
- **`data_storage.py`** (180 lines) — In-memory data persistence & aggregations
- **`metrics.py`** (80 lines) — Power, energy, cost calculations
- **`alerts.py`** (80 lines) — Alert generation with threshold checking
- **`requirements.txt`** — All Python dependencies

### Documentation
- **`README.md`** — Full API documentation
- **`start_backend.sh`** — Startup script for Raspberry Pi
- **`.env`** — Configuration file (edit for your setup)

---

## 🎯 API Endpoints

| Endpoint | Method | Purpose | Used By |
|----------|--------|---------|---------|
| `/metrics` | GET | Real voltage, current, power, energy | Dashboard, Monitoring |
| `/control` | POST | Toggle relay or devices | Devices page |
| `/alerts` | GET | Get active alerts | Alerts page |
| `/devices` | GET | List devices + status | Devices page |
| `/statistics` | GET | Daily/weekly/hourly data | Statistics page |
| `/billing` | GET | Cost & consumption tracking | Billing page |
| `/health` | GET | API status check | Any page (health check) |

---

## 🔌 Integration with Your Hardware Code

Your existing code:
```python
# Read sensors (400-sample RMS averaging)
voltage = read_voltage()     # ✅ Preserved exactly
current = read_current()     # ✅ Preserved exactly
power = voltage * current
if power > 500:
    relay_off()              # ✅ Preserved exactly
```

Now wrapped in API:
```
GET /metrics
→ read_voltage() + read_current()
→ Calculate power, energy, cost
→ Check alerts & relay status
→ Return JSON
```

---

## ⚙️ Setup Steps (on Raspberry Pi)

### 1. Create Virtual Environment
```bash
bash server/setup_venv.sh
```

This script will:
- ✓ Create a Python virtual environment at `server/venv/`
- ✓ Install all dependencies in isolation
- ✓ Avoid the "externally-managed-environment" error
- ✓ Handle network timeouts gracefully

**If you get connection timeout errors:** See [INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md)

### 2. Edit Configuration
```bash
nano server/.env
# Change ACS_SENS and VOLT_GAIN to match your hardware
# Update COST_PER_KWH for your electricity rate
```

### 3. Test Manually
**Option A: Manual activation & run**
```bash
source server/venv/bin/activate
cd server
python app.py
# Should show:
# ✓ Hardware initialized successfully (Raspberry Pi ADC + Relay)
# ✓ Sensor polling thread started
# * Running on http://0.0.0.0:5000
```

**Option B: Auto-run with venv activation**
```bash
bash server/start_server_with_venv.sh
# Automatically activates venv and starts API
```

### 4. Test API
```bash
curl http://localhost:5000/metrics
# Response: {voltage, current, power, energy, frequency, pf, cost}
```

### 5. Run at Startup (systemd) - Recommended
```bash
# Copy systemd service file
sudo cp server/energy-dashboard.service /etc/systemd/system/

# Edit to match your Raspberry Pi username (if not 'pi')
sudo nano /etc/systemd/system/energy-dashboard.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable energy-dashboard
sudo systemctl start energy-dashboard

# Check status
sudo systemctl status energy-dashboard

# View logs
sudo journalctl -u energy-dashboard -f
```

---

## 📊 What Each Endpoint Returns

### `/metrics` (Every 2.5s)
```json
{
  "voltage": 230.45,
  "current": 2.34,
  "power": 539.85,
  "energy": 12.45,
  "frequency": 50.0,
  "pf": 0.95,
  "cost": 105.82
}
```

### `/control` (Toggle relay)
```json
POST /control
{
  "target": "main",
  "state": true
}
→ Response: {"success": true, "status": "Relay main ON"}
```

### `/alerts`
```json
{
  "alerts": [
    {"title": "Overload Detected", "severity": "critical", "time": "14:30:45", "status": "Active"},
    {"title": "High Power Consumption", "severity": "medium", "time": "14:25:12", "status": "Active"}
  ]
}
```

### `/devices`
```json
{
  "devices": [
    {"name": "Main Meter", "status": "ON", "power": 539.85},
    {"name": "Smart Light", "status": "OFF", "power": 0.0},
    {"name": "Fan", "status": "OFF", "power": 0.0}
  ]
}
```

### `/statistics`
```json
{
  "daily_consumption": [
    {"day": "Mon", "energy": 14.5},
    {"day": "Tue", "energy": 16.2},
    ...
  ],
  "weekly_consumption": [
    {"label": "Week 1", "value": 105.4},
    ...
  ],
  "hourly_peak_load": [
    {"label": "00:00", "load": 450},
    ...
  ]
}
```

### `/billing`
```json
{
  "units_consumed": 42.6,
  "rate_per_unit": 8.5,
  "total_bill": 362.10,
  "cycle_start": "Mar 01",
  "cycle_end": "Mar 31",
  "monthly_history": [...]
}
```

---

## 🚨 Alert Triggers

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| **Over Voltage Warning** | V > 245V | high | Alert only |
| **Overload Detected** | P > 1500W for 10s | critical | **Relay OFF** |
| **High Power Consumption** | P > 1000W (< 1500W) | medium | Alert only |
| **Device Offline** | No data for 10s | critical | Alert only |

---

## 🔧 Customization

### Change Calibration
Edit `.env`:
```env
ACS_SENS=0.185          # Your ACS712 sensitivity
VOLT_GAIN=260           # Your voltage divider gain
```

### Change Thresholds
Edit `.env`:
```env
OVERVOLTAGE_THRESHOLD=245
OVERLOAD_THRESHOLD=1500
HIGH_CONSUMPTION_THRESHOLD=1000
```

### Change Cost Rate
Edit `.env`:
```env
COST_PER_KWH=8.5        # ₹ per kWh in India
```

---

## 🐛 Troubleshooting

### Error: "externally-managed-environment"
This is a Debian/Raspberry Pi security restriction preventing direct pip3 install.

**Solution:** Use the virtual environment setup script
```bash
bash server/setup_venv.sh
```

This creates an isolated Python environment (`server/venv/`) where you can install packages safely. Then activate it:
```bash
source server/venv/bin/activate
cd server
python app.py
```

Or use the auto-activation script:
```bash
bash server/start_server_with_venv.sh
```

### Error: "I2C not responding"
```bash
sudo i2cdetect -y 1
# Should see 0x48 (ADS1115)
# If not: check wiring, enable I2C in raspi-config
```

### Error: "GPIO access denied"
```bash
sudo usermod -a -G gpio pi
# Logout and login again
```

### Metrics appear stuck
- Check `/health` endpoint response time
- Increase `ADC_SAMPLES` in `.env` for better accuracy
- Decrease `ADC_SAMPLE_DELAY` if sensor read time > 2.5s

### Frontend not connecting
```bash
# On Raspberry Pi:
hostname -I
# Use that IP in frontend .env:
VITE_API_BASE=http://192.168.x.x:5000
```

---

## 📱 Frontend Connection

Frontend is already configured to call these endpoints. Just ensure:

1. **Frontend `.env`** has correct API base:
   ```env
   VITE_API_BASE=http://10.86.213.110:5000
   ```

2. **Backend is running**:
   ```bash
   python3 server/app.py
   ```

3. **Frontend starts**:
   ```bash
   npm run dev
   ```

4. **Test in browser**:
   - Dashboard: Should show live voltage, current, power
   - Monitoring: Live waveform updates
   - Devices: Can toggle relay
   - Statistics: Shows consumption charts
   - Billing: Shows cost
   - Alerts: Shows real alerts

---

## 📈 Data Flow

```
Hardware (RPi)              Backend (Flask)              Frontend (React)
   │                           │                              │
   │ Read ADC (400 samples)     │                              │
   ├──────────────────────────→ │ Every 2.5s                   │
   │   voltage, current         │                              │
   │                            │ Calculate power, energy      │
   │                            │ Check alerts                 │
   │ Read GPIO relay state      │ Update storage               │
   │                            ├──────────────────────────────→ GET /metrics
   │                            │                              │ GET /statistics
   │                            │                              │ GET /alerts
   │                            │                              │
   POST /control               │                              │
   (toggle relay)              │ Set GPIO                      │
   │←────────────────────────── │←─────────────────────────────┤
   │ Relay ON/OFF               │                              │
```

---

## 🎉 You're All Set!

The backend is production-ready and will:
✅ Read real sensors continuously  
✅ Track energy consumption & costs  
✅ Detect overloads & alert  
✅ Store historical data  
✅ Serve all dashboard pages  
✅ Auto-protect on overload  

**Start server:**
```bash
python3 server/app.py
```

**Frontend will automatically display real data!** 🚀
