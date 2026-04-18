import nodemailer from 'nodemailer';

const getTransport = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || 'noreply@aura.local';
  const transport = getTransport();

  const text = `Reset your AURA password by opening this link (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;

  if (!transport) {
    console.log('\n[email not configured — reset link for development]\n', resetUrl, '\n');
    return;
  }

  await transport.sendMail({
    from,
    to,
    subject: 'Reset your AURA password',
    text,
    html: `<p>Reset your AURA password by clicking the link below (valid for 1 hour).</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
