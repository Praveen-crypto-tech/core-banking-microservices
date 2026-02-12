import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { FraudCheck, FraudAlert, FraudFeedback } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.FRAUD_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fraudService = {
  // GET / (health)
  health: async (): Promise<{ status: string }> => {
    const response = await api.get('/');
    return response.data;
  },

  // POST /fraud/check
  checkFraud: async (data: FraudCheck): Promise<FraudAlert> => {
    const response = await api.post('/fraud/check', data);
    return response.data;
  },

  // POST /fraud/attach-feedback
  attachFeedback: async (data: FraudFeedback): Promise<{ message: string }> => {
    const response = await api.post('/fraud/attach-feedback', data);
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
