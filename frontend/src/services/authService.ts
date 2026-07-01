import axios from 'axios';
import { authStorage } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, payload);
    const data = response.data as LoginResponse;
    authStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = authStorage.getRefreshToken();

    try {
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    } finally {
      authStorage.clear();
    }
  }
};
