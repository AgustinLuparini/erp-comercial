export interface StockMovementCreateDTO {
  productId: string;
  stockId?: string;
  userId?: string;
  movementType: 'INCOMING' | 'OUTGOING' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reference?: string;
  note?: string;
  location?: string;
  targetLocation?: string;
}

export interface StockTransferDTO {
  productId: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  userId?: string;
  reference?: string;
  note?: string;
}

export interface StockAdjustmentDTO {
  productId: string;
  location: string;
  quantity: number;
  userId?: string;
  reference?: string;
  note?: string;
}

export interface StockFilterDTO {
  search?: string;
  supplierId?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}
