import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura_clothing';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const legacy = await User.updateMany(
      {
        $or: [{ emailVerificationCodeHash: { $exists: false } }, { emailVerificationCodeHash: null }],
      },
      { $set: { isVerified: true } }
    );
    if (legacy.modifiedCount > 0) {
      console.log(`✅ Marked ${legacy.modifiedCount} legacy account(s) as email-verified`);
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}
