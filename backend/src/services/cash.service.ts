import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import type { CashFilterDTO, CashMovementCreateDTO, CloseCashBoxDTO, OpenCashBoxDTO } from '../dtos/cash.dto.js';

const toNumber = (value: unknown) => Number(value ?? 0);

export class CashService {
  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  async open(data: OpenCashBoxDTO, userId?: string) {
    const openedCashBox = await prisma.cashBox.findFirst({
      where: { status: 'OPEN', deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    if (openedCashBox) {
      throw new AppError('Ya existe una caja abierta. Debe cerrarla antes de abrir otra.', 400);
    }

    const cashBox = await prisma.cashBox.create({
      data: {
        name: data.name || 'Caja General',
        date: data.date ? new Date(data.date) : new Date(),
        openingBalance: data.openingBalance,
        status: 'OPEN',
        userId
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CASH_OPEN',
        entity: 'CashBox',
        entityId: cashBox.id, 
        userId,
        afterData: { openingBalance: data.openingBalance }
      }
    });

    return cashBox;
  }

  async close(cashBoxId: string, data: CloseCashBoxDTO, userId?: string) {
    const cashBox = await prisma.cashBox.findFirst({
      where: { id: cashBoxId, deletedAt: null },
      include: { movements: true }
    });

    if (!cashBox) throw new AppError('Caja no encontrada', 404);
    if (cashBox.status !== 'OPEN') throw new AppError('La caja ya está cerrada', 400);

    const totalIncome = cashBox.movements
      .filter((movement: any) => movement.movementType === 'INCOME')
      .reduce((sum: number, movement: any) => sum + toNumber(movement.amount), 0);

    const totalExpense = cashBox.movements
      .filter((movement: any) => movement.movementType === 'EXPENSE')
      .reduce((sum: number, movement: any) => sum + toNumber(movement.amount), 0);

    const expectedClosing = toNumber(cashBox.openingBalance) + totalIncome - totalExpense;
    const effectiveClosingBalance = data.closingBalance ?? expectedClosing;
    const closingDifference = effectiveClosingBalance - expectedClosing;
    const closingDifferenceAmount = Math.abs(closingDifference);
    const closingMovementType = closingDifference > 0 ? 'INCOME' : 'EXPENSE';

    const updated = await prisma.cashBox.update({
      where: { id: cashBoxId },
      data: {
        closingBalance: effectiveClosingBalance,
        status: 'CLOSED'
      }
    });

    await prisma.cashMovement.create({
      data: {
        cashBoxId,
        userId,
        movementType: closingMovementType,
        amount: closingDifferenceAmount,
        description: `Cierre de caja. Esperado: ${expectedClosing.toFixed(2)}. Efectivo contado: ${effectiveClosingBalance.toFixed(2)}. Diferencia: ${closingDifference.toFixed(2)}. ${data.notes ?? ''}`
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CASH_CLOSE',
        entity: 'CashBox',
        entityId: cashBoxId,
        userId,
        afterData: {
          expectedClosing,
          closingBalance: effectiveClosingBalance,
          difference: closingDifference,
          notes: data.notes
        }
      }
    });

    return updated;
  }

  async recount(cashBoxId: string, countedAmount: number, userId?: string) {
    const cashBox = await prisma.cashBox.findFirst({ where: { id: cashBoxId, deletedAt: null } });
    if (!cashBox) throw new AppError('Caja no encontrada', 404);

    const movements = await prisma.cashMovement.findMany({ where: { cashBoxId, deletedAt: null } });
    const income = movements.filter((movement: any) => movement.movementType === 'INCOME').reduce((sum: number, movement: any) => sum + toNumber(movement.amount), 0);
    const expense = movements.filter((movement: any) => movement.movementType === 'EXPENSE').reduce((sum: number, movement: any) => sum + toNumber(movement.amount), 0);
    const expected = toNumber(cashBox.openingBalance) + income - expense;
    const difference = countedAmount - expected;

    await prisma.auditLog.create({
      data: {
        action: 'CASH_RECOUNT',
        entity: 'CashBox',
        entityId: cashBoxId,
        userId,
        afterData: { expected, countedAmount, difference }
      }
    });

    return { expected, countedAmount, difference };
  }

  async addMovement(data: CashMovementCreateDTO) {
    if (!data.cashBoxId) {
      throw new AppError('Debe indicar la caja', 400);
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new AppError('El monto debe ser mayor a cero', 400);
    }

    const cashBox = await prisma.cashBox.findFirst({ where: { id: data.cashBoxId, deletedAt: null } });
    if (!cashBox) throw new AppError('Caja no encontrada', 404);
    if (cashBox.status !== 'OPEN') throw new AppError('La caja está cerrada', 400);

    const movement = await prisma.cashMovement.create({
      data: {
        cashBoxId: data.cashBoxId,
        userId: data.userId,
        movementType: data.movementType,
        amount: data.amount,
        description: data.description
      }
    });

    await prisma.auditLog.create({
      data: {
        action: data.movementType === 'INCOME' ? 'CASH_INCOME' : 'CASH_EXPENSE',
        entity: 'CashMovement',
        entityId: movement.id,
        userId: data.userId,
        afterData: { amount: data.amount, description: data.description }
      }
    });

    return movement;
  }

  async list(filter: CashFilterDTO) {
    const page = this.toPositiveInt(filter.page, 1);
    const limit = this.toPositiveInt(filter.limit, 20);
    const where: any = { deletedAt: null };

    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const [total, cashBoxes] = await Promise.all([
      prisma.cashBox.count({ where }),
      prisma.cashBox.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          movements: { orderBy: { createdAt: 'desc' }, take: 20 }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      total,
      page,
      limit,
      cashBoxes: cashBoxes.map((cashBox: any) => ({
        ...cashBox,
        openingBalance: toNumber(cashBox.openingBalance),
        closingBalance: cashBox.closingBalance === null ? null : toNumber(cashBox.closingBalance),
        movements: cashBox.movements.map((movement: any) => ({ ...movement, amount: toNumber(movement.amount) }))
      }))
    };
  }

  async getById(id: string) {
    const cashBox = await prisma.cashBox.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    if (!cashBox) throw new AppError('Caja no encontrada', 404);

    const totals = cashBox.movements.reduce(
      (accumulator: { income: number; expense: number }, movement: any) => {
        const amount = toNumber(movement.amount);
        if (movement.movementType === 'INCOME') accumulator.income += amount;
        if (movement.movementType === 'EXPENSE') accumulator.expense += amount;
        return accumulator;
      },
      { income: 0, expense: 0 }
    );

    return {
      ...cashBox,
      openingBalance: toNumber(cashBox.openingBalance),
      closingBalance: cashBox.closingBalance === null ? null : toNumber(cashBox.closingBalance),
      totals,
      expectedBalance: toNumber(cashBox.openingBalance) + totals.income - totals.expense,
      movements: cashBox.movements.map((movement: any) => ({ ...movement, amount: toNumber(movement.amount) }))
    };
  }

  async history(cashBoxId: string) {
    const cashBox = await this.getById(cashBoxId);
    return cashBox.movements;
  }
}

export default new CashService();