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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchUserOrders();
    }
  }, [user, activeTab]);

  const fetchUserOrders = async () => {
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
                            <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900 mb-8">Real-time Order Tracking</h3>
                            
                            <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                              {order.trackingHistory.slice().reverse().map((step, idx) => (
                                <div key={idx} className="relative">
                                  <div className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-black animate-pulse' : 'bg-gray-200'}`} />
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                                    <div>
                                      <p className={`font-bold text-sm ${idx === 0 ? 'text-black' : 'text-gray-500'}`}>{step.status}</p>
                                      <p className="text-xs text-gray-400 font-medium">{step.message}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-300 font-bold whitespace-nowrap">
                                      {new Date(step.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
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
