export interface PurchaseDetailDTO {
  productId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface CreatePurchaseDTO {
  supplierId: string;
  userId?: string;
  purchaseNumber?: string;
  status?: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  details: PurchaseDetailDTO[];
}

export interface PurchaseFilterDTO {
  supplierId?: string;
  status?: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReceivePurchaseDTO {
  purchaseId: string;
  receivedAt?: string;
  notes?: string;
  details: Array<{
    productId: string;
    quantityReceived: number;
    location?: string;
  }>;
}
