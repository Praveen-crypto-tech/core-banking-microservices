from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, nullable=False)   # 🔥 NEW
    branch_id = Column(Integer, nullable=False)

    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False)
    channel = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

