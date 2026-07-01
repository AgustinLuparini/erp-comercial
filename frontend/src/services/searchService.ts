import { productService } from './productService';
import { partnerService } from './partnerService';
import { salesService } from './salesService';

export interface GlobalSearchResult {
  type: 'product' | 'customer' | 'supplier' | 'sale';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export const searchService = {
  async search(query: string): Promise<GlobalSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const [products, customers, suppliers, sales] = await Promise.all([
      productService.searchProducts(trimmed, 6).catch(() => []),
      partnerService.getCustomers({ search: trimmed, limit: 6 }).then((data) => data.customers ?? data.data ?? data).catch(() => []),
      partnerService.getSuppliers({ search: trimmed, limit: 6 }).then((data) => data.suppliers ?? data.data ?? data).catch(() => []),
      salesService.getSales({ search: trimmed, limit: 6 }).then((data) => data.sales ?? data.data ?? data).catch(() => [])
    ]);

    return [
      ...(products as any[]).map((product) => ({
        type: 'product' as const,
        id: product.id,
        title: product.name,
        subtitle: product.internalCode,
        href: '/products'
      })),
      ...(customers as any[]).map((customer) => ({
        type: 'customer' as const,
        id: customer.id,
        title: customer.businessName || `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim(),
        subtitle: customer.taxId || customer.dni,
        href: '/partners'
      })),
      ...(suppliers as any[]).map((supplier) => ({
        type: 'supplier' as const,
        id: supplier.id,
        title: supplier.businessName,
        subtitle: supplier.taxId,
        href: '/partners'
      })),
      ...(sales as any[]).map((sale) => ({
        type: 'sale' as const,
        id: sale.id,
        title: sale.invoiceNumber || sale.id,
        subtitle: sale.saleType,
        href: '/sales'
      }))
    ];
  }
};
