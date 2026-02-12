from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine
from models import Base, Account
from schemas import AccountCreate, AccountResponse, BalanceUpdateRequest
import requests
import random

CUSTOMER_SERVICE_URL = "http://127.0.0.1:8000"

app = FastAPI(title="Account Service")
Base.metadata.create_all(bind=engine)

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
        "service": "account-service",
        "status": "UP"
    }

# -----------------------------
# CREATE ACCOUNT
# -----------------------------
@app.post("/accounts/create", response_model=AccountResponse)
def create_account(data: AccountCreate):
    db = SessionLocal()

    # 🔗 Validate customer
    try:
        resp = requests.get(
            f"{CUSTOMER_SERVICE_URL}/customers/{data.customer_id}/status",
            timeout=5
        )
    except requests.exceptions.RequestException:
        db.close()
        raise HTTPException(status_code=503, detail="Customer service unavailable")

    if resp.status_code != 200:
        db.close()
        raise HTTPException(status_code=400, detail="Customer not found")

    customer = resp.json()

    if customer["status"] != "ACTIVE":
        db.close()
        raise HTTPException(status_code=400, detail="Customer not active")

    if customer["kyc_status"] != "VERIFIED":
        db.close()
        raise HTTPException(status_code=400, detail="KYC not verified")

    # 🔥 Generate system-controlled account_id
    account_id = random.randint(1000000000, 9999999999)

    # ensure uniqueness (rare but safe)
    while db.query(Account).filter(Account.account_id == account_id).first():
        account_id = random.randint(1000000000, 9999999999)

    account = Account(
    account_id=account_id,
    customer_id=data.customer_id,
    branch_id=customer["branch_id"],   # 🔒 LOCKED FROM CUSTOMER SERVICE
    account_type=data.account_type,
    balance=data.balance,
    status="ACTIVE"
)

    db.add(account)
    db.commit()
    db.refresh(account)

    result = account
    db.close()

    return result


# -----------------------------
# GET BALANCE
# -----------------------------
@app.get("/accounts/{account_id}/balance")
def get_balance(account_id: int):
    db = SessionLocal()
    account = db.query(Account).filter(Account.account_id == account_id).first()

    if not account:
        db.close()
        raise HTTPException(status_code=404, detail="Account not found")

    balance = account.balance
    db.close()

    return {"balance": balance}

# -----------------------------
# UPDATE BALANCE (USED BY TRANSACTIONS)
# -----------------------------
@app.post("/accounts/{account_id}/update-balance")
def update_balance(account_id: int, data: BalanceUpdateRequest):
    db = SessionLocal()
    account = db.query(Account).filter(Account.account_id == account_id).first()

    if not account:
        db.close()
        raise HTTPException(status_code=404, detail="Account not found")

    if account.balance + data.amount < 0:
        db.close()
        raise HTTPException(status_code=400, detail="Insufficient funds")

    account.balance += data.amount
    db.commit()
    db.refresh(account)

    new_balance = account.balance
    db.close()

    return {
        "account_id": account_id,
        "new_balance": new_balance
    }

@app.get("/accounts/{account_id}")
def get_account(account_id: int):
    db = SessionLocal()
    account = db.query(Account).filter(
        Account.account_id == account_id
    ).first()

    if not account:
        db.close()
        raise HTTPException(status_code=404, detail="Account not found")

    response = {
        "account_id": account.account_id,
        "customer_id": account.customer_id,   # 🔥 ADD THIS
        "branch_id": account.branch_id,
        "account_type": account.account_type,
        "balance": account.balance,
        "status": account.status
    }

    db.close()
    return response



