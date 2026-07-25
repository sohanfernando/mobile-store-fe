import axios from "axios";
import type { ApiResponse } from "../types/product";
import type { LoginResponse } from "../types/auth";

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authApi = {
  login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return api.post('/auth/login', { email, password }).then(res => res.data);
  },

  sendOtp(email: string): Promise<ApiResponse<{ otp: string; email: string }>> {
    return api.post('/auth/send-otp', { email }).then(res => res.data);
  },

  logout(): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('admin-token');
    return api.post('/auth/logout', null, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => res.data);
  }
};
