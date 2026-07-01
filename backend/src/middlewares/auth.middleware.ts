import { type Request, type Response, type NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    req.user = verifyToken<{ userId: string; role: string }>(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const authorize = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};
