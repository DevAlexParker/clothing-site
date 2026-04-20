import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '../models/User.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const passwordPolicy = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  .max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: passwordPolicy,
  phone: z.string().trim().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(30).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'No updates provided',
});

const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(255),
});

const getAdminCredentials = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!username || !password) {
    return null;
  }
  return { username, password };
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      emailVerificationToken,
    });

    await user.save();

    await sendEmail(
      normalizedEmail,
      'AURA Clothing - Verify your email',
      `Your verification token is: ${emailVerificationToken}\nUse the verification endpoint (e.g., /api/auth/verify-email) to activate your account.`
    );

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token, message: 'Please verify your email.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors[0].message });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ error: 'Invalid token' });

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ error: 'Please verify your email first by entering your token.' });
      return;
    }

    if (user.isTwoFactorEnabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/login/2fa
router.post('/login/2fa', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user || (!user.isTwoFactorEnabled && !user.twoFactorEmailCode)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let verified = false;

    // Check TOTP first
    if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: otp,
        window: 1
      });
    }

    // Check Email OTP
    if (!verified && user.twoFactorEmailCode && user.twoFactorEmailCodeExpires && user.twoFactorEmailCodeExpires > new Date()) {
      if (user.twoFactorEmailCode === otp) {
        verified = true;
        user.twoFactorEmailCode = undefined;
        user.twoFactorEmailCodeExpires = undefined;
        await user.save();
      }
    }

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/2fa/email/send
router.post('/2fa/email/send', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorEmailCode = code;
    user.twoFactorEmailCodeExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
    await user.save();

    await sendEmail(
      user.email,
      'AURA Clothing - Your Login Code',
      `Your two-factor authentication code is: ${code}\nThis code will expire in 10 minutes.`
    );

    res.json({ message: '2FA code sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);

    const dbAdmin = await User.findOne({ email: username.toLowerCase(), role: 'admin' });
    if (dbAdmin) {
      const isMatch = await bcrypt.compare(password, dbAdmin.password);
      if (isMatch) {
        if (!dbAdmin.isVerified) {
           return res.status(403).json({ error: 'Please verify your email first.' });
        }
        if (dbAdmin.isTwoFactorEnabled) {
           return res.json({ requires2FA: true, userId: dbAdmin._id });
        }
        const token = jwt.sign({ id: dbAdmin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token, user: dbAdmin });
      }
    }

    const credentials = getAdminCredentials();
    if (!credentials) {
      res.status(500).json({ error: 'Admin DB or Env is not configured properly' });
      return;
    }

    if (username.trim() !== credentials.username || password !== credentials.password) {
      res.status(401).json({ error: 'Invalid admin credentials' });
      return;
    }

    const token = jwt.sign(
      { role: 'admin', authType: 'env_admin', username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        name: username,
        role: 'admin',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to login as admin' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'User with this email does not exist' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendEmail(
      user.email,
      'AURA Clothing - Password Reset',
      `Your password reset token is: ${resetToken}\nSend a POST request to /api/auth/reset-password with this token and your newPassword.`
    );

    res.json({ message: 'Password reset token sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Provide token and newPassword' });

    passwordPolicy.parse(newPassword);

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password successfully reset' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors[0].message });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/2fa/generate
router.get('/2fa/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `AURA Clothing (${req.user.email})` });
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    qrcode.toDataURL(secret.otpauth_url || '', (err, data_url) => {
      if (err) return res.status(500).json({ error: 'Error generating QR code' });
      res.json({ secret: secret.base32, qrCode: data_url });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/2fa/enable
router.post('/2fa/enable', authenticate, async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    const user = req.user;
    if (!user.twoFactorSecret) return res.status(400).json({ error: 'Generate 2FA secret first' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      res.json({ message: '2FA effectively enabled' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  res.json(req.user);
});

// PATCH /api/auth/update
router.patch('/update', authenticate, async (req: AuthRequest, res) => {
  try {
    const payload = updateSchema.parse(req.body);
    if (payload.email) {
      payload.email = payload.email.toLowerCase();
    }

    Object.entries(payload).forEach(([key, value]) => {
      req.user[key] = value;
    });
    await req.user.save();
    res.json(req.user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
