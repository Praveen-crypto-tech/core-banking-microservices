import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { ComplaintCreate, ComplaintResponse } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.COMPLAINT_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const complaintService = {
  // POST /complaints/create
  createComplaint: async (data: ComplaintCreate): Promise<ComplaintResponse> => {
    const response = await api.post('/complaints/create', data);
    return response.data;
  },

  // GET /complaints/{complaint_id}
  getComplaint: async (complaintId: string): Promise<ComplaintResponse> => {
    const response = await api.get(`/complaints/${complaintId}`);
    return response.data;
  },

  // POST /complaints/{complaint_id}/close
  closeComplaint: async (complaintId: string): Promise<{ message: string }> => {
    const response = await api.post(`/complaints/${complaintId}/close`);
    return response.data;
  },

  // GET /complaints
  listComplaints: async (): Promise<ComplaintResponse[]> => {
    const response = await api.get('/complaints');
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
