import { Router, type NextFunction, type Request, type Response } from 'express';
import saleController from '../controllers/sale.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => saleController.list(req, res, next));
router.post('/confirm', authorize(['ADMIN', 'GERENTE', 'VENDEDOR', 'CAJERO']), (req: Request, res: Response, next: NextFunction) =>
	saleController.confirm(req, res, next)
);
router.get('/:id/ticket.pdf', (req: Request, res: Response, next: NextFunction) => saleController.ticketPdf(req, res, next));
router.get('/:id/ticket', (req: Request, res: Response, next: NextFunction) => saleController.ticket(req, res, next));

export default router;