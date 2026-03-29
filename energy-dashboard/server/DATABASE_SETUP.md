# Database Setup & Usage Guide

## Quick Start

### 1️⃣ **Start Backend (Auto-saves data)**
```bash
cd server
python backend.py
```
- Automatically creates `energy_data.db`
- Saves measurements every 2 seconds
- Auto-archives daily at midnight
- Auto-archives monthly at month-end

### 2️⃣ **Generate Sample Data (Optional - for testing)**
```bash
python populate_sample_data.py
```
Creates 12 months of realistic historical data instantly.

### 3️⃣ **View Database Statistics**
```bash
python db_utility.py
```
Shows:
- Last 30 days summary
- Last 12 months summary
- Total energy, cost, power stats

### 4️⃣ **View Specific Data**
```bash
# Last 30 days
python db_utility.py daily

# Last 12 months
python db_utility.py monthly

# All statistics
python db_utility.py stats
```

### 5️⃣ **Export to CSV**
```bash
# Export daily data
python db_utility.py export-daily

# Export monthly data
python db_utility.py export-monthly
```

---

## API Endpoints

### Get Last 30 Days
```bash
curl http://localhost:5000/history/daily?days=30
```

### Get Last 12 Months
```bash
curl http://localhost:5000/history/monthly?months=12
```

### Get Year Stats
```bash
curl http://localhost:5000/history/yearly?year=2025
```

### List Available Years
```bash
curl http://localhost:5000/history/all-years
```

---

## Database File

**Location:** `server/energy_data.db`

**Size:** ~100KB per year of data

**To backup:**
```bash
cp server/energy_data.db backup_energy_data.db
```

---

## Cleanup Old Data

Remove hourly records older than 90 days:
```bash
python db_utility.py cleanup 90
```

---

## Frontend Integration Example

Fetch and display monthly history in React:

```javascript
import { useState, useEffect } from 'react';

export function HistoryChart() {
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/history/monthly?months=12')
      .then(res => res.json())
      .then(data => {
        setMonthlyData(data.data);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <div>
      <h3>Energy Usage - Last 12 Months</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Energy (kWh)</th>
            <th>Cost (₹)</th>
            <th>Avg Power (W)</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.map(month => (
            <tr key={month.month}>
              <td>{month.month}</td>
              <td>{month.energy_kwh}</td>
              <td>{month.cost}</td>
              <td>{month.avg_power}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Database Schema

### Daily Summary
```
date (YYYY-MM-DD), energy_kwh, cost, avg_voltage, avg_current, 
avg_power, max_power, min_power
```

### Monthly Summary
```
month (YYYY-MM), energy_kwh, cost, avg_voltage, avg_current,
avg_power, max_power, days_count
```

### Hourly Data
```
timestamp (ISO), voltage, current, power, energy_consumed, cost
```

---

## Files Included

1. **backend.py** - Enhanced with database support
2. **populate_sample_data.py** - Generate test data
3. **db_utility.py** - View/export database
4. **DATABASE.md** - Full API documentation
5. **energy_data.db** - SQLite database (auto-created)

---

## Troubleshooting

**Q: Database not found?**
- Run backend once: `python backend.py`
- Or create manually: `python populate_sample_data.py`

**Q: No data showing?**
- Backend needs to run for data to accumulate
- Use sample data generator for testing: `python populate_sample_data.py`

**Q: Database file too large?**
- Clean up old hourly data: `python db_utility.py cleanup 90`

**Q: Want to reset database?**
- Delete `energy_data.db` and restart backend
- (Daily/monthly summaries will be recreated)

---

## Performance Notes

- **Hourly data**: Stored at 2-second intervals (~1440/day → ~43k/month)
- **Daily avg**: ~1KB per day
- **Monthly avg**: ~0.5KB per month
- **Indexing**: Auto-indexed on date/month for fast queries
- **Retention**: Set to unlimited (manual cleanup available)
