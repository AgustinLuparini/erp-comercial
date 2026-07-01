import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import type { CreateSaleDTO, SaleFilterDTO } from '../dtos/sale.dto.js';
import type { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';

const privilegedRoles = ['ADMIN', 'GERENTE'];
const businessName = process.env.BUSINESS_NAME?.trim() || 'ERP Comercial';

const toNumber = (value: unknown) => Number(value ?? 0);

export class SaleService {
  private async getSaleForTicket(saleId: string) {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, deletedAt: null },
      include: {
        customer: true,
        seller: { select: { id: true, email: true, firstName: true, lastName: true } },
        details: {
          include: {
            product: { select: { id: true, internalCode: true, name: true } }
          }
        }
      }
    });

    if (!sale) throw new AppError('Venta no encontrada', 404);

    return sale;
  }

  private formatSaleDate(date: Date) {
    return new Date(date).toLocaleString('es-AR');
  }

  private resolveSaleCustomerLabel(sale: Awaited<ReturnType<SaleService['getSaleForTicket']>>) {
    return sale.customer?.businessName || sale.customer?.firstName || 'Consumidor Final';
  }

  private resolveSellerLabel(sale: Awaited<ReturnType<SaleService['getSaleForTicket']>>) {
    return sale.seller?.firstName || sale.seller?.email || '-';
  }

  private resolveTicketFileName(saleType: string, saleId: string) {
    const prefixMap: Record<string, string> = {
      TICKET: 'Ticket',
      FAC: 'Factura',
      REMITO: 'Remito',
      PRESUPUESTO: 'Presupuesto'
    };

    const prefix = prefixMap[saleType] || 'Venta';
    return `${prefix}-${saleId}.pdf`;
  }

  private async buildTicketHtml(saleId: string) {
    const sale = await this.getSaleForTicket(saleId);

    const rows = sale.details
      .map(
        (detail: (typeof sale.details)[number]) => `
          <tr>
            <td class="col-code">${detail.product.internalCode}</td>
            <td class="col-product">${detail.product.name}</td>
            <td class="col-qty">${detail.quantity}</td>
            <td class="col-unit">${Number(detail.unitPrice).toFixed(2)}</td>
            <td class="col-total">${Number(detail.total).toFixed(2)}</td>
          </tr>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ticket ${sale.id}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 18px;
            background: #f7f7f7;
            color: #111;
          }
          .invoice {
            max-width: 760px;
            margin: 0 auto;
            background: #fff;
            border: 2px solid #111;
            padding: 14px;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #111;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .title-row h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1;
          }
          .doc-type {
            text-align: right;
          }
          .doc-type .main {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.05em;
          }
          .doc-type .sub {
            font-size: 13px;
          }
          .info-box {
            border: 1px solid #111;
            padding: 8px 10px;
            margin-bottom: 12px;
          }
          .info-row {
            display: flex;
            gap: 14px;
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
          }
          .info-label {
            min-width: 68px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #111;
          }
          th, td {
            border: 1px solid #111;
            padding: 8px 10px;
            font-size: 13px;
          }
          th {
            background: #f0f0f0;
            text-align: left;
            font-size: 12px;
            letter-spacing: 0.03em;
          }
          .col-code { width: 14%; }
          .col-product { width: 34%; }
          .col-qty { width: 14%; text-align: right; }
          .col-unit { width: 19%; text-align: right; }
          .col-total { width: 19%; text-align: right; }
          .summary {
            margin-top: 12px;
            border: 1px solid #111;
            padding: 8px 10px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            line-height: 1.6;
          }
          .summary-total {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #111;
            font-size: 20px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <section class="invoice">
          <div class="title-row">
            <h1>${businessName}</h1>
            <div class="doc-type">
              <div class="main">${sale.saleType}</div>
              <div class="sub">Nro: ${sale.id}</div>
            </div>
          </div>

          <div class="info-box">
              <p class="info-row"><span class="info-label">Fecha:</span> <span>${this.formatSaleDate(sale.createdAt)}</span></p>
              <p class="info-row"><span class="info-label">Cliente:</span> <span>${this.resolveSaleCustomerLabel(sale)}</span></p>
              <p class="info-row"><span class="info-label">Vendedor:</span> <span>${this.resolveSellerLabel(sale)}</span></p>
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-code">COD</th>
                <th class="col-product">DESCRIPCION</th>
                <th class="col-qty">CANT.</th>
                <th class="col-unit">P. UNITARIO</th>
                <th class="col-total">IMPORTE</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>Subtotal</span><span>${Number(sale.subtotal).toFixed(2)}</span></div>
            <div class="summary-row"><span>Descuento</span><span>${Number(sale.discount).toFixed(2)}</span></div>
            <div class="summary-row"><span>IVA</span><span>${Number(sale.tax).toFixed(2)}</span></div>
            <div class="summary-row summary-total"><span>TOTAL</span><span>${Number(sale.total).toFixed(2)}</span></div>
          </div>
        </section>
      </body>
      </html>
    `;
  }

  async buildTicketPdf(saleId: string): Promise<{ buffer: Buffer; fileName: string }> {
    const sale = await this.getSaleForTicket(saleId);
    const fileName = this.resolveTicketFileName(sale.saleType, sale.id);

    const pageWidth = 796;
    const pageHeight = 1123;
    const bodyPadding = 18;
    const invoiceX = bodyPadding;
    const invoiceY = bodyPadding;
    const invoiceWidth = 760;

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
      autoFirstPage: true
    });

    const chunks: Buffer[] = [];

    return await new Promise<{ buffer: Buffer; fileName: string }>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), fileName }));
      doc.on('error', reject);

      // Background similar to current HTML body
      doc.rect(0, 0, pageWidth, pageHeight).fill('#f7f7f7');

      // Main invoice box
      const strokeColor = '#111111';
      doc.lineWidth(2).strokeColor(strokeColor).rect(invoiceX, invoiceY, invoiceWidth, 440).stroke();

      let cursorY = invoiceY + 14;

      // Header row
      doc.font('Helvetica-Bold').fillColor('#111111').fontSize(43).text(businessName, invoiceX + 14, cursorY, {
        width: 380,
        align: 'left'
      });
      doc.font('Helvetica-Bold').fontSize(38).text(String(sale.saleType), invoiceX + 430, cursorY + 2, {
        width: invoiceWidth - 444,
        align: 'right'
      });
      doc.font('Helvetica').fontSize(13).text(`Nro: ${sale.id}`, invoiceX + 430, cursorY + 48, {
        width: invoiceWidth - 444,
        align: 'right'
      });

      cursorY += 72;
      doc.lineWidth(2).moveTo(invoiceX + 14, cursorY).lineTo(invoiceX + invoiceWidth - 14, cursorY).stroke();
      cursorY += 10;

      // Info box
      const infoX = invoiceX + 14;
      const infoW = invoiceWidth - 28;
      const infoH = 80;
      doc.lineWidth(1).rect(infoX, cursorY, infoW, infoH).stroke();

      const infoRows = [
        ['Fecha:', this.formatSaleDate(sale.createdAt)],
        ['Cliente:', this.resolveSaleCustomerLabel(sale)],
        ['Vendedor:', this.resolveSellerLabel(sale)]
      ];

      let infoY = cursorY + 11;
      infoRows.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').fontSize(14).text(label, infoX + 10, infoY, { width: 75, align: 'left' });
        doc.font('Helvetica').fontSize(14).text(value, infoX + 85, infoY, { width: infoW - 95, align: 'left' });
        infoY += 25;
      });

      cursorY += infoH + 12;

      // Table
      const tableX = invoiceX + 14;
      const tableW = invoiceWidth - 28;
      const colRatios = [0.14, 0.34, 0.14, 0.19, 0.19];
      const colWidths = colRatios.map((ratio) => tableW * ratio);
      const rowH = 30;

      const drawTableRow = (y: number, values: string[], isHeader = false) => {
        let colX = tableX;
        for (let index = 0; index < colWidths.length; index += 1) {
          const width = colWidths[index];
          if (isHeader) {
            doc.rect(colX, y, width, rowH).fill('#f0f0f0').stroke('#111111');
          } else {
            doc.rect(colX, y, width, rowH).stroke('#111111');
          }

          doc
            .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(isHeader ? 12 : 13)
            .fillColor('#111111')
            .text(values[index] || '', colX + 8, y + 9, {
              width: width - 16,
              align: index >= 2 ? 'right' : 'left',
              ellipsis: true
            });
          colX += width;
        }
      };

      drawTableRow(cursorY, ['COD', 'DESCRIPCION', 'CANT.', 'P. UNITARIO', 'IMPORTE'], true);
      cursorY += rowH;

      sale.details.forEach((detail: (typeof sale.details)[number]) => {
        drawTableRow(cursorY, [
          detail.product.internalCode,
          detail.product.name,
          String(detail.quantity),
          Number(detail.unitPrice).toFixed(2),
          Number(detail.total).toFixed(2)
        ]);
        cursorY += rowH;
      });

      // Summary
      cursorY += 12;
      const summaryX = invoiceX + 14;
      const summaryW = invoiceWidth - 28;
      const summaryH = 140;
      doc.rect(summaryX, cursorY, summaryW, summaryH).stroke('#111111');

      const summaryRows = [
        ['Subtotal', Number(sale.subtotal).toFixed(2)],
        ['Descuento', Number(sale.discount).toFixed(2)],
        ['IVA', Number(sale.tax).toFixed(2)]
      ];

      let summaryY = cursorY + 14;
      summaryRows.forEach(([label, value]) => {
        doc.font('Helvetica').fontSize(14).text(label, summaryX + 10, summaryY, { width: 170, align: 'left' });
        doc.font('Helvetica').fontSize(14).text(value, summaryX + summaryW - 140, summaryY, { width: 130, align: 'right' });
        summaryY += 26;
      });

      doc.moveTo(summaryX + 8, summaryY + 4).lineTo(summaryX + summaryW - 8, summaryY + 4).stroke('#111111');
      doc.font('Helvetica-Bold').fontSize(30).text('TOTAL', summaryX + 10, summaryY + 16, { width: 220, align: 'left' });
      doc
        .font('Helvetica-Bold')
        .fontSize(30)
        .text(Number(sale.total).toFixed(2), summaryX + summaryW - 260, summaryY + 16, { width: 250, align: 'right' });

      // Resize outer border height to content, preserving the current ticket look.
      const finalHeight = Math.max(400, cursorY + summaryH + 14 - invoiceY);
      doc.lineWidth(2).rect(invoiceX, invoiceY, invoiceWidth, finalHeight).stroke('#111111');

      doc.end();
    });
  }

  async confirmSale(data: CreateSaleDTO, userId?: string, role?: string) {
    if (!data.items.length) throw new AppError('La venta debe tener productos', 400);

    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let saleCustomer: { id: string; businessName: string | null; firstName: string | null; lastName: string | null; balance: Prisma.Decimal } | null = null;
      const requiresOpenCashBox = data.saleType !== 'PRESUPUESTO';

      const openedCashBox = requiresOpenCashBox
        ? await tx.cashBox.findFirst({
            where: { status: 'OPEN', deletedAt: null },
            orderBy: { createdAt: 'desc' }
          })
        : null;

      if (requiresOpenCashBox && !openedCashBox) {
        throw new AppError('Debe abrir la caja antes de registrar una venta', 400);
      }

      if (data.customerId) {
        saleCustomer = await tx.customer.findFirst({
          where: { id: data.customerId, deletedAt: null },
          select: { id: true, businessName: true, firstName: true, lastName: true, balance: true }
        });

        if (!saleCustomer) throw new AppError('Cliente no encontrado', 404);
      }

      const saleCustomerLabel =
        saleCustomer?.businessName?.trim() ||
        `${saleCustomer?.firstName ?? ''} ${saleCustomer?.lastName ?? ''}`.trim() ||
        'Consumidor final';

      const saleRecord = await tx.sale.create({
        data: {
          customerId: data.customerId,
          userId,
          saleType: data.saleType,
          status: data.saleType === 'PRESUPUESTO' ? 'PENDING' : 'COMPLETED',
          paymentMethod: data.paymentMethod,
          subtotal: data.subtotal,
          discount: data.discount ?? 0,
          tax: data.tax ?? 0,
          total: data.total,
          notes: data.notes,
          details: { create: [] }
        }
      });

      for (const item of data.items) {
        const product = await tx.product.findFirst({ where: { id: item.productId, deletedAt: null } });
        if (!product) throw new AppError(`Producto no encontrado: ${item.productId}`, 404);

        const unitPrice = data.allowPriceOverride && privilegedRoles.includes(role || '') && item.unitPrice !== undefined ? item.unitPrice : toNumber(product.salePrice);

        const lineTotal = (unitPrice * item.quantity) - (item.discount ?? 0) + (item.tax ?? 0);

        const stocks = await tx.stock.findMany({
          where: {
            productId: product.id,
            deletedAt: null,
            quantity: { gt: 0 }
          }
        });

        const orderedStocks = stocks.sort((a, b) => {
          if (a.location === 'GENERAL' && b.location !== 'GENERAL') return -1;
          if (a.location !== 'GENERAL' && b.location === 'GENERAL') return 1;
          return a.location.localeCompare(b.location);
        });

        const totalAvailable = orderedStocks.reduce((sum, currentStock) => sum + currentStock.quantity, 0);
        if (totalAvailable < item.quantity) {
          throw new AppError(`Stock insuficiente para ${product.name}`, 400);
        }

        let remainingQuantity = item.quantity;
        for (const stock of orderedStocks) {
          if (remainingQuantity <= 0) break;

          const movementQuantity = Math.min(remainingQuantity, stock.quantity);
          const updatedStock = await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: stock.quantity - movementQuantity }
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              stockId: updatedStock.id,
              userId,
              movementType: 'OUTGOING',
              quantity: movementQuantity,
              reference: saleRecord.id,
              note: `Venta - ${saleCustomerLabel}`
            }
          });

          remainingQuantity -= movementQuantity;
        }

        await tx.saleDetail.create({
          data: {
            saleId: saleRecord.id,
            productId: product.id,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice,
            discount: item.discount ?? 0,
            tax: item.tax ?? 0,
            total: lineTotal
          }
        });

        const totalStock = await tx.stock.findMany({
          where: { productId: product.id, deletedAt: null },
          select: { quantity: true }
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: totalStock.reduce((runningTotal: number, currentStock: { quantity: number }) => runningTotal + currentStock.quantity, 0)
          }
        });
      }

      if (data.paymentMethod === 'CASH' && openedCashBox) {
        await tx.cashMovement.create({
          data: {
            cashBoxId: openedCashBox.id,
            userId,
            movementType: 'INCOME',
            amount: data.total,
            description: `Ingreso por venta ${saleRecord.id} - ${saleCustomerLabel} - Efectivo`
          }
        });
      }

      if (data.paymentMethod === 'ACCOUNT') {
        if (!data.customerId) throw new AppError('Cliente requerido para cuenta corriente', 400);
        const customer = saleCustomer;
        if (!customer) throw new AppError('Cliente no encontrado', 404);

        const nextBalance = Number(customer.balance) + data.total;
        await tx.customerAccountEntry.create({
          data: {
            customerId: data.customerId,
            userId,
            entryType: 'CHARGE',
            amount: data.total,
            balanceAfter: nextBalance,
            description: `Venta ${saleRecord.id}`
          }
        });

        await tx.customer.update({
          where: { id: data.customerId },
          data: { balance: nextBalance }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'SALE_CONFIRM',
          entity: 'Sale',
          entityId: saleRecord.id,
          userId,
          afterData: {
            saleType: data.saleType,
            paymentMethod: data.paymentMethod,
            total: data.total,
            items: data.items.length
          }
        }
      });

      return saleRecord;
    });

    return prisma.sale.findFirst({
      where: { id: sale.id },
      include: {
        customer: true,
        seller: { select: { id: true, email: true, firstName: true, lastName: true } },
        details: { include: { product: { select: { id: true, internalCode: true, name: true } } } }
      }
    });
  }

  async list(filter: SaleFilterDTO) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const where: any = { deletedAt: null };

    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.saleType) where.saleType = filter.saleType;
    if (filter.paymentMethod) where.paymentMethod = filter.paymentMethod;
    if (filter.search) {
      where.OR = [
        { invoiceNumber: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } }
      ];
    }

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, businessName: true, firstName: true, lastName: true } },
          seller: { select: { id: true, email: true, firstName: true, lastName: true } },
          details: { include: { product: { select: { id: true, internalCode: true, name: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return { total, page, limit, sales };
  }

  async ticket(saleId: string) {
    return this.buildTicketHtml(saleId);
  }
}

export default new SaleService();