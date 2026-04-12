import { useState, useEffect, useCallback } from 'react';
import { fetchOrders, updateOrderStatus, formatPrice } from './lib/api';
import type { Order, OrderStatus } from './lib/api';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
      setLastRefreshed(new Date());
      // Update selected order if it's in the new data
      if (selectedOrder) {
        const updated = data.find(o => o.orderId === selectedOrder.orderId);
        if (updated) setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrder]);

  useEffect(() => {
    loadOrders();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.orderId === orderId ? updated : o));
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Processing': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Shipped': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500';
      case 'Processing': return 'bg-blue-500 animate-pulse';
      case 'Shipped': return 'bg-purple-500';
      case 'Delivered': return 'bg-emerald-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter text-gray-900">AURA.</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-sm font-semibold text-gray-500 tracking-wide uppercase">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </span>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-bold tracking-wider uppercase rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-6">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: stats.total, color: 'bg-gray-900 text-white' },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-800 border border-amber-200' },
            { label: 'Processing', value: stats.processing, color: 'bg-blue-50 text-blue-800 border border-blue-200' },
            { label: 'Shipped', value: stats.shipped, color: 'bg-purple-50 text-purple-800 border border-purple-200' },
            { label: 'Delivered', value: stats.delivered, color: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-4 flex flex-col`}>
              <span className="text-xs font-bold tracking-wider uppercase opacity-70">{stat.label}</span>
              <span className="text-3xl font-black mt-1">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Orders Table */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Order Management</h2>
                <p className="text-xs text-gray-500 mt-0.5">Click an order to view details and update status</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading orders...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 border-b border-gray-100">Order ID</th>
                      <th className="px-5 py-3 border-b border-gray-100">Date</th>
                      <th className="px-5 py-3 border-b border-gray-100">Customer</th>
                      <th className="px-5 py-3 border-b border-gray-100">Items</th>
                      <th className="px-5 py-3 border-b border-gray-100">Total</th>
                      <th className="px-5 py-3 border-b border-gray-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="text-gray-400 font-medium">No orders yet</p>
                          <p className="text-gray-400 text-sm mt-1">Orders placed on the store will appear here automatically.</p>
                        </td>
                      </tr>
                    ) : orders.map(order => (
                      <tr 
                        key={order.orderId} 
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${selectedOrder?.orderId === order.orderId ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''}`}
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">#{order.orderId}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700 font-medium">{order.customerInfo.fullName}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.status)}`}></span>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Order Details Panel */}
          {selectedOrder ? (
            <div className="w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit sticky top-24">
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Order Details</h3>
                  <p className="text-sm font-mono text-gray-500 mt-0.5">#{selectedOrder.orderId}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">
                
                {/* Status Update */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Update Status</label>
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder.orderId, e.target.value as OrderStatus)}
                    disabled={updating}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all font-medium appearance-none bg-gray-50 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Processing">🔄 Processing</option>
                    <option value="Shipped">📦 Shipped</option>
                    <option value="Delivered">✅ Delivered</option>
                    <option value="Cancelled">❌ Cancelled</option>
                  </select>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold text-gray-900">{selectedOrder.customerInfo.fullName}</span></p>
                    <p className="text-gray-600 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      {selectedOrder.customerInfo.email}
                    </p>
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-gray-600 flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span>
                          {selectedOrder.customerInfo.addressLine1}<br/>
                          {selectedOrder.customerInfo.city}, {selectedOrder.customerInfo.postalCode}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Order Items ({selectedOrder.items.length})</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-14 h-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 py-0.5 flex flex-col justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.productName}</h5>
                            <p className="text-xs text-gray-500 mt-0.5">{item.selectedColor} • Size: {item.selectedSize}</p>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Qty: {item.quantity}</span>
                            <span className="font-bold text-gray-900">{formatPrice(item.productPrice * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Total Amount</span>
                  <span className="text-xl font-black text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Ordered on {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-[420px] bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center h-[calc(100vh-220px)] sticky top-24">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-medium text-gray-500">Select an order</p>
              <p className="text-sm mt-1">Click on any order from the table to view its details and manage its status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
