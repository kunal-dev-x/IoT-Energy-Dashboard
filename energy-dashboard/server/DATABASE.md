# Energy Dashboard Database API

## Overview
The backend now includes a SQLite database to store historical energy data for previous months. Data is automatically saved and can be retrieved for analysis and reporting.

## Database Tables

### 1. `hourly_data`
Stores individual data points (sampled every 2 seconds)
```sql
- timestamp: ISO timestamp
- voltage: Voltage reading
- current: Current reading  
- power: Power reading
- energy_consumed: Energy consumed (kWh)
- cost: Cost at that moment
```

### 2. `daily_summary`
Daily aggregated data (auto-created at midnight)
```sql
- date: YYYY-MM-DD
- energy_kwh: Total energy for the day
- cost: Total cost for the day
- avg_voltage: Average voltage
- avg_current: Average current
- avg_power: Average power
- max_power: Peak power
- min_power: Minimum power
```

### 3. `monthly_summary`
Monthly aggregated data (auto-created at month end)
```sql
- month: YYYY-MM
- energy_kwh: Total energy for the month
- cost: Total cost for the month
- avg_voltage: Average voltage
- avg_current: Average current
- avg_power: Average power
- max_power: Peak power
- days_count: Number of days with data
```

---

## API Endpoints

### Get Daily History
```
GET /history/daily?days=30
```
**Response:**
```json
{
  "period": "daily",
  "days": 30,
  "data": [
    {
      "date": "2026-03-01",
      "energy_kwh": 15.45,
      "cost": 131.33,
      "avg_power": 645.00,
      "max_power": 968.00
    },
    ...
  ],
  "count": 30
}
```

### Get Monthly History
```
GET /history/monthly?months=12
```
**Response:**
```json
{
  "period": "monthly",
  "months": 12,
  "data": [
    {
      "month": "2025-03",
      "energy_kwh": 465.20,
      "cost": 3954.20,
      "avg_power": 645.00,
      "max_power": 1200.00,
      "days_count": 31
    },
    ...
  ],
  "count": 12
}
```

### Get Yearly Statistics
```
GET /history/yearly?year=2025
```
**Response:**
```json
{
  "period": "yearly",
  "year": 2025,
  "data": {
    "year": 2025,
    "total_energy": 5582.40,
    "total_cost": 47450.40,
    "avg_voltage": 230.15,
    "avg_power": 638.20,
    "max_power": 1200.00
  }
}
```

### Get All Available Years
```
GET /history/all-years
```
**Response:**
```json
{
  "years": [2024, 2025, 2026],
  "count": 3
}
```

---

## Setup & Usage

### 1. Initialize Database
Database is auto-initialized on first backend start.

### 2. Populate Sample Data (Optional)
Run this to generate 12 months of sample data for testing:
```bash
python populate_sample_data.py
```

This generates:
- 365 days of daily summaries
- 12 months of monthly summaries
- Realistic variations in voltage, current, and power

### 3. Monitor Database
Check database file location:
```bash
ls -lh server/energy_data.db
```

### 4. Query Examples

**Get last 30 days:**
```bash
curl http://localhost:5000/history/daily?days=30
```

**Get last 12 months:**
```bash
curl http://localhost:5000/history/monthly?months=12
```

**Get 2025 yearly stats:**
```bash
curl http://localhost:5000/history/yearly?year=2025
```

---

## Frontend Integration

### Example: Fetch Monthly Data in React
```javascript
import { useState, useEffect } from 'react';

export function HistoryChart() {
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/history/monthly?months=12')
      .then(res => res.json())
      .then(data => setMonthlyData(data.data))
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <div>
      {monthlyData.map(month => (
        <div key={month.month}>
          <p>{month.month}: {month.energy_kwh}kWh - ₹{month.cost}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Auto-Save Schedule

- **Every 2 seconds**: Hourly data points saved
- **At midnight**: Daily summary auto-saved
- **At month end**: Monthly summary auto-saved

---

## Database File Location
```
server/energy_data.db
```

This SQLite database file can be:
- Backed up regularly
- Analyzed with SQLite tools
- Exported to CSV/Excel
- Synced to cloud storage

---

## Tips

1. **Increase Sample Retention**: Modify `hourly_data` retention via cleanup script
2. **Export Data**: Use SQLite to export to CSV
3. **Archiving**: Move old monthly summaries to archive table
4. **Performance**: Index on `date` (daily) and `month` (monthly) for faster queries
