import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface DashboardStats {
  totals: {
    products: number;
    customers: number;
    suppliers: number;
    sales: number;
    purchases: number;
    salesTotal: number;
    purchasesTotal: number;
    cashIncome: number;
    cashExpense: number;
    cashBalance: number;
    profit: number;
    profitability: number;
  };
  today: {
    sales: number;
    profit: number;
  };
  month: {
    sales: number;
    profit: number;
  };
  productsWithoutStock: Array<{ id: string; internalCode: string; name: string; stock: number; minStock: number; mainImage?: string | null }>;
  criticalStock: Array<{ id: string; internalCode: string; name: string; stock: number; minStock: number; mainImage?: string | null }>;
  latestSales: Array<{
    id: string;
    invoiceNumber?: string | null;
    saleType: string;
    total: number;
    createdAt: string;
    customer?: {
      businessName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  }>;
  debtCustomers: Array<{ id: string; name: string; balance: number; creditLimit: number }>;
  pendingPurchases: Array<{ id: string; total: number; createdAt: string; status: string }>;
  topProducts: Array<{ id: string; name: string; quantity: number; total: number }>;
  salesByDay: Array<{ label: string; value: number }>;
  purchasesByDay: Array<{ label: string; value: number }>;
  topSalesTypes: Array<{ label: string; value: number }>;
  salesByCategory: Array<{ label: string; value: number }>;
}

export const reportService = {
  async getDashboard() {
    const response = await axios.get(`${API_URL}/reports/dashboard`);
    return response.data.data as DashboardStats;
  },
  async exportReport(reportKey: string, format: 'csv' | 'xlsx' | 'pdf') {
    const response = await axios.get(`${API_URL}/reports/export/${reportKey}.${format}`, { responseType: 'blob' });
    return response.data as Blob;
  }
};
