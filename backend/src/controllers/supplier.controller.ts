import { type NextFunction, type Request, type Response } from 'express';
import supplierService from '../services/supplier.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export class SupplierController {
  async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.create(req.body), 'Proveedor creado', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.list(req.query), 'Proveedores listados');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.getById(req.params.id), 'Proveedor obtenido');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.update({ id: req.params.id, ...req.body }), 'Proveedor actualizado');
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await supplierService.remove(req.params.id);
      return sendSuccess(res, null, 'Proveedor eliminado');
    } catch (error) {
      next(error);
    }
  }

  async balance(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.getBalance(req.params.id), 'Saldo del proveedor');
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.getHistory(req.params.id), 'Historial del proveedor');
    } catch (error) {
      next(error);
    }
  }

  async accountEntry(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return sendSuccess(res, await supplierService.createAccountEntry(req.body), 'Movimiento de cuenta registrado', 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();