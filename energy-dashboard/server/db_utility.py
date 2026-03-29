"""
Database Utility - Query and export energy data
"""

import sqlite3
import os
import csv
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'energy_data.db')

def view_daily_summary():
    """Display last 30 days of summary"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM daily_summary ORDER BY date DESC LIMIT 30')
    rows = c.fetchall()
    
    print("\n📊 DAILY SUMMARY (Last 30 Days)")
    print("=" * 100)
    print(f"{'Date':<12} {'Energy (kWh)':<15} {'Cost (₹)':<15} {'Avg Power':<15} {'Max Power':<15} {'Min Power':<15}")
    print("-" * 100)
    
    for row in reversed(rows):
        print(f"{row['date']:<12} {row['energy_kwh']:<15.2f} {row['cost']:<15.2f} {row['avg_power']:<15.2f} {row['max_power']:<15.2f} {row['min_power']:<15.2f}")
    
    conn.close()

def view_monthly_summary():
    """Display monthly summary"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('SELECT * FROM monthly_summary ORDER BY month DESC LIMIT 12')
    rows = c.fetchall()
    
    print("\n📅 MONTHLY SUMMARY (Last 12 Months)")
    print("=" * 110)
    print(f"{'Month':<10} {'Energy (kWh)':<15} {'Cost (₹)':<15} {'Avg Power':<15} {'Max Power':<15} {'Days':<10}")
    print("-" * 110)
    
    for row in reversed(rows):
        print(f"{row['month']:<10} {row['energy_kwh']:<15.2f} {row['cost']:<15.2f} {row['avg_power']:<15.2f} {row['max_power']:<15.2f} {row['days_count']:<10}")
    
    conn.close()

def export_to_csv(table='daily_summary', filename=None):
    """Export table to CSV"""
    if filename is None:
        date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"export_{table}_{date_str}.csv"
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute(f'SELECT * FROM {table} ORDER BY {"date" if table == "daily_summary" else "month" if table == "monthly_summary" else "timestamp"}')
    rows = c.fetchall()
    cols = [description[0] for description in c.description]
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(cols)
        writer.writerows(rows)
    
    conn.close()
    print(f"✓ Exported to {filename}")

def get_statistics():
    """Display overall statistics"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get counts
    c.execute('SELECT COUNT(*) FROM daily_summary')
    daily_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM monthly_summary')
    monthly_count = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM hourly_data')
    hourly_count = c.fetchone()[0]
    
    # Get totals
    c.execute('SELECT SUM(energy_kwh), SUM(cost), AVG(avg_power), MAX(max_power) FROM daily_summary')
    result = c.fetchone()
    total_energy, total_cost, avg_power, max_power = result if result[0] else (0, 0, 0, 0)
    
    conn.close()
    
    print("\n📈 DATABASE STATISTICS")
    print("=" * 50)
    print(f"Daily records:    {daily_count}")
    print(f"Monthly records:  {monthly_count}")
    print(f"Hourly records:   {hourly_count}")
    print("-" * 50)
    print(f"Total Energy:     {total_energy:.2f} kWh")
    print(f"Total Cost:       ₹{total_cost:.2f}")
    print(f"Average Power:    {avg_power:.2f} W")
    print(f"Max Power:        {max_power:.2f} W")
    print("=" * 50)

def delete_old_data(days=90):
    """Delete hourly data older than N days"""
    cutoff_date = datetime.now() - timedelta(days=days)
    cutoff_str = cutoff_date.isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('DELETE FROM hourly_data WHERE timestamp < ?', (cutoff_str,))
    deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"✓ Deleted {deleted} hourly records older than {days} days")

if __name__ == "__main__":
    import sys
    
    if not os.path.exists(DB_PATH):
        print("❌ Database not found!")
        sys.exit(1)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'daily':
            view_daily_summary()
        elif command == 'monthly':
            view_monthly_summary()
        elif command == 'export-daily':
            export_to_csv('daily_summary')
        elif command == 'export-monthly':
            export_to_csv('monthly_summary')
        elif command == 'stats':
            get_statistics()
        elif command == 'cleanup':
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 90
            delete_old_data(days)
        else:
            print("Unknown command")
    else:
        # Default: show all summaries
        get_statistics()
        print()
        view_daily_summary()
        print()
        view_monthly_summary()
