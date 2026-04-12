import { Router } from 'express';
import { Order } from '../models/Order.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/orders — Create a new order (used by Store)
router.post('/', async (req, res) => {
  try {
    const { 
      orderId, customerInfo, items, totalAmount, 
      paymentMethod, paymentStatus, paymentIntentId, userId 
    } = req.body;

    if (!orderId || !customerInfo || !items || !totalAmount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const order = new Order({
      orderId,
      userId,
      status: 'Pending',
      paymentMethod: paymentMethod || 'stripe',
      paymentStatus: paymentStatus || 'pending',
      paymentIntentId,
      customerInfo,
      items,
      totalAmount,
      trackingHistory: [{
        status: 'Pending',
        message: 'Order received and is awaiting processing.',
        timestamp: new Date()
      }]
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
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
router.get('/', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id — Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// PATCH /api/orders/:id/status — Update order status (used by Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, message } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

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
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;
