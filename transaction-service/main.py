from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine
from models import Base, Transaction
from schemas import (
    DebitRequest,
    CreditRequest,
    TransferRequest,
    TransactionResponse
)
import requests

ACCOUNT_SERVICE_URL = "http://127.0.0.1:8001"
LEDGER_SERVICE_URL = "http://127.0.0.1:8003"
FRAUD_SERVICE_URL = "http://127.0.0.1:8007"

app = FastAPI(title="Transaction Service")
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
        "service": "transaction-service",
        "status": "UP"
    }

# -------------------------------------------------
# INTERNAL HELPER — FETCH ACCOUNT + BRANCH
# -------------------------------------------------
def get_account_and_branch(account_id: int):
    acc = requests.get(
        f"{ACCOUNT_SERVICE_URL}/accounts/{account_id}",
        timeout=5
    )
    if acc.status_code != 200:
        raise HTTPException(status_code=404, detail="Account not found")
    return acc.json()

def send_to_fraud_service(txn_id, amount, channel, branch_id):
    try:
        requests.post(
            f"{FRAUD_SERVICE_URL}/fraud/check",
            json={
                "transaction_id": txn_id,
                "amount": amount,
                "channel": channel,
                "branch_id": branch_id
            },
            timeout=3
        )
    except requests.exceptions.RequestException:
        # Fraud service failure should NEVER break transactions
        pass

# -------------------------------------------------
# DEBIT
# -------------------------------------------------
@app.post("/transactions/debit", response_model=TransactionResponse)
def debit_account(data: DebitRequest):
    db = SessionLocal()
    channel = data.channel or "SYSTEM"

    account = get_account_and_branch(data.account_id)

    if account["balance"] < data.amount:
        db.close()
        raise HTTPException(status_code=400, detail="Insufficient balance")

    txn = Transaction(
    account_id=data.account_id,
    customer_id=account["customer_id"],   # 🔥 ADD
    branch_id=account["branch_id"],
    amount=data.amount,
    transaction_type="DEBIT",
    channel=channel,
    status="INITIATED"
)

    db.add(txn)
    db.commit()
    db.refresh(txn)

    debit = requests.post(
        f"{ACCOUNT_SERVICE_URL}/accounts/{data.account_id}/update-balance",
        json={"amount": -data.amount},
        timeout=5
    )

    if debit.status_code != 200:
        txn.status = "FAILED"
        db.commit()
        db.close()
        raise HTTPException(status_code=500, detail="Debit failed")

    txn.status = "COMPLETED"
    db.commit()
    db.refresh(txn)

    send_to_fraud_service(
        txn_id=txn.transaction_id,
        amount=data.amount,
        channel=channel,
        branch_id=account["branch_id"]
    )

    db.close()
    return txn



# -------------------------------------------------
# CREDIT
# -------------------------------------------------
@app.post("/transactions/credit", response_model=TransactionResponse)
def credit_account(data: CreditRequest):
    db = SessionLocal()
    channel = data.channel or "SYSTEM"

    account = get_account_and_branch(data.account_id)

    txn = Transaction(
    account_id=data.account_id,
    customer_id=account["customer_id"],   # 🔥 ADD
    branch_id=account["branch_id"],
    amount=data.amount,
    transaction_type="CREDIT",
    channel=channel,
    status="INITIATED"
)


    db.add(txn)
    db.commit()
    db.refresh(txn)

    credit = requests.post(
        f"{ACCOUNT_SERVICE_URL}/accounts/{data.account_id}/update-balance",
        json={"amount": data.amount},
        timeout=5
    )

    if credit.status_code != 200:
        txn.status = "FAILED"
        db.commit()
        db.close()
        raise HTTPException(status_code=400, detail="Credit failed")

    txn.status = "COMPLETED"
    db.commit()
    db.refresh(txn)

    send_to_fraud_service(
        txn_id=txn.transaction_id,
        amount=data.amount,
        channel=channel,
        branch_id=account["branch_id"]
    )

    db.close()
    return txn



# -------------------------------------------------
# TRANSFER
# -------------------------------------------------
@app.post("/transactions/transfer", response_model=TransactionResponse)
def transfer_money(data: TransferRequest):
    db = SessionLocal()
    channel = data.channel or "SYSTEM"

    sender = get_account_and_branch(data.from_account_id)
    receiver = get_account_and_branch(data.to_account_id)

    if sender["balance"] < data.amount:
        db.close()
        raise HTTPException(status_code=400, detail="Insufficient balance")

    txn = Transaction(
    account_id=data.from_account_id,
    customer_id=sender["customer_id"],   # 🔥 FIXED
    branch_id=sender["branch_id"],        # 🔥 FIXED
    amount=data.amount,
    transaction_type="TRANSFER",
    channel=channel,
    status="INITIATED"
)


    db.add(txn)
    db.commit()
    db.refresh(txn)

    # Debit sender
    debit = requests.post(
        f"{ACCOUNT_SERVICE_URL}/accounts/{data.from_account_id}/update-balance",
        json={"amount": -data.amount},
        timeout=5
    )

    if debit.status_code != 200:
        txn.status = "FAILED"
        db.commit()
        db.close()
        raise HTTPException(status_code=400, detail="Debit failed")

    # Credit receiver
    credit = requests.post(
        f"{ACCOUNT_SERVICE_URL}/accounts/{data.to_account_id}/update-balance",
        json={"amount": data.amount},
        timeout=5
    )

    if credit.status_code != 200:
        # rollback sender
        requests.post(
            f"{ACCOUNT_SERVICE_URL}/accounts/{data.from_account_id}/update-balance",
            json={"amount": data.amount},
            timeout=5
        )
        txn.status = "REVERSED"
        db.commit()
        db.close()
        raise HTTPException(status_code=400, detail="Credit failed, reversed")

    txn.status = "COMPLETED"
    db.commit()
    db.refresh(txn)

    send_to_fraud_service(
        txn_id=txn.transaction_id,
        amount=data.amount,
        channel=channel,
        branch_id=sender["branch_id"]
    )

    db.close()
    return txn

