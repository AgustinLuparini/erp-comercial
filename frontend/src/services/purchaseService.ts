import axios from 'axios';

export const purchaseService = {
  async getPurchases(params: Record<string, unknown> = {}) {
    const response = await axios.get('/purchases', { params });
    return response.data;
  },
  async createPurchase(data: Record<string, unknown>) {
    const response = await axios.post('/purchases', data);
    return response.data;
  },
  async receivePurchase(data: Record<string, unknown>) {
    const response = await axios.post('/purchases/receive', data);
    return response.data;
  },
  async completeReceive(id: string, userId?: string) {
    const response = await axios.post(`/purchases/${id}/receive-complete`, { userId });
    return response.data;
  },
  async getPurchasePdf(id: string) {
    const response = await axios.get(`/purchases/${id}/pdf`, { responseType: 'blob' });
    return response.data as Blob;
  }
};