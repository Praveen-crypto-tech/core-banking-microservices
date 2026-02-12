import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { CustomerCreate, CustomerResponse, CustomerStatus } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.CUSTOMER_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerService = {
  // POST /customers/create
  createCustomer: async (data: CustomerCreate): Promise<CustomerResponse> => {
    const response = await api.post('/customers/create', data);
    return response.data;
  },

  // GET /customers/{customer_id}
  getCustomer: async (customerId: string): Promise<CustomerResponse> => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },

  // POST /customers/{customer_id}/kyc/verify
  verifyKYC: async (customerId: string): Promise<{ message: string }> => {
    const response = await api.post(`/customers/${customerId}/kyc/verify`);
    return response.data;
  },

  // GET /customers/{customer_id}/status
  getCustomerStatus: async (customerId: string): Promise<CustomerStatus> => {
    const response = await api.get(`/customers/${customerId}/status`);
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
