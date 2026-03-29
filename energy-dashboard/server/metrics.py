from config import COST_PER_KWH, GRID_FREQUENCY, POWER_FACTOR_ESTIMATE
from data_storage import storage
import time

# ================= METRICS CALCULATION =================
class MetricsCalculator:
    def __init__(self):
        self.last_energy = 0.0
        self.last_timestamp = time.time()
    
    def calculate_power(self, voltage, current):
        """Calculate apparent power: P = V × I"""
        return voltage * current
    
    def calculate_real_power(self, voltage, current, power_factor=None):
        """Calculate real power: P_real = V × I × PF"""
        if power_factor is None:
            power_factor = POWER_FACTOR_ESTIMATE
        return voltage * current * power_factor
    
    def calculate_reactive_power(self, voltage, current, power_factor=None):
        """Calculate reactive power: Q = V × I × sqrt(1 - PF²)"""
        if power_factor is None:
            power_factor = POWER_FACTOR_ESTIMATE
        if power_factor >= 1.0:
            return 0.0
        sin_phi = (1 - power_factor ** 2) ** 0.5
        return voltage * current * sin_phi
    
    def calculate_energy(self, power_w, time_interval_s):
        """Calculate energy consumption: E = P × t (in Wh, then convert to kWh)"""
        energy_wh = (power_w * time_interval_s) / 3600.0
        energy_kwh = energy_wh / 1000.0
        storage.add_energy_sample(power_w, time_interval_s)
        return energy_kwh
    
    def calculate_cost(self, energy_kwh):
        """Calculate cost: Cost = kWh × Rate"""
        return energy_kwh * COST_PER_KWH
    
    def get_current_energy(self):
        """Get current session energy from storage"""
        return storage.billing_cycle['total_units']
    
    def get_current_cost(self):
        """Get current session cost"""
        return storage.billing_cycle['total_units'] * COST_PER_KWH

calculator = MetricsCalculator()

# ================= BUILT-IN CONSTANTS =================
def get_frequency():
    """Get grid frequency"""
    return GRID_FREQUENCY

def get_power_factor():
    """Get estimated power factor"""
    return POWER_FACTOR_ESTIMATE

# ================= BILL CALCULATIONS =================
def calculate_monthly_bill(units_kwh, rate_per_kwh=None):
    """Calculate total bill amount"""
    if rate_per_kwh is None:
        rate_per_kwh = COST_PER_KWH
    return round(units_kwh * rate_per_kwh, 2)

def get_billing_cycle_info():
    """Get current billing cycle details"""
    from datetime import datetime, timedelta
    
    cycle_start = storage.billing_cycle['start_date']
    cycle_end = cycle_start + timedelta(days=30)
    
    return {
        'cycle_start': cycle_start.strftime('%b %d'),
        'cycle_end': cycle_end.strftime('%b %d'),
        'units_consumed': round(storage.billing_cycle['total_units'], 1),
        'rate_per_unit': COST_PER_KWH,
        'total_cost': round(storage.billing_cycle['total_units'] * COST_PER_KWH, 2),
    }
