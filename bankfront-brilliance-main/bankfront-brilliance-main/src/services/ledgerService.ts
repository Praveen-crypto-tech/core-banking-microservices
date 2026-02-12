import axios from 'axios';
import { API_CONFIG } from '@/config/api';
import type { LedgerRecord, LedgerResponse } from '@/types/banking';

const api = axios.create({
  baseURL: API_CONFIG.LEDGER_SERVICE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ledgerService = {
  // POST /ledger/record
  recordLedger: async (payload) => {
    const response = await api.post('/ledger/record', payload);

    return {
  ledger_id: response.data.ledger_id,   // 🔥 FIX
  reference_id: response.data.reference_id,
  amount: response.data.amount,
  narration: response.data.narration,
};

  },

  // GET /ledger/last
  getLastLedger: async () => {
    const response = await api.get('/ledger/last');
    return response.data;
  },
};

