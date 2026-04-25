import { useState, useEffect } from 'react';
import { fetchSalesAnalytics, formatPrice } from '../lib/api';
import type { SalesAnalytics } from '../lib/api';

export default function SalesView() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await fetchSalesAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-32 text-gray-400">
        <p className="text-lg font-medium">Unable to load analytics.</p>
        <button onClick={loadAnalytics} className="mt-4 text-sm text-blue-500 hover:underline">Retry</button>
      </div>
    );
  }

  const { summary, monthly, dailySales, topProducts } = analytics;
  const normalizedDailySales = dailySales.map((point) => ({
    day: Number(point.day) || 0,
    revenue: Number(point.revenue) || 0,
    orders: Number(point.orders) || 0,
  }));

  // Find max values for chart scaling
  const maxDailyRevenue = Math.max(...normalizedDailySales.map((d) => d.revenue), 1);
  const maxMonthlyRevenue = Math.max(...monthly.map(m => m.revenue), 1);
  const today = new Date().getDate();

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Total Revenue</p>
          <p className="text-3xl font-black">{formatPrice(summary.totalRevenue)}</p>
          <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${summary.growthPercent >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
            {summary.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(summary.growthPercent)}% vs last month
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Total Orders</p>
          <p className="text-3xl font-black text-gray-900">{summary.totalOrders}</p>
          <p className="text-xs text-gray-400 mt-2">{monthly[0]?.orderCount || 0} this month</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Items Sold</p>
          <p className="text-3xl font-black text-gray-900">{summary.totalItemsSold}</p>
          <p className="text-xs text-gray-400 mt-2">{monthly[0]?.itemsSold || 0} this month</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Avg Order Value</p>
          <p className="text-3xl font-black text-gray-900">{formatPrice(summary.avgOrderValue)}</p>
          <p className="text-xs text-gray-400 mt-2">per order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Daily Revenue Chart (current month) ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Daily Revenue</h3>
              <p className="text-xs text-gray-400 mt-0.5">{monthly[0]?.month || 'Current Month'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-gray-900">{formatPrice(monthly[0]?.revenue || 0)}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">This Month</p>
            </div>
          </div>

          {/* Bar Chart Container - Scrollable on mobile */}
          <div className="overflow-x-auto pb-4 -mx-1 px-1">
            <div className="min-w-[500px] lg:min-w-0">
              <div className="flex items-end gap-[2px] h-48 relative">
                {normalizedDailySales.map((point) => {
                  const height = maxDailyRevenue > 0 ? (point.revenue / maxDailyRevenue) * 100 : 0;
                  const isToday = point.day === today;
                  const isFuture = point.day > today;
                  return (
                    <div key={point.day} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20">
                        <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                          <p>Day {point.day}</p>
                          <p className="text-emerald-300">{formatPrice(point.revenue)}</p>
                          <p className="text-gray-400">{point.orders} orders</p>
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                      </div>
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 cursor-pointer ${
                          isFuture
                            ? 'bg-gray-50'
                            : isToday
                            ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm shadow-blue-200'
                            : height > 0
                            ? 'bg-gradient-to-t from-gray-800 to-gray-600 hover:from-blue-600 hover:to-blue-400'
                            : 'bg-gray-100'
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex gap-[2px] mt-2">
                {normalizedDailySales.map((point) => (
                  <div key={point.day} className="flex-1 text-center">
                    {(point.day === 1 || point.day === 10 || point.day === 20 || point.day === normalizedDailySales.length) && (
                      <span className="text-[9px] text-gray-400 font-bold">{point.day}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Monthly Comparison ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Monthly Comparison</h3>
          <p className="text-xs text-gray-400 mb-6">Last 4 months side by side</p>

          <div className="space-y-4">
            {[...monthly].reverse().map((m) => {
              const widthPercent = maxMonthlyRevenue > 0 ? (m.revenue / maxMonthlyRevenue) * 100 : 0;
              const isCurrent = m.monthIndex === 0;
              return (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">{m.month}</span>
                      {isCurrent && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NOW</span>}
                    </div>
                    <span className="text-xs font-bold text-gray-900">{formatPrice(m.revenue)}</span>
                  </div>
                  <div className="w-full h-7 bg-gray-50 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full rounded-lg transition-all duration-700 flex items-center px-3 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                          : 'bg-gradient-to-r from-gray-700 to-gray-500'
                      }`}
                      style={{ width: `${Math.max(widthPercent, 3)}%` }}
                    >
                      {widthPercent > 30 && (
                        <span className="text-[9px] font-bold text-white/80">{m.orderCount} orders</span>
                      )}
                    </div>
                    {widthPercent <= 30 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">{m.orderCount} orders</span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1.5">
                    <span className="text-[10px] text-gray-400">{m.itemsSold} items</span>
                    <span className="text-[10px] text-gray-400">Avg: {formatPrice(m.avgOrderValue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top Products ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Top Selling Products</h3>
        <p className="text-xs text-gray-400 mb-6">Products generating the most revenue</p>

        {topProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No sales data yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topProducts.map((product, idx) => {
              const maxRev = topProducts[0]?.revenue || 1;
              const barWidth = (product.revenue / maxRev) * 100;
              return (
                <div key={product.id} className="flex flex-col items-center text-center p-4 rounded-xl bg-gray-50 border border-gray-100 relative overflow-hidden group hover:border-gray-200 transition-all">
                  {/* Rank badge */}
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="w-14 h-18 rounded-lg overflow-hidden bg-gray-200 mb-3 shadow-sm">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-2 min-h-[32px]">{product.name}</h4>
                  <p className="text-sm font-black text-gray-900">{formatPrice(product.revenue)}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{product.unitsSold} units sold</p>
                  
                  {/* Mini bar */}
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Metrics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {monthly.map((m) => (
          <div key={m.month} className={`rounded-2xl p-5 border ${m.monthIndex === 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'}`}>
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">{m.month}</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Revenue</span>
                <span className="text-xs font-bold text-gray-900">{formatPrice(m.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Orders</span>
                <span className="text-xs font-bold text-gray-900">{m.orderCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Items</span>
                <span className="text-xs font-bold text-gray-900">{m.itemsSold}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Avg Order</span>
                <span className="text-xs font-bold text-gray-900">{formatPrice(m.avgOrderValue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
