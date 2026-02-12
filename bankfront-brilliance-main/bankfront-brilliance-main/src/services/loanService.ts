import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { LoanCreate, LoanResponse, EMIProcessResponse,EMIResult, EMIProcessResult} from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.LOAN_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loanService = {
  // POST /loans/create
  createLoan: async (data: LoanCreate): Promise<LoanResponse> => {
    const response = await api.post('/loans/create', data);
    return response.data;
  },

  // POST /loans/process-emi
processEMI: async (): Promise<EMIProcessResponse> => {
  const response = await api.post('/loans/process-emi');
  const raw = response.data;

  return response.data as EMIProcessResponse;

},

getOverdueEMIs: (minDays: number) =>
  api.get(`/loans/overdue-emis?min_overdue_days=${minDays}`)
     .then(res => res.data),



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
