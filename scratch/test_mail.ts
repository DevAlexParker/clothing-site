
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: 'server/.env' });

async function testMail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('Testing SMTP with:', { host, port, user });

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transport.sendMail({
      from: user,
      to: 'chethanac488@gmail.com',
      subject: 'Test Verification Code',
      text: 'Your code is 123456',
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('SMTP Error:', err);
  }
}

testMail();
