/// <reference types="vite/client" />
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Transaction } from '../types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.VITE_LOCAL_API_URL || 'http://127.0.0.1:8000/api';
    }
  }
  return (
    import.meta.env.VITE_API_URL || 
    import.meta.env.VITE_API_BASE_URL || 
    'https://api-finagrow.kembangin.online/api'
  );
};

const API_BASE_URL = getApiBaseUrl();

// Create Axios Instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Auth Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fms_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.warn('API Session Expired or Invalid Token.');
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH API SERVICE ---
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/login', credentials);
    return res.data;
  },
  register: async (payload: { name: string; email: string; password: string; phone?: string }) => {
    const res = await api.post('/register', payload);
    return res.data;
  },
  demoLogin: async (role: 'Admin' | 'User' = 'Admin') => {
    const res = await api.post('/demo-login', {
      role: role.toLowerCase(),
      email: role === 'Admin' ? 'demo_admin@fms.com' : 'demo_user@fms.com'
    });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/me');
    return res.data;
  },
  updateProfile: async (profileData: any) => {
    const res = await api.post('/profile', profileData);
    return res.data;
  },
  changePassword: async (passData: { current_password: string; new_password: string; new_password_confirmation: string }) => {
    const res = await api.post('/change-password', passData);
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (_) {}
    localStorage.removeItem('fms_auth_token');
    localStorage.removeItem('fms_active_user_email');
  },
};

// --- TRANSACTIONS API SERVICE ---
export const transactionsApi = {
  getAll: async (params?: { type?: string; category?: string; start_date?: string; end_date?: string }) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get('/transactions/summary');
    return res.data;
  },
  create: async (tx: Partial<Transaction>) => {
    const res = await api.post('/transactions', tx);
    return res.data;
  },
  update: async (id: string, tx: Partial<Transaction>) => {
    const res = await api.put(`/transactions/${id}`, { ...tx, id }, { params: { id } });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/transactions/${id}`, { params: { id }, data: { id } });
    return res.data;
  },
};

// --- ASSETS API SERVICE ---
export const assetsApi = {
  getAll: async () => {
    const res = await api.get('/assets');
    return res.data;
  },
  create: async (assetData: any) => {
    const res = await api.post('/assets', assetData);
    return res.data;
  },
  update: async (id: string, assetData: any) => {
    const res = await api.put(`/assets/${id}`, { ...assetData, id }, { params: { id } });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/assets/${id}`, { params: { id }, data: { id } });
    return res.data;
  },
};

// --- CHART OF ACCOUNTS (COA) API SERVICE ---
export const coaApi = {
  getAll: async () => {
    const res = await api.get('/coa');
    return res.data;
  },
  create: async (accountData: any) => {
    const res = await api.post('/coa', accountData);
    return res.data;
  },
  update: async (id: string, accountData: any) => {
    const res = await api.put(`/coa/${id}`, { ...accountData, id }, { params: { id } });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/coa/${id}`, { params: { id }, data: { id } });
    return res.data;
  },
};

// --- SUBSCRIPTIONS API SERVICE ---
export const subscriptionsApi = {
  getCurrent: async () => {
    const res = await api.get('/subscription/current');
    return res.data;
  },
  upgrade: async (plan: 'Free' | 'Pro' | 'Enterprise' = 'Pro') => {
    const res = await api.post('/subscription/upgrade', { plan });
    return res.data;
  },
  update: async (plan: 'Free' | 'Pro') => {
    const res = await api.post('/subscription', { plan });
    return res.data;
  },
};

// --- USERS / TEAM API SERVICE ---
export const usersApi = {
  getAll: async () => {
    const res = await api.get('/users');
    return res.data;
  },
  create: async (userData: any) => {
    const res = await api.post('/users', userData);
    return res.data;
  },
  update: async (id: string, userData: any) => {
    const res = await api.put(`/users/${id}`, { ...userData, id }, { params: { id } });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/users/${id}`, { params: { id }, data: { id } });
    return res.data;
  },
};

export default api;
