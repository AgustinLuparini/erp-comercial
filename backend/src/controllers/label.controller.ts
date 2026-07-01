import { Request, Response, NextFunction } from 'express';
import labelService from '../services/label.service.js';
import excelService from '../services/excel.service.js';
import productService from '../services/product.service.js';
import { sendError } from '../utils/apiResponse.js';

export class LabelController {
  async generateLabels(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    try {
      const { productIds, quantity = 1 } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return sendError(res, { message: 'Se requiere un array de IDs de productos' }, 400);
      }

      const labelData = [];

      for (const productId of productIds) {
        const product = await productService.getProductById(productId);
        for (let i = 0; i < quantity; i++) {
          labelData.push({
            barcode: product.barcode || product.internalCode,
            name: product.name,
            price: product.salePrice,
            code: product.internalCode
          });
        }
      }

      const html = labelService.generateLabelHTML(labelData);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="etiquetas.html"');
      return res.send(html);
    } catch (error) {
      _next(error);
      return res;
    }
  }

  async generateLabelsPDF(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    try {
      const { productIds } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return sendError(res, { message: 'Se requiere un array de IDs de productos' }, 400);
      }

      // Esta funcionalidad requiere dependencias adicionales
      return sendError(res, { message: 'La generación de PDF requiere dependencias adicionales. Use la versión HTML por ahora.' }, 400);
    } catch (error) {
      _next(error);
      return res;
    }
  }

  async getImportTemplate(_req: Request, res: Response, _next: NextFunction): Promise<Response> {
    try {
      const csv = excelService.generateTemplateCSV();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="plantilla_productos.csv"');
      return res.send(csv);
    } catch (error) {
      _next(error);
      return res;
    }
  }

  async importProducts(_req: Request, res: Response, _next: NextFunction): Promise<Response> {
    try {
      // Esta funcionalidad requiere multer para manejo de archivos
      return sendError(res, { message: 'Configure multer para manejar uploads de archivos' }, 400);
    } catch (error) {
      _next(error);
      return res;
    }
  }
}

export default new LabelController();
