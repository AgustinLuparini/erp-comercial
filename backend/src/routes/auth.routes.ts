import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
authRouter.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
authRouter.post('/password/request', (req, res, next) => authController.requestPasswordReset(req, res, next));
authRouter.post('/password/reset', (req, res, next) => authController.resetPassword(req, res, next));
authRouter.post('/password/change', authenticate, (req, res, next) => authController.changePassword(req, res, next));
