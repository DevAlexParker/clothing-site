import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { 
  sendVerificationCodeEmail, 
  sendPasswordResetEmail,
  sendMailMessage 
} from '../lib/mail.js';
import { authRateLimiter, blockDisposableEmail } from '../middleware/security.js';
import { generateTokens, createSession, revokeAllSessions } from '../lib/session.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// Zod Schemas
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

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

const logAudit = async (userId: any, action: string, targetType: string, req: Request, metadata: any = {}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      targetType,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

// POST /api/auth/register
router.post('/register', authRateLimiter, blockDisposableEmail, async (req, res) => {
  try {
    const { name, email, password, phone } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ error: 'Account already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);

    const user = new User({
      name, email: normalizedEmail, password: hashedPassword, phone,
      isVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await user.save();
    await logAudit(user._id, 'USER_REGISTER', 'USER', req);
    
    try {
      await sendVerificationCodeEmail(normalizedEmail, code, name);
    } catch (err) {
      console.error('Email delivery failed:', err);
      // We don't fail registration if email fails, user can resend later
    }

    res.status(201).json({
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ error: 'Account locked. Try again later.' });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) user.lockUntil = new Date(Date.now() + LOCK_TIME);
      await user.save();
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    if (!user.isVerified) return res.status(403).json({ error: 'Verify your email first.', code: 'EMAIL_NOT_VERIFIED', email: user.email });
    if (user.isTwoFactorEnabled) return res.json({ requires2FA: true, userId: user._id });

    const { accessToken, refreshToken } = generateTokens(String(user._id));
    await createSession(req, String(user._id), refreshToken);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 86400000 });
    await logAudit(user._id, 'USER_LOGIN', 'USER', req);
    res.json({ user, token: accessToken });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/login/2fa
router.post('/login/2fa', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorEmailCode +twoFactorEmailCodeExpires');
    if (!user) return res.status(400).json({ error: 'Invalid request' });

    let verified = false;
    if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: otp, window: 1 });
    }

    if (!verified && user.twoFactorEmailCode && user.twoFactorEmailCodeExpires && user.twoFactorEmailCodeExpires > new Date()) {
      if (user.twoFactorEmailCode === otp) {
        verified = true;
        user.twoFactorEmailCode = undefined;
        user.twoFactorEmailCodeExpires = undefined;
        await user.save();
      }
    }

    if (!verified) return res.status(400).json({ error: 'Invalid code' });

    const { accessToken, refreshToken } = generateTokens(String(user._id));
    await createSession(req, String(user._id), refreshToken);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 86400000 });
    res.json({ user, token: accessToken });
  } catch (err) {
    res.status(500).json({ error: '2FA failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerificationCodeHash +emailVerificationExpires');
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.emailVerificationExpires < new Date()) return res.status(400).json({ error: 'Code expired' });
    if (!(await bcrypt.compare(code, user.emailVerificationCodeHash))) return res.status(400).json({ error: 'Invalid code' });

    user.isVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(String(user._id));
    await createSession(req, String(user._id), refreshToken);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 86400000 });
    res.json({ user, token: accessToken });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If an account exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save();

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/?resetPasswordToken=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
    res.json({ message: 'Reset link sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    passwordPolicy.parse(password);
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await revokeAllSessions(String(user._id));

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Reset failed' });
  }
});

// 2FA Management
router.get('/2fa/generate', authenticate, async (req: AuthRequest, res) => {
  const secret = speakeasy.generateSecret({ name: `AURA (${req.user.email})` });
  req.user.twoFactorSecret = secret.base32;
  await req.user.save();
  qrcode.toDataURL(secret.otpauth_url || '', (err, url) => res.json({ secret: secret.base32, qrCode: url }));
});

router.post('/2fa/enable', authenticate, async (req: AuthRequest, res) => {
  const { token } = req.body;
  if (!req.user.twoFactorSecret) return res.status(400).json({ error: 'Generate secret first' });
  const verified = speakeasy.totp.verify({ secret: req.user.twoFactorSecret, encoding: 'base32', token, window: 1 });
  if (verified) {
    req.user.isTwoFactorEnabled = true;
    await req.user.save();
    res.json({ message: '2FA enabled' });
  } else res.status(400).json({ error: 'Invalid code' });
});

router.post('/2fa/email/send', async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ error: 'User not found' });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  user.twoFactorEmailCode = code;
  user.twoFactorEmailCodeExpires = new Date(Date.now() + 600000);
  await user.save();
  await sendMailMessage({ to: user.email, subject: 'Your AURA Code', text: `Your code is ${code}`, html: `<b>${code}</b>` });
  res.json({ message: 'Code sent' });
});

// Admin Security
router.post('/admin/login', authRateLimiter, async (req, res) => {
  const { username, password } = req.body;
  const dbAdmin = await User.findOne({ email: username.toLowerCase(), role: 'admin' }).select('+password +isTwoFactorEnabled');
  if (dbAdmin && (await bcrypt.compare(password, dbAdmin.password))) {
    if (!dbAdmin.isTwoFactorEnabled) return res.status(403).json({ error: '2FA is mandatory for admins.', code: '2FA_MANDATORY' });
    return res.json({ requires2FA: true, userId: dbAdmin._id });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Profile & Sessions
router.get('/me', authenticate, (req: AuthRequest, res) => res.json(req.user));
router.patch('/update', authenticate, async (req: AuthRequest, res) => {
  const updates = req.body;
  Object.assign(req.user, updates);
  await req.user.save();
  res.json(req.user);
});

router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  const sessions = await Session.find({ userId: req.user._id, isValid: true }).sort({ lastActive: -1 });
  res.json(sessions);
});

router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res) => {
  await Session.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isValid: false });
  res.json({ message: 'Session revoked' });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No token' });
  try {
    const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);
    const session = await Session.findOne({ refreshToken, userId: payload.id, isValid: true });
    if (!session) throw new Error();
    const newTokens = generateTokens(payload.id);
    session.refreshToken = newTokens.refreshToken;
    await session.save();
    res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ token: newTokens.accessToken });
  } catch (err) { res.status(401).json({ error: 'Invalid refresh token' }); }
});

router.get('/audit-logs', authenticate, async (req: AuthRequest, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
  const logs = await AuditLog.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await Session.findOneAndUpdate({ refreshToken: token }, { isValid: false });
  res.clearCookie('refreshToken').json({ message: 'Logged out' });
});

export default router;
