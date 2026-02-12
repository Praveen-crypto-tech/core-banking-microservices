from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Account(Base):
    __tablename__ = "accounts"

    account_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)

    branch_id = Column(Integer, nullable=False)   # 🔥 will control this
    account_type = Column(String(20), nullable=False)
    balance = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="ACTIVE")

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
