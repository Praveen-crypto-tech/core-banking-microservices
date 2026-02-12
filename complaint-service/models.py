from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, nullable=False)
    branch_id = Column(Integer, nullable=False)   # 🔥 REQUIRED

    account_id = Column(Integer, nullable=True)
    transaction_id = Column(Integer, nullable=True)

    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)

    status = Column(String(20), default="OPEN")   # OPEN / CLOSED

    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
