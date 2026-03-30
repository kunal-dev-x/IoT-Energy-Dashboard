import sqlite3
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), 'energy_data.db')

def init_database():
    """Initialize database tables"""
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
    print("✓ Database initialized")

def populate_3_months_data():
    """Populate database with realistic sample data for Jan, Feb, March"""
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Generate data for Jan, Feb, March
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 3, 31)
    
    current_date = start_date
    daily_data = []
    
    print("🔄 Generating 3 months of daily data...")
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Realistic daily energy consumption (kWh)
        # Winter months typically higher (Jan, Feb), March lower
        if current_date.month in [1, 2]:
            base_energy = random.uniform(8.5, 14.5)  # Higher in winter
        else:
            base_energy = random.uniform(6.5, 11.5)  # Lower in March
        
        energy_kwh = round(base_energy, 2)
        cost = round(energy_kwh * 8.5, 2)  # ₹8.5 per kWh
        
        # Voltage (typically 220-240V in India)
        avg_voltage = round(random.uniform(225, 235), 2)
        
        # Current (amps) - varies throughout day
        avg_current = round(random.uniform(2.5, 8.5), 2)
        
        # Power (watts)
        avg_power = round(avg_voltage * avg_current, 2)
        max_power = round(avg_power * 1.3, 2)  # Peak load 30% higher
        min_power = round(avg_power * 0.4, 2)  # Off-peak 40% of average
        
        daily_data.append({
            "date": date_str,
            "energy_kwh": energy_kwh,
            "cost": cost,
            "avg_voltage": avg_voltage,
            "avg_current": avg_current,
            "avg_power": avg_power,
            "max_power": max_power,
            "min_power": min_power
        })
        
        current_date += timedelta(days=1)
    
    # Insert daily data
    print(f"📊 Inserting {len(daily_data)} days of data...")
    for day in daily_data:
        try:
            c.execute('''INSERT OR REPLACE INTO daily_summary 
                        (date, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, min_power)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                     (day["date"], day["energy_kwh"], day["cost"], day["avg_voltage"], 
                      day["avg_current"], day["avg_power"], day["max_power"], day["min_power"]))
        except Exception as e:
            print(f"⚠ Error inserting {day['date']}: {e}")
    
    conn.commit()
    
    # Generate monthly summaries from daily data
    print("📅 Generating monthly summaries...")
    
    months_data = {
        "2026-01": {"energy": 0, "cost": 0, "days": 0, "voltages": [], "powers": [], "max_powers": []},
        "2026-02": {"energy": 0, "cost": 0, "days": 0, "voltages": [], "powers": [], "max_powers": []},
        "2026-03": {"energy": 0, "cost": 0, "days": 0, "voltages": [], "powers": [], "max_powers": []}
    }
    
    for day in daily_data:
        month_key = day["date"][:7]  # YYYY-MM
        if month_key in months_data:
            months_data[month_key]["energy"] += day["energy_kwh"]
            months_data[month_key]["cost"] += day["cost"]
            months_data[month_key]["days"] += 1
            months_data[month_key]["voltages"].append(day["avg_voltage"])
            months_data[month_key]["powers"].append(day["avg_power"])
            months_data[month_key]["max_powers"].append(day["max_power"])
    
    # Insert monthly data
    for month, data in months_data.items():
        if data["days"] > 0:
            avg_voltage = round(sum(data["voltages"]) / len(data["voltages"]), 2)
            avg_power = round(sum(data["powers"]) / len(data["powers"]), 2)
            max_power = round(max(data["max_powers"]), 2)
            
            try:
                c.execute('''INSERT OR REPLACE INTO monthly_summary 
                            (month, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, days_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                         (month, round(data["energy"], 2), round(data["cost"], 2), 
                          avg_voltage, 0, avg_power, max_power, data["days"]))
                print(f"✓ {month}: {round(data['energy'], 2)} kWh, ₹{round(data['cost'], 2)}, {data['days']} days")
            except Exception as e:
                print(f"⚠ Error inserting month {month}: {e}")
    
    conn.commit()
    
    # Generate hourly data (4 samples per day = 88 hourly records per month)
    print("⏰ Generating hourly data points...")
    hourly_count = 0
    
    for day in daily_data:
        date_obj = datetime.strptime(day["date"], "%Y-%m-%d")
        
        # Generate 4 hourly samples per day (morning, noon, evening, night)
        times = [6, 12, 18, 23]  # Hours
        
        for hour in times:
            timestamp = date_obj.replace(hour=hour).isoformat()
            
            # Slight variation from daily average
            voltage = round(day["avg_voltage"] + random.uniform(-5, 5), 2)
            current = round(day["avg_current"] + random.uniform(-1, 1), 2)
            power = round(voltage * current, 2)
            energy_per_sample = round(power * (24 / len(times)) / 1000, 2)  # Distributed over 24h
            cost_sample = round(energy_per_sample * 8.5, 2)
            
            try:
                c.execute('''INSERT INTO hourly_data 
                            (timestamp, voltage, current, power, energy_consumed, cost)
                            VALUES (?, ?, ?, ?, ?, ?)''',
                         (timestamp, voltage, current, power, energy_per_sample, cost_sample))
                hourly_count += 1
            except Exception as e:
                print(f"⚠ Error inserting hourly data: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("✅ Database population complete!")
    print("="*50)
    print(f"📊 Daily records: {len(daily_data)} (Jan 1 - Mar 31)")
    print(f"📅 Monthly records: 3 (January, February, March)")
    print(f"⏰ Hourly records: {hourly_count}")
    print(f"📁 Database: {DB_PATH}")
    print("="*50)

if __name__ == "__main__":
    init_database()  # Initialize tables first
    populate_3_months_data()
