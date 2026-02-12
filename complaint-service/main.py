from fastapi import FastAPI, HTTPException
from database import engine, SessionLocal
from models import Base, Complaint
from schemas import ComplaintCreate, ComplaintResponse
from datetime import datetime
import requests

FRAUD_SERVICE_URL = "http://127.0.0.1:8007"

app = FastAPI(title="Complaint Service")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "service": "complaint-service",
        "status": "UP"
    }

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# -----------------------------
# CREATE COMPLAINT
# -----------------------------
@app.post("/complaints/create", response_model=ComplaintResponse)
def create_complaint(data: ComplaintCreate):
    db = SessionLocal()
    try:
        complaint = Complaint(
            customer_id=data.customer_id,
            branch_id=data.branch_id,
            account_id=data.account_id,
            transaction_id=data.transaction_id,
            category=data.category,
            description=data.description
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # 🔗 OPTIONAL: Update Fraud Alert if transaction-linked
        if data.transaction_id:
            requests.post(
                f"{FRAUD_SERVICE_URL}/fraud/attach-complaint",
                json={
                    "transaction_id": data.transaction_id,
                    "complaint_id": complaint.complaint_id,
                    "feedback_type": "Customer Complaint"
                },
                timeout=3
            )

        return complaint
    finally:
        db.close()

# -----------------------------
# GET COMPLAINT
# -----------------------------
@app.get("/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int):
    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter(
            Complaint.complaint_id == complaint_id
        ).first()

        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")

        return complaint
    finally:
        db.close()

# -----------------------------
# CLOSE COMPLAINT
# -----------------------------
@app.post("/complaints/{complaint_id}/close")
def close_complaint(complaint_id: int):
    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter(
            Complaint.complaint_id == complaint_id
        ).first()

        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")

        complaint.status = "CLOSED"
        complaint.closed_at = datetime.utcnow()
        db.commit()

        # 🔗 Update Fraud Resolution
        if complaint.transaction_id:
            requests.post(
                f"{FRAUD_SERVICE_URL}/fraud/resolve",
                json={
                    "transaction_id": complaint.transaction_id,
                    "resolution_status": "RESOLVED"
                },
                timeout=3
            )

        return {
            "complaint_id": complaint_id,
            "status": "CLOSED"
        }
    finally:
        db.close()

# -----------------------------
# LIST COMPLAINTS (POWER BI)
# -----------------------------
@app.get("/complaints", response_model=list[ComplaintResponse])
def list_complaints():
    db = SessionLocal()
    try:
        return db.query(Complaint).all()
    finally:
        db.close()
