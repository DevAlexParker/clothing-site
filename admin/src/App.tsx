import { useState } from 'react';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import SalesView from './components/SalesView';
import SecurityLogsView from './components/SecurityLogsView';
import { adminLogin, adminLogout, adminLogin2FA, hasAdminToken, adminRegister, adminForgotPassword } from './lib/api';
import AdminNotifications from './components/AdminNotifications';

type AuthStage = 'login' | 'signup' | 'forgot' | '2fa' | 'verify';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminToken());
  const [stage, setStage] = useState<AuthStage>('login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'sales' | 'security'>('orders');

  const tabTitles = {
    orders: 'Order Management',
    inventory: 'Product Inventory',
    sales: 'Sales Analytics',
    security: 'Security & Audit Logs',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await adminLogin(username.trim(), password);
      if (result && 'requires2FA' in result && result.requires2FA) {
        setUserId(result.userId);
        setStage('2fa');
      } else if (result && 'requires2FASetup' in result && (result as any).requires2FASetup) {
        setIsAuthenticated(true);
        setAuthInfo('Welcome! 2FA is mandatory. Please set it up in Security.');
      } else {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await adminRegister(name, username, password);
      if (result.requiresVerification) {
        setPendingEmail(username);
        setStage('verify');
        setAuthInfo('Verification code sent to your email.');
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setAuthLoading(true);
    try {
      const result = await adminForgotPassword(username);
      setAuthInfo(result.message || 'Check your email for a reset link.');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setAuthError('');
    setAuthLoading(true);
    try {
      await adminLogin2FA(userId, otp);
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
    setStage('login');
    setUsername('');
    setPassword('');
  };

  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDeleteAccount = async () => {
    if (!confirm('DANGER: This will permanently delete your admin account and all associated logs will be anonymized. Proceed?')) return;
    setDeleteLoading(true);
    try {
      await deleteAdminAccount();
      alert('Account deleted successfully.');
      handleLogout();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] animate-pulse delay-700" />

        <div className="relative z-10 text-center mb-10 text-white">
          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-fuchsia-400 mb-4">Admin Control Center</p>
          <h1 className="text-6xl font-black tracking-tighter mb-4">AURA Control Room</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Access mission-critical tools for shop management and security auditing.</p>
        </div>

        <div className="relative z-10 w-full max-w-md glass-card bg-white/5 border-white/10 p-10 rounded-[3rem] shadow-2xl backdrop-blur-2xl">
          {stage === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Security Login</h2>
              <div className="space-y-4">
                <input type="email" placeholder="Admin Email" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-fuchsia-500 transition-all" />
                <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-fuchsia-500 transition-all" />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => setStage('forgot')} className="text-xs text-slate-400 hover:text-white">Forgot Password?</button>
              </div>
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
              <button disabled={authLoading} className="w-full bg-linear-to-r from-fuchsia-600 to-cyan-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:brightness-110 transition-all shadow-lg shadow-fuchsia-600/20">{authLoading ? 'AUTHENTICATING...' : 'LOGIN'}</button>
              <div className="text-center pt-4 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setStage('signup')} className="text-xs text-slate-400 hover:text-white">Don't have an admin account? <span className="text-fuchsia-400 font-bold ml-1">Sign Up</span></button>
              </div>
            </form>
          )}

          {stage === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Register Admin</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-cyan-500 transition-all" />
                <input type="email" placeholder="Admin Email" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-cyan-500 transition-all" />
                <input type="password" placeholder="Set Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-cyan-500 transition-all" />
              </div>
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
              <button disabled={authLoading} className="w-full bg-linear-to-r from-cyan-600 to-fuchsia-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:brightness-110 transition-all">{authLoading ? 'CREATING...' : 'REQUEST ACCESS'}</button>
              <div className="text-center pt-4 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setStage('login')} className="text-xs text-slate-400 hover:text-white">Already have access? <span className="text-cyan-400 font-bold ml-1">Log In</span></button>
              </div>
            </form>
          )}

          {stage === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-xs text-slate-400 mb-4">Enter your email to receive recovery instructions.</p>
              <input type="email" placeholder="Admin Email" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm outline-none" />
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
              {authInfo && <p className="text-xs text-emerald-400 text-center">{authInfo}</p>}
              <button disabled={authLoading} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-slate-200 transition-all">SEND RESET LINK</button>
              <div className="text-center">
                <button type="button" onClick={() => setStage('login')} className="text-xs text-slate-400 hover:text-white">Back to Login</button>
              </div>
            </form>
          )}

          {stage === '2fa' && (
            <form onSubmit={handle2FA} className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Auth</h2>
              <p className="text-xs text-slate-400 mb-6">Enter the 6-digit code from your authenticator app.</p>
              <input type="text" maxLength={6} placeholder="000 000" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-6 text-white text-center font-mono text-2xl tracking-[0.3em] outline-none focus:border-fuchsia-500" />
              {authError && <p className="text-xs text-red-400 text-center">{authError}</p>}
              <button disabled={authLoading} className="w-full bg-linear-to-r from-fuchsia-500 to-cyan-500 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase">VERIFY CODE</button>
            </form>
          )}

          {stage === 'verify' && (
            <div className="text-center space-y-6">
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-sm text-slate-400">We've sent a 6-digit activation code to your email.</p>
              <div className="p-4 bg-white/5 rounded-2xl text-xs text-slate-300">Once verified through the main site, you can login here.</div>
              <button onClick={() => setStage('login')} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs">BACK TO LOGIN</button>
            </div>
          )}
        </div>
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
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="font-bold text-sm tracking-wide">Orders</span>
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="font-bold text-sm tracking-wide">Inventory</span>
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'sales' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="font-bold text-sm tracking-wide">Sales</span>
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10' : 'text-gray-500 hover:bg-gray-50'}`}>
            <span className="font-bold text-sm tracking-wide">Security</span>
          </button>
        </nav>

        <div className="p-8 border-t border-gray-50">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Logout
            </button>
            <button
              onClick={handleDeleteAccount}
              className="mt-2 w-full text-[9px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-600 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-black text-gray-900 underline decoration-fuchsia-500/30 underline-offset-8">
            {tabTitles[activeTab]}
          </h3>
          <AdminNotifications />
        </header>

        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'inventory' && <ProductsView />}
        {activeTab === 'sales' && <SalesView />}
        {activeTab === 'security' && <SecurityLogsView />}
      </main>
    </div>
  );
}
