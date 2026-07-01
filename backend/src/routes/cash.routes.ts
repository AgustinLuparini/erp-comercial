import { Router, type NextFunction, type Request, type Response } from 'express';
import cashController from '../controllers/cash.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.list(req, res, next));
router.get('/:id', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.getById(req, res, next));
router.get('/:id/history', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.history(req, res, next));
router.post('/open', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.open(req, res, next));
router.post('/:id/close', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.close(req, res, next));
router.post('/:id/recount', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.recount(req, res, next));
router.post('/:id/income', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.income(req, res, next));
router.post('/:id/expense', authorize(['ADMIN', 'GERENTE', 'CAJERO']), (req: Request, res: Response, next: NextFunction) => cashController.expense(req, res, next));

export default router;