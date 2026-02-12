import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { TransactionDebit, TransactionCredit, TransactionTransfer, TransactionResponse } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.TRANSACTION_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const transactionService = {
  // POST /transactions/debit
  debit: async (data: TransactionDebit): Promise<TransactionResponse> => {
    const response = await api.post('/transactions/debit', data);
    return response.data;
  },

  // POST /transactions/credit
  credit: async (data: TransactionCredit): Promise<TransactionResponse> => {
    const response = await api.post('/transactions/credit', data);
    return response.data;
  },

  // POST /transactions/transfer
  transfer: async (data: TransactionTransfer): Promise<TransactionResponse> => {
    const response = await api.post('/transactions/transfer', data);
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
