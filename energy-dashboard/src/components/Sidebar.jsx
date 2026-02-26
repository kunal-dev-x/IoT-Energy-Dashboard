import { NavLink } from 'react-router-dom';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBatteryCharging,
  FiDollarSign,
  FiGrid,
  FiMonitor,
  FiSettings,
} from 'react-icons/fi';

const navItems = [
  { label: 'Dashboard', path: '/', icon: FiGrid },
  { label: 'Monitoring', path: '/monitoring', icon: FiMonitor },
  { label: 'Billing', path: '/billing', icon: FiDollarSign },
  { label: 'Statistics', path: '/statistics', icon: FiBarChart2 },
  { label: 'Alerts', path: '/alerts', icon: FiAlertTriangle },
  { label: 'Devices', path: '/devices', icon: FiBatteryCharging },
  { label: 'Settings', path: '/settings', icon: FiSettings },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 flex-shrink-0 border-r border-white/5 bg-[#060b18]/80 backdrop-blur xl:block">
      <div className="flex h-full flex-col">
        <div className="px-6 py-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">IoT Energy</div>
          <div className="mt-1 text-xl font-semibold text-white">Control Center</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-white/10 text-emerald-200 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.8)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-emerald-200">
                <item.icon size={18} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/5 px-6 py-4 text-xs text-slate-500">
          Demo UI · No hardware connected
        </div>
      </div>
    </aside>
  );
}