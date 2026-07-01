export type CustomerType = 'PERSONA_HUMANA' | 'EMPRESA';

export type LegalEntityType =
  | 'PERSONA_HUMANA'
  | 'SAS'
  | 'SRL'
  | 'SA'
  | 'SAU'
  | 'COOPERATIVA'
  | 'ASOCIACION_CIVIL'
  | 'FUNDACION'
  | 'OTRO';

export type VatCondition =
  | 'CONSUMIDOR_FINAL'
  | 'MONOTRIBUTISTA'
  | 'RESPONSABLE_INSCRIPTO'
  | 'EXENTO'
  | 'NO_RESPONSABLE'
  | 'MONOTRIBUTO_SOCIAL';

export interface CustomerCreateDTO {
  customerType?: CustomerType;
  legalEntityType?: LegalEntityType;
  vatCondition?: VatCondition;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  taxId?: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  creditLimit?: number;
  discount?: number;
  balance?: number;
  isActive?: boolean;
}

export interface CustomerUpdateDTO extends Partial<CustomerCreateDTO> {
  id: string;
}

export interface CustomerFilterDTO {
  search?: string;
  customerType?: CustomerType;
  isActive?: boolean;
  minBalance?: number;
  maxBalance?: number;
  page?: number;
  limit?: number;
}

export interface CustomerAccountEntryCreateDTO {
  customerId: string;
  entryType: 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  description?: string;
  userId?: string;
}
