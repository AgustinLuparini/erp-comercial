import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get('/', authorize(['ADMIN', 'GERENTE']), (req, res, next) => userController.getAll(req, res, next));
userRouter.get('/:id', authorize(['ADMIN', 'GERENTE']), (req, res, next) => userController.getById(req, res, next));
userRouter.post('/', authorize(['ADMIN']), (req, res, next) => userController.create(req, res, next));
userRouter.put('/:id', authorize(['ADMIN']), (req, res, next) => userController.update(req, res, next));
userRouter.delete('/:id', authorize(['ADMIN']), (req, res, next) => userController.remove(req, res, next));
