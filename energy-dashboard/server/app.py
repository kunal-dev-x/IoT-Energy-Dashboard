"""
IoT Energy Dashboard Backend API
Raspberry Pi Energy Monitoring System
Integrates ADC sensor reading, relay control, and historical data tracking
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import threading
from datetime import datetime, timedelta
import logging

# ================= IMPORTS =================
from config import API_HOST, API_PORT, DEBUG, CORS_ORIGINS, DEVICE_PROFILES
from sensor_handler import read_voltage, read_current, set_relay, get_relay_state, cleanup
from metrics import calculator, get_frequency, get_power_factor, calculate_monthly_bill, get_billing_cycle_info
from alerts import check_and_generate_alerts, get_active_alerts, get_all_alerts
from data_storage import storage

# ================= LOGGING =================
logging.basicConfig(level=logging.DEBUG if DEBUG else logging.INFO)
logger = logging.getLogger(__name__)

# ================= FLASK APP =================
app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS if CORS_ORIGINS != ['*'] else '*')

# ================= GLOBAL STATE =================
last_metrics = {
    'voltage': 0.0,
    'current': 0.0,
    'power': 0.0,
    'frequency': get_frequency(),
    'pf': get_power_factor(),
}
last_read_time = time.time()
update_interval = 2.5  # seconds

# ================= BACKGROUND THREAD: SENSOR POLLING =================
def sensor_polling_thread():
    """Background thread that continuously reads sensors and updates metrics"""
    global last_metrics, last_read_time
    
    logger.info("✓ Sensor polling thread started")
    
    while True:
        try:
            current_time = time.time()
            time_since_last = current_time - last_read_time
            
            # Read sensors (takes ~0.4s for 400 samples)
            voltage = read_voltage()
            current = read_current()
            power = calculator.calculate_power(voltage, current)
            energy_kwh = storage.billing_cycle['total_units']
            cost = calculator.calculate_cost(energy_kwh)
            
            # Check for alerts
            alert_result = check_and_generate_alerts(voltage, current, power, False)
            
            # Auto-relay-off on overload
            if alert_result == 'RELAY_OFF':
                logger.warning("⚠ OVERLOAD DETECTED - Relay OFF")
                set_relay(False)
            
            # Store sample
            storage.add_sample(voltage, current, power)
            storage.add_energy_sample(power, time_since_last)
            
            # Update global metrics
            last_metrics = {
                'voltage': round(voltage, 2),
                'current': round(current, 3),
                'power': round(power, 2),
                'energy': round(energy_kwh, 2),
                'frequency': get_frequency(),
                'pf': get_power_factor(),
                'cost': round(cost, 2),
            }
            last_read_time = current_time
            
            # Reset daily accumulation at midnight
            if datetime.now().hour == 0 and datetime.now().minute == 0:
                storage.reset_daily_accumulation()
            
            # Sleep for update interval minus sensor read time (~0.4s)
            time.sleep(max(0.1, update_interval - 0.4))
        
        except Exception as e:
            logger.error(f"✗ Sensor polling error: {e}")
            time.sleep(1)

# ================= ROUTES: CORE METRICS =================
@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    GET /metrics
    Returns current sensor readings and calculated metrics
    Used by: Dashboard, Monitoring pages
    """
    try:
        return jsonify({
            'voltage': last_metrics['voltage'],
            'current': last_metrics['current'],
            'power': last_metrics['power'],
            'energy': last_metrics['energy'],
            'frequency': last_metrics['frequency'],
            'pf': last_metrics['pf'],
            'cost': last_metrics['cost'],
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /metrics: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: RELAY CONTROL =================
@app.route('/control', methods=['POST'])
def control_relay():
    """
    POST /control
    Body: {target: 'main', state: true/false}
    Controls relay or simulated devices
    Used by: Devices page, Controls component
    """
    try:
        data = request.json
        target = data.get('target', 'main')
        state = data.get('state', False)
        
        # Only 'main' relay is physical (GPIO17)
        if target == 'main':
            success = set_relay(state)
            storage.set_device_state('Main Meter', 'ON' if state else 'OFF')
            return jsonify({
                'success': success,
                'target': target,
                'state': state,
                'message': f"Relay {target} {'ON' if state else 'OFF'}"
            }), 200
        else:
            # Other devices are simulated
            storage.set_device_state(target, 'ON' if state else 'OFF')
            return jsonify({
                'success': True,
                'target': target,
                'state': state,
                'message': f"Device {target} {'ON' if state else 'OFF'} (simulated)"
            }), 200
    
    except Exception as e:
        logger.error(f"✗ Error in /control: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: ALERTS =================
@app.route('/alerts', methods=['GET'])
def get_alerts():
    """
    GET /alerts
    Returns current active alerts
    Used by: Alerts page
    """
    try:
        alerts = get_active_alerts()
        return jsonify({
            'alerts': alerts,
            'count': len(alerts),
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /alerts: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: DEVICES =================
@app.route('/devices', methods=['GET'])
def get_devices():
    """
    GET /devices
    Returns connected devices and their status
    Used by: Devices page
    """
    try:
        devices = []
        
        for device_name, profile in DEVICE_PROFILES.items():
            device_state = storage.get_device_state(device_name)
            status = 'ON' if device_state == 'ON' else 'OFF'
            
            # Estimate power for device based on main meter power
            if device_name == 'Main Meter':
                power = last_metrics['power']
            else:
                # Other devices get simulated power based on status
                if status == 'ON':
                    min_p, max_p = profile['power_range']
                    power = (min_p + max_p) / 2
                else:
                    power = 0.0
            
            devices.append({
                'name': device_name,
                'status': status,
                'power': round(power, 2),
                'unit': 'W'
            })
        
        return jsonify({
            'devices': devices,
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /devices: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: STATISTICS =================
@app.route('/statistics', methods=['GET'])
def get_statistics():
    """
    GET /statistics
    Returns daily consumption, weekly comparison, hourly peak, and waveform data
    Used by: Statistics page
    """
    try:
        return jsonify({
            'daily_consumption': storage.get_daily_consumption(),
            'weekly_consumption': storage.get_weekly_consumption(),
            'hourly_peak_load': storage.get_hourly_peak_load(),
            'voltage_current_waveform': {
                'voltage': storage.get_recent_samples('voltage', 16),
                'current': storage.get_recent_samples('current', 16),
            },
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /statistics: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: BILLING =================
@app.route('/billing', methods=['GET'])
def get_billing():
    """
    GET /billing
    Returns billing information and cost breakdown
    Used by: Billing page
    """
    try:
        billing_info = get_billing_cycle_info()
        
        # Generate monthly history (simulated for now)
        monthly_history = []
        for i in range(6):
            month_offset = 5 - i
            month_date = datetime.now() - timedelta(days=30 * month_offset)
            monthly_history.append({
                'label': month_date.strftime('%b'),
                'value': round((i + 1) * 1800, 0)  # Simulated increasing trend
            })
        
        return jsonify({
            'units_consumed': billing_info['units_consumed'],
            'rate_per_unit': billing_info['rate_per_unit'],
            'total_bill': billing_info['total_cost'],
            'cycle_start': billing_info['cycle_start'],
            'cycle_end': billing_info['cycle_end'],
            'status': 'Paid' if (datetime.now().day % 2 == 0) else 'Pending',
            'monthly_history': monthly_history,
            'timestamp': datetime.now().isoformat(),
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /billing: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: BILLING PDF (Optional) =================
@app.route('/billing/pdf', methods=['GET'])
def get_billing_pdf():
    """
    GET /billing/pdf
    Returns billing PDF (can be generated on frontend with jsPDF)
    For now, returns JSON data for frontend to generate PDF
    """
    try:
        billing_info = get_billing_cycle_info()
        return jsonify({
            'message': 'Use frontend jsPDF to generate PDF',
            'billing_data': billing_info,
            'data_for_pdf': {
                'title': 'Energy Bill',
                'cycle': f"{billing_info['cycle_start']} - {billing_info['cycle_end']}",
                'units': f"{billing_info['units_consumed']} kWh",
                'rate': f"₹{billing_info['rate_per_unit']}/kWh",
                'total': f"₹{billing_info['total_cost']}",
            }
        }), 200
    except Exception as e:
        logger.error(f"✗ Error in /billing/pdf: {e}")
        return jsonify({'error': str(e)}), 500

# ================= ROUTES: HEALTH CHECK =================
@app.route('/health', methods=['GET'])
def health_check():
    """
    GET /health
    Check if API is running
    """
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'metrics_latency_ms': round((time.time() - last_read_time) * 1000, 2),
    }), 200

# ================= ROUTES: DEBUG INFO =================
@app.route('/debug', methods=['GET'])
def debug_info():
    """
    GET /debug
    Returns debug information (only in DEBUG mode)
    """
    if not DEBUG:
        return jsonify({'error': 'Debug mode disabled'}), 403
    
    return jsonify({
        'last_metrics': last_metrics,
        'storage_stats': {
            'power_history_len': len(storage.power_history),
            'voltage_history_len': len(storage.voltage_history),
            'current_history_len': len(storage.current_history),
            'alerts_count': len(storage.alerts),
            'daily_energy_days': len(storage.daily_energy),
            'hourly_peak_hours': len(storage.hourly_peak_power),
        },
        'active_alerts': get_all_alerts(5),
    }), 200

# ================= ERROR HANDLERS =================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    logger.error(f"✗ Server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# ================= STARTUP & SHUTDOWN =================
@app.before_request
def before_request():
    """Initialize storage if empty"""
    if not storage.device_states:
        for device_name in DEVICE_PROFILES.keys():
            storage.set_device_state(device_name, 'OFF')

@app.teardown_appcontext
def teardown(error):
    """Cleanup on shutdown"""
    if error:
        logger.error(f"✗ Teardown error: {error}")

# ================= MAIN =================
if __name__ == '__main__':
    try:
        logger.info(f"═════════════════════════════════════════════════════════════")
        logger.info(f"  IoT Energy Dashboard Backend API")
        logger.info(f"  Starting on {API_HOST}:{API_PORT}")
        logger.info(f"  DEBUG: {DEBUG}")
        logger.info(f"═════════════════════════════════════════════════════════════")
        
        # Start sensor polling thread
        polling_thread = threading.Thread(target=sensor_polling_thread, daemon=True)
        polling_thread.start()
        
        # Start Flask app
        app.run(host=API_HOST, port=API_PORT, debug=DEBUG)
    
    except KeyboardInterrupt:
        logger.info("✓ Shutting down...")
        cleanup()
    except Exception as e:
        logger.error(f"✗ Error starting app: {e}")
        cleanup()
