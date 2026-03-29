import time
from datetime import datetime, timedelta
from collections import deque
from config import MAX_HISTORICAL_SAMPLES

# ================= DATA STORAGE =================
class DataStorage:
    def __init__(self):
        # Historical time-series data (queues, max length)
        self.power_history = deque(maxlen=MAX_HISTORICAL_SAMPLES)
        self.voltage_history = deque(maxlen=MAX_HISTORICAL_SAMPLES)
        self.current_history = deque(maxlen=MAX_HISTORICAL_SAMPLES)
        self.energy_history = deque(maxlen=MAX_HISTORICAL_SAMPLES)
        
        # Daily aggregations
        self.daily_energy = {}  # {'YYYY-MM-DD': kWh}
        self.hourly_peak_power = {}  # {'YYYY-MM-DD_HH': watts}
        
        # Billing data
        self.billing_cycle = {
            'start_date': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0),
            'total_units': 0.0,  # kWh
            'total_cost': 0.0,  # ₹
        }
        
        # Alerts log
        self.alerts = []  # List of {title, severity, time, status}
        
        # Device states
        self.device_states = {}
        
        # Tracking
        self.last_update_time = time.time()
        self.accumulated_energy = 0.0  # Wh (resets daily)

    def add_sample(self, voltage, current, power):
        """Add a new sensor sample to historical data"""
        self.power_history.append({'value': power, 'time': time.time()})
        self.voltage_history.append({'value': voltage, 'time': time.time()})
        self.current_history.append({'value': current, 'time': time.time()})
    
    def add_energy_sample(self, power_w, time_interval_s):
        """Accumulate energy: P(W) * t(s) / 3600 = kWh"""
        energy_wh = (power_w * time_interval_s) / 3600.0
        self.accumulated_energy += energy_wh
        self.billing_cycle['total_units'] += energy_wh / 1000.0  # Convert to kWh
        
        # Store hourly peak
        now = datetime.now()
        key = now.strftime('%Y-%m-%d_%H')
        if key not in self.hourly_peak_power:
            self.hourly_peak_power[key] = power_w
        else:
            self.hourly_peak_power[key] = max(self.hourly_peak_power[key], power_w)
    
    def reset_daily_accumulation(self):
        """Reset daily energy counter (called at midnight)"""
        today = datetime.now().strftime('%Y-%m-%d')
        self.daily_energy[today] = self.accumulated_energy / 1000.0  # Convert Wh to kWh
        self.accumulated_energy = 0.0
    
    def get_daily_consumption(self):
        """Get last 7 days of daily consumption"""
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        consumption = []
        
        for i in range(6, -1, -1):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            energy_kwh = self.daily_energy.get(date, 0.0)
            consumption.append({
                'day': days[(datetime.now() - timedelta(days=i)).weekday()],
                'energy': round(energy_kwh, 2)
            })
        
        return consumption
    
    def get_weekly_consumption(self):
        """Get last 4 weeks of total consumption"""
        weeks = []
        for week_offset in range(3, -1, -1):
            total_kwh = 0.0
            week_start = datetime.now() - timedelta(days=7 * (week_offset + 1))
            week_end = datetime.now() - timedelta(days=7 * week_offset)
            
            for i in range(7):
                date = (week_start + timedelta(days=i)).strftime('%Y-%m-%d')
                total_kwh += self.daily_energy.get(date, 0.0)
            
            weeks.append({
                'label': f'Week {4 - week_offset}',
                'value': round(total_kwh, 1)
            })
        
        return weeks
    
    def get_hourly_peak_load(self):
        """Get peak load by hour for last 24 hours"""
        peak_hours = []
        now = datetime.now()
        
        for hour_offset in range(23, -1, -1):
            hour_time = now - timedelta(hours=hour_offset)
            key = hour_time.strftime('%Y-%m-%d_%H')
            peak_w = self.hourly_peak_power.get(key, 0)
            peak_hours.append({
                'label': hour_time.strftime('%H:00'),
                'load': round(peak_w, 0)
            })
        
        return peak_hours
    
    def add_alert(self, title, severity, status='Active'):
        """Log a new alert"""
        alert = {
            'title': title,
            'severity': severity,  # 'critical', 'high', 'medium'
            'time': datetime.now().strftime('%H:%M:%S'),
            'status': status,  # 'Active', 'Resolved'
        }
        self.alerts.append(alert)
        
        # Keep only last 50 alerts
        if len(self.alerts) > 50:
            self.alerts.pop(0)
    
    def get_alerts(self, limit=10):
        """Get recent alerts (newest first)"""
        return list(reversed(self.alerts[-limit:]))
    
    def resolve_alert(self, index):
        """Mark alert as resolved"""
        if 0 <= index < len(self.alerts):
            self.alerts[index]['status'] = 'Resolved'
    
    def get_recent_samples(self, metric='power', count=20):
        """Get recent samples with time labels"""
        history = getattr(self, f'{metric}_history')
        samples = []
        
        for item in list(history)[-count:]:
            samples.append({
                'time': datetime.fromtimestamp(item['time']).strftime('%H:%M:%S'),
                'value': round(item['value'], 2)
            })
        
        return samples
    
    def set_device_state(self, device_name, state):
        """Update device state"""
        self.device_states[device_name] = state
    
    def get_device_state(self, device_name):
        """Get device state"""
        return self.device_states.get(device_name, 'Unknown')

# ================= GLOBAL STORAGE INSTANCE =================
storage = DataStorage()
