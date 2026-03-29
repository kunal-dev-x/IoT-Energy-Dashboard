# 📚 Documentation Guide

This file helps you navigate all the documentation in your project.

## 🚀 Start Here

### First Time Setup?
1. **[QUICK_START.md](QUICK_START.md)** ← Start here!
   - Simple, step-by-step installation
   - Commands to run
   - What to expect
   - ~5 minute read

### After Installation?
2. **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** ← Verify everything works
   - Validation checklist
   - Test commands
   - Troubleshooting if something fails
   - ~10 minute checklist

## 📖 Detailed Guides

### Backend Setup & Deployment
- **[server/README.md](server/README.md)**
  - Architecture overview
  - Installation steps
  - Running locally vs production
  - API endpoints explanation

- **[server/VENV_SETUP.md](server/VENV_SETUP.md)**
  - Virtual environment setup
  - Troubleshooting venv issues
  - RPi.GPIO installation help

### Installation & Dependency Issues
- **[server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md)**
  - Common error fixes
  - Network timeout solutions
  - RPi.GPIO compilation help
  - 4+ solutions for each issue

### Implementation Details
- **[server/BACKEND_STATUS.md](server/BACKEND_STATUS.md)**
  - What's implemented ✅
  - What's working
  - What's planned
  - Configuration reference
  - API endpoint list

## 🗂️ File Structure Quick Reference

```
energy-dashboard/
├── 📄 QUICK_START.md                    ← START HERE
├── 📄 SETUP_CHECKLIST.md               ← Verify installation
├── 📄 DOCUMENTATION_GUIDE.md            ← You are here
├── 📄 README.md                         ← Project overview
│
└── server/
    ├── 📄 README.md                     ← Backend guide
    ├── 📄 VENV_SETUP.md                ← Environment help
    ├── 📄 INSTALLATION_TROUBLESHOOTING.md ← Error fixes
    ├── 📄 BACKEND_STATUS.md            ← Full implementation
    │
    ├── 🐍 app.py                       ← API server (7 endpoints)
    ├── 🐍 sensor_handler.py            ← Hardware integration
    ├── 🐍 data_storage.py              ← Historical data
    ├── 🐍 metrics.py                    ← Calculations
    ├── 🐍 alerts.py                     ← Alert system
    ├── 🐍 config.py                     ← Settings
    │
    ├── 📋 requirements.txt              ← Python dependencies
    ├── 📋 requirements-minimal.txt      ← Fallback dependencies
    ├── ⚙️ .env                          ← Configuration (edit this!)
    │
    ├── 🔧 setup_venv.sh                ← One-time setup (Run first!)
    ├── 🔧 start_server_with_venv.sh    ← Launch backend
    ├── 🔧 install_build_tools.sh       ← Fix RPi.GPIO errors
    ├── 🔧 install_dependencies.sh      ← Pip installer with fallbacks
    ├── 📋 energy-dashboard.service     ← Systemd auto-start
    │
    └── venv/                           ← Virtual environment (created by setup_venv.sh)
```

## 📚 Recommended Reading Order

### For Quick Start (5 min)
1. [QUICK_START.md](QUICK_START.md)
2. Run the commands
3. Done!

### For Complete Understanding (30 min)
1. [QUICK_START.md](QUICK_START.md) - Installation
2. [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Verify
3. [server/README.md](server/README.md) - Architecture
4. [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md) - What's implemented

### For Troubleshooting (as needed)
1. [server/VENV_SETUP.md](server/VENV_SETUP.md) - Environment issues
2. [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md) - Dependency issues
3. Google your specific error message

## 🎯 By Use Case

### "I want to run this now"
→ [QUICK_START.md](QUICK_START.md)

### "It's not working, help!"
→ [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) then [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md)

### "I need to understand the architecture"
→ [server/README.md](server/README.md) then [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md)

### "How do I deploy to production?"
→ [QUICK_START.md](QUICK_START.md) section "Option B: Auto-Startup"

### "I want to customize settings"
→ [server/.env](server/.env) + [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md#-configuration-reference)

### "What APIs are available?"
→ [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md#-what-works) or [server/README.md](server/README.md)

### "My RPi.GPIO won't install"
→ [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md) section "RPi.GPIO compilation"

## 📝 Document Purposes

| Document | Purpose | Read Time |
|----------|---------|-----------|
| QUICK_START.md | Get running fast | 5 min |
| SETUP_CHECKLIST.md | Verify installation | 10 min |
| server/README.md | Backend overview | 10 min |
| server/VENV_SETUP.md | Environment setup | 5 min |
| server/INSTALLATION_TROUBLESHOOTING.md | Fix errors | varies |
| server/BACKEND_STATUS.md | Implementation details | 15 min |

## 🔍 Finding Specific Information

**Looking for...**

- API endpoint list? → [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md#-what-works)
- Configuration options? → [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md#-configuration-reference)
- Startup commands? → [QUICK_START.md](QUICK_START.md#starting-the-servers)
- Hardware requirements? → [server/README.md](server/README.md#-hardware-requirements)
- Systemd service setup? → [QUICK_START.md](QUICK_START.md#option-b-auto-startup-production)
- Virtual environment help? → [server/VENV_SETUP.md](server/VENV_SETUP.md)
- Dependency issues? → [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md)
- What's implemented? → [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md#-completed-components)

## ✅ Quick Reference Commands

```bash
# One-time setup
bash server/setup_venv.sh

# Fix RPi.GPIO if needed
bash server/install_build_tools.sh

# Start backend
bash server/start_server_with_venv.sh

# Start frontend (another terminal)
npm run dev

# Check if backend is running
curl http://localhost:5000/health

# Enable auto-startup
sudo systemctl enable energy-dashboard
sudo systemctl start energy-dashboard

# Check service status
sudo systemctl status energy-dashboard

# View recent service logs
sudo journalctl -u energy-dashboard -f
```

## 🆘 Still Stuck?

1. Check [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Find your issue
2. Check [server/INSTALLATION_TROUBLESHOOTING.md](server/INSTALLATION_TROUBLESHOOTING.md) - Get solution
3. Check [server/README.md](server/README.md) - Understand architecture
4. Check [server/BACKEND_STATUS.md](server/BACKEND_STATUS.md) - See what's possible

## 📊 Documentation Coverage

- ✅ Installation & Setup
- ✅ Troubleshooting & Error Fixes
- ✅ API Documentation
- ✅ Configuration Reference
- ✅ Architecture & Design
- ✅ Deployment Options
- ✅ Hardware Integration
- ✅ Production Deployment (systemd)
- ⚠️ Advanced customization (beyond scope)
- ⚠️ Unit testing (future)

---

**Happy coding!** 🎉

Questions? Start with [QUICK_START.md](QUICK_START.md) or check [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md).
