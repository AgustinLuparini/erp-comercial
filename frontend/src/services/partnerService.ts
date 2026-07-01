import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

export interface Customer {
  id: string;
  customerType: CustomerType;
  legalEntityType: LegalEntityType;
  vatCondition: VatCondition;
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
  creditLimit: number;
  discount: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  businessName: string;
  taxId: string;
  address?: string;
  city?: string;
  province?: string;
  email?: string;
  phone?: string;
  contact?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const partnerService = {
  async getCustomers(params: Record<string, unknown> = {}) {
    const response = await axios.get(`${API_URL}/customers`, { params });
    return response.data.data;
  },
  async getSuppliers(params: Record<string, unknown> = {}) {
    const response = await axios.get(`${API_URL}/suppliers`, { params });
    return response.data.data;
  },
  async createCustomer(data: Partial<Customer>) {
    const response = await axios.post(`${API_URL}/customers`, data);
    return response.data.data as Customer;
  },
  async createSupplier(data: Partial<Supplier>) {
    const response = await axios.post(`${API_URL}/suppliers`, data);
    return response.data.data as Supplier;
  },
  async updateCustomer(id: string, data: Partial<Customer>) {
    const response = await axios.put(`${API_URL}/customers/${id}`, data);
    return response.data.data as Customer;
  },
  async updateSupplier(id: string, data: Partial<Supplier>) {
    const response = await axios.put(`${API_URL}/suppliers/${id}`, data);
    return response.data.data as Supplier;
  },
  async deleteCustomer(id: string) {
    await axios.delete(`${API_URL}/customers/${id}`);
  },
  async deleteSupplier(id: string) {
    await axios.delete(`${API_URL}/suppliers/${id}`);
  },
  async exportSuppliersCsv() {
    const response = await axios.get(`${API_URL}/reports/suppliers.csv`, { responseType: 'blob' });
    return response.data;
  },
  async exportSuppliersXlsx() {
    const response = await axios.get(`${API_URL}/reports/suppliers.xlsx`, { responseType: 'blob' });
    return response.data;
  },
  async exportSuppliersPdf() {
    const response = await axios.get(`${API_URL}/reports/suppliers.pdf`, { responseType: 'blob' });
    return response.data;
  }
};
