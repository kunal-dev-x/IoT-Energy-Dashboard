import time
from config import (
    OVERVOLTAGE_THRESHOLD,
    OVERLOAD_THRESHOLD,
    HIGH_CONSUMPTION_THRESHOLD,
    OFFLINE_TIMEOUT,
    OVERLOAD_DURATION
)
from data_storage import storage

# ================= ALERT MANAGER =================
class AlertManager:
    def __init__(self):
        self.overload_start_time = None
        self.last_offline_alert = None
        self.offline_alert_id = None
    
    def check_alerts(self, voltage, current, power, is_offline=False):
        """Check for alert conditions and generate alerts"""
        alerts_triggered = []
        
        # 1. OFFLINE CHECK
        if is_offline:
            if self.offline_alert_id is None:
                storage.add_alert('Device Offline', 'critical')
                self.offline_alert_id = len(storage.alerts) - 1
                alerts_triggered.append('Device Offline')
        else:
            if self.offline_alert_id is not None:
                storage.resolve_alert(self.offline_alert_id)
                self.offline_alert_id = None
        
        # 2. OVERVOLTAGE CHECK
        if voltage > OVERVOLTAGE_THRESHOLD:
            if 'Over Voltage Warning' not in [a['title'] for a in storage.get_alerts()]:
                storage.add_alert('Over Voltage Warning', 'high')
                alerts_triggered.append('Over Voltage Warning')
        
        # 3. OVERLOAD CHECK (sustained)
        if power > OVERLOAD_THRESHOLD:
            if self.overload_start_time is None:
                self.overload_start_time = time.time()
            
            elapsed = time.time() - self.overload_start_time
            if elapsed > OVERLOAD_DURATION:
                if 'Overload Detected' not in [a['title'] for a in storage.get_alerts()]:
                    storage.add_alert('Overload Detected', 'critical')
                    alerts_triggered.append('Overload Detected')
                return 'RELAY_OFF'  # Signal to turn off relay
        else:
            self.overload_start_time = None
        
        # 4. HIGH CONSUMPTION CHECK
        if power > HIGH_CONSUMPTION_THRESHOLD and power <= OVERLOAD_THRESHOLD:
            if 'High Power Consumption' not in [a['title'] for a in storage.get_alerts()]:
                storage.add_alert('High Power Consumption', 'medium')
                alerts_triggered.append('High Power Consumption')
        
        return alerts_triggered

alert_manager = AlertManager()

# ================= PUBLIC FUNCTIONS =================
def check_and_generate_alerts(voltage, current, power, is_offline=False):
    """Check all alert conditions and generate alerts if needed"""
    return alert_manager.check_alerts(voltage, current, power, is_offline)

def get_active_alerts():
    """Get all active alerts"""
    return [a for a in storage.get_alerts() if a['status'] == 'Active']

def get_all_alerts(limit=20):
    """Get all recent alerts"""
    return storage.get_alerts(limit)
