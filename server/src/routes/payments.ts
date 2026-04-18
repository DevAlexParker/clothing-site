import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

const router = Router();
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required');
}

const stripe = new Stripe(STRIPE_KEY);

const paymentIntentSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.number().int().min(1).max(20),
    })
  ).min(1).max(50),
  customerInfo: z.object({
    email: z.string().trim().email().max(255),
    fullName: z.string().trim().min(2).max(120),
  }),
});

// POST /api/payments/create-intent
router.post('/create-intent', async (req, res) => {
  try {
    const { items, customerInfo } = paymentIntentSchema.parse(req.body);

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const totalAmount = items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      return sum + product.price * item.quantity;
    }, 0);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents
      currency: 'lkr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerInfo.email,
        customerName: customerInfo.fullName,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    if (error instanceof Error && error.message.startsWith('Product not found')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error creating PaymentIntent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/payments/webhook
// Note: This requires the raw body, which we'll handle in index.ts
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      
      // Update order in database
      await Order.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { paymentStatus: 'paid', status: 'Processing' }
      );
      break;
    
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${failedIntent.amount} failed.`);
      
      await Order.findOneAndUpdate(
        { paymentIntentId: failedIntent.id },
        { paymentStatus: 'failed' }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
