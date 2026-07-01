import { Router, type NextFunction, type Request, type Response } from 'express';
import customerController from '../controllers/customer.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => customerController.getAll(req, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => customerController.getById(req, res, next));
router.get('/:id/balance', (req: Request, res: Response, next: NextFunction) => customerController.balance(req, res, next));
router.get('/:id/history', (req: Request, res: Response, next: NextFunction) => customerController.history(req, res, next));
router.post('/account-entries', authorize(['ADMIN', 'GERENTE', 'VENDEDOR', 'CAJERO']), (req: Request, res: Response, next: NextFunction) =>
  customerController.accountEntry(req, res, next)
);
router.post('/', authorize(['ADMIN', 'GERENTE', 'VENDEDOR', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => customerController.create(req, res, next));
router.put('/:id', authorize(['ADMIN', 'GERENTE', 'VENDEDOR', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => customerController.update(req, res, next));
router.delete('/:id', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response, next: NextFunction) => customerController.remove(req, res, next));

export default router;