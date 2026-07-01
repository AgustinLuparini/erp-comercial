import { type NextFunction, type Request, type Response } from 'express';
import saleService from '../services/sale.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class SaleController {
  async confirm(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(
        res,
        await saleService.confirmSale(req.body, authReq.user?.userId, authReq.user?.role),
        'Venta confirmada',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await saleService.list(req.query), 'Ventas listadas');
    } catch (error) {
      next(error);
    }
  }

  async ticket(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const html = await saleService.ticket(req.params.id);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (error) {
      next(error);
    }
  }

  async ticketPdf(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { buffer, fileName } = await saleService.buildTicketPdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new SaleController();