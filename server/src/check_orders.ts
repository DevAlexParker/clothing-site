
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from './models/Order.js';

dotenv.config({ path: '.env' });

async function checkOrders() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const email = 'chethanac488@gmail.com';
  const orders = await Order.find({ 'customerInfo.email': email });
  console.log(`Found ${orders.length} orders for ${email}:`);
  orders.forEach(o => {
    console.log(`- OrderId: ${o.orderId}, Status: ${o.status}, UserId: ${o.userId}, Payment: ${o.paymentStatus}`);
  });
  await mongoose.disconnect();
}

checkOrders();
