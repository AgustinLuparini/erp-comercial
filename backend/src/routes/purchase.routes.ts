import { Router, type NextFunction, type Request, type Response } from 'express';
import purchaseController from '../controllers/purchase.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => purchaseController.list(req, res, next));
router.get('/:id/pdf', authorize(['ADMIN', 'GERENTE', 'DEPOSITO', 'CAJERO']), (req: Request, res: Response, next: NextFunction) =>
  purchaseController.downloadPdf(req, res, next)
);
router.post('/', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) =>
  purchaseController.create(req, res, next)
);
router.post('/receive', authorize(['ADMIN', 'GERENTE', 'DEPOSITO', 'CAJERO']), (req: Request, res: Response, next: NextFunction) =>
  purchaseController.receive(req, res, next)
);
router.post('/:id/receive-complete', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) =>
  purchaseController.completeReceive(req, res, next)
);

export default router;