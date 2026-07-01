import { Router, Request, Response } from 'express';
import productController from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Crear producto
router.post('/', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  productController.create(req, res, () => {})
);

// Obtener todos los productos con filtros
router.get('/', (req: Request, res: Response) => productController.getAll(req, res, () => {}));

// Buscar productos
router.get('/search', (req: Request, res: Response) => productController.search(req, res, () => {}));

// Opciones para formularios de productos
router.get('/form-options', (req: Request, res: Response) => productController.formOptions(req, res, () => {}));

// Obtener niveles de stock
router.get('/stock/levels', (req: Request, res: Response) =>
  productController.getStockLevels(req, res, () => {})
);

// Obtener producto por código de barras
router.get('/barcode/:barcode', (req: Request, res: Response) =>
  productController.getByBarcode(req, res, () => {})
);

// Obtener producto por código interno
router.get('/code/:code', (req: Request, res: Response) =>
  productController.getByInternalCode(req, res, () => {})
);

// Convertir unidades
router.post('/convert-units', (req: Request, res: Response) =>
  productController.convertUnits(req, res, () => {})
);

// Importación masiva
router.post('/bulk-import', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  productController.bulkImport(req, res, () => {})
);

// Obtener producto por ID
router.get('/:id', (req: Request, res: Response) => productController.getById(req, res, () => {}));

// Actualizar producto
router.put('/:id', authorize(['ADMIN', 'GERENTE', 'DEPOSITO']), (req: Request, res: Response) =>
  productController.update(req, res, () => {})
);

// Eliminar producto
router.delete('/:id', authorize(['ADMIN', 'GERENTE']), (req: Request, res: Response) =>
  productController.delete(req, res, () => {})
);

export default router;
