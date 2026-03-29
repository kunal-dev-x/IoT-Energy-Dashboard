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


# ================= FUNCTIONS =================

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
    global latest_data, energy_kwh

    prev_time = time.time()
    hourly_samples = []  # For averaging
    last_save_hour = datetime.now().hour
    last_save_day = datetime.now().day

    while True:
        voltage = read_voltage()
        current = read_current()
        power = voltage * current

        now = time.time()
        dt = (now - prev_time) / 3600  # Calculate time delta in hours
        prev_time = now
        energy_kwh += (power * dt) / 1000
        cost = energy_kwh * COST_PER_KWH

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
            "cost": round(cost, 2),
            "current": round(current, 2),
            "energy": round(energy_kwh, 2),
            "frequency": 50.0,
            "pf": 0.95,
            "power": round(power, 2),
            "timestamp": datetime.now().isoformat(),
            "voltage": round(voltage, 2),
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
        save_hourly_data(voltage, current, power, energy_kwh, cost)

        # Auto-save daily summary at midnight
        now_dt = datetime.now()
        if last_save_day != now_dt.day:
            if len(hourly_samples) > 0:
                avg_voltage = np.mean([s["voltage"] for s in hourly_samples])
                avg_current = np.mean([s["current"] for s in hourly_samples])
                avg_power = np.mean([s["power"] for s in hourly_samples])
                max_power = np.max([s["power"] for s in hourly_samples])
                min_power = np.min([s["power"] for s in hourly_samples])
                
                yesterday = (now_dt - timedelta(days=1)).strftime("%Y-%m-%d")
                save_daily_summary(yesterday, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, min_power)
            
            last_save_day = now_dt.day

        print(latest_data)
        time.sleep(2)


# ================= FLASK API =================

app = Flask(__name__)
CORS(app)


@app.route('/metrics', methods=['GET'])
def get_metrics():
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

# ================= MAIN =================

if __name__ == "__main__":
    try:
        t = threading.Thread(target=sensor_loop)
        t.daemon = True
        t.start()

        app.run(host="0.0.0.0", port=5000)

    except KeyboardInterrupt:
        GPIO.cleanup()