import { useState, useEffect, useCallback } from 'react';
import { fetchOrders, updateOrderStatus, addTrackingEvent, formatPrice } from '../lib/api';
import type { Order, OrderStatus } from '../lib/api';

// ── Predefined Process Steps (order fulfillment workflow) ──────────────────
const PREDEFINED_PROCESSES: { status: string; label: string; message: string; icon: string }[] = [
  { status: 'Processing',       label: 'Order Confirmed',          message: 'Order has been confirmed and payment verified.',               icon: '✓' },
  { status: 'Processing',       label: 'Picking Items',            message: 'Items are being picked from the warehouse.',                   icon: '📋' },
  { status: 'Processing',       label: 'Quality Check',            message: 'Items passed quality inspection.',                             icon: '🔍' },
  { status: 'Processing',       label: 'Packing',                  message: 'Order is being securely packed for shipment.',                 icon: '📦' },
  { status: 'Processing',       label: 'Label Printed',            message: 'Shipping label has been generated and attached.',              icon: '🏷️' },
  { status: 'Shipped',          label: 'Handed to Carrier',        message: 'Package has been handed over to the shipping carrier.',        icon: '🚚' },
  { status: 'Shipped',          label: 'In Transit',               message: 'Package is in transit to the delivery address.',               icon: '✈️' },
  { status: 'Shipped',          label: 'Out for Delivery',         message: 'Package is out for delivery — arriving today.',                icon: '🛵' },
  { status: 'Delivered',        label: 'Delivered',                message: 'Package has been successfully delivered to the customer.',      icon: '🎉' },
];

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'All'>('All');

  // Modal for adding process step
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processMode, setProcessMode] = useState<'predefined' | 'custom'>('predefined');
  const [selectedProcessIdx, setSelectedProcessIdx] = useState<number | null>(null);
  const [customStatus, setCustomStatus] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
      setLastRefreshed(new Date());
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
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // ── Handle adding a process step ──
  const handleAddProcess = async () => {
    if (!selectedOrder) return;
    setUpdating(true);

    try {
      let status: string;
      let message: string;

      if (processMode === 'predefined' && selectedProcessIdx !== null) {
        const process = PREDEFINED_PROCESSES[selectedProcessIdx];
        status = process.status;
        message = `${process.label} — ${process.message}`;
      } else if (processMode === 'custom' && customStatus.trim() && customMessage.trim()) {
        status = customStatus.trim();
        message = customMessage.trim();
      } else {
        setUpdating(false);
        return;
      }

      const updated = await addTrackingEvent(selectedOrder.orderId, status, message);
      setOrders(prev => prev.map(o => o.orderId === selectedOrder.orderId ? updated : o));
      setSelectedOrder(updated);
      resetModal();
    } catch (error) {
      console.error('Failed to add process step:', error);
      alert('Failed to add process step.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Handle quick status update (top-level) ──
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      const statusMessages: Record<string, string> = {
        'Pending': 'Order has been set back to pending.',
        'Processing': 'Order is now being processed.',
        'Shipped': 'Order has been shipped.',
        'Delivered': 'Order has been delivered successfully.',
        'Cancelled': 'Order has been cancelled.',
      };
      const updated = await updateOrderStatus(orderId, newStatus, statusMessages[newStatus]);
      setOrders(prev => prev.map(o => o.orderId === orderId ? updated : o));
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const resetModal = () => {
    setShowProcessModal(false);
    setProcessMode('predefined');
    setSelectedProcessIdx(null);
    setCustomStatus('');
    setCustomMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Processing': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Shipped': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
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

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'border-amber-400 bg-amber-50';
      case 'Processing': return 'border-blue-400 bg-blue-50';
      case 'Shipped': return 'border-purple-400 bg-purple-50';
      case 'Delivered': return 'border-emerald-400 bg-emerald-50';
      case 'Cancelled': return 'border-red-400 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTimelineDotColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-400 shadow-amber-200';
      case 'Processing': return 'bg-blue-400 shadow-blue-200';
      case 'Shipped': return 'bg-purple-400 shadow-purple-200';
      case 'Delivered': return 'bg-emerald-400 shadow-emerald-200';
      case 'Cancelled': return 'bg-red-400 shadow-red-200';
      default: return 'bg-gray-400 shadow-gray-200';
    }
  };

  const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    processing: orders.filter(o => o.status === 'Processing').length,
    shipped: orders.filter(o => o.status === 'Shipped').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
  };

  // Determine which predefined processes are "already done" for the selected order
  const getCompletedProcesses = (order: Order) => {
    const messages = order.trackingHistory.map(t => t.message);
    return PREDEFINED_PROCESSES.map(p => messages.some(m => m.includes(p.label)));
  };

  // Calculate progress percentage for the pipeline
  const getProgressPercent = (order: Order) => {
    const completed = getCompletedProcesses(order).filter(Boolean).length;
    return Math.round((completed / PREDEFINED_PROCESSES.length) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, color: 'bg-gray-900 text-white', filter: 'All' as const },
          { label: 'Pending', value: stats.pending, color: 'bg-amber-50 text-amber-800 border border-amber-200', filter: 'Pending' as const },
          { label: 'Processing', value: stats.processing, color: 'bg-blue-50 text-blue-800 border border-blue-200', filter: 'Processing' as const },
          { label: 'Shipped', value: stats.shipped, color: 'bg-purple-50 text-purple-800 border border-purple-200', filter: 'Shipped' as const },
          { label: 'Delivered', value: stats.delivered, color: 'bg-emerald-50 text-emerald-800 border border-emerald-200', filter: 'Delivered' as const },
        ].map(stat => (
          <div 
            key={stat.label} 
            onClick={() => setFilterStatus(stat.filter)}
            className={`${stat.color} rounded-xl p-4 flex flex-col cursor-pointer transition-all hover:scale-[1.02] ${filterStatus === stat.filter ? 'ring-2 ring-offset-2 ring-gray-900/20 shadow-lg' : ''}`}
          >
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">{stat.label}</span>
            <span className="text-3xl font-black mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-w-0 w-full">
        {/* Orders Table */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px] w-full min-w-0">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Management</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {filterStatus === 'All' ? 'Click an order to manage its fulfillment process' : `Showing ${filterStatus} orders`}
                {filterStatus !== 'All' && (
                  <button onClick={() => setFilterStatus('All')} className="ml-2 text-blue-500 hover:underline">Show all</button>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadOrders}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                {lastRefreshed.toLocaleTimeString()}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto w-full">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 border-b border-gray-100">Order ID</th>
                    <th className="px-5 py-3 border-b border-gray-100">Date</th>
                    <th className="px-5 py-3 border-b border-gray-100">Customer</th>
                    <th className="px-5 py-3 border-b border-gray-100">Items</th>
                    <th className="px-5 py-3 border-b border-gray-100">Total</th>
                    <th className="px-5 py-3 border-b border-gray-100">Progress</th>
                    <th className="px-5 py-3 border-b border-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-gray-400">No orders found</td>
                    </tr>
                  ) : filteredOrders.map(order => (
                    <tr 
                      key={order.orderId} 
                      onClick={() => setSelectedOrder(order)}
                      className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${selectedOrder?.orderId === order.orderId ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900 font-mono">#{order.orderId}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 font-medium">{order.customerInfo.fullName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{order.items.length} items</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${order.status === 'Cancelled' ? 'bg-red-400' : order.status === 'Delivered' ? 'bg-emerald-400' : 'bg-blue-400'}`}
                              style={{ width: `${getProgressPercent(order)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{getProgressPercent(order)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
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

        {/* Detail Panel */}
        {selectedOrder ? (
          <div className="w-full lg:w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit lg:sticky top-24">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-base font-bold text-gray-900">Order Details</h3>
                <p className="text-sm font-mono text-gray-500 mt-0.5">#{selectedOrder.orderId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">

              {/* ── Quick Status Selector ── */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Order Status</label>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.orderId, e.target.value as OrderStatus)}
                  disabled={updating}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none bg-gray-50 font-medium cursor-pointer"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Processing">🔄 Processing</option>
                  <option value="Shipped">📦 Shipped</option>
                  <option value="Delivered">✅ Delivered</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>

              {/* ── Fulfillment Pipeline ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Fulfillment Pipeline</label>
                  <button 
                    onClick={() => setShowProcessModal(true)}
                    disabled={selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered'}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    ADD STEP
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span>{getProgressPercent(selectedOrder)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${selectedOrder.status === 'Cancelled' ? 'bg-red-400' : selectedOrder.status === 'Delivered' ? 'bg-emerald-400' : 'bg-gradient-to-r from-blue-400 to-purple-400'}`}
                      style={{ width: `${getProgressPercent(selectedOrder)}%` }}
                    />
                  </div>
                </div>

                {/* Pipeline chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_PROCESSES.map((proc, idx) => {
                    const completed = getCompletedProcesses(selectedOrder);
                    const isDone = completed[idx];
                    return (
                      <span 
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          isDone 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}
                      >
                        <span>{proc.icon}</span>
                        {proc.label}
                        {isDone && <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ── Tracking Timeline ── */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Tracking History</label>
                <div className="relative space-y-0">
                  {selectedOrder.trackingHistory.slice().reverse().map((event, idx, arr) => (
                    <div key={idx} className="relative flex gap-3">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 shrink-0 shadow-sm ${idx === 0 ? getTimelineDotColor(event.status) + ' shadow-md' : 'border-gray-200 bg-white'}`} />
                        {idx < arr.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 min-h-[32px]" />}
                      </div>
                      {/* Content */}
                      <div className={`pb-4 flex-1 -mt-0.5 ${idx === 0 ? '' : 'opacity-60'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-1 ${getTimelineColor(event.status)}`}>{event.status}</span>
                            <p className="text-xs text-gray-700 font-medium leading-relaxed">{event.message}</p>
                          </div>
                          <p className="text-[9px] text-gray-300 font-bold whitespace-nowrap mt-0.5">
                            {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Customer Info ── */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Customer</h4>
                <p className="font-semibold text-gray-900">{selectedOrder.customerInfo.fullName}</p>
                <p className="text-gray-600 mt-1">{selectedOrder.customerInfo.email}</p>
                <p className="text-gray-600 mt-2 pt-2 border-t border-gray-200 whitespace-pre-line">
                  {selectedOrder.customerInfo.addressLine1}{'\n'}{selectedOrder.customerInfo.city}, {selectedOrder.customerInfo.postalCode}
                </p>
              </div>

              {/* ── Payment Info ── */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Payment</h4>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Method</p>
                    <p className="text-xs font-bold text-gray-800 uppercase mt-0.5">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                    <p className={`text-xs font-bold uppercase mt-0.5 ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-600' : selectedOrder.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                      {selectedOrder.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Items ── */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-12 h-14 rounded overflow-hidden bg-gray-200 shrink-0">
                        <img src={item.productImage} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 py-0.5">
                        <h5 className="text-xs font-semibold text-gray-900 line-clamp-1">{item.productName}</h5>
                        <p className="text-[10px] text-gray-500">{item.selectedColor} • Size: {item.selectedSize}</p>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-gray-500">Qty: {item.quantity}</span>
                          <span className="font-bold text-gray-900">{formatPrice(item.productPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">Total</span>
                <span className="text-xl font-black text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-[440px] bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 flex-col items-center justify-center text-gray-400 p-8 text-center h-[600px] sticky top-24">
            <svg className="w-12 h-12 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="font-medium">Select an order to manage</p>
            <p className="text-xs text-gray-300 mt-1">View details and update fulfillment status</p>
          </div>
        )}
      </div>

      {/* ── Process Step Modal ── */}
      {showProcessModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col animate-[fadeInUp_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Process Step</h3>
                <p className="text-xs text-gray-500 mt-1">Order #{selectedOrder.orderId}</p>
              </div>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setProcessMode('predefined')}
                className={`flex-1 px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  processMode === 'predefined' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                📋 Predefined Steps
              </button>
              <button
                onClick={() => setProcessMode('custom')}
                className={`flex-1 px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  processMode === 'custom' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ✏️ Custom Step
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              {processMode === 'predefined' ? (
                <div className="space-y-2">
                  {PREDEFINED_PROCESSES.map((proc, idx) => {
                    const alreadyDone = getCompletedProcesses(selectedOrder)[idx];
                    return (
                      <button
                        key={idx}
                        disabled={alreadyDone}
                        onClick={() => setSelectedProcessIdx(idx)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                          alreadyDone
                            ? 'border-emerald-100 bg-emerald-50/50 opacity-50 cursor-not-allowed'
                            : selectedProcessIdx === idx
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg mt-0.5">{proc.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{proc.label}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusColor(proc.status)}`}>{proc.status}</span>
                            {alreadyDone && (
                              <span className="ml-auto text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                Done
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{proc.message}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Status Category</label>
                    <select
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 font-medium"
                    >
                      <option value="">Select a status...</option>
                      <option value="Pending">⏳ Pending</option>
                      <option value="Processing">🔄 Processing</option>
                      <option value="Shipped">📦 Shipped</option>
                      <option value="Delivered">✅ Delivered</option>
                      <option value="Cancelled">❌ Cancelled</option>
                      <option value="Note">📝 Note</option>
                      <option value="Issue">⚠️ Issue</option>
                      <option value="Custom">🏷️ Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Message</label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="E.g., Customer requested gift wrapping. Applied and ready."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-gray-50 resize-none"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                    <strong>Tip:</strong> Choosing a main status (Processing, Shipped, etc.) will also update the order's top-level status. Use "Note", "Issue", or "Custom" for internal annotations.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetModal}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProcess}
                disabled={
                  updating ||
                  (processMode === 'predefined' && selectedProcessIdx === null) ||
                  (processMode === 'custom' && (!customStatus.trim() || !customMessage.trim()))
                }
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-gray-900/10"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add Step
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
