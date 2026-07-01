import { type NextFunction, type Request, type Response } from 'express';
import reportService from '../services/report.service.js';

export class ReportController {
  async dashboard(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return res.json({ success: true, message: 'Dashboard', data: await reportService.getDashboardStats() });
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await reportService.exportReport(req.params.reportKey as any, req.params.format as any);

      if (req.params.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.reportKey}.csv"`);
        return res.send(result);
      }

      if (req.params.format === 'xlsx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.reportKey}.xlsx"`);
        return res.send(result);
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.reportKey}.pdf"`);
      return res.send(result);
    } catch (error) {
      next(error);
    }
  }

  async suppliersCsv(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const csv = await reportService.exportSuppliersCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="proveedores.csv"');
      return res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  async suppliersXlsx(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const buffer = await reportService.exportSuppliersXlsx();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="proveedores.xlsx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async suppliersPdf(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const buffer = await reportService.exportSuppliersPdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="proveedores.pdf"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();