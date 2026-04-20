import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window for login/signup
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Disposable email blocker
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com',
  'dispostable.com', 'getnada.com', 'yopmail.com', 'trashmail.com'
];

export const blockDisposableEmail = (req: Request, res: Response, next: NextFunction) => {
  const email = req.body.email || '';
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
    return res.status(400).json({ error: 'Please use a valid email address. Disposable emails are not allowed.' });
  }
  next();
};

// Security headers (Helmet is usually enough, but we can customize)
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://checkout.stripe.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
});
