import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import Billing from './pages/Billing';
import Statistics from './pages/Statistics';
import Alerts from './pages/Alerts';
import Devices from './pages/Devices';

const routes = [
  { path: '/', label: 'Dashboard', element: <Dashboard /> },
  { path: '/monitoring', label: 'Monitoring', element: <Monitoring /> },
  { path: '/billing', label: 'Billing', element: <Billing /> },
  { path: '/statistics', label: 'Statistics', element: <Statistics /> },
  { path: '/alerts', label: 'Alerts', element: <Alerts /> },
  { path: '/devices', label: 'Devices', element: <Devices /> },
  { path: '/settings', label: 'Settings', element: <Dashboard subtitle="Configure devices" /> },
];

function Shell() {
  const location = useLocation();
  const active = routes.find((r) => r.path === location.pathname) ?? routes[0];

  return (
    <div className="flex min-h-screen bg-grid text-white">
      <Sidebar />
      <div className="flex-1 px-4 pb-10 sm:px-6 lg:px-10">
        <Navbar title={active.label} />
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
