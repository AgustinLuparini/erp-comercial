import { type NextFunction, type Request, type Response } from 'express';
import customerService from '../services/customer.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.create(req.body), 'Cliente creado', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.list(req.query), 'Clientes listados');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.getById(req.params.id), 'Cliente obtenido');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.update({ id: req.params.id, ...req.body }), 'Cliente actualizado');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await customerService.remove(req.params.id);
      return sendSuccess(res, null, 'Cliente eliminado');
    } catch (error) {
      next(error);
    }
  }

  async balance(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.getBalance(req.params.id), 'Saldo del cliente');
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.getHistory(req.params.id), 'Historial del cliente');
    } catch (error) {
      next(error);
    }
  }

  async accountEntry(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await customerService.createAccountEntry(req.body), 'Movimiento de cuenta registrado', 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomerController();