import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { AccountCreate, AccountResponse, AccountBalance } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.ACCOUNT_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const accountService = {
  // POST /accounts/create
  createAccount: async (data: AccountCreate): Promise<AccountResponse> => {
    const response = await api.post('/accounts/create', data);
    return response.data;
  },

  // GET /accounts/{account_id}
  getAccount: async (accountId: string): Promise<AccountResponse> => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data;
  },

  // GET /accounts/{account_id}/balance
  getBalance: async (accountId: string): Promise<AccountBalance> => {
    const response = await api.get(`/accounts/${accountId}/balance`);
    return response.data;
  },

  // POST /accounts/{account_id}/update-balance
  updateBalance: async (accountId: string, amount: number): Promise<AccountResponse> => {
    const response = await api.post(`/accounts/${accountId}/update-balance`, { amount });
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      await api.get('/');
      return true;
    } catch {
      return false;
    }
  },
};
