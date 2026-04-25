
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config({ path: '.env' });

async function verifyUser() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const email = 'chethanac488@gmail.com';
  const result = await User.updateOne(
    { email: email },
    { $set: { isVerified: true, emailVerificationCodeHash: null, emailVerificationExpires: null } }
  );
  console.log(`Verification update for ${email}:`, result);
  await mongoose.disconnect();
}

verifyUser();
