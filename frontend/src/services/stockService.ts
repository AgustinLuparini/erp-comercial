import axios from 'axios';

export const stockService = {
  async getStock(params: Record<string, unknown> = {}) {
    const response = await axios.get('/stock', { params });
    return response.data;
  },
  async getAlerts() {
    const response = await axios.get('/stock/alerts');
    return response.data;
  },
  async getHistory(productId: string) {
    const response = await axios.get(`/stock/${productId}/history`);
    return response.data;
  },
  async movement(data: Record<string, unknown>) {
    const response = await axios.post('/stock/movements', data);
    return response.data;
  },
  async transfer(data: Record<string, unknown>) {
    const response = await axios.post('/stock/transfers', data);
    return response.data;
  },
  async adjust(data: Record<string, unknown>) {
    const response = await axios.post('/stock/adjustments', data);
    return response.data;
  }
};