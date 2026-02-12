from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine
from models import Base, FraudAlert
from schemas import FraudCheckRequest, FraudCheckResponse,FraudFeedbackRequest, FraudFeedbackResponse
from datetime import datetime

app = FastAPI(title="Fraud Detection Service")
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost",
        "http://127.0.0.1"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "service": "fraud-service",
        "status": "UP"
    }


@app.post("/fraud/check", response_model=FraudCheckResponse)
def fraud_check(data: FraudCheckRequest):
    db = SessionLocal()

    risk_score = 10
    fraud_flag = False
    reason = "Normal transaction"
    anomaly = "None"

    # Rule 1: Very high amount irrespective of channel (critical risk)
    if data.amount >= 1000000:
        risk_score = max(risk_score, 98)
        fraud_flag = True
        reason = "Very high transaction amount"
        anomaly = "VERY_HIGH_AMOUNT"

    # Rule 2: High value UPI (UPI has strict RBI limits in real banks)
    elif data.channel == "UPI" and data.amount > 100000:
        risk_score = max(risk_score, 85)
        fraud_flag = True
        reason = "UPI transaction exceeding normal limits"
        anomaly = "UPI_LIMIT_BREACH"

    # Rule 3: Large CARD transaction (card fraud is statistically common)
    elif data.channel == "CARD" and data.amount > 150000:
        risk_score = max(risk_score, 75)
        fraud_flag = True
        reason = "High value card transaction"
        anomaly = "CARD_HIGH_VALUE"

    # Rule 4: ATM withdrawal beyond safe threshold
    elif data.channel == "ATM" and data.amount > 50000:
        risk_score = max(risk_score, 80)
        fraud_flag = True
        reason = "Unusually large ATM withdrawal"
        anomaly = "ATM_HIGH_WITHDRAWAL"

    # Rule 5: Medium-high amount from non-home / unusual branch
    elif data.amount > 300000 and data.branch_id > 50:
        risk_score = max(risk_score, 70)
        fraud_flag = True
        reason = "High value transaction from uncommon branch"
        anomaly = "UNUSUAL_BRANCH_HIGH_VALUE"

    # Rule 6: Moderate amount but risky digital channel
    elif data.channel in ["UPI", "CARD"] and data.amount > 75000:
        risk_score = max(risk_score, 60)
        reason = "Moderately high digital transaction"
        anomaly = "DIGITAL_CHANNEL_RISK"

    # Rule 7: Cross-branch anomaly (large branch ID space = 145 branches)
    elif data.amount > 200000 and data.branch_id > 100:
        risk_score = max(risk_score, 65)
        fraud_flag = True
        reason = "Large transaction from far-mapped branch"
        anomaly = "BRANCH_DISTANCE_RISK"

    # Rule 8: ATM usage for non-typical high amount
    elif data.channel == "ATM" and data.amount > 30000:
        risk_score = max(risk_score, 55)
        reason = "ATM usage approaching risky threshold"
        anomaly = "ATM_BEHAVIOR_RISK"

    # Rule 9: General high-value transaction monitoring
    elif data.amount > 250000:
        risk_score = max(risk_score, 72)
        reason = "High value transaction under monitoring"
        anomaly = "HIGH_VALUE_MONITOR"


    risk_score = min(risk_score, 100)

    alert = FraudAlert(
        transaction_id=data.transaction_id,
        branch_id=data.branch_id,
        risk_score=risk_score,
        fraud_flag=fraud_flag,
        reason=reason,
        anomaly=anomaly
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)   # ✅ REQUIRED to get alert.id

    return {
    "alert_id": alert.alert_id,
    "transaction_id": data.transaction_id,
    "fraud_flag": fraud_flag,
    "risk_score": risk_score,
    "reason": reason,
    "anomaly": anomaly,
    "resolution_status": alert.resolution_status
}

@app.post("/fraud/attach-feedback")
def attach_feedback(data: FraudFeedbackRequest):
    db = SessionLocal()

    alert = db.query(FraudAlert).filter(
        FraudAlert.alert_id == data.alert_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Fraud alert not found")

    alert.feedback_type = data.feedback_type
    alert.feedback_date = data.feedback_date
    alert.resolution_status = "RESOLVED"
    alert.resolution_date = datetime.utcnow()

    db.commit()
    db.refresh(alert)
    db.close()

    return {
        "status": "feedback_attached",
        "alert_id": alert.alert_id,
        "resolution_status": alert.resolution_status
    }


