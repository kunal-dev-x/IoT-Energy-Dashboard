import time
import numpy as np
from config import ACS_SENS, VOLT_GAIN, ADC_SAMPLES, ADC_SAMPLE_DELAY, RELAY_PIN

# ================= HARDWARE INITIALIZATION =================
try:
    import board
    import busio
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    
    HARDWARE_AVAILABLE = True
    GPIO_AVAILABLE = False
    
    # Try to import RPi.GPIO (may not be available)
    try:
        import RPi.GPIO as GPIO
        GPIO_AVAILABLE = True
        
        # GPIO Setup
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(RELAY_PIN, GPIO.OUT)
        GPIO.output(RELAY_PIN, GPIO.HIGH)  # Relay OFF (active-low)
        print("✓ RPi.GPIO initialized successfully")
    except ImportError:
        GPIO_AVAILABLE = False
        print("⚠ RPi.GPIO not available - relay control disabled")
        print("  Install with: sudo apt install python3-rpi.gpio")
    
    # I2C Setup
    i2c = busio.I2C(board.SCL, board.SDA)
    ads = ADS.ADS1115(i2c)
    chan_current = AnalogIn(ads, ADS.P0)
    chan_voltage = AnalogIn(ads, ADS.P1)
    
    print("✓ Hardware initialized successfully (Raspberry Pi ADC + Relay)")
except Exception as e:
    HARDWARE_AVAILABLE = False
    GPIO_AVAILABLE = False
    print(f"⚠ Hardware not available: {e}")
    print("  Running in simulation mode")

# ================= SENSOR STATE =================
class SensorState:
    def __init__(self):
        self.last_voltage = 230.0
        self.last_current = 2.0
        self.last_read_time = time.time()
        self.relay_state = False  # False = OFF, True = ON
        self.offline = False
        self.error_message = None

sensor_state = SensorState()

# ================= FUNCTIONS =================
def read_current():
    """Read RMS current from ACS712 via ADC (400-sample averaging)"""
    if not HARDWARE_AVAILABLE:
        return simulate_current()
    
    try:
        values = []
        for i in range(ADC_SAMPLES):
            values.append(chan_current.voltage)
            time.sleep(ADC_SAMPLE_DELAY)
        
        values = np.array(values)
        avg = np.mean(values)
        vrms = np.sqrt(np.mean((values - avg) ** 2))
        current = vrms / ACS_SENS
        
        # Noise floor: ignore small currents (standby power)
        if current < 0.02:
            current = 0.0
        
        sensor_state.last_current = current
        sensor_state.offline = False
        return current
    except Exception as e:
        sensor_state.offline = True
        sensor_state.error_message = str(e)
        return sensor_state.last_current

def read_voltage():
    """Read RMS voltage from divider via ADC (400-sample averaging)"""
    if not HARDWARE_AVAILABLE:
        return simulate_voltage()
    
    try:
        values = []
        for i in range(ADC_SAMPLES):
            values.append(chan_voltage.voltage)
            time.sleep(ADC_SAMPLE_DELAY)
        
        values = np.array(values)
        avg = np.mean(values)
        vrms = np.sqrt(np.mean((values - avg) ** 2))
        voltage = vrms * VOLT_GAIN
        
        # Noise floor: ignore phantom voltages
        if voltage < 5:
            voltage = 0.0
        
        sensor_state.last_voltage = voltage
        sensor_state.offline = False
        return voltage
    except Exception as e:
        sensor_state.offline = True
        sensor_state.error_message = str(e)
        return sensor_state.last_voltage

def relay_on():
    """Activate relay (LOW = ON for active-low relay)"""
    if not GPIO_AVAILABLE:
        sensor_state.relay_state = True
        return True
    
    try:
        GPIO.output(RELAY_PIN, GPIO.LOW)
        sensor_state.relay_state = True
        sensor_state.error_message = None
        return True
    except Exception as e:
        sensor_state.error_message = str(e)
        return False

def relay_off():
    """Deactivate relay (HIGH = OFF for active-low relay)"""
    if not GPIO_AVAILABLE:
        sensor_state.relay_state = False
        return True
    
    try:
        GPIO.output(RELAY_PIN, GPIO.HIGH)
        sensor_state.relay_state = False
        sensor_state.error_message = None
        return True
    except Exception as e:
        sensor_state.error_message = str(e)
        return False

def get_relay_state():
    """Get current relay state"""
    return sensor_state.relay_state

def set_relay(state):
    """Set relay to given state (True=ON, False=OFF)"""
    success = relay_on() if state else relay_off()
    return success

# ================= SIMULATION (for non-Raspberry Pi) =================
def simulate_current():
    """Generate realistic simulated current for testing"""
    import random
    base = 2.0
    drift = random.uniform(-0.2, 0.2)
    return max(0.01, base + drift)

def simulate_voltage():
    """Generate realistic simulated voltage for testing"""
    import random
    base = 230.0
    drift = random.uniform(-5, 5)
    return max(0, base + drift)

# ================= CLEANUP =================
def cleanup():
    """Clean up GPIO and I2C on shutdown"""
    if GPIO_AVAILABLE:
        try:
            GPIO.cleanup()
            print("✓ GPIO cleaned up")
        except Exception as e:
            print(f"⚠ GPIO cleanup error: {e}")
