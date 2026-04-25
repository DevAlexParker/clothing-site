import { Router } from 'express';
import { z } from 'zod';
import { Order, type IOrder } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { authenticate, authorize, optionalAuthenticate, type AuthRequest } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import { Request } from 'express';

const router = Router();
const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

const logAudit = async (userId: any, action: string, targetType: string, req: Request, targetId: string, metadata: any = {}) => {
  try {
    await AuditLog.create({
      userId, action, targetType, targetId,
      ip: req.ip, userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (err) { console.error('Audit log failed:', err); }
};

const createOrderSchema = z.object({
  orderId: z.string().trim().min(3).max(64),
  customerInfo: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(255),
    addressLine1: z.string().trim().min(5).max(255),
    city: z.string().trim().min(2).max(120),
    postalCode: z.string().trim().min(3).max(20),
    phone: z.string().trim().min(5).max(20).optional(),
    smsOptIn: z.boolean().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.number().int().min(1).max(20),
      selectedSize: z.string().trim().min(1).max(20),
      selectedColor: z.string().trim().min(1).max(40),
    })
  ).min(1).max(50),
  paymentMethod: z.enum(['stripe', 'cod']).default('stripe'),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
  paymentIntentId: z.string().trim().max(255).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  message: z.string().trim().max(500).optional(),
  location: z.string().trim().max(100).optional(),
  estimatedDelivery: z.string().datetime().optional(),
});

const trackingSchema = z.object({
  status: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(500),
  location: z.string().trim().max(100).optional(),
});

// POST /api/orders — Create a new order (used by Store)
router.post('/', optionalAuthenticate, async (req: AuthRequest, res) => {
  try {
    const { orderId, customerInfo, items, paymentMethod, paymentStatus, paymentIntentId } = createOrderSchema.parse(req.body);

    if (req.user && typeof req.user.save === 'function') {
      req.user.phone = customerInfo.phone || req.user.phone;
      if (customerInfo.smsOptIn !== undefined) {
        req.user.smsOptIn = customerInfo.smsOptIn;
      }
      await req.user.save();
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      return {
        productId: item.productId,
        productName: product.name,
        productImage: product.images?.[0] ?? '',
        productPrice: product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      };
    });

    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

    const order = new Order({
      orderId,
      userId: req.user?._id,
      status: 'Pending',
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      paymentIntentId,
      customerInfo,
      items: normalizedItems,
      totalAmount,
      trackingHistory: [{
        status: 'Pending',
        message: 'Order received and is awaiting processing.',
        timestamp: new Date()
      }]
    });

    await order.save();

    try {
      const { sendOrderInvoiceEmail } = await import('../lib/mail.js');
      const o = order.toJSON() as Record<string, unknown>;
      await sendOrderInvoiceEmail({
        orderId: String(o.orderId ?? orderId),
        createdAt: o.createdAt as Date | string | undefined,
        customerInfo: o.customerInfo as {
          fullName: string;
          email: string;
          addressLine1: string;
          city: string;
          postalCode: string;
        },
        items: o.items as {
          productName: string;
          quantity: number;
          productPrice: number;
          selectedSize: string;
          selectedColor: string;
        }[],
        totalAmount: Number(o.totalAmount),
        paymentMethod: String(o.paymentMethod),
        paymentStatus: String(o.paymentStatus),
        status: String(o.status),
      });
    } catch (err) {
      console.error('Order invoice email failed:', err);
    }

    // Decrement stock for each ordered item
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    if (error instanceof Error && (error.message.startsWith('Product not found') || error.message.startsWith('Insufficient stock'))) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/user — Get order history for current user
router.get('/user', authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
});

// POST /api/orders/:id/cancel — Cancel order (User initiated)
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Security: Ensure user owns the order
    if (String(order.userId) !== String(req.user._id)) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // Policy: Can only cancel if Pending or Processing
    if (!['Pending', 'Processing'].includes(order.status)) {
      res.status(400).json({ error: `Order cannot be cancelled. Current status is ${order.status}` });
      return;
    }

    const previousStatus = order.status;
    order.status = 'Cancelled';
    order.cancellationReason = req.body.reason || 'Order cancelled by customer.';
    order.trackingHistory.push({
      status: 'Cancelled',
      message: order.cancellationReason || 'Order cancelled by customer.',
      location: 'System',
      timestamp: new Date()
    });

    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    await logAudit(req.user._id, 'ORDER_CANCEL_USER', 'ORDER', req, order.orderId, { previousStatus, reason: req.body.reason });

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// GET /api/orders — Get all orders (used by Admin)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const showDeleted = req.query.deleted === 'true';
    const orders = await Order.find({ isDeleted: showDeleted }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (req.user.role !== 'admin' && String(order.userId) !== String(req.user._id)) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status — Update order status (used by Admin)
router.patch('/:id/status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, message, location: updateLocation, estimatedDelivery } = statusUpdateSchema.parse(req.body);

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;
    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }
    
    order.trackingHistory.push({
      status,
      message: message || `Order status updated to ${status}`,
      location: updateLocation || 'Warehouse',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// POST /api/orders/:id/tracking — Add a tracking event (predefined or custom process step)
router.post('/:id/tracking', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { status, message } = trackingSchema.parse(req.body);

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // If the tracking status maps to a top-level status, update it
    const mainStatuses = ORDER_STATUSES as readonly string[];
    if (mainStatuses.includes(status)) {
      order.status = status as IOrder['status'];
    }

    order.trackingHistory.push({
      status,
      message,
      location: req.body.location || 'In Transit',
      timestamp: new Date()
    });

    await order.save();
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Error adding tracking event:', error);
    res.status(500).json({ error: 'Failed to add tracking event' });
  }
});

// PATCH /api/orders/:id/soft-delete — Move order to recycle bin
router.patch('/:id/soft-delete', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.isDeleted = true;
    order.deletedAt = new Date();
    await order.save();

    await logAudit((req as AuthRequest).user._id, 'ORDER_SOFT_DELETE', 'ORDER', req, order.orderId);

    res.json({ message: 'Order moved to recycle bin', order });
  } catch (error) {
    console.error('Error soft deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// PATCH /api/orders/:id/restore — Restore order from recycle bin
router.patch('/:id/restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.isDeleted = false;
    order.deletedAt = undefined;
    await order.save();

    await logAudit((req as AuthRequest).user._id, 'ORDER_RESTORE', 'ORDER', req, order.orderId);

    res.json({ message: 'Order restored successfully', order });
  } catch (error) {
    console.error('Error restoring order:', error);
    res.status(500).json({ error: 'Failed to restore order' });
  }
});

// DELETE /api/orders/:id — Permanently delete an order
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    await logAudit((req as AuthRequest).user._id, 'ORDER_PERMANENT_DELETE', 'ORDER', req, String(req.params.id));

    res.json({ message: 'Order permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting order:', error);
    res.status(500).json({ error: 'Failed to permanently delete order' });
  }
});

// PATCH /api/orders/bulk-soft-delete — Soft delete multiple orders
router.patch('/bulk-soft-delete', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds)) {
      res.status(400).json({ error: 'orderIds must be an array' });
      return;
    }

    await Order.updateMany(
      { orderId: { $in: orderIds } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    await logAudit((req as AuthRequest).user._id, 'ORDER_BULK_SOFT_DELETE', 'ORDER', req, orderIds.join(', '));

    res.json({ message: `${orderIds.length} orders moved to recycle bin` });
  } catch (error) {
    console.error('Error bulk soft deleting orders:', error);
    res.status(500).json({ error: 'Failed to bulk delete orders' });
  }
});

// PATCH /api/orders/bulk-restore — Restore multiple orders
router.patch('/bulk-restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds)) {
      res.status(400).json({ error: 'orderIds must be an array' });
      return;
    }

    await Order.updateMany(
      { orderId: { $in: orderIds } },
      { $set: { isDeleted: false }, $unset: { deletedAt: "" } }
    );

    await logAudit((req as AuthRequest).user._id, 'ORDER_BULK_RESTORE', 'ORDER', req, orderIds.join(', '));

    res.json({ message: `${orderIds.length} orders restored successfully` });
  } catch (error) {
    console.error('Error bulk restoring orders:', error);
    res.status(500).json({ error: 'Failed to bulk restore orders' });
  }
});

// DELETE /api/orders/bulk-delete — Permanently delete multiple orders
router.delete('/bulk-delete', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { orderIds } = req.body;
    if (!Array.isArray(orderIds)) {
      res.status(400).json({ error: 'orderIds must be an array' });
      return;
    }

    await Order.deleteMany({ orderId: { $in: orderIds } });

    await logAudit((req as AuthRequest).user._id, 'ORDER_BULK_PERMANENT_DELETE', 'ORDER', req, orderIds.join(', '));

    res.json({ message: `${orderIds.length} orders permanently deleted` });
  } catch (error) {
    console.error('Error bulk deleting orders:', error);
    res.status(500).json({ error: 'Failed to bulk delete orders' });
  }
});

export default router;
