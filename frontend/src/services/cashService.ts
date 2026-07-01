import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface CashMovement {
  id: string;
  cashBoxId: string;
  movementType: 'INCOME' | 'EXPENSE';
  amount: number;
  description?: string;
  createdAt: string;
}

export interface CashBox {
  id: string;
  name: string;
  date: string;
  openingBalance: number;
  closingBalance?: number | null;
  status: 'OPEN' | 'CLOSED';
  totals?: { income: number; expense: number };
  expectedBalance?: number;
  movements?: CashMovement[];
}

export const cashService = {
  async list(params: Record<string, unknown> = {}) {
    const response = await axios.get(`${API_URL}/cash`, { params });
    return response.data.data as { cashBoxes: CashBox[]; total: number; page: number; limit: number };
  },
  async getById(id: string) {
    const response = await axios.get(`${API_URL}/cash/${id}`);
    return response.data.data as CashBox;
  },
  async open(data: { name?: string; openingBalance: number; date?: string; notes?: string }) {
    const response = await axios.post(`${API_URL}/cash/open`, data);
    return response.data.data as CashBox;
  },
  async close(id: string, data: { closingBalance?: number; notes?: string } = {}) {
    const response = await axios.post(`${API_URL}/cash/${id}/close`, data);
    return response.data.data as CashBox;
  },
  async recount(id: string, countedAmount: number) {
    const response = await axios.post(`${API_URL}/cash/${id}/recount`, { countedAmount });
    return response.data.data as { expected: number; countedAmount: number; difference: number };
  },
  async income(id: string, data: { amount: number; description?: string }) {
    const response = await axios.post(`${API_URL}/cash/${id}/income`, data);
    return response.data.data as CashMovement;
  },
  async expense(id: string, data: { amount: number; description?: string }) {
    const response = await axios.post(`${API_URL}/cash/${id}/expense`, data);
    return response.data.data as CashMovement;
  },
  async history(id: string) {
    const response = await axios.get(`${API_URL}/cash/${id}/history`);
    return response.data.data as CashMovement[];
  }
};
