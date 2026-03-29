# 🚀 Quick Start - Backend Ready to Deploy

## Current Status ✅

All backend code is complete and ready to run. You just need to install dependencies and start the servers.

## What's Already Done

✅ 7 REST API endpoints (metrics, control, alerts, devices, statistics, billing, health)
✅ Raspberry Pi hardware integration (ADC voltage/current reading, GPIO relay control)
✅ Graceful fallback to simulation mode if hardware unavailable
✅ Alert system (overload, overvoltage, offline, high-consumption)
✅ Virtual environment infrastructure (no Debian conflicts)
✅ Systemd service for auto-startup
✅ Complete documentation

## Installation (Raspberry Pi)

### Step 1: Setup Virtual Environment
```bash
cd ~/IoT\ Energy\ Dashboard/energy-dashboard/server
bash setup_venv.sh
```
This creates an isolated Python environment in `server/venv/`

### Step 2: Install RPi.GPIO (Optional but Recommended)
```bash
bash install_build_tools.sh
```
**What it does:**
- Tries pre-built: `sudo apt install python3-rpi.gpio` (recommended)
- Or installs build tools and compiles from source
- All handled automatically

**Skip this if:** You only want to test the UI (backend works without GPIO)

### Step 3: Done! Your Backend is Ready

## Starting the Servers

### Option A: Manual (Development)
```bash
# Terminal 1 - Start Backend
cd ~/IoT\ Energy\ Dashboard/energy-dashboard
bash server/start_server_with_venv.sh
# Backend runs on http://localhost:5000

# Terminal 2 - Start Frontend
npm run dev
# Frontend on http://localhost:5173
```

### Option B: Auto-Startup (Production)
```bash
# Copy service file
sudo cp ~/IoT\ Energy\ Dashboard/energy-dashboard/server/energy-dashboard.service /etc/systemd/system/

# Enable and start
sudo systemctl enable energy-dashboard
sudo systemctl start energy-dashboard

# Check status
sudo systemctl status energy-dashboard
```

## Testing the Connection

### Backend is Running
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "hardware_available": true
}
```

### Frontend Can See Data
1. Open http://localhost:5173 in browser
2. Go to **Dashboard** tab
3. Should see:
   - Voltage (220V typical)
   - Current (Amps)
   - Power (Watts)
   - Real-time chart

## What Each Screen Does

| Page | Data | Source |
|------|------|--------|
| **Dashboard** | Real-time voltage/current/power | ADC (or simulation) |
| **Devices** | Relay status + toggle button | GPIO (or simulation) |
| **Alerts** | Active alerts with severity | Alert system |
| **Monitoring** | Real-time charts (power/voltage) | Metrics API |
| **Statistics** | Daily/weekly/hourly consumption | Historical buffer |
| **Billing** | ₹ cost per day/week/month | Cost calculator |

## Customization

Edit `.env` to match your setup:

```bash
nano ~/IoT\ Energy\ Dashboard/energy-dashboard/server/.env
```

Key settings:
```env
ACS_SENSITIVITY=0.185           # Your current sensor
VOLTAGE_GAIN=260                # Your voltage divider
COST_PER_KWH=8.5                # Your local rate (₹/kWh)
OVERLOAD_THRESHOLD=1500         # Your safety limit (Watts)
```

Save, then restart the server.

## Troubleshooting

### Backend won't start
```bash
# Check Python is activated
source ~/IoT\ Energy\ Dashboard/energy-dashboard/server/venv/bin/activate
python ~/IoT\ Energy\ Dashboard/energy-dashboard/server/app.py
```

### RPi.GPIO installation fails
```bash
bash ~/IoT\ Energy\ Dashboard/energy-dashboard/server/install_build_tools.sh
```
Script handles all compilation issues automatically.

### No data showing on Dashboard
```bash
# Verify backend is running
curl http://localhost:5000/metrics

# Check if hardware is connected
i2cdetect -y 1
# Should show 0x48 for ADS1115
```

### Port 5000 already in use
```bash
# Find what's using it
sudo lsof -i :5000

# Kill it
sudo kill -9 <PID>
```

## Files Overview

```
server/
├── app.py                          # Main API server
├── sensor_handler.py               # Hardware interface
├── data_storage.py                 # History & aggregations
├── metrics.py                      # Calculations
├── alerts.py                       # Alert logic
├── config.py                       # Settings
├── setup_venv.sh                   # One-time setup
├── start_server_with_venv.sh       # Launch script
├── install_build_tools.sh          # GPIO installer
└── energy-dashboard.service        # Systemd service
```

## Next Steps

✅ Run `bash setup_venv.sh` in server/ directory
✅ Run `bash install_build_tools.sh` (handles RPi.GPIO)
✅ Run `bash start_server_with_venv.sh` (starts backend)
✅ Run `npm run dev` in another terminal (starts frontend)
✅ Open http://localhost:5173 in browser
✅ View real metrics on Dashboard

That's it! Your Energy Dashboard is live. 🎉
