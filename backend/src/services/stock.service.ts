import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import type { StockAdjustmentDTO, StockFilterDTO, StockMovementCreateDTO, StockTransferDTO } from '../dtos/stock.dto.js';

const mapDecimal = (value: unknown) => Number(value ?? 0);

export class StockService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  private async refreshProductStock(productId: string) {
    const stocks = await prisma.stock.findMany({
      where: { productId, deletedAt: null },
      select: { quantity: true }
    });

    const totalQuantity = stocks.reduce((runningTotal: number, stock: { quantity: number }) => runningTotal + stock.quantity, 0);

    await prisma.product.update({
      where: { id: productId },
      data: { stock: totalQuantity }
    });

    return totalQuantity;
  }

  async ensureStock(productId: string, location: string) {
    const stock = await prisma.stock.findUnique({
      where: { productId_location: { productId, location } }
    }).catch(() => null);

    if (stock) {
      // Si existe pero está eliminado lógicamente, reactivarlo para que vuelva a computar en el total.
      if (stock.deletedAt) {
        return prisma.stock.update({
          where: { id: stock.id },
          data: { deletedAt: null }
        });
      }

      return stock;
    }

    return prisma.stock.create({
      data: {
        productId,
        location,
        quantity: 0
      }
    });
  }

  async list(filter: StockFilterDTO) {
    const page = this.toPositiveInt(filter.page, 1);
    const limit = this.toPositiveInt(filter.limit, 20);
    const where: any = { deletedAt: null };

    if (filter.supplierId) where.product = { supplierId: filter.supplierId };
    if (filter.search) {
      where.OR = [
        { product: { name: { contains: filter.search, mode: 'insensitive' } } },
        { product: { internalCode: { contains: filter.search, mode: 'insensitive' } } },
        { product: { barcode: { contains: filter.search, mode: 'insensitive' } } },
        { location: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, stocks] = await Promise.all([
      prisma.stock.count({ where }),
      prisma.stock.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              internalCode: true,
              name: true,
              stock: true,
              minStock: true,
              maxStock: true,
              fechaVencimiento: true,
              unidadMedida: true,
              alergenos: true,
              supplier: { select: { id: true, businessName: true } }
            }
          },
          movements: { orderBy: { createdAt: 'desc' }, take: 10 }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return { total, page, limit, stocks };
  }

  async history(productId: string) {
    const movements = await prisma.stockMovement.findMany({
      where: { productId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, internalCode: true, name: true } },
        stock: { select: { id: true, location: true, quantity: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } }
      }
    });

    return movements.map((movement: any) => ({
      ...movement,
      quantity: Number(movement.quantity)
    }));
  }

  async getAlerts() {
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() + 30);

    const stocks = await prisma.stock.findMany({
      where: { deletedAt: null },
      include: {
        product: {
          select: {
            id: true,
            internalCode: true,
            name: true,
            stock: true,
            minStock: true,
            fechaVencimiento: true,
            supplier: { select: { id: true, businessName: true } }
          }
        }
      }
    });

    const alertItems = stocks
      .map((stock: any) => {
        const lowStock = stock.product.stock < stock.product.minStock;
        const expiryDate = stock.product.fechaVencimiento ? new Date(stock.product.fechaVencimiento) : null;
        const expiringSoon = Boolean(expiryDate && expiryDate >= now && expiryDate <= thresholdDate);
        const daysToExpire = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

        if (!lowStock && !expiringSoon) return null;

        return {
          ...stock,
          alertTypes: [lowStock ? 'LOW_STOCK' : null, expiringSoon ? 'EXPIRING_SOON' : null].filter(Boolean),
          daysToExpire
        };
      })
      .filter(Boolean);

    const lowStockCount = alertItems.filter((item: any) => item.alertTypes.includes('LOW_STOCK')).length;
    const expiringSoonCount = alertItems.filter((item: any) => item.alertTypes.includes('EXPIRING_SOON')).length;

    return {
      totalAlerts: alertItems.length,
      lowStockCount,
      expiringSoonCount,
      items: alertItems
    };
  }

  async registerMovement(data: StockMovementCreateDTO) {
    const location = data.location || 'GENERAL';
    const stock = await this.ensureStock(data.productId, location);
    const quantity = data.quantity;

    let nextQuantity = stock.quantity;
    if (data.movementType === 'INCOMING') nextQuantity += quantity;
    if (data.movementType === 'OUTGOING') nextQuantity -= quantity;
    if (data.movementType === 'ADJUSTMENT') nextQuantity = quantity;

    if (nextQuantity < 0) throw new AppError('Stock insuficiente', 400);

    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: { quantity: nextQuantity }
    });

    const movement = await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        stockId: updatedStock.id,
        userId: data.userId,
        movementType: data.movementType,
        quantity,
        reference: data.reference,
        note: data.note
      }
    });

    await this.refreshProductStock(data.productId);

    return { ...movement, quantity: mapDecimal(movement.quantity) };
  }

  async transfer(data: StockTransferDTO) {
    const fromStock = await this.ensureStock(data.productId, data.fromLocation);
    const toStock = await this.ensureStock(data.productId, data.toLocation);

    if (fromStock.quantity < data.quantity) throw new AppError('Stock insuficiente para transferir', 400);

    await prisma.stock.update({ where: { id: fromStock.id }, data: { quantity: fromStock.quantity - data.quantity } });
    await prisma.stock.update({ where: { id: toStock.id }, data: { quantity: toStock.quantity + data.quantity } });

    const movement = await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        stockId: fromStock.id,
        userId: data.userId,
        movementType: 'TRANSFER',
        quantity: data.quantity,
        reference: data.reference,
        note: data.note
      }
    });

    await this.refreshProductStock(data.productId);

    return movement;
  }

  async adjust(data: StockAdjustmentDTO) {
    const stock = await this.ensureStock(data.productId, data.location);
    const updatedStock = await prisma.stock.update({
      where: { id: stock.id },
      data: { quantity: data.quantity }
    });

    await prisma.stockMovement.create({
      data: {
        productId: data.productId,
        stockId: updatedStock.id,
        userId: data.userId,
        movementType: 'ADJUSTMENT',
        quantity: data.quantity,
        reference: data.reference,
        note: data.note
      }
    });

    await this.refreshProductStock(data.productId);

    return { success: true };
  }
}

export default new StockService();