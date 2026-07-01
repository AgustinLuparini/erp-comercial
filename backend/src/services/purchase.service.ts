import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import stockService from './stock.service.js';
import type { CreatePurchaseDTO, PurchaseFilterDTO, ReceivePurchaseDTO } from '../dtos/purchase.dto.js';
import PDFDocument from 'pdfkit';

export class PurchaseService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  private async getSupplierBalance(supplierId: string) {
    const entries = await prisma.supplierAccountEntry.findMany({
      where: { supplierId, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    return entries.reduce((runningTotal: number, entry: any) => {
      const amount = Number(entry.amount);
      return entry.entryType === 'PAYMENT' ? runningTotal - amount : runningTotal + amount;
    }, 0);
  }

  private calculateSalePrice(cost: number, margin: number): number {
    if (cost <= 0) return 0;
    const salePrice = cost * (1 + margin / 100);
    return Number(salePrice.toFixed(2));
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  async buildPurchasePdf(purchaseId: string): Promise<Buffer> {
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, deletedAt: null },
      include: {
        supplier: { select: { id: true, businessName: true } },
        details: {
          include: {
            product: { select: { id: true, internalCode: true, name: true } }
          }
        }
      }
    });

    if (!purchase) throw new AppError('Orden de compra no encontrada', 404);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE COMPRA', { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Fecha: ${this.formatDate(purchase.createdAt)}`);
      doc.moveDown(1);

      const startX = doc.page.margins.left;
      const colProduct = startX;
      const colQuantity = startX + 320;
      const colAmount = startX + 420;
      const rowHeight = 24;
      let y = doc.y;

      const drawHeader = () => {
        doc.rect(startX, y, 515, rowHeight).stroke('#222222');
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('PRODUCTO', colProduct + 6, y + 7, { width: 300 });
        doc.text('CANTIDAD', colQuantity + 6, y + 7, { width: 90, align: 'center' });
        doc.text('IMPORTE', colAmount + 6, y + 7, { width: 85, align: 'right' });
        y += rowHeight;
      };

      drawHeader();

      doc.font('Helvetica').fontSize(10);
      for (const detail of purchase.details) {
        if (y > 760) {
          doc.addPage();
          y = doc.page.margins.top;
          drawHeader();
          doc.font('Helvetica').fontSize(10);
        }

        doc.rect(startX, y, 515, rowHeight).stroke('#d1d5db');

        const productName = `${detail.product.internalCode} - ${detail.product.name}`;
        doc.text(productName, colProduct + 6, y + 7, { width: 300, ellipsis: true });
        doc.text(String(detail.quantity), colQuantity + 6, y + 7, { width: 90, align: 'center' });
        doc.text(`$${Number(detail.total).toFixed(2)}`, colAmount + 6, y + 7, { width: 85, align: 'right' });

        y += rowHeight;
      }

      y += 8;
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text(`Total: $${Number(purchase.total).toFixed(2)}`, colAmount - 40, y, { width: 130, align: 'right' });

      doc.end();
    });
  }

  async create(data: CreatePurchaseDTO) {
    const purchase = await prisma.purchase.create({
      data: {
        supplierId: data.supplierId,
        userId: data.userId,
        purchaseNumber: data.purchaseNumber,
        status: data.status ?? 'PENDING',
        subtotal: data.subtotal,
        discount: data.discount ?? 0,
        tax: data.tax ?? 0,
        total: data.total,
        notes: data.notes,
        details: {
          create: data.details.map((detail) => ({
            productId: detail.productId,
            quantity: detail.quantity,
            unit: detail.unit,
            unitPrice: detail.unitPrice,
            discount: detail.discount ?? 0,
            tax: detail.tax ?? 0,
            total: detail.quantity * detail.unitPrice
          }))
        }
      },
      include: { details: true, supplier: true }
    });

    return purchase;
  }

  async list(filter: PurchaseFilterDTO) {
    const page = this.toPositiveInt(filter.page, 1);
    const limit = this.toPositiveInt(filter.limit, 20);
    const where: any = { deletedAt: null };

    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { purchaseNumber: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, purchases] = await Promise.all([
      prisma.purchase.count({ where }),
      prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { id: true, businessName: true } },
          details: { include: { product: { select: { id: true, internalCode: true, name: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return { total, page, limit, purchases };
  }

  async receive(data: ReceivePurchaseDTO) {
    const purchase = await prisma.purchase.findFirst({
      where: { id: data.purchaseId, deletedAt: null },
      include: { details: true }
    });

    if (!purchase) throw new AppError('Orden de compra no encontrada', 404);

    let receivedTotal = 0;

    for (const received of data.details) {
      const detail = purchase.details.find((item: any) => item.productId === received.productId);
      if (!detail) continue;

      receivedTotal += received.quantityReceived * Number(detail.unitPrice);

      const product = await prisma.product.findUnique({
        where: { id: received.productId },
        select: { cost: true, margin: true }
      });

      if (product) {
        const currentCost = Number(product.cost);
        const purchaseCost = Number(detail.unitPrice);

        // Si sube el costo por compra, actualizar también el precio de venta usando el margen previamente configurado.
        if (purchaseCost > currentCost) {
          const nextSalePrice = this.calculateSalePrice(purchaseCost, Number(product.margin));
          await prisma.product.update({
            where: { id: received.productId },
            data: {
              cost: purchaseCost,
              salePrice: nextSalePrice
            }
          });
        }
      }

      await stockService.registerMovement({
        productId: received.productId,
        movementType: 'INCOMING',
        quantity: received.quantityReceived,
        reference: purchase.purchaseNumber || purchase.id,
        note: data.notes,
        location: received.location || 'GENERAL',
        userId: purchase.userId ?? undefined
      });
    }

    const currentBalance = await this.getSupplierBalance(purchase.supplierId);

    await prisma.supplierAccountEntry.create({
      data: {
        supplierId: purchase.supplierId,
        userId: purchase.userId,
        entryType: 'CHARGE',
        amount: receivedTotal,
        balanceAfter: currentBalance + receivedTotal,
        description: `Recepción parcial de compra ${purchase.purchaseNumber || purchase.id}`
      }
    });

    const allReceived =
      data.details.reduce((total: number, item) => total + item.quantityReceived, 0) >=
      purchase.details.reduce((total: number, item: any) => total + item.quantity, 0);

    const updated = await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: allReceived ? 'RECEIVED' : 'PENDING' }
    });

    return updated;
  }

  async completeReceive(purchaseId: string, userId?: string) {
    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, deletedAt: null },
      include: { details: true }
    });

    if (!purchase) throw new AppError('Orden de compra no encontrada', 404);
    if (purchase.status === 'RECEIVED') throw new AppError('La compra ya fue recibida completamente', 400);

    for (const detail of purchase.details) {
      const product = await prisma.product.findUnique({
        where: { id: detail.productId },
        select: { cost: true, margin: true }
      });

      if (product) {
        const currentCost = Number(product.cost);
        const purchaseCost = Number(detail.unitPrice);

        if (purchaseCost > currentCost) {
          const nextSalePrice = this.calculateSalePrice(purchaseCost, Number(product.margin));
          await prisma.product.update({
            where: { id: detail.productId },
            data: {
              cost: purchaseCost,
              salePrice: nextSalePrice
            }
          });
        }
      }

      await stockService.registerMovement({
        productId: detail.productId,
        movementType: 'INCOMING',
        quantity: detail.quantity,
        reference: purchase.purchaseNumber || purchase.id,
        note: 'Recepción completa',
        location: 'GENERAL',
        userId
      });
    }

    const currentBalance = await this.getSupplierBalance(purchase.supplierId);

    await prisma.supplierAccountEntry.create({
      data: {
        supplierId: purchase.supplierId,
        userId,
        entryType: 'CHARGE',
        amount: purchase.total,
        balanceAfter: currentBalance + Number(purchase.total),
        description: `Recepción completa de compra ${purchase.purchaseNumber || purchase.id}`
      }
    });

    return prisma.purchase.update({ where: { id: purchase.id }, data: { status: 'RECEIVED' } });
  }
}

export default new PurchaseService();