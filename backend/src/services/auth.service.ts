import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../prisma/client.js';
import { config } from '../config/config.js';

const SALT_ROUNDS = 10;

const parseExpiresIn = (expiresIn: string) => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

export const hashPassword = async (password: string) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (payload: object, expiresIn: string) =>
  jwt.sign(payload, config.jwtSecret as jwt.Secret, { expiresIn } as jwt.SignOptions);

export const verifyToken = <T>(token: string): T => jwt.verify(token, config.jwtSecret) as T;

export const createRefreshToken = async (userId: string, ip?: string, userAgent?: string) => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + parseExpiresIn(config.refreshTokenExpiresIn));

  await prisma.refreshToken.create({
    data: { token, userId, ip, userAgent, expiresAt }
  });

  return token;
};

export const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

export const findRefreshToken = async (token: string) => prisma.refreshToken.findUnique({ where: { token } });

export const logLoginAudit = async (email: string, success: boolean, userId?: string, ip?: string, userAgent?: string) => {
  await prisma.loginAudit.create({ data: { email, success, userId, ip, userAgent } });
};
