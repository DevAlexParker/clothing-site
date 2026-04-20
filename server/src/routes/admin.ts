import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

const router = Router();

router.get('/notifications', authenticate, authorize(['admin']), async (_req, res) => {
  try {
    const [products, pendingOrders] = await Promise.all([
      Product.find().sort({ updatedAt: -1 }).lean(),
      Order.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    const items: {
      id: string;
      type: 'low_stock' | 'out_of_stock' | 'new_order';
      title: string;
      message: string;
      createdAt: string;
    }[] = [];

    for (const p of products) {
      const pid = String(p._id);
      const pDoc = p as { updatedAt?: Date; createdAt?: Date };
      const ts = (pDoc.updatedAt ?? pDoc.createdAt ?? new Date()).toISOString();
      const stock = typeof p.stock === 'number' ? p.stock : 0;

      if (stock === 0) {
        items.push({
          id: `oos-${pid}`,
          type: 'out_of_stock',
          title: 'Out of stock',
          message: `${p.name} is out of stock.`,
          createdAt: ts,
        });
      } else if (stock > 0 && stock <= 3) {
        items.push({
          id: `low-${pid}`,
          type: 'low_stock',
          title: 'Low stock',
          message: `${p.name} has only ${stock} left in inventory.`,
          createdAt: ts,
        });
      }
    }

    for (const o of pendingOrders) {
      const created =
        o.createdAt instanceof Date
          ? o.createdAt.toISOString()
          : new Date(o.createdAt ?? Date.now()).toISOString();
      items.push({
        id: `order-${o.orderId}`,
        type: 'new_order',
        title: 'New order',
        message: `Order ${o.orderId} — ${o.customerInfo.fullName} · Rs. ${Math.round(o.totalAmount).toLocaleString('en-LK')}`,
        createdAt: created,
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ items: items.slice(0, 50) });
  } catch (error) {
    console.error('Admin notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

export default router;
