import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { CardIssue, CardValidate, CardResponse } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.CARD_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cardService = {
  // POST /cards/issue
  issueCard: async (data: CardIssue): Promise<CardResponse> => {
    const response = await api.post('/cards/issue', data);
    return response.data;
  },

  // POST /cards/validate
  validateCard: async (data: CardValidate): Promise<{ valid: boolean; message: string }> => {
    const response = await api.post('/cards/validate', data);
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
