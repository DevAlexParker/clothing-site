import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'etherealpass',
      },
      // Using generic values above as fallback, in a real app would strictly rely on env
    });

    const info = await transporter.sendMail({
      from: '"AURA Admin" <no-reply@aura.com>',
      to,
      subject,
      text,
    });

    console.log('Email sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending email', error);
  }
};
