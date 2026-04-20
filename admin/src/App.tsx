import { useState } from 'react';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import SalesView from './components/SalesView';
import { adminLogin, adminLogout, adminLogin2FA, hasAdminToken } from './lib/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminToken());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'sales'>('orders');

  const tabTitles = {
    orders: 'Order Management',
    inventory: 'Product Inventory',
    sales: 'Sales Analytics',
  };

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const result = await adminLogin(username.trim(), password);
      // Fixed logic: result might have requires2FA property
      if (result && 'requires2FA' in result && result.requires2FA) {
        setRequires2FA(true);
        setUserId(result.userId);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handle2FA = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    setAuthError('');
    setAuthLoading(true);

    try {
      await adminLogin2FA(userId, otp);
      setRequires2FA(false);
      setIsAuthenticated(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setPassword('');
    setOtp('');
    setRequires2FA(false);
    setActiveTab('orders');
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />

        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-10 p-6">
          <div className="text-center">
            <p className="mb-3 inline-flex items-center rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-4 py-1 text-xs font-bold tracking-[0.3em] text-fuchsia-100">
              ADMIN ONLY
            </p>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
              AURA Control Room
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              Manage orders, inventory, and sales insights from one secure dashboard.
            </p>
          </div>

          <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-white">Sign in to continue</h2>
            <p className="mt-1 text-sm text-slate-300">Use the admin credentials configured on the server.</p>

            {!requires2FA ? (
              <form className="mt-6 space-y-4" onSubmit={handleAdminLogin}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">Username</label>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
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
                    onChange={(event) => setPassword(event.target.value)}
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
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handle2FA}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-300">Authentication Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/30"
                    placeholder="Enter 2FA Code"
                    required
                  />
                </div>
                {authError && <p className="text-sm font-semibold text-red-300">{authError}</p>}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-linear-to-r from-cyan-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authLoading ? 'Verifying...' : 'Verify'}
                </button>
              </form>
            )}
          </section>
        </main>
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Admin Control</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
              activeTab === 'orders' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${activeTab === 'orders' ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
              activeTab === 'inventory' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${activeTab === 'inventory' ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
              activeTab === 'sales' 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className={`w-5 h-5 transition-colors ${activeTab === 'sales' ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-bold text-sm tracking-wide">Sales</span>
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
          <div className="flex gap-4">
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>
          </div>
        </header>

        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'inventory' && <ProductsView />}
        {activeTab === 'sales' && <SalesView />}
      </main>
    </div>
  );
}
