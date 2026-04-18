import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { sendVerificationCodeEmail } from '../lib/mail.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
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

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(8).max(128),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email().max(255),
  code: z.string().trim().regex(/^\d{6}$/),
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email().max(255),
});

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const code = generateSixDigitCode();
    const codeHash = await bcrypt.hash(code, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      isVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await user.save();

    try {
      await sendVerificationCodeEmail(normalizedEmail, code, name);
    } catch (err) {
      console.error('Verification email failed:', err);
    }

    res.status(201).json({
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Enter the 6-digit code sent to your email to activate your account.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
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
      res.status(403).json({
        error: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: normalizedEmail,
      });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = adminLoginSchema.parse(req.body);
    const credentials = getAdminCredentials();

    if (!credentials) {
      res.status(500).json({ error: 'Admin credentials are not configured on the server' });
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };

    if (!user) {
      res.json(generic);
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const baseUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(
      /\/$/,
      ''
    );
    const resetUrl = `${baseUrl}/?resetPasswordToken=${encodeURIComponent(token)}`;

    try {
      const { sendPasswordResetEmail } = await import('../lib/mail.js');
      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }

    res.json(generic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires +password');

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const tokenJwt = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: tokenJwt,
      user: user.toJSON(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = verifyEmailSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCodeHash +emailVerificationExpires'
    );

    if (!user) {
      res.status(400).json({ error: 'Account not found.' });
      return;
    }

    if (user.isVerified) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user: user.toJSON(), token, alreadyVerified: true });
      return;
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationExpires) {
      res.status(400).json({ error: 'No verification pending. Please sign up again.' });
      return;
    }

    if (user.emailVerificationExpires.getTime() < Date.now()) {
      res.status(400).json({ error: 'Code expired. Use “Resend code”.', code: 'CODE_EXPIRED' });
      return;
    }

    const match = await bcrypt.compare(code, user.emailVerificationCodeHash);
    if (!match) {
      res.status(400).json({ error: 'Invalid code. Try again.' });
      return;
    }

    user.isVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: user.toJSON(), token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const generic = {
      message: 'If an account exists and needs verification, a new code was sent.',
    };

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+emailVerificationCodeHash +emailVerificationExpires'
    );

    if (!user || user.isVerified) {
      res.json(generic);
      return;
    }

    const code = generateSixDigitCode();
    user.emailVerificationCodeHash = await bcrypt.hash(code, 10);
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationCodeEmail(normalizedEmail, code, user.name);
    } catch (err) {
      console.error('Resend verification email failed:', err);
    }

    res.json(generic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

export default router;
