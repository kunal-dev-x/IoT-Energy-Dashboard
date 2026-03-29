# ✅ Setup Verification Checklist

Complete this checklist to verify your Energy Dashboard is properly installed and running.

## Pre-Installation ✓

- [ ] Clone/download repository to Raspberry Pi
- [ ] Raspberry Pi has internet connection
- [ ] Python 3.9+ installed: `python3 --version`
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] Git installed: `git --version`

## Installation ✓

- [ ] Installed dependencies: `cd server && bash setup_venv.sh`
- [ ] Activated venv: `source server/venv/bin/activate`
- [ ] Virtual environment active (prompt shows `(venv)`)
- [ ] Attempted `bash server/install_build_tools.sh` OR `sudo apt install python3-rpi.gpio`
- [ ] No critical errors in pip install output

## Backend Configuration ✓

- [ ] Edited `.env` with your calibration values:
  - [ ] Set `ACS_SENSITIVITY` if using different current sensor
  - [ ] Set `VOLTAGE_GAIN` based on your resistor divider
  - [ ] Set `COST_PER_KWH` to your local rate
  - [ ] Set `OVERVOLTAGE_THRESHOLD` to your safe limit

## I2C Hardware (if testing with real hardware) ✓

- [ ] Enabled I2C on Raspberry Pi: `sudo raspi-config`
- [ ] Connected ADS1115 to Raspberry Pi:
  - [ ] GND → GND
  - [ ] VCC → 3.3V
  - [ ] SCL → GPIO 3
  - [ ] SDA → GPIO 2
- [ ] Verified I2C connection: `i2cdetect -y 1`
  - [ ] Should show `48` in output (ADS1115 at 0x48)

## GPIO Relay (if testing relay control) ✓

- [ ] Connected relay module to:
  - [ ] GPIO 17 (BCM numbering)
  - [ ] GND
  - [ ] 5V for relay coil power
- [ ] Verified GPIO available: `gpio readall`

## Backend Launch ✓

- [ ] Can see message: "Backend initialized" ✓
- [ ] Terminal 1: Run `bash server/start_server_with_venv.sh`
  - [ ] No errors in output
  - [ ] See: "Running on http://0.0.0.0:5000"
  - [ ] See: "✓ Flask server started"

## Backend Verification ✓

**In another terminal:**

```bash
curl http://localhost:5000/health
```

- [ ] Response is JSON with `"status": "ok"`
- [ ] Shows `"hardware_available": true` (or `false` if simulation)

Test other endpoints:
```bash
curl http://localhost:5000/metrics
curl http://localhost:5000/devices
curl http://localhost:5000/alerts
```

- [ ] All return JSON responses
- [ ] No 404 or 500 errors

## Frontend Launch ✓

- [ ] Terminal 2: Run `npm run dev`
- [ ] See: "Local: http://localhost:5173"
- [ ] No build errors
- [ ] Can access in browser at http://localhost:5173

## Frontend Verification ✓

Open browser to http://localhost:5173:

- [ ] Page loads (no errors in console)
- [ ] Navbar visible with all menu items
- [ ] Can click tabs: Dashboard, Devices, Alerts, Monitoring, Statistics, Billing

### Dashboard Tab ✓

- [ ] Shows 4 data cards:
  - [ ] Voltage (V)
  - [ ] Current (A)
  - [ ] Power (W)
  - [ ] Frequency (Hz)
- [ ] Values update every 2-3 seconds
- [ ] Chart shows real-time power trend (not flat)

### Devices Tab ✓

- [ ] Shows relay device
- [ ] Relay status shows as "ON" or "OFF"
- [ ] Toggle button works (try clicking it)
- [ ] Status changes when button clicked

### Alerts Tab ✓

- [ ] Can view active alerts (if any)
- [ ] Alerts show severity (High/Medium/Low)
- [ ] Timestamp shows date/time

### Statistics Tab ✓

- [ ] Daily consumption chart displays
- [ ] Weekly consumption chart displays
- [ ] Hourly peak load shows data

### Billing Tab ✓

- [ ] Shows consumption graph
- [ ] Shows cost breakdown
- [ ] Total cost calculated (non-zero if power flowing)

### Monitoring Tab ✓

- [ ] Power chart in real-time
- [ ] Voltage chart in real-time
- [ ] Charts update smoothly (not jumping)

## Browser Console ✓

- [ ] No red errors in console (F12 → Console tab)
- [ ] May see yellow warnings (OK)
- [ ] Network tab shows successful API calls (Status 200)

## Virtual Environment (Production) ✓

- [ ] Service file copied: `sudo cp server/energy-dashboard.service /etc/systemd/system/`
- [ ] Service enabled: `sudo systemctl enable energy-dashboard`
- [ ] Service started: `sudo systemctl start energy-dashboard`
- [ ] Service status OK: `sudo systemctl status energy-dashboard`
  - [ ] Shows "active (running)"
  - [ ] No errors in recent logs

## Hardware Testing (Optional) ✓

If you have real hardware connected:

- [ ] ADC readings match multimeter voltage ±1% (within 2-3V)
- [ ] Current sensor responds when load applied
- [ ] Relay clicks when toggle button pressed
- [ ] Relay LED indicates state

## Performance ✓

- [ ] Backend CPU usage < 15%: `top` command
- [ ] Memory usage < 150MB: `free -h`
- [ ] API response time < 100ms
- [ ] Frontend charts smooth (not jittery)

## Troubleshooting Completed ✓

If anything failed above:

- [ ] Checked [QUICK_START.md](QUICK_START.md)
- [ ] Checked [INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md)
- [ ] Checked [BACKEND_STATUS.md](server/BACKEND_STATUS.md)
- [ ] Ran: `source server/venv/bin/activate && python server/app.py` directly to see errors

## Final Status

When all items above are checked ✅, your Energy Dashboard is:

- ✅ **Backend**: Running, responding to API calls
- ✅ **Frontend**: Loading, displaying real data from backend
- ✅ **Hardware**: Connected (or simulated) and working
- ✅ **Monitoring**: Active and tracking metrics
- ✅ **Ready for Production**: Can enable systemd auto-start

## Maintenance

- [ ] Backup `.env` file (contains calibration values)
- [ ] Check logs regularly: `sudo journalctl -u energy-dashboard -f`
- [ ] Monitor disk space: `df -h`
- [ ] Restart service if needed: `sudo systemctl restart energy-dashboard`

---

**Need Help?** Check the documentation:
- [QUICK_START.md](QUICK_START.md) - Getting started
- [server/README.md](server/README.md) - Backend overview
- [server/VENV_SETUP.md](server/VENV_SETUP.md) - Environment issues
- [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md) - Common errors
- [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md) - Full implementation details

Good luck! 🎉
