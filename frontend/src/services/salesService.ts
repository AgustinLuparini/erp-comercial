import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  saleUnit?: 'UNIDAD' | 'GR';
}

export interface ConfirmSalePayload {
  customerId?: string;
  saleType: 'FAC' | 'REMITO' | 'TICKET' | 'PRESUPUESTO';
  paymentMethod: 'CASH' | 'TRANSFER' | 'QR' | 'DEBIT' | 'CREDIT' | 'ACCOUNT';
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  items: SaleItem[];
  allowPriceOverride?: boolean;
}

export const salesService = {
  async confirmSale(data: ConfirmSalePayload) {
    const response = await axios.post(`${API_URL}/sales/confirm`, data);
    return response.data.data;
  },
  async getSales(params: Record<string, unknown> = {}) {
    const response = await axios.get(`${API_URL}/sales`, { params });
    return response.data.data;
  },
  async getTicket(saleId: string) {
    const response = await axios.get(`${API_URL}/sales/${saleId}/ticket`, { responseType: 'text' });
    return response.data as string;
  },
  async downloadTicketPdf(saleId: string) {
    const response = await axios.get(`${API_URL}/sales/${saleId}/ticket.pdf`, {
      responseType: 'blob'
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiMatch = disposition?.match(/filename="?([^";]+)"?/i);
    const fileName = utf8Match?.[1] ? decodeURIComponent(utf8Match[1]) : asciiMatch?.[1] || `Ticket-${saleId}.pdf`;

    return {
      blob: response.data as Blob,
      fileName
    };
  }
};
