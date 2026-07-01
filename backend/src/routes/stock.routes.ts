import { Router, type NextFunction, type Request, type Response } from 'express';
import stockController from '../controllers/stock.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => stockController.list(req, res, next));
router.get('/alerts', (req: Request, res: Response, next: NextFunction) => stockController.alerts(req, res, next));
router.get('/:productId/history', (req: Request, res: Response, next: NextFunction) => stockController.history(req, res, next));
router.post('/movements', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) =>
	stockController.movement(req, res, next)
);
router.post('/transfers', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) =>
	stockController.transfer(req, res, next)
);
router.post('/adjustments', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response, next: NextFunction) =>
	stockController.adjust(req, res, next)
);

export default router;