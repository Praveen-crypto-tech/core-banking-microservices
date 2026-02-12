from fastapi import FastAPI, HTTPException, Query, Depends
from datetime import date, timedelta
from database import engine, SessionLocal, get_db
from models import Base, Loan, EMISchedule
from schemas import LoanCreate, LoanResponse, EMIProcessResponse
from math import pow
import requests
from decimal import Decimal
from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

TRANSACTION_SERVICE_URL = "http://127.0.0.1:8002"

app = FastAPI(title="Loan Management Service")
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_emi(P, R, N):
    r = R / (12 * 100)
    return round(P * r * pow(1 + r, N) / (pow(1 + r, N) - 1), 2)

@app.get("/health")
def health_check():
    return {"service": "loan-service", "status": "UP"}

# -------------------------------
# CREATE LOAN
# -------------------------------
@app.post("/loans/create", response_model=LoanResponse)
def create_loan(data: LoanCreate):
    db = SessionLocal()

    emi = calculate_emi(
        data.principal_amount,
        data.interest_rate,
        data.tenure_months
    )

    end_date = data.start_date + relativedelta(months=data.tenure_months)

    loan = Loan(
    customer_id=data.customer_id,
    branch_id=data.branch_id,
    account_id=data.account_id,
    loan_type=data.loan_type,
    principal_amount=data.principal_amount,
    interest_rate=data.interest_rate,
    tenure_months=data.tenure_months,
    emi_amount=emi,
    loan_status="ACTIVE",
    start_date=data.start_date,
    end_date=data.start_date + timedelta(days=30 * data.tenure_months)
)

    db.add(loan)
    db.commit()
    db.refresh(loan)

    loan_id = loan.loan_id  # capture safely   

    outstanding = float(data.principal_amount)

    for i in range(1, data.tenure_months + 1):
        interest = round(outstanding * (data.interest_rate / (12 * 100)), 2)
        principal = round(emi - interest, 2)
        outstanding -= principal

        emi_row = EMISchedule(
            loan_id=loan.loan_id,
            emi_number=i,
            due_date=data.start_date + relativedelta(months=i),
            emi_amount=emi,
            principal_component=principal,
            interest_component=interest,
            status="PENDING"
        )
        db.add(emi_row)

    db.commit()
    db.close()

    return {
    "loan_id": loan_id,
    "loan_status": loan.loan_status,
    "emi_amount": float(loan.emi_amount)
}



# -------------------------------
# PROCESS EMI (AUTO-DEBIT)
# -------------------------------
@app.post("/loans/process-emi", response_model=EMIProcessResponse)
def process_emi():
    db = SessionLocal()
    today = date.today()

    emis = db.query(EMISchedule).filter(
        EMISchedule.due_date <= today,
        EMISchedule.status == "PENDING"
    ).all()

    results = []

    for emi in emis:
        loan = db.query(Loan).filter(
            Loan.loan_id == emi.loan_id
        ).first()

        resp = requests.post(
            f"{TRANSACTION_SERVICE_URL}/transactions/debit",
            json={
                "account_id": loan.account_id,
                "amount": float(emi.emi_amount),
                "channel": "EMI_AUTO"
            },
            timeout=5
        )

        if resp.status_code == 200:
            emi.status = "PAID"
            emi.paid_date = today
            emi.overdue_days = 0
            emi.penalty_amount = 0

            results.append({
                "loan_id": loan.loan_id,
                "emi_number": emi.emi_number,
                "status": "PAID"
            })
        else:
            overdue_days = (today - emi.due_date).days
            daily_penalty_rate = Decimal("0.02") / Decimal("30")
            penalty = (emi.emi_amount * daily_penalty_rate * Decimal(overdue_days)).quantize(Decimal("0.01"))
            emi.status = "OVERDUE"
            emi.overdue_days = overdue_days
            emi.penalty_amount = penalty
            loan.loan_status = "OVERDUE"

            results.append({
        "loan_id": loan.loan_id,
        "emi_number": emi.emi_number,
        "status": "OVERDUE",
        "customer_id": loan.customer_id,
        "due_date": emi.due_date,
        "emi_amount": float(emi.emi_amount)
    })

        db.commit()

    db.close()
    return {
        "processed_emis": len(results),
        "details": results
    }

@app.get("/loans/overdue-emis")
def get_overdue_emis(
    min_overdue_days: int = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    today = date.today()

    overdue_emis = (
        db.query(EMISchedule, Loan)
        .join(Loan, EMISchedule.loan_id == Loan.loan_id)
        .filter(
            EMISchedule.status != "PAID",
            EMISchedule.due_date < today
        )
        .all()
    )

    results = []

    for emi, loan in overdue_emis:
        overdue_days = (today - emi.due_date).days

        if overdue_days < min_overdue_days:
            continue

        results.append({
            "customer_id": loan.customer_id,
            "loan_id": loan.loan_id,
            "emi_number": emi.emi_number,
            "due_date": emi.due_date,
            "emi_amount": float(emi.emi_amount),
            "overdue_days": overdue_days,
            "status": "OVERDUE"
        })

    return {
        "count": len(results),
        "overdues": results
    }

