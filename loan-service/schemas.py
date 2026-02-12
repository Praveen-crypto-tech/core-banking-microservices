from pydantic import BaseModel
from typing import List
from datetime import date

class LoanCreate(BaseModel):
    customer_id: int
    branch_id: int
    account_id: int
    loan_type: str
    principal_amount: float
    interest_rate: float
    tenure_months: int
    start_date: date

class LoanResponse(BaseModel):
    loan_id: int
    loan_status: str
    emi_amount: float


class EMIResult(BaseModel):
    loan_id: int
    customer_id: int | None = None
    emi_number: int
    status: str
    due_date: date | None = None
    emi_amount: float | None = None

class EMIProcessResponse(BaseModel):
    processed_emis: int
    details: List[EMIResult]


