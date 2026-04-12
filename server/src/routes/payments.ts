import { Router } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Order } from '../models/Order.js';

dotenv.config();

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// POST /api/payments/create-intent
router.post('/create-intent', async (req, res) => {
  try {
    const { items, customerInfo } = req.body;

    // In a real application, you would calculate the total on the server
    // by fetching current prices from your database to prevent manipulation.
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.productPrice * item.quantity), 0);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Stripe expects amounts in cents
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
      process.env.STRIPE_WEBHOOK_SECRET || ''
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
