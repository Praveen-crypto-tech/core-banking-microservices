from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class FraudCheckRequest(BaseModel):
    transaction_id: int
    account_id: int
    branch_id: int   # ← REQUIRED
    amount: float
    channel: str


class FraudCheckResponse(BaseModel):
    alert_id: int
    transaction_id: int
    fraud_flag: bool
    risk_score: int
    reason: str
    anomaly: str
    resolution_status: str

class FraudFeedbackRequest(BaseModel):
    alert_id: int
    feedback_type: str
    feedback_date: str

class FraudFeedbackResponse(BaseModel):
    status: str
    alert_id: int
    resolution_status: str