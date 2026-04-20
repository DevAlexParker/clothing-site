import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../data';

interface Order {
  orderId: string;
  createdAt: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'stripe' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  totalAmount: number;
  items: any[];
  trackingHistory: {
    status: string;
    message: string;
    timestamp: string;
  }[];
}

interface UserSession {
  _id: string;
  browser: string;
  os: string;
  ip: string;
  lastActive: string;
  isValid: boolean;
}

export default function Account() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'security'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (user) {
      if (activeTab === 'orders') {
        fetchUserOrders();
        intervalId = setInterval(() => fetchUserOrders(false), 5000);
      } else if (activeTab === 'security') {
        fetchSessions();
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, activeTab]);

  const fetchUserOrders = async (showLoading = true) => {
    if (showLoading && orders.length === 0) setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders/user`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      if (res.ok) setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm('Are you sure you want to logout from all other devices?')) return;
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      if (res.ok) setSessions([]);
    } catch (err) {
      console.error('Failed to revoke all sessions:', err);
    }
  };

  const requestPasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setResetMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
      setResetMessage({
        type: 'ok',
        text: (data as { message?: string }).message || 'Check your email for a reset link.',
      });
    } catch (err) {
      setResetMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('DANGER: To confirm account deletion, please type your email address exactly as it appears above.');
    if (confirmation !== user?.email) {
      alert('Incorrect email. Deletion cancelled.');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      
      alert('Your account and all associated data have been permanently erased from AURA.');
      logout();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="glass-card p-6 rounded-3xl mb-6">
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-4 mx-auto">
                {user.name[0]}
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900">{user.name}</h2>
              <p className="text-xs text-center text-gray-500 mt-1 uppercase tracking-widest font-semibold">{user.role}</p>
            </div>

            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'glass-dark' : 'text-gray-500 hover:bg-white/50'}`}
            >
              📦 MY ORDERS
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'security' ? 'glass-dark' : 'text-gray-500 hover:bg-white/50'}`}
            >
              🛡️ SECURITY
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'glass-dark' : 'text-gray-500 hover:bg-white/50'}`}
            >
              👤 ACCOUNT INFO
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all mt-8"
            >
              🚪 LOGOUT
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            
            {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-6">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-8">Purchase History</h1>
                {loadingOrders ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-black/10 border-t-black rounded-full" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="glass-card p-20 text-center rounded-[3rem]">
                    <div className="text-4xl mb-4">🛍️</div>
                    <p className="text-gray-500 font-bold">No orders found yet.</p>
                  </div>
                ) : orders.map(order => (
                  <div key={order.orderId} className="glass-card p-6 rounded-3xl mb-4">
                     <div className="flex justify-between">
                        <span className="font-bold">#{order.orderId}</span>
                        <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                     </div>
                     <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                     <p className={`text-[10px] font-black uppercase mt-2 ${order.status === 'Cancelled' ? 'text-red-500' : 'text-emerald-600'}`}>{order.status}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-fade-in space-y-8">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-8">Security & Access</h1>
                
                {/* Active Sessions */}
                <div className="glass-card p-8 rounded-[3rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Active Sessions</h3>
                    <button onClick={revokeAllSessions} className="text-xs font-bold text-red-500 hover:underline">REVOKE ALL</button>
                  </div>
                  
                  {loadingSessions ? <div className="text-center py-4 text-gray-400">Loading sessions...</div> : (
                    <div className="space-y-4">
                      {sessions.map(sess => (
                        <div key={sess._id} className="flex justify-between items-center p-4 glass-panel rounded-2xl transition-all hover:bg-white/80">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">{sess.os.toLowerCase().includes('windows') ? '💻' : '📱'}</div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{sess.browser} on {sess.os}</p>
                              <p className="text-[10px] text-gray-400 font-medium tracking-tight">IP: {sess.ip} • Last active: {new Date(sess.lastActive).toLocaleString()}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => revokeSession(sess._id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password Management */}
                <div className="glass-card p-8 rounded-[3rem]">
                  <h3 className="text-xl font-bold mb-4">Identity Verification</h3>
                  <div className="flex items-center justify-between p-6 glass-panel rounded-2xl mb-4">
                    <div>
                      <p className="text-sm font-bold">Credential Rotation</p>
                      <p className="text-xs text-gray-500 mt-1">Initiate a password reset via your verified email.</p>
                    </div>
                    <button 
                      onClick={requestPasswordReset}
                      disabled={resetLoading}
                      className="text-[10px] font-black bg-black text-white px-6 py-3 rounded-full hover:scale-105 transition-all outline-none"
                    >
                      {resetLoading ? 'SENDING...' : 'ROTATE CREDENTIALS'}
                    </button>
                  </div>
                  {resetMessage && <p className={`text-xs px-4 font-bold ${resetMessage.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>{resetMessage.text}</p>}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-fade-in glass-card p-10 rounded-[3rem]">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Account Info</h1>
                <p className="text-xs text-gray-400 mb-8 font-medium">Manage your personal identity data and GDPR rights.</p>
                
                <form className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Legal Name</label>
                    <input type="text" defaultValue={user.name} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Email Address</label>
                    <input type="text" value={user.email} readOnly className="w-full glass-panel px-6 py-4 rounded-2xl text-sm bg-gray-50/50 text-gray-500 cursor-not-allowed" />
                  </div>
                </form>
                
                <div className="mt-16 pt-10 border-t border-gray-100">
                  <h3 className="text-rose-600 font-black text-sm uppercase tracking-widest mb-2">Terminate Account</h3>
                  <p className="text-xs text-gray-400 mb-6 max-w-md font-medium leading-relaxed">
                    Permanently erase your identity, order history (anonymized), and active sessions from our systems. This action is irreversible.
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="text-[10px] font-black text-white bg-rose-600 px-8 py-4 rounded-full hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                  >
                    {deleteLoading ? 'ERASING...' : 'ERASE MY ACCOUNT PERMANENTLY'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
