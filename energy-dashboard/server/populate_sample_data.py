"""
Sample Data Generator for Energy Dashboard Database
Generate mock historical data for the last 12 months
Run this once to populate the database with test data
"""

import sqlite3
import os
from datetime import datetime, timedelta
import random

DB_PATH = os.path.join(os.path.dirname(__file__), 'energy_data.db')

def populate_sample_data():
    """Generate 12 months of sample daily data"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    now = datetime.now()
    start_date = now - timedelta(days=365)
    
    print("📊 Generating 12 months of sample data...")
    
    for day_offset in range(365):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Generate realistic daily values
        avg_voltage = round(random.uniform(220, 240), 2)
        avg_current = round(random.uniform(1.5, 3.5), 2)
        avg_power = round(avg_voltage * avg_current, 2)
        max_power = round(avg_power * random.uniform(1.2, 1.5), 2)
        min_power = round(avg_power * random.uniform(0.3, 0.6), 2)
        energy_kwh = round(avg_power * 24 / 1000, 2)
        cost = round(energy_kwh * 8.5, 2)
        
        try:
            c.execute('''INSERT OR REPLACE INTO daily_summary 
                        (date, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, min_power)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                     (date_str, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, min_power))
            
            if day_offset % 30 == 0:
                print(f"  ✓ {date_str}")
        except Exception as e:
            print(f"  ✗ Error on {date_str}: {e}")
    
    conn.commit()
    
    # Generate monthly summaries
    print("\n📅 Generating monthly summaries...")
    
    for month_offset in range(12):
        current_date = now - timedelta(days=30*month_offset)
        month_str = current_date.strftime("%Y-%m")
        
        start_of_month = current_date.replace(day=1)
        
        # Calculate aggregate for the month
        c.execute('''SELECT COUNT(*), AVG(avg_voltage), AVG(avg_current), AVG(avg_power), 
                           MAX(max_power), SUM(energy_kwh), SUM(cost)
                    FROM daily_summary 
                    WHERE date LIKE ?''', (f"{month_str}%",))
        
        result = c.fetchone()
        if result[0] > 0:  # If any days exist for this month
            days, avg_v, avg_c, avg_p, max_p, total_e, total_c = result
            
            try:
                c.execute('''INSERT OR REPLACE INTO monthly_summary 
                            (month, energy_kwh, cost, avg_voltage, avg_current, avg_power, max_power, days_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                         (month_str, total_e, total_c, avg_v, avg_c, avg_p, max_p, int(days)))
                print(f"  ✓ {month_str}: {total_e}kWh, ₹{total_c}")
            except Exception as e:
                print(f"  ✗ Error on {month_str}: {e}")
    
    conn.commit()
    conn.close()
    print("\n✓ Sample data generated successfully!")
    print(f"📁 Database: {DB_PATH}")

if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        print(f"Database found: {DB_PATH}")
    else:
        print(f"Creating database: {DB_PATH}")
    
    populate_sample_data()
