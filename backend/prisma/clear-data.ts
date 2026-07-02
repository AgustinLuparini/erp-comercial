import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.promotionProduct.deleteMany();
    await tx.saleDetail.deleteMany();
    await tx.purchaseDetail.deleteMany();
    await tx.stockMovement.deleteMany();
    await tx.cashMovement.deleteMany();
    await tx.customerAccountEntry.deleteMany();
    await tx.supplierAccountEntry.deleteMany();

    await tx.sale.deleteMany();
    await tx.purchase.deleteMany();
    await tx.stock.deleteMany();
    await tx.promotion.deleteMany();
    await tx.cashBox.deleteMany();

    await tx.product.deleteMany();
    await tx.customer.deleteMany();
    await tx.supplier.deleteMany();

    await tx.auditLog.deleteMany();
    await tx.appLog.deleteMany();
    await tx.loginAudit.deleteMany();
    await tx.passwordResetToken.deleteMany();
    await tx.refreshToken.deleteMany();
  });

  console.log('Base de datos limpiada: se eliminaron datos operativos y maestros comerciales.');
  console.log('Se conservaron usuarios, roles y permisos para mantener acceso al sistema.');
}

main()
  .catch((error) => {
    console.error('Error al limpiar base de datos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
