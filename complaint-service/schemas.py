from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ComplaintCreate(BaseModel):
    customer_id: int
    branch_id: int               # 🔥 REQUIRED
    account_id: Optional[int] = None
    transaction_id: Optional[int] = None
    category: str
    description: str

class ComplaintResponse(BaseModel):
    complaint_id: int
    customer_id: int
    branch_id: int
    account_id: Optional[int]
    transaction_id: Optional[int]
    category: str
    description: str
    status: str
    created_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True
