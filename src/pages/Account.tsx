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
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (user && activeTab === 'orders') {
      fetchUserOrders(); // Initial fetch
      
      // Start polling for real-time updates
      intervalId = setInterval(() => {
        fetchUserOrders(false); // background fetch
      }, 5000);
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
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'glass-dark' : 'text-gray-500 hover:bg-white/50'}`}
            >
              👤 PROFILE SETTINGS
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
                  <div className="glass-card p-12 text-center rounded-3xl">
                    <p className="text-gray-500 font-medium">No orders found yet. Start your journey with AURA.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.orderId}
                        onClick={() => setSelectedOrder(selectedOrder?.orderId === order.orderId ? null : order)}
                        className={`glass-card p-6 rounded-3xl cursor-pointer hover:scale-[1.01] transition-all border border-transparent ${selectedOrder?.orderId === order.orderId ? 'border-black/10 ring-1 ring-black/5 shadow-2xl' : ''}`}
                      >
                        <div className="flex flex-wrap justify-between items-center gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Order ID</span>
                            <span className="font-bold text-gray-900">#{order.orderId}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</span>
                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total</span>
                            <span className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</span>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                              'bg-black text-white'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Expandable Tracking View */}
                        {selectedOrder?.orderId === order.orderId && (
                          <div className="mt-8 pt-8 border-t border-gray-100 animate-fade-in">
                            
                            {/* Visual Progress Pipeline */}
                            {order.status !== 'Cancelled' && (
                              <div className="mb-10">
                                <div className="flex items-center justify-between mb-2">
                                  {(['Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((step, idx, arr) => {
                                    const stepOrder = arr.indexOf(step);
                                    const currentOrder = arr.indexOf(order.status as typeof arr[number]);
                                    const isActive = stepOrder <= currentOrder;
                                    const isCurrent = step === order.status;
                                    const icons = ['⏳', '🔄', '🚚', '✅'];
                                    return (
                                      <div key={step} className="flex items-center flex-1 last:flex-initial">
                                        <div className="flex flex-col items-center">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-all ${
                                            isCurrent ? 'bg-black text-white shadow-lg shadow-black/20 scale-110' :
                                            isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                                          }`}>
                                            {icons[idx]}
                                          </div>
                                          <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                                        </div>
                                        {idx < arr.length - 1 && (
                                          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${stepOrder < currentOrder ? 'bg-black' : 'bg-gray-100'}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {order.status === 'Cancelled' && (
                              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-center">
                                <p className="text-sm font-bold text-red-600">❌ This order has been cancelled</p>
                              </div>
                            )}

                            <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900 mb-6">Tracking Timeline</h3>
                            
                            <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                              {order.trackingHistory.slice().reverse().map((step, idx) => {
                                const getColor = (s: string) => {
                                  switch (s) {
                                    case 'Pending': return 'bg-amber-400';
                                    case 'Processing': return 'bg-blue-500';
                                    case 'Shipped': return 'bg-purple-500';
                                    case 'Delivered': return 'bg-emerald-500';
                                    case 'Cancelled': return 'bg-red-500';
                                    default: return 'bg-gray-400';
                                  }
                                };
                                const getLabelColor = (s: string) => {
                                  switch (s) {
                                    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
                                    case 'Processing': return 'bg-blue-50 text-blue-700 border-blue-200';
                                    case 'Shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
                                    case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                    case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
                                    default: return 'bg-gray-50 text-gray-600 border-gray-200';
                                  }
                                };
                                return (
                                  <div key={idx} className="relative">
                                    <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? getColor(step.status) + ' animate-pulse shadow-md' : 'bg-gray-200'}`} />
                                    <div className={`${idx === 0 ? '' : 'opacity-60'}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-1.5 ${getLabelColor(step.status)}`}>{step.status}</span>
                                          <p className="text-xs text-gray-700 font-medium leading-relaxed">{step.message}</p>
                                        </div>
                                        <p className="text-[10px] text-gray-300 font-bold whitespace-nowrap mt-0.5">
                                          {new Date(step.timestamp).toLocaleDateString()}<br />{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass-panel rounded-2xl">
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Payment</p>
                                    <p className="text-xs font-bold text-gray-800 uppercase">{order.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Payment Status</p>
                                    <p className={`text-xs font-bold uppercase ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{order.paymentStatus}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Items</p>
                                    <p className="text-xs font-bold text-gray-800">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Last Update</p>
                                    <p className="text-xs font-bold text-gray-800">{order.trackingHistory.length > 0 ? new Date(order.trackingHistory[order.trackingHistory.length - 1].timestamp).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-fade-in glass-card p-10 rounded-[3rem]">
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-8">Account Settings</h1>
                
                <form className="space-y-6 max-w-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">Display Name</label>
                      <input type="text" defaultValue={user.name} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">Phone Number</label>
                      <input type="text" defaultValue={user.phone} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-gray-500 mb-2">Email Address</label>
                    <input type="email" defaultValue={user.email} className="w-full glass-panel px-6 py-4 rounded-2xl text-sm bg-gray-50/50" readOnly />
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">To change your email, please contact customer support.</p>
                  </div>

                  <div className="pt-6">
                    <button className="glass-dark px-10 py-4 rounded-full text-sm font-bold tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                      SAVE CHANGES
                    </button>
                  </div>
                </form>

                <div className="mt-12 pt-12 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
                    <button className="text-sm font-bold text-gray-500 hover:text-black transition-colors">RESET PASSWORD →</button>
                    <p className="text-xs text-gray-400 mt-2">A reset link will be sent to your registered email.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
