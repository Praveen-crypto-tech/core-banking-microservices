from fastapi import FastAPI, HTTPException
from database import engine, SessionLocal
from models import Base, Customer
from schemas import CustomerCreate, CustomerResponse
from sqlalchemy.exc import IntegrityError
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Customer Service (CIF)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {
        "service": "customer-service",
        "status": "UP"
    }


# -----------------------------
# CREATE CUSTOMER
# -----------------------------
@app.post("/customers/create", response_model=CustomerResponse)
def create_customer(data: CustomerCreate):
    db = SessionLocal()

    customer_data = data.dict()
    customer_data.setdefault("risk_level", "LOW")

    customer = Customer(**customer_data)

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)

        result = customer

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Customer with same mobile/email/pan/aadhaar already exists"
        )
    finally:
        db.close()

    return result


# -----------------------------
# GET CUSTOMER (UI / BI)
# -----------------------------
@app.get("/customers/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int):
    db = SessionLocal()
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not customer:
        db.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    response = {
        "customer_id": customer.customer_id,
        "full_name": customer.full_name,
        "dob": customer.dob,
        "gender": customer.gender,
        "mobile": customer.mobile,
        "email": customer.email,
        "pan": customer.pan,
        "aadhaar": customer.aadhaar,
        "branch_id": customer.branch_id,
        "risk_level": customer.risk_level,
        "status": customer.status,
        "created_at": customer.created_at,

        # ✅ Address — ALWAYS PRESENT
        "address_line1": customer.address_line1 or "",
        "address_line2": customer.address_line2 or "",
        "city": customer.city or "",
        "state": customer.state or "",
        "pincode": customer.pincode or "",
        "country": customer.country or "",

        # ✅ REQUIRED FIELD
        "kyc_verified": customer.kyc_status == "VERIFIED"
    }

    db.close()
    return response


# -----------------------------
# VERIFY KYC
# -----------------------------
@app.post("/customers/{customer_id}/kyc/verify")
def verify_kyc(customer_id: int):
    db = SessionLocal()
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not customer:
        db.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.kyc_status = "VERIFIED"

    # 🔥 banking-realistic improvement
    if customer.risk_level == "HIGH":
        customer.risk_level = "MEDIUM"

    db.commit()
    db.close()

    return {"status": "KYC VERIFIED"}


# -----------------------------
# CUSTOMER STATUS (CRITICAL FOR OTHER SERVICES)
# -----------------------------
@app.get("/customers/{customer_id}/status")
def get_customer_status(customer_id: int):
    db = SessionLocal()
    customer = db.query(Customer).filter(
        Customer.customer_id == customer_id
    ).first()

    if not customer:
        db.close()
        raise HTTPException(status_code=404, detail="Customer not found")

    response = {
        "customer_id": customer.customer_id,
        "kyc_status": customer.kyc_status,
        "status": customer.status,
        "branch_id": customer.branch_id,
        "risk_level": customer.risk_level
    }

    db.close()
    return response


