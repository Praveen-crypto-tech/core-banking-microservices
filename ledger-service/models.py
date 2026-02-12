from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)

    reference_id = Column(Integer, nullable=False, index=True)

    account_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, nullable=False)   # 🔥 NEW
    branch_id = Column(Integer, nullable=False)     # 🔥 NEW

    entry_type = Column(String(10), nullable=False) # DEBIT / CREDIT
    amount = Column(Float, nullable=False)

    narration = Column(String(255), nullable=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
