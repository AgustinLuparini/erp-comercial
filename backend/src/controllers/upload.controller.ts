import { type NextFunction, type Request, type Response } from 'express';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const buildPublicUrl = (req: Request, file?: Express.Multer.File) => {
  if (!file) return null;
  const relativePath = file.path.split('uploads').pop()?.replace(/\\/g, '/').replace(/^\//, '') ?? '';
  return `${req.protocol}://${req.get('host')}/uploads${relativePath}`;
};

export class UploadController {
  async image(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    if (!req.file) return sendError(res, { message: 'La imagen es requerida' }, 400);
    return sendSuccess(res, { filename: req.file.filename, url: buildPublicUrl(req, req.file) }, 'Imagen cargada', 201);
  }

  async pdf(req: Request, res: Response, _next: NextFunction): Promise<Response> {
    if (!req.file) return sendError(res, { message: 'El PDF es requerido' }, 400);
    return sendSuccess(res, { filename: req.file.filename, url: buildPublicUrl(req, req.file) }, 'PDF cargado', 201);
  }
}

export default new UploadController();