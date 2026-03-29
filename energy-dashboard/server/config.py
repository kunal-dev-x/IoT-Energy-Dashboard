import os
from dotenv import load_dotenv

load_dotenv()

# ================= SERVER CONFIG =================
API_PORT = int(os.getenv('API_PORT', 5000))
API_HOST = os.getenv('API_HOST', '0.0.0.0')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# ================= HARDWARE CONFIG =================
# Relay GPIO Pin (BCM)
RELAY_PIN = int(os.getenv('RELAY_PIN', 17))

# ADC Calibration Constants
ACS_SENS = float(os.getenv('ACS_SENS', 0.185))  # ACS712 sensitivity (V/A)
VOLT_GAIN = float(os.getenv('VOLT_GAIN', 260))  # Voltage divider gain

# ADC Sampling
ADC_SAMPLES = int(os.getenv('ADC_SAMPLES', 400))
ADC_SAMPLE_DELAY = float(os.getenv('ADC_SAMPLE_DELAY', 0.001))  # seconds

# ================= THRESHOLD CONFIG =================
OVERVOLTAGE_THRESHOLD = float(os.getenv('OVERVOLTAGE_THRESHOLD', 245))  # Volts
OVERLOAD_THRESHOLD = float(os.getenv('OVERLOAD_THRESHOLD', 1500))  # Watts
HIGH_CONSUMPTION_THRESHOLD = float(os.getenv('HIGH_CONSUMPTION_THRESHOLD', 1000))  # Watts
OFFLINE_TIMEOUT = int(os.getenv('OFFLINE_TIMEOUT', 10))  # seconds
OVERLOAD_DURATION = int(os.getenv('OVERLOAD_DURATION', 10))  # seconds before relay-off

# ================= BILLING CONFIG =================
COST_PER_KWH = float(os.getenv('COST_PER_KWH', 8.5))  # ₹ per kWh (India example)
BILLING_CYCLE_START = int(os.getenv('BILLING_CYCLE_START', 1))  # Day of month

# ================= FREQUENCY & POWER FACTOR =================
GRID_FREQUENCY = float(os.getenv('GRID_FREQUENCY', 50.0))  # Hz (India: 50Hz, US: 60Hz)
POWER_FACTOR_ESTIMATE = float(os.getenv('POWER_FACTOR_ESTIMATE', 0.95))  # Default estimate

# ================= DATA RETENTION =================
MAX_HISTORICAL_SAMPLES = int(os.getenv('MAX_HISTORICAL_SAMPLES', 100))  # per metric type
DAILY_SUMMARY_RETENTION_DAYS = int(os.getenv('DAILY_SUMMARY_RETENTION_DAYS', 30))

# ================= DEVICES =================
DEVICE_PROFILES = {
    'Main Meter': {'power_range': [0, 2000], 'relay_pin': RELAY_PIN},
    'Smart Light': {'power_range': [0, 14], 'relay_pin': None},
    'Fan': {'power_range': [0, 90], 'relay_pin': None},
    'AC': {'power_range': [0, 1500], 'relay_pin': None},
    'Plug Socket': {'power_range': [0, 260], 'relay_pin': None},
}
