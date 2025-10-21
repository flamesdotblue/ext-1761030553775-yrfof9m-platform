import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import HeroCover from './components/HeroCover';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ManagementPanel from './components/ManagementPanel';
import { useStore } from './store';
import { Home, ShoppingCart, Settings } from 'lucide-react';

export default function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const scheduleDailySummary = useStore((s) => s.scheduleDailySummary);

  useEffect(() => {
    bootstrap();
    scheduleDailySummary();
  }, [bootstrap, scheduleDailySummary]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-50 text-slate-900">
        <div className="relative h-[60vh] w-full">
          <HeroCover />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
          <header className="absolute top-0 left-0 right-0 z-20">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="Logo" className="w-8 h-8" />
                <h1 className="text-xl md:text-2xl font-semibold">Juice Shop AI POS</h1>
              </div>
              <nav className="flex items-center gap-2 md:gap-4 text-sm md:text-base backdrop-blur-md bg-white/50 rounded-full px-2 py-1">
                <NavLink to="/" end className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-full ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-white'}`}>
                  <Home size={18} /> Dashboard
                </NavLink>
                <NavLink to="/pos" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-full ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-white'}`}>
                  <ShoppingCart size={18} /> POS
                </NavLink>
                <NavLink to="/manage" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-full ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-white'}`}>
                  <Settings size={18} /> Manage
                </NavLink>
              </nav>
            </div>
          </header>
          <div className="absolute bottom-8 left-0 right-0 z-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-4 md:p-6 border border-white shadow-lg">
                <p className="text-sm md:text-base text-slate-600">Smart, offline-friendly POS with AI predictions, dynamic pricing, recipes, inventory and WhatsApp billing. Currency: INR (₹)</p>
              </div>
            </div>
          </div>
        </div>

        <main className="-mt-12 md:-mt-16 z-20 relative">
          <div className="max-w-7xl mx-auto px-4 pb-16">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/manage" element={<ManagementPanel />} />
            </Routes>
          </div>
        </main>

        <footer className="mt-auto border-t bg-white/70 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500">
            WhatsApp templates are logged under WhatsApp_Logs. Daily auto-summary scheduled at 9:00 PM.
          </div>
        </footer>
      </div>
    </Router>
  );
}
