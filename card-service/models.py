from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Card(Base):
    __tablename__ = "cards"

    card_id = Column(Integer, primary_key=True, index=True)

    account_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, nullable=False)   # 🔥 NEW
    branch_id = Column(Integer, nullable=False)     # 🔥 NEW

    card_number = Column(String(16), unique=True, nullable=False)
    card_type = Column(String(20), default="DEBIT")
    status = Column(String(20), default="ACTIVE")

    daily_limit = Column(Float, default=50000)
    daily_used = Column(Float, default=0)

    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
