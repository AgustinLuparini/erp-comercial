import { Router, type NextFunction, type Request, type Response } from 'express';
import supplierController from '../controllers/supplier.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => supplierController.getAll(req, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => supplierController.getById(req, res, next));
router.get('/:id/balance', (req: Request, res: Response, next: NextFunction) => supplierController.balance(req, res, next));
router.get('/:id/history', (req: Request, res: Response, next: NextFunction) => supplierController.history(req, res, next));
router.post('/account-entries', authorize(['ADMIN', 'GERENTE', 'DEPOSITO', 'CAJERO']), (req: Request, res: Response, next: NextFunction) =>
  supplierController.accountEntry(req, res, next)
);
router.post('/', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) => supplierController.create(req, res, next));
router.put('/:id', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) => supplierController.update(req, res, next));
router.delete('/:id', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response, next: NextFunction) => supplierController.remove(req, res, next));

export default router;