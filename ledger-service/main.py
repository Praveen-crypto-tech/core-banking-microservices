from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine
from models import Base, LedgerEntry
from schemas import LedgerRequest
from sqlalchemy.orm import Session

app = FastAPI(title="Ledger Service")
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
        "service": "ledger-service",
        "status": "UP"
    }

@app.post("/ledger/record")
def record_ledger(data: LedgerRequest):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    db = SessionLocal()

    try:
        # 🔒 Idempotency check
        existing = db.query(LedgerEntry).filter(
            LedgerEntry.reference_id == data.reference_id
        ).first()

        if existing:
            return {"status": "LEDGER_ALREADY_RECORDED"}

        debit_entry = LedgerEntry(
            reference_id=data.reference_id,
            account_id=data.debit_account_id,
            customer_id=data.debit_customer_id,
            branch_id=data.debit_branch_id,
            entry_type="DEBIT",
            amount=data.amount,
            narration=data.narration
        )

        credit_entry = LedgerEntry(
            reference_id=data.reference_id,
            account_id=data.credit_account_id,
            customer_id=data.credit_customer_id,
            branch_id=data.credit_branch_id,
            entry_type="CREDIT",
            amount=data.amount,
            narration=data.narration
        )

        db.add(debit_entry)
        db.add(credit_entry)
        db.commit()

        # ✅ CAPTURE VALUES WHILE SESSION IS OPEN
        ledger_id = debit_entry.id
        reference_id = data.reference_id
        amount = data.amount
        narration = data.narration

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ledger recording failed")

    finally:
        db.close()

    return {
        "ledger_id": ledger_id,
        "reference_id": reference_id,
        "amount": amount,
        "narration": narration
    }

@app.get("/ledger/last")
def get_last_ledger_entry():
    db = SessionLocal()
    try:
        last_entry = (
            db.query(LedgerEntry)
            .order_by(LedgerEntry.created_at.desc())
            .first()
        )

        if not last_entry:
            return None

        return {
            "ledger_id": last_entry.id,
            "reference_id": last_entry.reference_id,
            "amount": last_entry.amount,
            "narration": last_entry.narration,
        }
    finally:
        db.close()

