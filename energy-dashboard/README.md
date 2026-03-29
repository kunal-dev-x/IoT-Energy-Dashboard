# IoT Energy Dashboard

A modern single-page dashboard (React + Vite) paired with an optional Flask API that interacts with an ADS1115 current/voltage sensing rig on a Raspberry Pi. The backend can also operate in a mock mode for local development when the hardware stack is unavailable.

## Frontend (React)

```bash
npm install
npm run dev
```

Set `VITE_API_BASE` in a `.env` file if you need the UI to point to a non-default backend URL.

## Backend API (Flask)

```bash
cd server
python -m venv .venv
.venv\Scripts\activate  # use source .venv/bin/activate on Linux/macOS
pip install -r requirements.txt
python app.py
```

The server listens on port `5000` by default. Add `ENERGY_API_FORCE_MOCK=1` to run without Raspberry Pi hardware. When deployed onto the Pi, the server will automatically use the real ADS1115 + relay stack if the dependencies are available.

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE` | URL consumed by the React app. | `http://localhost:5000` |
| `ENERGY_API_FORCE_MOCK` | Force mock sensor/relay logic (`1` or `0`). | `0` |
| `ENERGY_API_POWER_LIMIT` | Overload cutoff in watts. | `500` |
| `ENERGY_API_TARIFF` | Cost per kWh for cost calculations. | `8.5` |
| `ENERGY_API_ALLOWED_ORIGINS` | CORS origin list passed to Flask-CORS. | `*` |

### API surface

| Route | Method | Description |
| --- | --- | --- |
| `/health` | GET | Simple readiness probe, returns the active monitor type. |
| `/metrics` | GET | Returns voltage, current, power, energy, PF, cost, relay status, overload flag, and timestamp. |
| `/control` | POST | Body `{ "target": "relay", "state": true }` toggles the relay and echoes fresh metrics. |

Update the React client’s `src/services/api.js` if your deployment uses a static IP instead of the default localhost URL.
