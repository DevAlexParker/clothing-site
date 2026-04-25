
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config({ path: '.env' });

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ email: 'chethanac488@gmail.com' }).select('+emailVerificationCodeHash +emailVerificationExpires');
  console.log('User status:', {
    _id: user?._id,
    found: !!user,
    isVerified: user?.isVerified,
    hasVerificationCode: !!user?.emailVerificationCodeHash,
    expires: user?.emailVerificationExpires
  });
  await mongoose.disconnect();
}

checkUser();
