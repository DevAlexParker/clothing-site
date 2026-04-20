import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { Session } from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const createSession = async (req: Request, userId: string, refreshToken: string) => {
  const ua = new UAParser(req.headers['user-agent']);
  const browser = ua.getBrowser();
  const os = ua.getOS();
  const device = ua.getDevice();

  await Session.create({
    userId,
    refreshToken,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    browser: `${browser.name || 'Unknown'} ${browser.version || ''}`,
    os: `${os.name || 'Unknown'} ${os.version || ''}`,
    deviceType: device.type || 'desktop',
    lastActive: new Date(),
  });
};

export const revokeAllSessions = async (userId: string) => {
  await Session.updateMany({ userId }, { isValid: false });
};
