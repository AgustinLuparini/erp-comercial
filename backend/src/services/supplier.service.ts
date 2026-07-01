import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import type { SupplierAccountEntryCreateDTO, SupplierCreateDTO, SupplierFilterDTO, SupplierUpdateDTO } from '../dtos/supplier.dto.js';

const mapSupplier = (supplier: any) => ({
  ...supplier,
  balance: Number(supplier.balance ?? 0)
});

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

export class SupplierService {
  async create(data: SupplierCreateDTO) {
    const supplier = await prisma.supplier.create({
      data
    });
    return mapSupplier(supplier);
  }

  async list(filter: SupplierFilterDTO) {
    const page = toPositiveInt(filter.page, 1);
    const limit = toPositiveInt(filter.limit, 20);
    const where: any = { deletedAt: null };
    const isActive = toOptionalBoolean(filter.isActive);

    if (isActive !== undefined) where.isActive = isActive;
    if (filter.search) {
      where.OR = [
        { businessName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
        { province: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      total,
      page,
      limit,
      suppliers: suppliers.map(mapSupplier)
    };
  }

  async getById(id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchases: { orderBy: { createdAt: 'desc' }, take: 20 },
        accountEntries: { orderBy: { createdAt: 'desc' }, take: 50 }
      }
    });

    if (!supplier) throw new AppError('Proveedor no encontrado', 404);
    return mapSupplier(supplier);
  }

  async update(data: SupplierUpdateDTO) {
    const { id, ...payload } = data;
    const supplier = await prisma.supplier.update({ where: { id }, data: payload });
    return mapSupplier(supplier);
  }

  async remove(id: string) {
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
    return { success: true };
  }

  async getBalance(id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: { accountEntries: true }
    });
    if (!supplier) throw new AppError('Proveedor no encontrado', 404);

    const balance = supplier.accountEntries.reduce((runningTotal: number, entry: any) => {
      const amount = Number(entry.amount);
      return entry.entryType === 'PAYMENT' ? runningTotal - amount : runningTotal + amount;
    }, 0);

    return { id: supplier.id, balance };
  }

  async getHistory(id: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        purchases: {
          orderBy: { createdAt: 'desc' },
          include: { details: true }
        },
        accountEntries: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!supplier) throw new AppError('Proveedor no encontrado', 404);

    return {
      purchases: supplier.purchases.map((purchase: any) => ({
        id: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        status: purchase.status,
        total: Number(purchase.total),
        createdAt: purchase.createdAt,
        details: purchase.details
      })),
      accountEntries: supplier.accountEntries.map((entry: any) => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: Number(entry.amount),
        balanceAfter: Number(entry.balanceAfter),
        description: entry.description,
        createdAt: entry.createdAt
      }))
    };
  }

  async createAccountEntry(data: SupplierAccountEntryCreateDTO) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, deletedAt: null },
      include: { accountEntries: true }
    });
    if (!supplier) throw new AppError('Proveedor no encontrado', 404);

    const currentBalance = supplier.accountEntries.reduce((runningTotal: number, entry: any) => {
      const amount = Number(entry.amount);
      return entry.entryType === 'PAYMENT' ? runningTotal - amount : runningTotal + amount;
    }, 0);
    const signedAmount = data.entryType === 'PAYMENT' ? -data.amount : data.amount;
    const nextBalance = currentBalance + signedAmount;

    const entry = await prisma.supplierAccountEntry.create({
      data: {
        supplierId: data.supplierId,
        userId: data.userId,
        entryType: data.entryType,
        amount: data.amount,
        balanceAfter: nextBalance,
        description: data.description
      }
    });

    return { ...entry, amount: Number(entry.amount), balanceAfter: Number(entry.balanceAfter) };
  }
}

export default new SupplierService();