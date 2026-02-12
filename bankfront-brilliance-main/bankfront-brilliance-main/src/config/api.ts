// ============================================
// API CONFIGURATION
// Backend service base URLs (LOCKED)
// ============================================

import axios, { AxiosInstance } from "axios";

export const API_CONFIG = {
  CUSTOMER_SERVICE: "http://127.0.0.1:8000",
  ACCOUNT_SERVICE: "http://127.0.0.1:8001",
  TRANSACTION_SERVICE: "http://127.0.0.1:8002",
  LEDGER_SERVICE: "http://127.0.0.1:8003",
  CARD_SERVICE: "http://127.0.0.1:8004",
  COMPLAINT_SERVICE: "http://127.0.0.1:8005",
  LOAN_SERVICE: "http://127.0.0.1:8006",
  FRAUD_SERVICE: "http://127.0.0.1:8007",

   // ✅ ADD THIS LINE ONLY
  API_GATEWAY: "http://127.0.0.1:8080"
} as const;

export type ServiceBaseUrl =
  (typeof API_CONFIG)[keyof typeof API_CONFIG];

export const SERVICE_NAMES: Record<ServiceBaseUrl, string> = {
  [API_CONFIG.CUSTOMER_SERVICE]: "Customer Service",
  [API_CONFIG.ACCOUNT_SERVICE]: "Account Service",
  [API_CONFIG.TRANSACTION_SERVICE]: "Transaction Service",
  [API_CONFIG.LEDGER_SERVICE]: "Ledger Service",
  [API_CONFIG.CARD_SERVICE]: "Card Service",
  [API_CONFIG.COMPLAINT_SERVICE]: "Complaint Service",
  [API_CONFIG.LOAN_SERVICE]: "Loan Service",
  [API_CONFIG.FRAUD_SERVICE]: "Fraud Service",
  [API_CONFIG.API_GATEWAY]: "API Gateway"
};

// ============================================
// Shared Axios Factory (Frontend-side only)
// ============================================

export const createApiClient = (baseURL: ServiceBaseUrl): AxiosInstance => {
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    // IMPORTANT:
    // We do NOT add withCredentials or CORS headers here.
    // Backend is locked. Any CORS workaround will be handled separately.
  });
};
