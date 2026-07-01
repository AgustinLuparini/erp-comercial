import { Router, type Request, type Response } from 'express';
import uploadController from '../controllers/upload.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { uploadSingle } from '../middlewares/upload.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/image', authorize(['ADMIN', 'GERENTE']), uploadSingle, (req: Request, res: Response, next) =>
  uploadController.image(req, res, next)
);
router.post('/pdf', authorize(['ADMIN', 'GERENTE']), uploadSingle, (req: Request, res: Response, next) =>
  uploadController.pdf(req, res, next)
);

export default router;