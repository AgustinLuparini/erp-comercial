export interface SaleItemDTO {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  saleUnit?: 'UNIDAD' | 'GR';
}

export interface CreateSaleDTO {
  customerId?: string;
  saleType: 'FAC' | 'REMITO' | 'TICKET' | 'PRESUPUESTO';
  paymentMethod: 'CASH' | 'TRANSFER' | 'QR' | 'DEBIT' | 'CREDIT' | 'ACCOUNT';
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  items: SaleItemDTO[];
  allowPriceOverride?: boolean;
}

export interface SaleFilterDTO {
  customerId?: string;
  saleType?: 'FAC' | 'REMITO' | 'TICKET' | 'PRESUPUESTO';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'QR' | 'DEBIT' | 'CREDIT' | 'ACCOUNT';
  search?: string;
  page?: number;
  limit?: number;
}
