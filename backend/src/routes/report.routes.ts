import { Router, type Request, type Response } from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/dashboard', authorize(['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR']), (req: Request, res: Response) =>
  reportController.dashboard(req, res, () => {})
);

router.get('/export/:reportKey.:format', authorize(['ADMIN', 'GERENTE', 'CAJERO', 'VENDEDOR']), (req: Request, res: Response) =>
  reportController.exportReport(req, res, () => {})
);

router.get('/suppliers.csv', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response) =>
  reportController.suppliersCsv(req, res, () => {})
);

router.get('/suppliers.xlsx', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response) =>
  reportController.suppliersXlsx(req, res, () => {})
);

router.get('/suppliers.pdf', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response) =>
  reportController.suppliersPdf(req, res, () => {})
);

export default router;