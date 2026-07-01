import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const createFormData = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

export const uploadService = {
  async uploadImage(file: File) {
    const response = await axios.post(`${API_URL}/uploads/image`, createFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data as { url: string; filename: string };
  },
  async uploadPdf(file: File) {
    const response = await axios.post(`${API_URL}/uploads/pdf`, createFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data as { url: string; filename: string };
  }
};
