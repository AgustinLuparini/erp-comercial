import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service.js';
import { validateCreateProduct, validateUpdateProduct, validateProductFilter } from '../validators/product.validator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class ProductController {
  private normalizeUnit<T extends { unit?: unknown }>(data: T): T {
    if (typeof data.unit === 'string') {
      return { ...data, unit: data.unit.trim().toUpperCase() };
    }
    return data;
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload = this.normalizeUnit(req.body as any);
      const errors = validateCreateProduct(payload as any);
      if (errors.length > 0) {
        return sendError(res, { message: 'Errores de validación', errors }, 400);
      }

      const product = await productService.createProduct(payload as any);
      return sendSuccess(res, product, 'Producto creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async formOptions(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const options = await productService.getFormOptions();
      return sendSuccess(res, options);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const filter = {
        categoryId: req.query.categoryId as string,
        subcategoryId: req.query.subcategoryId as string,
        supplierId: req.query.supplierId as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        minStock: req.query.minStock ? Number(req.query.minStock) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        unit: req.query.unit as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };

      const errors = validateProductFilter(filter as any);
      if (errors.length > 0) {
        return sendError(res, { message: 'Errores de validación', errors }, 400);
      }

      const result = await productService.getProducts(filter as any);

      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const payload = this.normalizeUnit(req.body as any);
      const errors = validateUpdateProduct({ ...(payload as any), id: req.params.id });
      if (errors.length > 0) {
        return sendError(res, { message: 'Errores de validación', errors }, 400);
      }

      const product = await productService.updateProduct(req.params.id, payload as any);
      return sendSuccess(res, product, 'Producto actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await productService.deleteProduct(req.params.id);
      return sendSuccess(res, null, 'Producto eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { q, limit } = req.query;
      if (!q) {
        return sendError(res, { message: 'El parámetro "q" es requerido' }, 400);
      }

      const products = await productService.searchProducts(q as string, limit ? Number(limit) : 10);
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getByBarcode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const product = await productService.getProductByBarcode(req.params.barcode);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async getByInternalCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const product = await productService.getProductByInternalCode(req.params.code);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async bulkImport(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await productService.bulkImportProducts(req.body);
      return sendSuccess(res, result, 'Importación completada');
    } catch (error) {
      next(error);
    }
  }

  async convertUnits(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { fromUnit, toUnit, quantity } = req.body;
      if (!fromUnit || !toUnit || quantity === undefined) {
        return sendError(res, { message: 'Los parámetros fromUnit, toUnit y quantity son requeridos' }, 400);
      }

      const converted = await productService.convertUnits({ fromUnit, toUnit, quantity, conversionFactor: 1 });
      return sendSuccess(res, { original: quantity, converted, fromUnit, toUnit });
    } catch (error) {
      next(error);
    }
  }

  async getStockLevels(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { supplierId } = req.query;
      const stockLevels = await productService.getStockLevels(supplierId as string);
      return sendSuccess(res, stockLevels);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
