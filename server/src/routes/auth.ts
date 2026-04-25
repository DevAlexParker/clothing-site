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
const ADMIN_REGISTER_SECRET = process.env.ADMIN_REGISTER_SECRET || 'aura_admin_2026';

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
  role: z.enum(['user', 'admin']).default('user'),
  adminSecret: z.string().optional(),
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
      userId, action, targetType,
      ip: req.ip, userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (err) { console.error('Audit log failed:', err); }
};

// POST /api/auth/register
router.post('/register', authRateLimiter, blockDisposableEmail, async (req, res) => {
  try {
    const { name, email, password, phone, role, adminSecret } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    
    // Protect admin role
    let finalRole = 'user';
    if (role === 'admin') {
      const isFirst = (await User.countDocuments({})) === 0;
      if (isFirst || adminSecret === ADMIN_REGISTER_SECRET) {
        finalRole = 'admin';
      } else {
        return res.status(403).json({ error: 'Invalid admin registration secret.' });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ error: 'Account already exists' });
      }
      
      // User exists but is not verified — resend a fresh code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await bcrypt.hash(code, 10);
      
      existingUser.emailVerificationCodeHash = codeHash;
      existingUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await existingUser.save();
      
      try {
        await sendVerificationCodeEmail(normalizedEmail, code, existingUser.name);
      } catch (err) {
        console.error('Email delivery failed during resend:', err);
      }
      
      return res.status(200).json({
        requiresVerification: true,
        email: normalizedEmail,
        message: 'A new verification code has been sent to your email.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);

    const user = new User({
      name, email: normalizedEmail, password: hashedPassword, phone,
      role: finalRole as 'user' | 'admin',
      isVerified: false,
      emailVerificationCodeHash: codeHash,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    await user.save();
    await logAudit(user._id, 'USER_REGISTER', 'USER', req, { role: finalRole });
    
    try {
      await sendVerificationCodeEmail(normalizedEmail, code, name);
    } catch (err) { console.error('Email delivery failed:', err); }

    res.status(201).json({
      requiresVerification: true,
      email: normalizedEmail,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Invalid request data' });
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
    
    if (user.isTwoFactorEnabled) {
      return res.json({ requires2FA: true, userId: user._id });
    }

    // Special case for mandatory admin 2FA setup
    if (user.role === 'admin' && !user.isTwoFactorEnabled) {
      // Issue a limited setup token
      const token = jwt.sign({ id: user._id, setup2FA: true }, JWT_SECRET, { expiresIn: '15m' });
      return res.json({ requires2FASetup: true, token, user });
    }

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
  } catch (err) { res.status(500).json({ error: '2FA failed' }); }
});

// POST /api/auth/admin/login
router.post('/admin/login', authRateLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  // Normal DB check
  const dbAdmin = await User.findOne({ email: username.toLowerCase(), role: 'admin' }).select('+password +isTwoFactorEnabled');
  if (dbAdmin && (await bcrypt.compare(password, dbAdmin.password))) {
    if (dbAdmin.isTwoFactorEnabled) {
      return res.json({ requires2FA: true, userId: dbAdmin._id });
    }
    // Mandatory 2FA Setup mode
    const token = jwt.sign({ id: dbAdmin._id, setup2FA: true }, JWT_SECRET, { expiresIn: '15m' });
    return res.json({ requires2FASetup: true, token, user: dbAdmin });
  }

  // Emergency Env Admin fallback
  const username_env = process.env.ADMIN_USERNAME?.trim();
  const password_env = process.env.ADMIN_PASSWORD?.trim();
  if (username_env && username === username_env && password === password_env) {
    const token = jwt.sign({ role: 'admin', authType: 'env_admin' }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token, user: { name: 'Environment Admin', role: 'admin' } });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// GET /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerificationCodeHash +emailVerificationExpires');
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (!user.emailVerificationExpires || !user.emailVerificationCodeHash) {
      return res.status(400).json({ error: 'No active verification code. Please request a new one.' });
    }
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
  } catch (err) { res.status(500).json({ error: 'Verification failed' }); }
});

router.post('/2fa/generate', authenticate, async (req: AuthRequest, res) => {
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

// Profile & Sessions
router.get('/me', authenticate, (req: AuthRequest, res) => res.json(req.user));

// PATCH /api/auth/me — update profile (name, phone, address, city, postalCode)
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const allowed = ['name', 'phone', 'address', 'city', 'postalCode'] as const;
    const updates: Partial<Record<typeof allowed[number], string>> = {};
    for (const key of allowed) {
      if (typeof req.body[key] === 'string') updates[key] = req.body[key].trim();
    }
    if (typeof req.body.smsOptIn === 'boolean') {
      req.user.smsOptIn = req.body.smsOptIn;
    }
    Object.assign(req.user, updates);
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  const sessions = await Session.find({ userId: req.user._id, isValid: true }).sort({ lastActive: -1 });
  res.json(sessions);
});

router.delete('/sessions/:id', authenticate, async (req: AuthRequest, res) => {
  await Session.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isValid: false });
  res.json({ message: 'Session revoked' });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await Session.findOneAndUpdate({ refreshToken: token }, { isValid: false });
  res.clearCookie('refreshToken').json({ message: 'Logged out' });
});

// DELETE /api/auth/me (Account Deletion)
router.delete('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Delete all sessions
    await Session.deleteMany({ userId });
    
    // 2. Anonymize Audit Logs (Keep for security trail but remove identity)
    await AuditLog.updateMany(
      { userId },
      { $set: { userId: null, metadata: { ...req.user.metadata, deleted: true, originalEmail: req.user.email } } }
    );
    
    // 3. Delete the User
    await User.findByIdAndDelete(userId);
    
    res.clearCookie('refreshToken');
    res.json({ message: 'Account and all associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordResetToken +passwordResetExpires');
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };
    if (!user) { res.json(generic); return; }

    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const baseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/?resetPasswordToken=${encodeURIComponent(token)}`;

    try {
      await sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }

    res.json(generic);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password +passwordResetToken +passwordResetExpires');

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Auto-login: generate a fresh token
    const { accessToken, refreshToken } = generateTokens(String(user._id));
    await createSession(req, String(user._id), refreshToken);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 86400000 });
    res.json({ token: accessToken, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
