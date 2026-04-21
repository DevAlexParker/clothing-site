import { Router } from 'express';
import { z } from 'zod';
import { Order, type IOrder } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { authenticate, authorize, optionalAuthenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

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
});

const trackingSchema = z.object({
  status: z.string().trim().min(1).max(100),
  message: z.string().trim().min(1).max(500),
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
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
});

// GET /api/orders — Get all orders (used by Admin)
router.get('/', authenticate, authorize(['admin']), async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
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
    const { status, message } = statusUpdateSchema.parse(req.body);

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;
    order.trackingHistory.push({
      status,
      message: message || `Order status updated to ${status}`,
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

export default router;
