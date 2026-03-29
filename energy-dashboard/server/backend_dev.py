"""
Development Backend for Energy Dashboard
Run this on your development machine or Raspberry Pi for UI testing
"""

import time
import threading
import random
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS

# ================= FLASK SETUP =================
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ================= MOCK DATA =================
latest_data = {
    "cost": 0,
    "current": 2.5,
    "energy": 12.45,
    "frequency": 50.0,
    "pf": 0.95,
    "power": 575,
    "timestamp": datetime.now().isoformat(),
    "voltage": 230.0
}

relay_state = False  # OFF by default


# ================= BACKGROUND SENSOR SIMULATION =================
def simulate_sensor():
    """Simulate realistic sensor data"""
    global latest_data, relay_state

    while True:
        # Simulate realistic variations
        voltage = random.uniform(220, 240)
        current = random.uniform(0.5, 4.5) if relay_state else random.uniform(0, 0.2)
        power = voltage * current
        
        # Accumulate energy
        latest_data["energy"] += (power / 1000) * (2 / 3600)  # 2-second intervals
        
        latest_data.update({
            "voltage": round(voltage, 2),
            "current": round(current, 3),
            "power": round(power, 2),
            "frequency": round(random.uniform(49.8, 50.2), 2),
            "pf": round(random.uniform(0.92, 0.98), 3),
            "cost": round(latest_data["energy"] * 8.5, 2),
            "timestamp": datetime.now().isoformat(),
        })
        
        print(f"📊 {latest_data}")
        time.sleep(2)


# ================= API ROUTES =================

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Get current sensor metrics"""
    return jsonify(latest_data), 200


@app.route('/relay/on', methods=['POST'])
def relay_on():
    """Turn relay ON (Pin 17)"""
    global relay_state
    relay_state = True
    return jsonify({"relay": "ON", "status": "success"}), 200


@app.route('/relay/off', methods=['POST'])
def relay_off():
    """Turn relay OFF (Pin 17)"""
    global relay_state
    relay_state = False
    return jsonify({"relay": "OFF", "status": "success"}), 200


# ================= MAIN =================

if __name__ == "__main__":
    print("\n")
    print("🚀 Energy Dashboard Development Backend")
    print("=" * 50)
    print("📡 Starting on http://0.0.0.0:5000")
    print("  - GET  /metrics      → Sensor readings")
    print("  - POST /relay/on     → Relay ON")
    print("  - POST /relay/off    → Relay OFF")
    print("=" * 50)
    print()
    
    # Start sensor simulation in background
    sensor_thread = threading.Thread(target=simulate_sensor)
    sensor_thread.daemon = True
    sensor_thread.start()
    
    try:
        app.run(host="0.0.0.0", port=5000, debug=False)
    except KeyboardInterrupt:
        print("\n✓ Backend stopped")
