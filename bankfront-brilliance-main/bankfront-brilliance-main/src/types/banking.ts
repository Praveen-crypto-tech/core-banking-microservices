// ============================================
// CORE BANKING SYSTEM - TYPE DEFINITIONS
// Exact fields as per backend API contracts
// ============================================

// Customer Service Types
export interface CustomerCreate {
  customer_id: string;
  full_name: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  pan: string;
  aadhaar: string;
  branch_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';

  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CustomerResponse  {
  customer_id: string;
  full_name: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  pan: string;
  aadhaar: string;
  branch_id: string;
  risk_level: string;
  kyc_verified?: boolean;
  status?: string;
  created_at?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CustomerStatus {
  customer_id: string;
  status: string;
  kyc_verified: boolean;
}


// Account Service Types
export type AccountType = 'CURRENT' | 'SAVINGS' | 'HIGH-YIELD SAVINGS' | 'MONEY MARKET' | 'CDs';

export interface AccountCreate {
  customer_id: string;
  account_type: AccountType;
  balance: number;
}

export interface AccountResponse {
  account_id: string;
  customer_id: string;
  account_type: string;
  balance: number;
  status?: string;
  created_at?: string;
}

export interface AccountBalance {
  account_id: string;
  balance: number;
}

// Transaction Service Types
export interface TransactionDebit {
  account_id: string;
  amount: number;
  channel: string;
}

export interface TransactionCredit {
  account_id: string;
  amount: number;
  channel: string;
}

export interface TransactionTransfer {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  channel: string;
}

export interface TransactionResponse {
  transaction_id: string;
  account_id?: string;
  from_account_id?: string;
  to_account_id?: string;
  amount: number;
  type: string;
  channel: string;
  status: string;
  timestamp?: string;
}

// Ledger Service Types
export interface LedgerRecord {
  reference_id: string;
  debit_account_id: string;
  credit_account_id: string;
  debit_customer_id: string;
  credit_customer_id: string;
  debit_branch_id: string;
  credit_branch_id: string;
  amount: number;
  narration: string;
}

export interface LedgerResponse {
  ledger_id: string;
  reference_id: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  narration: string;
  timestamp?: string;
  
}

export interface LedgerRecordResponse {
  ledger_id: number;
  reference_id: string;
  amount: number;
  narration: string;
}


// Card Service Types
export interface CardIssue {
  card_id: string;
  account_id: string;
  card_number: string;
  card_type: string;
  status: string;
  daily_limit: number;
  daily_used: number;
  issued_at: string;
}

export interface CardValidate {
  card_id: string;
  card_number: string;
  amount?: number;
}

export interface CardResponse {
  card_id: string;
  account_id: string;
  card_number: string;
  card_type: string;
  status: string;
  daily_limit: number;
  daily_used: number;
  issued_at: string;
}

// Loan Service Types
export interface LoanCreate {
  customer_id: string;
  branch_id: string;
  account_id: string;
  loan_type: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
}

export interface LoanResponse {
  loan_id: number;
  loan_status: string;
  emi_amount: number;
}


export interface EMIResult {
  loan_id: string;
  status: string;
  message?: string;
}

export interface EMIProcessResult {
  loan_id: string;
  status: string;
  message?: string;
}

export interface EMIProcessResponse {
  processed_emis: number;
  details: {
    loan_id: number;
    emi_number: number;
    status: string;
    customer_id?: number;
    due_date?: string;
    emi_amount?: number;

    message?: string;
  }[];
}

export interface OverdueEMI {
  customer_id: number;
  loan_id: number;
  emi_number: number;
  due_date: string;
  emi_amount: number;
  overdue_days: number;
  status: string;
}

export interface OverdueEMIResponse {
  count: number;
  overdues: OverdueEMI[];
}

// Fraud Service Types
export interface FraudCheck {
  transaction_id: number;
  account_id: number;
  branch_id: number; // ✅ REQUIRED
  amount: number;
  channel: string;
}

export interface FraudAlert {
  alert_id: number;
  transaction_id: string;
  branch_id?: string;
  risk_score: number;
  fraud_flag: boolean;
  reason: string;
  anomaly?: string;
  resolution_status?: string;
  resolution_date?: string;
  feedback_id?: string;
  feedback_type?: string;
  feedback_date?: string;
  created_at: string;
}

export interface FraudFeedback {
  alert_id: number;
  feedback_type: string;
  feedback_date: string;
}

// Complaint Service Types
export interface ComplaintCreate {
  customer_id: string;
  branch_id: string;
  account_id: string;
  transaction_id: string;
  category: string;
  description: string;
}

export interface ComplaintResponse {
  complaint_id: string;
  customer_id: string;
  branch_id: string;
  account_id: string;
  transaction_id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  closed_at?: string;
}

// Service Health Types
export interface ServiceHealth {
  service: string;
  status: 'online' | 'offline' | 'degraded';
  latency?: number;
}

// API Error Response
export interface APIError {
  detail: string | ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
