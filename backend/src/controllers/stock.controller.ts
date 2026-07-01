import { type NextFunction, type Request, type Response } from 'express';
import stockService from '../services/stock.service.js';

export class StockController {
  async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.json(await stockService.list(req.query));
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.json(await stockService.history(req.params.productId));
    } catch (error) {
      next(error);
    }
  }

  async alerts(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.json(await stockService.getAlerts());
    } catch (error) {
      next(error);
    }
  }

  async movement(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await stockService.registerMovement(req.body));
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await stockService.transfer(req.body));
    } catch (error) {
      next(error);
    }
  }

  async adjust(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.status(201).json(await stockService.adjust(req.body));
    } catch (error) {
      next(error);
    }
  }
}

export default new StockController();