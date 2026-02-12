from pydantic import BaseModel
from datetime import datetime

class AccountCreate(BaseModel):
    customer_id: int
    account_type: str
    balance: float


class AccountResponse(BaseModel):
    account_id: int
    customer_id: int
    branch_id: int
    account_type: str
    balance: float
    status: str
    created_at: datetime   # ✅ FIXED

    class Config:
        from_attributes = True   # Pydantic v2
        

class BalanceUpdateRequest(BaseModel):
    amount: float
