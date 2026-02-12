from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class CustomerCreate(BaseModel):
    customer_id: int
    full_name: str
    dob: date
    gender: str
    mobile: str
    email: str
    pan: str
    aadhaar: str
    branch_id: int                     
    risk_level: Optional[str] = "LOW"  

    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str

class CustomerResponse(BaseModel):
    customer_id: int
    full_name: str
    dob: date
    gender: str
    mobile: str
    email: str
    pan: str
    aadhaar: str
    branch_id: int
    risk_level: str
    status: str
    created_at: datetime

    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    pincode: str
    country: str

    class Config:
        orm_mode = True

