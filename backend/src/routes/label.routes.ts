import { Router, Request, Response } from 'express';
import labelController from '../controllers/label.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Generar etiquetas en HTML
router.post('/generate-html', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  labelController.generateLabels(req, res, () => {})
);

// Generar etiquetas en PDF (requiere dependencias adicionales)
router.post('/generate-pdf', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  labelController.generateLabelsPDF(req, res, () => {})
);

// Obtener plantilla de importación
router.get('/import-template', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  labelController.getImportTemplate(req, res, () => {})
);

// Importar productos desde archivo (requiere configuración de multer)
router.post('/import', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  labelController.importProducts(req, res, () => {})
);

export default router;
