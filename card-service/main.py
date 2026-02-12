from fastapi import FastAPI, HTTPException
from database import SessionLocal, engine
from models import Base, Card
from schemas import CardCreate, CardValidateRequest, CardResponse
import random
import requests

ACCOUNT_SERVICE_URL = "http://127.0.0.1:8001"
TRANSACTION_SERVICE_URL = "http://127.0.0.1:8002"

app = FastAPI(title="Card Service")
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_card_number():
    return "".join(str(random.randint(0, 9)) for _ in range(16))


def get_account_details(account_id: int):
    resp = requests.get(
        f"{ACCOUNT_SERVICE_URL}/accounts/{account_id}",
        timeout=5
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid account")
    return resp.json()

@app.get("/health")
def health_check():
    return {
        "service": "card-service",
        "status": "UP"
    }

# ------------------------------------------------
# ISSUE CARD
# ------------------------------------------------
@app.post("/cards/issue", response_model=CardResponse)
def issue_card(data: CardCreate):
    db = SessionLocal()

    account = get_account_details(data.account_id)

    card = Card(
        account_id=data.account_id,
        customer_id=account["customer_id"],   # 🔥 FIX
        branch_id=account["branch_id"],        # 🔥 FIX
        card_number=generate_card_number(),
        daily_limit=data.daily_limit
    )

    db.add(card)
    db.commit()
    db.refresh(card)
    db.close()

    return card


# ------------------------------------------------
# VALIDATE CARD (REAL-TIME CONTROL)
# ------------------------------------------------
@app.post("/cards/validate")
def validate_card(data: CardValidateRequest):
    db = SessionLocal()

    card = db.query(Card).filter(
        Card.card_number == data.card_number
    ).first()

    if not card:
        db.close()
        raise HTTPException(status_code=404, detail="Card not found")

    if card.status != "ACTIVE":
        db.close()
        raise HTTPException(status_code=400, detail="Card blocked")

    if card.daily_used + data.amount > card.daily_limit:
        db.close()
        raise HTTPException(status_code=400, detail="Daily limit exceeded")

    txn = requests.post(
        f"{TRANSACTION_SERVICE_URL}/transactions/debit",
        json={
            "account_id": card.account_id,
            "amount": data.amount,
            "channel": "CARD"
        },
        timeout=5
    )

    if txn.status_code != 200:
        db.close()
        raise HTTPException(status_code=400, detail="Transaction failed")

    # 🔒 Persist daily usage
    card.daily_used += data.amount
    available_limit = card.daily_limit - card.daily_used

    db.commit()
    db.close()

    return {
        "status": "APPROVED",
        "available_limit": available_limit,
        "transaction": txn.json()
    }
