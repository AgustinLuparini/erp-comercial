import { type NextFunction, type Request, type Response } from 'express';
import purchaseService from '../services/purchase.service.js';

export class PurchaseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await purchaseService.create(req.body));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.json(await purchaseService.list(req.query));
    } catch (error) {
      next(error);
    }
  }

  async receive(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await purchaseService.receive(req.body));
    } catch (error) {
      next(error);
    }
  }

  async completeReceive(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await purchaseService.completeReceive(req.params.id, (req.body?.userId as string | undefined) || undefined));
    } catch (error) {
      next(error);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const pdfBuffer = await purchaseService.buildPurchasePdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="compra-${req.params.id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseController();