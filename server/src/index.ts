import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import authRoutes from './routes/auth.js';

import analyticsRoutes from './routes/analytics.js';



const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// The webhook route needs a raw body for Stripe signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/analytics', analyticsRoutes);



// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 AURA API Server running on http://localhost:${PORT}`);
  });
}

start();
