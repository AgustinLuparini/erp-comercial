import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../prisma/client.js';

export class ReportService {
  async getDashboardStats() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [products, customers, suppliers, sales, purchases, cashBoxes, saleDetails] = await Promise.all([
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.supplier.count({ where: { deletedAt: null } }),
      prisma.sale.findMany({ where: { deletedAt: null }, select: { total: true, createdAt: true, saleType: true } }),
      prisma.purchase.findMany({ where: { deletedAt: null }, select: { total: true, createdAt: true } }),
      prisma.cashBox.findMany({ where: { deletedAt: null }, include: { movements: true } }),
      prisma.saleDetail.findMany({
        where: { deletedAt: null },
        include: {
          sale: { select: { createdAt: true } },
          product: { select: { id: true, name: true, category: { select: { id: true, name: true } } } }
        }
      })
    ]);

    const salesTotal = sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const purchasesTotal = purchases.reduce((sum: number, purchase: any) => sum + Number(purchase.total), 0);
    const cashIncome = cashBoxes.reduce(
      (sum: number, cashBox: any) => sum + cashBox.movements.filter((movement: any) => movement.movementType === 'INCOME').reduce((subSum: number, movement: any) => subSum + Number(movement.amount), 0),
      0
    );
    const cashExpense = cashBoxes.reduce(
      (sum: number, cashBox: any) => sum + cashBox.movements.filter((movement: any) => movement.movementType === 'EXPENSE').reduce((subSum: number, movement: any) => subSum + Number(movement.amount), 0),
      0
    );
    const cashBalance = cashBoxes.reduce((sum: number, cashBox: any) => sum + Number(cashBox.openingBalance) + (cashBox.closingBalance === null ? 0 : Number(cashBox.closingBalance)), 0);
    const profit = salesTotal - purchasesTotal - cashExpense;

    const salesToday = sales
      .filter((sale: any) => this.isSameDay(new Date(sale.createdAt), today))
      .reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const salesMonth = sales
      .filter((sale: any) => new Date(sale.createdAt) >= monthStart)
      .reduce((sum: number, sale: any) => sum + Number(sale.total), 0);
    const purchasesPending = purchases.filter((purchase: any) => purchase.status === 'PENDING');

    const profitToday = sales
      .filter((sale: any) => this.isSameDay(new Date(sale.createdAt), today))
      .reduce((sum: number, sale: any) => sum + Number(sale.total), 0) -
      purchases
        .filter((purchase: any) => this.isSameDay(new Date(purchase.createdAt), today))
        .reduce((sum: number, purchase: any) => sum + Number(purchase.total), 0);

    const profitMonth = sales
      .filter((sale: any) => new Date(sale.createdAt) >= monthStart)
      .reduce((sum: number, sale: any) => sum + Number(sale.total), 0) -
      purchases
        .filter((purchase: any) => new Date(purchase.createdAt) >= monthStart)
        .reduce((sum: number, purchase: any) => sum + Number(purchase.total), 0) -
      cashExpense;

    const productsWithoutStock = await prisma.product.findMany({
      where: { deletedAt: null, stock: { lte: 0 } },
      select: { id: true, internalCode: true, name: true, stock: true, minStock: true, images: true },
      orderBy: { name: 'asc' }
    });

    const criticalStock = (await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, internalCode: true, name: true, stock: true, minStock: true, images: true },
      orderBy: { stock: 'asc' }
    })).filter((product: any) => product.stock > 0 && product.stock <= product.minStock);

    const debtCustomers = await prisma.customer.findMany({
      where: { deletedAt: null, balance: { gt: 0 } },
      select: { id: true, businessName: true, firstName: true, lastName: true, balance: true, creditLimit: true },
      orderBy: { balance: 'desc' }
    });

    const latestSales = await prisma.sale.findMany({
      where: { deletedAt: null },
      select: { id: true, invoiceNumber: true, total: true, saleType: true, createdAt: true, customer: { select: { businessName: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const topProductsMap = new Map<string, { id: string; name: string; quantity: number; total: number }>();
    saleDetails.forEach((detail: any) => {
      const current = topProductsMap.get(detail.productId) ?? {
        id: detail.product.id,
        name: detail.product.name,
        quantity: 0,
        total: 0
      };
      current.quantity += Number(detail.quantity);
      current.total += Number(detail.total);
      topProductsMap.set(detail.productId, current);
    });

    const topProducts = [...topProductsMap.values()].sort((left, right) => right.quantity - left.quantity).slice(0, 10);

    const salesByCategoryMap = new Map<string, number>();
    saleDetails.forEach((detail: any) => {
      const categoryName = detail.product.category?.name ?? 'Sin categoría';
      salesByCategoryMap.set(categoryName, (salesByCategoryMap.get(categoryName) ?? 0) + Number(detail.total));
    });
    const salesByCategory = [...salesByCategoryMap.entries()].map(([label, value]) => ({ label, value }));

    return {
      totals: {
        products,
        customers,
        suppliers,
        sales: sales.length,
        purchases: purchases.length,
        salesTotal,
        purchasesTotal,
        cashIncome,
        cashExpense,
        cashBalance,
        profit,
        profitability: salesTotal > 0 ? (profit / salesTotal) * 100 : 0
      },
      today: {
        sales: salesToday,
        profit: profitToday
      },
      month: {
        sales: salesMonth,
        profit: profitMonth
      },
      productsWithoutStock: productsWithoutStock.map((product: any) => ({
        id: product.id,
        internalCode: product.internalCode,
        name: product.name,
        stock: product.stock,
        minStock: product.minStock,
        mainImage: product.images?.[0] ?? null
      })),
      criticalStock: criticalStock.map((product: any) => ({
        id: product.id,
        internalCode: product.internalCode,
        name: product.name,
        stock: product.stock,
        minStock: product.minStock,
        mainImage: product.images?.[0] ?? null
      })),
      latestSales: latestSales.map((sale: any) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        saleType: sale.saleType,
        total: Number(sale.total),
        createdAt: sale.createdAt,
        customer: sale.customer
      })),
      debtCustomers: debtCustomers.map((customer: any) => ({
        id: customer.id,
        name: customer.businessName || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(),
        balance: Number(customer.balance),
        creditLimit: Number(customer.creditLimit)
      })),
      pendingPurchases: purchasesPending.map((purchase: any) => ({
        id: purchase.id,
        total: Number(purchase.total),
        createdAt: purchase.createdAt,
        status: purchase.status
      })),
      topProducts,
      salesByDay: this.buildSeries(sales.map((sale: any) => sale.createdAt), sales.map((sale: any) => Number(sale.total))),
      purchasesByDay: this.buildSeries(purchases.map((purchase: any) => purchase.createdAt), purchases.map((purchase: any) => Number(purchase.total))),
      topSalesTypes: this.groupCount(sales.map((sale: any) => sale.saleType)),
      salesByCategory
    };
  }

  async exportReport(reportKey: 'sales' | 'profitability' | 'purchases' | 'products' | 'customers' | 'suppliers' | 'cash', format: 'csv' | 'xlsx' | 'pdf'): Promise<Buffer | string> {
    const rows = await this.getRows(reportKey);
    if (format === 'csv') return this.toCsv(rows);
    if (format === 'xlsx') return this.toXlsx(reportKey, rows);
    return this.toPdf(reportKey, rows);
  }

  async exportSuppliersCsv() {
    return this.exportReport('suppliers', 'csv');
  }

  async exportSuppliersXlsx(): Promise<Buffer> {
    return this.exportReport('suppliers', 'xlsx') as Promise<Buffer>;
  }

  async exportSuppliersPdf(): Promise<Buffer> {
    return this.exportReport('suppliers', 'pdf') as Promise<Buffer>;
  }

  private async getSuppliersWithBalance() {
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { businessName: 'asc' },
      include: { accountEntries: true }
    });

    return suppliers.map((supplier: any) => ({
      ...supplier,
      balance: supplier.accountEntries.reduce((runningTotal: number, entry: any) => {
        const amount = Number(entry.amount);
        return entry.entryType === 'PAYMENT' ? runningTotal - amount : runningTotal + amount;
      }, 0)
    }));
  }

  private async getRows(reportKey: 'sales' | 'profitability' | 'purchases' | 'products' | 'customers' | 'suppliers' | 'cash') {
    switch (reportKey) {
      case 'sales': {
        const sales = await prisma.sale.findMany({ include: { customer: true, seller: true }, orderBy: { createdAt: 'desc' } });
        return sales.map((sale: any) => ({
          id: sale.id,
          invoiceNumber: sale.invoiceNumber ?? '',
          saleType: sale.saleType,
          paymentMethod: sale.paymentMethod,
          customer: sale.customer?.businessName ?? '',
          seller: sale.seller?.firstName ?? sale.seller?.email ?? '',
          total: Number(sale.total),
          createdAt: sale.createdAt.toISOString()
        }));
      }
      case 'profitability': {
        const stats = await this.getDashboardStats();
        return [
          { metric: 'Ventas', value: stats.totals.salesTotal },
          { metric: 'Compras', value: stats.totals.purchasesTotal },
          { metric: 'Egresos caja', value: stats.totals.cashExpense },
          { metric: 'Ganancia', value: stats.totals.profit },
          { metric: 'Rentabilidad %', value: stats.totals.profitability }
        ];
      }
      case 'purchases': {
        const purchases = await prisma.purchase.findMany({ include: { supplier: true }, orderBy: { createdAt: 'desc' } });
        return purchases.map((purchase: any) => ({
          id: purchase.id,
          supplier: purchase.supplier.businessName,
          status: purchase.status,
          total: Number(purchase.total),
          createdAt: purchase.createdAt.toISOString()
        }));
      }
      case 'products': {
        const products = await prisma.product.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
        return products.map((product: any) => ({
          id: product.id,
          internalCode: product.internalCode,
          name: product.name,
          stock: product.stock,
          salePrice: Number(product.salePrice),
          cost: Number(product.cost),
          margin: product.margin
        }));
      }
      case 'customers': {
        const customers = await prisma.customer.findMany({ where: { deletedAt: null }, orderBy: { businessName: 'asc' } });
        return customers.map((customer: any) => ({
          id: customer.id,
          name: customer.businessName || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(),
          balance: Number(customer.balance),
          creditLimit: Number(customer.creditLimit),
          active: customer.isActive
        }));
      }
      case 'suppliers':
        return this.getSuppliersWithBalance();
      case 'cash': {
        const cashBoxes = await prisma.cashBox.findMany({ include: { movements: true }, orderBy: { createdAt: 'desc' } });
        return cashBoxes.map((cashBox: any) => ({
          id: cashBox.id,
          name: cashBox.name,
          status: cashBox.status,
          openingBalance: Number(cashBox.openingBalance),
          closingBalance: cashBox.closingBalance === null ? '' : Number(cashBox.closingBalance),
          movements: cashBox.movements.length
        }));
      }
    }
  }

  private toCsv(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return '';
    const header = Object.keys(rows[0]).join(',');
    const body = rows.map((row: Record<string, unknown>) => Object.values(row).map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    return [header, body].join('\n');
  }

  private async toXlsx(sheetName: string, rows: Array<Record<string, unknown>>) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    const headers = Object.keys(rows[0] ?? { empty: '' });
    sheet.columns = headers.map((header) => ({ header, key: header, width: 24 }));
    rows.forEach((row: Record<string, unknown>) => sheet.addRow(row));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async toPdf(title: string, rows: Array<Record<string, unknown>>) {
    return await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text(`Reporte ${title}`, { align: 'center' });
      doc.moveDown();
      rows.forEach((row: Record<string, unknown>) => {
        doc.fontSize(10).text(Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | '));
        doc.moveDown(0.3);
      });
      doc.end();
    });
  }

  private buildSeries(dates: Date[], values: number[]) {
    const aggregated = new Map<string, number>();
    dates.forEach((date: Date, index: number) => {
      const key = date.toISOString().slice(0, 10);
      aggregated.set(key, (aggregated.get(key) ?? 0) + (values[index] ?? 0));
    });
    return [...aggregated.entries()].map(([label, value]: [string, number]) => ({ label, value }));
  }

  private groupCount(values: string[]) {
    const counts = new Map<string, number>();
    values.forEach((value: string) => counts.set(value, (counts.get(value) ?? 0) + 1));
    return [...counts.entries()].map(([label, value]: [string, number]) => ({ label, value }));
  }

  private isSameDay(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }
}

export default new ReportService();