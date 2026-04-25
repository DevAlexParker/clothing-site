
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { sendVerificationCodeEmail } from './lib/mail.js';

dotenv.config({ path: '.env' });

async function fixUser() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const email = 'chethanac488@gmail.com';
  const code = '789456'; // New code
  const codeHash = await bcrypt.hash(code, 10);
  
  const user = await User.findOneAndUpdate(
    { email },
    { 
      emailVerificationCodeHash: codeHash,
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000)
    },
    { new: true }
  );

  if (user) {
    console.log('User updated. Sending email...');
    try {
      await sendVerificationCodeEmail(email, code, user.name);
      console.log(`Success! Code ${code} sent to ${email}`);
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  } else {
    console.log('User not found.');
  }
  await mongoose.disconnect();
}

fixUser();
