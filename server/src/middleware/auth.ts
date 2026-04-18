import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: any;
}
interface TokenPayload {
  id?: string;
  role?: string;
  authType?: string;
  username?: string;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req.header('Authorization'));

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    if (decoded.authType === 'env_admin' && decoded.role === 'admin') {
      req.user = {
        _id: `env-admin:${decoded.username ?? 'admin'}`,
        role: 'admin',
        name: decoded.username ?? 'Admin',
      };
      next();
      return;
    }

    if (!decoded.id) {
      throw new Error();
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error();
    }

    if (user.role === 'user' && user.isVerified === false) {
      res.status(403).json({ error: 'Please verify your email.', code: 'EMAIL_NOT_VERIFIED' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req.header('Authorization'));
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload;
    if (decoded.authType === 'env_admin' && decoded.role === 'admin') {
      req.user = {
        _id: `env-admin:${decoded.username ?? 'admin'}`,
        role: 'admin',
        name: decoded.username ?? 'Admin',
      };
      next();
      return;
    }

    if (!decoded.id) {
      next();
      return;
    }
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (_error) {
    // Ignore invalid optional auth and continue as unauthenticated user.
  }
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    next();
  };
};
