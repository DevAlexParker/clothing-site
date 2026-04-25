
import dotenv from 'dotenv';
import { sendVerificationCodeEmail } from '../server/src/lib/mail.js';

dotenv.config({ path: 'server/.env' });

async function test() {
  console.log('Testing with current .env settings...');
  try {
    await sendVerificationCodeEmail('chethanac488@gmail.com', '123456', 'Chethana');
    console.log('Done.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
