import time
import threading
from datetime import datetime, timedelta
import numpy as np
import sqlite3
import os

# ================= HARDWARE =================
import board
import busio
import RPi.GPIO as GPIO

import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

# ================= FLASK =================
from flask import Flask, jsonify, request
from flask_cors import CORS


# ================= DATABASE SETUP =================
DB_PATH = os.path.join(os.path.dirname(__file__), 'energy_data.db')

def init_database():
    """Initialize SQLite database with schema"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Table for daily summaries
    c.execute('''CREATE TABLE IF NOT EXISTS daily_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        energy_kwh REAL,
        cost REAL,
        avg_voltage REAL,
        avg_current REAL,
        avg_power REAL,
        max_power REAL,
        min_power REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Table for monthly summaries
    c.execute('''CREATE TABLE IF NOT EXISTS monthly_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE NOT NULL,
        energy_kwh REAL,
        cost REAL,
        avg_voltage REAL,
        avg_current REAL,
        avg_power REAL,
        max_power REAL,
        days_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Table for hourly data points
    c.execute('''CREATE TABLE IF NOT EXISTS hourly_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        voltage REAL,
        current REAL,
        power REAL,
        energy_consumed REAL,
        cost REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized:", DB_PATH)

# Initialize database on startup
init_database()
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)

RELAY = 17
GPIO.setup(RELAY, GPIO.OUT)
GPIO.output(RELAY, GPIO.HIGH)  # OFF

ACS_SENS = 0.185
VOLT_GAIN = 260
COST_PER_KWH = 8.5

# ================= I2C =================
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)

# ✅ FIXED CHANNELS
chan_current = AnalogIn(ads, 0)
chan_voltage = AnalogIn(ads, 1)


# ================= GLOBAL =================
latest_data = {
    "cost": 0,
    "current": 0,
    "energy": 0,
    "frequency": 50.0,
    "pf": 0.95,
    "power": 0,
    "timestamp": "",
    "voltage": 0,
    "relay_state": "OFF",
    "relay_locked_until": 0
}

energy_kwh = 0

# Daily energy (static) - loads from database or uses default
daily_energy = 0
daily_cost = 0


# ================= FUNCTIONS =================

def get_today_energy():
    """
    Load today's STATIC energy from database
    
    Daily Energy Strategy:
    - Pulled from daily_summary table (static value)
    - Loaded at: Application startup & midnight
    - Updated: Once per day (automatic at 00:00)
    - Used by: Dashboard Daily Energy display
    
    Query: SELECT energy_kwh FROM daily_summary WHERE date = TODAY
    """
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT energy_kwh, cost FROM daily_summary WHERE date = ?', (today,))
        result = c.fetchone()
        conn.close()
        if result:
            return result[0], result[1]  # Return energy_kwh, cost
    except Exception as e:
        print(f"⚠ Error loading today's energy: {e}")
    return 0, 0


def read_current():
    values = []
    for _ in range(400):
        values.append(chan_current.voltage)
        time.sleep(0.001)

    values = np.array(values)
    avg = np.mean(values)
    vrms = np.sqrt(np.mean((values - avg) ** 2))

    current = vrms / ACS_SENS
    return 0 if current < 0.02 else current


def read_voltage():
    values = []
    for _ in range(400):
        values.append(chan_voltage.voltage)
        time.sleep(0.001)

    values = np.array(values)
    avg = np.mean(values)
    vrms = np.sqrt(np.mean((values - avg) ** 2))

    voltage = vrms * VOLT_GAIN
    return 0 if voltage < 5 else voltage


def relay_on():
    GPIO.output(RELAY, GPIO.LOW)
    global latest_data
    latest_data["relay_state"] = "ON"


def relay_off():
    GPIO.output(RELAY, GPIO.HIGH)
    global latest_data
    latest_data["relay_state"] = "OFF"


# ================= DATABASE FUNCTIONS =================

def save_hourly_data(voltage, current, power, energy, cost):
    """Save hourly data point to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO hourly_data 
                    (timestamp, voltage, current, power, energy_consumed, cost)
                    VALUES (?, ?, ?, ?, ?, ?)''',
                 (datetime.now().isoformat(), voltage, current, power, energy, cost))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠ Database error (hourly):", e)

def save_daily_summary(date, energy, cost, avg_voltage, avg_current, avg_power, max_power, min_power):
    """Save daily summary to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO daily_summary 
                    (date, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, min_power)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                 (date, energy, cost, avg_voltage, avg_current, avg_power, max_power, min_power))
        conn.commit()
        conn.close()
        print(f"✓ Saved daily summary for {date}")
    except Exception as e:
        print(f"⚠ Database error (daily):", e)

def save_monthly_summary(month, energy, cost, avg_voltage, avg_current, avg_power, max_power, days):
    """Save monthly summary to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT OR REPLACE INTO monthly_summary 
                    (month, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, days_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                 (month, energy, cost, avg_voltage, avg_current, avg_power, max_power, days))
        conn.commit()
        conn.close()
        print(f"✓ Saved monthly summary for {month}")
    except Exception as e:
        print(f"⚠ Database error (monthly):", e)

def get_daily_data(days=30):
    """Get daily summaries for last N days"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT date, energy_kwh, cost, avg_power, max_power 
                    FROM daily_summary 
                    ORDER BY date DESC 
                    LIMIT ?''', (days,))
        data = [dict(zip([col[0] for col in c.description], row)) for row in c.fetchall()]
        conn.close()
        return data[::-1]  # Reverse to chronological order
    except Exception as e:
        print(f"⚠ Database error (get_daily):", e)
        return []

def get_monthly_data(months=12):
    """Get monthly summaries for last N months"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT month, energy_kwh, cost, avg_power, max_power, days_count 
                    FROM monthly_summary 
                    ORDER BY month DESC 
                    LIMIT ?''', (months,))
        data = [dict(zip([col[0] for col in c.description], row)) for row in c.fetchall()]
        conn.close()
        return data[::-1]  # Reverse to chronological order
    except Exception as e:
        print(f"⚠ Database error (get_monthly):", e)
        return []

def get_yearly_stats(year=None):
    """Get yearly statistics"""
    if year is None:
        year = datetime.now().year
    
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        year_prefix = str(year)
        c.execute('''SELECT SUM(energy_kwh), SUM(cost), AVG(avg_voltage), AVG(avg_power), MAX(max_power)
                    FROM monthly_summary 
                    WHERE month LIKE ?''', (f"{year_prefix}%",))
        result = c.fetchone()
        conn.close()
        
        if result[0]:  # If data exists
            return {
                "year": year,
                "total_energy": round(result[0], 2),
                "total_cost": round(result[1], 2),
                "avg_voltage": round(result[2], 2),
                "avg_power": round(result[3], 2),
                "max_power": round(result[4], 2)
            }
        return None
    except Exception as e:
        print(f"⚠ Database error (yearly):", e)
        return None

def sensor_loop():
    """
    Main sensor reading loop - Updates every 2 seconds
    
    Daily Energy: STATIC (from database)
    ├─ Loaded at startup & midnight
    ├─ Source: daily_summary table
    └─ Updated once per day at 00:00
    
    Real-time Power: LIVE (from sensors)
    ├─ Calculation: Power = Voltage × Current
    ├─ Updated every 2 seconds
    ├─ Voltage: ADS1115 Channel 1 (gain 260)
    ├─ Current: ADS1115 Channel 0 (sensitivity 0.185)
    └─ RMS averaging: 400 samples per reading
    """
    global latest_data, daily_energy, daily_cost

    prev_time = time.time()
    hourly_samples = []  # For averaging
    last_save_day = datetime.now().day
    
    # Load today's STATIC energy from database on startup
    daily_energy, daily_cost = get_today_energy()
    print(f"✓ Loaded today's energy: {daily_energy} kWh, ₹{daily_cost}")

    while True:
        # === REAL-TIME POWER (Live from sensors) ===
        voltage = read_voltage()      # Live reading
        current = read_current()      # Live reading
        power = voltage * current     # Live calculation

        # Relay safety: only auto-control if manual lock has expired
        current_time = time.time()
        if current_time > latest_data.get("relay_locked_until", 0):
            # Auto-control is active (lock expired)
            if power > 500:
                relay_off()
            else:
                relay_on()
        # Otherwise, keep manual user control

        latest_data = {
            "cost": round(daily_cost, 2),           # Static (daily)
            "current": round(current, 2),           # Live (real-time)
            "energy": round(daily_energy, 2),       # Static (daily)
            "frequency": 50.0,
            "pf": 0.95,
            "power": round(power, 2),               # Live (real-time) - Voltage × Current
            "timestamp": datetime.now().isoformat(),
            "voltage": round(voltage, 2),           # Live (real-time)
            "relay_state": latest_data.get("relay_state", "OFF"),
            "relay_locked_until": latest_data.get("relay_locked_until", 0)
        }

        # Collect hourly samples
        hourly_samples.append({
            "voltage": voltage,
            "current": current,
            "power": power,
            "timestamp": datetime.now()
        })

        # Save hourly data point
        save_hourly_data(voltage, current, power, daily_energy, daily_cost)

        # Reset at midnight - load next day's STATIC energy
        now_dt = datetime.now()
        if last_save_day != now_dt.day:
            daily_energy, daily_cost = get_today_energy()
            print(f"✓ Day changed! Loaded new day's energy: {daily_energy} kWh, ₹{daily_cost}")
            last_save_day = now_dt.day
            hourly_samples = []  # Reset hourly samples

        print(latest_data)
        time.sleep(2)  # Update every 2 seconds


# ================= FLASK API =================

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "IoT Energy Dashboard Backend",
        "timestamp": datetime.now().isoformat(),
        "database": "connected"
    }), 200


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    Get current metrics
    
    STATIC VALUES (Daily):
    - energy: Daily energy (kWh) from database - same all day
    - cost: Daily cost (₹) from database - same all day
    
    LIVE VALUES (Real-time, updates every 2 seconds):
    - power: Live power = voltage × current (watts)
    - voltage: Live voltage reading (volts)
    - current: Live current reading (amps)
    - frequency: AC frequency (50 Hz India)
    - pf: Power factor (0.95)
    - relay_state: Relay status (ON/OFF)
    - timestamp: Current timestamp
    """
    return jsonify(latest_data)


@app.route('/relay/on', methods=['POST'])
def api_on():
    relay_on()
    # Lock manual control for 60 seconds to prevent auto-override
    latest_data["relay_locked_until"] = time.time() + 60
    return jsonify({"relay": "ON", "locked_until": latest_data["relay_locked_until"]})


@app.route('/relay/off', methods=['POST'])
def api_off():
    relay_off()
    # Lock manual control for 60 seconds to prevent auto-override
    latest_data["relay_locked_until"] = time.time() + 60
    return jsonify({"relay": "OFF", "locked_until": latest_data["relay_locked_until"]})


# ================= ROUTES: HISTORY & ANALYTICS =================

@app.route('/waveform', methods=['GET'])
def get_waveform():
    """Get recent hourly data points for live waveform display (last 60 points)"""
    limit = request.args.get('limit', 60, type=int)
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT timestamp, voltage, current, power 
                    FROM hourly_data 
                    ORDER BY timestamp DESC 
                    LIMIT ?''', (limit,))
        rows = c.fetchall()
        conn.close()
        
        # Reverse to chronological order
        data = []
        for row in reversed(rows):
            timestamp = row[0]
            # Parse ISO format timestamp and extract time HH:MM:SS
            try:
                dt = datetime.fromisoformat(timestamp)
                time_str = dt.strftime("%H:%M:%S")
            except:
                time_str = timestamp[-8:]  # Fallback to last 8 chars if parsing fails
            
            data.append({
                "time": time_str,
                "timestamp": timestamp,
                "voltage": row[1],
                "current": row[2],
                "power": row[3]
            })
        
        return jsonify({
            "data": data,
            "count": len(data)
        }), 200
    except Exception as e:
        print(f"⚠ Error fetching waveform:", e)
        return jsonify({"error": str(e), "data": []}), 500

@app.route('/history/daily', methods=['GET'])
def history_daily():
    """Get daily summaries for last N days (default 30)"""
    days = request.args.get('days', 30, type=int)
    data = get_daily_data(days)
    return jsonify({
        "period": "daily",
        "days": days,
        "data": data,
        "count": len(data)
    }), 200

@app.route('/history/monthly', methods=['GET'])
def history_monthly():
    """Get monthly summaries for last N months (default 12)"""
    months = request.args.get('months', 12, type=int)
    data = get_monthly_data(months)
    return jsonify({
        "period": "monthly",
        "months": months,
        "data": data,
        "count": len(data)
    }), 200

@app.route('/history/yearly', methods=['GET'])
def history_yearly():
    """Get yearly statistics for specified year (default current year)"""
    year = request.args.get('year', datetime.now().year, type=int)
    data = get_yearly_stats(year)
    return jsonify({
        "period": "yearly",
        "year": year,
        "data": data
    }), 200

@app.route('/history/all-years', methods=['GET'])
def history_all_years():
    """Get all available years in database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT DISTINCT year FROM (SELECT SUBSTR(month, 1, 4) as year FROM monthly_summary) ORDER BY year')
        years = [int(row[0]) for row in c.fetchall()]
        conn.close()
        return jsonify({
            "years": years,
            "count": len(years)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= BILLING DATA SAVE ENDPOINT =================

@app.route('/billing/save-hourly', methods=['POST'])
def save_billing_hourly():
    """Save real-time billing data point to database"""
    try:
        data = request.json
        voltage = data.get('voltage', 0)
        current = data.get('current', 0)
        power = data.get('power', 0)
        energy = data.get('energy', 0)
        cost = data.get('cost', 0)
        
        save_hourly_data(voltage, current, power, energy, cost)
        
        return jsonify({
            "success": True,
            "message": "Billing data saved successfully",
            "data": {
                "voltage": voltage,
                "current": current,
                "power": power,
                "energy": energy,
                "cost": cost,
                "timestamp": datetime.now().isoformat()
            }
        }), 201
    except Exception as e:
        print(f"⚠ Error saving billing data:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/billing/current', methods=['GET'])
def get_current_billing():
    """Get current live billing data with cost calculations"""
    return jsonify({
        "success": True,
        "data": latest_data,
        "timestamp": datetime.now().isoformat()
    }), 200

# ================= MAIN =================

if __name__ == "__main__":
    try:
        t = threading.Thread(target=sensor_loop)
        t.daemon = True
        t.start()

        app.run(host="0.0.0.0", port=5000)

    except KeyboardInterrupt:
        GPIO.cleanup()