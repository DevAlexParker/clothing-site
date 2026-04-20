import { useState } from 'react';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import SalesView from './components/SalesView';
import SecurityLogsView from './components/SecurityLogsView';
import { adminLogin, adminLogout, hasAdminToken } from './lib/api';
import AdminNotifications from './components/AdminNotifications';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminToken());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'sales' | 'security'>('orders');

  const tabTitles = {
    orders: 'Order Management',
    inventory: 'Product Inventory',
    sales: 'Sales Analytics',
    security: 'Security & Audit Logs',
  };

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await adminLogin(username.trim(), password);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-6">
        {/* Animated Background Orbs */}
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] animate-pulse" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px] animate-pulse" />

        <div className="relative z-10 text-center mb-10 text-white">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-fuchsia-400 mb-4">Admin Control Center</p>
          <h1 className="text-6xl font-black tracking-tighter mb-4">AURA Control Room</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Manage orders, inventory, and sales insights from one secure dashboard.
          </p>
        </div>

        <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white">Admin Login</h2>
          <p className="mt-1 text-sm text-slate-300">Use the admin credentials configured in the server's .env file.</p>

          <form className="mt-6 space-y-4" onSubmit={handleAdminLogin}>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-fuchsia-300/70 focus:ring-2 focus:ring-fuchsia-300/30"
                placeholder="Enter admin username"
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/30"
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && <p className="text-sm font-semibold text-red-300">{authError}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-linear-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {authLoading ? 'Signing In...' : 'Login'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
            AURA
            <span className="w-2 h-2 bg-gray-900 rounded-full mt-2"></span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Admin Control Area</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <span className="font-bold text-sm tracking-wide">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <span className="font-bold text-sm tracking-wide">Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <span className="font-bold text-sm tracking-wide">Sales</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <span className="font-bold text-sm tracking-wide">Security</span>
          </button>
        </nav>

        <div className="p-8 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-gray-200 to-gray-100 flex items-center justify-center font-bold text-gray-500">A</div>
              <div>
                <p className="text-xs font-bold text-gray-900">Admin Staff</p>
                <p className="text-[10px] text-gray-400">Shop Manager</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Overview</h2>
            <h3 className="text-3xl font-black text-gray-900">
              {tabTitles[activeTab]}
            </h3>
          </div>
          <div className="flex gap-4 items-center">
            <AdminNotifications />
          </div>
        </header>

        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'inventory' && <ProductsView />}
        {activeTab === 'sales' && <SalesView />}
        {activeTab === 'security' && <SecurityLogsView />}
      </main>
    </div>
  );
}
