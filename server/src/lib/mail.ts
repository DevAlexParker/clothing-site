/**
 * Outgoing mail: the recipient (`to`) is always the real user — from signup, checkout, or DB on reset.
 * What you put in server/.env is only the *sending* identity (Resend API key or SMTP). Without that,
 * we fall back to Ethereal (fake inbox + preview URL in the terminal).
 */
import nodemailer from 'nodemailer';

export interface PlainOrderForEmail {
  orderId: string;
  createdAt?: string | Date;
  customerInfo: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    postalCode: string;
  };
  items: {
    productName: string;
    quantity: number;
    productPrice: number;
    selectedSize: string;
    selectedColor: string;
  }[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

let etherealAccount: { user: string; pass: string } | null = null;

async function getEtherealAccount() {
  if (!etherealAccount) {
    const created = await nodemailer.createTestAccount();
    etherealAccount = { user: created.user, pass: created.pass };
    console.log(
      '\n📧 [Ethereal] Dev inbox only — no real delivery. For real email add to server/.env:\n' +
        '   RESEND_API_KEY=re_...   OR   SMTP_HOST + SMTP_USER + SMTP_PASS\n'
    );
  }
  return etherealAccount;
}

type MailMode = 'smtp' | 'ethereal';

async function getTransport(): Promise<{ transport: nodemailer.Transporter; mode: MailMode }> {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (host && user && pass) {
    return {
      transport: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }),
      mode: 'smtp',
    };
  }

  const eth = await getEtherealAccount();
  return {
    transport: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: eth,
    }),
    mode: 'ethereal',
  };
}

let cachedTransport: Awaited<ReturnType<typeof getTransport>> | null = null;

async function getMailer() {
  if (!cachedTransport) {
    cachedTransport = await getTransport();
  }
  return cachedTransport;
}

async function sendViaResend(apiKey: string, options: { to: string; subject: string; text: string; html: string }) {
  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    'AURA Clothing <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join('; ') : data.message;
    console.error('Resend error:', res.status, data);
    throw new Error(msg || `Resend failed (${res.status})`);
  }
  console.log(`📧 Email sent (Resend) → ${options.to} — ${options.subject}`);
}

export async function sendMailMessage(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    await sendViaResend(resendKey, options);
    return;
  }

  const { transport, mode } = await getMailer();
  const from =
    process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || '"AURA Clothing" <noreply@aura.local>';

  console.log(`📧 Attempting to send email via ${mode} to: ${options.to}`);
  const info = await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  if (mode === 'ethereal') {
    const preview = nodemailer.getTestMessageUrl(info);
    console.log(`\n📧 [Ethereal] Would deliver to: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    if (preview) {
      console.log(`   Preview (not a real inbox): ${preview}`);
    }
  } else {
    console.log(`📧 Email sent (SMTP) → ${options.to} (${options.subject})`);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const text = `Reset your AURA password by opening this link (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>Reset your AURA password by clicking the link below (valid for 1 hour).</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`;
  await sendMailMessage({
    to,
    subject: 'Reset your AURA password',
    text,
    html,
  });
}

export async function sendVerificationCodeEmail(to: string, code: string, name: string): Promise<void> {
  const text = `Hi ${name},\n\nYour AURA verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not create an account, ignore this email.`;
  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your AURA verification code is:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:0.3em;font-family:monospace;">${escapeHtml(code)}</p>
    <p>This code expires in 15 minutes.</p>
    <p style="color:#666;font-size:12px;">If you did not create an account, you can ignore this email.</p>
  `;
  await sendMailMessage({
    to,
    subject: 'Your AURA verification code',
    text,
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMoney(n: number) {
  return `Rs. ${Math.round(n).toLocaleString('en-LK')}`;
}

export async function sendOrderInvoiceEmail(order: PlainOrderForEmail): Promise<void> {
  const to = order.customerInfo.email;
  const date =
    order.createdAt instanceof Date
      ? order.createdAt.toLocaleString('en-LK')
      : order.createdAt
        ? new Date(order.createdAt).toLocaleString('en-LK')
        : new Date().toLocaleString('en-LK');

  const rows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.productName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.selectedColor)} / ${escapeHtml(item.selectedSize)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(item.productPrice * item.quantity)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin-bottom:4px;">AURA — Order invoice</h1>
      <p style="color:#666;margin-top:0;">Thank you for your order.</p>
      <table style="width:100%;margin:16px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 0;"><strong>Order #</strong></td><td>${escapeHtml(order.orderId)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Date</strong></td><td>${escapeHtml(date)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Status</strong></td><td>${escapeHtml(order.status)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Payment</strong></td><td>${escapeHtml(order.paymentMethod)} (${escapeHtml(order.paymentStatus)})</td></tr>
      </table>
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Ship to</h2>
      <p style="line-height:1.6;">
        ${escapeHtml(order.customerInfo.fullName)}<br/>
        ${escapeHtml(order.customerInfo.addressLine1)}<br/>
        ${escapeHtml(order.customerInfo.city)}, ${escapeHtml(order.customerInfo.postalCode)}<br/>
        ${escapeHtml(order.customerInfo.email)}
      </p>
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Items</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th align="left" style="padding:8px;">Product</th>
            <th align="left" style="padding:8px;">Color / Size</th>
            <th style="padding:8px;">Qty</th>
            <th align="right" style="padding:8px;">Line total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" align="right" style="padding:12px 8px;font-weight:bold;">Total</td>
            <td align="right" style="padding:12px 8px;font-weight:bold;">${formatMoney(order.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color:#888;font-size:12px;margin-top:24px;">Questions? Reply to this email or contact hello@auraclothing.lk</p>
    </body></html>
  `;

  const textLines = [
    `AURA — Invoice for order ${order.orderId}`,
    `Date: ${date}`,
    `Total: ${formatMoney(order.totalAmount)}`,
    '',
    'Items:',
    ...order.items.map(
      (i) =>
        `- ${i.productName} x${i.quantity} (${i.selectedColor}, ${i.selectedSize}) — ${formatMoney(i.productPrice * i.quantity)}`
    ),
    '',
    `Ship to: ${order.customerInfo.fullName}, ${order.customerInfo.addressLine1}, ${order.customerInfo.city}`,
  ];

  await sendMailMessage({
    to,
    subject: `Your AURA invoice — Order ${order.orderId}`,
    text: textLines.join('\n'),
    html,
  });
}
