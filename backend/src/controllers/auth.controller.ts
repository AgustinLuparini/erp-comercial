import crypto from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { type AuthRequest } from '../middlewares/auth.middleware.js';
import { config } from '../config/config.js';
import { prisma } from '../prisma/client.js';
import {
  comparePassword,
  createRefreshToken,
  findRefreshToken,
  logLoginAudit,
  revokeRefreshToken,
  signToken,
  hashPassword
} from '../services/auth.service.js';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: { select: { name: true, isActive: true } } }
      });
      const ip = req.ip;
      const userAgent = req.get('user-agent') ?? undefined;

      if (!user || !(await comparePassword(password, user.password))) {
        await logLoginAudit(email, false, undefined, ip, userAgent);
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      if (!user.isActive) {
        await logLoginAudit(email, false, user.id, ip, userAgent);
        return res.status(403).json({ message: 'Usuario inactivo' });
      }

      if (!user.role?.isActive) {
        await logLoginAudit(email, false, user.id, ip, userAgent);
        return res.status(403).json({ message: 'Rol inactivo' });
      }

      const roleName = user.role.name;
      const accessToken = signToken({ userId: user.id, role: roleName }, config.jwtExpiresIn);
      const refreshToken = await createRefreshToken(user.id, ip, userAgent);
      await logLoginAudit(email, true, user.id, ip, userAgent);

      res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: roleName } });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await revokeRefreshToken(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const existing = await findRefreshToken(refreshToken);

      if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Refresh token inválido' });
      }

      const user = await prisma.user.findUnique({
        where: { id: existing.userId },
        include: { role: { select: { name: true, isActive: true } } }
      });
      if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
      if (!user.role?.isActive) return res.status(403).json({ message: 'Rol inactivo' });

      const accessToken = signToken({ userId: user.id, role: user.role.name }, config.jwtExpiresIn);
      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(200).json({ message: 'Si el email existe, se ha enviado un enlace de recuperación' });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

      res.json({ message: 'Token de recuperación generado', resetToken: token });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Token de recuperación inválido o expirado' });
      }

      const hashed = await hashPassword(password);
      await prisma.user.update({ where: { id: resetRecord.userId }, data: { password: hashed } });
      await prisma.passwordResetToken.update({ where: { token }, data: { used: true } });
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId as string;
      const { oldPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      if (!(await comparePassword(oldPassword, user.password))) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }

      const hashed = await hashPassword(newPassword);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      res.json({ message: 'Contraseña cambiada correctamente' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
