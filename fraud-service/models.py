from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, date

Base = declarative_base()

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, nullable=False)
    branch_id = Column(Integer, nullable=False)
    risk_score = Column(Integer)
    fraud_flag = Column(Integer)
    reason = Column(String(255))
    anomaly = Column(String(50))
    resolution_status = Column(String(20), default="Pending")
    resolution_date = Column(Date)
    feedback_id = Column(Integer)
    feedback_type = Column(String(50))
    feedback_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
