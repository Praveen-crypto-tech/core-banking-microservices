from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean
from database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    dob = Column(Date)
    gender = Column(String)
    mobile = Column(String, unique=True)
    email = Column(String, unique=True)
    pan = Column(String, unique=True)
    aadhaar = Column(String, unique=True)
    branch_id = Column(Integer)
    risk_level = Column(String, default="LOW")
    kyc_status = Column(String(20), default="PENDING")
    status = Column(String, default="ACTIVE")

    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    pincode = Column(String)
    country = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
