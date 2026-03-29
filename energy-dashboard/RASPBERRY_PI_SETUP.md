# Raspberry Pi API Setup

## Prerequisites
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip
```

## Installation

### 1. Copy the API code to Raspberry Pi

Create a file named `energy_api.py` on your Raspberry Pi and paste the code from `RPI_API_CODE.py`

### 2. Install Dependencies
```bash
pip3 install flask flask-cors numpy
```

### 3. (Optional) Install Hardware Libraries
If you have the actual ADS1115 ADC and ACS712 sensors:
```bash
pip3 install board busio adafruit-ads1x15 RPi.GPIO adafruit-circuitpython-ads1x15
```

## Running the API

### Development (Mock Mode - No Hardware Required)
```bash
python3 energy_api.py
```

The API will start on `http://0.0.0.0:5000` (accessible at `http://<your-rpi-ip>:5000`)

### Production (With Hardware)
```bash
ENERGY_API_FORCE_MOCK=0 python3 energy_api.py
```

### With Custom Settings
```bash
PORT=5000 ENERGY_API_TARIFF=8.5 ENERGY_API_POWER_LIMIT=500 python3 energy_api.py
```

## Testing the API

```bash
# Check if API is running
curl http://<your-rpi-ip>:5000/health

# Get current metrics
curl http://<your-rpi-ip>:5000/metrics

# Control relay
curl -X POST http://<your-rpi-ip>:5000/control \
  -H "Content-Type: application/json" \
  -d '{"target":"relay","state":true}'
```

## Running as a Service (Optional)

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

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable energy-api.service
sudo systemctl start energy-api.service
sudo systemctl status energy-api.service
```

## Configuration Environment Variables

- `PORT`: API port (default: 5000)
- `ENERGY_API_TARIFF`: Cost per kWh in your currency (default: 8.5)
- `ENERGY_API_POWER_LIMIT`: Maximum power in watts (default: 500)
- `ENERGY_API_FORCE_MOCK`: Force mock mode (set to "1" to disable hardware)
- `ENERGY_API_LOGLEVEL`: Logging level (default: INFO)
- `ENERGY_API_ALLOWED_ORIGINS`: CORS allowed origins (default: "*")
