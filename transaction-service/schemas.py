from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DebitRequest(BaseModel):
    account_id: int
    amount: float
    channel: Optional[str] = "SYSTEM"


class CreditRequest(BaseModel):
    account_id: int
    amount: float
    channel: Optional[str] = "SYSTEM"


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    channel: Optional[str] = "SYSTEM"


class TransactionResponse(BaseModel):
    transaction_id: int
    account_id: int
    customer_id: int       # 🔥 ADD
    branch_id: int
    amount: float
    transaction_type: str
    channel: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

