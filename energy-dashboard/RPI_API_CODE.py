#!/usr/bin/env python3
"""
Energy Monitoring API for Raspberry Pi
Monitors voltage, current, power, energy consumption and cost
Works with or without hardware (mock mode available)
"""

import atexit
import logging
import os
import random
import time
from datetime import datetime

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# Try to import hardware libraries - they're optional
HARDWARE_LIBS_AVAILABLE = False
try:
    import board
    import busio
    import RPi.GPIO as GPIO
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    HARDWARE_LIBS_AVAILABLE = True
except Exception:
    HARDWARE_LIBS_AVAILABLE = False

# Hardware constants
ACS_SENS = 0.185  # V/A sensitivity of ACS712 current sensor
VOLT_GAIN = 260   # Voltage divider gain
RELAY_PIN = 17    # GPIO pin for relay control
SAMPLES = 400     # Number of ADC samples per reading
SAMPLE_DELAY = 0.001  # Delay between samples (ms)
DEFAULT_POWER_LIMIT = float(os.getenv("ENERGY_API_POWER_LIMIT", "500"))
DEFAULT_TARIFF = float(os.getenv("ENERGY_API_TARIFF", "8.5"))

# Configure logging
logging.basicConfig(level=os.getenv("ENERGY_API_LOGLEVEL", "INFO"))
logger = logging.getLogger("energy-api")


class HardwareEnergyMonitor:
    """Real hardware monitor using ADS1115 ADC and ACS712 current sensor"""
    
    def __init__(self, power_limit=DEFAULT_POWER_LIMIT, tariff=DEFAULT_TARIFF):
        if not HARDWARE_LIBS_AVAILABLE:
            raise RuntimeError("Required hardware libraries not available")

        # Setup GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(RELAY_PIN, GPIO.OUT)
        GPIO.output(RELAY_PIN, GPIO.HIGH)

        self._relay_on = False
        self._power_limit = power_limit
        self._tariff = tariff
        self._energy_kwh = 0.0
        self._last_energy_ts = time.time()

        # Setup I2C and ADC
        self._i2c = busio.I2C(board.SCL, board.SDA)
        self._ads = ADS.ADS1115(self._i2c)
        self._chan_current = AnalogIn(self._ads, ADS.P0)
        self._chan_voltage = AnalogIn(self._ads, ADS.P1)

    def _collect_vrms(self, channel):
        """Collect and calculate RMS voltage from ADC channel"""
        samples = []
        for _ in range(SAMPLES):
            samples.append(channel.voltage)
            time.sleep(SAMPLE_DELAY)
        arr = np.array(samples)
        avg = np.mean(arr)
        return float(np.sqrt(np.mean((arr - avg) ** 2)))

    def read_current(self):
        """Read current in Amperes from ACS712 sensor"""
        vrms = self._collect_vrms(self._chan_current)
        current = vrms / ACS_SENS
        return 0.0 if current < 0.02 else current

    def read_voltage(self):
        """Read voltage in Volts from voltage divider"""
        vrms = self._collect_vrms(self._chan_voltage)
        voltage = vrms * VOLT_GAIN
        return 0.0 if voltage < 5 else voltage

    def _integrate_energy(self, power_w):
        """Integrate power over time to calculate energy consumed"""
        now = time.time()
        elapsed_hours = (now - self._last_energy_ts) / 3600.0
        self._last_energy_ts = now
        self._energy_kwh += (power_w / 1000.0) * max(elapsed_hours, 0)
        return self._energy_kwh

    def read_metrics(self):
        """Read all metrics and return as dict"""
        voltage = self.read_voltage()
        current = self.read_current()
        power = voltage * current
        energy = self._integrate_energy(power)
        cost = energy * self._tariff

        # Auto-cutoff protection
        overload = power > self._power_limit
        if overload and self._relay_on:
            logger.warning(f"Overload: {power:.2f}W > {self._power_limit:.2f}W limit")
            self.set_relay(False)

        return {
            "voltage": round(voltage, 2),
            "current": round(current, 3),
            "power": round(power, 2),
            "energy": round(energy, 4),
            "frequency": 50.0,
            "pf": 0.95,
            "cost": round(cost, 2),
            "relay": self._relay_on,
            "overload": overload,
        }

    def set_relay(self, state: bool):
        """Control relay - True = ON, False = OFF"""
        GPIO.output(RELAY_PIN, GPIO.LOW if state else GPIO.HIGH)
        self._relay_on = state

    def cleanup(self):
        """Cleanup GPIO on exit"""
        GPIO.cleanup()


class MockEnergyMonitor:
    """Mock monitor - generates realistic simulated data (no hardware needed)"""
    
    def __init__(self, power_limit=DEFAULT_POWER_LIMIT, tariff=DEFAULT_TARIFF):
        self._relay_on = True
        self._power_limit = power_limit
        self._tariff = tariff
        self._energy_kwh = 12.0
        self._last_energy_ts = time.time()

    @staticmethod
    def _drift(current, span, step):
        """Simulate realistic data drift"""
        delta = random.uniform(-step, step)
        lo, hi = span
        return max(lo, min(hi, current + delta))

    def read_metrics(self):
        """Generate mock metrics with realistic variations"""
        self._energy_kwh = self._drift(self._energy_kwh, (10, 48), 0.05)
        voltage = random.uniform(223, 238)
        current = random.uniform(1.2, 4.8)
        power = voltage * current
        energy = self._energy_kwh
        cost = energy * self._tariff
        overload = power > self._power_limit
        
        if overload and self._relay_on:
            self._relay_on = False

        return {
            "voltage": round(voltage, 2),
            "current": round(current, 3),
            "power": round(power, 2),
            "energy": round(energy, 3),
            "frequency": round(random.uniform(49.6, 50.4), 2),
            "pf": round(random.uniform(0.9, 0.99), 3),
            "cost": round(cost, 2),
            "relay": self._relay_on,
            "overload": overload,
        }

    def set_relay(self, state: bool):
        """Control relay"""
        self._relay_on = state

    def cleanup(self):
        """No cleanup needed for mock"""
        return None


def build_monitor():
    """Create appropriate monitor based on hardware availability"""
    force_mock = os.getenv("ENERGY_API_FORCE_MOCK", "0") == "1"
    power_limit = float(os.getenv("ENERGY_API_POWER_LIMIT", DEFAULT_POWER_LIMIT))
    tariff = float(os.getenv("ENERGY_API_TARIFF", DEFAULT_TARIFF))

    if not force_mock and HARDWARE_LIBS_AVAILABLE:
        try:
            logger.info("Initializing hardware energy monitor")
            return HardwareEnergyMonitor(power_limit=power_limit, tariff=tariff)
        except Exception as exc:
            logger.exception(f"Hardware init failed, falling back to mock: {exc}")

    logger.warning("Using mock energy monitor (no real hardware)")
    return MockEnergyMonitor(power_limit=power_limit, tariff=tariff)


# Initialize app and monitor
monitor = build_monitor()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": os.getenv("ENERGY_API_ALLOWED_ORIGINS", "*")}})


def _parse_state(value):
    """Parse boolean state from various formats"""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "on", "closed", "engaged"}:
            return True
        if lowered in {"0", "false", "off", "open", "disengaged"}:
            return False
    raise ValueError("Invalid state value")


@app.get("/health")
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "monitor": monitor.__class__.__name__,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })


@app.get("/metrics")
def metrics():
    """Get current metrics - main data endpoint"""
    payload = monitor.read_metrics()
    payload["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return jsonify(payload)


@app.post("/control")
def control():
    """Control relay/main switch"""
    data = request.get_json(silent=True) or {}
    target = data.get("target", "relay")
    state_value = data.get("state")

    if target not in {"relay", "main"}:
        return jsonify({"error": "Unsupported target"}), 400

    try:
        desired_state = _parse_state(state_value)
    except ValueError:
        return jsonify({"error": "Invalid state value"}), 400

    monitor.set_relay(desired_state)
    logger.info(f"Set {target} to {desired_state}")
    
    metrics_payload = monitor.read_metrics()
    metrics_payload["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return jsonify({
        "target": target,
        "state": desired_state,
        "metrics": metrics_payload
    })


@atexit.register
def _cleanup():
    """Cleanup on exit"""
    try:
        monitor.cleanup()
    except Exception as exc:
        logger.error(f"Cleanup failed: {exc}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    logger.info(f"Starting Energy Monitoring API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
