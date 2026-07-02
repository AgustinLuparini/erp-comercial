import { type NextFunction, type Request, type Response } from 'express';
import cashService from '../services/cash.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class CashController {
  async open(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(res, await cashService.open(req.body, authReq.user?.userId), 'Caja abierta', 201);
    } catch (error) {
      next(error);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(res, await cashService.close(req.params.id, req.body, authReq.user?.userId), 'Caja cerrada');
    } catch (error) {
      next(error);
    }
  }

  async recount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(res, await cashService.recount(req.params.id, Number(req.body.countedAmount), authReq.user?.userId), 'Arqueo realizado');
    } catch (error) {
      next(error);
    }
  }

  async income(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(
        res,
        await cashService.addMovement({
          ...req.body,
          cashBoxId: req.params.id,
          movementType: 'INCOME',
          userId: authReq.user?.userId
        }),
        'Ingreso registrado',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async expense(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authReq = req as AuthRequest;
      return sendSuccess(
        res,
        await cashService.addMovement({
          ...req.body,
          cashBoxId: req.params.id,
          movementType: 'EXPENSE',
          userId: authReq.user?.userId
        }),
        'Egreso registrado',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await cashService.list(req.query), 'Cajas listadas');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await cashService.getById(req.params.id), 'Caja obtenida');
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await cashService.history(req.params.id), 'Historial de caja');
    } catch (error) {
      next(error);
    }
  }
}

export default new CashController();