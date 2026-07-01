export interface SupplierCreateDTO {
  businessName: string;
  taxId: string;
  address?: string;
  city?: string;
  province?: string;
  email?: string;
  phone?: string;
  contact?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SupplierUpdateDTO extends Partial<SupplierCreateDTO> {
  id: string;
}

export interface SupplierFilterDTO {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface SupplierAccountEntryCreateDTO {
  supplierId: string;
  entryType: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  description?: string;
  userId?: string;
}
