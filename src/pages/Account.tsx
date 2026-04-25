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

export default function Account() {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profilePostalCode, setProfilePostalCode] = useState('');
  const [profileSmsOptIn, setProfileSmsOptIn] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Reset password state
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setCancellingId(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`,
        },
        body: JSON.stringify({ reason: cancelReason || 'Cancelled by customer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');
      
      alert('Order cancelled successfully.');
      fetchUserOrders(false);
      setViewingOrderId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
      setCancelReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-amber-500 bg-amber-50';
      case 'Processing': return 'text-blue-500 bg-blue-50';
      case 'Shipped': return 'text-indigo-500 bg-indigo-50';
      case 'Delivered': return 'text-emerald-500 bg-emerald-50';
      case 'Cancelled': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStepStatus = (orderStatus: string, step: string) => {
    const sequence = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const currentIndex = sequence.indexOf(orderStatus);
    const stepIndex = sequence.indexOf(step);
    
    if (orderStatus === 'Cancelled') return 'cancelled';
    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex === stepIndex - 1) return 'next';
    return 'pending';
  };

  const selectedOrder = orders.find(o => o.orderId === viewingOrderId);

  // Sync profile fields from user whenever user changes or tab switches to profile
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
      setProfileCity(user.city || '');
      setProfilePostalCode(user.postalCode || '');
      setProfileSmsOptIn(user.smsOptIn || false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (user && activeTab === 'orders') {
      fetchUserOrders();
      intervalId = setInterval(() => fetchUserOrders(false), 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [user, activeTab]);

  const fetchUserOrders = async (showLoading = true) => {
    if (showLoading && orders.length === 0) setLoadingOrders(true);
    try {
      const res = await fetch(`${API_URL}/orders/user`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
      });
      if (res.status === 401) {
        // Token is invalid/expired
        setOrders([]);
        setLoadingOrders(false);
        logout();
        return;
      }
      const data = await res.json();
      // Guard: only use data if it is actually an array
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aura_token')}`,
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          address: profileAddress,
          city: profileCity,
          postalCode: profilePostalCode,
          smsOptIn: profileSmsOptIn,
        }),
      });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      updateUser({ 
        name: data.name, 
        phone: data.phone, 
        address: data.address, 
        city: data.city, 
        postalCode: data.postalCode,
        smsOptIn: data.smsOptIn
      });
      setProfileMessage({ type: 'ok', text: 'Profile saved successfully.' });
    } catch (err) {
      setProfileMessage({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setProfileSaving(false);
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
    const confirmation = prompt('DANGER: To confirm account deletion, please type your email address exactly.');
    if (confirmation !== user?.email) {
      alert('Incorrect email. Deletion cancelled.');
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('aura_token')}` }
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
    // Task 3: pt-32 gives ample padding below the fixed navbar (navbar is ~80px, pt-32 = 128px)
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
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

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-6">
                {!viewingOrderId ? (
                  <>
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
                    ) : (
                      <div className="grid gap-4">
                        {orders.map(order => (
                          <div 
                            key={order.orderId} 
                            onClick={() => setViewingOrderId(order.orderId)}
                            className="glass-card p-6 rounded-3xl hover:border-black/10 cursor-pointer transition-all group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl">📦</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">#{order.orderId}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getStatusColor(order.status)}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                                <div className="text-right">
                                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">Total</p>
                                  <p className="font-black text-gray-900">{formatPrice(order.totalAmount)}</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : selectedOrder && (
                  <div className="animate-fade-in space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setViewingOrderId(null)}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-100 hover:border-black transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h1 className="text-2xl font-black tracking-tight text-gray-900">Order Tracking</h1>
                    </div>

                    {/* Tracking Timeline */}
                    <div className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden">
                      <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-8 mb-8 md:mb-10 relative z-10">
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Order Number</p>
                          <h3 className="text-lg md:text-xl font-black text-gray-900 truncate">#{selectedOrder.orderId}</h3>
                        </div>
                        <div className="md:text-right">
                          <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1">Current Status</p>
                          <span className={`text-xs md:text-sm px-4 py-1.5 rounded-full font-bold uppercase inline-block ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>

                      <div className="relative mt-8 md:mt-12 mb-8 px-0 md:px-4">
                        {/* Timeline line */}
                        <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 rounded-full hidden md:block" />
                        
                        <div className="flex flex-col md:flex-row justify-between relative gap-10 md:gap-0">
                          {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                            const status = getStepStatus(selectedOrder.status, step);
                            const icons = ['📝', '⚙️', '🚚', '📦'];
                            return (
                              <div key={step} className="flex md:flex-col items-center gap-4 md:gap-4 relative z-10">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all duration-500 ${
                                  status === 'completed' ? 'bg-black text-white shadow-lg shadow-black/20' :
                                  status === 'next' ? 'bg-white border-2 border-black text-black' :
                                  status === 'cancelled' ? 'bg-red-50 text-red-500' :
                                  'bg-white border border-gray-100 text-gray-300'
                                }`}>
                                  {status === 'completed' ? '✓' : icons[idx]}
                                </div>
                                <div className="text-left md:text-center">
                                  <p className={`text-[11px] font-black tracking-wider uppercase ${status === 'completed' || status === 'next' ? 'text-gray-900' : 'text-gray-300'}`}>
                                    {step}
                                  </p>
                                  {selectedOrder.trackingHistory.find(h => h.status === step) && (
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                      {new Date(selectedOrder.trackingHistory.find(h => h.status === step)!.timestamp).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cancel Policy & Action */}
                      {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing') && (
                        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 flex-1">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <p className="text-xs font-bold text-amber-900 mb-1">Cancellation Policy</p>
                              <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                                Orders can be cancelled while in <span className="font-bold">Pending</span> or <span className="font-bold">Processing</span> status. 
                                Once Shipped, you must follow our standard return process.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.orderId)}
                            disabled={cancellingId === selectedOrder.orderId}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-red-50 text-red-500 text-xs font-black tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            {cancellingId === selectedOrder.orderId ? 'CANCELLING...' : 'CANCEL ORDER'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        {/* Items */}
                        <div className="glass-card p-8 rounded-[2.5rem]">
                          <h4 className="text-sm font-black tracking-widest uppercase text-gray-900 mb-6">Ordered Items</h4>
                          <div className="space-y-6">
                            {selectedOrder.items.map((item, idx) => (
                              <div key={idx} className="flex gap-4 group">
                                <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                  <img src={item.productImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.productName} />
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                  <h5 className="font-bold text-gray-900">{item.productName}</h5>
                                  <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{item.selectedColor} · {item.selectedSize} · QTY: {item.quantity}</p>
                                  <p className="text-sm font-black text-gray-900 mt-2">{formatPrice(item.productPrice * item.quantity)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tracking Log */}
                        <div className="glass-card p-8 rounded-[2.5rem]">
                          <h4 className="text-sm font-black tracking-widest uppercase text-gray-900 mb-6">Detailed Activity</h4>
                          <div className="space-y-6">
                            {selectedOrder.trackingHistory.slice().reverse().map((log, idx) => (
                              <div key={idx} className="flex gap-4 relative">
                                {idx !== selectedOrder.trackingHistory.length - 1 && (
                                  <div className="absolute top-8 left-2.5 bottom-0 w-0.5 bg-gray-50" />
                                )}
                                <div className="w-5 h-5 rounded-full bg-white border-4 border-black flex-shrink-0 mt-1 z-10" />
                                <div>
                                  <p className="text-sm font-black text-gray-900">{log.status}</p>
                                  <p className="text-xs text-gray-500 mt-1 font-medium">{log.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1.5 font-bold">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Summary */}
                        <div className="glass-card p-8 rounded-[2.5rem]">
                          <h4 className="text-sm font-black tracking-widest uppercase text-gray-900 mb-6">Payment Summary</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 font-medium">Subtotal</span>
                              <span className="font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 font-medium">Shipping</span>
                              <span className="text-emerald-500 font-bold">FREE</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 font-medium">Payment</span>
                              <span className="font-bold text-gray-900 uppercase">{selectedOrder.paymentMethod}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between">
                              <span className="font-black text-gray-900">Total</span>
                              <span className="font-black text-2xl text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info */}
                        {/* Note: In Daraz this is often hidden or limited for security but useful for verification */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACCOUNT INFO TAB */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in glass-card p-10 rounded-[3rem]">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Account Info</h1>
                <p className="text-xs text-gray-400 mb-8 font-medium">
                  Update your personal details. Your saved address will be auto-filled when you place an order.
                </p>

                <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      required
                      className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Email Address</label>
                    <input
                      type="text"
                      value={user.email}
                      readOnly
                      className="w-full glass-panel px-6 py-4 rounded-2xl text-sm bg-gray-50/50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5 pl-1">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      placeholder="e.g. +94 77 123 4567"
                      className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Delivery Address</label>
                    <input
                      type="text"
                      value={profileAddress}
                      onChange={e => setProfileAddress(e.target.value)}
                      placeholder="e.g. 42 Galle Road"
                      className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">City</label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={e => setProfileCity(e.target.value)}
                        placeholder="e.g. Colombo"
                        className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] font-black tracking-widest uppercase text-gray-400 mb-2">Postal Code</label>
                      <input
                        type="text"
                        value={profilePostalCode}
                        onChange={e => setProfilePostalCode(e.target.value)}
                        placeholder="e.g. 00300"
                        className="w-full glass-panel px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                  </div>

                  <div className="pt-4 pb-2">
                    <label className="flex items-center gap-3 cursor-pointer group w-max">
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors border-2 ${profileSmsOptIn ? 'bg-black border-black text-white' : 'border-gray-300 group-hover:border-black'}`}>
                        <svg className={`w-3.5 h-3.5 transition-transform ${profileSmsOptIn ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm font-bold text-gray-700 select-none">Subscribe to SMS alerts for exclusive marketing offers</span>
                      <input type="checkbox" className="hidden" checked={profileSmsOptIn} onChange={(e) => setProfileSmsOptIn(e.target.checked)} />
                    </label>
                  </div>

                  {profileMessage && (
                    <p className={`text-xs font-bold ${profileMessage.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {profileMessage.type === 'ok' ? '✓ ' : '✕ '}{profileMessage.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="glass-dark px-10 py-4 rounded-full text-sm font-bold tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {profileSaving ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </form>

                {/* Password Reset */}
                <div className="mt-12 pt-10 border-t border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Password</h3>
                  <p className="text-xs text-gray-400 mb-4 font-medium">
                    A reset link will be sent to your registered email address. Click the link to set a new password.
                  </p>
                  <button
                    type="button"
                    onClick={requestPasswordReset}
                    disabled={resetLoading}
                    className="text-sm font-bold text-gray-600 hover:text-black transition-colors disabled:opacity-50 underline underline-offset-4"
                  >
                    {resetLoading ? 'Sending...' : 'Send Password Reset Link →'}
                  </button>
                  {resetMessage && (
                    <p className={`text-xs mt-2 font-medium ${resetMessage.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {resetMessage.text}
                    </p>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="mt-12 pt-10 border-t border-gray-100">
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
