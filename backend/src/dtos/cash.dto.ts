export interface OpenCashBoxDTO {
  name?: string;
  openingBalance: number;
  date?: string;
  notes?: string;
}

export interface CashMovementCreateDTO {
  cashBoxId: string;
  amount: number;
  description?: string;
  movementType: 'INCOME' | 'EXPENSE';
  userId?: string;
}

export interface CloseCashBoxDTO {
  closingBalance?: number;
  notes?: string;
}

export interface CashFilterDTO {
  search?: string;
  status?: 'OPEN' | 'CLOSED';
  page?: number;
  limit?: number;
}
