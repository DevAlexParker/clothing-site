import { Router } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

const router = Router();

// GET /api/analytics/sales — Get sales analytics for dashboard
router.get('/sales', async (_req, res) => {
  try {
    const now = new Date();
    const toSafeNumber = (value: unknown) => {
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    // Helper to get start of month
    const getMonthStart = (monthsAgo: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      return d;
    };
    const getMonthEnd = (monthsAgo: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
      return d;
    };

    // Get last 4 months of data (current + 3 previous)
    const monthlyData = [];
    for (let i = 0; i < 4; i++) {
      const start = getMonthStart(i);
      const end = getMonthEnd(i);
      const monthName = start.toLocaleString('default', { month: 'short', year: 'numeric' });

      const orders = await Order.find({
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'Cancelled' }
      });

      const revenue = orders.reduce((sum, o) => sum + toSafeNumber(o.totalAmount), 0);
      const orderCount = orders.length;
      const itemsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0), 0);

      monthlyData.push({
        month: monthName,
        monthIndex: i,
        revenue,
        orderCount,
        itemsSold,
        avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      });
    }

    // Daily sales for current month (for charts)
    const currentMonthStart = getMonthStart(0);
    const dailyOrders = await Order.find({
      createdAt: { $gte: currentMonthStart },
      status: { $ne: 'Cancelled' }
    });

    const dailySales: Record<string, { revenue: number; orders: number }> = {};
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${d}`;
      dailySales[dateKey] = { revenue: 0, orders: 0 };
    }

    dailyOrders.forEach(order => {
      const day = new Date(order.createdAt).getDate().toString();
      if (dailySales[day]) {
        dailySales[day].revenue += toSafeNumber(order.totalAmount);
        dailySales[day].orders += 1;
      }
    });

    // Top products by revenue
    const allOrders = await Order.find({ status: { $ne: 'Cancelled' } });
    const productRevenue: Record<string, { name: string; revenue: number; unitsSold: number; image: string }> = {};
    
    allOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productRevenue[item.productId]) {
          productRevenue[item.productId] = { name: item.productName, revenue: 0, unitsSold: 0, image: item.productImage };
        }
        productRevenue[item.productId].revenue += toSafeNumber(item.productPrice) * toSafeNumber(item.quantity);
        productRevenue[item.productId].unitsSold += toSafeNumber(item.quantity);
      });
    });

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // Summary
    const totalRevenue = allOrders.reduce((sum, o) => sum + toSafeNumber(o.totalAmount), 0);
    const totalOrders = allOrders.length;
    const totalItemsSold = allOrders.reduce((sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0), 0);

    // Revenue growth (current vs previous month)
    const currentMonthRevenue = monthlyData[0]?.revenue || 0;
    const previousMonthRevenue = monthlyData[1]?.revenue || 0;
    const growthPercent = previousMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : currentMonthRevenue > 0 ? 100 : 0;

    res.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalItemsSold,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        growthPercent,
      },
      monthly: monthlyData,
      dailySales: Object.entries(dailySales).map(([day, data]) => ({
        day: parseInt(day, 10),
        revenue: toSafeNumber(data.revenue),
        orders: toSafeNumber(data.orders),
      })),
      topProducts,
    });
  } catch (error) {
    console.error('Error computing sales analytics:', error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
